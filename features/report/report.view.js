/**
 * features/report/report.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Something to take to an appointment.
 *
 * ============================================================================
 * WHY THIS SCREEN HAS NUMBERS WHEN THE REST OF THE APP REFUSES THEM
 * ============================================================================
 *   Everywhere else, a count is forbidden. "You checked in 11 times this
 *   month" is arithmetic to a well person and an accusation to an unwell one,
 *   and it is the unwell weeks when someone opens the app.
 *
 *   This screen is different in three specific ways, and all three have to
 *   hold or the exception does not apply:
 *
 *     1. THE AUDIENCE IS DIFFERENT. It is written for a doctor, an OT or a
 *        counsellor, in a consultation the person chose to attend. A clinician
 *        needs "eleven of the last thirty days" — it is the difference
 *        between a bad fortnight and a bad quarter.
 *
 *     2. IT IS DELIBERATE. Nobody arrives here by scrolling. You go to Me,
 *        press a button that says it is for an appointment, and the report is
 *        built. That act has a reason attached to it, which browsing does not.
 *
 *     3. IT IS NOT AMBIENT. It exists for as long as the screen is open. It
 *        is not on a tab, not on the home screen, and nothing links to it
 *        from a flow the person uses when they are struggling.
 *
 *   If any future change breaks one of those — a shortcut from Today, a
 *   summary card in Feelings, a notification — the numbers stop being
 *   defensible and must come out.
 *
 * ============================================================================
 * WHAT THE REPORT IS NOT
 * ============================================================================
 *   Not a medical record. Not a diagnosis. Not a screening result. Not a
 *   score. Not validated. Not a substitute for asking the person.
 *
 *   It is a page of things they told a phone, with the dates they told it.
 *   The header says exactly that, in both languages, and the header is not
 *   optional — it prints on every copy, because a page of clinical-looking
 *   data with no provenance is worse than no page at all.
 *
 * ============================================================================
 * NOTHING LEAVES THE DEVICE
 * ============================================================================
 *   There is no upload, no share sheet, no email, no cloud. The report is
 *   printed or shown on the screen. If the person wants their clinician to
 *   have it, they hand over the paper or the phone — which keeps the decision
 *   about who reads it entirely with them.
 *
 *   What the person WROTE — the thoughts Mika holds — is deliberately NOT in
 *   the report. Those are private disclosures made to an app that promised
 *   nobody was reading them, and putting them on a page addressed to a
 *   clinician would break that promise in the one place it matters most.
 *
 * DEPENDENCIES  core/components/MoodRibbon, every repository
 * SPEC          Clinical Framework §10, §16; PRD S37-S39
 */

import { el, clear } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';
import { Button } from '../../core/components/Button.js';
import { MoodRibbon, lastDays } from '../../core/components/MoodRibbon.js';
import { MOODS } from '../../core/components/MoodSelector.js';
import { navigate } from '../../app/router.js';
import { getState } from '../../core/store/store.js';
import { formatDate, localDateKey } from '../../core/utils/date.js';
import { isOk } from '../../core/utils/result.js';
import * as moodRepo from '../../core/storage/repositories/mood.repo.js';
import * as symptomRepo from '../../core/storage/repositories/symptom.repo.js';
import * as sessionRepo from '../../core/storage/repositories/session.repo.js';
import * as taskRepo from '../../core/storage/repositories/task.repo.js';
import { sensationById, sensationText } from '../../core/content/symptom-catalogue.js';

const WINDOW_DAYS = 30;
let alive = false;

