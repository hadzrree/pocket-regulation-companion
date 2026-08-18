/**
 * features/feelings/feelings.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The Feelings tab — the personal record.
 *
 * MODULE 2 SCOPE
 *   A plain list of the days that have been recorded, newest first. The
 *   eight-point emotional entry map arrives in Module 5, the chart in
 *   Module 6.
 *
 * ============================================================================
 * WHAT THIS SCREEN MUST NEVER DO
 * ============================================================================
 *   No score. No average. No trend line. No "your week was 3.4/5". No
 *   "you've been low for 4 days". No comparison to last month.
 *
 *   The app shows people WHAT THEY SAID, and stops there. A verdict on a
 *   week — even an encouraging one — is a clinical interpretation, and an
 *   app with no access to context, medication, sleep, life events or the
 *   person's own account has no grounds to make one. Worse, for a user
 *   already prone to self-criticism, "your mood is trending downward" is
 *   simply new evidence for a case they are already building against
 *   themselves. Clinical Framework §12.4; PRD §3.2.
 *
 *   The one thing a record like this legitimately does is remind someone of
 *   something they had forgotten — including that a bad week had good days
 *   in it. That is what the plain list is for.
 *
 * DEPENDENCIES  core/utils/dom, core/i18n, core/components/*,
 *               core/storage/repositories/mood.repo
 * SPEC          PRD S26-S27; Clinical Framework §12.4
 */

import { el, clear } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';
import { moodFace, MOODS } from '../../core/components/MoodSelector.js';
import { EmptyState } from '../../core/components/EmptyState.js';
import * as moodRepo from '../../core/storage/repositories/mood.repo.js';
import { formatDate, localDateKey } from '../../core/utils/date.js';
import { getState } from '../../core/store/store.js';
import { isOk } from '../../core/utils/result.js';
import { Button } from '../../core/components/Button.js';
import { navigate } from '../../app/router.js';
import { MoodRibbon, lastDays } from '../../core/components/MoodRibbon.js';

let alive = false;

export function mount(container) {
  alive = true;
  const lang = getState().lang || 'en';

  const list = el('div', { class: 'feelings__list u-stack-sm' });
  const ribbonSlot = el('div', { class: 'feelings__ribbon u-stack-sm' });

  clear(container);
  container.appendChild(
    el('div', { class: 'u-screen u-screen-y u-stack' }, [
      el('h1', { class: 't-h1' }, t('feelings.title')),
      el('p', { class: 't-subtitle' }, t('feelings.intro')),
      /* The Thought Park lives here, under the name the interface uses.
         Same storage, same rules, same permanence. Mika Spec §0. */
      ribbonSlot,
      Button({
        label: t('mika.openHolding'), variant: 'secondary', size: 'lg', full: true,
        icon: 'messageCircle', iconPos: 'start',
        onClick: () => navigate('/holding')
      }),
      /* The body log. Reachable, but not the first thing on the screen — the
         feature is for an appointment, not for browsing. */
      Button({
        label: t('body.open'), variant: 'secondary', size: 'lg', full: true,
        icon: 'heart', iconPos: 'start',
        onClick: () => navigate('/body')
      }),
      list
    ])
  );

  moodRepo.recent(30).then((result) => {
    if (!alive) return;
    const rows = isOk(result) ? result.value : [];

    if (!rows.length) {
      list.appendChild(EmptyState({ text: t('feelings.empty'), icon: 'heart' }));
      return;
    }

    /* The ribbon. One mark per day, no line between them, no average, no
       trend. See core/components/MoodRibbon.js for why. */
    const days = lastDays(30);
    const moodByDay = new Map(rows.map((r) => [r.dateKey, r.mood]));
    ribbonSlot.appendChild(el('h2', { class: 't-h3' }, t('feelings.history')));
    ribbonSlot.appendChild(MoodRibbon({
      days,
      moodByDay,
      wordFor: (mood) => {
        const found = MOODS.find((m) => m.value === mood);
        return found ? t(found.key) : '';
      },
      dateLabel: (key) => formatDate(key, lang)
    }));
    /* Said once, in words, and then the blank days are left alone. */
    ribbonSlot.appendChild(el('p', { class: 't-caption t-muted' }, t('report.blankDays')));

    const todayKey = localDateKey();
    for (const row of rows) {
      const mood = MOODS.find((m) => m.value === row.mood);
      list.appendChild(
        el('div', { class: 'feeling-row', 'data-mood': row.mood }, [
          el('div', { class: 'feeling-row__face' }, moodFace(row.mood)),
          el('div', { class: 'feeling-row__body' }, [
            el('p', { class: 'feeling-row__date t-body' },
              row.dateKey === todayKey ? t('feelings.today') : formatDate(row.dateKey, lang)),
            el('p', { class: 'feeling-row__word t-caption' }, mood ? t(mood.key) : '')
          ]),
          // The note is the user's own words, inserted as a text node by el().
          // There is no path in this codebase that renders it as HTML.
          row.note
            ? el('p', { class: 'feeling-row__note t-body-sm' }, row.note)
            : null
        ].filter(Boolean))
      );
    }
  });
}

export function unmount() {
  alive = false;
}
