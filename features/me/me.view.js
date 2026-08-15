/**
 * features/me/me.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   The Me tab — control, in plain language.
 *
 * MODULE 1 SCOPE
 *   The four accessibility preferences and language are LIVE here, not stubbed.
 *
 * WHY THESE SHIP IN MODULE 1 RATHER THAN LATER
 *   Accessibility settings are a clinical requirement, not a feature
 *   (Clinical Framework §14). Building the rest of the app without them means
 *   every screen gets designed against one text size and one contrast level,
 *   and retrofitting never fully works. Shipping them first means every
 *   subsequent module is developed with them switched on.
 *
 * NOT HERE, EVER
 *   Account, subscription, social, sharing. PRD §3.2.
 *
 * DEPENDENCIES  core/utils/dom, core/i18n, core/a11y/prefs, core/store
 * SPEC          PRD S52-S53; Architecture §3.4
 */

import { el, clear, on } from '../../core/utils/dom.js';
import { t, LANGUAGES } from '../../core/i18n/i18n.js';
import * as prefs from '../../core/a11y/prefs.js';
import { getState } from '../../core/store/store.js';

let cleanups = [];

/**
 * A labelled group of mutually exclusive options.
 * Uses a real radiogroup so arrow keys work and screen readers announce the
 * set size — a <div> with click handlers would not.
 */
function optionGroup({ label, name, options, value, onChange, hideLabel = false }) {
  const group = el('div', { class: 'setting', role: 'radiogroup', 'aria-label': label });
  // The visual label is hidden when a heading directly above already says it —
  // but aria-label above keeps the group named for screen readers, so nothing
  // is lost for assistive technology.
  if (!hideLabel) group.appendChild(el('p', { class: 't-label' }, label));

  const row = el('div', { class: 'setting__options' });
  for (const opt of options) {
    const selected = opt.value === value;
    const button = el(
      'button',
      {
        class: 'setting__option',
        type: 'button',
        role: 'radio',
        'aria-checked': String(selected),
        'data-name': name,
        'data-value': opt.value
      },
      opt.label
    );
    cleanups.push(on(button, 'click', () => onChange(opt.value)));
    row.appendChild(button);
  }
  group.appendChild(row);
  return group;
}

export function mount(container) {
  const s = getState().settings;

  const rerender = () => mount(container);

  const screen = el('div', { class: 'u-screen u-screen-y u-stack-lg' }, [
    el('h1', { class: 't-h1' }, t('me.title')),

    el('section', { class: 'u-stack' }, [
      el('h2', { class: 't-h3' }, t('me.appearance')),

      optionGroup({
        label: t('me.theme'),
        name: 'theme',
        value: s.theme,
        options: [
          { value: 'auto',  label: t('me.themeAuto') },
          { value: 'light', label: t('me.themeLight') },
          { value: 'dark',  label: t('me.themeDark') }
        ],
        onChange: (v) => { prefs.set('theme', v); rerender(); }
      }),

      optionGroup({
        label: t('me.textSize'),
        name: 'textSize',
        value: s.textSize,
        options: [
          { value: 's',   label: 'A' },
          { value: 'm',   label: 'A' },
          { value: 'l',   label: 'A' },
          { value: 'xl',  label: 'A' },
          { value: 'xxl', label: 'A' }
        ],
        onChange: (v) => { prefs.set('textSize', v); rerender(); }
      }),

      optionGroup({
        label: t('me.contrast'),
        name: 'contrast',
        value: s.contrast,
        options: [
          { value: 'normal', label: t('me.off') },
          { value: 'high',   label: t('me.on') }
        ],
        onChange: (v) => { prefs.set('contrast', v); rerender(); }
      }),

      optionGroup({
        label: t('me.motion'),
        name: 'motion',
        value: s.motion,
        options: [
          { value: 'full',    label: t('me.off') },
          { value: 'reduced', label: t('me.on') }
        ],
        onChange: (v) => { prefs.set('motion', v); rerender(); }
      })
    ]),

    el('section', { class: 'u-stack' }, [
      el('h2', { class: 't-h3' }, t('me.language')),
      optionGroup({
        label: t('me.language'),
        hideLabel: true,
        name: 'lang',
        value: s.lang,
        options: LANGUAGES.map((l) => ({ value: l.code, label: l.label })),
        onChange: (v) => { prefs.set('lang', v); rerender(); }
      })
    ]),

    /* The visible scope statement. Required by Clinical Framework §12.6 —
       it appears here and in onboarding, in both languages. */
    el('section', { class: 'u-stack' }, [
      el('h2', { class: 't-h3' }, t('me.about')),
      el('p', { class: 't-body-sm t-muted' }, t('scope.statement'))
    ])

    /* MODULE 7 adds below: reminders, safe contacts, crisis numbers,
       your data (export / restore / delete). */
  ]);

  clear(container);
  container.appendChild(screen);
}

export function unmount() {
  cleanups.forEach((fn) => fn());
  cleanups = [];
}
