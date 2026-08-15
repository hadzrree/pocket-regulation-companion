/**
 * features/today/today.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The Today screen — the default view and the app's home.
 *
 * MODULE 1 SCOPE
 *   Zone 1 (Presence) only: the date and a greeting that adapts to time of
 *   day. Zones 2-4 (check-in, the one task, the contextual action) arrive in
 *   Module 2 and Module 4. The zone comments below mark exactly where.
 *
 * THE VIEW CONTRACT
 *   mount(container, params) · update(state)? · unmount()
 *   unmount() MUST remove every listener it added. Architecture §4.5.
 *
 * DEPENDENCIES  core/utils/dom, core/i18n, core/utils/date, core/store
 * SPEC          UX Strategy §4.2; PRD S08
 */

import { el, clear } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';
import { localDateKey, partOfDay, formatDate } from '../../core/utils/date.js';
import { getState } from '../../core/store/store.js';

/** Collected teardown functions. Emptied by unmount(). */
let cleanups = [];

export function mount(container) {
  const { settings, lang } = getState();

  /* --- Zone 1 · Presence ------------------------------------------------- */
  const dateLabel = el('p', { class: 't-label' }, formatDate(localDateKey(), lang));

  const greetingKey = `greeting.${partOfDay()}`;
  const greetingText = settings.name
    ? `${t(greetingKey).replace(/\.$/, '')}, ${settings.name}.`
    : t(greetingKey);

  const heading = el('h1', { class: 't-h1' }, greetingText);
  const subtitle = el('p', { class: 't-subtitle' }, t('today.subtitle'));

  const screen = el('div', { class: 'u-screen u-screen-y u-stack' }, [
    el('header', { class: 'u-stack-sm' }, [dateLabel, heading, subtitle])

    /* --- Zone 2 · Being met -------------------------------------------- */
    /* MODULE 2: MoodSelector goes here, inside a .card--mood.
       "How are you, right now?" — asked once per day, never twice. */

    /* --- Zone 3 · The one thing ---------------------------------------- */
    /* MODULE 4: exactly ONE task card. A second card is a design failure. */

    /* --- Zone 4 · The offer -------------------------------------------- */
    /* MODULE 3: one contextual 64px primary button, in the thumb zone.
       Its label changes with the check-in — see UX Strategy §4.2. */
  ]);

  clear(container);
  container.appendChild(screen);
}

export function unmount() {
  cleanups.forEach((fn) => fn());
  cleanups = [];
}
