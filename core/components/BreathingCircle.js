/**
 * core/components/BreathingCircle.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The paced breathing circle. The single most clinically loaded
 *           component in the product.
 *
 * ============================================================================
 * WHY IT STARTS FAST AND SLOWS DOWN — "MATCHED, THEN SLOWED"
 * ============================================================================
 *   Almost every breathing app opens at its target pace: a slow 10 or 12
 *   second cycle, immediately. For someone who is calm, that is pleasant. For
 *   someone whose breathing is currently short and fast — which is the person
 *   this screen exists for — it is a rhythm they cannot reach. They try, they
 *   fall behind, and falling behind at a breathing exercise becomes one more
 *   piece of evidence that they cannot do things properly. A meaningful
 *   number of people conclude that breathing exercises "don't work for me"
 *   on exactly this experience.
 *
 *   So the circle starts at a 5.5 second cycle, which is close to where an
 *   anxious person's breathing already is, and lengthens by a small amount
 *   each cycle until it reaches 12 seconds. The user is never asked to jump.
 *   They are followed, and then gradually led.
 *
 *   This is entrainment — the same principle a physiotherapist uses when they
 *   match a patient's step rate before slowing it, rather than telling them
 *   to walk slower.
 *
 * ============================================================================
 * WHY THE OUT-BREATH IS LONGER THAN THE IN-BREATH
 * ============================================================================
 *   The target cycle is 4 seconds in, 2 hold, 6 out — roughly five breaths a
 *   minute. Slow paced breathing in this range has consistent evidence for
 *   reducing self-reported anxiety and physiological arousal, and a longer
 *   exhale than inhale is the common feature of the protocols that show an
 *   effect.
 *
 *   THE APP DOES NOT EXPLAIN WHY IT WORKS, and this file will not either
 *   beyond that. Mechanistic claims about the vagus nerve are widespread in
 *   wellbeing apps and are not currently well supported — a 2026 review by a
 *   large group of autonomic researchers found the popular framing untenable.
 *   The practice is kept; the mechanism story is not told. Telling a person a
 *   confident physiological story that later turns out to be wrong costs
 *   trust that this app cannot afford.
 *   Clinical Framework §2.8.
 *
 * ============================================================================
 * WHAT THIS COMPONENT NEVER SAYS
 * ============================================================================
 *   "Take a deep breath." Not once, anywhere.
 *
 *   It is the single most common instruction given to a panicking person and
 *   one of the least helpful. A deep breath is effortful, it is often what
 *   the person is already doing too much of, and in hyperventilation it makes
 *   things worse. It is also a demand at a moment when the person has no
 *   capacity to meet demands.
 *
 *   The circle shows "In", "Hold" and "Out" — descriptions of what the shape
 *   is doing, which the user may follow or ignore. Nothing is asked.
 *
 * ============================================================================
 * REDUCED MOTION
 * ============================================================================
 *   With "Reduce movement" on, the circle DOES NOT CHANGE SIZE. A large shape
 *   growing and shrinking in the centre of the visual field is exactly the
 *   pattern that triggers vestibular symptoms.
 *
 *   The pacing does not disappear, though — that would leave the screen
 *   useless for the people who need the accommodation. Instead the circle
 *   holds one size and its fill opacity eases between two values. There is no
 *   travel and no scale change, so there is nothing for the vestibular system
 *   to track, but the rhythm is still visible. The word and the haptic pulse
 *   carry it too.
 *
 * DEPENDENCIES  core/utils/dom, core/utils/haptics, core/i18n, ./icons.js
 * SPEC          Clinical Framework §2, §7; Design Language §11; PRD S15-S17
 */

import { el } from '../utils/dom.js';
import { svgEl } from './icons.js';
import { pulse, HAPTIC, stop as stopHaptics } from '../utils/haptics.js';
import { t } from '../i18n/i18n.js';
import { getState } from '../store/store.js';

/** The pace ramp, in milliseconds per complete cycle. */
export const PACE = Object.freeze({
  START: 5500,     // close to where an anxious person's breathing already is
  TARGET: 12000,   // 4 in · 2 hold · 6 out — about five breaths a minute
  STEP: 900        // added per cycle. Reaches target on roughly cycle 8.
});

/** Phase proportions of a cycle. They stay constant as the cycle lengthens. */
const SHAPE = Object.freeze({ in: 4 / 12, hold: 2 / 12, out: 6 / 12 });

/** How large the circle is at each end of a breath. */
const SCALE = Object.freeze({ small: 0.56, large: 1 });
const FADE  = Object.freeze({ dim: 0.42, bright: 1 });   // reduced-motion path

