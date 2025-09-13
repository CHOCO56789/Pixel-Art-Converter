#!/usr/bin/env python3
import argparse
import os
import re
import math
from typing import Tuple, Optional, Iterable, List

try:
    from PIL import Image, ImageStat, ImageFilter
except Exception as e:  # pragma: no cover
    raise SystemExit("Pillow (PIL) is required. Install with: pip install Pillow") from e


def parse_spec(spec: str) -> Tuple[int, int, int, int]:
    """Parse spec into (grid_w, grid_h, cell_w, cell_h).

    Accepted formats:
      - 'N'            -> N x N (no upscale, 1:1 pixels)
      - 'WxH'         -> W x H (no upscale, 1:1 pixels)
      - 'WxHxCxC'     -> grid and cell sizes (upscale to W*C x H*C)
    """
    tokens = [t for t in re.split(r"[xX]", spec.strip()) if t != ""]
    if not tokens or not all(tok.isdigit() for tok in tokens):
        raise ValueError(
            "Spec must be one of: 'N', 'WxH', or 'WxHxCxC' (e.g., 16, 32x32, 16x16x32x32)"
        )
    nums = list(map(int, tokens))
    if len(nums) == 1:
        n = nums[0]
        if n <= 0:
            raise ValueError("Spec values must be positive integers")
        return n, n, 1, 1
    if len(nums) == 2:
        gw, gh = nums
        if gw <= 0 or gh <= 0:
            raise ValueError("Spec values must be positive integers")
        return gw, gh, 1, 1
    if len(nums) == 4:
        gw, gh, cw, ch = nums
        if gw <= 0 or gh <= 0 or cw <= 0 or ch <= 0:
            raise ValueError("Spec values must be positive integers")
        return gw, gh, cw, ch
    raise ValueError(
        "Spec must be one of: 'N', 'WxH', or 'WxHxCxC' (e.g., 16, 32x32, 16x16x32x32)"
    )


def center_crop_to_ratio(img: Image.Image, target_ratio: float) -> Image.Image:
    """Center-crop image to match the target aspect ratio (width/height)."""
    w, h = img.size
    current_ratio = w / h
    # If already close, skip
    if abs(current_ratio - target_ratio) < 1e-3:
        return img
    if current_ratio > target_ratio:
        # too wide -> crop width
        new_w = int(round(h * target_ratio))
        left = (w - new_w) // 2
        return img.crop((left, 0, left + new_w, h))
    else:
        # too tall -> crop height
        new_h = int(round(w / target_ratio))
        top = (h - new_h) // 2
        return img.crop((0, top, w, top + new_h))


def _quantize_tuple(c: Tuple[int, int, int, int], bits: int = 4) -> Tuple[int, int, int, int]:
    shift = 8 - bits
    return (c[0] >> shift, c[1] >> shift, c[2] >> shift, c[3] >> shift)


def _bucket_center(q: Tuple[int, int, int, int], bits: int = 4) -> Tuple[int, int, int, int]:
    # Map bucket back to 0..255 center value
    levels = (1 << bits) - 1
    scale = 255 / levels
    return tuple(int(round(v * scale)) for v in q)  # type: ignore


def _luma(c: Tuple[int, int, int, int]) -> float:
    r, g, b, _a = c
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _nearest_palette_color(color: Tuple[int, int, int, int], palette: List[Tuple[int, int, int, int]]) -> Tuple[int, int, int, int]:
    cr, cg, cb, ca = color
    best = None
    best_d = 1e9
    for pr, pg, pb, pa in palette:
        dr = cr - pr
        dg = cg - pg
        db = cb - pb
        da = ca - pa
        d = dr * dr + dg * dg + db * db + 0.25 * da * da
        if d < best_d:
            best_d = d
            best = (pr, pg, pb, pa)
    return best if best is not None else color


