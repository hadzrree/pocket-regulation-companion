/**
 * features/mika/mika.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The Mika flow. Seven screens, two required actions.
 *
 * ============================================================================
 * THE SHAPE OF THE WHOLE THING
 * ============================================================================
 *     ARRIVE  →  TELL  →  HAND OVER  →  BE RECEIVED  →  LEAVE
 *
 *   The user is only required to act TWICE: write something, and hand it
 *   over. Every other screen has a cost-free exit, and not writing at all is
 *   a complete, supported outcome rather than an abandonment.
 *
 * ============================================================================
 * THE ORDER ON ARRIVAL IS LOAD-BEARING
 * ============================================================================
 *   The screen quiets FIRST. Then Mika arrives.
 *
 *   If Mika appears before the world softens, it reads as an interruption.
 *   Softening first, and then finding someone there, reads as being joined.
 *   It is 600 milliseconds of difference and it changes the whole feeling.
 *   Mika Spec §5 Screen 1.
 *
 * ============================================================================
 * MIKA DOES NOT WATCH THE FIELD
 * ============================================================================
 *   While the user types, Mika's gaze is averted. Being watched while writing
 *   something shameful is the single most reliable way to stop someone
 *   writing it. The gaze returns only when it receives.
 *
 * ============================================================================
 * THE 2.4 SECOND SILENCE AFTER RECEIVING
 * ============================================================================
 *   No button, no prompt, nothing. It will feel too long in a design review
 *   and it is correct. An immediate next-step prompt turns being heard into a
 *   transaction. Mika Spec §5 Screen 4, Appendix B.5.
 *
 * ============================================================================
 * NO ERROR MAY APPEAR DURING THE GATHERING OR IN QUIET MODE
 * ============================================================================
 *   The thought is written to storage BEFORE the animation starts, so a
 *   failure is known early and is spoken in Mika's voice on the received
 *   screen — never as a system toast, never mid-animation.
 *
 * DEPENDENCIES  core/components/Mika, core/content/mika-lines,
 *               core/safety/risk-phrases, core/storage/repositories/thought.repo,
 *               ./response-selector
 * SPEC          Mika Specification §5, §6, §10
 */

import { el, clear, on } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';
import { Mika, STATES } from '../../core/components/Mika.js';
import { Button } from '../../core/components/Button.js';
import { CrisisList } from '../../core/components/CrisisList.js';
import { navigate } from '../../app/router.js';
import { getState } from '../../core/store/store.js';
import { announce } from '../../core/a11y/announce.js';
import { isOk } from '../../core/utils/result.js';
import { pulse, HAPTIC } from '../../core/utils/haptics.js';
import * as thoughtRepo from '../../core/storage/repositories/thought.repo.js';
import * as moodRepo from '../../core/storage/repositories/mood.repo.js';
import * as growthRepo from '../../core/storage/repositories/growth.repo.js';
import * as risk from '../../core/safety/risk-phrases.js';
import { selectBucket, stateForBucket, BUCKETS } from './response-selector.js';
import {
  GREETINGS, INVITATIONS, PLACEHOLDERS, RESPONSES, ENDINGS,
  RISK_LINES, ERROR_LINES, say, pick
} from '../../core/content/mika-lines.js';

/* --------------------------------------------------------------------------
   MODULE STATE
   Reset in full by mount(). Nothing here survives a navigation.
-------------------------------------------------------------------------- */
let host = null;
let mika = null;
let cleanups = [];
let alive = false;

/* --------------------------------------------------------------------------
   MANAGED TIMERS
   --------------------------------------------------------------------------
   Every setTimeout in this file goes through later(). Nothing calls
   setTimeout directly.

   WHY THIS IS NOT FUSSINESS
   This flow is built almost entirely out of delays — a 600ms line stagger, a
   7.2 second gathering, a 2.4 second silence, a 3.2 second ending. Any one of
   them left running after the user navigates away will fire against a screen
   that no longer exists: a haptic pulse on the Garden tab, or — worse — a
   render call that wipes whatever the person opened next and replaces it with
   the tail end of a session they already left.

   Module 3 learned this with the breathing pacer. Same rule, enforced the
   same way: one list, cleared on every screen change and on unmount.
-------------------------------------------------------------------------- */
let timers = [];

