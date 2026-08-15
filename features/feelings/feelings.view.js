/**
 * features/feelings/feelings.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The Feelings tab — emotional entry and the personal record.
 *
 * MODULE 1 SCOPE  Placeholder. Module 2 delivers the mood check-in; the
 *                 eight-point entry map and mood history follow.
 *
 * NOTE  Never contains a score, a severity rating or a trend verdict.
 *       Clinical Framework §12.4.
 *
 * SPEC  PRD S26-S27
 */

import { el, clear } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';

export function mount(container) {
  clear(container);
  container.appendChild(
    el('div', { class: 'u-screen u-screen-y u-stack' }, [
      el('h1', { class: 't-h1' }, t('feelings.title')),
      el('p', { class: 't-caption' }, t('feelings.comingSoon'))
    ])
  );
}

export function unmount() {}
