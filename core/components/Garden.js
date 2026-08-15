/**
 * core/components/Garden.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The garden. Drawn entirely from the growth ledger.
 *
 * ============================================================================
 * THE ONE RULE: IT CANNOT GO BACKWARDS
 * ============================================================================
 *   Every input to this drawing is derived from a sum of an append-only
 *   store. There is no code path here — or anywhere beneath it — that can
 *   make the garden smaller. Not after a bad week, not after three months
 *   away, not ever.
 *
 *   This is the single most load-bearing product decision in the app. A
 *   garden that wilts when you stop using it converts a support tool into a
 *   debt, and it punishes exactly the people it was built for: the ones whose
 *   weeks fall apart. "Your plant died while you were unwell" is a sentence
 *   this app must never be able to produce, so the machinery that could
 *   produce it does not exist. Clinical Framework §9.2.
 *
 * ============================================================================
 * WHY EVERY SINGLE THING IS DRAWN, NOT JUST THE TOTAL
 * ============================================================================
 *   The main plant grows in five stages, which is coarse — someone who checks
 *   in twice sees no change. So each growth entry also places its own small
 *   object in the soil: a tuft of grass, a pebble, a tiny flower. Check in
 *   once and something appears that was not there before.
 *
 *   Positions come from a deterministic hash of the entry's index, not from
 *   Math.random(). The garden must look IDENTICAL every time it is opened. A
 *   garden that rearranges itself on each visit is decoration; a garden that
 *   stays put is a place, and only a place accumulates meaning.
 *
 * ============================================================================
 * WHY THE SKY FOLLOWS THE CLOCK
 * ============================================================================
 *   Dawn, day and dusk. It is the one thing in the drawing that is not earned
 *   — it simply matches when you happen to be looking. Someone opening the
 *   app at 3am should not be shown bright midday sunshine; it reads as the
 *   app not knowing where you are.
 *
 * DEPENDENCIES  ./icons.js (svgEl), core/utils/date
 * SPEC          Design Language §17; Clinical Framework §9; PRD S31-S33
 */

import { svgEl } from './icons.js';
import { partOfDay } from '../utils/date.js';

/** How many individual objects the soil will hold before it stops adding. */
const MAX_SCATTER = 28;

/** Unique per instance, so two gardens on one page cannot share gradient ids. */
let instance = 0;

/**
 * A deterministic pseudo-random number in [0, 1) from two integers.
 *
 * NOT Math.random(). The whole point is that entry number 7 lands in the same
 * spot today, tomorrow, and in six months.
 */
