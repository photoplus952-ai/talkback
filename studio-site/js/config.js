/**
 * All approved content and every position in the four compositions.
 *
 * Units: pixels of the original reference frame of each scene
 * (tools/ref/0X-*.png). The stage scales the frame to the screen, so to
 * move something just change its numbers here.
 *
 * capTop / capH: top and height of the CAPITAL letters (what you would
 * measure in the design file), not of the text box.
 */

export const FONTS = {
  // Stretch Pro is loaded from /fonts if present (see fonts/README.md).
  // Until then Archivo Expanded Black stands in for it.
  display: "'Stretch Pro', 'Archivo', sans-serif",
  displayWeight: 900,
  displayStretch: '125%',
  text: "'Google Sans', 'Rubik', system-ui, sans-serif",
};

export const COLORS = {
  cobalt: '#0024AA',       // headline blue
  cobaltBright: '#0838DE', // badge, Hebrew copy
  royal: '#0A2FD2',        // MADE IT HAPPEN band
  navy: '#070C82',         // scene 4 copy
  ink: '#4B4A4E',          // grey taglines
  echo: '#A3B5F3',         // THE PRODUCT echoes
};

/* ---------------------------------------------------------------- 01 */
export const IDEA = {
  id: 'idea',
  index: '01',
  label: 'THE IDEA',
  ref: { w: 940, h: 1407, src: 'tools/ref/01-idea.png' },
  bg: '#F1F1F7',
  // visible window of the frame [x, y, w, h]
  crop: { desktop: [40, 515, 880, 700], mobile: [70, 520, 836, 700] },
  badge: { x: 94, y: 547, size: 45, num: { x: 153, capTop: 560, capH: 19 } },
  copy: {
    lines: ['הכול מתחיל ברעיון,', 'בפיצוח מדויק', 'ובאסטרטגיה שנכונה', 'לכאן ולעכשיו.'],
    align: 'left', x: 562, firstTop: 630, pitch: 36, size: 29, weight: 500, color: COLORS.cobaltBright,
  },
  the: { text: 'THE', x0: 79, x1: 532, capTop: 699, capH: 181 },
  idea: {
    capTop: 935, capH: 175,
    id: { text: 'ID', x0: 79, x1: 312 },
    e: { x0: 329, x1: 678, stem: 54, bar: 0.215 },
    a: { text: 'A', x0: 683, x1: 890 },
  },
  tagline: {
    text: 'WE STARTING FROM HERE', x0: 80, x1: 878, capTop: 1137, capH: 19, weight: 500, color: COLORS.ink,
    underline: { x0: 78, x1: 444, y: 1167, h: 4.5 },
  },
  // the paper plane resting on the title (see objects/paperPlane.js)
  plane: { x: 610, y: 885, length: 470 },
};

/* ---------------------------------------------------------------- 02 */
export const PROCESS = {
  id: 'process',
  index: '02',
  label: 'THE PROCESS',
  ref: { w: 941, h: 1672, src: 'tools/ref/02-process.png' },
  bg: '#EEEEF8',
  crop: { desktop: [20, 270, 900, 1402], mobile: [50, 280, 850, 1392] },
  badge: { x: 94, y: 295, size: 45, num: { x: 153, capTop: 309, capH: 19 } },
  copy: {
    lines: ['מחקר, גיבוש כיוון,', 'עיצוב וביצוע מדויק —', 'תהליך אסטרטגי שמחבר', 'בין רעיון לתוצאה.'],
    align: 'left', x: 554, firstTop: 371, pitch: 35.5, size: 29, weight: 500, color: COLORS.cobaltBright,
  },
  the: { text: 'THE', x0: 71, x1: 485, capTop: 449, capH: 151 },
  word: { text: 'PROCESS', x0: 70, x1: 879, capTop: 619, capH: 141 },
  tagline: {
    text: 'FROM STRATEGY TO EXECUTION', x0: 72, x1: 868, capTop: 783, capH: 19, weight: 500, color: COLORS.ink,
    underline: { x0: 71, x1: 472, y: 819, h: 3.5 },
  },
  // swatch fan pivots around the rivet
  swatchPivot: { x: 186, y: 1318 },
};

