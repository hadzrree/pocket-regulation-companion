/**
 * core/components/Mika.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Mika. The only face in the application.
 *
 * ============================================================================
 * THE ONE-SENTENCE TEST
 * ============================================================================
 *   "If Mika ever makes the user feel they owe it something, the feature has
 *   failed." — Mika Specification §1.4.
 *
 *   Everything below is downstream of that sentence. Mika has no needs, no
 *   hunger, no energy bar, no unread state, and no behaviour that happens
 *   while the user is away. It is identical on day 1 and day 400.
 *
 * ============================================================================
 * WHY A MOUND AND NOT AN ANIMAL
 * ============================================================================
 *   A soft, slightly irregular dome — a dew-covered stone, a moss mound, a
 *   settled drop. Never an animal, never a face on legs.
 *
 *   An animal is a pet, a pet has needs, and needs create obligation. A mound
 *   that sits on the ground and breathes is present without asking for
 *   anything. It also stays legible at 40px on a cracked phone screen, which
 *   an animal would not.
 *
 * ============================================================================
 * WHY IT IS TRANSLUCENT
 * ============================================================================
 *   `mika` is the everyday Malay word for the clear acetate sheet on the
 *   front of a bound report. That is exactly what this is: light passes
 *   through it, and the thoughts it holds stay faintly VISIBLE INSIDE.
 *
 *   Nothing is absorbed, hidden or destroyed. The user can see that what they
 *   set down still exists — which is the whole psychological point, because
 *   erasure is suppression and suppression produces rebound.
 *   Mika Specification §1.1, §2.3.
 *
 * ============================================================================
 * WHY IT BREATHES AT TWELVE SECONDS
 * ============================================================================
 *   The same 4-2-6 cycle the breathing pacer settles to. It is never
 *   mentioned to the user and there is no instruction to follow it. Watching
 *   a slow, steady, predictable presence provides weak but real co-regulation
 *   when no calm other is available. Mika Specification §2.1.
 *
 *   The core light pulses on a SEPARATE four-second cycle, deliberately out
 *   of phase with the breathing. Two rhythms drifting in and out of sync is
 *   what makes something read as alive rather than as a loop. That detail is
 *   the difference between a character and an animated GIF.
 *
 * ============================================================================
 * THE EMOTIONAL RANGE IS SIX STATES, AND THAT IS THE CEILING
 * ============================================================================
 *   There is NO sad state, NO worried state and NO disappointed state.
 *   A companion that looks upset when you are upset hands you a second person
 *   to take care of, at the moment you have least capacity for it.
 *   Mika Specification §7.3.
 *
 * ============================================================================
 * MIKA NEVER APPEARS IN CALM MODE
 * ============================================================================
 *   Absolute, and enforced by the fact that no distress view imports this
 *   file. A person in acute panic has no capacity to process a social
 *   stimulus, and two dots are a social stimulus. For a dissociating user it
 *   can increase derealisation. Mika Specification §7.5.
 *
 * DEPENDENCIES  ./icons.js (svgEl), core/store
 * SPEC          Mika Specification §6, §7, §8
 */

import { svgEl } from './icons.js';
import { getState } from '../store/store.js';

/** The five stages. Names are for the code only — never shown in the UI. */
export const STAGE_SIZE = Object.freeze({ 1: 40, 2: 48, 3: 56, 4: 64, 5: 76 });

/**
 * The six states Mika can be in. There is no seventh, and adding one is a
 * specification change, not a feature.
 */
export const STATES = Object.freeze({
  RESTING:    'resting',      // default: breathing, occasional blink, no mouth
  ATTENTIVE:  'attentive',    // gaze toward the user, one slow blink
  RECEIVING:  'receiving',    // during the gathering
  CONTENT:    'content',      // after a light or neutral hold — faint mouth
  COMFORTING: 'comforting',   // after a heavy hold — leans in, NO mouth
  GLAD:       'glad'          // growth moments only — two small hops
});

/** Body geometry on a 100 × 100 grid. The ground line is y = 88. */
const GROUND = 88;

let instance = 0;

/**
 * Build Mika.
 *
 * @param {Object} [config]
 * @param {number} [config.stage=1]      1..5, from growth.repo.stageFor()
 * @param {number} [config.holding=0]    how many thoughts are held — drawn inside
 * @param {string} [config.state]        a STATES value
 * @param {number} [config.size]         px; defaults to the stage's size
 * @returns {{node, setState, setStage, blinkOnce, destroy}}
 */
