/**
 * core/components/MoodRibbon.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The mood history, drawn. One mark per day.
 *
 * ============================================================================
 * WHY THERE IS NO LINE BETWEEN THE MARKS
 * ============================================================================
 *   A line chart says: these points are a trajectory, and the trajectory
 *   continues. That is an inference the app is not entitled to make and the
 *   user should not be invited to make either. A line going down for four
 *   days reads as "getting worse", and reads that way most strongly to the
 *   person least able to hear it.
 *
 *   Separate marks say only: this is what you said on Tuesday, and this is
 *   what you said on Wednesday. Which is all that is true.
 *   Clinical Framework §12.4.
 *
 * ============================================================================
 * WHAT THIS COMPONENT REFUSES TO DRAW
 * ============================================================================
 *   No trend line. No average. No moving average. No axis of numbers. No
 *   gridlines. No "best week". No comparison to last month. No highlighting
 *   of a run of low days. No annotation of any kind.
 *
 *   A gap is drawn as a small dot on the baseline and is NEVER labelled. It
 *   is not "missed", not "no data", not a broken line. The screen says
 *   "Blank days are just blank" once, in words, and then leaves them alone.
 *
 * ============================================================================
 * WHY THIS IS HAND-WRITTEN SVG AND NOT A CHART LIBRARY
 * ============================================================================
 *   The technical brief listed Chart.js as an option. It is not used, for
 *   three reasons in ascending order of importance:
 *
 *     1. It is ~60KB for a drawing this app could do in 80 lines.
 *     2. It would be the first runtime dependency in the codebase, and
 *        "zero runtime dependencies" is what makes the offline promise
 *        absolute rather than aspirational.
 *     3. DECISIVELY: every chart library is built to make trends legible.
 *        Its defaults are axes, gridlines, tooltips with values, and a line
 *        through the points. Every one of those is a thing this chart must
 *        not have, so the library would be fought at every step and would win
 *        eventually — someone would enable a default because it looked
 *        better. Eighty lines that CANNOT draw a trend line are safer than a
 *        library configured not to.
 *
 *   The garden and Mika are hand-drawn SVG for the same reason and it has
 *   worked well twice.
 *
 * DEPENDENCIES  ./icons.js (svgEl), core/utils/date
 * SPEC          Clinical Framework §12.4; Design Language §14; PRD S28-S30
 */

import { svgEl } from './icons.js';
import { el } from '../utils/dom.js';

const W = 320;
const H = 116;
const BASE = 96;          // the baseline the marks stand on
const TOP = 14;           // the tallest a mark may reach

/**
 * Build the ribbon.
 *
 * @param {Object} config
 * @param {string[]} config.days       local date keys, oldest first
 * @param {Map<string, number>} config.moodByDay  dateKey → 1..5
 * @param {(mood:number) => string} config.wordFor  mood → the user-facing word
 * @param {(dateKey:string) => string} config.dateLabel
 * @returns {HTMLElement} a figure containing the drawing and its text equivalent
 */
export function MoodRibbon({ days, moodByDay, wordFor, dateLabel }) {
  const svg = svgEl('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'ribbon',
    /* The drawing itself is hidden from assistive technology and replaced by
       the real list below it. A screen reader user gets the same information
       as everyone else — the actual days and the actual words — rather than a
       summary somebody wrote about the chart. */
    'aria-hidden': 'true',
    focusable: 'false'
  });

  const step = W / Math.max(1, days.length);
  const barW = Math.max(3, Math.min(9, step - 3));

  days.forEach((dateKey, i) => {
    const x = i * step + (step - barW) / 2;
    const mood = moodByDay.get(dateKey);

    if (!mood) {
      /* A blank day. A small dot on the baseline — not a gap in a line, not
         a hollow marker, not a dashed segment. Nothing that reads as absence
         needing explanation. */
      svg.appendChild(svgEl('circle', {
        cx: x + barW / 2, cy: BASE + 3, r: 1.6, class: 'ribbon__blank'
      }));
      return;
    }

    /* Height carries the same metaphor the words already use — the scale runs
       from "heavy" to "light", and up is lighter. Colour carries it too, so
       the encoding survives greyscale and colour vision deficiency. */
    const height = ((mood - 1) / 4) * (BASE - TOP) + 8;

    svg.appendChild(svgEl('rect', {
      x, y: BASE - height, width: barW, height,
      rx: barW / 2,
      class: `ribbon__day ribbon__day--${mood}`
    }));
  });

  /* The baseline. A hairline, not an axis — it has no ticks and no numbers.
     It exists so the marks have something to stand on. */
  svg.appendChild(svgEl('line', {
    x1: 0, y1: BASE + 6, x2: W, y2: BASE + 6, class: 'ribbon__base'
  }));

  /* Two dates, at the ends. Enough to know what you are looking at, and not
     enough to be an axis. */
  const first = days[0];
  const last = days[days.length - 1];

  const figure = el('figure', { class: 'ribbon-figure' }, [
    svg,
    el('figcaption', { class: 'ribbon-figure__caption t-caption' }, [
      el('span', {}, dateLabel(first)),
      el('span', {}, dateLabel(last))
    ]),
    /* THE TEXT EQUIVALENT.
       Not a description of the chart — the same facts, as a list. Only the
       days that have something in them, because a screen reader user should
       not have to listen to sixteen announcements of "nothing". */
    el('ul', { class: 'sr-only' },
      days
        .filter((d) => moodByDay.get(d))
        .map((d) => el('li', {}, `${dateLabel(d)}: ${wordFor(moodByDay.get(d))}`))
    )
  ]);

  return figure;
}

/**
 * The last `count` local date keys, oldest first, ending today.
 *
 * Built from local dates rather than UTC for the same reason everything else
 * in this app is: for a user at UTC+8 a UTC day boundary puts the early
 * morning on the wrong day, and here that would silently shift a whole
 * column of the chart. core/utils/date.js.
 */
export function lastDays(count, today = new Date()) {
  const out = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    out.push(`${d.getFullYear()}-${m}-${day}`);
  }
  return out;
}
