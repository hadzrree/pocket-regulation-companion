/**
 * features/regulate/regulate.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The Regulate tab — everything that lowers arousal, in one place.
 *
 * MODULE 1 SCOPE  Placeholder. Module 3 delivers the breathing pacer, the
 *                 pattern picker, grounding and the sensory menu.
 *
 * SPEC  PRD S11; Clinical Framework §5
 */

import { el, clear } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';

export function mount(container) {
  clear(container);
  container.appendChild(
    el('div', { class: 'u-screen u-screen-y u-stack' }, [
      el('h1', { class: 't-h1' }, t('regulate.title')),
      el('p', { class: 't-body t-muted' }, t('regulate.intro')),
      el('p', { class: 't-caption' }, t('regulate.comingSoon'))
    ])
  );
}

export function unmount() {}
