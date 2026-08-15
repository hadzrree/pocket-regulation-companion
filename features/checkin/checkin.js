/**
 * features/checkin/checkin.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   The daily check-in, as a self-contained block that Today mounts.
 *
 * ============================================================================
 * THE THREE THINGS THIS COMPONENT IS CAREFUL ABOUT
 * ============================================================================
 *
 *   1. IT ASKS ONCE. Not once per visit — once per day. Returning to Today
 *      six times shows the answer already given, not the question again.
 *      Repeating the question turns a gentle enquiry into a demand and
 *      encourages minute-by-minute self-monitoring, which makes anxiety
 *      worse. Clinical Framework §12.2.
 *
 *   2. IT LOWERS WHAT IT ASKS FOR AS THE MOOD FALLS. The response to "Light"
 *      and the response to "Very heavy" are not the same sentence with a
 *      different adjective. At the bottom of the scale the app asks for
 *      nothing at all and offers a number instead. UX Strategy §5.1.
 *
 *   3. IT NEVER REPORTS A FAILURE THE USER CAUSED. If the save fails, the
 *      face still lights up and the response still appears — the user's
 *      answer was real, and telling them "couldn't save" makes a storage
 *      problem feel like a personal loss. A quiet toast explains it once, in
 *      words that blame nobody, and only outside a distress flow.
 *
 * ============================================================================
 * WHY THE CRISIS CARD APPEARS ON "VERY HEAVY" AND WHAT IT IS NOT
 * ============================================================================
 *   Selecting the lowest face reveals a quiet card offering phone numbers.
 *
 *   IT IS NOT A RISK ASSESSMENT. One low mood rating is not a suicide risk
 *   score, and this app does not compute one — an on-device app that flagged
 *   people as "at risk" would be making a clinical judgement it has no
 *   grounds for and no way to follow up.
 *
 *   IT IS NOT AN ALERT. Nobody is notified. Nothing is transmitted. No
 *   clinician, caregiver or service learns anything.
 *
 *   IT IS AN OFFER, and it is worded as one: "You don't have to be in danger
 *   to call." It appears below the response, in the "care" tone, at ordinary
 *   size — not as a modal, not as a red banner, not with an alarm icon.
 *   Making it dramatic would punish honesty, and a user who learns that
 *   answering truthfully summons an alarming screen will stop answering
 *   truthfully. Clinical Framework §6.2, §6.4.
 *
 * DEPENDENCIES  core/components/*, core/storage/repositories/mood.repo,
 *               core/i18n, core/store, core/a11y/announce
 * SPEC          PRD S12-S14, S18; Clinical Framework §6, §12
 */

import { el, clear } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';
import { MoodSelector } from '../../core/components/MoodSelector.js';
import { Card } from '../../core/components/Card.js';
import { Button } from '../../core/components/Button.js';
import { icon as buildIcon } from '../../core/components/icons.js';
import * as toast from '../../core/components/Toast.js';
import * as moodRepo from '../../core/storage/repositories/mood.repo.js';
import { CrisisList } from '../../core/components/CrisisList.js';
import { getState, setState } from '../../core/store/store.js';
import { announce } from '../../core/a11y/announce.js';
import { isOk } from '../../core/utils/result.js';
import { emit, EVENTS } from '../../core/events/bus.js';

/** The mood at or below which the crisis offer is shown. */
const CARE_THRESHOLD = 1;

/**
 * Build the check-in block.
 *
 * @param {Object} [config]
 * @param {Object|null} [config.record]   today's saved record, if any
 * @returns {{node: HTMLElement, destroy: Function}}
 */
