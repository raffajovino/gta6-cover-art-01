// VICE HEAT Cover Studio: wires the editor. Pick photos, choose a layout
// and a grade, write the caption, crop each panel, export the cover as a
// PNG in the common post sizes. Photos are read on this machine and never
// leave it. A `?shot=` query sets up a fixed scene for a screenshot.
import { drawCover } from './cover.js';
import { LAYOUTS, layoutById } from './layouts.js';
import { GRADES, gradeById } from './grades.js';
import { runShot } from './shots.js';

const SIZES = [
  { id: '1080x1080', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: '1920 × 1080', w: 1920, h: 1080 },
];

const SAMPLES = [
  { name: 'boulevard.jpg', url: 'samples/boulevard.jpg' },
  { name: 'pier.jpg', url: 'samples/pier.jpg' },
];

const state = {
  photos: [],
  panels: [],
  layoutId: 'comic',
  gradeId: 'sunset',
  title: 'Vice Heat',
  subtitle: 'Vice City Nights',
  sizeId: '1920x1080',
  selected: 0,
};

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const statusEl = $('status');

function sizeById(id) {
  return SIZES.find((s) => s.id === id) || SIZES[2];
}

function currentLayout() {
  return layoutById(state.layoutId);
}

function currentGrade() {
  return gradeById(state.gradeId);
}

/** Resets the panel crops for the current layout, cycling the photos.
 * Wide panels default to the photo's upper third (where faces are), tall
 * panels to its centre, so a fresh cover already frames people well. */
function resetPanels() {
  const layout = currentLayout();
  const fxCycle = [0.5, 0.62, 0.38, 0.55, 0.45];
  const zoomCycle = [1, 1.3, 1.2, 1.45, 1.15];
  state.panels = layout.panels.map((p, i) => {
    const photo = state.photos[i % state.photos.length];
    let fy = 0.5;
    if (photo && photo.img) {
      const photoAspect = photo.img.naturalWidth / photo.img.naturalHeight;
      const panelAspect = p.w / p.h;
      if (panelAspect > photoAspect * 1.25) fy = 0.32;
    }
    return {
      photo: state.photos.length ? i % state.photos.length : 0,
      zoom: zoomCycle[i % zoomCycle.length],
      fx: fxCycle[i % fxCycle.length],
      fy,
    };
  });
  state.selected = 0;
}

/** The cover state the renderer draws. */
function coverState() {
  return {
    layout: currentLayout(),
    grade: currentGrade(),
    photos: state.photos,
    panels: state.panels,
    title: state.title,
    subtitle: state.subtitle,
  };
}

/** Sizes the preview canvas to the export aspect and redraws the cover. */
function redraw() {
  const size = sizeById(state.sizeId);
  const scale = Math.min(1, 900 / Math.max(size.w, size.h));
  const w = Math.round(size.w * scale);
  const h = Math.round(size.h * scale);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  drawCover(ctx, coverState(), w, h);
  syncPanelControls();
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Adds a photo (already an Image) to the strip and the panel menus. */
function addPhoto(name, img) {
  if (state.photos.length >= 6) {
    statusEl.textContent = 'Six photos at most — remove one first.';
    return;
  }
  state.photos.push({ name, img });
  renderPhotoStrip();
  renderPanelPhotoSelect();
}

/** Loads the two built-in samples so the studio works with no upload. */
async function loadSamples() {
  for (const s of SAMPLES) {
    if (state.photos.some((p) => p.name === s.name)) continue;
    try {
      const img = await loadImage(s.url);
      state.photos.push({ name: s.name, img });
    } catch {
      // A missing sample never breaks the editor; uploads still work.
    }
  }
  resetPanels();
  renderPhotoStrip();
  renderPanelPhotoSelect();
  redraw();
}

function renderPhotoStrip() {
  const strip = $('photostrip');
  strip.innerHTML = '';
  state.photos.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.title = `${p.name} — tap to put it in the selected panel`;
    const img = document.createElement('img');
    img.src = p.img.src;
    img.alt = p.name;
    b.appendChild(img);
    b.addEventListener('click', () => {
      const panel = state.panels[state.selected];
      if (panel) {
        panel.photo = i;
        renderPanelPhotoSelect();
        redraw();
      }
    });
    strip.appendChild(b);
  });
  const count = $('photocount');
  if (count) count.textContent = `${state.photos.length} photo${state.photos.length === 1 ? '' : 's'} loaded`;
}

function renderPanelPhotoSelect() {
  const sel = $('panelphoto');
  sel.innerHTML = '';
  state.photos.forEach((p, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = `Photo ${i + 1} — ${p.name}`;
    sel.appendChild(o);
  });
  const panel = state.panels[state.selected];
  if (panel) sel.value = String(panel.photo);
}

/** Builds the panel picker buttons for the current layout. */
function renderPanelPicker() {
  const picker = $('panelpicker');
  picker.innerHTML = '';
  currentLayout().panels.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'panelbtn' + (i === state.selected ? ' on' : '');
    b.textContent = `P${i + 1}`;
    b.addEventListener('click', () => {
      state.selected = i;
      renderPanelPicker();
      redraw();
    });
    picker.appendChild(b);
  });
}

/** Reflects the selected panel's crop in the sliders. */
function syncPanelControls() {
  const panel = state.panels[state.selected];
  renderPanelPicker();
  if (!panel) return;
  $('zoom').value = String(Math.round(panel.zoom * 100));
  $('zoomval').textContent = `${Math.round(panel.zoom * 100)}%`;
  $('panx').value = String(Math.round(panel.fx * 100));
  $('panxval').textContent = `${Math.round(panel.fx * 100)}%`;
  $('pany').value = String(Math.round(panel.fy * 100));
  $('panyval').textContent = `${Math.round(panel.fy * 100)}%`;
  const sel = $('panelphoto');
  if (sel) sel.value = String(panel.photo);
}

