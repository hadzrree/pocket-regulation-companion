/**
 * features/regulate/regulate.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The Breathe tab — everything that lowers arousal, in one place.
 *
 * ============================================================================
 * TWO CHOICES, NOT A MENU
 * ============================================================================
 *   Breathing and grounding. That is the whole tab.
 *
 *   Most regulation apps offer a library — box breathing, 4-7-8, alternate
 *   nostril, body scan, progressive muscle relaxation, twelve guided
 *   meditations — and the library itself becomes the obstacle. A person who
 *   is dysregulated arrives at a list, has to evaluate options, cannot decide,
 *   and leaves without doing any of them. Choice is a cognitive cost, and
 *   this is the population least able to pay it. Clinical Framework §5.1.
 *
 *   So: two cards. One if you want your breathing to slow down, one if you
 *   want to come back into the room. Each says in a sentence what it will
 *   ask of you, so nobody has to start something to find out what it is.
 *
 * ============================================================================
 * WHY THE INTRO SAYS WHAT IT SAYS
 * ============================================================================
 *   "Nothing here needs you to be good at it."
 *
 *   A surprising number of people believe they are bad at breathing exercises,
 *   usually because an app once set a pace they could not follow. The line is
 *   there to disarm that before they start. Clinical Framework §13.
 *
 * DEPENDENCIES  core/components/Card, core/i18n, app/router
 * SPEC          PRD S11, S15-S17; Clinical Framework §5
 */

import { el, clear } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';
import { Card } from '../../core/components/Card.js';
import { Button } from '../../core/components/Button.js';
import { navigate } from '../../app/router.js';

export function mount(container) {
  clear(container);

  container.appendChild(
    el('div', { class: 'u-screen u-screen-y u-stack-lg regulate' }, [
      el('header', { class: 'u-stack-sm' }, [
        el('h1', { class: 't-h1' }, t('regulate.title')),
        el('p', { class: 't-subtitle' }, t('regulate.intro'))
      ]),

      Card({
        title: t('regulate.breatheTitle'),
        icon: 'wind',
        tone: 'calm',
        body: el('p', { class: 't-body' }, t('regulate.breatheBody')),
        actions: [
          Button({
            label: t('regulate.start'),
            variant: 'primary',
            size: 'lg',
            full: true,
            onClick: () => navigate('/calm')
          })
        ]
      }),

      Card({
        title: t('regulate.groundTitle'),
        icon: 'sprout',
        tone: 'dusk',
        body: el('p', { class: 't-body' }, t('regulate.groundBody')),
        actions: [
          Button({
            label: t('regulate.start'),
            variant: 'secondary',
            size: 'lg',
            full: true,
            onClick: () => navigate('/ground')
          })
        ]
      })

      /* MODULE 6 adds nothing to this tab. If a third practice is ever
         proposed, the question to answer first is which of these two it
         replaces — not where it fits underneath them. */
    ])
  );
}

export function unmount() {}
