/**
 * core/storage/repositories/thought.repo.js
 * ---------------------------------------------------------------------------
 * PURPOSE   What Mika holds.
 *
 * ============================================================================
 * THE MOST IMPORTANT PSYCHOLOGICAL DECISION IN THE FEATURE
 * ============================================================================
 *   Held is held. Nothing here erases anything.
 *
 *   Erasure is suppression, and thought suppression reliably produces
 *   rebound: the suppressed thought comes back more often and with more
 *   force. So the reassurance the app offers is never "it's gone" — it is
 *   "you don't have to be the one holding it".
 *
 *   Nothing auto-deletes. Nothing expires. Nothing is ever marked overdue,
 *   unread, or needing attention. A person with four hundred held thoughts
 *   sees no number and gets no suggestion to tidy up.
 *   Mika Specification §2.3, §5 Screen 8.
 *
 * ============================================================================
 * BUT THE USER MAY DELETE — AND THAT IS NOT A CONTRADICTION
 * ============================================================================
 *   `letGo()` really deletes. It is the one place in the codebase where a
 *   single record is removed, and it exists because the alternative is worse:
 *   if a person cannot take back what they wrote, handing it over is a loss
 *   rather than a loan, and nobody hands anything over under those terms.
 *
 *   The difference that matters is WHO decides. The app never deletes. The
 *   person deletes, deliberately, with an undo window. See the DELETABLE
 *   guard in db.js — the growth ledger is not in it and must never be added.
 *
 * ============================================================================
 * WHAT IS NOT STORED
 * ============================================================================
 *   No sentiment. No category. No keywords. No summary. No risk flag —
 *   ever, under any circumstance. Nothing in a record could tell a reader
 *   anything the person did not choose to write, and nothing in it could be
 *   aggregated into a profile of them.
 *
 * DEPENDENCIES  ../db.js, ../migrations.js, ./growth.repo.js, core/utils/*
 * SPEC          Mika Specification §2.3, §5, §8, §10.1
 */

import { STORES } from '../migrations.js';
import * as db from '../db.js';
import { uid } from '../../utils/id.js';
import { localDateKey } from '../../utils/date.js';
import { Ok, isOk } from '../../utils/result.js';
import { emit, EVENTS } from '../../events/bus.js';
import * as growth from './growth.repo.js';

/**
 * Hand a thought over.
 *
 * @param {string} text          exactly what was typed. Never trimmed of
 *                               meaning, never corrected, never analysed.
 * @param {Object} [meta]
 * @param {string} [meta.entry]  which door they came in by
 * @returns {Promise<Object>} Ok(record) | Err(code)
 *
 * WRITTEN BEFORE THE ANIMATION, NOT AFTER. If the app is killed halfway
 * through the gathering, the thought is already held. Losing someone's
 * disclosure to a dropped animation frame is not an acceptable failure.
 * Mika Spec §12 case 10.
 */
export async function hold(text, meta = {}) {
  const record = {
    id: uid(),
    text: String(text),
    heldAt: new Date().toISOString(),
    dateKey: localDateKey(),
    entry: meta.entry || 'direct',
    /* Set only if the user later asks for it back. Its absence is not a
       state to display — nothing anywhere shows "returned" as a category. */
    returnedAt: null
  };

  const written = await db.add(STORES.THOUGHTS, record);
  if (!isOk(written)) return written;

  emit(EVENTS.THOUGHT_HELD, { id: record.id, entry: record.entry });
  return Ok(record);
}

/**
 * Everything Mika is holding, newest first.
 * Returns records, never a count summary — the interface shows no number.
 */
export async function all() {
  const result = await db.getAll(STORES.THOUGHTS);
  if (!isOk(result)) return result;
  const rows = (result.value || [])
    .slice()
    .sort((a, b) => (a.heldAt < b.heldAt ? 1 : -1));
  return Ok(rows);
}

/** How many are held. For DRAWING Mika only — never displayed as a number. */
export async function count() {
  const result = await db.count(STORES.THOUGHTS);
  return isOk(result) ? result : Ok(0);
}

/**
 * "I'll take it back."
 *
 * The thought leaves Mika and returns to the person. It is NOT deleted — the
 * record stays with a `returnedAt` timestamp, because taking something back
 * is not the same as destroying it and the person may want it again.
 */
export async function takeBack(id) {
  const found = await db.get(STORES.THOUGHTS, id);
  if (!isOk(found) || !found.value) return found;
  const updated = { ...found.value, returnedAt: new Date().toISOString() };
  const written = await db.put(STORES.THOUGHTS, updated);
  if (!isOk(written)) return written;
  return Ok(updated);
}

/** Undo a take-back. Puts it back in Mika's hands. */
export async function holdAgain(id) {
  const found = await db.get(STORES.THOUGHTS, id);
  if (!isOk(found) || !found.value) return found;
  const updated = { ...found.value, returnedAt: null };
  const written = await db.put(STORES.THOUGHTS, updated);
  if (!isOk(written)) return written;
  return Ok(updated);
}

/**
 * "Let it go completely." The only real deletion in the application.
 *
 * Confirmed once by the interface, with a ten-second undo. Mika does not
 * react, does not shrink, and does not lose growth — the visit already
 * happened, and unwriting it would be the app taking something back.
 * Mika Spec §12 case 14.
 */
export function letGo(id) {
  return db.remove(STORES.THOUGHTS, id);
}

/**
 * Growth for arriving at Mika. Once per local day.
 *
 * ============================================================================
 * WHY ARRIVING, AND NOT WRITING
 * ============================================================================
 *   Contingent reward makes the reward a verdict on performance, and on a day
 *   when someone can do nothing, a performance-contingent companion delivers
 *   that verdict precisely when it is least survivable. So writing a
 *   paragraph, writing one word, sitting in quiet mode writing nothing, and
 *   opening Mika and leaving after ten seconds all produce exactly the same
 *   growth. Mika Spec §2.4, §8.1.
 *
 * ============================================================================
 * WHY ONCE PER DAY
 * ============================================================================
 *   Opening the app twelve times in an evening is greeted warmly twelve times
 *   — §12 case 7 — but it grows the garden once. Otherwise the garden would
 *   be rewarding app-opening rather than showing up, and the number of visits
 *   would quietly become a thing to optimise. Once a day matches the check-in
 *   and the task, so the whole app has one rhythm.
 */
export async function growForVisit() {
  const dateKey = localDateKey();
  const already = await growth.forDate(dateKey);
  if (isOk(already) && (already.value || []).some((e) => e.kind === growth.GROWTH.THOUGHT.kind)) {
    return Ok({ grew: false });
  }
  const g = await growth.record(growth.GROWTH.THOUGHT, { dateKey });
  return Ok({ grew: isOk(g) });
}