/**
 * @param {Object} [config]
 * @param {(info:{cycles:number}) => void} [config.onCycle]  after each full breath
 * @returns {{node, start, stop, cycles}}
 */
export function BreathingCircle({ onCycle } = {}) {
  let timer = null;
  let animation = null;
  let cycles = 0;
  let cycleMs = PACE.START;
  let running = false;

  /* The shape. An SVG circle rather than a div, so the ring and the fill
     scale together crisply at any size and on any pixel density. */
  const disc = svgEl('svg', { viewBox: '0 0 200 200', class: 'breath__disc', 'aria-hidden': 'true' }, [
    svgEl('circle', { cx: 100, cy: 100, r: 92, class: 'breath__halo' }),
    svgEl('circle', { cx: 100, cy: 100, r: 78, class: 'breath__fill' })
  ]);

  const word = el('p', { class: 'breath__word' }, '');

  const node = el('div', { class: 'breath' }, [
    el('div', { class: 'breath__stage' }, [disc, word]),
    /* Screen reader users cannot see the circle. The phase is announced
       through this region — polite, so it never cuts across them mid-word. */
    el('p', { class: 'sr-only', 'aria-live': 'polite', 'data-role': 'breath-live' }, '')
  ]);

  const live = node.querySelector('[data-role="breath-live"]');

  /** True when the user has asked for less movement. */
  const reduced = () => getState().settings.motion === 'reduced';

  /**
   * Run one phase.
   * @param {'in'|'hold'|'out'} phase
   * @param {number} duration ms
   */
  function playPhase(phase, duration) {
    word.textContent = t(`calm.${phase}`);
    live.textContent = t(`calm.${phase}`);

    if (phase === 'in')  pulse(HAPTIC.breathIn);
    if (phase === 'out') pulse(HAPTIC.breathOut);

    if (animation) { animation.cancel(); animation = null; }
    if (phase === 'hold') return;   // the shape rests, deliberately

    const from = phase === 'in' ? SCALE.small : SCALE.large;
    const to   = phase === 'in' ? SCALE.large : SCALE.small;
    const fadeFrom = phase === 'in' ? FADE.dim : FADE.bright;
    const fadeTo   = phase === 'in' ? FADE.bright : FADE.dim;

    // Web Animations API rather than a CSS class swap: the duration changes
    // every cycle as the pace lengthens, and each phase needs to be cancelled
    // cleanly the instant the user stops. Animating transform and opacity
    // only keeps the whole thing on the compositor, so the rhythm cannot
    // stutter when something else is happening on the main thread — and a
    // stutter here is not cosmetic, it breaks the thing being entrained to.
    const keyframes = reduced()
      ? [{ opacity: fadeFrom }, { opacity: fadeTo }]
      : [{ transform: `scale(${from})`, opacity: fadeFrom },
         { transform: `scale(${to})`,   opacity: fadeTo }];

    animation = disc.animate(keyframes, {
      duration,
      /* A pure sine feel. A breath has no sharp start and no sharp stop. */
      easing: 'cubic-bezier(0.42, 0, 0.58, 1)',
      fill: 'forwards'
    });
  }

  /** Schedule the whole cycle, then lengthen it and go again. */
  function runCycle() {
    if (!running) return;

    const inMs   = Math.round(cycleMs * SHAPE.in);
    const holdMs = Math.round(cycleMs * SHAPE.hold);
    const outMs  = Math.round(cycleMs * SHAPE.out);

    playPhase('in', inMs);

    timer = setTimeout(() => {
      if (!running) return;
      playPhase('hold', holdMs);

      timer = setTimeout(() => {
        if (!running) return;
        playPhase('out', outMs);

        timer = setTimeout(() => {
          if (!running) return;
          cycles += 1;
          if (typeof onCycle === 'function') onCycle({ cycles });

          // Lengthen, but never past the target. The ramp stops; the
          // breathing does not.
          cycleMs = Math.min(PACE.TARGET, cycleMs + PACE.STEP);
          runCycle();
        }, outMs);
      }, holdMs);
    }, inMs);
  }

  return {
    node,

    start() {
      if (running) return;
      running = true;
      cycles = 0;
      cycleMs = PACE.START;
      runCycle();
    },

    /**
     * Stop everything. Called on unmount AND when the user leaves.
     *
     * A pacer left running after navigation would keep firing haptic pulses
     * on an unrelated screen — a buzz every few seconds with no visible
     * cause, which is worse than a battery drain. Architecture §4.5.
     */
    stop() {
      running = false;
      clearTimeout(timer);
      timer = null;
      if (animation) { animation.cancel(); animation = null; }
      stopHaptics();
      word.textContent = '';
      live.textContent = '';
    },

    /** Completed breaths so far. */
    get cycles() { return cycles; }
  };
}
