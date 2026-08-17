/**
 * core/storage/repositories/task.repo.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Choosing, remembering and completing the one small thing.
 *
 * ============================================================================
 * ONE TASK. NOT A LIST.
 * ============================================================================
 *   The database is keyed by the local date, so there is physically no way to
 *   store a second offer for the same day. "Today's task list" is not a thing
 *   this schema can hold, which means it is not a feature anyone can add by
 *   accident.
 *
 *   A list is the failure mode. A person with no capacity looking at six
 *   suggestions does none of them, and now has six pieces of evidence that
 *   they are not coping instead of one small thing they might actually do.
 *   Clinical Framework §8.1.
 *
 * ============================================================================
 * THE TASK IS STABLE FOR THE WHOLE DAY
 * ============================================================================
 *   It is persisted the moment it is offered, so closing and reopening the app
 *   shows the same task. A suggestion that changes every time you look at it
 *   cannot be committed to, and quietly teaches that nothing here is real.
 *
 * ============================================================================
 * "NOT NOW" MAKES THE APP ASK FOR LESS
 * ============================================================================
 *   Declining does not skip to another task of the same size, and it does not
 *   nag. It drops a tier: a shower becomes washing your face, washing your
 *   face becomes drinking some water. At the bottom tier, one more "not now"
 *   ends the asking for the day entirely, with a sentence that says that is
 *   allowed.
 *
 *   This is the single most important behaviour in the module. Standard
 *   product design would treat a decline as a conversion failure and try
 *   again harder. In behavioural activation, pushing after a decline is how
 *   you lose the person: they learn that saying no costs them something, so
 *   next time they close the app instead of answering. Making "no" reliably
 *   produce a SMALLER ask is what makes "no" safe to say.
 *   Clinical Framework §8.3.
 *
 * ============================================================================
 * NOTHING IN HERE RECORDS A FAILURE
 * ============================================================================
 *   `doneAt` is either a timestamp or null. Null means "not yet", and there is
 *   no code path anywhere that reads it as anything else. There is no
 *   `skipped`, no `refused`, no `expired`. Yesterday's untouched task is
 *   simply yesterday's task.
 *
 * DEPENDENCIES  ../db.js, ../migrations.js, ./growth.repo.js,
 *               core/content/task-catalogue.js
 * SPEC          Clinical Framework §8; PRD S20-S23
 */

import { STORES } from '../migrations.js';
import * as db from '../db.js';
import { localDateKey } from '../../utils/date.js';
import { Ok, isOk } from '../../utils/result.js';
import { emit, EVENTS } from '../../events/bus.js';
import * as growth from './growth.repo.js';
import { tasksAtTier, tierForMood } from '../../content/task-catalogue.js';

/**
 * Pick a task at a tier, avoiding anything already offered today.
 * Falls back to the whole tier if every one of them has been seen — better a
 * repeat than nothing at all.
 */
function pick(tier, seen = []) {
  const pool = tasksAtTier(tier);
  const fresh = pool.filter((task) => !seen.includes(task.id));
  const from = fresh.length ? fresh : pool;
  if (!from.length) return null;
  return from[Math.floor(Math.random() * from.length)];
}

/** Today's record, or null. */
export async function today() {
  const result = await db.get(STORES.TASKS, localDateKey());
  if (!isOk(result)) return result;
  return Ok(result.value || null);
}

/**
 * Get today's offer, creating it if this is the first look of the day.
 *
 * @param {number|null} mood  today's check-in, used only on the first call
 * @returns {Promise<Object>} Ok(record | null)
 *   A null record means the asking has ended for today — see soften().
 */
export async function offer(mood = null) {
  const existing = await today();
  if (!isOk(existing)) return existing;
  if (existing.value) return existing;

  const tier = tierForMood(mood);
  const task = pick(tier);
  if (!task) return Ok(null);

  const record = {
    dateKey: localDateKey(),
    taskId: task.id,
    tier,
    offeredAt: new Date().toISOString(),
    doneAt: null,
    softenings: 0,
    seen: [task.id],
    /* True only once the person has said "not now" at the smallest tier. The
       app then stops asking for the day. It is not a refusal record — it is
       the app agreeing to be quiet. */
    resting: false
  };

  const written = await db.put(STORES.TASKS, record);
  if (!isOk(written)) return written;
  return Ok(record);
}

