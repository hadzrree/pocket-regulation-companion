/**
 * core/storage/repositories/symptom.repo.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Recording what the body noticed, and refusing to do more than that.
 *
 * ============================================================================
 * THE DAILY CAP IS THE SAFETY FEATURE
 * ============================================================================
 *   Three entries per local day. After that the screen says so, kindly, and
 *   stops offering.
 *
 *   This is the only cap in the whole application, and it exists because this
 *   is the only feature that can be USED COMPULSIVELY. A person in a health
 *   anxiety spiral will check their pulse forty times in an evening, and an
 *   app that lets them log forty entries has become the instrument of the
 *   spiral rather than a record of it.
 *
 *   Three is enough for a real day — morning, afternoon, a bad night — and
 *   few enough that the log cannot become the checking behaviour itself.
 *
 *   WHAT THE CAP MUST NEVER DO: it must never scold, never say "you have
 *   logged too many times", never imply the person is doing something wrong.
 *   The sentence is about the app, not about them: "That's enough for today.
 *   I've got what you told me." Clinical Framework §10.4.
 *
 * ============================================================================
 * WHAT THIS MODULE DOES NOT AND WILL NOT DO
 * ============================================================================
 *   - It does not compute a frequency, a trend, a streak or a "most common".
 *   - It does not correlate symptoms with mood. That correlation is a
 *     clinical inference, and the app is not entitled to make one. A person
 *     may notice it themselves by looking at the report; that is different,
 *     because they are the one drawing the conclusion.
 *   - It does not flag anything as concerning.
 *   - It does not earn growth. Noticing a symptom is not an achievement, and
 *     rewarding it would give a body-checking loop a reason to run.
 *
 * DEPENDENCIES  ../db.js, ../migrations.js, core/utils/*
 * SPEC          Clinical Framework §10; PRD S34-S36
 */

import { STORES } from '../migrations.js';
import * as db from '../db.js';
import { uid } from '../../utils/id.js';
import { localDateKey } from '../../utils/date.js';
import { Ok, Err, isOk } from '../../utils/result.js';

/** Entries allowed per local day. See the header before changing this. */
export const DAILY_CAP = 3;

/** Today's entries. */
export async function today() {
  const result = await db.getAllByIndex(STORES.SYMPTOMS, 'byDateKey', localDateKey());
  if (!isOk(result)) return result;
  return Ok(result.value || []);
}

/** Whether another entry may be recorded right now. */
export async function mayRecord() {
  const rows = await today();
  if (!isOk(rows)) return Ok(true);          // storage trouble never blocks
  return Ok(rows.value.length < DAILY_CAP);
}

/**
 * Record one MOMENT, which may hold several sensations at once.
 *
 * @param {string[]} sensationIds  ids from core/content/symptom-catalogue.js
 * @param {Object} [options]
 * @param {string} [options.note]  the person's own words, optional
 * @returns {Promise<Object>} Ok(record) | Err('daily-cap') | Err(storage code)
 *
 * NO GROWTH IS RECORDED HERE, deliberately. Every other action in the app
 * grows the garden. This one does not, because rewarding the noticing of a
 * body sensation would give a checking loop a reason to run.
 */
export async function record(sensationIds, options = {}) {
  const allowed = await mayRecord();
  if (isOk(allowed) && allowed.value === false) return Err('daily-cap');

  const list = [].concat(sensationIds).filter(Boolean);
  if (!list.length) return Err('nothing-chosen');

  const entry = {
    id: uid(),
    sensationIds: list,
    /* The person's own words, if they wrote any. Stored exactly as typed and
       never parsed, matched, categorised or searched. */
    note: options.note ? String(options.note) : '',
    at: new Date().toISOString(),
    dateKey: localDateKey()
  };

  const written = await db.add(STORES.SYMPTOMS, entry);
  if (!isOk(written)) return written;
  return Ok(entry);
}

/**
 * Everything recorded, newest first.
 * Used by the report. NOT used to build a browsable feed — see the note in
 * features/body/body.view.js about why the history is not scrollable from the
 * logging screen.
 */
export async function all() {
  const result = await db.getAll(STORES.SYMPTOMS);
  if (!isOk(result)) return result;
  const rows = (result.value || []).slice().sort((a, b) => (a.at < b.at ? 1 : -1));
  return Ok(rows);
}

/** Entries between two local date keys, inclusive. For the report. */
export async function between(fromKey, toKey) {
  const result = await all();
  if (!isOk(result)) return result;
  return Ok(result.value.filter((r) => r.dateKey >= fromKey && r.dateKey <= toKey));
}
