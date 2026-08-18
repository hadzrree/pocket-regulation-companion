/**
 * features/body/body.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   "Something in my body" — noticing, recorded plainly, nothing else.
 *
 * ============================================================================
 * WHAT THIS SCREEN IS FOR
 * ============================================================================
 *   The appointment. Not browsing.
 *
 *   A person who cannot describe their symptoms in a ten-minute consultation
 *   gets worse care — not because they do not know, but because they are
 *   frightened and the question is hard. A short dated list of plain words
 *   fixes that, and it is the most useful thing this app can hand to a
 *   doctor.
 *
 *   Every decision below follows from building it for that, rather than for
 *   somebody scrolling their own symptom feed at 2am.
 *
 * ============================================================================
 * THE HISTORY IS NOT REACHABLE FROM HERE
 * ============================================================================
 *   You can record. You cannot scroll back through what you recorded.
 *
 *   That is deliberate and it is the most important structural decision in
 *   the feature. A scrollable symptom history is a body-checking instrument:
 *   the person reads yesterday's entry to decide whether today is worse, and
 *   the comparison generates the next check.
 *
 *   The record is not hidden — it is in the report, which is generated on
 *   purpose, for an appointment, in Module 6's report screen. Going and
 *   making a report is a deliberate act with a reason. Scrolling a feed is
 *   not.
 *
 * ============================================================================
 * THE APP NEVER SAYS WHAT IT IS
 * ============================================================================
 *   Not "this can happen with anxiety". Not "this is common". Not "try not
 *   to worry". Not "it's probably nothing".
 *
 *   Two reasons, and both are sufficient on their own:
 *     1. The app has no idea whether a racing heart is a panic attack or an
 *        arrhythmia, and the one time it guesses wrong is the time that
 *        matters.
 *     2. Reassurance is the specific thing that maintains health anxiety.
 *        Being told "it's nothing" relieves the person for an hour and
 *        teaches them to come back for more.
 *
 * DEPENDENCIES  core/content/symptom-catalogue, core/storage/repositories/symptom.repo
 * SPEC          Clinical Framework §10; PRD S34-S36
 */

import { el, clear, on } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';
import { Button } from '../../core/components/Button.js';
import { navigate } from '../../app/router.js';
import { getState } from '../../core/store/store.js';
import { announce } from '../../core/a11y/announce.js';
import { isOk } from '../../core/utils/result.js';
import { pulse, HAPTIC } from '../../core/utils/haptics.js';
import * as symptomRepo from '../../core/storage/repositories/symptom.repo.js';
import { REGIONS, sensationsIn, sensationText } from '../../core/content/symptom-catalogue.js';

let alive = false;
let cleanups = [];
let chosen = new Set();
let host = null;

export function mount(container) {
  alive = true;
  chosen = new Set();
  host = el('div', { class: 'u-screen u-screen-y u-stack body-log' });

  clear(container);
  container.appendChild(host);

  symptomRepo.mayRecord().then((allowed) => {
    if (!alive) return;
    if (isOk(allowed) && allowed.value === false) return renderEnough();
    renderPicker();
  });
}

/* ==========================================================================
   THE PICKER
   ========================================================================== */
function renderPicker() {
  const lang = getState().lang || 'en';
  clear(host);

  host.appendChild(el('h1', { class: 't-h2' }, t('body.title')));
  host.appendChild(el('p', { class: 't-subtitle' }, t('body.intro')));

  /* THE STANDING LINE. Present on every state of this screen, in ordinary
     body text, never styled as a warning. Something that looks like an alert
     on every visit stops being read by the third visit. */
  host.appendChild(el('p', { class: 'body-log__standing t-body-sm' }, t('body.standing')));

  const save = Button({
    label: t('body.note'), variant: 'primary', size: 'lg', full: true,
    onClick: handleSave
  });
  save.hidden = true;

  for (const region of REGIONS) {
    const chips = el('div', { class: 'body-log__chips' });

    for (const sensation of sensationsIn(region)) {
      /* aria-pressed, not a checkbox: these are toggles on a thing that
         happened, not a form being filled in. */
      const chip = el('button', {
        type: 'button',
        class: 'sensation',
        'aria-pressed': 'false',
        'data-sensation': sensation.id
      }, sensationText(sensation, lang));

      cleanups.push(on(chip, 'click', () => {
        const now = !chosen.has(sensation.id);
        if (now) chosen.add(sensation.id); else chosen.delete(sensation.id);
        chip.setAttribute('aria-pressed', String(now));
        pulse(HAPTIC.select);
        save.hidden = chosen.size === 0;
      }));

      chips.appendChild(chip);
    }

    host.appendChild(el('section', { class: 'body-log__region u-stack-sm' }, [
      el('h2', { class: 't-label' }, t(`body.region.${region}`)),
      chips
    ]));
  }

  /* An optional note, in the person's own words. Never parsed, never matched,
     never categorised — it exists so a detail that matters to a doctor
     ("only when I stand up") survives to the appointment. */
  const note = el('textarea', {
    class: 'mika-field body-log__note',
    rows: 3,
    placeholder: t('body.notePlaceholder'),
    'aria-label': t('body.notePlaceholder'),
    spellcheck: 'false'
  });
  host.appendChild(note);
  host.__note = note;

  host.appendChild(el('div', { class: 'u-stack-sm' }, [
    save,
    Button({
      label: t('common.back'), variant: 'quiet', size: 'md', full: true,
      onClick: () => navigate('/feelings')
    })
  ]));
}

async function handleSave() {
  const note = host.__note ? host.__note.value : '';
  const result = await symptomRepo.record([...chosen], { note });
  if (!alive) return;

  if (!isOk(result)) return renderEnough();
  renderNoted();
}

/* ==========================================================================
   AFTER SAVING
   ==========================================================================
   One word of acknowledgement, the standing line again, and a way out.

   NO interpretation. NO "that sounds like anxiety". NO suggestion to breathe
   — offering a regulation exercise straight after a physical symptom is the
   app implying it knows the cause, which is the one thing it must not do.
   ========================================================================== */
function renderNoted() {
  clear(host);
  announce(t('body.noted'));

  /* A distinct class from the cap state below. They look similar and mean
     very different things — one is "your entry is saved", the other is "the
     app has stopped asking for today" — and sharing a selector meant nothing
     in the code or in a test could tell them apart. */
  host.appendChild(el('div', { class: 'u-stack body-log__after body-log__noted' }, [
    el('p', { class: 't-h3' }, t('body.noted')),
    el('p', { class: 'body-log__standing t-body-sm' }, t('body.standing')),
    Button({
      label: t('common.back'), variant: 'primary', size: 'lg', full: true,
      onClick: () => navigate('/today')
    })
  ]));
}

/* ==========================================================================
   THE DAY'S ENTRIES ARE USED UP
   ==========================================================================
   The sentence is about the APP, never about the person. Not "you have
   logged too many times" — "that's enough for today, I've got what you told
   me". A person in a health-anxiety spiral being told they have done
   something too often has just been given one more thing to be wrong about.
   ========================================================================== */
function renderEnough() {
  clear(host);
  host.appendChild(el('div', { class: 'u-stack body-log__after body-log__enough' }, [
    el('h1', { class: 't-h3' }, t('body.enough')),
    el('p', { class: 'body-log__standing t-body-sm' }, t('body.standing')),
    Button({
      label: t('common.back'), variant: 'primary', size: 'lg', full: true,
      onClick: () => navigate('/feelings')
    })
  ]));
}

export function unmount() {
  alive = false;
  cleanups.forEach((fn) => fn());
  cleanups = [];
  chosen = new Set();
  host = null;
}
