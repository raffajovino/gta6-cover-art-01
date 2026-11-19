// Panel layouts for VICE HEAT Cover Studio. Every rect is in normalised
// 0..1 space so one layout draws at any export size: the same cover works
// at 1080x1080, 1080x1350 and 1920x1080. Each layout has the panels that
// hold photos plus the caption band the title and tagline sit in.

export const LAYOUTS = [
  {
    id: 'comic',
    name: 'Comic Grid',
    hint: '5 panels, hero left',
    caption: { x: 0, y: 0.8, w: 1, h: 0.2 },
    panels: [
      { x: 0, y: 0, w: 0.56, h: 0.8 },
      { x: 0.56, y: 0, w: 0.22, h: 0.4 },
      { x: 0.78, y: 0, w: 0.22, h: 0.4 },
      { x: 0.56, y: 0.4, w: 0.22, h: 0.4 },
      { x: 0.78, y: 0.4, w: 0.22, h: 0.4 },
    ],
  },
  {
    id: 'feature',
    name: 'Feature',
    hint: '3 panels, wide hero',
    caption: { x: 0, y: 0.84, w: 1, h: 0.16 },
    panels: [
      { x: 0, y: 0, w: 1, h: 0.54 },
      { x: 0, y: 0.54, w: 0.5, h: 0.3 },
      { x: 0.5, y: 0.54, w: 0.5, h: 0.3 },
    ],
  },
  {
    id: 'hero',
    name: 'Hero + Strips',
    hint: '1 hero, 2 strips',
    caption: { x: 0, y: 0.8, w: 1, h: 0.2 },
    panels: [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0, y: 0.6, w: 0.5, h: 0.2 },
      { x: 0.5, y: 0.6, w: 0.5, h: 0.2 },
    ],
  },
  {
    id: 'quad',
    name: 'Quad',
    hint: '2 x 2 grid',
    caption: { x: 0, y: 0.82, w: 1, h: 0.18 },
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.41 },
      { x: 0.5, y: 0, w: 0.5, h: 0.41 },
      { x: 0, y: 0.41, w: 0.5, h: 0.41 },
      { x: 0.5, y: 0.41, w: 0.5, h: 0.41 },
    ],
  },
];

/** Looks a layout up by id, falling back to the first one. */
export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}