/**
 * Mark today's task as done.
 * Earns growth exactly once — a second call is a no-op, so a double tap
 * cannot inflate the garden.
 */
export async function complete() {
  const existing = await today();
  if (!isOk(existing) || !existing.value) return existing;

  const record = existing.value;
  if (record.doneAt) return Ok({ record, grew: false });   // already done

  const updated = { ...record, doneAt: new Date().toISOString() };
  const written = await db.put(STORES.TASKS, updated);
  if (!isOk(written)) return written;

  const g = await growth.record(growth.GROWTH.TASK, { dateKey: updated.dateKey });
  emit(EVENTS.TASK_COMPLETED, { taskId: updated.taskId, tier: updated.tier });
  return Ok({ record: updated, grew: isOk(g) });
}

/**
 * "Not now." Replace today's offer with a smaller one.
 *
 * @returns {Promise<Object>} Ok({record, resting})
 *   `resting: true` means the app has stopped asking for today.
 */
export async function soften() {
  const existing = await today();
  if (!isOk(existing) || !existing.value) return existing;

  const record = existing.value;
  const nextTier = Math.max(0, record.tier - 1);

  // Already at the smallest ask, and still not now. Then not now — the app
  // stops for the day. Nothing about this is recorded as a failure and the
  // person is told, in the interface, that it is allowed.
  const alreadySmallest = record.tier === 0;
  const task = alreadySmallest ? null : pick(nextTier, record.seen);

  const updated = task
    ? {
        ...record,
        taskId: task.id,
        tier: nextTier,
        offeredAt: new Date().toISOString(),
        softenings: record.softenings + 1,
        seen: [...record.seen, task.id]
      }
    : { ...record, resting: true, softenings: record.softenings + 1 };

  const written = await db.put(STORES.TASKS, updated);
  if (!isOk(written)) return written;

  emit(EVENTS.TASK_DECLINED, { tier: record.tier });
  return Ok({ record: updated, resting: Boolean(updated.resting) });
}

/**
 * The check-in changed inside its edit window. Follow it DOWN, never up.
 *
 * ============================================================================
 * WHY THIS EXISTS
 * ============================================================================
 *   The task's tier is chosen from the day's check-in and then fixed, so the
 *   suggestion is stable and can be committed to. But the check-in itself is
 *   editable for two hours, precisely because people mis-tap and because
 *   people realise a minute later that "Okay" was not true.
 *
 *   Without this, correcting the mood from Okay to Very heavy left a task
 *   chosen for a day the person had just told the app they were not having.
 *   The correction is the more honest answer; the ask has to follow it.
 *
 * ============================================================================
 * IT ONLY EVER GOES DOWN
 * ============================================================================
 *   If someone changes their answer from Very heavy to Good, the task does
 *   NOT get bigger. Raising the ask because a person said they felt better
 *   would teach them that admitting to a good hour costs them something, and
 *   it is the same failure as pushing after a decline. Within a day, demand
 *   can fall and cannot rise.
 *
 *   It also does nothing once the task is done or the app has stopped asking.
 *
 * @param {number} mood the corrected check-in
 * @returns {Promise<Object>} Ok({record, changed})
 */
export async function reconsider(mood) {
  const existing = await today();
  if (!isOk(existing) || !existing.value) return existing;

  const record = existing.value;
  if (record.doneAt || record.resting) return Ok({ record, changed: false });

  const nextTier = tierForMood(mood);
  if (nextTier >= record.tier) return Ok({ record, changed: false });   // never up

  const task = pick(nextTier, record.seen);
  if (!task) return Ok({ record, changed: false });

  const updated = {
    ...record,
    taskId: task.id,
    tier: nextTier,
    offeredAt: new Date().toISOString(),
    seen: [...record.seen, task.id]
    // `softenings` is deliberately NOT incremented. The person did not
    // decline anything — they corrected how they were.
  };

  const written = await db.put(STORES.TASKS, updated);
  if (!isOk(written)) return written;
  return Ok({ record: updated, changed: true });
}

/** Recent days that had a task. Used by Module 6's history. */
export async function recent(limit = 30) {
  const result = await db.getAll(STORES.TASKS);
  if (!isOk(result)) return result;
  const rows = (result.value || [])
    .slice()
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))
    .slice(0, limit);
  return Ok(rows);
}
