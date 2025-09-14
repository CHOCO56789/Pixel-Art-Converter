(() => {
  const fileInput = document.getElementById('fileInput');
  const gridWInput = document.getElementById('gridW');
  const gridHInput = document.getElementById('gridH');
  const gridLockAspect = document.getElementById('gridLockAspect');
  const gridAspect = document.getElementById('gridAspect');
  const methodSelect = document.getElementById('method');
  const qualityInput = document.getElementById('quality');
  const qualityLabel = document.getElementById('qualityLabel');
  const scaleXInput = document.getElementById('scaleX');
  const scaleYInput = document.getElementById('scaleY');
  const scaleXNum = document.getElementById('scaleXNum');
  const scaleYNum = document.getElementById('scaleYNum');
  const scaleXDec = document.getElementById('scaleXDec');
  const scaleXInc = document.getElementById('scaleXInc');
  const scaleYDec = document.getElementById('scaleYDec');
  const scaleYInc = document.getElementById('scaleYInc');
  const lockAspect = document.getElementById('lockAspect');
  const offsetXInput = document.getElementById('offsetX');
  const offsetYInput = document.getElementById('offsetY');
  const offsetXRange = document.getElementById('offsetXRange');
  const offsetYRange = document.getElementById('offsetYRange');
  const offsetXDec = document.getElementById('offsetXDec');
  const offsetXInc = document.getElementById('offsetXInc');
  const offsetYDec = document.getElementById('offsetYDec');
  const offsetYInc = document.getElementById('offsetYInc');
  // No preview scale control; export uses on-screen size
  const downloadBtn = document.getElementById('downloadBtn');
  const exportScaleInput = document.getElementById('exportScale');
  const finalizeBtn = document.getElementById('finalizeBtn');
  const backToConvertBtn = document.getElementById('backToConvertBtn');
  // Painting UI elements
  const toolSelect = document.getElementById('tool');
  const colorInput = document.getElementById('color');
  const alphaInput = document.getElementById('alpha');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const clearPaintBtn = document.getElementById('clearPaintBtn');
  const layerSelect = document.getElementById('layerSelect');
  const addLayerBtn = document.getElementById('addLayerBtn');
  const removeLayerBtn = document.getElementById('removeLayerBtn');
  const brushShapeSelect = document.getElementById('brushShape');
  const brushSizeInput = document.getElementById('brushSize');
  const savePaletteBtn = document.getElementById('savePaletteBtn');
  const loadPaletteInput = document.getElementById('loadPaletteInput');
  const colorHistoryEl = document.getElementById('colorHistory');
  let colorHistory = [];
  const openFileBtn = document.getElementById('openFileBtn');
  const exportToggle = document.getElementById('exportToggle');
  const exportPopover = document.getElementById('exportPopover');

  // Background selector elements
  const previewSurface = document.getElementById('previewSurface');
  const outputSurface = document.getElementById('outputSurface');
  const bgColorPicker = document.getElementById('bgColorPicker');
  const bgColorPicker2 = document.getElementById('bgColorPicker2');
  const statusText = document.getElementById('statusText');
  const toolButtons = Array.from(document.querySelectorAll('.tool-btn[data-tool]'));

  const previewCanvas = document.getElementById('previewCanvas');
  const previewCtx = previewCanvas.getContext('2d');
  const outputCanvas = document.getElementById('outputCanvas');
  const outputCtx = outputCanvas.getContext('2d');
  // Base (auto pixelated) and paint (user edits) layers
  const baseCanvas = document.createElement('canvas');
  const baseCtx = baseCanvas.getContext('2d');
  let paintCanvas = document.createElement('canvas');
  let paintCtx = paintCanvas.getContext('2d');
  // Multiple paint layers management
  let layers = [];
  let currentLayerIndex = 0; // target paint layer index
  let editingBase = false;   // if true, paint target is base
  let baseUndo = [];
  let baseRedo = [];
  let baseVisible = true;
  const layerListEl = document.getElementById('layerList');
  // Paint history
  // Per-layer undo stacks will be stored on each layer object
  const MAX_HISTORY = 30;

  function pushPaintHistory() {
    if (!paintCanvas || !paintCanvas.width || !paintCanvas.height) return;
    if (editingBase) {
      if (baseUndo.length >= MAX_HISTORY) baseUndo.shift();
      baseUndo.push(baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height));
      baseRedo.length = 0;
    } else {
      const layer = layers[currentLayerIndex];
      if (!layer) return;
      if (!layer.undo) layer.undo = [];
      if (!layer.redo) layer.redo = [];
      if (layer.undo.length >= MAX_HISTORY) layer.undo.shift();
      layer.undo.push(paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height));
      layer.redo.length = 0;
    }
  }

  function undoPaint() {
    if (editingBase) {
      if (baseUndo.length === 0) return;
      const cur = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
      const prev = baseUndo.pop();
      baseRedo.push(cur);
      baseCtx.putImageData(prev, 0, 0);
      compositeOutput();
      return;
    }
    const layer = layers[currentLayerIndex];
    if (!layer || !layer.undo || layer.undo.length === 0) return;
    const cur = paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
    const prev = layer.undo.pop();
    if (!prev) return;
    layer.redo.push(cur);
    paintCtx.putImageData(prev, 0, 0);
    compositeOutput();
  }

  function redoPaint() {
    if (editingBase) {
      if (baseRedo.length === 0) return;
      const cur = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
      const nxt = baseRedo.pop();
      baseUndo.push(cur);
      baseCtx.putImageData(nxt, 0, 0);
      compositeOutput();
      return;
    }
    const layer = layers[currentLayerIndex];
    if (!layer || !layer.redo || layer.redo.length === 0) return;
    const cur = paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
    const nxt = layer.redo.pop();
    if (!nxt) return;
    layer.undo.push(cur);
    paintCtx.putImageData(nxt, 0, 0);
    compositeOutput();
  }

  function clearPaint() {
    if (!paintCanvas.width || !paintCanvas.height) return;
    pushPaintHistory();
    paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
    compositeOutput();
    hasPaint = false;
  }

  function hexToRgb(hex) {
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) return [255, 0, 0];
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function getCurrentColor() {
    const [r, g, b] = hexToRgb(colorInput.value);
    const a = Math.max(0, Math.min(255, parseInt(alphaInput.value || '255', 10) || 255));
    return [r, g, b, a];
  }

  function setPaintPixel(x, y, rgba) {
    if (x < 0 || y < 0 || x >= paintCanvas.width || y >= paintCanvas.height) return;
    const img = paintCtx.getImageData(x, y, 1, 1);
    img.data[0] = rgba[0]; img.data[1] = rgba[1]; img.data[2] = rgba[2]; img.data[3] = rgba[3];
    paintCtx.putImageData(img, x, y);
    hasPaint = true;
  }

  function drawBrush(cx, cy, rgba) {
    const size = Math.max(1, Math.min(16, parseInt(brushSizeInput?.value || '1', 10) || 1));
    const shape = brushShapeSelect?.value || 'square';
    const r = Math.floor(size / 2);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx, y = cy + dy;
        if (shape === 'circle') {
          if ((dx*dx + dy*dy) > r*r) continue;
        }
        setPaintPixel(x, y, rgba);
      }
    }
  }

  function drawLine(x0, y0, x1, y1, rgba) {
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      drawBrush(x0, y0, rgba);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }

  function drawRect(x0, y0, x1, y1, rgba) {
    const left = Math.min(x0, x1), right = Math.max(x0, x1);
    const top = Math.min(y0, y1), bottom = Math.max(y0, y1);
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        drawBrush(x, y, rgba);
      }
    }
  }

  function floodFill(sx, sy, rgba) {
    const w = paintCanvas.width, h = paintCanvas.height;
    const target = paintCtx.getImageData(sx, sy, 1, 1).data;
    const [tr,tg,tb,ta] = target;
    const same = (x,y) => {
      const d = paintCtx.getImageData(x,y,1,1).data;
      return d[0]===tr && d[1]===tg && d[2]===tb && d[3]===ta;
    };
    if (!same(sx, sy)) { /* ok */ } else { /* proceed */ }
    const q = [];
    q.push([sx, sy]);
    const visited = new Uint8Array(w*h);
    while (q.length) {
      const [x,y] = q.pop();
      const idx = y*w + x;
      if (x<0||y<0||x>=w||y>=h) continue;
      if (visited[idx]) continue;
      if (!same(x,y)) continue;
      visited[idx]=1;
      setPaintPixel(x,y,rgba);
      q.push([x+1,y]); q.push([x-1,y]); q.push([x,y+1]); q.push([x,y-1]);
    }
  }

  function addColorToHistory(hex) {
    if (!/^#([0-9a-f]{6})$/i.test(hex)) return;
    colorHistory = colorHistory.filter(h => h.toLowerCase() !== hex.toLowerCase());
    colorHistory.unshift(hex);
    if (colorHistory.length > 16) colorHistory.pop();
    renderColorHistory();
  }

  function renderColorHistory() {
    if (!colorHistoryEl) return;
    colorHistoryEl.innerHTML = '';
    colorHistory.forEach(hex => {
      const d = document.createElement('div');
      d.className = 'swatch'; d.title = hex; d.style.background = hex;
      d.addEventListener('click', () => { colorInput.value = hex; });
      colorHistoryEl.appendChild(d);
    });
  }

  function getCompositePixel(x, y) {
    for (let i = layers.length - 1; i >= 0; i--) {
      const ly = layers[i];
      const d = ly.ctx.getImageData(x, y, 1, 1).data;
      if (ly.visible === false) continue;
      if (d[3] !== 0) return [d[0], d[1], d[2], d[3]];
    }
    if (baseVisible) {
      const b = baseCtx.getImageData(x, y, 1, 1).data;
      return [b[0], b[1], b[2], b[3]];
    }
    return [0,0,0,0];
  }

  function compositeOutput() {
    const gw = baseCanvas.width;
    const gh = baseCanvas.height;
    outputCanvas.width = gw;
    outputCanvas.height = gh;
    outputCtx.clearRect(0, 0, gw, gh);
    if (baseVisible) outputCtx.drawImage(baseCanvas, 0, 0);
    for (const ly of layers) {
      if (ly.visible === false) continue;
      outputCtx.drawImage(ly.canvas, 0, 0);
    }
    renderLayerList();
    fitOutputCanvas();
  }

  function fitOutputCanvas() {
    if (!outputCanvas) return;
    const gw = outputCanvas.width || 0;
    const gh = outputCanvas.height || 0;
    if (!gw || !gh) return;
    const surface = outputSurface || outputCanvas.parentElement;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const availW = Math.max(1, Math.floor(rect.width - 16));
    const availH = Math.max(1, Math.floor(rect.height - 16));
    const scale = Math.max(1, Math.floor(Math.min(availW / gw, availH / gh)));
    const cssW = gw * scale;
    const cssH = gh * scale;
    outputCanvas.style.width = cssW + 'px';
    outputCanvas.style.height = cssH + 'px';
  }

  function selectBaseForEditing() {
    editingBase = true;
    paintCanvas = baseCanvas;
    paintCtx = baseCtx;
  }

  function selectLayerForEditing(idx) {
    editingBase = false;
    currentLayerIndex = Math.max(0, Math.min(idx, layers.length - 1));
    paintCanvas = layers[currentLayerIndex].canvas;
    paintCtx = layers[currentLayerIndex].ctx;
  }

  function renderLayerList() {
    if (!layerListEl) return;
    layerListEl.innerHTML = '';
    // Build items from top to bottom including base at bottom
    const items = [];
    items.push({ type: 'base' });
    for (let i = 0; i < layers.length; i++) items.push({ type: 'layer', index: i });
    for (let j = items.length - 1; j >= 0; j--) {
      const it = items[j];
      const el = document.createElement('div');
      el.className = 'layer-item';
      const thumb = document.createElement('div'); thumb.className = 'layer-thumb';
      const t = document.createElement('canvas'); t.width = 56; t.height = 56; const tctx = t.getContext('2d'); tctx.imageSmoothingEnabled = false;
      const meta = document.createElement('div'); meta.className = 'layer-meta';
      const nameEl = document.createElement('div'); nameEl.className = 'layer-name';
      const tagsEl = document.createElement('div'); tagsEl.className = 'layer-tags';
      const eye = document.createElement('button'); eye.className = 'layer-eye'; eye.type = 'button';
      if (it.type === 'base') {
        nameEl.textContent = 'ベース'; tagsEl.textContent = '変換結果';
        if (baseVisible === false) el.classList.add('is-hidden');
        if (editingBase) el.classList.add('selected');
        if (baseCanvas.width && baseCanvas.height) tctx.drawImage(baseCanvas, 0, 0, 56, 56);
        eye.addEventListener('click', (e) => { e.stopPropagation(); baseVisible = !baseVisible; compositeOutput(); });
        el.addEventListener('click', () => { selectBaseForEditing(); compositeOutput(); updateStatus(); });
      } else {
        const ly = layers[it.index];
        nameEl.textContent = ly.name || `Layer ${it.index+1}`; tagsEl.textContent = '編集レイヤー';
        if (ly.visible === false) el.classList.add('is-hidden');
        if (!editingBase && currentLayerIndex === it.index) el.classList.add('selected');
        if (ly.canvas.width && ly.canvas.height) tctx.drawImage(ly.canvas, 0, 0, 56, 56);
        eye.addEventListener('click', (e) => { e.stopPropagation(); ly.visible = (ly.visible === false) ? true : false; compositeOutput(); });
        el.addEventListener('click', () => { selectLayerForEditing(it.index); if (layerSelect) layerSelect.value = String(it.index); compositeOutput(); updateStatus(); });
      }
      thumb.appendChild(t);
      meta.appendChild(nameEl); meta.appendChild(tagsEl);
      el.appendChild(thumb); el.appendChild(meta); el.appendChild(eye);
      layerListEl.appendChild(el);
    }
  }

  // Source image canvas
  const srcCanvas = document.createElement('canvas');
  const srcCtx = srcCanvas.getContext('2d');

  let img = null;
  let appMode = 'normalize'; // 'normalize' | 'edit'
  let lastGridW = parseInt(gridWInput.value || '32', 10) || 32;
  let lastGridH = parseInt(gridHInput.value || '32', 10) || 32;
  let hasPaint = false;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => { URL.revokeObjectURL(url); resolve(im); };
      im.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      im.src = url;
    });
  }

  function updateQualityLabel() {
    qualityLabel.textContent = String(qualityInput.value);
  }

  // Offscreen composed view
  const compCanvas = document.createElement('canvas');
  const compCtx = compCanvas.getContext('2d');

  function composeView(view) {
    const { vw, vh, sw, sh, sx, sy } = view;
    const ox = parseInt(offsetXInput.value || '0', 10) || 0;
    const oy = parseInt(offsetYInput.value || '0', 10) || 0;
    compCanvas.width = vw;
    compCanvas.height = vh;
    compCtx.clearRect(0, 0, vw, vh);
    compCtx.imageSmoothingEnabled = true;
    const dw = Math.max(1, Math.round(sw * sx));
    const dh = Math.max(1, Math.round(sh * sy));
    const baseX = Math.round((vw - dw) / 2);
    const baseY = Math.round((vh - dh) / 2);
    const dx = baseX + ox;
    const dy = baseY + oy;
    compCtx.drawImage(srcCanvas, 0, 0, sw, sh, dx, dy, dw, dh);
  }

  function drawPreview(view) {
    // Draw composed view and overlay grid
    const { vw, vh } = view;
    const pw = previewCanvas.width;
    const ph = previewCanvas.height;
    composeView(view);
    previewCtx.clearRect(0, 0, pw, ph);
    previewCtx.imageSmoothingEnabled = true;
    previewCtx.drawImage(compCanvas, 0, 0, pw, ph);

    // Grid overlay
    const gw = parseInt(gridWInput.value, 10) || 1;
    const gh = parseInt(gridHInput.value, 10) || 1;
    previewCtx.save();
    previewCtx.globalAlpha = 0.7;
    previewCtx.strokeStyle = 'rgba(255,255,255,0.35)';
    previewCtx.lineWidth = 1;
    for (let i = 1; i < gw; i++) {
      const x = (i / gw) * pw;
      previewCtx.beginPath();
      previewCtx.moveTo(x, 0);
      previewCtx.lineTo(x, ph);
      previewCtx.stroke();
    }
    for (let j = 1; j < gh; j++) {
      const y = (j / gh) * ph;
      previewCtx.beginPath();
      previewCtx.moveTo(0, y);
      previewCtx.lineTo(pw, y);
      previewCtx.stroke();
    }
    previewCtx.restore();
  }

  function syncOffsetRanges() {
    const LIM = 10000;
    offsetXRange.min = String(-LIM);
    offsetXRange.max = String(LIM);
    offsetYRange.min = String(-LIM);
    offsetYRange.max = String(LIM);
    offsetXRange.value = String(parseInt(offsetXInput.value || '0', 10) || 0);
    offsetYRange.value = String(parseInt(offsetYInput.value || '0', 10) || 0);
  }

  function parseAspect(text) {
    const s = String(text || '').trim();
    const m = s.match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
    if (m) {
      const a = parseFloat(m[1]);
      const b = parseFloat(m[2]);
      if (a > 0 && b > 0) return a / b;
    }
    const v = parseFloat(s);
    if (!isNaN(v) && v > 0) return v;
    return null;
  }

  let adjustingGrid = false;

  function applyGridLock(whichChanged) {
    if (!gridLockAspect.checked) return;
    const ratio = parseAspect(gridAspect.value) || (parseInt(gridWInput.value||'1',10) / Math.max(1, parseInt(gridHInput.value||'1',10)));
    adjustingGrid = true;
    if (whichChanged === 'W') {
      const gw = Math.max(1, parseInt(gridWInput.value||'1',10));
      gridHInput.value = String(Math.max(1, Math.round(gw / ratio)));
    } else if (whichChanged === 'H') {
      const gh = Math.max(1, parseInt(gridHInput.value||'1',10));
      gridWInput.value = String(Math.max(1, Math.round(gh * ratio)));
    }
    adjustingGrid = false;
  }

  function getViewBox() {
    if (!img) return null;
    const sw = srcCanvas.width;
    const sh = srcCanvas.height;
    let sx = parseFloat(scaleXInput.value) || 1;
    let sy = parseFloat(scaleYInput.value) || 1;
    sx = Math.max(0.1, sx);
    sy = Math.max(0.1, sy);
    const vw = sx >= 1 ? Math.max(1, Math.floor(sw / sx)) : sw;
    const vh = sy >= 1 ? Math.max(1, Math.floor(sh / sy)) : sh;

    // Free-range offsets; slider range is wide and not clamped
    syncOffsetRanges();
    return { vw, vh, sw, sh, sx, sy };
  }

  function pixelate(view) {
    const { vw, vh } = view;
    const gw = parseInt(gridWInput.value, 10) || 1;
    const gh = parseInt(gridHInput.value, 10) || 1;
    baseCanvas.width = gw;
    baseCanvas.height = gh;
    // Ensure all layers match current grid size
    if (layers.length === 0) {
      layers.push({ name: 'レイヤー 1', canvas: paintCanvas, ctx: paintCtx, undo: [], redo: [], visible: true });
      selectLayerForEditing(0);
      if (layerSelect) {
        layerSelect.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = '0'; opt.textContent = 'レイヤー 1';
        layerSelect.appendChild(opt);
      }
    }
    for (const ly of layers) {
      if (ly.canvas.width !== gw || ly.canvas.height !== gh) {
        ly.canvas.width = gw; ly.canvas.height = gh;
        ly.ctx.clearRect(0,0,gw,gh);
        ly.undo = []; ly.redo = [];
      }
    }

    const method = methodSelect.value;
    const q = parseInt(qualityInput.value, 10) || 3; // sampling density

    // Grab pixels from composed view
    composeView(view);
    const imgData = compCtx.getImageData(0, 0, vw, vh);
    const data = imgData.data; // RGBA Uint8ClampedArray

    // Precompute bounds
    const xBounds = new Array(gw + 1);
    const yBounds = new Array(gh + 1);
    for (let i = 0; i <= gw; i++) xBounds[i] = Math.round((i * vw) / gw);
    for (let j = 0; j <= gh; j++) yBounds[j] = Math.round((j * vh) / gh);

    function idx(x, y) { return ((y * vw) + x) * 4; }

    function sampleCenter(l, t, r, b) {
      const cx = Math.min(vw - 1, Math.max(0, Math.floor((l + r) / 2)));
      const cy = Math.min(vh - 1, Math.max(0, Math.floor((t + b) / 2)));
      const k = idx(cx, cy);
      return [data[k], data[k+1], data[k+2], data[k+3]];
    }

    function sampleAverage(l, t, r, b) {
      const w = Math.max(1, r - l);
      const h = Math.max(1, b - t);
      // Subsample to limit cost
      const stepX = Math.max(1, Math.floor(w / (q * 2)));
      const stepY = Math.max(1, Math.floor(h / (q * 2)));
      let sumA = 0, sumR = 0, sumG = 0, sumB = 0, count = 0;
      for (let y = t; y < b; y += stepY) {
        for (let x = l; x < r; x += stepX) {
          const k = idx(x, y);
          const a = data[k+3];
          sumA += a; count++;
          sumR += data[k] * a;
          sumG += data[k+1] * a;
          sumB += data[k+2] * a;
        }
      }
      if (count === 0) return [0,0,0,0];
      if (sumA === 0) return [0,0,0,0];
      const rch = Math.round(sumR / sumA);
      const gch = Math.round(sumG / sumA);
      const bch = Math.round(sumB / sumA);
      const ach = Math.round(sumA / count);
      return [rch, gch, bch, ach];
    }

    function sampleMode(l, t, r, b) {
      const w = Math.max(1, r - l);
      const h = Math.max(1, b - t);
      const stepX = Math.max(1, Math.floor(w / (q * 2)));
      const stepY = Math.max(1, Math.floor(h / (q * 2)));
      const map = new Map();
      for (let y = t; y < b; y += stepY) {
        for (let x = l; x < r; x += stepX) {
          const k = idx(x, y);
          const r0 = data[k], g0 = data[k+1], b0 = data[k+2], a0 = data[k+3];
          // Pack to 32-bit key
          const key = (r0<<24) | (g0<<16) | (b0<<8) | a0;
          map.set(key, (map.get(key) || 0) + 1);
        }
      }
      let bestKey = 0, bestCount = -1;
      for (const [k, cnt] of map) {
        if (cnt > bestCount) { bestCount = cnt; bestKey = k; }
      }
      const r0 = (bestKey >>> 24) & 0xff;
      const g0 = (bestKey >>> 16) & 0xff;
      const b0 = (bestKey >>> 8) & 0xff;
      const a0 = bestKey & 0xff;
      return [r0, g0, b0, a0];
    }

    for (let j = 0; j < gh; j++) {
      const t = yBounds[j];
      const b = yBounds[j+1];
      for (let i = 0; i < gw; i++) {
        const l = xBounds[i];
        const r = xBounds[i+1];
        let rgba;
        switch (method) {
          case 'center': rgba = sampleCenter(l, t, r, b); break;
          case 'average': rgba = sampleAverage(l, t, r, b); break;
          case 'mode': default: rgba = sampleMode(l, t, r, b); break;
        }
        baseCtx.fillStyle = `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${(rgba[3]/255).toFixed(3)})`;
        baseCtx.fillRect(i, j, 1, 1);
      }
    }
  }

  function render() {
    if (!img) return;
    const view = getViewBox();
    if (!view) return;
    // プレビューは常時描画（編集モードでも）
    drawPreview(view);
    // ベースの再生成は変換モードのみ
    if (appMode === 'normalize') {
      pixelate(view);
    }
    compositeOutput();
    updateStatus();
  }

  function exportPNG() {
    // Export based on grid size times user scale (nearest-neighbor)
    const scale = Math.max(1, parseInt(exportScaleInput.value || '1', 10));
    const gw = outputCanvas.width;
    const gh = outputCanvas.height;
    const w = gw * scale;
    const h = gh * scale;
    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    const tctx = tmp.getContext('2d');
    tctx.imageSmoothingEnabled = false;
    tctx.drawImage(outputCanvas, 0, 0, w, h);
    const url = tmp.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixelated_${gw}x${gh}_x${scale}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Event wiring
  fileInput.addEventListener('change', async (e) => {
    console.log('File input changed');
    const f = e.target.files && e.target.files[0];
    if (!f) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', f.name);
    statusText.textContent = '画像を読み込み中...';

    try {
      img = await readImage(f);
      console.log('Image loaded successfully');

      // Fit source into srcCanvas (keep original size for fidelity)
      srcCanvas.width = img.naturalWidth;
      srcCanvas.height = img.naturalHeight;
      srcCtx.clearRect(0, 0, srcCanvas.width, srcCanvas.height);
      srcCtx.drawImage(img, 0, 0);

      // Reset offsets
      offsetXInput.value = '0';
      offsetYInput.value = '0';
      offsetXRange.value = '0';
      offsetYRange.value = '0';

      statusText.textContent = '画像を読み込みました';
      render();
    } catch (error) {
      console.error('Error loading image:', error);
      statusText.textContent = 'エラー: 画像の読み込みに失敗しました';
    }
  });

  [gridWInput, gridHInput, methodSelect, qualityInput,
   scaleXInput, scaleYInput, scaleXNum, scaleYNum,
   offsetXInput, offsetYInput, offsetXRange, offsetYRange].forEach(el => el.addEventListener('input', () => {
    if (el === qualityInput) updateQualityLabel();
    // If numeric scale changed, push into range first
    if (el === scaleXNum) scaleXInput.value = scaleXNum.value;
    if (el === scaleYNum) scaleYInput.value = scaleYNum.value;
    // Keep scale inputs in sync (range -> number)
    const sx = parseFloat(scaleXInput.value) || 1;
    const sy = parseFloat(scaleYInput.value) || 1;
    scaleXNum.value = String(sx.toFixed(2));
    scaleYNum.value = String(sy.toFixed(2));
    if ((el === scaleXInput || el === scaleXNum) && lockAspect.checked) {
      scaleYInput.value = scaleXInput.value;
      scaleYNum.value = scaleXNum.value;
    }
    if ((el === scaleYInput || el === scaleYNum) && lockAspect.checked) {
      scaleXInput.value = scaleYInput.value;
      scaleXNum.value = scaleYNum.value;
    }
    // Mirror offset number/range
    if (el === offsetXInput) offsetXRange.value = offsetXInput.value;
    if (el === offsetYInput) offsetYRange.value = offsetYInput.value;
    if (el === offsetXRange) offsetXInput.value = offsetXRange.value;
    if (el === offsetYRange) offsetYInput.value = offsetYRange.value;
    // In edit mode, warn if grid size changes
    if (appMode === 'edit' && (el === gridWInput || el === gridHInput)) {
      const newW = parseInt(gridWInput.value || String(lastGridW), 10) || lastGridW;
      const newH = parseInt(gridHInput.value || String(lastGridH), 10) || lastGridH;
      if (newW !== lastGridW || newH !== lastGridH) {
        const ok = confirm('グリッドサイズ（画像サイズ）を変更すると、ペイントはクリアされます。続行しますか？');
        if (!ok) {
          gridWInput.value = String(lastGridW);
          gridHInput.value = String(lastGridH);
        } else {
          lastGridW = newW; lastGridH = newH;
          hasPaint = false; baseUndo = []; baseRedo = [];
          // resize base and all layers
          baseCanvas.width = newW; baseCanvas.height = newH; baseCtx.clearRect(0,0,newW,newH);
          layers.forEach(ly => { ly.canvas.width = newW; ly.canvas.height = newH; ly.ctx.clearRect(0,0,newW,newH); ly.undo = []; ly.redo = []; });
          // keep current selection references
          if (editingBase) { paintCanvas = baseCanvas; paintCtx = baseCtx; }
          else if (layers[currentLayerIndex]) { paintCanvas = layers[currentLayerIndex].canvas; paintCtx = layers[currentLayerIndex].ctx; }
        }
      }
    }
    render();
  }));

  lockAspect.addEventListener('change', () => {
    if (lockAspect.checked) {
      scaleYInput.value = scaleXInput.value;
      scaleYNum.value = scaleXNum.value;
      render();
    }
  });

  // Grid aspect locking
  let adjustingGridFlag = false;
  gridWInput.addEventListener('input', () => {
    if (adjustingGridFlag) return;
    adjustingGridFlag = true;
    applyGridLock('W');
    adjustingGridFlag = false;
    render();
  });
  gridHInput.addEventListener('input', () => {
    if (adjustingGridFlag) return;
    adjustingGridFlag = true;
    applyGridLock('H');
    adjustingGridFlag = false;
    render();
  });
  gridAspect.addEventListener('change', () => { applyGridLock('W'); render(); });

  downloadBtn.addEventListener('click', exportPNG);
  undoBtn.addEventListener('click', undoPaint);
  redoBtn.addEventListener('click', redoPaint);
  clearPaintBtn.addEventListener('click', clearPaint);
  if (openFileBtn) {
    openFileBtn.addEventListener('click', () => {
      console.log('Open file button clicked');
      if (fileInput) {
        console.log('File input found, triggering click');
        fileInput.click();
      } else {
        console.error('File input not found');
        statusText.textContent = 'エラー: ファイル入力が見つかりません';
      }
    });
  } else {
    console.error('Open file button not found');
  }
  if (exportToggle && exportPopover) {
    exportToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      exportPopover.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!exportPopover.classList.contains('hidden')) {
        if (!e.target.closest('#exportPopover') && !e.target.closest('#exportToggle')) {
          exportPopover.classList.add('hidden');
        }
      }
    });
  }
  if (layerSelect) {
    layerSelect.addEventListener('change', () => {
      const idx = parseInt(layerSelect.value || '0', 10) || 0;
      selectLayerForEditing(idx);
      compositeOutput();
    });
  }
  if (addLayerBtn) {
    addLayerBtn.addEventListener('click', () => {
      const gw = baseCanvas.width || (parseInt(gridWInput.value||'32',10) || 32);
      const gh = baseCanvas.height || (parseInt(gridHInput.value||'32',10) || 32);
      const c = document.createElement('canvas'); c.width = gw; c.height = gh;
      const ctx = c.getContext('2d');
      const name = `レイヤー ${layers.length+1}`;
      layers.push({ name, canvas: c, ctx, undo: [], redo: [], visible: true });
      selectLayerForEditing(layers.length - 1);
      if (layerSelect) {
        const opt = document.createElement('option'); opt.value = String(currentLayerIndex); opt.textContent = name;
        layerSelect.appendChild(opt); layerSelect.value = String(currentLayerIndex);
      }
      compositeOutput();
    });
  }
  if (removeLayerBtn) {
    removeLayerBtn.addEventListener('click', () => {
      if (editingBase) { alert('ベースは削除できません'); return; }
      if (layers.length <= 1) { alert('最低1つのレイヤーが必要です'); return; }
      layers.splice(currentLayerIndex, 1);
      selectLayerForEditing(Math.max(0, currentLayerIndex - 1));
      if (layerSelect) {
        layerSelect.innerHTML = '';
        layers.forEach((ly, i) => {
          const opt = document.createElement('option'); opt.value = String(i); opt.textContent = ly.name || `Layer ${i+1}`;
          if (i === currentLayerIndex) opt.selected = true; layerSelect.appendChild(opt);
        });
      }
      compositeOutput();
    });
  }

  // Finalize normalization -> switch to edit mode
  const stepConvert = document.querySelector('[data-step="convert"]');
  const stepEdit = document.querySelector('[data-step="edit"]');

  function updateModeUI() {
    const isEdit = appMode === 'edit';
    document.body.classList.toggle('edit-mode', isEdit);
    if (stepConvert) stepConvert.classList.toggle('active', !isEdit);
    if (stepEdit) stepEdit.classList.toggle('active', isEdit);
    if (finalizeBtn) finalizeBtn.classList.toggle('hidden', isEdit);
    if (backToConvertBtn) backToConvertBtn.classList.toggle('hidden', !isEdit);
    updateStatus();
  }

  function setMode(mode) {
    appMode = mode;
    if (mode === 'edit') {
      lastGridW = parseInt(gridWInput.value || '32', 10) || 32;
      lastGridH = parseInt(gridHInput.value || '32', 10) || 32;
      // 初回はベースを編集対象にして、消しゴムなどが効くように
      selectBaseForEditing();
      if (toolSelect) {
        toolSelect.value = 'pen';
        toolSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      syncToolButtons();
      compositeOutput();
    }
    updateModeUI();
    if (mode === 'normalize') {
      render();
    }
  }
  if (finalizeBtn) {
    finalizeBtn.addEventListener('click', () => {
      if (!img) { alert('先に画像を読み込んでください'); return; }
      setMode('edit');
    });
  }
  if (backToConvertBtn) {
    backToConvertBtn.addEventListener('click', () => {
      const warn = hasPaint ? '編集内容は保持されますが、変換パラメータの変更で消去される可能性があります。変換モードへ戻りますか？' : '変換モードへ戻りますか？';
      const ok = confirm(warn);
      if (!ok) return;
      setMode('normalize');
    });
  }

  // Palette save/load
  if (savePaletteBtn) {
    savePaletteBtn.addEventListener('click', () => {
      const data = JSON.stringify(colorHistory, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'palette.json';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });
  }
  if (colorInput) {
    colorInput.addEventListener('input', () => addColorToHistory(colorInput.value));
    addColorToHistory(colorInput.value);
  }
  if (loadPaletteInput) {
    loadPaletteInput.addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          let arr = [];
          const text = String(reader.result || '');
          try { arr = JSON.parse(text); } catch {
            arr = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
          }
          colorHistory = arr.filter(x => /^#([0-9a-f]{6})$/i.test(x));
          renderColorHistory();
        } catch (err) {
          alert('パレットの読み込みに失敗しました');
        }
      };
      reader.readAsText(f);
    });
  }

  // Toolbar <-> select sync
  function syncToolButtons() {
    toolButtons.forEach(btn => {
      const v = btn.getAttribute('data-tool');
      btn.classList.toggle('active', v === toolSelect.value);
    });
  }
  if (toolButtons.length) {
    toolButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.getAttribute('data-tool');
        toolSelect.value = v;
        toolSelect.dispatchEvent(new Event('change', { bubbles: true }));
        syncToolButtons();
        updateStatus();
      });
    });
  }
  if (toolSelect) {
    toolSelect.addEventListener('change', () => {
      syncToolButtons();
      updateStatus();
      // cursor
      if (toolSelect.value === 'move') {
        outputCanvas.style.cursor = 'move';
      } else if (toolSelect.value === 'picker') {
        outputCanvas.style.cursor = 'crosshair';
      } else {
        outputCanvas.style.cursor = 'default';
      }
    });
    // initial state
    syncToolButtons();
  }

  // Status bar
  function updateStatus() {
    if (!statusText) return;
    const gw = outputCanvas?.width || 0;
    const gh = outputCanvas?.height || 0;
    const tool = toolSelect?.value || '-';
    const mode = appMode === 'edit' ? '編集' : '変換';
    const target = editingBase ? 'ベース' : `レイヤー${currentLayerIndex+1}`;
    statusText.textContent = `モード: ${mode} | ツール: ${tool} | 対象: ${target} | グリッド: ${gw}x${gh}`;
  }

  // Steppers for scales
  function stepScale(which, delta) {
    const input = which === 'x' ? scaleXInput : scaleYInput;
    const num = which === 'x' ? scaleXNum : scaleYNum;
    let v = parseFloat(input.value) || 1;
    v = clamp(v + delta, 0.1, 8);
    input.value = String(v);
    num.value = String(v.toFixed(2));
    if (lockAspect.checked) {
      if (which === 'x') {
        scaleYInput.value = input.value;
        scaleYNum.value = num.value;
      } else {
        scaleXInput.value = input.value;
        scaleXNum.value = num.value;
      }
    }
    render();
  }
  if (scaleXDec) scaleXDec.addEventListener('click', () => stepScale('x', -0.05));
  if (scaleXInc) scaleXInc.addEventListener('click', () => stepScale('x',  0.05));
  if (scaleYDec) scaleYDec.addEventListener('click', () => stepScale('y', -0.05));
  if (scaleYInc) scaleYInc.addEventListener('click', () => stepScale('y',  0.05));

  // Steppers for offsets
  function stepOffset(which, delta) {
    const num = which === 'x' ? offsetXInput : offsetYInput;
    const range = which === 'x' ? offsetXRange : offsetYRange;
    let v = parseInt(num.value || '0', 10);
    const min = parseInt(range.min, 10);
    const max = parseInt(range.max, 10);
    const lo = isNaN(min) ? -10000 : min;
    const hi = isNaN(max) ? 10000 : max;
    v = clamp(v + delta, lo, hi);
    num.value = String(v);
    range.value = String(v);
    render();
  }
  if (offsetXDec) offsetXDec.addEventListener('click', () => stepOffset('x', -1));
  if (offsetXInc) offsetXInc.addEventListener('click', () => stepOffset('x',  1));
  if (offsetYDec) offsetYDec.addEventListener('click', () => stepOffset('y', -1));
  if (offsetYInc) offsetYInc.addEventListener('click', () => stepOffset('y',  1));

  // Init
  updateQualityLabel();
  updateModeUI();
  // sync numeric to ranges initial
  scaleXNum.value = scaleXInput.value;
  scaleYNum.value = scaleYInput.value;
  offsetXRange.value = offsetXInput.value;
  offsetYRange.value = offsetYInput.value;
  // Init layers list
  if (layers.length === 0) {
    // start with one paint layer
    layers.push({ name: 'レイヤー 1', canvas: paintCanvas, ctx: paintCtx, undo: [], redo: [], visible: true });
    selectLayerForEditing(0);
    if (layerSelect) { layerSelect.innerHTML=''; const opt = document.createElement('option'); opt.value='0'; opt.textContent='レイヤー 1'; layerSelect.appendChild(opt); }
  }

  // Drag to pan on preview (updates center-relative offsets)
  let dragging = false;
  let dragStart = null;
  function pvRect() { return previewCanvas.getBoundingClientRect(); }
  function pvDown(e){ dragging=true; const r=pvRect(); const x=e.clientX-r.left, y=e.clientY-r.top; dragStart={x,y,ox:parseInt(offsetXInput.value||'0',10),oy:parseInt(offsetYInput.value||'0',10)}; }
  function pvMove(e){ if(!dragging) return; const r=pvRect(); const x=e.clientX-r.left, y=e.clientY-r.top; const dx=x-dragStart.x, dy=y-dragStart.y; const view=getViewBox(); if(!view) return; const pw=previewCanvas.width, ph=previewCanvas.height; const vx=Math.round(dx*(view.vw/pw)); const vy=Math.round(dy*(view.vh/ph)); const newOx=dragStart.ox+vx, newOy=dragStart.oy+vy; offsetXInput.value=String(newOx); offsetYInput.value=String(newOy); offsetXRange.value=String(newOx); offsetYRange.value=String(newOy); render(); }
  function pvUp(){ dragging=false; dragStart=null; }
  if (window.PointerEvent){ previewCanvas.addEventListener('pointerdown', pvDown); window.addEventListener('pointermove', pvMove); window.addEventListener('pointerup', pvUp); window.addEventListener('pointercancel', pvUp);} else { previewCanvas.addEventListener('mousedown', pvDown); window.addEventListener('mousemove', pvMove); window.addEventListener('mouseup', pvUp); }

  // Painting on output (grid) canvas
  let painting = false;
  let moving = false;
  let moveStart = null;
  let moveSnapshot = null;
  let startPoint = null;
  let longPressTimer = null;
  let longPressActive = false;
  const LONG_PRESS_MS = 400;
  function ocRect(){ return outputCanvas.getBoundingClientRect(); }
  function ocCoords(e){ const r=ocRect(); const x=e.clientX-r.left, y=e.clientY-r.top; return { gx: Math.floor(x*(outputCanvas.width/r.width)), gy: Math.floor(y*(outputCanvas.height/r.height)) }; }
  function ocDown(e){
    if (appMode !== 'edit') return; // 編集モードのみ描画可能
    if (!paintCanvas || !paintCanvas.width) return;
    const { gx, gy } = ocCoords(e);
    const tool = toolSelect.value;
    if (tool === 'move') {
      pushPaintHistory();
      moving = true;
      moveStart = { x: gx, y: gy };
      // snapshot current target layer/base
      if (editingBase) {
        moveSnapshot = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
      } else {
        moveSnapshot = paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
      }
      return;
    }
    if (tool === 'picker') {
      const [r,g,b,a] = getCompositePixel(gx, gy);
      colorInput.value = `#${((1<<24) + (r<<16) + (g<<8) + b).toString(16).slice(1)}`;
      alphaInput.value = String(a);
      addColorToHistory(colorInput.value);
      return;
    }
    // Long-press temporary picker
    longPressActive = false;
    longPressTimer = (tool === 'move') ? null : setTimeout(() => {
      const [r,g,b,a] = getCompositePixel(gx, gy);
      colorInput.value = `#${((1<<24) + (r<<16) + (g<<8) + b).toString(16).slice(1)}`;
      alphaInput.value = String(a);
      addColorToHistory(colorInput.value);
      longPressActive = true;
    }, LONG_PRESS_MS);

    if (tool === 'fill') {
      pushPaintHistory();
      floodFill(gx, gy, getCurrentColor());
      compositeOutput();
      return;
    }

    if (tool === 'line' || tool === 'rect') {
      startPoint = { x: gx, y: gy };
      painting = true;
      return;
    }

    pushPaintHistory();
    painting = true;
    const rgba = (tool === 'eraser') ? [0,0,0,0] : getCurrentColor();
    if (tool !== 'eraser') addColorToHistory(colorInput.value);
    drawBrush(gx, gy, rgba);
    compositeOutput();
  }
  function ocMove(e){
    if (appMode !== 'edit') return;
    const tool = toolSelect.value;
    if (tool === 'move') {
      if (!moving || !moveSnapshot) return;
      const { gx, gy } = ocCoords(e);
      const dx = gx - moveStart.x;
      const dy = gy - moveStart.y;
      const targetCtx = editingBase ? baseCtx : paintCtx;
      const targetCanvas = editingBase ? baseCanvas : paintCanvas;
      targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
      targetCtx.putImageData(moveSnapshot, dx, dy);
      compositeOutput();
      return;
    }
    if (!painting) return;
    const { gx, gy } = ocCoords(e);
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    if (tool === 'line' || tool === 'rect') {
      // no live preview for simplicity
      return;
    }
    const rgba = (tool === 'eraser') ? [0,0,0,0] : getCurrentColor();
    drawBrush(gx, gy, rgba);
    compositeOutput();
  }
  function ocUp(e){
    if (appMode !== 'edit') return;
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    if (moving) {
      moving = false; moveSnapshot = null; moveStart = null;
      return;
    }
    if (!startPoint) return;
    const { gx, gy } = ocCoords(e);
    const tool = toolSelect.value;
    if (tool === 'line') {
      pushPaintHistory();
      drawLine(startPoint.x, startPoint.y, gx, gy, getCurrentColor());
      compositeOutput();
    } else if (tool === 'rect') {
      pushPaintHistory();
      drawRect(startPoint.x, startPoint.y, gx, gy, getCurrentColor());
      compositeOutput();
    }
    startPoint = null;
  }
  if (window.PointerEvent){ outputCanvas.addEventListener('pointerdown', ocDown); window.addEventListener('pointermove', ocMove); window.addEventListener('pointerup', ocUp); window.addEventListener('pointercancel', ocUp);} else { outputCanvas.addEventListener('mousedown', ocDown); window.addEventListener('mousemove', ocMove); window.addEventListener('mouseup', ocUp); }

  // Status: cursor coordinate over output canvas
  if (outputCanvas) {
    outputCanvas.addEventListener('mousemove', (e) => {
      const rect = outputCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const gx = Math.floor(x * (outputCanvas.width / rect.width));
      const gy = Math.floor(y * (outputCanvas.height / rect.height));
      if (statusText) {
        const tool = toolSelect?.value || '-';
        statusText.textContent = `ツール: ${tool} | グリッド: ${outputCanvas.width}x${outputCanvas.height} | カーソル: ${gx},${gy}`;
      }
    });
    outputCanvas.addEventListener('mouseleave', () => updateStatus());
  }

  // Resize handling to keep integer pixel scaling
  window.addEventListener('resize', fitOutputCanvas);
  if (window.ResizeObserver && outputSurface) {
    const ro = new ResizeObserver(() => fitOutputCanvas());
    ro.observe(outputSurface);
  }

  // Collapsible panels (export, palette etc.)
  const collapsiblePanels = Array.from(document.querySelectorAll('.panel[data-collapsible="true"]'));
  collapsiblePanels.forEach(panel => {
    const btn = panel.querySelector('.collapse-btn') || panel.querySelector('.panel-header');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      // Avoid interfering with inputs in header
      if (e.target && e.target.closest && !e.target.closest('.collapse-btn')) {
        if (e.currentTarget !== e.target) return;
      }
      panel.classList.toggle('collapsed');
    });
  });

  // Background selector functionality
  function setupBackgroundSelector(surface, colorPicker) {
    if (!surface) return;

    const bgButtons = surface.parentElement.querySelectorAll('.bg-btn');

    bgButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const bgType = btn.dataset.bg;

        // Update active state
        bgButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Apply background
        surface.className = 'canvas-surface';
        switch(bgType) {
          case 'white':
            surface.classList.add('bg-white');
            break;
          case 'black':
            surface.classList.add('bg-black');
            break;
          case 'gray':
            surface.classList.add('bg-gray');
            break;
          case 'checker':
          default:
            surface.classList.add('checker');
            break;
        }
      });
    });

    // Custom color picker
    if (colorPicker) {
      colorPicker.addEventListener('change', () => {
        bgButtons.forEach(b => b.classList.remove('active'));
        surface.className = 'canvas-surface';
        surface.style.backgroundColor = colorPicker.value;
      });
    }

    // Set default (checker)
    const checkerBtn = surface.parentElement.querySelector('.bg-btn[data-bg="checker"]');
    if (checkerBtn) checkerBtn.click();
  }

  // Initialize background selectors
  setupBackgroundSelector(previewSurface, bgColorPicker);
  setupBackgroundSelector(outputSurface, bgColorPicker2);
})();