function later(fn, ms) {
  const id = setTimeout(() => {
    timers = timers.filter((t) => t !== id);
    if (alive) fn();
  }, ms);
  timers.push(id);
  return id;
}

/** Cancel everything pending. Called on every screen change and on unmount. */
function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

let entry = 'direct';
let mood = null;
let holdingCount = 0;
let stage = 1;

let typedChars = 0;
let deletedChars = 0;
let fieldEnteredAt = 0;
let lastLength = 0;
let saveFailed = false;
let riskThisSession = false;   // in memory only. Never stored. Never exported.

const lang = () => getState().lang || 'en';
const reduced = () => getState().settings.motion === 'reduced';

/* ==========================================================================
   MOUNT
   ========================================================================== */
export function mount(container, params = {}) {
  alive = true;
  entry = params.from || 'direct';
  typedChars = 0;
  deletedChars = 0;
  lastLength = 0;
  saveFailed = false;
  riskThisSession = false;
  clearTimers();

  host = el('div', { class: 'mika-screen' });
  /* A visually hidden h1, appended to the CONTAINER rather than to `host`.

     WHY THIS SCREEN HAS NO VISIBLE HEADING AND STILL NEEDS ONE.
     The design is deliberately almost empty — a person arriving here is
     panicking or overwhelmed, and a title bar is one more thing to process.
     But a screen-reader user navigating by headings, which is the ordinary
     way of finding out where you are, lands on a page with no heading at all
     and is told nothing. The sighted user gets that answer from the shape of
     the screen; this gives the same answer to someone who cannot see it, and
     costs the visual design nothing. WCAG 2.4.6; Clinical Framework 14.2.

     It sits outside `host` on purpose: every state of this screen rebuilds
     `host` with clear(), so a heading inside it would survive exactly one
     render and then quietly vanish.
     Rebuilt on each mount so it always carries the current language. */
  clear(container);
  container.appendChild(el('h1', { class: 'sr-only' }, t('mika.title')));
  container.appendChild(host);

  /* Growth is for ARRIVING. It is recorded now, before anything is asked,
     so a person who opens Mika and immediately leaves has still grown the
     garden. Mika Spec §8.1. */
  thoughtRepo.growForVisit();

  Promise.all([
    moodRepo.today(),
    thoughtRepo.count(),
    growthRepo.total()
  ]).then(([moodResult, countResult, totalResult]) => {
    if (!alive) return;
    mood = isOk(moodResult) && moodResult.value ? moodResult.value.mood : null;
    holdingCount = isOk(countResult) ? countResult.value : 0;
    stage = growthRepo.stageFor(isOk(totalResult) ? totalResult.value : 0);
    renderArrival();
  });
}

export function unmount() {
  alive = false;
  clearTimers();
  if (mika) { mika.destroy(); mika = null; }
  cleanups.forEach((fn) => fn());
  cleanups = [];
  host = null;
  /* The risk match dies here, with the screen. It was never written down. */
  riskThisSession = false;
}

/* ==========================================================================
   SCREEN 1 · ARRIVAL
   ========================================================================== */
