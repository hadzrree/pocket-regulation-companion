/**
 * features/ground/ground.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Grounding — five senses, one prompt at a time.
 *
 * ============================================================================
 * WHAT THIS IS FOR, AND WHAT IT IS NOT FOR
 * ============================================================================
 *   5-4-3-2-1 works by occupying attention with ordinary sensory detail. It
 *   is most useful for dissociation, spiralling thought, and the state of
 *   being somewhere but not really in the room.
 *
 *   It is NOT a breathing exercise and it is NOT a relaxation technique. It
 *   is deliberately boring. Nothing here is meant to feel nice; it is meant
 *   to be dull enough that attention has somewhere ordinary to rest.
 *
 * ============================================================================
 * WHY THERE IS NO TEXT BOX
 * ============================================================================
 *   Most implementations ask the user to TYPE the five things they can see.
 *   This one does not, for three reasons:
 *
 *     1. Typing is hard when your hands are shaking, and asking for it turns
 *        a grounding exercise into a data entry task.
 *     2. It changes the point. Looking around the room is the intervention.
 *        Writing it down is a record of the intervention.
 *     3. Anything typed would be stored, which means a person's disclosure
 *        during a bad moment now exists on their phone. The privacy promise
 *        is easiest to keep by not collecting it.
 *
 *   The app shows a prompt, waits as long as the person needs, and moves on
 *   when they say so. Nothing is captured.
 *
 * ============================================================================
 * NO TIMER
 * ============================================================================
 *   There is no countdown on any step. A timer converts an exercise into a
 *   test with a pass mark, and someone who is still looking for the fourth
 *   thing when the timer runs out has been told they were too slow at
 *   noticing a chair.
 *
 * DEPENDENCIES  core/components/Button, core/storage/repositories/session.repo
 * SPEC          Clinical Framework §5.3; PRD S16
 */

import { el, clear } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';
import { Button } from '../../core/components/Button.js';
import { icon as buildIcon } from '../../core/components/icons.js';
import { navigate } from '../../app/router.js';
import * as sessionRepo from '../../core/storage/repositories/session.repo.js';
import { announce } from '../../core/a11y/announce.js';
import { pulse, HAPTIC } from '../../core/utils/haptics.js';

/**
 * The five steps, in the standard descending order.
 *
 * WHY SIGHT FIRST AND TASTE LAST
 *   The count descends — five, four, three, two, one — so each step asks for
 *   less than the one before. Someone whose attention is fraying is given a
 *   progressively smaller task, and the exercise ends on the easiest one.
 *   Ending on the hardest would leave the person stuck at the point they were
 *   least able to finish.
 */
const STEPS = [
  { key: 'ground.step5', icon: 'sun' },
  { key: 'ground.step4', icon: 'heart' },
  { key: 'ground.step3', icon: 'messageCircle' },
  { key: 'ground.step2', icon: 'wind' },
  { key: 'ground.step1', icon: 'sprout' }
];

let index = 0;
let startedAt = 0;
let recorded = false;
let host = null;

/** Save once, however the user left. See the same pattern in calm.view.js. */
function finish() {
  if (recorded) return;
  recorded = true;
  if (index < 1) return;    // left immediately — nothing happened to record
  sessionRepo
    .record({ kind: sessionRepo.KINDS.GROUNDING, startedAt, cycles: index })
    .catch((err) => console.error('[ground] session not saved:', err));
}

export function mount(container) {
  index = 0;
  recorded = false;
  startedAt = Date.now();
  host = el('div', { class: 'practice practice--ground' });


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
  container.appendChild(el('h1', { class: 'sr-only' }, t('ground.title')));
  container.appendChild(host);
  render();
}

function render() {
  const step = STEPS[index];

  clear(host);
  host.appendChild(
    el('div', { class: 'practice__stage u-stack' }, [
      /* Five dots, not a percentage bar. A bar implies a quantity being
         filled and a point at which it is not yet full; five dots simply say
         which prompt this is. Design Language §14.3. */
      el('div', { class: 'steps', role: 'presentation' },
        STEPS.map((_, i) =>
          el('span', { class: `steps__dot${i <= index ? ' is-done' : ''}` })
        )
      ),
      el('div', { class: 'practice__glyph' }, buildIcon(step.icon, { size: 40 })),
      el('p', { class: 'practice__prompt t-h2' }, t(step.key))
    ])
  );

  host.appendChild(
    el('div', { class: 'practice__foot u-stack-sm' }, [
      Button({
        // The final step asks for one thing, not several.
        label: t(index === STEPS.length - 1 ? 'ground.nextOne' : 'ground.next'),
        variant: 'primary',
        size: 'lg',
        full: true,
        onClick: advance
      }),
      /* Leaving is always available and never made to look like giving up.
         Clinical Framework §8.3. */
      Button({
        label: t('common.finish'),
        variant: 'quiet',
        size: 'md',
        full: true,
        onClick: stopAndShowAfter
      })
    ])
  );

  announce(t(step.key));
}

function advance() {
  index += 1;
  pulse(HAPTIC.select);
  if (index >= STEPS.length) return stopAndShowAfter();
  render();
}

function stopAndShowAfter() {
  finish();
  clear(host);
  host.appendChild(
    el('div', { class: 'practice__after u-stack' }, [
      el('p', { class: 'practice__after-text t-h3' },
        index >= STEPS.length ? t('ground.after') : t('common.stopping')),
      Button({
        label: t('common.back'),
        variant: 'primary',
        size: 'lg',
        full: true,
        onClick: () => navigate('/today')
      })
    ])
  );
  announce(index >= STEPS.length ? t('ground.after') : t('common.stopping'));
}

export function unmount() {
  finish();
  host = null;
}
