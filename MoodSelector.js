/**
 * core/components/MoodSelector.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The five faces. The emotional centre of the whole product.
 *
 * ============================================================================
 * WHY THE FACES ARE DRAWN HERE AND NOT SHIPPED AS EMOJI OR IMAGES
 * ============================================================================
 *   1. SYSTEM EMOJI ARE NOT NEUTRAL. 😢 on an iPhone, on a Samsung and on a
 *      Xiaomi are three different drawings with three different intensities.
 *      A mood scale whose meaning changes with the handset is not a mood
 *      scale. Drawing them means every user sees the same five faces.
 *   2. EMOJI CARRY CULTURE. Several standard emoji read very differently in
 *      Malaysia than in the US design studios that shaped them.
 *   3. PNG/SVG FILES ARE ANOTHER FETCH. These must render instantly, offline,
 *      on first launch, before any asset has cached.
 *   Design Language §10.
 *
 * ============================================================================
 * WHAT THE FACES DELIBERATELY DO NOT DO
 * ============================================================================
 *   NO TEARS. NO RED. NO ANGRY EYEBROWS. NO EXTREME EXPRESSIONS.
 *
 *   A crying face at the bottom of a mood scale tells a user who is only
 *   flat, numb or exhausted that their answer is "crying" — and it tells a
 *   user who IS crying that the app has an opinion about it. The bottom of
 *   this scale is WEARY, not distraught: downcast eyes and a soft frown, in
 *   Soft Dusk, a muted violet. The scale runs warm to cool, and never through
 *   red at any point. Design Language §1.5, §10.2; Clinical Framework §12.4.
 *
 * ============================================================================
 * WHY THE LABELS ARE WORDS AND NOT NUMBERS
 * ============================================================================
 *   "3 out of 5" is a score, and a score invites comparison, targets, and the
 *   feeling of failing. "Okay" is a description. The stored value IS 1-5,
 *   because a chart needs an axis — but the number is never shown to the
 *   user, anywhere in the app. Clinical Framework §12.4.
 *
 * ============================================================================
 * ACCESSIBILITY
 * ============================================================================
 *   A real radiogroup with roving tabindex: one Tab stop for the whole set,
 *   arrow keys to move between faces, Home/End to jump. Building this out of
 *   divs with click handlers would leave keyboard and switch-access users
 *   unable to check in at all.
 *
 *   Each face carries its word as an accessible name, so a screen reader says
 *   "Okay, radio button, 3 of 5" — never "mood 3".
 *
 * DEPENDENCIES  core/utils/dom, core/utils/haptics, core/i18n, ./icons.js
 * SPEC          Design Language §10; Clinical Framework §12.4; PRD S12
 */

import { el, on } from '../utils/dom.js';
import { svgEl } from './icons.js';
import { pulse, HAPTIC } from '../utils/haptics.js';
import { t } from '../i18n/i18n.js';

/**
 * The scale, lowest first. `value` is what is stored; `key` names the i18n
 * string; `token` selects the colour pair in 01-tokens/colors.css.
 *
 * FIVE STEPS, NOT SEVEN OR TEN.
 * Five is the largest set a person in distress can scan and choose from
 * without the choosing itself becoming work. Clinical Framework §12.3.
 */
export const MOODS = Object.freeze([
  { value: 1, key: 'mood.veryHeavy', token: 1 },
  { value: 2, key: 'mood.heavy',     token: 2 },
  { value: 3, key: 'mood.okay',      token: 3 },
  { value: 4, key: 'mood.good',      token: 4 },
  { value: 5, key: 'mood.light',     token: 5 }
]);

/* ---------------------------------------------------------------------------
   FACE GEOMETRY — 48 × 48
   Kept as data so the five expressions can be compared side by side in one
   place. If a face ever needs redrawing, it is redrawn here and nowhere else.
--------------------------------------------------------------------------- */
const FACES = {
  /* 1 · Very heavy — downcast eyes, soft frown. Weary, not weeping. */
  1: {
    eyes: [
      ['path', 'M14.5 20.2q3 3.2 6 0'],
      ['path', 'M27.5 20.2q3 3.2 6 0']
    ],
    mouth: 'M16 34q8-7 16 0',
    blush: false
  },
  /* 2 · Heavy — open eyes, shallow frown. */
  2: {
    eyes: [['dot', 17.5, 20.5], ['dot', 30.5, 20.5]],
    mouth: 'M16.5 32.6q7.5-4.6 15 0',
    blush: false
  },
  /* 3 · Okay — a straight mouth. Neutral is a real answer, not a gap. */
  3: {
    eyes: [['dot', 17.5, 20.5], ['dot', 30.5, 20.5]],
    mouth: 'M17 31h14',
    blush: false
  },
  /* 4 · Good — a gentle smile. Gentle, not beaming. */
  4: {
    eyes: [['dot', 17.5, 20.5], ['dot', 30.5, 20.5]],
    mouth: 'M16 30q8 5.6 16 0',
    blush: true
  },
  /* 5 · Light — softly closed happy eyes and a fuller smile. Still not a
       grin: the top of this scale is "a good day", not "euphoric". */
  5: {
    eyes: [
      ['path', 'M14.5 22q3-3.6 6 0'],
      ['path', 'M27.5 22q3-3.6 6 0']
    ],
    mouth: 'M15 29q9 7.8 18 0',
    blush: true
  }
};

