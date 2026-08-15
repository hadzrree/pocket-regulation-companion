/**
 * core/storage/repositories/session.repo.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Recording a breathing or grounding practice.
 *
 * ============================================================================
 * THE RULE: A SESSION IS A SESSION
 * ============================================================================
 *   Twenty seconds counts. Two breaths count. There is no minimum, no target,
 *   no goal, and nothing anywhere in this file that could be used to decide
 *   that a session was too short.
 *
 *   That is not generosity, it is the mechanism. Someone opens Calm Mode
 *   mid-panic, manages three breaths, and closes it. If the app treats that
 *   as a failed attempt — by discarding it, by not counting it, by showing a
 *   progress bar that did not fill — it has taught them that the thing they
 *   just did in a very hard moment did not count. They will be less likely to
 *   open it next time. The correct response to three breaths is the same as
 *   the correct response to twenty: "You did some."
 *   Clinical Framework §5.5, §8.3.
 *
 *   Note what is absent from the record shape: there is no `completed` field.
 *   The moment that field exists, the category of an INCOMPLETE session
 *   exists, and sooner or later something in the interface will display it.
 *   The safest way to guarantee the app never says "incomplete" is to have
 *   nothing that could be read that way.
 *
 * ============================================================================
 * SECONDS ARE STORED, BUT NEVER SUMMED INTO A TOTAL SHOWN TO THE USER
 * ============================================================================
 *   Duration is kept because Module 6's history is more useful with it, and
 *   because a person reviewing their own record may find it interesting. It
 *   is NOT the basis of a "total minutes practised" counter. That number is a
 *   score wearing a different hat: it only ever goes up when you do more, so
 *   a bad month shows visibly as a flat line. The garden already carries the
 *   "something happened" signal, and the garden cannot go backwards.
 *
 * DEPENDENCIES  ../db.js, ../migrations.js, ./growth.repo.js, core/utils/*
 * SPEC          Clinical Framework §5, §9; Architecture §11.5; PRD S15-S17
 */

import { STORES } from '../migrations.js';
import * as db from '../db.js';
import { uid } from '../../utils/id.js';
import { localDateKey } from '../../utils/date.js';
import { Ok, isOk } from '../../utils/result.js';
import { emit, EVENTS } from '../../events/bus.js';
import * as growth from './growth.repo.js';

/** The practices that can be recorded. */
export const KINDS = Object.freeze({
  BREATHING: 'breathing',
  GROUNDING: 'grounding'
});

/**
 * Record a finished practice.
 *
 * @param {Object} session
 * @param {string} session.kind        a KINDS value
 * @param {number} session.startedAt   Date.now() at the start
 * @param {number} [session.cycles]    completed breaths, or grounding steps
 * @returns {Promise<Object>} Ok({record, grew}) | Err(code)
 *
 * FAILURE IS SILENT AT THE CALL SITE. This is called as the user leaves a
 * distress flow, which is the one moment when no error may appear on screen
 * for any reason. The caller logs and moves on.
 */
export async function record({ kind, startedAt, cycles = 0 }) {
  const endedAt = Date.now();
  const entry = {
    id: uid(),
    kind,
    startedAt: new Date(startedAt).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    seconds: Math.max(0, Math.round((endedAt - startedAt) / 1000)),
    cycles,
    dateKey: localDateKey()
  };

  const written = await db.add(STORES.SESSIONS, entry);
  if (!isOk(written)) return written;

  // One growth entry per session, the same amount as everything else. A
  // twelve-minute session is not worth more than a three-breath one — the app
  // has no business ranking someone's coping.
  const g = await growth.record(growth.GROWTH.SESSION, { dateKey: entry.dateKey });

  emit(EVENTS.SESSION_COMPLETED, { kind, seconds: entry.seconds, cycles });
  return Ok({ record: entry, grew: isOk(g) });
}

/** Every session, newest first. Used by Module 6's history. */
export async function recent(limit = 30) {
  const result = await db.getAll(STORES.SESSIONS);
  if (!isOk(result)) return result;
  const rows = (result.value || [])
    .slice()
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
    .slice(0, limit);
  return Ok(rows);
}

/** Sessions recorded on one local day. */
export function forDate(dateKey) {
  return db.getAllByIndex(STORES.SESSIONS, 'byDateKey', dateKey);
}

/** How many sessions have ever been recorded. */
export function totalCount() {
  return db.count(STORES.SESSIONS);
}
