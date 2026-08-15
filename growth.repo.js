/**
 * core/storage/repositories/growth.repo.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   The growth ledger. Every entry is one thing the user did.
 *
 * ============================================================================
 * THE ABSORBING RULE — WHY THIS FILE HAS NO DELETE AND NO UPDATE
 * ============================================================================
 *   The companion, and the garden, may only ever grow. They never shrink,
 *   never wilt, never reset, and never respond to absence. A user who stops
 *   using the app for three months and comes back finds exactly what they
 *   left, unchanged and unbothered.
 *
 *   This is the single most load-bearing behavioural decision in the product.
 *   A shrinking companion turns a support tool into a debt. Streak mechanics
 *   punish exactly the people who need help most — the ones whose weeks fall
 *   apart — and there is good reason to think decay-based engagement
 *   mechanics actively harm depressed users, for whom "you broke your streak"
 *   is confirmation of the belief that they fail at everything.
 *   Clinical Framework §9.2; PRD §3.2.
 *
 *   That rule is enforced STRUCTURALLY, not by discipline. This module
 *   exports `record`, `all`, `total` and `stage`. There is no `remove`, no
 *   `update`, no `reset`, no `decay`. The storage layer beneath it exposes no
 *   single-record delete either. A future developer asked to "add a decay
 *   feature" would have to build the deletion machinery from scratch, and
 *   would find this comment while doing it.
 *
 * ============================================================================
 * WHY A LEDGER AND NOT A COUNTER
 * ============================================================================
 *   A single stored number can drift, be corrupted, or be quietly edited by
 *   any code that can reach it. A ledger is auditable: the total is always
 *   the sum of things that actually happened, and Module 6 can show the user
 *   exactly what their garden was built from — which is the honest version of
 *   a progress feature.
 *
 * DEPENDENCIES  ../db.js, ../migrations.js, core/utils/id, core/utils/date,
 *               core/utils/result, core/events/bus
 * SPEC          Clinical Framework §9; Architecture §11.5; PRD S31
 */

import { STORES } from '../migrations.js';
import * as db from '../db.js';
import { uid } from '../../utils/id.js';
import { localDateKey } from '../../utils/date.js';
import { Ok, isOk } from '../../utils/result.js';
import { emit, EVENTS } from '../../events/bus.js';

/**
 * What can earn growth, and how much.
 *
 * THE NUMBERS ARE SMALL AND FLAT ON PURPOSE.
 * No action is worth ten times another. A check-in on a day someone could
 * barely move is not worth less than a full breathing session — arguably it
 * is worth more. Weighting them would encode a judgement about which coping
 * is "better", and the app has no business making that judgement.
 */
export const GROWTH = Object.freeze({
  CHECK_IN: { kind: 'check-in', amount: 1 },
  SESSION:  { kind: 'session',  amount: 1 },   // Module 3
  TASK:     { kind: 'task',     amount: 1 },   // Module 4
  THOUGHT:  { kind: 'thought',  amount: 1 }    // Module 5
});

/**
 * Companion stages. `min` is the total at which the stage begins.
 *
 * The gaps widen deliberately. Early growth is visible almost immediately, so
 * a new user sees that something happened on day one. Later growth is slower,
 * so the companion does not reach its final form in a fortnight and stop
 * meaning anything. Design Language §17; Mika §6.
 */
export const STAGES = Object.freeze([
  { stage: 1, min: 0 },
  { stage: 2, min: 4 },
  { stage: 3, min: 12 },
  { stage: 4, min: 28 },
  { stage: 5, min: 60 }
]);

/**
 * Append one entry. THE ONLY WRITE IN THIS MODULE.
 *
 * @param {{kind: string, amount: number}} type  a GROWTH constant
 * @param {Object} [meta]
 * @param {string} [meta.dateKey]  defaults to today, local time
 * @returns {Promise<Object>} Ok(entry) | Err(code)
 *
 * FAILURE IS SILENT BY DESIGN AT THE CALL SITE.
 * If the write fails, the user is not told "your growth was not saved" —
 * that sentence would make a storage problem feel like a personal loss. The
 * caller logs it and moves on; the check-in itself has already succeeded.
 */
export async function record(type, meta = {}) {
  const entry = {
    id: uid(),
    kind: type.kind,
    amount: type.amount,
    dateKey: meta.dateKey || localDateKey(),
    at: new Date().toISOString()
  };

  const result = await db.add(STORES.GROWTH, entry);
  if (!isOk(result)) return result;

  // Cross-feature signal: the garden and the companion react to this without
  // either of them importing the check-in.
  emit(EVENTS.GROWTH_EARNED, entry);
  return Ok(entry);
}

/** Every entry, oldest first. */
export async function all() {
  const result = await db.getAll(STORES.GROWTH);
  if (!isOk(result)) return result;
  const rows = (result.value || []).slice().sort((a, b) => (a.at < b.at ? -1 : 1));
  return Ok(rows);
}

/**
 * The sum of every entry.
 * Returns Ok(0) rather than an error when storage is unreachable — a
 * companion drawn at stage 1 is a graceful degradation; a broken screen is
 * not. Architecture §12.4.
 */
export async function total() {
  const result = await all();
  if (!isOk(result)) return Ok(0);
  return Ok(result.value.reduce((sum, entry) => sum + (entry.amount || 0), 0));
}

/**
 * Which stage a total corresponds to.
 * Pure function — no storage, trivially unit-testable.
 * @param {number} value
 * @returns {number} 1..5
 */
export function stageFor(value) {
  let current = 1;
  for (const s of STAGES) if (value >= s.min) current = s.stage;
  return current;
}

/** The current stage, read from storage. */
export async function stage() {
  const t = await total();
  return Ok(stageFor(t.value || 0));
}

/** Entries recorded on one local day. Used by Module 6's history. */
export function forDate(dateKey) {
  return db.getAllByIndex(STORES.GROWTH, 'byDateKey', dateKey);
}