def _load_palette(path: str) -> List[Tuple[int, int, int, int]]:
    ext = os.path.splitext(path)[1].lower()
    if ext in (".png", ".jpg", ".jpeg", ".webp", ".bmp"):
        im = Image.open(path).convert("RGBA")
        # Reduce to <= 256 colors for speed if necessary
        colors = im.getcolors(maxcolors=1 << 24)
        if colors is None:
            im = im.convert("P", palette=Image.ADAPTIVE, colors=256).convert("RGBA")
            colors = im.getcolors(maxcolors=1 << 24)
        assert colors is not None
        unique = []
        seen = set()
        for _count, c in colors:
            if c not in seen:
                seen.add(c)
                unique.append(c)
        return unique
    # Text palette: lines like #RRGGBB or R,G,B or R,G,B,A
    out: List[Tuple[int, int, int, int]] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if not s or s.startswith("#") and len(s) != 7:
                # skip comments unless hex color
                if not (len(s) == 7 and s[0] == '#'):
                    continue
            if s.startswith('#') and len(s) == 7:
                r = int(s[1:3], 16)
                g = int(s[3:5], 16)
                b = int(s[5:7], 16)
                out.append((r, g, b, 255))
            else:
                parts = [p.strip() for p in s.split(',')]
                if all(p.isdigit() for p in parts) and (3 <= len(parts) <= 4):
                    r, g, b = map(int, parts[:3])
                    a = int(parts[3]) if len(parts) == 4 else 255
                    out.append((r, g, b, a))
    return out


def region_color(region: Image.Image, method: str, palette: Optional[List[Tuple[int, int, int, int]]] = None) -> Tuple[int, int, int, int]:
    """Compute representative RGBA color for a region using the given method.

    Methods:
      - 'mode': most frequent RGBA (keeps transparency exactly if uniform)
      - 'average': premultiplied alpha-weighted mean for RGB, mean for A
      - 'median': per-channel median (including A)
    """
    region = region.convert("RGBA")
    if method == "mode":
        max_colors = region.size[0] * region.size[1]
        colors = region.getcolors(max_colors)
        if colors is None:
            # Fallback to average if color count overflowed
            method = "average"
        else:
            return max(colors, key=lambda x: x[0])[1]

    if method == "average":
        # Alpha-weighted (premultiplied) average for color channels
        pixels = list(region.getdata())
        n = len(pixels)
        sum_a = sum(p[3] for p in pixels)
        if sum_a == 0:
            return (0, 0, 0, 0)
        sum_r = sum(p[0] * p[3] for p in pixels)
        sum_g = sum(p[1] * p[3] for p in pixels)
        sum_b = sum(p[2] * p[3] for p in pixels)
        r = int(round(sum_r / sum_a))
        g = int(round(sum_g / sum_a))
        b = int(round(sum_b / sum_a))
        a = int(round(sum_a / n))
        color = (r, g, b, a)
        return _nearest_palette_color(color, palette) if palette else color

    if method == "median":
        pixels = list(region.getdata())
        n = len(pixels)
        if n == 0:
            return (0, 0, 0, 0)
        rs = sorted(p[0] for p in pixels)
        gs = sorted(p[1] for p in pixels)
        bs = sorted(p[2] for p in pixels)
        al = sorted(p[3] for p in pixels)
        mid = n // 2
        if n % 2 == 1:
            color = (rs[mid], gs[mid], bs[mid], al[mid])
            return _nearest_palette_color(color, palette) if palette else color
        else:
            r = (rs[mid - 1] + rs[mid]) // 2
            g = (gs[mid - 1] + gs[mid]) // 2
            b = (bs[mid - 1] + bs[mid]) // 2
            a = (al[mid - 1] + al[mid]) // 2
            color = (r, g, b, a)
            return _nearest_palette_color(color, palette) if palette else color

    if method == "center":
        rgba = region.convert("RGBA")
        w, h = rgba.size
        if w == 0 or h == 0:
            return (0, 0, 0, 0)
        cx = w // 2
        cy = h // 2
        color = rgba.getpixel((cx, cy))
        return _nearest_palette_color(color, palette) if palette else color

    if method == "mc":
        # Edge-aware, outline-preserving representative color
        rgba = region.convert("RGBA")
        gray = region.convert("L")
        edges = gray.filter(ImageFilter.FIND_EDGES)
        edge_vals = list(edges.getdata())
        pixels = list(rgba.getdata())
        n = len(pixels)
        if n == 0:
            return (0, 0, 0, 0)

        # Determine edge threshold by quantile (keep top ~15% strongest edges)
        edge_vals_sorted = sorted(edge_vals)
        q_idx = int(0.85 * (n - 1))
        thr = edge_vals_sorted[q_idx]
        mask = [v >= thr and v > 0 for v in edge_vals]
        edge_count = sum(1 for m in mask if m)
        edge_ratio = edge_count / n

        # Build histograms in quantized color space
        bits = 4
        edge_hist = {}
        interior_hist = {}
        for idx, px in enumerate(pixels):
            q = _quantize_tuple(px, bits)
            if mask[idx]:
                edge_hist[q] = edge_hist.get(q, 0) + 1
            else:
                interior_hist[q] = interior_hist.get(q, 0) + 1

        # Pick candidates
        def best_bucket(hist):
            return max(hist.items(), key=lambda kv: kv[1])[0] if hist else None

        edge_bucket = best_bucket(edge_hist)
        interior_bucket = best_bucket(interior_hist)

        # Convert buckets to representative colors (center of bucket)
        edge_color = _bucket_center(edge_bucket, bits) if edge_bucket else None
        interior_color = _bucket_center(interior_bucket, bits) if interior_bucket else None

        # Fallbacks
        chosen = interior_color or edge_color or (0, 0, 0, 0)
        if edge_color and interior_color:
            # Heuristic: if clear edges and appreciable contrast, prefer edge color (to preserve outlines)
            contrast = abs(_luma(edge_color) - _luma(interior_color))
            if 0.03 < edge_ratio < 0.65 and contrast >= 12:
                chosen = edge_color
            else:
                chosen = interior_color

        # Palette snap if provided
        chosen = _nearest_palette_color(chosen, palette) if palette else chosen
        return chosen

    raise ValueError(f"Unknown method: {method}")


