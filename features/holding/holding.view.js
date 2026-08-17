/**
 * features/holding/holding.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   "What Mika is holding" — the record of everything set down.
 *
 * ============================================================================
 * NO COUNTER. NO BADGE. NO DATES UNTIL ASKED.
 * ============================================================================
 *   A person with four hundred held thoughts sees no number and receives no
 *   suggestion to tidy up. Nothing is ever marked overdue, unread, or needing
 *   attention.
 *
 *   A count would turn a record of hard things said into a quantity — and a
 *   quantity invites a judgement about whether it is too many. There is no
 *   such thing as too many. Mika Spec §5 Screen 8.
 *
 * ============================================================================
 * THE THREE THINGS YOU CAN DO WITH A HELD THOUGHT
 * ============================================================================
 *   1. Leave it. The default, in first position, and the one most people
 *      should take.
 *   2. Take it back. It returns to the person. It is NOT destroyed — taking
 *      something back is not the same as wanting it gone.
 *   3. Let it go completely. Real deletion, confirmed once, with ten seconds
 *      of undo. The only place in the app where a record is actually removed.
 *
 *   The app never chooses any of these. The person does.
 *
 * ============================================================================
 * WHY THIS IS AN ACCORDION AND NOT A MODAL SHEET
 * ============================================================================
 *   A modal traps focus, can be dismissed by an accidental tap outside, and
 *   has to be escaped before anything else can happen. Someone reading back
 *   something they wrote on a bad night should be able to look away from it
 *   by scrolling, which is the most natural exit there is.
 *
 * DEPENDENCIES  core/components/Mika, core/storage/repositories/thought.repo
 * SPEC          Mika Specification §5 Screen 8, §9.11, §12
 */

import { el, clear, on } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';
import { Mika, STATES } from '../../core/components/Mika.js';
import { Button } from '../../core/components/Button.js';
import { EmptyState } from '../../core/components/EmptyState.js';
import * as toast from '../../core/components/Toast.js';
import * as thoughtRepo from '../../core/storage/repositories/thought.repo.js';
import * as growthRepo from '../../core/storage/repositories/growth.repo.js';
import { formatDate } from '../../core/utils/date.js';
import { getState } from '../../core/store/store.js';
import { isOk } from '../../core/utils/result.js';
import { EMPTY_LINES, HOLDING_LINES, say, pick } from '../../core/content/mika-lines.js';

let mika = null;
let cleanups = [];
let alive = false;
let listSlot = null;

/** Ten seconds of undo after a deletion. */
const UNDO_MS = 10000;

export function mount(container) {
  alive = true;
  const lang = getState().lang || 'en';

  listSlot = el('div', { class: 'holding__list u-stack-sm' });

  clear(container);
  container.appendChild(
    el('div', { class: 'u-screen u-screen-y u-stack holding' }, [
      el('h1', { class: 't-h2' }, t('mika.holdingTitle')),
      el('div', { class: 'holding__mika' }),
      listSlot
    ])
  );

  Promise.all([thoughtRepo.all(), growthRepo.total()]).then(([rowsResult, totalResult]) => {
    if (!alive) return;
    const rows = isOk(rowsResult) ? rowsResult.value : [];
    const stage = growthRepo.stageFor(isOk(totalResult) ? totalResult.value : 0);

    const held = rows.filter((r) => !r.returnedAt);

    if (mika) mika.destroy();
    mika = Mika({ stage, holding: held.length, state: STATES.RESTING });
    const slot = container.querySelector('.holding__mika');
    if (slot) slot.appendChild(mika.node);

    paint(rows, lang);
  });
}

function paint(rows, lang) {
  clear(listSlot);

  if (!rows.length) {
    listSlot.appendChild(EmptyState({
      text: `${say(EMPTY_LINES.nothingHeld, lang)} ${say(EMPTY_LINES.willBeHere, lang)}`,
      icon: 'messageCircle'
    }));
    return;
  }

  for (const row of rows) {
    listSlot.appendChild(thoughtRow(row, lang));
  }
}

