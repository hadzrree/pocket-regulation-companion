/**
 * core/components/CrisisList.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The list of crisis phone numbers, built once and used everywhere.
 *
 * WHY THIS IS A COMPONENT AND NOT COPIED INTO EACH SCREEN
 *   It appears in three places already — the check-in, Calm Mode, and the
 *   help screen — and Module 7 adds a fourth in Settings. Three copies of a
 *   phone number list is three places for a number to go stale, and a crisis
 *   line that has changed its number is worse than no number at all: someone
 *   dials, gets a dead tone, and concludes that nobody is there.
 *
 *   One component reading one frozen constant means a number is corrected in
 *   exactly one file.
 *
 * WHY REAL <a href="tel:"> ANCHORS
 *   - They work even if the JavaScript on the page has failed.
 *   - They can be long-pressed to copy, which matters for a person who wants
 *     the number but is not ready to call right now.
 *   - A screen reader announces them as phone links rather than as buttons of
 *     unknown purpose.
 *   - The app never dials. Tapping hands the number to the phone's dialler,
 *     where the person still has to press call. That last press belongs to
 *     them. Clinical Framework §6.4.
 *
 * DEPENDENCIES  core/utils/dom, core/safety/crisis-resources, core/store,
 *               ./icons.js
 * SPEC          Clinical Framework §6; PRD S18
 */

import { el } from '../utils/dom.js';
import { icon as buildIcon } from './icons.js';
import { contactsFor } from '../safety/crisis-resources.js';
import { getState } from '../store/store.js';

/**
 * @param {Object} [config]
 * @param {string} [config.class] extra class names on the wrapper
 * @returns {HTMLElement}
 */
export function CrisisList({ class: extra } = {}) {
  const lang = getState().lang || 'en';
  const list = el('div', { class: `crisis-list u-stack-sm${extra ? ` ${extra}` : ''}` });

  for (const contact of contactsFor(lang)) {
    list.appendChild(
      el('a', { class: 'crisis-line', href: contact.dial }, [
        el('span', { class: 'crisis-line__body' }, [
          el('span', { class: 'crisis-line__name' }, contact.name),
          el('span', { class: 'crisis-line__number' }, contact.number),
          el('span', { class: 'crisis-line__note' }, `${contact.hours} · ${contact.note}`)
        ]),
        buildIcon('phone', { size: 20, class: 'crisis-line__icon' })
      ])
    );
  }

  return list;
}