function renderArrival() {
  clear(host);
  host.dataset.screen = 'arrival';
  clearTimers();
  if (mika) mika.destroy();
  mika = Mika({ stage, holding: holdingCount, state: STATES.ATTENTIVE });

  const stageEl = el('div', { class: 'mika-screen__stage' }, mika.node);
  const lines = el('div', { class: 'mika-screen__lines u-stack-sm' });
  const actions = el('div', { class: 'mika-screen__foot u-stack-sm' });

  host.appendChild(stageEl);
  host.appendChild(lines);
  host.appendChild(actions);

  /* Announced ONCE. Ambient motion never produces an announcement, and Mika's
     presence is never re-announced on a state change. Mika Spec §11.1. */
  announce(t('mika.srPresence'));

  /* The greeting register comes from HOW they arrived and how their day is —
     never from anything they have written. */
  const greeting = say(greetingLine(), lang());
  const invitation = pick(INVITATIONS, lang());

  // One line at a time, 600ms apart. Nothing appears all at once.
  appendLine(lines, greeting, 0);
  appendLine(lines, invitation, 600);

  later(() => {
    if (!alive) return;
    actions.appendChild(Button({
      label: t('mika.yesPlease'), variant: 'primary', size: 'lg', full: true,
      onClick: renderWriting
    }));
    actions.appendChild(Button({
      label: t('mika.justSit'), variant: 'quiet', size: 'md', full: true,
      onClick: renderQuiet
    }));
    actions.appendChild(Button({
      label: t('common.notNow'), variant: 'ghost', size: 'md', full: true,
      onClick: leave
    }));
  }, 1300);
}

/** Which greeting belongs to this arrival. Never content-aware. */
function greetingLine() {
  const hour = new Date().getHours();
  if (entry === 'anger') return GREETINGS.anger;
  if (entry === 'numb') return GREETINGS.numb;
  if (mood !== null && mood <= 2) return GREETINGS.low;
  if (hour >= 23 || hour < 4) return GREETINGS.lateNight;
  if (hour < 11) return GREETINGS.morning;
  return GREETINGS.default;
}

function appendLine(parent, text, delay) {
  later(() => {
    if (!alive || !parent.isConnected) return;
    parent.appendChild(el('p', { class: 'mika-line t-h3' }, text));
  }, delay);
}

/* ==========================================================================
   SCREEN 2 · THE FIELD
   ========================================================================== */
function renderWriting() {
  clear(host);
  host.dataset.screen = 'writing';
  clearTimers();
  fieldEnteredAt = Date.now();
  typedChars = 0;
  deletedChars = 0;
  lastLength = 0;

  mika.setState(STATES.RESTING);

  const field = el('textarea', {
    class: 'mika-field',
    rows: 5,
    placeholder: pick(PLACEHOLDERS, lang()),
    'aria-label': t('mika.fieldLabel'),
    /* No spellcheck correction, no autocapitalise, no autocorrect. The app
       does not tidy what someone writes about their own life. */
    spellcheck: 'false',
    autocapitalize: 'none',
    autocorrect: 'off'
  });

  const primary = Button({
    label: t('mika.holdThis'), variant: 'primary', size: 'lg', full: true,
    onClick: () => beginGathering(field.value)
  });
  // The button does not exist until there is something to hand over, so
  // "hand over an empty field" is not a state that can produce an error.
  primary.hidden = true;

  cleanups.push(on(field, 'input', () => {
    const length = field.value.length;
    if (length > lastLength) typedChars += length - lastLength;
    else deletedChars += lastLength - length;
    lastLength = length;
    primary.hidden = length === 0;
  }));

  /* Mika's gaze goes AWAY while they write. Being watched while writing
     something shameful is what stops people writing it. Spec §6.3. */
  cleanups.push(on(field, 'focus', () => mika.setState(STATES.RESTING)));

  host.appendChild(el('div', { class: 'mika-screen__aside' }, mika.node));
  host.appendChild(el('div', { class: 'mika-screen__field u-stack' }, [field]));
  host.appendChild(el('div', { class: 'mika-screen__foot u-stack-sm' }, [
    primary,
    Button({
      label: t('mika.keepItMyself'), variant: 'quiet', size: 'md', full: true,
      onClick: () => renderEnding({ bucket: BUCKETS.QUIET, kept: true })
    }),
    Button({
      label: t('mika.ratherNotWrite'), variant: 'ghost', size: 'md', full: true,
      onClick: renderQuiet
    })
  ]));

  later(() => { if (alive) field.focus(); }, 120);
}

/* ==========================================================================
   SCREEN 3 · THE GATHERING
   ========================================================================== */