/** One held thought, collapsed. Opens in place. */
function thoughtRow(row, lang) {
  const wrapper = el('div', { class: `held${row.returnedAt ? ' held--returned' : ''}` });

  /* Collapsed, a thought shows its FIRST FEW WORDS and nothing else — no
     date, no badge, no icon that implies a category. The date appears only
     once the person has chosen to open it. */
  const preview = row.text.trim().split(/\s+/).slice(0, 7).join(' ');
  const toggle = el('button', {
    type: 'button',
    class: 'held__toggle',
    'aria-expanded': 'false'
  }, [
    el('span', { class: 'held__leaf' }),
    el('span', { class: 'held__preview t-body' }, preview + (row.text.trim().split(/\s+/).length > 7 ? '…' : ''))
  ]);

  const body = el('div', { class: 'held__body', hidden: true });
  wrapper.appendChild(toggle);
  wrapper.appendChild(body);

  cleanups.push(on(toggle, 'click', () => {
    const open = body.hidden;
    body.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open && !body.hasChildNodes()) fillBody(body, wrapper, row, lang);
  }));

  return wrapper;
}

function fillBody(body, wrapper, row, lang) {
  /* The text, exactly as written. Unedited. Unanalysed. Inserted by el() as a
     text node — there is no path in this codebase that renders it as HTML. */
  body.appendChild(el('p', { class: 'held__text t-body' }, row.text));
  body.appendChild(el('p', { class: 'held__when t-caption' }, formatDate(row.dateKey, lang)));
  body.appendChild(el('p', { class: 'held__line t-caption t-muted' }, pick(HOLDING_LINES, lang)));

  const actions = el('div', { class: 'held__actions u-stack-sm' });

  if (!row.returnedAt) {
    /* Default, first position. Most people should take this one, and the
       ordering says so without the others being weakened. */
    actions.appendChild(Button({
      label: t('mika.keepHolding'), variant: 'secondary', size: 'md', full: true,
      onClick: () => { body.hidden = true; }
    }));
    actions.appendChild(Button({
      label: t('mika.takeItBack'), variant: 'quiet', size: 'md', full: true,
      onClick: async () => {
        const result = await thoughtRepo.takeBack(row.id);
        if (isOk(result)) {
          wrapper.classList.add('held--returned');
          toast.show(t('mika.tookBack'), { tone: 'kept' });
        }
      }
    }));
  } else {
    actions.appendChild(Button({
      label: t('mika.holdAgain'), variant: 'secondary', size: 'md', full: true,
      onClick: async () => {
        const result = await thoughtRepo.holdAgain(row.id);
        if (isOk(result)) wrapper.classList.remove('held--returned');
      }
    }));
  }

  /* Real deletion. A ghost, confirmed once, with ten seconds of undo. */
  actions.appendChild(Button({
    label: t('mika.letGo'), variant: 'ghost', size: 'md', full: true,
    onClick: () => confirmLetGo(body, wrapper, row)
  }));

  body.appendChild(actions);
}

/**
 * Confirm once, then delete with an undo window.
 *
 * The confirmation is inline and plain. No "are you sure?" with a red button,
 * no warning triangle — this is a person deciding what to do with their own
 * words, not a dangerous operation being guarded against.
 */
function confirmLetGo(body, wrapper, row) {
  const confirm = el('div', { class: 'held__confirm u-stack-sm' }, [
    el('p', { class: 't-body' }, t('mika.letGoConfirm')),
    Button({
      label: t('mika.letGoYes'), variant: 'quiet', size: 'md', full: true,
      onClick: async () => {
        /* Keep a copy in memory for the undo window. It is gone from storage
           immediately — the undo re-adds it rather than deferring the delete,
           so a person who closes the app mid-window gets what they asked for
           rather than a surprise. */
        const copy = { ...row };
        const result = await thoughtRepo.letGo(row.id);
        if (!isOk(result)) return;

        wrapper.remove();
        toast.show(t('mika.letGone'), {
          tone: 'info',
          duration: UNDO_MS,
          action: {
            label: t('mika.undo'),
            onClick: async () => {
              await thoughtRepo.hold(copy.text, { entry: copy.entry });
              if (alive) mountAgain();
            }
          }
        });
      }
    }),
    Button({
      label: t('common.notNow'), variant: 'quiet', size: 'md', full: true,
      onClick: () => confirm.remove()
    })
  ]);
  body.appendChild(confirm);
}

/** Re-read after an undo. */
function mountAgain() {
  const lang = getState().lang || 'en';
  thoughtRepo.all().then((result) => {
    if (!alive) return;
    paint(isOk(result) ? result.value : [], lang);
  });
}

export function unmount() {
  alive = false;
  if (mika) { mika.destroy(); mika = null; }
  cleanups.forEach((fn) => fn());
  cleanups = [];
  listSlot = null;
}