export function CheckIn({ record = null } = {}) {
  let current = record;
  let selector = null;
  let crisisOpen = false;

  const host = el('div', { class: 'checkin u-stack' });

  /* --- the response line, revealed after a choice --------------------- */
  const responseSlot = el('div', { class: 'checkin__response', hidden: true });

  /* --- the crisis offer, revealed only on the lowest face -------------- */
  const careSlot = el('div', { class: 'checkin__care', hidden: true });

  function render() {
    clear(host);
    if (selector) selector.destroy();

    const editable = moodRepo.isEditable(current);

    selector = MoodSelector({
      value: current ? current.mood : null,
      disabled: !editable,
      onSelect: handleSelect
    });

    host.appendChild(
      Card({
        title: t('checkin.question'),
        icon: 'heart',
        body: selector.node,
        tone: 'plain',
        elevation: 'raised',
        class: 'card--checkin'
      })
    );

    host.appendChild(responseSlot);
    host.appendChild(careSlot);

    if (current) paintResponse(current.mood, { announceIt: false });
  }

  /** Show the sentence that belongs to this mood. */
  function paintResponse(mood, { announceIt = true } = {}) {
    clear(responseSlot);
    responseSlot.hidden = false;
    responseSlot.appendChild(
      el('p', { class: 'checkin__response-text t-subtitle' }, t(`checkin.response.${mood}`))
    );
    if (announceIt) announce(t(`checkin.response.${mood}`));

    if (mood <= CARE_THRESHOLD) showCare();
    else hideCare();
  }

  /* ---------------------------------------------------------------------
     THE CRISIS OFFER
     Revealed, not popped. No modal, no colour alarm, no icon that means
     "warning". Once opened it STAYS open for the session — collapsing it
     again because the user changed their face to "Heavy" would look like
     the app withdrawing an offer of help.
  --------------------------------------------------------------------- */
  function showCare() {
    if (crisisOpen) return;
    crisisOpen = true;
    clear(careSlot);
    careSlot.hidden = false;

    // The same list the help screen and Calm Mode use — one component, one
    // frozen source of numbers. See core/components/CrisisList.js.
    const numbers = CrisisList();
    numbers.hidden = true;

    const reveal = Button({
      label: t('crisis.open'),
      variant: 'secondary',
      size: 'md',
      icon: 'phone',
      onClick: () => {
        numbers.hidden = false;
        reveal.hidden = true;
        emit(EVENTS.CRISIS_OPENED, { from: 'checkin' });
        announce(t('crisis.title'));
      }
    });

    careSlot.appendChild(
      Card({
        title: t('crisis.cardTitle'),
        icon: 'phone',
        tone: 'care',
        elevation: 'flat',
        body: [
          el('p', { class: 't-body' }, t('crisis.cardBody')),
          reveal,
          numbers
        ]
      })
    );
  }

  function hideCare() {
    // Deliberately does nothing once the offer has been made. See showCare().
    if (!crisisOpen) { careSlot.hidden = true; clear(careSlot); }
  }

  /* ---------------------------------------------------------------------
     SAVING
  --------------------------------------------------------------------- */
  async function handleSelect(mood) {
    const wasFirst = !current;

    // Optimistic: the face lights and the sentence appears immediately.
    // Waiting for IndexedDB before acknowledging a feeling would introduce a
    // pause exactly where a pause reads as hesitation.
    paintResponse(mood);
    setState({ todayMood: mood });

    const result = await moodRepo.save(mood);

    if (isOk(result)) {
      current = result.value.record;
      // Only the first answer of the day is worth confirming out loud.
      // A toast on every adjustment would be chatter.
      if (wasFirst) toast.show(t('checkin.saved'), { tone: 'kept' });
      return;
    }

    if (result.code === 'mood-locked') {
      // Cannot normally happen — the selector is disabled when locked. If it
      // does, the app says nothing and repaints the real stored answer.
      const stored = await moodRepo.today();
      if (isOk(stored) && stored.value) {
        current = stored.value;
        render();
      }
      return;
    }

    // A genuine storage failure. One quiet sentence, once, and never inside
    // a distress flow — Toast.show() enforces that gate itself.
    //
    // Only codes that have a written, human sentence are shown. t() returns
    // the KEY when a translation is missing, so falling through to
    // `t('errors.' + code)` blindly could put "errors.storage-blocked" on
    // screen. An unlisted code gets the general sentence instead.
    const KNOWN = ['storage-full', 'general', 'dial-failed'];
    const code = KNOWN.includes(result.code) ? result.code : 'general';
    toast.show(t(`errors.${code}`), { tone: 'care' });
  }

  render();

  return {
    node: host,
    /** Replace the block's data — used when the day rolls over. */
    setRecord(next) { current = next; render(); },
    destroy() { if (selector) selector.destroy(); selector = null; }
  };
}

/**
 * Load today's record. A convenience so views do not import the repository
 * directly and do not have to unwrap the Result.
 * @returns {Promise<Object|null>}
 */
export async function loadToday() {
  const result = await moodRepo.today();
  return isOk(result) ? result.value : null;
}
