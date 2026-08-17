/**
 * features/today/today.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The Today screen — the default view and the app's home.
 *
 * THE FOUR ZONES (UX Strategy §4.2)
 *   1 · Presence      the date and a greeting. Nothing is asked.
 *   2 · Being met     the check-in. ONE question, once a day.       Module 2
 *   3 · The one thing exactly one task. Never two.                   Module 4
 *   4 · The offer     one contextual action, in the thumb zone.    ← Module 3
 *
 * ============================================================================
 * ZONE 4 — WHY THE LABEL CHANGES WITH THE CHECK-IN
 * ============================================================================
 *   After "Light" or "Good" the button says "Breathe with me".
 *   After "Very heavy" or "Heavy" it says "Sit with me a minute".
 *
 *   Both open exactly the same screen. Nothing behind the button differs.
 *
 *   The wording is the intervention. "Breathe with me" describes an activity,
 *   which is fine when someone has the capacity for an activity. To a person
 *   who has just said their day is very heavy, an activity is one more
 *   demand — and the reliable finding in behavioural activation is that
 *   demand has to fall as capacity falls, or the person disengages entirely.
 *   "Sit with me a minute" asks for nothing except presence, which is the
 *   smallest possible ask, and it happens to be what the breathing screen
 *   actually delivers anyway. Clinical Framework §8.2; UX Strategy §4.2.
 *
 *   There is exactly ONE primary button on this screen. If a second ever
 *   appears, the screen is wrong, not the button.
 *
 * DEPENDENCIES  core/utils/dom, core/i18n, core/utils/date, core/store,
 *               core/components/Button, features/checkin, app/router
 * SPEC          UX Strategy §4.2; PRD S08-S14
 */

import { el, clear } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';
import { localDateKey, partOfDay, formatDate } from '../../core/utils/date.js';
import { getState } from '../../core/store/store.js';
import { CheckIn, loadToday } from '../checkin/checkin.js';
import { TaskCard, loadTask, reconsiderTask } from '../task/task-card.js';
import { Button } from '../../core/components/Button.js';
import { navigate } from '../../app/router.js';
import { on as busOn, EVENTS } from '../../core/events/bus.js';

let cleanups = [];
let checkin = null;
let taskCard = null;
let offerSlot = null;
let taskSlot = null;
/** Guards against a late storage answer landing after the view unmounted. */
let alive = false;

/**
 * Build (or rebuild) the single primary action.
 *
 * ============================================================================
 * THREE LABELS, THREE DESTINATIONS, ONE BUTTON
 * ============================================================================
 *   | Check-in            | Says                        | Opens  |
 *   |---------------------|-----------------------------|--------|
 *   | Very heavy          | Sit with me a minute        | /calm  |
 *   | Heavy               | Mika's here, if you want    | /mika  |
 *   | Okay, Good, Light,  | Breathe with me             | /calm  |
 *   | or no check-in yet  |                             |        |
 *
 *   WHY VERY HEAVY GETS THE BODY AND HEAVY GETS MIKA.
 *   The Mika specification says the companion becomes the primary action
 *   "after a Heavy check-in". At Very heavy it is one step further down: the
 *   smallest possible ask is presence, not writing, and writing is a real
 *   cognitive act that someone at the bottom of the scale may not have. The
 *   breathing screen asks for nothing at all, so that is what the worst day
 *   gets. Mika Spec §0, §4.2; Clinical Framework §8.2.
 *
 *   There is still exactly ONE primary button on this screen.
 */
function paintOffer(mood) {
  if (!offerSlot) return;
  clear(offerSlot);

  const toMika = mood === 2;
  const label = mood === 1 ? t('today.offerSit')
    : toMika ? t('today.offerMika')
    : t('today.offerBreathe');

  offerSlot.appendChild(
    Button({
      label,
      variant: 'primary',
      size: 'xl',          // 64px — the one primary action on a screen
      full: true,
      icon: toMika ? 'messageCircle' : 'wind',
      onClick: () => navigate(toMika ? '/mika' : '/calm')
    })
  );
}

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
     Exactly ONE task card. Never two. The slot stays empty until storage
     answers — an empty "your task will appear here" box advertises a hole. */
  taskSlot = el('div', { class: 'today__task' });

  /* --- Zone 4 · The offer ------------------------------------------------ */
  offerSlot = el('div', { class: 'today__offer' });
  paintOffer(null);

  const screen = el('div', { class: 'u-screen u-screen-y u-stack-lg today' }, [
    header,
    checkinSlot,
    taskSlot,
    offerSlot
  ]);

  clear(container);
  container.appendChild(screen);

  // The label and the task both follow the check-in, including when it is
  // made just now.
  cleanups.push(busOn(EVENTS.MOOD_LOGGED, async ({ mood, isFirst }) => {
    if (!alive) return;
    paintOffer(mood);

    if (isFirst) return showTask(mood);

    /* The check-in was CORRECTED inside its two-hour window. The task follows
       it down, never up — see task.repo.reconsider(). Correcting "Okay" to
       "Very heavy" and being left with a task chosen for the wrong day is
       exactly what the edit window exists to prevent. */
    const softer = await reconsiderTask(mood);
    if (softer && alive) paintTask(softer);
  }));

  loadToday().then((record) => {
    if (!alive) return;   // the user navigated away while storage was opening
    checkin = CheckIn({ record });
    checkinSlot.appendChild(checkin.node);
    paintOffer(record ? record.mood : null);

    /* THE TASK IS NOT OFFERED UNTIL THERE HAS BEEN A CHECK-IN.
       Two reasons, and the second is the important one:

       1. Order of address. Asking someone to do something before asking how
          they are is the wrong way round for a companion.

       2. The tier is chosen from the mood and then FIXED for the day — the
          task must not change every time the screen is opened. If the task
          were created on a first visit with no check-in, a person who then
          said "very heavy" would be stuck with a task chosen for a day they
          had not described. Waiting costs nothing and gets it right. */
    if (record) showTask(record.mood);
  });
}

/** Build zone 3 for a known mood. Safe to call more than once. */
async function showTask(mood) {
  const task = await loadTask(mood);
  if (!alive || !taskSlot) return;
  paintTask(task);
}

/** Render a task record into zone 3, replacing whatever was there. */
function paintTask(record) {
  if (!taskSlot) return;
  if (taskCard) taskCard.destroy();
  clear(taskSlot);
  taskCard = TaskCard({ record });
  taskSlot.appendChild(taskCard.node);
}

export function unmount() {
  alive = false;
  if (checkin) { checkin.destroy(); checkin = null; }
  if (taskCard) { taskCard.destroy(); taskCard = null; }
  offerSlot = null;
  taskSlot = null;
  cleanups.forEach((fn) => fn());
  cleanups = [];
}