async function beginGathering(text) {
  const seconds = Math.round((Date.now() - fieldEnteredAt) / 1000);
  const length = text.length;
  const deletionRatio = typedChars > 0 ? deletedChars / typedChars : 0;

  /* THE RISK MATCH.
     Run here, on the device, in memory. The result is a boolean that lives
     until unmount and is never written anywhere. It does NOT change the
     animation, does not shorten it, and does not stop the thought being
     taken — refusing it would communicate "what you said is too much", the
     precise message that stops people disclosing. Mika Spec §10.4.3. */
  riskThisSession = risk.matches(text) && risk.mayShow();
  if (riskThisSession) risk.markShown();

  /* SAVED BEFORE THE ANIMATION. If the app is killed mid-gathering, the
     thought is already held. Spec §12 case 10. */
  const saved = await thoughtRepo.hold(text, { entry });
  saveFailed = !isOk(saved);
  if (!saveFailed) holdingCount += 1;

  const bucket = selectBucket({
    length, seconds, deletionRatio, mood, entry, hour: new Date().getHours()
  });

  playGathering(text, () => renderReceived(bucket));
}

/**
 * The centrepiece. 7.2 seconds, skippable at any frame by tapping anywhere.
 *
 * NOTHING IS EATEN, SWALLOWED, CRUSHED, BURNED OR DELETED. The leaves pass
 * through Mika's translucent shell and settle inside, where they stay
 * visible. Acceptance, holding, transforming — never erasure. Spec §5 Screen 3.
 */
function playGathering(text, done) {
  clear(host);
  host.dataset.screen = 'gathering';
  clearTimers();
  mika.setState(STATES.RECEIVING);

  const scene = el('div', { class: 'gathering' });
  const leafLayer = el('div', { class: 'gathering__leaves' });
  const mikaSlot = el('div', { class: 'gathering__mika' }, mika.node);
  scene.appendChild(leafLayer);
  scene.appendChild(mikaSlot);
  host.appendChild(scene);

  announce(t('mika.srGathering'));

  /* Six to fourteen leaves, sized by how much was written. Never one leaf per
     word — that would make the animation a measurement of the person's
     output. */
  const count = Math.max(6, Math.min(14, Math.round(text.length / 18) + 5));

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    cleanupSkip();
    announce(t('mika.srHeld'));
    done();
  };

  /* Skippable by a tap ANYWHERE — no precise target, because someone in
     acute distress must never be made to watch an animation, and may have a
     tremor. Spec §5 Screen 3, §11.4. */
  const offSkip = on(scene, 'click', finish);
  const cleanupSkip = () => offSkip();
  cleanups.push(offSkip);

  if (reduced()) {
    /* Reduced motion: no travel, no walking. The leaves simply fade in over
       Mika at 40% scale and the core warms. 1.6s, and the meaning survives
       entirely. Spec §6.7. */
    for (let i = 0; i < Math.min(6, count); i += 1) {
      const leaf = el('span', { class: 'leaf leaf--still' });
      leaf.style.setProperty('--i', String(i));
      leafLayer.appendChild(leaf);
    }
    later(finish, 1600);
    return;
  }

  for (let i = 0; i < count; i += 1) {
    const leaf = el('span', { class: 'leaf' });
    // Drift, never scatter. Deterministic jitter so it never looks chaotic.
    const spread = ((i % 5) - 2) * 34 + (i % 2 ? 12 : -12);
    const rise = -40 - (i % 4) * 22;
    leaf.style.setProperty('--x', `${spread}px`);
    leaf.style.setProperty('--y', `${rise}px`);
    leaf.style.setProperty('--d', `${(i * 0.09).toFixed(2)}s`);
    leafLayer.appendChild(leaf);

    // A soft pulse as each of the first five is received. Never more than
    // five across the whole sequence.
    if (i < 5) later(() => pulse(HAPTIC.tap), 1600 + i * 900);
  }

  later(finish, 7200);
}

/* ==========================================================================
   SCREEN 4 · RECEIVED
   ========================================================================== */
