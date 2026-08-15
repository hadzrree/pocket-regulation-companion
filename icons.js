/**
 * core/components/icons.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   Every icon in the application, as inline SVG. One file, one source.
 *
 * WHY INLINE AND NOT AN ICON FONT OR A SPRITE FILE
 *   1. Zero runtime dependencies (Architecture §1.6). Loading Lucide from a
 *      CDN would mean the app is not truly offline on first run, and it would
 *      put a third-party domain in the CSP — which breaks the privacy promise
 *      that `connect-src 'self'` makes browser-enforceable.
 *   2. An icon FONT renders as a missing glyph when the font fails. In a
 *      panic flow, a missing glyph where the crisis icon should be is not an
 *      acceptable failure mode.
 *   3. Inline SVG inherits `currentColor`, so an icon is correct in light
 *      theme, dark theme and high-contrast mode without any extra rules.
 *
 * SOURCE
 *   Paths are Lucide (ISC licence, © Lucide contributors), redrawn at the
 *   project's softer stroke width. See docs/ASSETS.md for attribution.
 *
 * THE STROKE DECISION
 *   Lucide ships at stroke-width 2. This app renders at 1.75
 *   (--icon-stroke). Two is a confident, product-y line; 1.75 is a quieter
 *   one. The only exception is the selected navigation tab, which uses 2.25
 *   so the current position is legible without relying on colour alone —
 *   colour must never be the sole carrier of meaning (Design Language §18).
 *
 * DEPENDENCIES  none
 * USED BY       every component and view that shows an icon
 * SPEC          Design Language §8; Architecture §4.2
 */

const NS = 'http://www.w3.org/2000/svg';

/**
 * Icon geometry, on a 24×24 grid.
 * Each entry is a list of shapes: ['path', d] | ['circle', cx, cy, r] |
 * ['line', x1, y1, x2, y2].
 *
 * Keep this list SHORT. Every icon added is a thing a tired user has to
 * decode. If a screen needs a new icon, first check whether a word would do.
 */
const SHAPES = {
  /* ---- Navigation ------------------------------------------------------- */
  home: [
    ['path', 'M3 9.5 12 2l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
    ['path', 'M9.5 22v-8h5v8']
  ],
  wind: [
    ['path', 'M12.8 19.6A2 2 0 1 0 14 16H2'],
    ['path', 'M17.5 8a2.5 2.5 0 1 1 2 4H2'],
    ['path', 'M9.8 4.4A2 2 0 1 1 11 8H2']
  ],
  heart: [
    ['path', 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z']
  ],
  sprout: [
    ['path', 'M7 20h10'],
    ['path', 'M10 20c5.5-2.5.8-6.4 3-10'],
    ['path', 'M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z'],
    ['path', 'M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z']
  ],
  user: [
    ['path', 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'],
    ['circle', 12, 7, 4]
  ],

  /* ---- Actions ---------------------------------------------------------- */
  check:        [['path', 'M20 6 9 17l-5-5']],
  x:            [['path', 'M18 6 6 18'], ['path', 'M6 6l12 12']],
  chevronRight: [['path', 'm9 18 6-6-6-6']],
  chevronLeft:  [['path', 'm15 18-6-6 6-6']],
  arrowLeft:    [['path', 'm12 19-7-7 7-7'], ['path', 'M19 12H5']],
  plus:         [['path', 'M5 12h14'], ['path', 'M12 5v14']],
  pencil: [
    ['path', 'M12 20h9'],
    ['path', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z']
  ],

  /* ---- Meaning ---------------------------------------------------------- */
  info:   [['circle', 12, 12, 10], ['path', 'M12 16.5v-5'], ['path', 'M12 8h.01']],
  phone: [
    ['path', 'M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z']
  ],
  shield: [
    ['path', 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z']
  ],
  messageCircle: [['path', 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z']],
  sun: [
    ['circle', 12, 12, 4],
    ['path', 'M12 2v2'], ['path', 'M12 20v2'],
    ['path', 'm4.93 4.93 1.41 1.41'], ['path', 'm17.66 17.66 1.41 1.41'],
    ['path', 'M2 12h2'], ['path', 'M20 12h2'],
    ['path', 'm6.34 17.66-1.41 1.41'], ['path', 'm19.07 4.93-1.41 1.41']
  ],
  moon: [['path', 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z']]
};

/** The complete list of icon names, for the style guide and tests. */
export const ICON_NAMES = Object.keys(SHAPES);

/**
 * Build one icon.
 *
 * @param {string} name              a key of SHAPES
 * @param {Object} [options]
 * @param {number} [options.size=24] rendered px. Use the --icon-* tokens.
 * @param {number} [options.stroke]  overrides --icon-stroke
 * @param {string} [options.class]   extra class names
 * @returns {SVGElement}
 *
 * ACCESSIBILITY
 *   The icon is ALWAYS aria-hidden. Every icon in this app sits beside a
 *   word, or inside a control that carries its own aria-label. An icon that
 *   announces itself would make a screen reader say the label twice.
 *   Design Language §8.4.
 */
export function icon(name, options = {}) {
  const shapes = SHAPES[name];
  if (!shapes) {
    // Loud in development, harmless in production: an empty box, never a
    // crash and never a "missing glyph" square.
    console.warn(`[icons] unknown icon "${name}"`);
    return document.createElementNS(NS, 'svg');
  }

  const size = options.size || 24;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  // Stroke width is set in CSS (.icon { stroke-width: var(--icon-stroke) }),
  // NOT here. A presentation attribute cannot hold a var() — it would be
  // parsed as an invalid length and silently fall back to 1, giving hairline
  // icons that look broken only on some screens. Only an explicit numeric
  // override is written as an attribute.
  if (options.stroke) svg.setAttribute('stroke-width', String(options.stroke));
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('class', `icon icon--${name}${options.class ? ` ${options.class}` : ''}`);

  for (const shape of shapes) {
    svg.appendChild(buildShape(shape));
  }
  return svg;
}

/** One geometry entry → one SVG child element. */
function buildShape(shape) {
  const [kind] = shape;
  if (kind === 'circle') {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', String(shape[1]));
    c.setAttribute('cy', String(shape[2]));
    c.setAttribute('r', String(shape[3]));
    return c;
  }
  if (kind === 'line') {
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', String(shape[1]));
    l.setAttribute('y1', String(shape[2]));
    l.setAttribute('x2', String(shape[3]));
    l.setAttribute('y2', String(shape[4]));
    return l;
  }
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', shape[1]);
  return p;
}

/**
 * Create a bare SVG element. Used by MoodSelector, which draws faces rather
 * than picking them from the icon set.
 *
 * WHY THIS IS EXPORTED
 *   `document.createElement('svg')` silently produces an HTMLUnknownElement
 *   that renders as nothing. SVG requires createElementNS. Exporting this
 *   means no other file has to remember the namespace string — and no other
 *   file has to be reviewed for having got it wrong.
 */
export function svgEl(tag, attrs = {}, children = []) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    node.setAttribute(key, String(value));
  }
  for (const child of [].concat(children)) {
    if (child) node.appendChild(child);
  }
  return node;
}
