/**
 * Every text and position of the five screens.
 *
 * Units: pixels of the 1920x1080 Figma frames (file "The Flying Idea —
 * Studio Frames", page "עמוד 3"). Text positions are the top-left of the
 * text box as in Figma; sizes and letter spacing are Figma's values.
 * To move or reword anything, change it here.
 */

export const FONTS = {
  display: "'Archivo Black', 'Archivo', 'Arial Black', sans-serif",
  text: "'Rubik', 'Google Sans', system-ui, sans-serif",
  latin: "'Google Sans', 'Google Sans Flex', 'Rubik', sans-serif",
};

export const COLORS = {
  cobalt: '#0024AA',
  bright: '#0838DE',
  echo1: '#A3B5F3',
  echo2: '#C8D2F4',
  ink: '#4B4A4E',
  navy: '#070C82',
  num: '#545456',
};

const FULL = [0, 0, 1920, 1080];

/* ---------------------------------------------------------------- 01 */
export const WELCOME = {
  id: 'welcome', index: '01', label: 'YOU’RE WELCOME', bg: '#F1F1F7', ref: 'tools/ref/new-01.jpg',
  crop: { desktop: FULL, mobile: [120, 240, 1790, 640] },
  badge: { x: 185, y: 271, size: 60, num: { x: 263, y: 283, size: 35 } },
  copy: {
    lines: ['שלום ואיזה כיף שבאתם!', 'קתצ בלה בלה בלה כמיטב המסורת', 'ועוד רגע אתם בפרוטםוליו'],
    left: 395, top: 286, size: 20, lh: 25, weight: 500, color: COLORS.bright,
  },
  title: [
    { text: 'Youre', x: 142, y: 310, size: 266, ls: -15 },
    { text: 'welcome', x: 185, y: 518, size: 266, ls: -13 },
  ],
  // the smile under the glasses (drawn as a line, so it can be "signed")
  smile: { d: 'M1630 652 Q1575 850 1305 812', width: 32 },
  tagline: { text: 'WE STARTING FROM HERE', x: 187, y: 798, size: 35, ls: 30.8, line: { x: 187, y: 838, w: 487, h: 4 } },
  // the glasses at rest (centre, width) — see objects/glasses.js
  glasses: { x: 1482, y: 491, w: 845 },
};

/* ---------------------------------------------------------------- 02 */
export const PROCESS = {
  id: 'process', index: '02', label: 'THE PROCESS', bg: '#EEEEF8', ref: 'tools/ref/new-02.jpg',
  crop: { desktop: FULL, mobile: [120, 300, 1720, 720] },
  badge: { x: 146, y: 333, size: 41, num: { x: 199, y: 343, size: 24 } },
  copy: {
    lines: ['לפני שמתחילים, לתהליך נכון יש משקל חשוב.', 'להבין מה צריך ומה נכון לנו עסקית, ואיך אנחנו עובדים חכם.', 'חושבים את זה,  בונים את זה, ומעצבים מוצר יפה. נכון.'],
    left: 146, top: 452, size: 20, lh: 25, weight: 500, color: COLORS.bright,
  },
  title: [
    { text: 'TO THE', x: 143, y: 511, size: 150, ls: -16 },
    { text: 'PROCESS', x: 146, y: 648, size: 149, ls: -7.4 },
  ],
  tagline: { text: 'FROM STRATEGY TO EXECUTION', x: 159, y: 790, size: 24, ls: 15.9, line: { x: 160, y: 826, w: 369, h: 3 } },
  // desk photo layers: frame px = deskX + refX * deskScale (layers are in the old frame's px)
  desk: { x: 931, y: 197, scale: 0.919, refY0: 826 },
  swatchPivot: { x: 186, y: 1318 },
  // where the glasses lie on the desk (desk-layer px)
  glassesOnDesk: { x: 470, y: 1330, w: 230 },
};

/* ---------------------------------------------------------------- 03 */
export const RESULT = {
  id: 'result', index: '03', label: 'THE RESULT', bg: '#ECEDFA', ref: 'tools/ref/new-03.jpg',
  crop: { desktop: FULL, mobile: [110, 270, 1700, 700] },
  title: [
    { text: 'And the', x: 138, y: 284, size: 116, ls: -5.8, role: 'small' },
    { text: 'RESULT', x: 138, y: 388, size: 162, ls: -12, role: 'main' },
    { text: 'THR RESULT', x: 138, y: 527, size: 109, ls: -5.4, role: 'echo', color: COLORS.echo1 },
    { text: 'THR RESULT', x: 138, y: 618, size: 109, ls: -5.4, role: 'echo', color: COLORS.echo2 },
  ],
  copy: {
    lines: ['וכאן נכנס עיצוב טוב', 'כשזה קורה, התוצאה מדברת', 'לבד. אנחנו כאן כדי לתת לה', 'את השפה שלה'],
    right: 1774, top: 553, size: 20, lh: 25, weight: 500, color: COLORS.bright,
  },
  // device photo layers: frame px = x + refX * scale
  devices: { x: 640, y: -281, scale: 0.88 },
  hinge: { x0: 300, y0: 1127, x1: 840, y1: 1083 },
  phonePivot: { x: 860, y: 1160 },
};

