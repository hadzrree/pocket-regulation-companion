/**
 * features/garden/garden.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The Garden tab — effort, made living.
 *
 * MODULE 1 SCOPE  Placeholder with the day-one empty state, which is NOT
 *                 empty: the copy already assumes a seedling exists, because
 *                 the garden is given for arriving, not for achieving.
 *
 * THE RULE THIS VIEW MUST NEVER BREAK
 *   The garden is a pure function of the append-only growth ledger. It has no
 *   mutable state of its own and no ability to remove anything.
 *   Architecture §6.6; Clinical Framework §10.4.
 *
 * SPEC  PRD S50; Design Language §17
 */

import { el, clear } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';

export function mount(container) {
  clear(container);
  container.appendChild(
    el('div', { class: 'u-screen u-screen-y u-stack' }, [
      el('h1', { class: 't-h1' }, t('garden.title')),
      el('p', { class: 't-body t-muted' }, t('garden.empty')),
      el('p', { class: 't-caption' }, t('garden.comingSoon'))
    ])
  );
}

export function unmount() {}