function hashed(index, salt) {
  const x = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Build the garden.
 *
 * @param {Object} config
 * @param {number} config.stage   1..5, from growth.repo.stageFor()
 * @param {number} config.total   the raw growth total, for the scatter
 * @returns {SVGElement}
 */
export function Garden({ stage = 1, total = 0 } = {}) {
  instance += 1;
  const uid = `garden-${instance}`;
  const sky = partOfDay();           // lateNight | morning | afternoon | evening

  const svg = svgEl('svg', {
    viewBox: '0 0 320 240',
    class: `garden garden--${sky} garden--stage-${stage}`,
    role: 'img',
    'aria-label': 'Your garden'
  });

  /* ---- gradients ------------------------------------------------------- */
  const defs = svgEl('defs');
  const skyGradient = svgEl('linearGradient', { id: `${uid}-sky`, x1: 0, y1: 0, x2: 0, y2: 1 }, [
    svgEl('stop', { offset: '0%',   class: 'garden__sky-top' }),
    svgEl('stop', { offset: '100%', class: 'garden__sky-bottom' })
  ]);
  defs.appendChild(skyGradient);
  svg.appendChild(defs);

  /* ---- sky ------------------------------------------------------------- */
  svg.appendChild(svgEl('rect', { x: 0, y: 0, width: 320, height: 200, fill: `url(#${uid}-sky)` }));

  /* ---- sun or moon ------------------------------------------------------
     One soft disc. It moves across the sky with the time of day, which is a
     small thing nobody will consciously notice and everybody would notice the
     absence of. */
  const sunX = sky === 'morning' ? 68 : sky === 'afternoon' ? 160 : 248;
  svg.appendChild(svgEl('circle', { cx: sunX, cy: 48, r: 18, class: 'garden__sun' }));
  svg.appendChild(svgEl('circle', { cx: sunX, cy: 48, r: 28, class: 'garden__sun-halo' }));

  /* ---- hills ----------------------------------------------------------- */
  svg.appendChild(svgEl('path', {
    d: 'M0 168 Q 70 128 148 162 T 320 150 L320 200 L0 200 Z',
    class: 'garden__hill garden__hill--far'
  }));
  svg.appendChild(svgEl('path', {
    d: 'M0 186 Q 96 152 190 182 T 320 176 L320 210 L0 210 Z',
    class: 'garden__hill garden__hill--near'
  }));

  /* ---- soil ------------------------------------------------------------ */
  svg.appendChild(svgEl('path', {
    d: 'M0 196 Q 160 182 320 196 L320 240 L0 240 Z',
    class: 'garden__soil'
  }));

  /* ---- the scatter · one object per thing the person actually did ------- */
  const scatter = svgEl('g', { class: 'garden__scatter' });
  const count = Math.min(total, MAX_SCATTER);
  for (let i = 0; i < count; i += 1) {
    let x = 16 + hashed(i, 1) * 288;
    const y = 202 + hashed(i, 2) * 30;
    // Keep the middle clear so the main plant is never crowded.
    if (x > 132 && x < 188) x = x < 160 ? x - 52 : x + 52;
    scatter.appendChild(scatterPiece(i, x, y));
  }
  svg.appendChild(scatter);

  /* ---- the main plant --------------------------------------------------- */
  svg.appendChild(plant(stage));

  /* ---- fireflies, only at the last stage --------------------------------
     The one purely decorative flourish in the app, and it arrives late enough
     that it means something when it does. */
  if (stage >= 5) {
    const flies = svgEl('g', { class: 'garden__fireflies' });
    for (let i = 0; i < 6; i += 1) {
      flies.appendChild(svgEl('circle', {
        cx: 30 + hashed(i, 7) * 260,
        cy: 90 + hashed(i, 9) * 80,
        r: 2.4,
        class: 'garden__firefly',
        style: `animation-delay: ${(i * 0.7).toFixed(1)}s`
      }));
    }
    svg.appendChild(flies);
  }

  return svg;
}

/** One small object in the soil. Three kinds, cycled by index. */
function scatterPiece(index, x, y) {
  const kind = index % 3;
  const scale = 0.75 + hashed(index, 3) * 0.4;

  if (kind === 0) {
    // A tuft of grass.
    return svgEl('path', {
      d: `M${x} ${y} q -2 -8 -5 -11 M${x} ${y} q 0 -9 0 -13 M${x} ${y} q 2 -8 5 -11`,
      class: 'garden__grass',
      transform: `translate(0 0) scale(1)`,
      style: `transform-origin:${x}px ${y}px; transform: scale(${scale.toFixed(2)})`
    });
  }

  if (kind === 1) {
    // A pebble.
    return svgEl('ellipse', {
      cx: x, cy: y, rx: 4 * scale, ry: 2.8 * scale,
      class: 'garden__pebble'
    });
  }

  // A tiny flower: a stem and a head.
  const g = svgEl('g', { class: 'garden__bud' });
  g.appendChild(svgEl('path', { d: `M${x} ${y} l0 -9`, class: 'garden__bud-stem' }));
  g.appendChild(svgEl('circle', {
    cx: x, cy: y - 11, r: 2.6 * scale,
    class: index % 6 === 2 ? 'garden__bud-head' : 'garden__bud-head garden__bud-head--alt'
  }));
  return g;
}

/**
 * The main plant. Everything about it is a function of the stage.
 *
 *   stage 1  a sprout, two leaves
 *   stage 2  taller, four leaves
 *   stage 3  taller still, six leaves
 *   stage 4  the first bloom
 *   stage 5  three blooms
 */
function plant(stage) {
  const g = svgEl('g', { class: 'garden__plant' });
  const baseY = 208;
  const height = 22 + stage * 14;          // 36 → 92
  const pairs = Math.min(4, stage);        // leaf pairs
  const blooms = stage >= 4 ? stage - 3 : 0;

  g.appendChild(svgEl('path', {
    d: `M160 ${baseY} Q 156 ${baseY - height / 2} 160 ${baseY - height}`,
    class: 'garden__stem'
  }));

  for (let i = 0; i < pairs; i += 1) {
    const y = baseY - 14 - (height - 18) * (i / Math.max(1, pairs));
    const span = 20 - i * 2;
    g.appendChild(svgEl('path', {
      d: `M159 ${y} q -${span} -3 -${span + 4} -12 q ${span} -1 ${span + 2} 11 Z`,
      class: 'garden__leaf'
    }));
    g.appendChild(svgEl('path', {
      d: `M161 ${y} q ${span} -3 ${span + 4} -12 q -${span} -1 -${span + 2} 11 Z`,
      class: 'garden__leaf garden__leaf--alt'
    }));
  }

  for (let i = 0; i < blooms; i += 1) {
    const bx = 160 + (i === 0 ? 0 : i === 1 ? -22 : 22);
    const by = baseY - height + (i === 0 ? -2 : 14);
    const petals = svgEl('g', { class: 'garden__bloom' });
    for (let p = 0; p < 5; p += 1) {
      const angle = (p / 5) * Math.PI * 2;
      petals.appendChild(svgEl('ellipse', {
        cx: bx + Math.cos(angle) * 5.5,
        cy: by + Math.sin(angle) * 5.5,
        rx: 4.4, ry: 3.4,
        class: i % 2 === 0 ? 'garden__petal' : 'garden__petal garden__petal--alt'
      }));
    }
    petals.appendChild(svgEl('circle', { cx: bx, cy: by, r: 3, class: 'garden__bloom-centre' }));
    g.appendChild(petals);
  }

  return g;
}
