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
import { Button } from '../../core/components/Button.js';
import { navigate } from '../../app/router.js';
import { isSupported as hapticsSupported } from '../../core/utils/haptics.js';
import { APP_VERSION } from '../../app/version.js';

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

/**
 * A plain text field for the person's name.
 *
 * OPTIONAL, AND SAYS SO. The greeting works perfectly without it, and asking
 * for a name is the first thing an app does when it wants to feel personal —
 * which is not the same as being useful. Anyone who leaves it blank should
 * feel that they chose, not that they skipped a step.
 *
 * It is stored in localStorage with the other preferences, never sent
 * anywhere, and never appears in a backup file's filename or in the report.
 */
function nameField(current, onCommit) {
  const input = el('input', {
    type: 'text',
    class: 'setting__text',
    value: current || '',
    placeholder: t('me.namePlaceholder'),
    'aria-label': t('me.name'),
    maxlength: '40',
    autocomplete: 'off',
    spellcheck: 'false'
  });
  /* Committed on blur rather than on every keystroke — saving mid-word means
     the greeting flickers through half-typed names on the next screen. */
  cleanups.push(on(input, 'change', () => onCommit(input.value.trim())));
  cleanups.push(on(input, 'blur', () => onCommit(input.value.trim())));
  return el('div', { class: 'setting' }, [
    el('p', { class: 't-label' }, t('me.name')),
    input
  ]);
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

    /* Name and haptics. Both are preferences about how the app behaves toward
       the person, so they sit above language and below appearance. */
    el('section', { class: 'u-stack' }, [
      nameField(s.name, (value) => { prefs.set('name', value); }),

      /* The toggle is only offered when the device can actually do it. iOS has
         never shipped navigator.vibrate, and a switch that does nothing is a
         promise the app cannot keep — worse than no switch at all.
         core/utils/haptics.js §2. */
      hapticsSupported()
        ? optionGroup({
            label: t('me.haptics'),
            name: 'haptics',
            value: s.haptics ? 'on' : 'off',
            options: [
              { value: 'off', label: t('me.off') },
              { value: 'on', label: t('me.on') }
            ],
            onChange: (val) => { prefs.set('haptics', val === 'on'); rerender(); }
          })
        : null
    ].filter(Boolean)),

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

    /* Your data. Take a copy, put one back, or destroy all of it. */
    el('section', { class: 'u-stack' }, [
      el('h2', { class: 't-h3' }, t('me.data')),
      Button({
        label: t('me.openData'), variant: 'secondary', size: 'lg', full: true,
        onClick: () => navigate('/data')
      })
    ]),

    /* The report. It lives HERE and nowhere else — not on Today, not in
       Feelings, not linked from any flow someone uses while struggling. That
       placement is what makes the counts on it defensible. See
       features/report/report.view.js. */
    el('section', { class: 'u-stack' }, [
      el('h2', { class: 't-h3' }, t('report.title')),
      Button({
        label: t('report.open'), variant: 'secondary', size: 'lg', full: true,
        onClick: () => navigate('/report')
      })
    ]),

    /* The visible scope statement. Required by Clinical Framework §12.6 —
       it appears here and in onboarding, in both languages. */
    el('section', { class: 'u-stack' }, [
      el('h2', { class: 't-h3' }, t('me.about')),
      el('p', { class: 't-body-sm t-muted' }, t('scope.statement')),
      /* A positive statement of something the app does NOT do.

         WHY THERE ARE NO REMINDERS, AND WHY THAT IS NOT A MISSING FEATURE.
         A web app cannot schedule a reliable local notification without a
         server pushing it. Anything built on top of that is a reminder that
         fires when the browser happens to be awake — which is most of the
         time, and then silently is not. For a medication reminder that is not
         a rough edge, it is a safety problem, and a person who has come to
         rely on it is worse off than one who never had it.

         Building it would also require a backend, which would end the "no
         server, nothing leaves the device" promise the whole app rests on.
         So it is not built, and the app says out loud that it will never
         chase anyone. Architecture §1.3; Clinical Framework §7.5. */
      el('p', { class: 't-body-sm t-muted' }, t('me.never')),
      /* The release number. Not decoration — with no server and no crash
         reporting, this line is the only way anyone can find out which code
         is on a given phone. See app/version.js. */
      el('p', { class: 't-caption t-muted' }, `${t('me.version')} ${APP_VERSION}`)
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
