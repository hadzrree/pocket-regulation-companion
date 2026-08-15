/**
 * core/storage/repositories/mood.repo.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   Reading and writing the daily check-in.
 *
 * ============================================================================
 * ONCE A DAY, NOT WHENEVER YOU LIKE
 * ============================================================================
 *   The check-in is asked once per local day. Asking again the same day would
 *   turn a gentle question into a demand, and would invite exactly the kind
 *   of minute-by-minute self-monitoring that makes anxiety worse. A user who
 *   wants to record more detail later has the Feelings tab; the Today screen
 *   asks once. Clinical Framework §12.2.
 *
 *   The rule is enforced by the SCHEMA — the local date is the primary key —
 *   not by a conditional somewhere in a view. See migrations.js.
 *
 * ============================================================================
 * THE TWO-HOUR EDIT WINDOW
 * ============================================================================
 *   Within two hours of checking in, the answer can be changed freely. After
 *   that it is fixed for the day.
 *
 *   WHY THERE IS A WINDOW AT ALL: people mis-tap, and people realise a minute
 *   later that "okay" was not true. Being unable to correct that makes the
 *   record feel like it belongs to the app rather than to them.
 *
 *   WHY THE WINDOW CLOSES: an always-editable history is not a record, it is
 *   a draft. Part of the therapeutic value of a mood log is that it tells you
 *   something you had already forgotten — which only works if today-you
 *   cannot quietly rewrite last-Tuesday-you into a better mood. This is the
 *   same reasoning behind paper mood diaries in clinical practice.
 *
 *   WHAT THE APP NEVER SAYS: "locked", "expired", "you can no longer edit
 *   this". The faces simply stop responding and the chosen one stays lit. No
 *   error, no explanation of a restriction the user did not ask about.
 *   Clinical Framework §12.5.
 *
 * ============================================================================
 * GROWTH IS EARNED ONCE PER DAY, ON THE FIRST SAVE
 * ============================================================================
 *   Editing within the window does not earn a second growth entry. Otherwise
 *   tapping five faces in a row would inflate the garden, and the garden's
 *   honesty is the reason it means anything.
 *
 * DEPENDENCIES  ../db.js, ../migrations.js, ./growth.repo.js, core/utils/*,
 *               core/events/bus
 * SPEC          Clinical Framework §12; Architecture §11.5; PRD S12-S14
 */

import { STORES } from '../migrations.js';
import * as db from '../db.js';
import { localDateKey } from '../../utils/date.js';
import { Ok, Err, isOk } from '../../utils/result.js';
import { emit, EVENTS } from '../../events/bus.js';
import * as growth from './growth.repo.js';

/** How long an answer stays changeable. Two hours, in milliseconds. */
export const EDIT_WINDOW_MS = 2 * 60 * 60 * 1000;

/**
 * Today's check-in, or null.
 * @returns {Promise<Object>} Ok(record|null) | Err
 */
export async function today() {
  const result = await db.get(STORES.MOODS, localDateKey());
  if (!isOk(result)) return result;
  return Ok(result.value || null);
}

/**
 * Whether a record can still be changed.
 * Pure and synchronous, so views can ask without awaiting.
 *
 * @param {Object|null} record
 * @param {number} [now=Date.now()]
 * @returns {boolean}
 */
export function isEditable(record, now = Date.now()) {
  if (!record) return true;                 // nothing saved yet
  if (record.dateKey !== localDateKey()) return false;  // a previous day
  return now < new Date(record.editableUntil).getTime();
}

/**
 * Save or amend today's check-in.
 *
 * @param {number} mood            1..5
 * @param {Object} [options]
 * @param {string} [options.note]  optional free text, always the user's words
 * @returns {Promise<Object>}
 *   Ok({ record, isFirst, grew })  — `isFirst` false when this amended an
 *                                    existing answer; `grew` true when a
 *                                    growth entry was appended.
 *   Err('mood-locked')             — outside the edit window
 *   Err('storage-full' | 'storage-failed' | 'storage-unavailable')
 */
export async function save(mood, options = {}) {
  if (!Number.isInteger(mood) || mood < 1 || mood > 5) {
    return Err('invalid-mood', mood);
  }

  const existing = await today();
  if (!isOk(existing)) return existing;

  const previous = existing.value;
  const now = Date.now();

  if (previous && !isEditable(previous, now)) {
    return Err('mood-locked');
  }

  const dateKey = localDateKey();
  const nowIso = new Date(now).toISOString();

  const record = previous
    ? {
        ...previous,
        mood,
        // A note is only overwritten when a new one is actually supplied.
        // Changing the face must never silently discard what someone wrote.
        note: options.note !== undefined ? String(options.note) : previous.note,
        updatedAt: nowIso
      }
    : {
        dateKey,
        mood,
        note: options.note !== undefined ? String(options.note) : '',
        createdAt: nowIso,
        updatedAt: nowIso,
        // The window is measured from the FIRST save, not from each edit.
        // Otherwise an edit at 01:59 would extend the window to 03:59 and it
        // would never actually close.
        editableUntil: new Date(now + EDIT_WINDOW_MS).toISOString()
      };

  const written = await db.put(STORES.MOODS, record);
  if (!isOk(written)) return written;

  const isFirst = !previous;
  let grew = false;

  if (isFirst) {
    // Failure here is deliberately swallowed. The check-in is already saved;
    // telling the user that a point did not register would make a storage
    // detail feel like a personal loss.
    const g = await growth.record(growth.GROWTH.CHECK_IN, { dateKey });
    grew = isOk(g);
  }

  emit(EVENTS.MOOD_LOGGED, { mood, dateKey, isFirst });
  return Ok({ record, isFirst, grew });
}

/**
 * The most recent `days` entries, newest first.
 * Used by the Feelings tab and, in Module 6, by the chart.
 *
 * NOTE: this returns records, never a trend, an average or a verdict.
 * The app does not tell people how their week went. Clinical Framework §12.4.
 */
export async function recent(days = 14) {
  const result = await db.getAll(STORES.MOODS);
  if (!isOk(result)) return result;
  const rows = (result.value || [])
    .slice()
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))
    .slice(0, days);
  return Ok(rows);
}

/** How many days have ever been recorded. */
export function totalDays() {
  return db.count(STORES.MOODS);
}