/* ---------------------------------------------------------------- 04 */
export const WORKS = {
  id: 'works', index: '04', label: 'THE WORKS', bg: '#EEEEF8',
  crop: { desktop: FULL, mobile: [60, 100, 1800, 950] },
  badge: { x: 146, y: 110, size: 41, num: { x: 199, y: 118, size: 24 } },
  title: [
    { text: 'the', x: 138, y: 160, size: 116, ls: -5.8 },
    { text: 'WORKS', x: 134, y: 262, size: 162, ls: -8 },
  ],
  bigOutline: { text: 'THE WORKS', x: 60, y: 560, size: 330, ls: -14 },
  copy: {
    lines: ['כמה מהעבודות שאנחנו גאים בהן.', 'גללו כדי לעבור בין העבודות.'],
    right: 1770, top: 196, size: 22, lh: 30, weight: 500, color: COLORS.bright,
  },
  tagline: { text: 'FROM IDEA TO IMPACT', x: 160, y: 958, size: 24, ls: 15.9, line: { x: 161, y: 996, w: 300, h: 3 } },
  // the gallery. name / category are shown under the work in the middle
  items: [
    { src: 'assets/works/w1.webp', name: 'טוב לדעת', cat: 'קמפיין פרינט' },
    { src: 'assets/works/w2.webp', name: 'FOREVER', cat: 'פוסטר מוצר' },
    { src: 'assets/works/v1.mp4', poster: 'assets/works/v1.jpg', name: 'תנחתו', cat: 'סרטון פרסומי' },
    { src: 'assets/works/w3.webp', name: 'FOREVER', cat: 'פוסטר מוצר' },
    { src: 'assets/works/w4.webp', name: 'KIRMORE', cat: 'פלאייר' },
    { src: 'assets/works/w5.webp', name: 'CHUMI SHENELZON', cat: 'מיתוג' },
    { src: 'assets/works/v2.mp4', poster: 'assets/works/v2.jpg', name: 'שיחה', cat: 'לוגו מונפש' },
    { src: 'assets/works/w6.webp', name: 'CHUMI SHENELZON', cat: 'אתר' },
    { src: 'assets/works/w7.webp', name: 'KIRMORE', cat: 'פלאייר' },
    { src: 'assets/works/w8.webp', name: 'ערוץ 14', cat: 'קורס עברית' },
    { src: 'assets/works/w9.webp', name: 'ערוץ 14', cat: 'מוצרי קידום' },
  ],
};

/* ---------------------------------------------------------------- 05 */
export const CONTACT = {
  id: 'contact', index: '05', label: 'LET’S TALK', bg: '#ECEDFA',
  crop: { desktop: FULL, mobile: [110, 40, 1700, 1000] },
  badge: { x: 146, y: 180, size: 41, num: { x: 199, y: 188, size: 24 } },
  title: [
    { text: 'let’s', x: 138, y: 290, size: 116, ls: -5.8, role: 'small' },
    { text: 'TALK', x: 134, y: 393, size: 162, ls: -8, role: 'main' },
    { text: 'TALK', x: 136, y: 538, size: 109, ls: -5.4, role: 'echo', color: COLORS.echo1 },
    { text: 'TALK', x: 136, y: 629, size: 109, ls: -5.4, role: 'echo', color: COLORS.echo2 },
  ],
  tagline: { text: 'LET’S MAKE IT HAPPEN', x: 160, y: 810, size: 24, ls: 15.9, line: { x: 161, y: 848, w: 300, h: 3 } },
  // newspaper photo; the headline on the paper is live text
  photo: { src: 'assets/scene/contact.jpg', x: 1250, y: 40, w: 340, h: 426, paper: { x: 110, y: 96, w: 122 } },
  copy: {
    lines: ['יש לכם רעיון? בואו נדבר.', 'נשמח לשמוע על הפרויקט הבא שלכם.'],
    right: 1760, top: 520, size: 22, lh: 30, weight: 500, color: COLORS.bright,
  },
  // placeholders until the real details are provided
  rows: [
    { key: 'EMAIL', value: '[אימייל]', y: 610 },
    { key: 'PHONE', value: '[טלפון]', y: 700 },
    { key: 'INSTAGRAM', value: '[אינסטגרם]', y: 790 },
  ],
  rowsBox: { x: 1080, w: 680 },
  button: { text: 'שלחו הודעה', href: '#', x: 1452, y: 930 },
  glasses: { x: 905, y: 470, w: 300, rot: -9 },
};

export const SCENES = [WELCOME, PROCESS, RESULT, WORKS, CONTACT];

/**
 * Scroll script: one master timeline, 0..100, scrubbed by scroll.
 * rest = the moment each screen is shown exactly as designed.
 */
export const TIMING = {
  total: 100,
  scrollLength: 10, // viewport heights
  t12: [4, 17],
  process: { build: [11, 22], rest: 25 },
  t23: [28, 37],
  result: { build: [34, 46], rest: 48 },
  t34: [51, 58],
  works: { build: [55, 62], scrub: [62, 86] },
  t45: [86, 91],
  contact: { build: [88, 97], rest: 99 },
};

// resting moments used by the soft scroll lock and by the navigation
export const ANCHORS = [0, TIMING.process.rest, TIMING.result.rest, TIMING.works.scrub[0], TIMING.contact.rest];
