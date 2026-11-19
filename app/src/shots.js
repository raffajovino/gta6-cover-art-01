// Fixed scenes for screenshots: ?shot=cover shows the cover alone at a
// chosen export size; ?shot=editor shows the editor with a sample photo.
// `photo` picks the sample (samples/<photo>.jpg), `caption` the title,
// `layout` and `grade` pick the look. window.__shotReady is set once the
// fonts are in and the cover is painted.
export async function runShot(shot, query, setup) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await setup({
    photo: query.get('photo') ?? 'pier',
    caption: query.get('caption') ?? 'Sunset Heist',
    subtitle: query.get('subtitle') ?? 'Vice City Nights',
    layout: query.get('layout') ?? 'comic',
    grade: query.get('grade') ?? 'sunset',
    size: query.get('size') ?? '1920x1080',
  });
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
