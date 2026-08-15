/**
 * features/today/today.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The Today screen — the default view and the app's home.
 *
 * THE FOUR ZONES (UX Strategy §4.2)
 *   1 · Presence      the date and a greeting. Nothing is asked.
 *   2 · Being met     the check-in. ONE question, once a day.      ← Module 2
 *   3 · The one thing exactly one task. Never two.                   Module 4
 *   4 · The offer     one contextual action, in the thumb zone.      Module 3
 *
 * MODULE 2 SCOPE
 *   Zones 1 and 2 are live. Zone 3 is ABSENT rather than stubbed — an empty
 *   "Your task will appear here" box is worse than nothing, because it
 *   advertises a hole. Zone 4 carries a quiet link to Feelings until Module 3
 *   gives it the calm offer it is meant to have.
 *
 * WHY MOUNT IS SYNCHRONOUS AND THE DATA ARRIVES AFTER
 *   The router's view contract is synchronous. The greeting needs no storage,
 *   so it paints immediately; the check-in card is inserted the moment
 *   IndexedDB answers, usually within a frame or two. The screen therefore
 *   never shows a spinner. A loading spinner on this app's home screen would
 *   be a small anxiety for no benefit. Design Language §11.5.
 *
 * DEPENDENCIES  core/utils/dom, core/i18n, core/utils/date, core/store,
 *               features/checkin, app/router
 * SPEC          UX Strategy §4.2; PRD S08-S14
 */

import { el, clear, on } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';
import { localDateKey, partOfDay, formatDate } from '../../core/utils/date.js';
import { getState } from '../../core/store/store.js';
import { CheckIn, loadToday } from '../checkin/checkin.js';
import { icon as buildIcon } from '../../core/components/icons.js';
import { navigate } from '../../app/router.js';

let cleanups = [];
let checkin = null;
/** Guards against a late storage answer landing after the view unmounted. */
let alive = false;

export function mount(container) {
  alive = true;
  const { settings, lang } = getState();

  /* --- Zone 1 · Presence -------------------------------------------------
     The greeting adapts to the hour, and at 3am it says "It's late. I'm here."
     rather than "Good morning" — being told good morning at 3am by an app you
     opened because you cannot sleep is a small, specific cruelty. */
  const header = el('header', { class: 'u-stack-sm' }, [
    el('p', { class: 't-label' }, formatDate(localDateKey(), lang)),
    el('h1', { class: 't-h1' }, settings.name
      ? `${t(`greeting.${partOfDay()}`).replace(/\.$/, '')}, ${settings.name}.`
      : t(`greeting.${partOfDay()}`)),
    el('p', { class: 't-subtitle' }, t('today.subtitle'))
  ]);

  /* --- Zone 2 · Being met ------------------------------------------------ */
  const checkinSlot = el('div', { class: 'today__checkin' });

  /* --- Zone 3 · The one thing --------------------------------------------
     MODULE 4: exactly ONE task card goes here. A second card is a design
     failure, not a feature request. Nothing renders until then. */

  /* --- Zone 4 · The offer ------------------------------------------------
     MODULE 3 replaces this with the contextual 64px primary button whose
     label changes with the check-in. Until the breathing pacer exists that
     button would lead to an empty screen, so this zone carries an honest link
     to something that IS built. */
  const seeFeelings = el('button', { type: 'button', class: 'today__link' }, [
    el('span', {}, t('today.seeFeelings')),
    buildIcon('chevronRight', { size: 18 })
  ]);
  cleanups.push(on(seeFeelings, 'click', () => navigate('/feelings')));

  const screen = el('div', { class: 'u-screen u-screen-y u-stack-lg today' }, [
    header,
    checkinSlot,
    el('div', { class: 'today__offer' }, seeFeelings)
  ]);

  clear(container);
  container.appendChild(screen);

  loadToday().then((record) => {
    if (!alive) return;   // the user navigated away while storage was opening
    checkin = CheckIn({ record });
    checkinSlot.appendChild(checkin.node);
  });
}

export function unmount() {
  alive = false;
  if (checkin) { checkin.destroy(); checkin = null; }
  cleanups.forEach((fn) => fn());
  cleanups = [];
}
