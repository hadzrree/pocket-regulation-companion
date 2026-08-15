/**
 * core/components/EmptyState.js
 * ---------------------------------------------------------------------------
 * PURPOSE   What a screen shows before the user has done anything.
 *
 * WHY THIS IS A CLINICAL COMPONENT, NOT A COSMETIC ONE
 *   An empty screen is the first thing a new user sees, and quite often the
 *   thing a returning user sees after a bad month. The standard product
 *   pattern — "No entries yet! Add your first one" with a big call to action —
 *   reads as a demand. This app's empty states describe the state without
 *   assigning fault and without asking for anything:
 *
 *     "This is yours. It started when you did."   not   "No data yet!"
 *     "Nothing here yet. That's allowed."         not   "Get started now!"
 *
 *   Clinical Framework §5.4 and §13: the app never says missed, failed,
 *   overdue, or inactive, and an empty state is exactly where those words
 *   normally appear.
 *
 * DEPENDENCIES  core/utils/dom, ./icons.js
 * SPEC          Design Language §6.5; Clinical Framework §13
 */

import { el } from '../utils/dom.js';
import { icon as buildIcon } from './icons.js';

/**
 * @param {Object} config
 * @param {string} config.text        the whole message. One or two sentences.
 * @param {string} [config.icon]      an icons.js name, drawn very softly
 * @param {Node} [config.action]      an optional single button. Optional means
 *                                    optional — most empty states have none.
 * @returns {HTMLElement}
 */
export function EmptyState({ text, icon, action }) {
  return el('div', { class: 'empty' }, [
    icon ? el('div', { class: 'empty__glyph' }, buildIcon(icon, { size: 40 })) : null,
    el('p', { class: 'empty__text t-body' }, text),
    action || null
  ].filter(Boolean));
}
