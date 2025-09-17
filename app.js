(async () => {
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
  // Stepper buttons are not used in current UI
  const lockAspect = document.getElementById('lockAspect');
  const offsetXInput = document.getElementById('offsetX');
  const offsetYInput = document.getElementById('offsetY');
  const offsetXRange = document.getElementById('offsetXRange');
  const offsetYRange = document.getElementById('offsetYRange');
  // Offset stepper buttons are not used in current UI
  
  // Preview grid visibility
  const showGrid = document.getElementById('showGrid');
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
  const COLOR_HISTORY_MAX = 48;
  const openFileBtn = document.getElementById('openFileBtn');
  const exportToggle = document.getElementById('exportToggle');
  const exportPopover = document.getElementById('exportPopover');
  // Mobile bottom bar controls
  const mobileUndo = document.getElementById('mobileUndo');
  const mobileRedo = document.getElementById('mobileRedo');
  const mobileBrushDec = document.getElementById('mobileBrushDec');
  const mobileBrushInc = document.getElementById('mobileBrushInc');
  const mobileBrushSize = document.getElementById('mobileBrushSize');
  const mobileColorBtn = document.getElementById('mobileColorBtn');
  const layersToggleMobile = document.getElementById('layersToggleMobile');
  const layersModal = document.getElementById('layersModal');
  const closeLayersModal = document.getElementById('closeLayersModal');
  const layersListMobileFull = document.getElementById('layersListMobileFull');
  const addLayerBtnMobile2 = document.getElementById('addLayerBtnMobile2');
  const removeLayerBtnMobile2 = document.getElementById('removeLayerBtnMobile2');
  const aspectPreset = document.getElementById('aspectPreset');
  const gridPresetList = document.getElementById('gridPresetList');
  const gridAspectBadge = document.getElementById('gridAspectBadge');
  const canvasArea = document.querySelector('.canvas-area');
  const viewToggleBtn = document.getElementById('viewToggleBtn');
  const viewToggleLabel = viewToggleBtn?.querySelector('.label') || null;
  const viewTogglePath = viewToggleBtn?.querySelector('path') || null;
  const mobileColorInputField = document.getElementById('mobileColorInput');

  // Background selector elements
  const previewSurface = document.getElementById('previewSurface');
  const outputSurface = document.getElementById('outputSurface');
  let canvasBgStyle = 'checker'; // Current background style
  const statusText = document.getElementById('statusText');
  const toolButtons = Array.from(document.querySelectorAll('.tool-btn[data-tool]'));
  const LAYER_THUMB_SIZE = 40;
  const LAYER_VISIBLE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s4.2-6.5 9.5-6.5 9.5 6.5 9.5 6.5-4.2 6.5-9.5 6.5S2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  const LAYER_HIDDEN_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 5.7C3.1 7.4 2 9.2 2 9.2s4.2 6.5 9.5 6.5c1.4 0 2.8-.3 4-.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.5 7.5c2.5 0 4.8 1.5 6.5 3 1 .9 1.8 1.9 2.5 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const LAYER_DUP_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><rect x="5" y="5" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const LAYER_MERGE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M8.5 11.5L12 15l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 18h12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const target = event.target;
    if (target && (target.closest('input, textarea') || target.closest('[contenteditable]'))) {
      lastTouchEnd = Date.now();
      return;
    }
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  function updateLayerEyeButton(btn, visible) {
    if (!btn) return;
    btn.innerHTML = visible ? LAYER_VISIBLE_ICON : LAYER_HIDDEN_ICON;
    const label = visible ? '表示' : '非表示';
    btn.title = label;
    btn.setAttribute('aria-label', label);
  }
  
  function updateMobileBrushUI() {
    if (mobileBrushSize && brushSizeInput) mobileBrushSize.textContent = String(brushSizeInput.value || '1');
  }
  function updateMobileColorChip() {
    if (!mobileColorBtn || !colorInput) return;
    mobileColorBtn.style.background = colorInput.value;
    const a = alphaInput ? parseInt(alphaInput.value||'255',10) : 255;
    mobileColorBtn.style.backgroundImage = (a < 252) ? 'repeating-linear-gradient(45deg, rgba(0,0,0,0.35) 0 2px, transparent 2px 6px)' : 'none';
  }

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
  const PROJECT_STORAGE_KEY = 'pixelart-project';
  let isRestoringProject = false;
  let saveScheduled = false;

  function serializeProject() {
    try {
      const payload = {
        version: 1,
        appMode,
        lastGridW,
        lastGridH,
        canvasBgStyle,
        baseVisible,
        editingBase,
        currentLayerIndex,
        colorHistory: Array.isArray(colorHistory) ? [...colorHistory] : [],
        base: null,
        layers: layers.map(ly => {
          let image = null;
          try {
            if (ly.canvas && ly.canvas.width && ly.canvas.height) {
              image = ly.canvas.toDataURL();
            }
          } catch (err) {
            console.warn('Failed to serialize layer canvas', err);
          }
          return {
            name: ly.name || '',
            visible: ly.visible === false ? false : true,
            image,
          };
        })
      };
      try {
        if (baseCanvas && baseCanvas.width && baseCanvas.height) {
          payload.base = { image: baseCanvas.toDataURL() };
        }
      } catch (err) {
        console.warn('Failed to serialize base canvas', err);
      }
      return JSON.stringify(payload);
    } catch (err) {
      console.warn('Failed to serialize project', err);
      return null;
    }
  }

  function saveProjectState() {
    if (isRestoringProject) return;
    if (saveScheduled) return;
    saveScheduled = true;
    const runner = () => {
      saveScheduled = false;
      if (isRestoringProject) return;
      if (typeof localStorage === 'undefined') return;
      const json = serializeProject();
      if (!json) return;
      try {
        localStorage.setItem(PROJECT_STORAGE_KEY, json);
      } catch (err) {
        console.warn('Failed to save project to localStorage', err);
      }
    };
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(runner);
    } else {
      setTimeout(runner, 0);
    }
  }

  async function deserializeProject(json) {
    let data;
    try {
      data = JSON.parse(json);
    } catch (err) {
      throw new Error('Failed to parse project data');
    }
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid project payload');
    }

    const loadImage = (src) => new Promise((resolve, reject) => {
      if (!src) { resolve(null); return; }
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('Failed to load project image'));
      im.src = src;
    });

    const baseEntry = data.base || null;
    const baseImage = await loadImage(baseEntry?.image || null);

    const layerEntries = Array.isArray(data.layers) ? data.layers : [];
    const layerImages = [];
    for (const entry of layerEntries) {
      const image = await loadImage(entry?.image || null);
      layerImages.push({ entry, image });
    }

    let width = baseImage ? baseImage.naturalWidth : 0;
    let height = baseImage ? baseImage.naturalHeight : 0;
    if ((!width || !height) && layerImages.length) {
      for (const { image } of layerImages) {
        if (image) {
          width = image.naturalWidth;
          height = image.naturalHeight;
          break;
        }
      }
    }
    if (!width || !height) {
      width = Math.max(1, parseInt(data.lastGridW || '0', 10)) || 0;
      height = Math.max(1, parseInt(data.lastGridH || '0', 10)) || 0;
    }
    if (!width || !height) {
      throw new Error('Project canvas size is invalid');
    }

    baseCanvas.width = width;
    baseCanvas.height = height;
    baseCtx.clearRect(0, 0, width, height);
    if (baseImage) {
      baseCtx.drawImage(baseImage, 0, 0, width, height);
    }

    layers = layerImages.map(({ entry, image }, index) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (image) ctx.drawImage(image, 0, 0, width, height);
      return {
        name: entry?.name || `レイヤー ${index + 1}`,
        visible: entry?.visible === false ? false : true,
        canvas,
        ctx,
        undo: [],
        redo: []
      };
    });

    if (!layers.length) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      layers.push({ name: 'レイヤー 1', canvas, ctx, undo: [], redo: [], visible: true });
    }

    const idx = parseInt(data.currentLayerIndex ?? 0, 10);
    currentLayerIndex = Number.isFinite(idx) ? Math.min(Math.max(idx, 0), layers.length - 1) : 0;
    editingBase = data.editingBase === true && baseCanvas.width > 0;

    lastGridW = width;
    lastGridH = height;
    if (gridWInput) gridWInput.value = String(width);
    if (gridHInput) gridHInput.value = String(height);

    baseVisible = data.baseVisible === false ? false : true;

    if (Array.isArray(data.colorHistory)) {
      colorHistory = data.colorHistory.filter(hex => /^#([0-9a-f]{6})$/i.test(hex));
    } else {
      colorHistory = [];
    }
    renderColorHistory();

    const bg = data.canvasBgStyle || canvasBgStyle || 'checker';
    updateBackgroundStyle(bg);

    if (layerSelect) {
      layerSelect.innerHTML = '';
      layers.forEach((ly, i) => {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = ly.name || `Layer ${i+1}`;
        if (!editingBase && i === currentLayerIndex) opt.selected = true;
        layerSelect.appendChild(opt);
      });
      if (!editingBase) {
        layerSelect.value = String(currentLayerIndex);
      }
    }

    if (editingBase) {
      selectBaseForEditing();
    } else {
      selectLayerForEditing(currentLayerIndex);
    }

    baseUndo = [];
    baseRedo = [];
    layers.forEach(ly => { ly.undo = []; ly.redo = []; });

    hasPaint = Boolean((baseImage && baseEntry?.image) || layerImages.some(({ entry }) => entry?.image));

    appMode = 'edit';

    renderLayerList();
    compositeOutput();
    updateStatus();

    return true;
  }

  async function restoreProjectFromStorage() {
    if (typeof localStorage === 'undefined') return false;
    const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!stored) return false;
    try {
      isRestoringProject = true;
      await deserializeProject(stored);
      return true;
    } catch (err) {
      console.warn('Failed to restore project', err);
      try {
        localStorage.removeItem(PROJECT_STORAGE_KEY);
      } catch (removeErr) {
        console.warn('Failed to clear broken project data', removeErr);
      }
      if (typeof alert === 'function') {
        alert('保存データの読み込みに失敗しました。新規プロジェクトを開始します。');
      }
      return false;
    } finally {
      isRestoringProject = false;
    }
  }

  await restoreProjectFromStorage();

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
      saveProjectState();
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
    saveProjectState();
  }

  function redoPaint() {
    if (editingBase) {
      if (baseRedo.length === 0) return;
      const cur = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
      const nxt = baseRedo.pop();
      baseUndo.push(cur);
      baseCtx.putImageData(nxt, 0, 0);
      compositeOutput();
      saveProjectState();
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
    saveProjectState();
  }

  function clearPaint() {
    if (!paintCanvas.width || !paintCanvas.height) return;
    pushPaintHistory();
    paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
    compositeOutput();
    hasPaint = false;
    saveProjectState();
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
    if (colorHistory.length > COLOR_HISTORY_MAX) colorHistory.pop();
    renderColorHistory();
  }

  function renderColorHistory() {
    if (!colorHistoryEl) {
      saveProjectState();
      return;
    }
    colorHistoryEl.innerHTML = '';
    colorHistory.forEach(hex => {
      const d = document.createElement('div');
      d.className = 'swatch'; d.title = hex; d.style.background = hex;
      d.addEventListener('click', () => {
        if (!colorInput) return;
        colorInput.value = hex;
        colorInput.dispatchEvent(new Event('input', { bubbles: true }));
      });
      colorHistoryEl.appendChild(d);
    });
    updateCurrentColorIndicator();
    saveProjectState();
  }

  function updateCurrentColorIndicator() {
    if (!colorHistoryEl) return;
    const curHex = (colorInput?.value || '').toLowerCase();
    const a = alphaInput ? parseInt(alphaInput.value||'255',10) : 255;
    const isSemi = a < 252;
    Array.from(colorHistoryEl.querySelectorAll('.swatch')).forEach(sw => {
      const bg = sw.title?.toLowerCase();
      const isCur = bg === curHex;
      sw.classList.toggle('is-current', !!isCur);
      sw.classList.toggle('semi', !!isCur && isSemi);
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
    const sizeChanged = (lastOutputSize.w !== gw) || (lastOutputSize.h !== gh);
    if (sizeChanged) {
      viewTransform.scale = 1;
      viewTransform.tx = 0;
      viewTransform.ty = 0;
      applyCanvasTransform();
    }
    lastOutputSize = { w: gw, h: gh };
    outputCtx.clearRect(0, 0, gw, gh);

    if (baseVisible) outputCtx.drawImage(baseCanvas, 0, 0);
    for (const ly of layers) {
      if (ly.visible === false) continue;
      outputCtx.drawImage(ly.canvas, 0, 0);
    }

    // Apply background to content areas
    const imageData = outputCtx.getImageData(0, 0, gw, gh);
    drawContentBackground(outputCtx, imageData);

    renderLayerList();
    fitOutputCanvas();
    saveProjectState();
  }

  function fitOutputCanvas() {
    if (!outputCanvas) return;
    const gw = outputCanvas.width || 0;
    const gh = outputCanvas.height || 0;
    if (!gw || !gh) return;
    const surface = outputSurface || outputCanvas.parentElement;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    let availW = Math.max(1, Math.floor(rect.width - 16));
    let availH = Math.max(1, Math.floor(rect.height - 16));
    const stackView = canvasArea && canvasArea.dataset.view === 'stack' && appMode === 'normalize';
    if (stackView) {
      availH = Number.POSITIVE_INFINITY;
    }

    // Check if mobile (768px or less)
    const isMobile = window.innerWidth <= 768;
    const minScale = isMobile ? 3 : 1; // Higher minimum scale on mobile

    const scale = Math.max(minScale, Math.floor(Math.min(availW / gw, availH / gh)));
    const cssW = gw * scale;
    const cssH = gh * scale;
    outputCanvas.style.width = cssW + 'px';
    outputCanvas.style.height = cssH + 'px';
    applyCanvasTransform();
  }

  function fitPreviewCanvas(viewBox) {
    if (!previewCanvas) return;
    const target = viewBox || lastViewBox;
    if (!target) return;
    const surface = previewSurface || previewCanvas.parentElement;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    let availW = Math.max(1, rect.width - 16);
    let availH = Math.max(1, rect.height - 16);
    const stackView = canvasArea && canvasArea.dataset.view === 'stack' && appMode === 'normalize';
    if (stackView) {
      availH = Number.POSITIVE_INFINITY;
    }
    const vw = Math.max(1, target.vw || previewCanvas.width || 1);
    const vh = Math.max(1, target.vh || previewCanvas.height || 1);
    const ratio = vw / vh;
    let cssW = availW;
    let cssH = cssW / ratio;
    if (cssH > availH) {
      cssH = availH;
      cssW = cssH * ratio;
    }
    cssW = Math.max(32, Math.round(cssW));
    cssH = Math.max(32, Math.round(cssH));
    previewCanvas.style.width = cssW + 'px';
    previewCanvas.style.height = cssH + 'px';
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
    const containers = [layerListEl, document.getElementById('layerListMobile'), layersListMobileFull].filter(Boolean);
    if (!containers.length) return;
    containers.forEach(container => {
      container.innerHTML = '';
      const items = [];
      items.push({ type: 'base' });
      for (let i = 0; i < layers.length; i++) items.push({ type: 'layer', index: i });
      for (let j = items.length - 1; j >= 0; j--) {
        const it = items[j];
        const el = document.createElement('div');
        el.className = 'layer-item';
        if (it.type === 'layer') { el.setAttribute('draggable', 'true'); el.dataset.index = String(it.index); }
        const thumb = document.createElement('div');
        thumb.className = 'layer-thumb';
        const t = document.createElement('canvas');
        t.width = LAYER_THUMB_SIZE;
        t.height = LAYER_THUMB_SIZE;
        const tctx = t.getContext('2d');
        tctx.imageSmoothingEnabled = false;
        const meta = document.createElement('div'); meta.className = 'layer-meta';
        const nameEl = document.createElement('div'); nameEl.className = 'layer-name';
        const tagsEl = document.createElement('div'); tagsEl.className = 'layer-tags';
        const eye = document.createElement('button'); eye.className = 'layer-eye'; eye.type = 'button';
        const dup = document.createElement('button');
        dup.type = 'button';
        dup.className = 'layer-btn';
        dup.title = '複製';
        dup.setAttribute('aria-label', 'レイヤーを複製');
        dup.innerHTML = LAYER_DUP_ICON;
        const merge = document.createElement('button');
        merge.type = 'button';
        merge.className = 'layer-btn';
        merge.title = '下と統合';
        merge.setAttribute('aria-label', '下のレイヤーと統合');
        merge.innerHTML = LAYER_MERGE_ICON;

        if (it.type === 'base') {
          nameEl.textContent = 'ベース'; tagsEl.textContent = '変換結果';
          if (baseVisible === false) el.classList.add('is-hidden');
          if (editingBase) el.classList.add('selected');
          if (baseCanvas.width && baseCanvas.height) tctx.drawImage(baseCanvas, 0, 0, LAYER_THUMB_SIZE, LAYER_THUMB_SIZE);
          updateLayerEyeButton(eye, baseVisible !== false);
          eye.addEventListener('click', (e) => {
            e.stopPropagation();
            baseVisible = !baseVisible;
            updateLayerEyeButton(eye, baseVisible !== false);
            compositeOutput();
          });
          el.addEventListener('click', () => { selectBaseForEditing(); compositeOutput(); updateStatus(); });
        } else {
          const ly = layers[it.index];
          nameEl.textContent = ly.name || `Layer ${it.index+1}`; tagsEl.textContent = '編集レイヤー';
          if (ly.visible === false) el.classList.add('is-hidden');
          if (!editingBase && currentLayerIndex === it.index) el.classList.add('selected');
          if (ly.canvas.width && ly.canvas.height) tctx.drawImage(ly.canvas, 0, 0, LAYER_THUMB_SIZE, LAYER_THUMB_SIZE);
          updateLayerEyeButton(eye, ly.visible !== false);
          eye.addEventListener('click', (e) => {
            e.stopPropagation();
            ly.visible = (ly.visible === false) ? true : false;
            updateLayerEyeButton(eye, ly.visible !== false);
            compositeOutput();
          });
          el.addEventListener('click', () => { selectLayerForEditing(it.index); if (layerSelect) layerSelect.value = String(it.index); compositeOutput(); updateStatus(); });
          nameEl.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const newName = prompt('レイヤー名を変更', ly.name || `レイヤー ${it.index+1}`);
            if (newName && newName.trim()) { ly.name = newName.trim(); compositeOutput(); }
          });
          dup.addEventListener('click', (e) => {
            e.stopPropagation();
            const gw = baseCanvas.width, gh = baseCanvas.height;
            const c = document.createElement('canvas'); c.width = gw; c.height = gh;
            const ctx = c.getContext('2d');
            ctx.drawImage(ly.canvas, 0, 0);
            const name = (ly.name || `レイヤー ${it.index+1}`) + ' コピー';
            layers.splice(it.index+1, 0, { name, canvas: c, ctx, undo: [], redo: [], visible: true });
            selectLayerForEditing(it.index+1);
            compositeOutput();
          });
          merge.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetIndex = it.index - 1;
            const src = layers[it.index];
            const srcName = ly.name || `レイヤー ${it.index+1}`;
            const destLayer = targetIndex >= 0 ? layers[targetIndex] : null;
            const destName = destLayer ? (destLayer.name || `レイヤー ${targetIndex+1}`) : 'ベース';
            const ok = confirm(`${srcName} を ${destName} と統合します。よろしいですか？`);
            if (!ok) return;
            if (targetIndex >= 0) {
              const dst = layers[targetIndex];
              dst.ctx.drawImage(src.canvas, 0, 0);
              layers.splice(it.index, 1);
              selectLayerForEditing(Math.max(0, targetIndex));
              compositeOutput();
            } else {
              // merge into base
              baseCtx.drawImage(src.canvas, 0, 0);
              layers.splice(it.index, 1);
              selectBaseForEditing();
              compositeOutput();
            }
          });

          // Drag & drop (desktop)
          el.addEventListener('dragstart', (ev) => {
            ev.dataTransfer.setData('text/plain', String(it.index));
            ev.dataTransfer.effectAllowed = 'move';
          });
          el.addEventListener('dragover', (ev) => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; });
          el.addEventListener('drop', (ev) => {
            ev.preventDefault();
            const from = parseInt(ev.dataTransfer.getData('text/plain')||'-1',10);
            const to = parseInt(el.dataset.index||'-1',10);
            if (isNaN(from) || isNaN(to) || from === to) return;
            const [moved] = layers.splice(from, 1);
            layers.splice(to, 0, moved);
            selectLayerForEditing(to);
            compositeOutput();
          });
        }

        thumb.appendChild(t);
        meta.appendChild(nameEl); meta.appendChild(tagsEl);
        el.appendChild(thumb); el.appendChild(meta); el.appendChild(eye);
        if (it.type === 'layer') { el.appendChild(dup); el.appendChild(merge); }
        container.appendChild(el);
      }
    });
  }

  // Source image canvas
  const srcCanvas = document.createElement('canvas');
  const srcCtx = srcCanvas.getContext('2d');

  let img = null;
  let appMode = 'normalize'; // 'normalize' | 'edit'
  let lastGridW = parseInt(gridWInput.value || '32', 10) || 32;
  let lastGridH = parseInt(gridHInput.value || '32', 10) || 32;
  let hasPaint = false;
  let sourceAspect = 1;
  let currentGridPresets = [];
  let lastViewBox = null;
  const VIEW_MODES = [
    { id: 'stack', label: '縦並び', icon: 'M6 6h12v4H6zM6 14h12v4H6z' },
    { id: 'split', label: '横並び', icon: 'M6 6h6v12H6zM12 6h6v12h-6z' },
    { id: 'output', label: '出力のみ', icon: 'M6 6h12v12H6z' }
  ];
  let convertViewMode = canvasArea?.dataset.view || 'stack';
  let currentViewIndex = Math.max(0, VIEW_MODES.findIndex(v => v.id === convertViewMode));

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

  // Draw background behind image content only (for transparent areas)
  function drawContentBackground(ctx, imageData) {
    if (canvasBgStyle === 'checker') return; // Skip for checker - handled by CSS

    ctx.save();

    // Set background fill style
    switch(canvasBgStyle) {
      case 'white':
        ctx.fillStyle = '#ffffff';
        break;
      case 'black':
        ctx.fillStyle = '#000000';
        break;
      default:
        ctx.restore();
        return;
    }

    // Create path for areas that have image content (non-fully-transparent)
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    ctx.globalCompositeOperation = 'destination-over';

    // Fill the background behind the entire canvas for now
    // This will be behind any image content
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  // (removed) createCheckerPattern: CSS handles checker background

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

    // Apply background only to content areas
    const imageData = previewCtx.getImageData(0, 0, pw, ph);
    drawContentBackground(previewCtx, imageData);

    // Grid overlay
    const drawGrid = !showGrid || showGrid.checked;
    if (drawGrid) {
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
    fitPreviewCanvas(view);
  }

  function applyViewModeToUI() {
    if (!canvasArea) return;
    const mode = VIEW_MODES[currentViewIndex] || VIEW_MODES[0];
    canvasArea.dataset.view = mode.id;
    if (viewToggleLabel) viewToggleLabel.textContent = mode.label;
    if (viewTogglePath) viewTogglePath.setAttribute('d', mode.icon);
    fitPreviewCanvas();
  }

  function setViewMode(mode) {
    const idx = VIEW_MODES.findIndex(v => v.id === mode);
    currentViewIndex = idx >= 0 ? idx : 0;
    if (appMode === 'normalize') convertViewMode = VIEW_MODES[currentViewIndex].id;
    applyViewModeToUI();
  }

  function cycleViewMode() {
    currentViewIndex = (currentViewIndex + 1) % VIEW_MODES.length;
    convertViewMode = VIEW_MODES[currentViewIndex].id;
    applyViewModeToUI();
  }

  function updateAspectBadge() {
    if (!gridWInput || !gridHInput) return;
    const gw = Math.max(1, parseInt(gridWInput.value || '1', 10));
    const gh = Math.max(1, parseInt(gridHInput.value || '1', 10));
    const text = simplifyAspectFromWH(gw, gh);
    if (gridAspect) gridAspect.value = text;
    if (gridAspectBadge) gridAspectBadge.textContent = text;
  }

  function highlightGridPreset() {
    if (!gridPresetList) return;
    const gw = Math.max(1, parseInt(gridWInput.value || '0', 10));
    const gh = Math.max(1, parseInt(gridHInput.value || '0', 10));
    gridPresetList.querySelectorAll('button').forEach(btn => {
      const bw = parseInt(btn.dataset.w || '0', 10);
      const bh = parseInt(btn.dataset.h || '0', 10);
      btn.classList.toggle('active', bw === gw && bh === gh);
    });
  }

  function buildGridPresets(ratio) {
    if (!gridPresetList) return;
    currentGridPresets = [];
    gridPresetList.innerHTML = '';
    const r = (!isFinite(ratio) || ratio <= 0) ? 1 : ratio;
    const longSides = [16, 24, 32, 48, 64, 96, 128, 160, 192, 224, 256];
    const seen = new Set();
    longSides.forEach(side => {
      let w;
      let h;
      if (r >= 1) {
        w = side;
        h = Math.max(1, Math.round(side / r));
      } else {
        h = side;
        w = Math.max(1, Math.round(side * r));
      }
      if (w > 256 || h > 256) return;
      const key = `${w}x${h}`;
      if (seen.has(key)) return;
      seen.add(key);
      currentGridPresets.push({ w, h });
    });
    if (currentGridPresets.length === 0) {
      currentGridPresets.push({ w: 32, h: 32 });
    }
    currentGridPresets.forEach(preset => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.w = String(preset.w);
      btn.dataset.h = String(preset.h);
      btn.textContent = `${preset.w} × ${preset.h}`;
      gridPresetList.appendChild(btn);
    });
    highlightGridPreset();
  }

  function applyPresetSelection(preference = 'nearest') {
    if (!currentGridPresets.length) return;
    let target = currentGridPresets[0];
    if (preference === 'nearest') {
      const currentW = Math.max(1, parseInt(gridWInput.value || '0', 10));
      target = currentGridPresets.reduce((best, preset) => {
        if (!best) return preset;
        const diff = Math.abs(preset.w - currentW);
        const bestDiff = Math.abs(best.w - currentW);
        return diff < bestDiff ? preset : best;
      }, currentGridPresets[0]);
    }
    gridWInput.value = String(target.w);
    gridHInput.value = String(target.h);
    updateAspectBadge();
    highlightGridPreset();
  }

  function setAspectRatio(ratio) {
    const approx = approximateAspect(ratio || 1);
    const text = `${approx.w}:${approx.h}`;
    if (gridAspect) gridAspect.value = text;
    if (gridAspectBadge) gridAspectBadge.textContent = text;
  }

  function syncOffsetRanges() {
    const LIM = 500; // Reduced from 10000 to 500 for better slider usability
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

  function approximateAspect(ratio) {
    if (!isFinite(ratio) || ratio <= 0) return { w: 1, h: 1 };
    let best = { w: 1, h: 1, err: Math.abs(ratio - 1) };
    for (let h = 1; h <= 64; h++) {
      const w = Math.max(1, Math.round(ratio * h));
      const approx = w / h;
      const err = Math.abs(approx - ratio);
      if (err < best.err) best = { w, h, err };
    }
    return { w: best.w, h: best.h };
  }

  function simplifyAspectFromWH(w, h) {
    const a = Math.max(1, Math.round(w));
    const b = Math.max(1, Math.round(h));
    const gcd = (x, y) => (y ? gcd(y, x % y) : x);
    const g = gcd(a, b);
    return `${Math.round(a / g)}:${Math.round(b / g)}`;
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
    lastViewBox = view;
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

      sourceAspect = img.naturalWidth / img.naturalHeight;
      setAspectRatio(sourceAspect);
      if (aspectPreset) aspectPreset.value = 'auto';
      buildGridPresets(sourceAspect);
      applyPresetSelection('nearest');
      updateAspectBadge();
      highlightGridPreset();

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
          applyGridResize(newW, newH);
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

  function applyGridResize(newW, newH) {
    lastGridW = newW;
    lastGridH = newH;
    hasPaint = false;
    baseUndo = [];
    baseRedo = [];
    baseCanvas.width = newW;
    baseCanvas.height = newH;
    baseCtx.clearRect(0, 0, newW, newH);
    layers.forEach(ly => {
      ly.canvas.width = newW;
      ly.canvas.height = newH;
      ly.ctx.clearRect(0, 0, newW, newH);
      ly.undo = [];
      ly.redo = [];
    });
    if (editingBase) {
      paintCanvas = baseCanvas;
      paintCtx = baseCtx;
    } else if (layers[currentLayerIndex]) {
      paintCanvas = layers[currentLayerIndex].canvas;
      paintCtx = layers[currentLayerIndex].ctx;
    }
  }
  gridWInput.addEventListener('input', () => {
    if (adjustingGridFlag) return;
    adjustingGridFlag = true;
    applyGridLock('W');
    adjustingGridFlag = false;
    render();
    updateAspectBadge();
    highlightGridPreset();
  });
  gridHInput.addEventListener('input', () => {
    if (adjustingGridFlag) return;
    adjustingGridFlag = true;
    applyGridLock('H');
    adjustingGridFlag = false;
    render();
    updateAspectBadge();
    highlightGridPreset();
  });
  gridAspect.addEventListener('change', () => {
    applyGridLock('W');
    render();
    updateAspectBadge();
    highlightGridPreset();
  });

  if (gridLockAspect) {
    gridLockAspect.addEventListener('change', () => {
      if (gridLockAspect.checked) {
        updateAspectBadge();
        highlightGridPreset();
      }
    });
  }

  if (gridPresetList) {
    gridPresetList.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const w = parseInt(btn.dataset.w || '0', 10);
      const h = parseInt(btn.dataset.h || '0', 10);
      if (!w || !h) return;
      if (appMode === 'edit' && (w !== lastGridW || h !== lastGridH)) {
        const ok = confirm('グリッドサイズ（画像サイズ）を変更すると、ペイントはクリアされます。続行しますか？');
        if (!ok) return;
        applyGridResize(w, h);
      }
      gridWInput.value = String(w);
      gridHInput.value = String(h);
      updateAspectBadge();
      highlightGridPreset();
      render();
    });
  }

  if (aspectPreset) {
    aspectPreset.addEventListener('change', () => {
      let ratio = sourceAspect;
      if (aspectPreset.value && aspectPreset.value !== 'auto') {
        ratio = parseAspect(aspectPreset.value) || ratio;
      }
      setAspectRatio(ratio);
      buildGridPresets(ratio);
      applyPresetSelection(aspectPreset.value === 'auto' ? 'nearest' : 'first');
      highlightGridPreset();
      render();
    });
  }

  if (viewToggleBtn) {
    viewToggleBtn.addEventListener('click', () => {
      if (appMode !== 'normalize') return;
      cycleViewMode();
    });
  }

  downloadBtn.addEventListener('click', exportPNG);
  undoBtn.addEventListener('click', undoPaint);
  redoBtn.addEventListener('click', redoPaint);
  clearPaintBtn.addEventListener('click', clearPaint);
  if (openFileBtn) {
    openFileBtn.addEventListener('click', () => {
      console.log('Open file button clicked');
      if (fileInput) {
        console.log('File input found, triggering click');
        // Reset value so selecting the same file triggers a change event again
        fileInput.value = '';
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
      saveProjectState();
    });
  }
  // Mobile bottom bar handlers
  if (mobileUndo) mobileUndo.addEventListener('click', () => undoPaint());
  if (mobileRedo) mobileRedo.addEventListener('click', () => redoPaint());
  if (mobileBrushDec) mobileBrushDec.addEventListener('click', () => {
    if (!brushSizeInput) return;
    const v = Math.max(1, Math.min(16, (parseInt(brushSizeInput.value||'1',10)||1) - 1));
    brushSizeInput.value = String(v);
    updateMobileBrushUI();
  });
  if (mobileBrushInc) mobileBrushInc.addEventListener('click', () => {
    if (!brushSizeInput) return;
    const v = Math.max(1, Math.min(16, (parseInt(brushSizeInput.value||'1',10)||1) + 1));
    brushSizeInput.value = String(v);
    updateMobileBrushUI();
  });
  if (mobileColorBtn) {
    mobileColorBtn.addEventListener('click', () => {
      if (mobileColorInputField) {
        if (typeof mobileColorInputField.showPicker === 'function') {
          mobileColorInputField.showPicker();
        } else {
          mobileColorInputField.click();
        }
      } else if (colorInput) {
        colorInput.click();
      }
    });
  }
  if (mobileColorInputField) {
    mobileColorInputField.addEventListener('input', () => {
      const value = mobileColorInputField.value;
      if (colorInput) {
        colorInput.value = value;
        colorInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }
  if (layersToggleMobile && layersModal) layersToggleMobile.addEventListener('click', (e) => {
    e.stopPropagation();
    layersModal.classList.remove('hidden');
    renderLayerList();
  });
  if (closeLayersModal && layersModal) closeLayersModal.addEventListener('click', () => {
    layersModal.classList.add('hidden');
  });
  if (layersModal) layersModal.addEventListener('click', (e) => {
    if (e.target === layersModal) layersModal.classList.add('hidden');
  });
  if (addLayerBtnMobile2) addLayerBtnMobile2.addEventListener('click', () => {
    const gw = baseCanvas.width || (parseInt(gridWInput.value||'32',10) || 32);
    const gh = baseCanvas.height || (parseInt(gridHInput.value||'32',10) || 32);
    const c = document.createElement('canvas'); c.width = gw; c.height = gh;
    const ctx = c.getContext('2d');
    const name = `レイヤー ${layers.length+1}`;
    layers.push({ name, canvas: c, ctx, undo: [], redo: [], visible: true });
    selectLayerForEditing(layers.length - 1);
    compositeOutput();
    saveProjectState();
  });
  if (removeLayerBtnMobile2) removeLayerBtnMobile2.addEventListener('click', () => {
    if (editingBase) { alert('ベースは削除できません'); return; }
    if (layers.length <= 1) { alert('最低1つのレイヤーが必要です'); return; }
    layers.splice(currentLayerIndex, 1);
    selectLayerForEditing(Math.max(0, currentLayerIndex - 1));
    compositeOutput();
    saveProjectState();
  });
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
      saveProjectState();
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
      convertViewMode = VIEW_MODES[currentViewIndex]?.id || convertViewMode;
      setViewMode('output');
      lastGridW = parseInt(gridWInput.value || '32', 10) || 32;
      lastGridH = parseInt(gridHInput.value || '32', 10) || 32;
      // 初期はユーザー用レイヤーから編集を始める
      if (layers.length > 0) {
        selectLayerForEditing(0);
        if (layerSelect) layerSelect.value = '0';
      } else {
        selectBaseForEditing();
      }
      if (toolSelect) {
        toolSelect.value = 'pen';
        toolSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      syncToolButtons();
      compositeOutput();
    }
    if (mode === 'normalize') {
      setViewMode(convertViewMode);
    }
    updateModeUI();
    if (mode === 'normalize') {
      render();
    }
    saveProjectState();
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
    colorInput.addEventListener('input', () => {
      if (mobileColorInputField) mobileColorInputField.value = colorInput.value;
      updateCurrentColorIndicator();
      updateMobileColorChip();
    });
  }
  if (alphaInput) {
    alphaInput.addEventListener('input', () => { updateCurrentColorIndicator(); updateMobileColorChip(); });
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
    const target = editingBase ? 'ベース' : `レイヤー${currentLayerIndex+1}`;
    const col = colorInput?.value || '#000000';
    const a = alphaInput ? parseInt(alphaInput.value||'255',10) : 255;
    statusText.textContent = 'ツール: ' + tool + ' | グリッド: ' + gw + '×' + gh + ' | 対象: ' + target + ' | 色: ' + col + ' / α:' + a;
  }

  // Removed legacy stepper handlers (buttons not present in UI)

  // Init
  updateQualityLabel();
  updateModeUI();
  updateAspectBadge();
  buildGridPresets(parseAspect(gridAspect?.value) || 1);
  highlightGridPreset();
  applyViewModeToUI();
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
  // Init mobile UI indicators
  updateMobileBrushUI();
  updateMobileColorChip();
  if (mobileColorInputField && colorInput) mobileColorInputField.value = colorInput.value;

  // Grid visibility toggle
  if (showGrid) {
    showGrid.addEventListener('change', () => {
      if (appMode === 'normalize') render();
    });
  }

  // Drag to pan on preview (updates center-relative offsets)
  let dragging = false;
  let dragStart = null;
  function pvRect() { return previewCanvas.getBoundingClientRect(); }
  function pvDown(e){ e.preventDefault(); dragging=true; const r=pvRect(); const x=e.clientX-r.left, y=e.clientY-r.top; dragStart={x,y,ox:parseInt(offsetXInput.value||'0',10),oy:parseInt(offsetYInput.value||'0',10)}; }
  function pvMove(e){ if(!dragging) return; e.preventDefault(); const r=pvRect(); const x=e.clientX-r.left, y=e.clientY-r.top; const dx=x-dragStart.x, dy=y-dragStart.y; const view=getViewBox(); if(!view) return; const pw=previewCanvas.width, ph=previewCanvas.height; const vx=Math.round(dx*(view.vw/pw)); const vy=Math.round(dy*(view.vh/ph)); const newOx=dragStart.ox+vx, newOy=dragStart.oy+vy; offsetXInput.value=String(newOx); offsetYInput.value=String(newOy); offsetXRange.value=String(newOx); offsetYRange.value=String(newOy); render(); }
  function pvUp(){ dragging=false; dragStart=null; }
  if (window.PointerEvent){ previewCanvas.addEventListener('pointerdown', pvDown); window.addEventListener('pointermove', pvMove); window.addEventListener('pointerup', pvUp); window.addEventListener('pointercancel', pvUp);} else { previewCanvas.addEventListener('mousedown', pvDown); window.addEventListener('mousemove', pvMove); window.addEventListener('mouseup', pvUp); }

  // Painting on output (grid) canvas
  let painting = false;
  let moving = false;
  let moveStart = null;
  let moveSnapshot = null;
  let startPoint = null;
  let previewActive = false;
  let longPressTimer = null;
  let longPressActive = false;
  const LONG_PRESS_MS = 400;
  const gesturePointers = new Map();
  let gestureStart = null;
  let touchGestureActive = false;
  let activePaintPointerId = null;
  let activeMovePointerId = null;
  const viewTransform = { scale: 1, tx: 0, ty: 0 };
  let lastOutputSize = { w: 0, h: 0 };
  const MIN_TOUCH_SCALE = 0.2;
  const MAX_TOUCH_SCALE = 16;

  function applyCanvasTransform() {
    if (!outputCanvas) return;
    outputCanvas.style.transform = `translate(${viewTransform.tx}px, ${viewTransform.ty}px) scale(${viewTransform.scale})`;
  }
  applyCanvasTransform();
  function ocRect(){ return outputCanvas.getBoundingClientRect(); }
  function ocCoords(e){ const r=ocRect(); const x=e.clientX-r.left, y=e.clientY-r.top; return { gx: Math.floor(x*(outputCanvas.width/r.width)), gy: Math.floor(y*(outputCanvas.height/r.height)) }; }
  function getGestureMetrics() {
    if (!outputSurface || gesturePointers.size < 2) return null;
    const rect = outputSurface.getBoundingClientRect();
    const pts = Array.from(gesturePointers.values()).map(p => ({ x: p.x - rect.left, y: p.y - rect.top }));
    const cx = (pts[0].x + pts[1].x) / 2;
    const cy = (pts[0].y + pts[1].y) / 2;
    const dx = pts[1].x - pts[0].x;
    const dy = pts[1].y - pts[0].y;
    const dist = Math.hypot(dx, dy);
    return { cx, cy, dist };
  }

  function beginGesture() {
    const metrics = getGestureMetrics();
    if (!metrics) return;
    gestureStart = { ...metrics, tx: viewTransform.tx, ty: viewTransform.ty, scale: viewTransform.scale };
    touchGestureActive = true;
  }

  function updateGesture() {
    if (!gestureStart) return;
    const metrics = getGestureMetrics();
    if (!metrics || metrics.dist <= 0) return;
    const nextScale = clamp(gestureStart.scale * (metrics.dist / gestureStart.dist), MIN_TOUCH_SCALE, MAX_TOUCH_SCALE);
    const scaleRatio = nextScale / gestureStart.scale;
    const tx = metrics.cx - scaleRatio * (gestureStart.cx - gestureStart.tx);
    const ty = metrics.cy - scaleRatio * (gestureStart.cy - gestureStart.ty);
    viewTransform.scale = nextScale;
    viewTransform.tx = tx;
    viewTransform.ty = ty;
    applyCanvasTransform();
  }

  function resetGestureIfNeeded(pointerId) {
    gesturePointers.delete(pointerId);
    if (gesturePointers.size >= 2) {
      beginGesture();
    } else {
      gestureStart = null;
      touchGestureActive = false;
    }
  }

  function cancelPaintingForGesture() {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    longPressActive = false;
    if (moving) {
      const targetCtx = editingBase ? baseCtx : paintCtx;
      const targetCanvas = editingBase ? baseCanvas : paintCanvas;
      if (moveSnapshot && targetCtx && targetCanvas) {
        targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        targetCtx.putImageData(moveSnapshot, 0, 0);
        compositeOutput();
      }
      moving = false;
      moveSnapshot = null;
      moveStart = null;
      activeMovePointerId = null;
    }
    if (painting) {
      if (startPoint) {
        if (previewActive) { compositeOutput(); previewActive = false; }
        startPoint = null;
      } else if (activePaintPointerId != null) {
        undoPaint();
      }
      painting = false;
      activePaintPointerId = null;
    }
  }
  function ocDown(e){
    e.preventDefault();
    if (appMode !== 'edit') return; // 編集モードのみ描画可能
    if (!paintCanvas || !paintCanvas.width) return;
    if (outputCanvas.setPointerCapture) {
      try { outputCanvas.setPointerCapture(e.pointerId); } catch (err) {}
    }

    if (e.pointerType === 'touch') {
      gesturePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (gesturePointers.size >= 2) {
        cancelPaintingForGesture();
        beginGesture();
        return;
      }
    }
    if (touchGestureActive) return;

    const { gx, gy } = ocCoords(e);
    const tool = toolSelect.value;
    if (tool === 'move') {
      pushPaintHistory();
      moving = true;
      activeMovePointerId = e.pointerId;
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
      updateCurrentColorIndicator();
      updateMobileColorChip();
      return;
    }
    // Long-press temporary picker
    longPressActive = false;
    longPressTimer = (tool === 'move') ? null : setTimeout(() => {
      const [r,g,b,a] = getCompositePixel(gx, gy);
      colorInput.value = `#${((1<<24) + (r<<16) + (g<<8) + b).toString(16).slice(1)}`;
      alphaInput.value = String(a);
      updateCurrentColorIndicator();
      updateMobileColorChip();
      longPressActive = true;
    }, LONG_PRESS_MS);

    if (tool === 'fill') {
      pushPaintHistory();
      addColorToHistory(colorInput.value);
      floodFill(gx, gy, getCurrentColor());
      compositeOutput();
      return;
    }

    if (tool === 'line' || tool === 'rect') {
      startPoint = { x: gx, y: gy };
      painting = true;
      activePaintPointerId = e.pointerId;
      previewActive = true;
      return;
    }

    pushPaintHistory();
    painting = true;
    activePaintPointerId = e.pointerId;
    const rgba = (tool === 'eraser') ? [0,0,0,0] : getCurrentColor();
    if (tool !== 'eraser') addColorToHistory(colorInput.value);
    drawBrush(gx, gy, rgba);
    compositeOutput();
  }
  function ocMove(e){
    if (appMode !== 'edit') return;

    if (e.pointerType === 'touch' && gesturePointers.has(e.pointerId)) {
      gesturePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (gesturePointers.size >= 2) {
        e.preventDefault();
        updateGesture();
        return;
      }
    }
    if (touchGestureActive) return;

    const tool = toolSelect.value;
    if (tool === 'move') {
      if (!moving || !moveSnapshot || e.pointerId !== activeMovePointerId) return;
      e.preventDefault();
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
    if (!painting || e.pointerId !== activePaintPointerId) return;
    const { gx, gy } = ocCoords(e);
    e.preventDefault();
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    if (tool === 'line' || tool === 'rect') {
      if (startPoint) drawPreviewOverlay(tool, startPoint.x, startPoint.y, gx, gy);
      return;
    }
    const rgba = (tool === 'eraser') ? [0,0,0,0] : getCurrentColor();
    drawBrush(gx, gy, rgba);
    compositeOutput();
  }
  function ocUp(e){
    if (appMode !== 'edit') return;
    if (e.pointerType === 'touch' && gesturePointers.has(e.pointerId)) {
      resetGestureIfNeeded(e.pointerId);
    }
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }

    const tool = toolSelect.value;

    if (moving && e.pointerId === activeMovePointerId) {
      moving = false;
      moveSnapshot = null;
      moveStart = null;
      activeMovePointerId = null;
      return;
    }
    if (moving && e.pointerId !== activeMovePointerId) return;

    if (e.pointerId !== activePaintPointerId) return;

    if (tool === 'line' || tool === 'rect') {
      if (previewActive) { compositeOutput(); previewActive = false; }
      if (startPoint) {
        const { gx, gy } = ocCoords(e);
        pushPaintHistory();
        addColorToHistory(colorInput.value);
        if (tool === 'line') {
          drawLine(startPoint.x, startPoint.y, gx, gy, getCurrentColor());
        } else {
          drawRect(startPoint.x, startPoint.y, gx, gy, getCurrentColor());
        }
        compositeOutput();
      }
    }
    painting = false;
    startPoint = null;
    activePaintPointerId = null;
    longPressActive = false;
  }
  if (window.PointerEvent){ outputCanvas.addEventListener('pointerdown', ocDown); window.addEventListener('pointermove', ocMove); window.addEventListener('pointerup', ocUp); window.addEventListener('pointercancel', ocUp);} else { outputCanvas.addEventListener('mousedown', ocDown); window.addEventListener('mousemove', ocMove); window.addEventListener('mouseup', ocUp); }

  if (outputSurface) {
    outputSurface.addEventListener('wheel', (e) => {
      if (!outputCanvas) return;
      if (appMode !== 'edit') return;
      e.preventDefault();
      const rect = outputSurface.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const nextScale = clamp(viewTransform.scale * factor, MIN_TOUCH_SCALE, MAX_TOUCH_SCALE);
      if (nextScale === viewTransform.scale) return;
      const ratio = nextScale / viewTransform.scale;
      viewTransform.tx = cx - ratio * (cx - viewTransform.tx);
      viewTransform.ty = cy - ratio * (cy - viewTransform.ty);
      viewTransform.scale = nextScale;
      applyCanvasTransform();
    }, { passive: false });
  }

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

  // Resize handling to keep canvases scaled nicely
  const handleSurfaceResize = () => {
    fitOutputCanvas();
    fitPreviewCanvas();
  };
  window.addEventListener('resize', handleSurfaceResize);
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => handleSurfaceResize());
    if (outputSurface) ro.observe(outputSurface);
    if (previewSurface) ro.observe(previewSurface);
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
  function updateBackgroundStyle(bgType) {
    canvasBgStyle = bgType;

    // Update both preview and output surfaces
    [previewSurface, outputSurface].forEach(surface => {
      if (!surface) return;

      const bgButtons = surface.parentElement.querySelectorAll('.bg-btn');

      // Update active state for buttons
      bgButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.bg === bgType);
      });

      // Reset classes and inline background first
      surface.className = 'canvas-surface';
      surface.style.background = '';
      surface.style.backgroundColor = '';
      switch(bgType) {
        case 'white':
          surface.classList.add('bg-white');
          break;
        case 'black':
          surface.classList.add('bg-black');
          break;
        case 'checker':
        default:
          surface.classList.add('checker');
          break;
      }
    });

    // Redraw both canvases
    if (img) {
      const view = getViewBox();
      if (view) {
        lastViewBox = view;
        drawPreview(view);
        compositeOutput();
      }
    }
    saveProjectState();
  }

  function setupBackgroundSelector(surface) {
    if (!surface) return;

    const bgButtons = surface.parentElement.querySelectorAll('.bg-btn');

    bgButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        updateBackgroundStyle(btn.dataset.bg);
      });
    });
  }

  // Set default background after setup
  function initializeBackground() {
    updateBackgroundStyle(canvasBgStyle || 'checker');
  }

  // Initialize background selectors
  setupBackgroundSelector(outputSurface);
  initializeBackground();

  // Layers popover (mobile-friendly)
  const layersToggle = document.getElementById('layersToggle');
  const layersPopover = document.getElementById('layersPopover');
  const addLayerBtnMobile = document.getElementById('addLayerBtnMobile');
  const removeLayerBtnMobile = document.getElementById('removeLayerBtnMobile');
  if (layersToggle) {
    layersToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMobile = window.innerWidth <= 768;
      if (isMobile && layersModal) {
        layersModal.classList.remove('hidden');
        renderLayerList();
      } else if (layersPopover) {
        layersPopover.classList.toggle('hidden');
        if (!layersPopover.classList.contains('hidden')) renderLayerList();
      }
    });
  }
  if (layersPopover) {
    document.addEventListener('click', (e) => {
      if (!layersPopover.classList.contains('hidden')) {
        if (!e.target.closest('#layersPopover') && !e.target.closest('#layersToggle')) {
          layersPopover.classList.add('hidden');
        }
      }
    });
  }
  if (addLayerBtnMobile) {
    addLayerBtnMobile.addEventListener('click', () => {
      const gw = baseCanvas.width || (parseInt(gridWInput.value||'32',10) || 32);
      const gh = baseCanvas.height || (parseInt(gridHInput.value||'32',10) || 32);
      const c = document.createElement('canvas'); c.width = gw; c.height = gh;
      const ctx = c.getContext('2d');
      const name = `レイヤー ${layers.length+1}`;
      layers.push({ name, canvas: c, ctx, undo: [], redo: [], visible: true });
      selectLayerForEditing(layers.length - 1);
      compositeOutput();
      saveProjectState();
    });
  }
  if (removeLayerBtnMobile) {
    removeLayerBtnMobile.addEventListener('click', () => {
      if (editingBase) { alert('ベースは削除できません'); return; }
      if (layers.length <= 1) { alert('最低1つのレイヤーが必要です'); return; }
      layers.splice(currentLayerIndex, 1);
      selectLayerForEditing(Math.max(0, currentLayerIndex - 1));
      compositeOutput();
      saveProjectState();
    });
  }

  // Keyboard shortcuts (desktop)
  document.addEventListener('keydown', (e) => {
    const tag = (e.target?.tagName || '').toLowerCase();
    const isTyping = tag === 'input' || tag === 'textarea' || (e.target?.isContentEditable);
    if (isTyping) return;
    const k = e.key.toLowerCase();
    const meta = e.metaKey || e.ctrlKey;
    if (meta && k === 'z') { e.preventDefault(); if (e.shiftKey) redoPaint(); else undoPaint(); return; }
    if (k === 'z' && !e.shiftKey && !meta) { e.preventDefault(); undoPaint(); return; }
    if (k === 'z' && e.shiftKey && !meta) { e.preventDefault(); redoPaint(); return; }
    const map = { b:'pen', e:'eraser', i:'picker', l:'line', r:'rect', g:'fill', v:'move' };
    if (map[k]) {
      toolSelect.value = map[k];
      toolSelect.dispatchEvent(new Event('change', { bubbles: true }));
      e.preventDefault();
    }
  });
})();
  function drawPreviewOverlay(tool, x0, y0, x1, y1) {
    // redraw composite, then overlay pixels as cyan
    compositeOutput();
    outputCtx.save();
    outputCtx.imageSmoothingEnabled = false;
    outputCtx.globalAlpha = 0.9;
    outputCtx.fillStyle = 'rgba(34,197,94,0.9)'; // accent green for consistency
    const put = (x,y)=>{ if (x>=0&&y>=0&&x<outputCanvas.width&&y<outputCanvas.height) outputCtx.fillRect(x,y,1,1); };
    if (tool === 'line') {
      let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
      let sx = x0 < x1 ? 1 : -1;
      let sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;
      let cx = x0, cy = y0;
      while (true) {
        put(cx, cy);
        if (cx === x1 && cy === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; cx += sx; }
        if (e2 < dx) { err += dx; cy += sy; }
      }
    } else if (tool === 'rect') {
      const left = Math.min(x0, x1), right = Math.max(x0, x1);
      const top = Math.min(y0, y1), bottom = Math.max(y0, y1);
      for (let x = left; x <= right; x++) { put(x, top); put(x, bottom); }
      for (let y = top; y <= bottom; y++) { put(left, y); put(right, y); }
    }
    outputCtx.restore();
  }