/* ---------------------------------------------------------------- 03 */
export const PRODUCT = {
  id: 'product',
  index: '03',
  label: 'THE PRODUCT',
  ref: { w: 1149, h: 1369, src: 'tools/ref/03-product.png' },
  bg: '#ECEDFA',
  crop: { desktop: [30, 190, 1090, 1110], mobile: [55, 215, 1055, 1060] },
  th: { text: 'TH', x0: 68, x1: 325, capTop: 228, capH: 128 },
  e: { x0: 336, x1: 617, capTop: 228, capH: 128, stem: 33, bar: 0.25 },
  word: { text: 'PRODUCT', x0: 68, x1: 1099, capTop: 372, capH: 146 },
  echoes: [
    { text: 'THE PRODUCT', x0: 68, x1: 1092, capTop: 535, capH: 93, color: COLORS.echo, fade: 0 },
    { text: 'THE PRODUCT', x0: 68, x1: 1092, capTop: 646, capH: 93, color: COLORS.echo, fade: 1 },
  ],
  // laptop hinge (lid rotates around it), phone pivot
  hinge: { x0: 300, y0: 1127, x1: 840, y1: 1083 },
  phonePivot: { x: 860, y: 1160 },
};

/* ---------------------------------------------------------------- 04 */
export const RESULT = {
  id: 'result',
  index: '04',
  label: 'THE RESULT',
  ref: { w: 1122, h: 1402, src: 'tools/ref/04-result.png' },
  bg: '#ECEFFD',
  crop: { desktop: [0, 100, 1122, 1090], mobile: [40, 110, 1050, 1070] },
  th: { text: 'TH', x0: 290, x1: 517, capTop: 137, capH: 111 },
  e: { x0: 528, x1: 786, capTop: 137, capH: 111, stem: 31, bar: 0.25 },
  word: { text: 'RESULT', x0: 316, x1: 1089, capTop: 269, capH: 119 },
  tagline: {
    parts: [{ text: 'WHERE STRATEGY BECOMES ', weight: 500 }, { text: 'IMPACT', weight: 800 }],
    x0: 355, x1: 1077, capTop: 406, capH: 22, color: COLORS.navy,
  },
  copy: {
    lines: [
      { text: 'כשהאסטרטגיה,', weight: 700, color: COLORS.cobaltBright },
      { text: 'העיצוב והביצוע', weight: 700, color: COLORS.cobaltBright },
      { text: 'מתחברים, מתקבלת', weight: 400, color: COLORS.navy },
      { text: 'תוצאה מדויקת,', weight: 400, color: COLORS.navy },
      { text: 'בולטת ואפקטיבית.', weight: 400, color: COLORS.navy },
    ],
    align: 'right', x: 1056, firstTop: 556, pitch: 54.5, size: 45,
  },
  // rotated band: bottom-left corner, angle (deg, clockwise from vertical), width
  band: { x: 226, y: 1165, angle: 14.6, width: 258, length: 1600 },
  // slogan along the band. along = distance from the band's bottom edge
  bandText: {
    capH: 104, inset: 26, along: [46, 1031],
    parts: [
      { text: 'MADE IT', style: 'stroke', x0: 0, x1: 482 },
      { text: 'HAPPEN', style: 'fill', x0: 526, x1: 985 },
    ],
  },
};

export const SCENES = [IDEA, PROCESS, PRODUCT, RESULT];

/**
 * Scroll script. One master timeline, 100 units long, scrubbed by scroll.
 * Each entry: where a scene's resting composition is fully visible.
 */
export const TIMING = {
  total: 100,
  scrollLength: 9.5, // in viewport heights
  idea: { rest: [0, 5] },
  t12: [5, 21],
  process: { build: [13, 30], rest: [30, 38] },
  t23: [38, 50],
  product: { build: [44, 60], rest: [60, 67] },
  t34: [67, 79],
  result: { build: [75, 90], rest: [90, 100] },
};