export function mount(container) {
  alive = true;
  const lang = getState().lang || 'en';
  const days = lastDays(WINDOW_DAYS);
  const from = days[0];
  const to = days[days.length - 1];

  const sheet = el('article', { class: 'report' });
  clear(container);
  container.appendChild(
    el('div', { class: 'u-screen u-screen-y u-stack report-screen' }, [sheet])
  );

  Promise.all([
    moodRepo.recent(60),
    symptomRepo.between(from, to),
    sessionRepo.recent(200),
    taskRepo.recent(60)
  ]).then(([moodsR, symptomsR, sessionsR, tasksR]) => {
    if (!alive) return;

    const moods = (isOk(moodsR) ? moodsR.value : []).filter((m) => m.dateKey >= from);
    const symptoms = isOk(symptomsR) ? symptomsR.value : [];
    const sessions = (isOk(sessionsR) ? sessionsR.value : [])
      .filter((s) => s.dateKey >= from);
    const tasks = (isOk(tasksR) ? tasksR.value : [])
      .filter((s) => s.dateKey >= from && s.doneAt);

    const moodByDay = new Map(moods.map((m) => [m.dateKey, m.mood]));
    const wordFor = (mood) => {
      const found = MOODS.find((m) => m.value === mood);
      return found ? t(found.key) : '';
    };
    const dateLabel = (key) => formatDate(key, lang);

    clear(sheet);

    /* ---- The header. Not optional, prints on every copy. ---------------- */
    sheet.appendChild(el('header', { class: 'report__head u-stack-sm' }, [
      el('h1', { class: 't-h2' }, t('report.title')),
      el('p', { class: 't-caption' },
        `${formatDate(from, lang)} — ${formatDate(to, lang)}`),
      el('p', { class: 't-caption' },
        `${t('report.generated')} ${formatDate(localDateKey(), lang)}`),
      el('p', { class: 'report__scope t-body-sm' }, t('report.scope'))
    ]));

    /* ---- What they said, day by day ------------------------------------ */
    sheet.appendChild(el('section', { class: 'report__section u-stack-sm' }, [
      el('h2', { class: 't-h3' }, t('report.moodTitle')),
      MoodRibbon({ days, moodByDay, wordFor, dateLabel }),
      el('p', { class: 't-caption t-muted' }, t('report.blankDays')),
      el('p', { class: 't-body-sm' },
        t('report.daysRecorded', { n: String(moods.length), total: String(WINDOW_DAYS) }))
    ]));

    /* ---- What the body noticed ------------------------------------------ */
    const bodySection = el('section', { class: 'report__section u-stack-sm' }, [
      el('h2', { class: 't-h3' }, t('report.bodyTitle'))
    ]);

    if (!symptoms.length) {
      bodySection.appendChild(el('p', { class: 't-body-sm t-muted' }, t('report.bodyNone')));
    } else {
      for (const entry of symptoms) {
        const words = (entry.sensationIds || [])
          .map((id) => sensationText(sensationById(id), lang))
          .filter(Boolean)
          .join(' · ');
        bodySection.appendChild(el('div', { class: 'report__row' }, [
          el('p', { class: 'report__row-date t-caption' }, formatDate(entry.dateKey, lang)),
          el('p', { class: 't-body-sm' }, words),
          entry.note ? el('p', { class: 'report__note t-body-sm' }, entry.note) : null
        ].filter(Boolean)));
      }
    }
    sheet.appendChild(bodySection);

    /* ---- What they did --------------------------------------------------
       Plain counts of actions, for the same reason as the day count: a
       clinician asking "have you been able to do anything for yourself" gets
       a real answer instead of a shrug. */
    sheet.appendChild(el('section', { class: 'report__section u-stack-sm' }, [
      el('h2', { class: 't-h3' }, t('report.didTitle')),
      el('ul', { class: 'report__list' }, [
        el('li', {}, t('report.didBreathing', {
          n: String(sessions.filter((s) => s.kind === 'breathing').length) })),
        el('li', {}, t('report.didGrounding', {
          n: String(sessions.filter((s) => s.kind === 'grounding').length) })),
        el('li', {}, t('report.didTasks', { n: String(tasks.length) }))
      ])
    ]));

    /* ---- What is deliberately absent ------------------------------------
       Stated on the page, so a clinician reading it knows the omission is a
       design decision rather than missing data. */
    sheet.appendChild(el('section', { class: 'report__section' }, [
      el('p', { class: 't-caption t-muted' }, t('report.notIncluded'))
    ]));

    /* ---- Controls. These do not print. ---------------------------------- */
    sheet.appendChild(el('div', { class: 'report__controls u-stack-sm' }, [
      Button({
        label: t('report.print'), variant: 'primary', size: 'lg', full: true,
        onClick: () => window.print()
      }),
      Button({
        label: t('common.back'), variant: 'quiet', size: 'md', full: true,
        onClick: () => navigate('/me')
      })
    ]));
  });
}

export function unmount() {
  alive = false;
}
