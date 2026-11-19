// Draws a VICE HEAT cover: photo panels under a colour grade, a caption
// band with a procedural sun and palm silhouettes, and a bold display
// title. Everything is drawn from the state object, so the editor preview
// and the exported PNGs are the same drawing at different sizes.

// A tiny seeded random generator, so the grain tile is identical on every
// render and every export is byte-stable for the same state.
function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

let grainTile = null;
/** A 128x128 noise tile, built once, tiled over the cover at low alpha. */
function getGrainTile() {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(128, 128);
  const rnd = seededRandom(20261119);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  grainTile = tile;
  return tile;
}

/** Draws one palm silhouette: a leaning trunk and six fronds. */
function drawPalm(ctx, x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  const lean = size * 0.18;
  ctx.lineWidth = Math.max(2, size * 0.045);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * 0.4, y - size * 0.55, x + lean, y - size);
  ctx.stroke();
  const topX = x + lean;
  const topY = y - size;
  for (let i = 0; i < 6; i++) {
    const a = (-Math.PI * (0.08 + i * 0.16)) - Math.PI / 2 + Math.PI * 0.55;
    const len = size * (0.42 + (i % 2) * 0.1);
    const cx = topX + Math.cos(a) * len * 0.55;
    const cy = topY + Math.sin(a) * len * 0.35 - size * 0.06;
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len + size * 0.22;
    ctx.lineWidth = Math.max(1.5, size * 0.02);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

/** Draws a photo into a panel rect, cover-fit, zoomed on its focal point. */
function drawPanelPhoto(ctx, photo, rect, zoom, fx, fy) {
  if (!photo || !photo.img) return;
  const iw = photo.img.naturalWidth;
  const ih = photo.img.naturalHeight;
  const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const pw = iw * base;
  const ph = ih * base;
  const cx = rect.x + rect.w / 2 - (fx - 0.5) * (pw - rect.w);
  const cy = rect.y + rect.h / 2 - (fy - 0.5) * (ph - rect.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(photo.img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
}

/** Fits the title on one line, shrinking the Anton size until it fits. */
function fitTitle(ctx, text, maxWidth, maxSize) {
  let size = maxSize;
  ctx.font = `${size}px Anton, 'Archivo Black', sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 18) {
    size -= 2;
    ctx.font = `${size}px Anton, 'Archivo Black', sans-serif`;
  }
  return size;
}

/**
 * Draws the whole cover onto ctx at W x H.
 * state: { layout, grade, photos, panels, title, subtitle }
 * photos: [{ img }] — panels[i] is { photo, zoom, fx, fy }.
 */
export function drawCover(ctx, state, W, H) {
  const { layout, grade } = state;
  const gutter = Math.max(3, Math.round(W * 0.006));
  const toPx = (r) => ({ x: r.x * W, y: r.y * H, w: r.w * W, h: r.h * H });

  // Base: the grade's dark band colour, so the gutters read as part of it.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, grade.band[0]);
  bg.addColorStop(1, grade.band[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Photo panels, each washed with the grade.
  layout.panels.forEach((p, i) => {
    const r = toPx(p);
    const inset = gutter / 2;
    const pr = { x: r.x + inset, y: r.y + inset, w: r.w - gutter, h: r.h - gutter };
    const panel = state.panels[i] || { photo: 0, zoom: 1, fx: 0.5, fy: 0.5 };
    const photo = state.photos[panel.photo];
    if (photo && photo.img) {
      drawPanelPhoto(ctx, photo, pr, panel.zoom, panel.fx, panel.fy);
    } else {
      // Empty panel: a grade-tinted placeholder so the grid never looks broken.
      const ph = ctx.createLinearGradient(pr.x, pr.y, pr.x + pr.w, pr.y + pr.h);
      ph.addColorStop(0, grade.wash[0]);
      ph.addColorStop(1, grade.wash[2]);
      ctx.fillStyle = ph;
      ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
    }
    const wash = ctx.createLinearGradient(pr.x, pr.y, pr.x + pr.w, pr.y + pr.h);
    wash.addColorStop(0, grade.wash[0]);
    wash.addColorStop(0.55, grade.wash[1]);
    wash.addColorStop(1, grade.wash[2]);
    ctx.save();
    ctx.globalCompositeOperation = grade.blend;
    ctx.globalAlpha = grade.alpha;
    ctx.fillStyle = wash;
    ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
    ctx.restore();
    // Bottom shade inside the panel, so white lettering could sit on it.
    const shade = ctx.createLinearGradient(0, pr.y + pr.h * 0.55, 0, pr.y + pr.h);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = shade;
    ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
    // Thin bright frame around the panel.
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = Math.max(1, W * 0.0012);
    ctx.strokeRect(pr.x, pr.y, pr.w, pr.h);
  });

  // Caption band: dark grade gradient, a low sun, palms at the edges.
  const band = toPx(layout.caption);
  const bandGrad = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
  bandGrad.addColorStop(0, grade.band[0]);
  bandGrad.addColorStop(1, grade.band[1]);
  ctx.fillStyle = bandGrad;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  const sunR = band.h * 0.62;
  const sunX = W * 0.5;
  const sunY = band.y + band.h * 0.88;
  const sun = ctx.createRadialGradient(sunX, sunY, sunR * 0.1, sunX, sunY, sunR * 1.6);
  sun.addColorStop(0, grade.sun);
  sun.addColorStop(0.55, grade.wash[1]);
  sun.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Palm silhouettes left and right of the sun.
  ctx.globalAlpha = 0.5;
  drawPalm(ctx, W * 0.045, band.y + band.h * 0.96, band.h * 0.72, '#0a0512');
  drawPalm(ctx, W * 0.955, band.y + band.h * 0.96, band.h * 0.6, '#0a0512');
  ctx.globalAlpha = 1;
  // Neon rules above and below the band.
  ctx.fillStyle = grade.accent;
  ctx.globalAlpha = 0.8;
  ctx.fillRect(0, band.y, W, Math.max(2, H * 0.002));
  ctx.globalAlpha = 1;

  // Title: huge Anton capitals, gradient-filled, dark outline, drop shadow.
  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    const maxW = W * 0.86;
    const maxSize = band.h * 0.56;
    const size = fitTitle(ctx, title, maxW, maxSize);
    const titleGrad = ctx.createLinearGradient(0, band.y + band.h * 0.18, 0, band.y + band.h * 0.78);
    titleGrad.addColorStop(0, grade.titleFrom);
    titleGrad.addColorStop(1, grade.titleTo);
    ctx.font = `${size}px Anton, 'Archivo Black', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(10,4,18,0.9)';
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.05;
    const ty = band.y + band.h * 0.46;
    ctx.strokeText(title, W / 2, ty);
    ctx.fillStyle = titleGrad;
    ctx.fillText(title, W / 2, ty);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  // Subtitle: letterspaced Inter capitals under the title.
  const sub = (state.subtitle || '').trim().toUpperCase();
  if (sub) {
    const subSize = Math.max(10, band.h * 0.115);
    ctx.font = `700 ${subSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = grade.accent;
    // A dark halo keeps the tagline readable where it crosses the sun glow.
    ctx.shadowColor = 'rgba(10,4,18,0.85)';
    ctx.shadowBlur = subSize * 0.5;
    const sy = band.y + band.h * 0.84;
    // Letter-spacing by hand: canvas has no letterSpacing everywhere yet.
    const gap = subSize * 0.28;
    const widths = [...sub].map((ch) => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (sub.length - 1);
    let x = W / 2 - total / 2;
    for (let i = 0; i < sub.length; i++) {
      ctx.fillText(sub[i], x + widths[i] / 2, sy);
      x += widths[i] + gap;
    }
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  // Studio tag, bottom-right corner.
  ctx.font = `${Math.max(9, H * 0.011)}px 'Archivo Black', sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('VICE HEAT', W - W * 0.012, H - H * 0.012);

  // Grain over everything, then a thin outer frame.
  const tile = getGrainTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = Math.max(1, W * 0.0015);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
}
