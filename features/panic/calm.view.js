/**
 * features/panic/calm.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Calm Mode — the screen for the worst moments.
 *
 * ============================================================================
 * THE ONE-THING RULE
 * ============================================================================
 *   This screen has a circle, a word, a way to stop, and a way to get a phone
 *   number. That is the complete list. No navigation bar, no header, no back
 *   chevron, no settings, no timer, no progress bar, no encouragement.
 *
 *   Every additional element on this screen is something a person in panic
 *   has to process and decide about. Panic narrows attention; a screen that
 *   assumes ordinary attention is a screen that fails at the moment it was
 *   built for. Clinical Framework §6.1.
 *
 * ============================================================================
 * WHY IT STARTS BY ITSELF
 * ============================================================================
 *   There is no "Begin" button. The circle is already moving when the screen
 *   opens.
 *
 *   A start button seems considerate, but it is one more decision at the
 *   precise moment decision-making is hardest, and it makes the app ask
 *   something before it gives anything. Someone who opened this by accident
 *   loses nothing: the way out is the largest control on the screen and the
 *   session is recorded without judgement either way.
 *
 * ============================================================================
 * NO ERROR CAN APPEAR HERE
 * ============================================================================
 *   The route is marked `distress: true`, which sets `inDistressFlow` in the
 *   store. That flag gates the global error handler, the toast system, the
 *   install prompt and service worker activation. If storage fails while
 *   someone is breathing, nothing happens on screen. The circle keeps moving.
 *   Clinical Framework §6.3; Architecture §12.1.
 *
 * ============================================================================
 * THE WAY OUT IS ALWAYS THERE
 * ============================================================================
 *   "Stop here" is visible from the first frame and never moves. There is no
 *   confirmation, no "are you sure", and no attempt to keep the user for one
 *   more breath. An app that makes leaving slightly difficult has learned the
 *   wrong lesson from engagement design, and in a distress flow it is a
 *   genuine harm — the person needs to know, before they commit, that they
 *   can get out instantly.
 *
 * DEPENDENCIES  core/components/BreathingCircle, core/components/Button,
 *               core/storage/repositories/session.repo, app/router
 * SPEC          Clinical Framework §5, §6; PRD S15-S17
 */

import { el, clear, on } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';
import { BreathingCircle } from '../../core/components/BreathingCircle.js';
import { Button } from '../../core/components/Button.js';
import { navigate } from '../../app/router.js';
import * as sessionRepo from '../../core/storage/repositories/session.repo.js';
import { announce } from '../../core/a11y/announce.js';

let circle = null;
let cleanups = [];
let startedAt = 0;
let recorded = false;
let host = null;

/**
 * Save the session exactly once, however the user left.
 *
 * There are three ways out of this screen — the stop button, the browser
 * back gesture, and switching tabs then navigating elsewhere — and all three
 * end up here. The `recorded` flag makes it safe to call more than once.
 *
 * A session with no completed breath is not saved. That is not a judgement
 * about effort: it is the case where someone opened the screen by accident
 * or closed it within a second, and inventing a record for that would make
 * the garden less honest, not more generous.
 */
function finish() {
  if (recorded || !circle) return;
  const cycles = circle.cycles;
  if (cycles < 1) { recorded = true; return; }
  recorded = true;
  // Fire and forget. A storage failure here must never surface — this runs
  // as the user is leaving a distress flow.
  sessionRepo
    .record({ kind: sessionRepo.KINDS.BREATHING, startedAt, cycles })
    .catch((err) => console.error('[calm] session not saved:', err));
}

export function mount(container) {
  recorded = false;
  startedAt = Date.now();

  circle = BreathingCircle();

  /* --- the way out. Present from the first frame, never moves. ---------- */
  const stopButton = Button({
    label: t('calm.stop'),
    variant: 'quiet',
    size: 'lg',
    full: true,
    onClick: stopAndShowAfter
  });

  /* --- a phone number, always reachable ---------------------------------
     The navigation bar is hidden on this screen, so without this there would
     be no route from panic to a crisis number without first leaving Calm
     Mode. It is a quiet text link rather than a button: present and findable,
     but not suggesting that the app thinks this is an emergency. */
  const helpLink = el('button', { type: 'button', class: 'calm__help' }, t('calm.help'));
  cleanups.push(on(helpLink, 'click', () => { finish(); navigate('/crisis'); }));

  host = el('div', { class: 'practice practice--calm' }, [
    el('div', { class: 'practice__stage' }, circle.node),
    el('div', { class: 'practice__foot u-stack-sm' }, [stopButton, helpLink])
  ]);

  clear(container);
  container.appendChild(host);

  // A single frame's pause before the first inhale, so the screen has settled
  // before anything starts moving. Any longer reads as the app hesitating.
  requestAnimationFrame(() => { if (circle) circle.start(); });
}

/** The stop button. Shows the closing line rather than leaving abruptly. */
function stopAndShowAfter() {
  if (circle) circle.stop();
  finish();

  clear(host);
  host.appendChild(
    el('div', { class: 'practice__after u-stack' }, [
      el('p', { class: 'practice__after-text t-h3' }, t('calm.after')),
      Button({
        label: t('common.back'),
        variant: 'primary',
        size: 'lg',
        full: true,
        onClick: () => navigate('/today')
      })
    ])
  );
  announce(t('calm.after'));
}

export function unmount() {
  if (circle) { circle.stop(); }
  finish();
  circle = null;
  cleanups.forEach((fn) => fn());
  cleanups = [];
  host = null;
}