/**
 * Draw one face.
 * @param {number} value 1..5
 * @returns {SVGElement}
 */
export function moodFace(value) {
  const spec = FACES[value];
  const svg = svgEl('svg', {
    viewBox: '0 0 48 48',
    class: `mood-face mood-face--${value}`,
    'aria-hidden': 'true',
    focusable: 'false'
  });

  // The head. Filled with the soft tint, outlined with the full colour, so
  // the shape survives high-contrast mode and greyscale printing.
  svg.appendChild(svgEl('circle', {
    cx: 24, cy: 24, r: 21,
    class: 'mood-face__head'
  }));

  if (spec.blush) {
    svg.appendChild(svgEl('ellipse', { cx: 13.5, cy: 27, rx: 3.2, ry: 2.1, class: 'mood-face__blush' }));
    svg.appendChild(svgEl('ellipse', { cx: 34.5, cy: 27, rx: 3.2, ry: 2.1, class: 'mood-face__blush' }));
  }

  for (const eye of spec.eyes) {
    if (eye[0] === 'dot') {
      svg.appendChild(svgEl('circle', { cx: eye[1], cy: eye[2], r: 2.1, class: 'mood-face__eye-dot' }));
    } else {
      svg.appendChild(svgEl('path', { d: eye[1], class: 'mood-face__eye' }));
    }
  }

  svg.appendChild(svgEl('path', { d: spec.mouth, class: 'mood-face__mouth' }));
  return svg;
}

/**
 * Build the selector.
 *
 * @param {Object} config
 * @param {number|null} [config.value=null]   currently chosen mood
 * @param {(value:number) => void} config.onSelect
 * @param {boolean} [config.disabled=false]   past the edit window
 * @param {string} [config.ariaLabel]         defaults to the question text
 * @returns {{node: HTMLElement, setValue: Function, destroy: Function}}
 */
export function MoodSelector({ value = null, onSelect, disabled = false, ariaLabel } = {}) {
  const cleanups = [];
  let selected = value;

  const group = el('div', {
    class: `mood-row${disabled ? ' mood-row--locked' : ''}`,
    role: 'radiogroup',
    'aria-label': ariaLabel || t('checkin.question')
  });

  const buttons = MOODS.map((mood) => {
    const isSelected = mood.value === selected;
    const button = el('button', {
      type: 'button',
      class: 'mood',
      role: 'radio',
      'aria-checked': String(isSelected),
      'aria-label': t(mood.key),
      'data-mood': mood.value,
      // Roving tabindex: exactly one member of the group is tabbable.
      tabindex: isSelected || (selected === null && mood.value === 3) ? '0' : '-1',
      disabled: disabled || null
    }, [
      moodFace(mood.value),
      el('span', { class: 'mood__label' }, t(mood.key))
    ]);

    // No once() wrapper here, and that is deliberate. Double-tap suppression
    // exists to stop an accidental repeat ACTION. Choosing a mood is
    // idempotent — tapping "Okay" twice means Okay. Suppressing the second
    // tap would instead break the common case of a user changing their mind
    // quickly between two adjacent faces.
    cleanups.push(on(button, 'click', () => choose(mood.value)));
    return button;
  });

  buttons.forEach((b) => group.appendChild(b));
  cleanups.push(on(group, 'keydown', onKeydown));

  function choose(next) {
    if (disabled) return;
    selected = next;
    paint();
    pulse(HAPTIC.select);
    if (typeof onSelect === 'function') onSelect(next);
  }

  function paint() {
    buttons.forEach((b) => {
      const isSelected = Number(b.dataset.mood) === selected;
      b.setAttribute('aria-checked', String(isSelected));
      b.tabIndex = isSelected ? 0 : -1;
    });
    // If nothing is selected, the middle face keeps the tab stop so the group
    // is always reachable.
    if (selected === null) buttons[2].tabIndex = 0;
  }

  /**
   * Arrow keys move AND select, which is the standard radiogroup behaviour
   * and what a screen reader user expects. Home/End jump to the ends.
   */
  function onKeydown(event) {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();

    const currentIndex = selected ? MOODS.findIndex((m) => m.value === selected) : 2;
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % MOODS.length;
    if (event.key === 'ArrowLeft'  || event.key === 'ArrowUp')   nextIndex = (currentIndex - 1 + MOODS.length) % MOODS.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End')  nextIndex = MOODS.length - 1;

    choose(MOODS[nextIndex].value);
    buttons[nextIndex].focus();
  }

  return {
    node: group,
    /** Set the value without firing onSelect. Used when restoring a saved day. */
    setValue(next) { selected = next; paint(); },
    destroy() { cleanups.forEach((fn) => fn()); cleanups.length = 0; }
  };
}