export function Mika({ stage = 1, holding = 0, state = STATES.RESTING, size } = {}) {
  instance += 1;
  const uid = `mika-${instance}`;
  let currentStage = Math.min(5, Math.max(1, stage));
  let currentState = state;
  let blinkTimer = null;

  const px = size || STAGE_SIZE[currentStage];

  const svg = svgEl('svg', {
    viewBox: '0 0 100 100',
    width: px,
    height: px,
    class: `mika mika--stage-${currentStage} is-${currentState}`,
    /* Announced ONCE on arrival by the view, then never again. Ambient motion
       must never produce a screen reader announcement. Mika Spec §11.1. */
    'aria-hidden': 'true',
    focusable: 'false'
  });

  const defs = svgEl('defs');
  defs.appendChild(
    svgEl('radialGradient', { id: `${uid}-core`, cx: '50%', cy: '55%', r: '55%' }, [
      svgEl('stop', { offset: '0%',   class: 'mika__core-in' }),
      svgEl('stop', { offset: '100%', class: 'mika__core-out' })
    ])
  );
  svg.appendChild(defs);

  /* Everything lives inside one group so breathing, sway and the hops can be
     composed as separate transforms without fighting each other. The origin
     is the GROUND LINE, not the centre — Mika grows from where it sits and is
     always touching the ground. Floating reads as anxious. Spec §7.1. */
  const sway = svgEl('g', { class: 'mika__sway' });
  const breath = svgEl('g', { class: 'mika__breath' });
  const body = svgEl('g', { class: 'mika__body' });

  svg.appendChild(sway);
  sway.appendChild(breath);
  breath.appendChild(body);

  build();
  startBlinking();

  /* -------------------------------------------------------------------------
     DRAWING
  ------------------------------------------------------------------------- */
  function build() {
    while (body.firstChild) body.removeChild(body.firstChild);

    const w = 46 + currentStage * 6;          // 52 → 76 wide
    const h = 34 + currentStage * 7;          // 41 → 69 tall
    const top = GROUND - h;

    /* ---- the shell ------------------------------------------------------
       One soft asymmetric dome. The right shoulder is fractionally lower than
       the left so it never reads as a machine-drawn semicircle. */
    body.appendChild(svgEl('path', {
      class: 'mika__shell',
      d: `M${50 - w / 2} ${GROUND}
          C ${50 - w / 2} ${top + h * 0.22}, ${50 - w * 0.30} ${top}, 50 ${top}
          C ${50 + w * 0.32} ${top}, ${50 + w / 2} ${top + h * 0.26}, ${50 + w / 2} ${GROUND} Z`
    }));

    /* ---- the core light -------------------------------------------------
       Drawn UNDER the held leaves so they read as floating inside the glow
       rather than sitting on top of it. */
    body.appendChild(svgEl('ellipse', {
      class: 'mika__core',
      cx: 50, cy: GROUND - h * 0.40,
      rx: w * 0.26, ry: h * 0.24,
      fill: `url(#${uid}-core)`
    }));

    /* ---- held thoughts, faintly visible inside ---------------------------
       This is the one thing Mika accumulates that the user can see, and it is
       NOT a score — it is a record of things said, any of which can be taken
       back. Capped at six shapes so a person with 200 held thoughts does not
       get a crowded companion. Spec §8.6. */
    const leaves = Math.min(6, holding);
    for (let i = 0; i < leaves; i += 1) {
      const angle = (i / Math.max(1, leaves)) * Math.PI * 2;
      body.appendChild(svgEl('ellipse', {
        class: 'mika__held',
        cx: 50 + Math.cos(angle) * w * 0.16,
        cy: GROUND - h * 0.40 + Math.sin(angle) * h * 0.16,
        rx: 3.4, ry: 2.2,
        transform: `rotate(${(angle * 180) / Math.PI} ${50 + Math.cos(angle) * w * 0.16} ${GROUND - h * 0.40 + Math.sin(angle) * h * 0.16})`
      }));
    }

    /* ---- growth elements -------------------------------------------------
       Each stage adds something permanent. Nothing here can ever be removed:
       the stage is derived from an append-only ledger, so there is no code
       path that could draw a smaller Mika than last time. Spec §8.4. */
    if (currentStage >= 2) {
      // one small leaf on the crown
      body.appendChild(svgEl('path', {
        class: 'mika__leaf',
        d: `M50 ${top} q 7 -4 10 -11 q -9 0 -11 10 Z`
      }));
    }
    if (currentStage >= 3) {
      // moss across the dome, and two small leaf-arms
      for (let i = 0; i < 5; i += 1) {
        body.appendChild(svgEl('circle', {
          class: 'mika__moss',
          cx: 50 + (i - 2) * (w * 0.13),
          cy: top + h * 0.20 + (i % 2) * 3,
          r: 2.2
        }));
      }
      body.appendChild(svgEl('path', {
        class: 'mika__arm',
        d: `M${50 - w / 2 + 2} ${GROUND - h * 0.30} q -8 -1 -11 -7 q 9 -2 12 6 Z`
      }));
      body.appendChild(svgEl('path', {
        class: 'mika__arm',
        d: `M${50 + w / 2 - 2} ${GROUND - h * 0.30} q 8 -1 11 -7 q -9 -2 -12 6 Z`
      }));
    }
    if (currentStage >= 4) {
      // one flower opens on the crown
      const fx = 50, fy = top - 4;
      const bloom = svgEl('g', { class: 'mika__bloom' });
      for (let p = 0; p < 5; p += 1) {
        const a = (p / 5) * Math.PI * 2;
        bloom.appendChild(svgEl('ellipse', {
          class: 'mika__petal',
          cx: fx + Math.cos(a) * 4.2, cy: fy + Math.sin(a) * 4.2,
          rx: 3.4, ry: 2.6
        }));
      }
      bloom.appendChild(svgEl('circle', { class: 'mika__bloom-core', cx: fx, cy: fy, r: 2.2 }));
      body.appendChild(bloom);
    }
    if (currentStage >= 5) {
      // a small canopy and two or three slow fireflies
      body.appendChild(svgEl('path', {
        class: 'mika__canopy',
        d: `M${50 - w * 0.42} ${top + 2} q ${w * 0.42} -16 ${w * 0.84} 0 q -${w * 0.42} 8 -${w * 0.84} 0 Z`
      }));
      for (let i = 0; i < 3; i += 1) {
        body.appendChild(svgEl('circle', {
          class: 'mika__firefly',
          cx: 50 + (i - 1) * (w * 0.34),
          cy: top - 8 - i * 4,
          r: 1.6,
          style: `animation-delay:${(i * 1.3).toFixed(1)}s`
        }));
      }
    }

    /* ---- the face --------------------------------------------------------
       Two dots and, sometimes, one curve. No eyelashes, no eyebrows, no
       whites. A face with detailed expression invites the user to read its
       mood and manage it — which is the opposite of the point. Spec §2.2. */
    const eyeY = GROUND - h * 0.30;
    const eyeX = w * 0.15;
    const face = svgEl('g', { class: 'mika__face' });

    face.appendChild(svgEl('ellipse', { class: 'mika__eye', cx: 50 - eyeX, cy: eyeY, rx: 2.1, ry: 2.1 }));
    face.appendChild(svgEl('ellipse', { class: 'mika__eye', cx: 50 + eyeX, cy: eyeY, rx: 2.1, ry: 2.1 }));

    /* THE MOUTH IS ABSENT AT REST. A permanent smile reads as performance.
       It appears only in `content` and `glad`.

       NOTE ON A SPECIFICATION CONFLICT: §7.1 lists the mouth as present in
       "content, comforting and happy", while the state table in §7.3 says
       comforting has "mouth absent". The state table wins — it is the more
       specific statement, and a smile while comforting someone after a heavy
       disclosure would be exactly wrong. */
    face.appendChild(svgEl('path', {
      class: 'mika__mouth',
      d: `M${50 - 4} ${eyeY + 6} q 4 3.4 8 0`
    }));

    body.appendChild(face);
  }

  /* -------------------------------------------------------------------------
     BLINKING
     Every 4-7 seconds, randomised, with a double-blink 14% of the time. A
     fixed interval is the single fastest way to make something look
     mechanical. Spec §6.2.
  ------------------------------------------------------------------------- */
  function startBlinking() {
    stopBlinking();
    const reduced = getState().settings.motion === 'reduced';
    // Reduced motion halves the frequency rather than removing it — blinking
    // is not travel and does not trigger vestibular symptoms, and a companion
    // that never blinks reads as dead. Spec §6.7.
    const base = reduced ? 9000 : 4000;
    const spread = reduced ? 5000 : 3000;

    const schedule = () => {
      blinkTimer = setTimeout(() => {
        blinkOnce();
        if (Math.random() < 0.14) setTimeout(blinkOnce, 260);
        schedule();
      }, base + Math.random() * spread);
    };
    schedule();
  }

  function stopBlinking() {
    if (blinkTimer) { clearTimeout(blinkTimer); blinkTimer = null; }
  }

  function blinkOnce() {
    svg.classList.add('is-blinking');
    setTimeout(() => svg.classList.remove('is-blinking'), 180);
  }

  /* -------------------------------------------------------------------------
     PUBLIC SURFACE
  ------------------------------------------------------------------------- */
  return {
    node: svg,

    /** Move to one of the six states. Anything else is ignored. */
    setState(next) {
      if (!Object.values(STATES).includes(next)) return;
      svg.classList.remove(`is-${currentState}`);
      currentState = next;
      svg.classList.add(`is-${currentState}`);
    },

    /** Redraw at a new stage, or with a different number of held thoughts. */
    setStage(nextStage, nextHolding) {
      currentStage = Math.min(5, Math.max(1, nextStage));
      if (typeof nextHolding === 'number') holding = nextHolding;
      svg.setAttribute('class', `mika mika--stage-${currentStage} is-${currentState}`);
      build();
    },

    blinkOnce,

    /**
     * Stop every timer. Views MUST call this in unmount().
     * A blink timer left running after navigation is a leak that also keeps
     * a detached DOM tree alive.
     */
    destroy() { stopBlinking(); }
  };
}