function renderReceived(bucket) {
  if (!alive) return;
  clear(host);
  host.dataset.screen = 'received';
  clearTimers();

  mika.setState(stateForBucket(bucket));
  mika.setStage(stage, holdingCount);

  const sentence = saveFailed
    ? say(ERROR_LINES.storageFull, lang())
    : riskThisSession
      ? say(RISK_LINES.received, lang())
      : pick(RESPONSES[bucket] || RESPONSES.medium, lang());

  const laterSlot = el('div', { class: 'mika-screen__foot u-stack-sm' });

  host.appendChild(el('div', { class: 'mika-screen__stage' }, mika.node));
  host.appendChild(el('div', { class: 'mika-screen__lines' },
    el('p', { class: 'mika-line mika-line--received t-h3' }, sentence)));
  host.appendChild(laterSlot);

  announce(sentence);

  /* THE 2.4 SECOND SILENCE. No button, no prompt, nothing. It will feel too
     long in a design review. It is correct. */
  later(() => {
    if (!alive) return;
    if (riskThisSession) return renderRiskOffer(laterSlot);

    laterSlot.appendChild(Button({
      label: t('mika.anotherStep'), variant: 'secondary', size: 'lg', full: true,
      onClick: renderNextStep
    }));
    laterSlot.appendChild(Button({
      label: t('mika.imFinished'), variant: 'quiet', size: 'md', full: true,
      onClick: () => renderEnding({ bucket })
    }));
  }, 2400);
}

/**
 * The risk offer.
 *
 * A CARD, not a modal. It does not cover the screen, does not block, and
 * cannot trap. No red, no warning icon, no alarm colour — threat cues raise
 * arousal, and this is a person who has just told the truth about something
 * very hard. Spec §10.4.3, §10.4.5.
 */
function renderRiskOffer(slot) {
  clear(slot);

  const card = el('section', {
    class: 'card card--care card--flat mika-risk',
    role: 'region',
    /* POLITE, never assertive. An interruption here would be alarming. */
    'aria-live': 'polite'
  }, [
    el('h2', { class: 'card__title t-h3' }, say(RISK_LINES.cardTitle, lang())),
    el('p', { class: 't-body' }, say(RISK_LINES.cardBody, lang())),
    CrisisList(),
    /* Covers the false positive — quoted lyrics, dark humour, describing a
       past state — without ever asking the person to justify themselves. */
    el('p', { class: 't-caption t-muted' }, say(RISK_LINES.notYou, lang()))
  ]);

  slot.appendChild(card);
  slot.appendChild(Button({
    label: t('mika.stayWithMe'), variant: 'secondary', size: 'lg', full: true,
    icon: 'wind',
    onClick: () => navigate('/calm')
  }));
  /* Always present, never styled as the lesser choice. */
  slot.appendChild(Button({
    label: t('mika.notRightNow'), variant: 'quiet', size: 'md', full: true,
    onClick: () => renderEnding({ bucket: BUCKETS.VERY_HEAVY, declinedHelp: true })
  }));
}

/* ==========================================================================
   SCREEN 5 · ONE SMALL STEP
   ========================================================================== */
function renderNextStep() {
  clear(host);
  host.dataset.screen = 'nextstep';
  clearTimers();
  mika.setState(STATES.ATTENTIVE);

  host.appendChild(el('div', { class: 'mika-screen__stage' }, mika.node));
  host.appendChild(el('div', { class: 'mika-screen__lines' },
    el('p', { class: 'mika-line t-h3' }, t('mika.anotherStep'))));

  /* THREE options maximum, and the third is always the exit. "Finish here" is
     never styled as the lesser choice, sits in the same position every time,
     and produces exactly the same growth as choosing an activity. */
  host.appendChild(el('div', { class: 'mika-screen__foot u-stack-sm' }, [
    Button({
      label: t('mika.stepBreathe'), variant: 'secondary', size: 'lg', full: true,
      icon: 'wind', onClick: () => navigate('/calm')
    }),
    Button({
      label: t('mika.stepGround'), variant: 'secondary', size: 'lg', full: true,
      icon: 'sprout', onClick: () => navigate('/ground')
    }),
    Button({
      label: t('common.finish'), variant: 'quiet', size: 'lg', full: true,
      onClick: () => renderEnding({ bucket: BUCKETS.MEDIUM })
    })
  ]));
}