/** Renders the cover at full export size and downloads it as a PNG. */
function exportCover(size) {
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off.getContext('2d'), coverState(), size.w, size.h);
  off.toBlob((blob) => {
    if (!blob) {
      statusEl.textContent = 'Export failed — try again.';
      return;
    }
    const name = `vice-heat-${size.w}x${size.h}.png`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    window.__lastExport = { width: size.w, height: size.h, bytes: blob.size, name };
    statusEl.textContent = `Saved ${name} (${size.w} × ${size.h}, ${Math.round(blob.size / 1024)} KiB)`;
  }, 'image/png');
}

// --- Controls -------------------------------------------------------------

$('addphotos').addEventListener('change', async (e) => {
  const files = [...e.target.files].slice(0, 4);
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      addPhoto(file.name, img);
    } catch {
      // A file that is not a readable image is skipped, not fatal.
    }
  }
  resetPanels();
  redraw();
  e.target.value = '';
});

$('loadsamples').addEventListener('click', () => {
  loadSamples();
  statusEl.textContent = 'Samples loaded — pick a layout and export.';
});

$('layoutbtns').addEventListener('click', (e) => {
  const b = e.target.closest('[data-layout]');
  if (!b) return;
  state.layoutId = b.dataset.layout;
  resetPanels();
  document.querySelectorAll('#layoutbtns button').forEach((x) => x.classList.toggle('on', x === b));
  redraw();
});

$('gradebtns').addEventListener('click', (e) => {
  const b = e.target.closest('[data-grade]');
  if (!b) return;
  state.gradeId = b.dataset.grade;
  document.querySelectorAll('#gradebtns button').forEach((x) => x.classList.toggle('on', x === b));
  redraw();
});

$('title').addEventListener('input', (e) => {
  state.title = e.target.value;
  redraw();
});
$('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});

$('panelphoto').addEventListener('change', (e) => {
  const panel = state.panels[state.selected];
  if (panel) {
    panel.photo = Number(e.target.value);
    redraw();
  }
});

$('zoom').addEventListener('input', (e) => {
  const panel = state.panels[state.selected];
  if (panel) {
    panel.zoom = Number(e.target.value) / 100;
    redraw();
  }
});
$('panx').addEventListener('input', (e) => {
  const panel = state.panels[state.selected];
  if (panel) {
    panel.fx = Number(e.target.value) / 100;
    redraw();
  }
});
$('pany').addEventListener('input', (e) => {
  const panel = state.panels[state.selected];
  if (panel) {
    panel.fy = Number(e.target.value) / 100;
    redraw();
  }
});

$('sizebtns').addEventListener('click', (e) => {
  const b = e.target.closest('[data-size]');
  if (!b) return;
  state.sizeId = b.dataset.size;
  document.querySelectorAll('#sizebtns button').forEach((x) => x.classList.toggle('on', x === b));
  redraw();
});

$('exportbtns').addEventListener('click', (e) => {
  const b = e.target.closest('[data-export]');
  if (!b) return;
  exportCover(sizeById(b.dataset.export));
});

// Click a panel in the preview to select it; drag to pan its photo.
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
}
function panelAt(nx, ny) {
  const layout = currentLayout();
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    if (nx >= p.x && nx < p.x + p.w && ny >= p.y && ny < p.y + p.h) return i;
  }
  return -1;
}
canvas.addEventListener('pointerdown', (e) => {
  const pt = canvasPoint(e);
  const i = panelAt(pt.x, pt.y);
  if (i < 0) return;
  state.selected = i;
  drag = { panel: state.panels[i], x: pt.x, y: pt.y, fx: state.panels[i].fx, fy: state.panels[i].fy, moved: false };
  canvas.setPointerCapture(e.pointerId);
  renderPanelPicker();
  syncPanelControls();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const pt = canvasPoint(e);
  const layout = currentLayout();
  const p = layout.panels[state.selected];
  const dx = (pt.x - drag.x) / p.w;
  const dy = (pt.y - drag.y) / p.h;
  if (Math.abs(dx) + Math.abs(dy) > 0.01) drag.moved = true;
  drag.panel.fx = Math.min(1, Math.max(0, drag.fx - dx * 0.6));
  drag.panel.fy = Math.min(1, Math.max(0, drag.fy - dy * 0.6));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

// --- Start ------------------------------------------------------------------

async function start() {
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load("100px 'Archivo Black'"),
      document.fonts.load('700 20px Inter'),
      document.fonts.load('400 20px Inter'),
    ]);
  } catch {
    // If a font fails, the canvas falls back to sans-serif; the app still works.
  }
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (shot) {
    await runShot(shot, query, async (scene) => {
      const img = await loadImage(`samples/${scene.photo}.jpg`);
      state.photos = [{ name: `${scene.photo}.jpg`, img }];
      state.layoutId = scene.layout;
      state.gradeId = scene.grade;
      state.title = scene.caption;
      state.subtitle = scene.subtitle;
      state.sizeId = scene.size;
      document.querySelectorAll('#layoutbtns button').forEach((x) => x.classList.toggle('on', x.dataset.layout === scene.layout));
      document.querySelectorAll('#gradebtns button').forEach((x) => x.classList.toggle('on', x.dataset.grade === scene.grade));
      document.querySelectorAll('#sizebtns button').forEach((x) => x.classList.toggle('on', x.dataset.size === scene.size));
      $('title').value = scene.caption;
      $('subtitle').value = scene.subtitle;
      resetPanels();
      renderPhotoStrip();
      renderPanelPhotoSelect();
      redraw();
    });
  } else {
    await loadSamples();
  }
  window.__appReady = true;
}

start();
