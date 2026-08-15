/**
 * core/components/Card.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The container that holds almost everything on a screen.
 *
 * WHY CARDS AT ALL
 *   A card gives one idea one boundary. For a user with poor concentration —
 *   which is most users of this app, most of the time — an unbounded wall of
 *   text is genuinely harder to read than the same words inside three
 *   separate soft rectangles. The boundary does cognitive work.
 *   Design Language §6; Clinical Framework §5.2.
 *
 * THE ONE-IDEA RULE
 *   A card holds ONE idea. If a card needs two headings, it is two cards.
 *   This is not an aesthetic preference — it is the visual expression of the
 *   "one decision at a time" rule that governs the whole product.
 *
 * TONE VARIANTS
 *   Cards carry a tone, which is a soft tint plus a left edge. The tone must
 *   never be the only signal — every toned card also carries a word or an
 *   icon, because roughly 1 in 12 men has a colour vision deficiency and this
 *   app is used by people who are not looking carefully.
 *
 * DEPENDENCIES  core/utils/dom, core/utils/haptics, ./icons.js
 * SPEC          Design Language §6
 */

import { el, on, once } from '../utils/dom.js';
import { pulse, HAPTIC } from '../utils/haptics.js';
import { icon as buildIcon } from './icons.js';

/**
 * @param {Object} config
 * @param {string} [config.title]
 * @param {string} [config.icon]                icons.js name, shown beside the title
 * @param {(Node|string)[]|Node|string} [config.body]
 * @param {Node[]} [config.actions]             buttons, laid out in a row
 * @param {'plain'|'calm'|'warm'|'dusk'|'care'} [config.tone='plain']
 * @param {'flat'|'raised'|'sunken'} [config.elevation='raised']
 * @param {Function} [config.onClick]           makes the whole card a button
 * @param {string} [config.class]
 * @returns {HTMLElement}
 */
export function Card({
  title,
  icon,
  body,
  actions,
  tone = 'plain',
  elevation = 'raised',
  onClick,
  class: extra
} = {}) {
  const interactive = typeof onClick === 'function';

  const classes = [
    'card',
    `card--${tone}`,
    `card--${elevation}`,
    interactive ? 'card--interactive' : null,
    extra || null
  ].filter(Boolean).join(' ');

  const children = [];

  if (title) {
    children.push(
      el('div', { class: 'card__head' }, [
        icon ? buildIcon(icon, { size: 20, class: 'card__icon' }) : null,
        el('h2', { class: 'card__title t-h3' }, title)
      ].filter(Boolean))
    );
  }

  if (body !== undefined && body !== null) {
    children.push(el('div', { class: 'card__body u-stack-sm' }, [].concat(body)));
  }

  if (actions && actions.length) {
    children.push(el('div', { class: 'card__actions' }, actions));
  }

  // An interactive card is a real <button>, not a div with a click handler.
  // A div is not reachable by keyboard, not announced as actionable, and not
  // activated by Enter or Space. Architecture §9.2.
  const node = interactive
    ? el('button', { type: 'button', class: classes }, children)
    : el('section', { class: classes }, children);

  if (interactive) {
    node.__cleanup = on(node, 'click', once((e) => { pulse(HAPTIC.tap); onClick(e); }));
  }

  return node;
}

/**
 * A card that presents exactly one line of text and nothing else.
 * Used for the response after a check-in, and for gentle notices.
 */
export function NoteCard(text, tone = 'calm') {
  return Card({ body: el('p', { class: 't-body' }, text), tone, elevation: 'flat' });
}
