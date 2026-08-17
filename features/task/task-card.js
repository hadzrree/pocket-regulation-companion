/**
 * features/task/task-card.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Zone 3 of Today — the one small thing.
 *
 * ============================================================================
 * THE TWO BUTTONS ARE THE SAME SIZE, AND THAT IS THE WHOLE DESIGN
 * ============================================================================
 *   "I did it" and "Not now" sit side by side at equal width, equal height,
 *   and in the same weight class — both outlined, neither filled. They are
 *   told apart by colour and wording, not by one shouting.
 *
 *   Ordinary product design would shrink the decline, grey it, or move it to
 *   a text link — anything to raise the completion rate. Here that would be a
 *   clinical error. The person needs "not now" to be a real, dignified,
 *   consequence-free option, because that belief is what makes them willing
 *   to answer at all. An app that visibly wants one answer teaches people to
 *   stop opening it on the days the honest answer is the other one.
 *   Clinical Framework §8.3.
 *
 *   NEITHER IS THE SCREEN'S PRIMARY BUTTON, and that is not a demotion. Today
 *   has exactly one filled button — the calm offer in zone 4 — because a
 *   screen with two filled buttons makes the eye choose before the person
 *   does. Both task options are one step below it and level with each other,
 *   which is the correct reading of the hierarchy: doing the task and not
 *   doing it are both fine, and neither is the most urgent thing on the
 *   screen. Design Language §5.2.
 *
 * ============================================================================
 * WHAT HAPPENS ON "NOT NOW"
 * ============================================================================
 *   The ask gets SMALLER. A shower becomes washing your face; washing your
 *   face becomes drinking some water. At the smallest tier, one more "not
 *   now" ends it for the day with "Nothing today, then. That's allowed."
 *
 *   Nothing is scolded, nothing is deferred to tomorrow with a reminder, and
 *   no counter anywhere increments in a way the person will later be shown.
 *
 * ============================================================================
 * THERE IS NO SECOND TASK
 * ============================================================================
 *   Completing today's task does NOT unlock another. The card becomes a
 *   record of what was done and then stops asking.
 *
 *   This is a real trade-off and it is chosen deliberately. Someone having a
 *   good day could certainly manage three tasks — but building an app that
 *   offers a second the moment you finish the first turns a support tool into
 *   a to-do list, and a to-do list is a thing you can fall behind on. The
 *   ceiling protects the bad days at the cost of a little upside on the good
 *   ones. Clinical Framework §8.1; PRD §3.2.
 *
 * DEPENDENCIES  core/components/Card, core/components/Button,
 *               core/storage/repositories/task.repo, core/content/task-catalogue
 * SPEC          Clinical Framework §8; PRD S20-S23
 */

import { el, clear } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';
import { Card } from '../../core/components/Card.js';
import { Button } from '../../core/components/Button.js';
import * as toast from '../../core/components/Toast.js';
import * as taskRepo from '../../core/storage/repositories/task.repo.js';
import { taskById, taskText } from '../../core/content/task-catalogue.js';
import { getState } from '../../core/store/store.js';
import { announce } from '../../core/a11y/announce.js';
import { isOk } from '../../core/utils/result.js';

/**
 * @param {Object} config
 * @param {Object|null} config.record  today's task record
 * @returns {{node: HTMLElement, destroy: Function}}
 */
export function TaskCard({ record }) {
  let current = record;
  const host = el('div', { class: 'task' });

  function lang() { return getState().lang || 'en'; }

  function render() {
    clear(host);

    // The app has stopped asking for today.
    if (!current || current.resting) {
      host.appendChild(
        Card({
          tone: 'plain',
          elevation: 'flat',
          body: el('p', { class: 't-body t-muted' }, t('task.resting'))
        })
      );
      return;
    }

    const task = taskById(current.taskId);
    if (!task) return;
    const text = taskText(task, lang());

    // Already done. The card becomes a record, not a prompt.
    if (current.doneAt) {
      host.appendChild(
        Card({
          tone: 'calm',
          icon: 'check',
          title: t('task.doneTitle'),
          body: el('p', { class: 'task__text-done t-body' }, text)
        })
      );
      return;
    }

    // The offer.
    host.appendChild(
      Card({
        tone: 'warm',
        elevation: 'raised',
        class: 'card--task',
        body: [
          el('p', { class: 't-label' }, t('task.heading')),
          el('p', { class: 'task__text t-h3' }, text)
        ],
        actions: [
          /* Both outlined, both 'lg', both flex: 1 1 0 — see the header note
             and card.css. Do not promote this one to 'primary'; Today already
             has its one filled button in zone 4. */
          Button({ label: t('task.did'), variant: 'secondary', size: 'lg', onClick: handleDone }),
          Button({ label: t('common.notNow'), variant: 'quiet', size: 'lg', onClick: handleSoften })
        ]
      })
    );
  }

  async function handleDone() {
    // Optimistic, like the check-in: the acknowledgement should not wait on
    // storage. The person did the thing; the app's job is to notice.
    if (current) current = { ...current, doneAt: new Date().toISOString() };
    render();
    announce(t('task.doneTitle'));

    const result = await taskRepo.complete();
    if (isOk(result)) {
      if (result.value.grew) toast.show(t('task.doneTitle'), { tone: 'kept' });
      current = result.value.record;
    }
  }

  async function handleSoften() {
    const result = await taskRepo.soften();
    if (!isOk(result)) return;

    current = result.value.record;
    render();

    // One quiet sentence naming what just happened, so the change in size is
    // legible rather than mysterious. Never an apology, never a nudge.
    announce(result.value.resting ? t('task.resting') : t('task.softened'));
    if (!result.value.resting) {
      host.insertBefore(
        el('p', { class: 'task__softened t-caption' }, t('task.softened')),
        host.firstChild
      );
    }
  }

  render();

  return {
    node: host,
    destroy() { clear(host); }
  };
}

/**
 * Load (or create) today's offer.
 * @param {number|null} mood
 * @returns {Promise<Object|null>}
 */
export async function loadTask(mood) {
  const result = await taskRepo.offer(mood);
  return isOk(result) ? result.value : null;
}

/**
 * The check-in was corrected inside its edit window. Let the task follow it
 * down. Returns the record only if it actually changed, so the caller can
 * avoid a pointless re-render.
 * @param {number} mood
 * @returns {Promise<Object|null>}
 */
export async function reconsiderTask(mood) {
  const result = await taskRepo.reconsider(mood);
  if (!isOk(result) || !result.value.changed) return null;
  return result.value.record;
}