def pixelate(
    input_path: str,
    spec: str,
    method: str = "mode",
    crop: bool = True,
    out_path: Optional[str] = None,
    palette: Optional[List[Tuple[int, int, int, int]]] = None,
) -> str:
    gw, gh, cw, ch = parse_spec(spec)
    out_w, out_h = gw * cw, gh * ch

    img = Image.open(input_path).convert("RGBA")

    if crop:
        target_ratio = gw / gh
        img = center_crop_to_ratio(img, target_ratio)

    # Prepare a low-res grid image (gw x gh) with transparency
    grid_img = Image.new("RGBA", (gw, gh), (0, 0, 0, 0))

    src_w, src_h = img.size
    # Compute integer boundaries using proportional splits to keep uniform coverage
    # This avoids accumulation errors vs. stepping by float cell size.
    x_bounds = [round(i * src_w / gw) for i in range(gw + 1)]
    y_bounds = [round(j * src_h / gh) for j in range(gh + 1)]

    for j in range(gh):
        top, bottom = y_bounds[j], y_bounds[j + 1]
        for i in range(gw):
            left, right = x_bounds[i], x_bounds[i + 1]
            region = img.crop((left, top, right, bottom))
            color = region_color(region, method, palette=palette)
            grid_img.putpixel((i, j), color)

    # If cell size is 1, output is exactly gw x gh as requested.
    # If cell size > 1, upscale using NEAREST for crisp edges.
    out_img = grid_img if (cw == 1 and ch == 1) else grid_img.resize((out_w, out_h), Image.NEAREST)

    if out_path is None:
        base, _ = os.path.splitext(os.path.basename(input_path))
        out_path = os.path.join(
            os.path.dirname(input_path), f"{base}_pixelated_{gw}x{gh}x{cw}x{ch}.png"
        )
    out_img.save(out_path)
    return out_path


def main():
    p = argparse.ArgumentParser(
        description=(
            "Pixel-art converter: divide into a grid, pick one color per cell, and output a crisp PNG.\n"
            "Spec can be: 'N' (NxN output), 'WxH' (exact output), or 'WxHxCxC' (pixel blocks)."
        )
    )
    p.add_argument("input", help="Path to input image (PNG/JPG/etc.)")
    p.add_argument(
        "spec",
        help=(
            "Output/pixel spec: 'N' (NxN), 'WxH', or 'WxHxCxC' (gridW x gridH x cellW x cellH)."
        ),
    )
    p.add_argument(
        "-m",
        "--method",
        choices=["mode", "average", "median", "mc", "center"],
        default="mode",
        help=(
            "Color method per cell: 'mode' (default, avoids mid-tones), 'average', 'median', 'mc' (edge-aware), or 'center' (sample center pixel)"
        ),
    )
    p.add_argument(
        "--no-crop",
        action="store_true",
        help="Disable auto center-crop to match grid aspect ratio",
    )
    p.add_argument(
        "-o",
        "--output",
        help="Optional output path (.png). Default saves next to input.",
    )
    p.add_argument(
        "--palette",
        help="Optional palette file (PNG or TXT with colors) to snap output colors.",
    )

    args = p.parse_args()
    pal = _load_palette(args.palette) if args.palette else None
    out = pixelate(
        input_path=args.input,
        spec=args.spec,
        method=args.method,
        crop=not args.no_crop,
        out_path=args.output,
        palette=pal,
    )
    print(out)


if __name__ == "__main__":
    main()
