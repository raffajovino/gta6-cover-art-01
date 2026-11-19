// Colour grades for VICE HEAT Cover Studio. Each grade is a sunset or neon
// wash drawn over every photo panel (a diagonal gradient at a blend mode)
// plus the colours the caption and accents use, so one tap re-grades the
// whole cover. Nothing here names a Rockstar asset: the grades are our own.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    hint: 'Orange to magenta dusk',
    blend: 'overlay',
    alpha: 0.55,
    wash: ['#ff9a3d', '#ff5e62', '#7b2d8b'],
    band: ['#2a0e2e', '#12061a'],
    titleFrom: '#ffd166',
    titleTo: '#ff5e62',
    accent: '#ffb347',
    sun: '#ffcf5c',
  },
  {
    id: 'neon',
    name: 'Neon',
    hint: 'Cyan and magenta nights',
    blend: 'overlay',
    alpha: 0.6,
    wash: ['#00e5ff', '#ff2fb3', '#7b2ff7'],
    band: ['#0b1030', '#060818'],
    titleFrom: '#7df9ff',
    titleTo: '#ff5df2',
    accent: '#00e5ff',
    sun: '#8ef6ff',
  },
  {
    id: 'vice',
    name: 'Vice Pink',
    hint: 'Hot pink boulevard',
    blend: 'soft-light',
    alpha: 0.75,
    wash: ['#ff7ad9', '#b537f2', '#3d0b5e'],
    band: ['#2e0a33', '#150418'],
    titleFrom: '#ff9de2',
    titleTo: '#ff5df2',
    accent: '#ff7ad9',
    sun: '#ffb3ec',
  },
  {
    id: 'heatwave',
    name: 'Heatwave',
    hint: 'Amber heat haze',
    blend: 'overlay',
    alpha: 0.55,
    wash: ['#ffd23f', '#ff7b00', '#d7263d'],
    band: ['#2b0f08', '#140604'],
    titleFrom: '#fff3b0',
    titleTo: '#ff9f1c',
    accent: '#ff5400',
    sun: '#ffe066',
  },
];

/** Looks a grade up by id, falling back to the first one. */
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}