/* ==========================================================================
   SCREEN 6 · QUIET MODE
   ==========================================================================
   A real destination, not a dead end. A significant proportion of users — in
   depressive episodes and in dissociative states — will open this and be
   unable to produce words. Making that a supported outcome rather than an
   abandonment is the difference between a feature that serves this population
   and one that serves only its articulate members. Spec §5 Screen 6.
   ========================================================================== */
function renderQuiet() {
  clear(host);
  host.dataset.screen = 'quiet';
  clearTimers();
  mika.setState(STATES.RESTING);

  host.appendChild(el('div', { class: 'mika-screen__stage' }, mika.node));
  host.appendChild(el('div', { class: 'mika-screen__lines' },
    el('p', { class: 'mika-line t-h3' }, pick(RESPONSES.quiet, lang()))));

  /* NOTHING happens for as long as the user stays. No prompt at 30s, at 60s,
     or ever. */
  host.appendChild(el('div', { class: 'mika-screen__foot u-stack-sm' }, [
    Button({
      label: t('mika.actuallyWrite'), variant: 'quiet', size: 'md', full: true,
      onClick: renderWriting
    }),
    Button({
      label: t('mika.imFinished'), variant: 'quiet', size: 'md', full: true,
      onClick: () => renderEnding({ bucket: BUCKETS.QUIET })
    })
  ]));
}

/* ==========================================================================
   SCREEN 7 · ENDING
   ==========================================================================
   The app's four-beat ending. Never "Done".
     1 Settle — 1.5s of Mika slowing, before any text
     2 Name   — what happened
     3 Meaning— why it counts
     4 Exit
   ========================================================================== */
function renderEnding({ bucket = BUCKETS.MEDIUM, kept = false, declinedHelp = false } = {}) {
  clear(host);
  host.dataset.screen = 'ending';
  clearTimers();
  mika.setState(STATES.RESTING);

  const stageEl = el('div', { class: 'mika-screen__stage' }, mika.node);
  const lines = el('div', { class: 'mika-screen__lines u-stack-sm' });
  const foot = el('div', { class: 'mika-screen__foot u-stack-sm' });
  host.appendChild(stageEl);
  host.appendChild(lines);
  host.appendChild(foot);

  const hour = new Date().getHours();
  let beat1;
  if (declinedHelp)                     beat1 = say(RISK_LINES.declined, lang());
  else if (kept)                        beat1 = t('mika.keptYours');
  else if (bucket === BUCKETS.QUIET)    beat1 = say(ENDINGS.quiet, lang());
  else if (bucket === BUCKETS.VERY_HEAVY) beat1 = say(ENDINGS.veryHeavy, lang());
  else if (bucket === BUCKETS.HEAVY)    beat1 = say(ENDINGS.heavy, lang());
  else                                  beat1 = say(ENDINGS.default, lang());

  const beat2 = (hour >= 23 || hour < 4) ? say(ENDINGS.lateNight, lang())
                                         : say(ENDINGS.meaning, lang());

  /* Beat 1 · Settle — 1.5 seconds of nothing before any text. */
  appendLine(lines, beat1, 1500);
  appendLine(lines, beat2, 2400);

  later(() => {
    if (!alive) return;
    announce(beat1);
    foot.appendChild(Button({
      label: t('common.stay'), variant: 'quiet', size: 'md', full: true,
      onClick: () => { clear(foot); renderQuiet(); }
    }));
    foot.appendChild(Button({
      label: t('common.ready'), variant: 'primary', size: 'lg', full: true,
      onClick: leave
    }));
  }, 3200);
}

/**
 * Mika's farewell: one slow blink, a settle, and it turns toward where it
 * keeps things. It does not wave, and it does not watch the user leave.
 */
function leave() {
  if (mika) mika.blinkOnce();
  later(() => navigate('/today'), 400);
}
