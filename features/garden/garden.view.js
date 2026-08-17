/**
 * features/garden/garden.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The Garden tab — the honest version of a progress screen.
 *
 * ============================================================================
 * WHAT THIS SCREEN SHOWS, AND WHAT IT REFUSES TO SHOW
 * ============================================================================
 *   SHOWS: a drawing that has grown, and a plain list of the things it grew
 *   from, each with its date.
 *
 *   REFUSES: a total. A streak. A percentage. A weekly average. A comparison
 *   to last month. A goal. A "you're 4 away from the next stage".
 *
 *   Every one of those is a score, and a score can be low. "You have done 3
 *   things this week" is arithmetic to a well person and an accusation to an
 *   unwell one — and it is precisely the unwell weeks when someone opens this
 *   tab hoping for evidence that they are not nothing.
 *
 *   The list is the evidence. It is specific, it is dated, and it is all
 *   things the person actually did. Clinical Framework §9.3; PRD §3.2.
 *
 * ============================================================================
 * "NOTHING HERE DISAPPEARS"
 * ============================================================================
 *   That sentence is printed on the screen, in both languages, deliberately.
 *   Anyone who has used a habit app arrives at a screen like this expecting
 *   to be told what they have lost. Saying it plainly, before they scroll,
 *   is the fastest way to establish that this one is different — and it is a
 *   promise the architecture can actually keep, because there is no delete
 *   and no decay anywhere beneath it.
 *
 * DEPENDENCIES  core/components/Garden, core/components/EmptyState,
 *               core/storage/repositories/growth.repo
 * SPEC          Clinical Framework §9; Design Language §17; PRD S31-S33
 */

import { el, clear } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';
import { Garden } from '../../core/components/Garden.js';
import { EmptyState } from '../../core/components/EmptyState.js';
import { icon as buildIcon } from '../../core/components/icons.js';
import * as growth from '../../core/storage/repositories/growth.repo.js';
import * as thoughtRepo from '../../core/storage/repositories/thought.repo.js';
import { Mika, STATES } from '../../core/components/Mika.js';
import { navigate } from '../../app/router.js';
import { on } from '../../core/utils/dom.js';
import { formatDate, localDateKey } from '../../core/utils/date.js';
import { getState } from '../../core/store/store.js';
import { isOk } from '../../core/utils/result.js';

let alive = false;
let mika = null;
let cleanups = [];

/** Which icon belongs to which kind of growth. */
const KIND_ICON = {
  'check-in': 'heart',
  session: 'wind',
  task: 'check',
  thought: 'messageCircle'
};

export function mount(container) {
  alive = true;
  const lang = getState().lang || 'en';

  const stage = el('div', { class: 'garden-view__stage' });
  const record = el('div', { class: 'garden-view__record u-stack-sm' });

  clear(container);
  container.appendChild(
    el('div', { class: 'u-screen u-screen-y u-stack garden-view' }, [
      el('h1', { class: 't-h1' }, t('garden.title')),
      el('p', { class: 't-subtitle' }, t('garden.intro')),
      stage,
      record
    ])
  );

  growth.all().then((result) => {
    if (!alive) return;
    const entries = isOk(result) ? result.value : [];
    const total = entries.reduce((sum, e) => sum + (e.amount || 0), 0);

    if (!total) {
      clear(stage);
      stage.appendChild(EmptyState({ text: t('garden.empty'), icon: 'sprout' }));
      return;
    }

    const currentStage = growth.stageFor(total);

    clear(stage);

    /* Mika lives IN the garden and grows on the same ledger — one ledger, one
       story, no second progress system to compare. It is ambient: it does its
       idle breathing and nothing else, and tapping it opens the companion.
       Mika Spec §0, §8.3. */
    const scene = el('div', { class: 'garden-scene' }, Garden({ stage: currentStage, total }));
    const perch = el('button', {
      type: 'button',
      class: 'garden-scene__mika',
      'aria-label': t('mika.title')
    });
    thoughtRepo.count().then((held) => {
      if (!alive) return;
      if (mika) mika.destroy();
      mika = Mika({
        stage: currentStage,
        holding: isOk(held) ? held.value : 0,
        state: STATES.RESTING
      });
      perch.appendChild(mika.node);
    });
    cleanups.push(on(perch, 'click', () => navigate('/mika')));
    scene.appendChild(perch);
    stage.appendChild(scene);

    /* Five dots. Not "stage 3 of 5", not a percentage, and no indication of
       how much is needed for the next one — there is no "needed". */
    stage.appendChild(
      el('div', { class: 'garden-stages', role: 'presentation' },
        [1, 2, 3, 4, 5].map((s) =>
          el('span', { class: `garden-stages__dot${s <= currentStage ? ' is-reached' : ''}` })
        )
      )
    );

    /* The record. Newest first, and capped — this is a reminder, not an
       audit trail, and an endless scroll of every action ever taken starts to
       look like a performance review. */
    const todayKey = localDateKey();
    record.appendChild(el('h2', { class: 't-h3' }, t('garden.grewFrom')));

    for (const entry of entries.slice().reverse().slice(0, 12)) {
      record.appendChild(
        el('div', { class: 'grew-row' }, [
          buildIcon(KIND_ICON[entry.kind] || 'sprout', { size: 20, class: 'grew-row__icon' }),
          el('div', { class: 'grew-row__body' }, [
            el('p', { class: 'grew-row__what t-body' }, t(`garden.from.${entry.kind}`)),
            el('p', { class: 'grew-row__when t-caption' },
              entry.dateKey === todayKey ? t('feelings.today') : formatDate(entry.dateKey, lang))
          ])
        ])
      );
    }
  });
}

export function unmount() {
  alive = false;
  if (mika) { mika.destroy(); mika = null; }
  cleanups.forEach((fn) => fn());
  cleanups = [];
}
