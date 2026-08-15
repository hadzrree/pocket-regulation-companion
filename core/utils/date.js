/**
 * core/utils/date.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   Local-date handling. Every "one per day" rule in the app depends on
 *   agreeing what "today" means.
 *
 * WHY THIS FILE EXISTS
 *   `new Date().toISOString()` returns UTC. For a user in Malaysia (UTC+8),
 *   anything logged before 08:00 local time would be filed under YESTERDAY.
 *   That would silently break the once-daily check-in rule, the two-hour edit
 *   window, and the symptom-check cap — three clinical rules, from one
 *   timezone bug. Everything here works in LOCAL time, deliberately.
 *
 * DEPENDENCIES  none
 * USED BY       mood repo, symptom cap, greeting logic, growth ledger
 * SPEC          Architecture §15.2 (listed as must-unit-test)
 */

/**
 * Today's date as a local YYYY-MM-DD string.
 * This is the key used for "one per day" records.
 * @param {Date} [d=new Date()]
 * @returns {string}
 */
export function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Whole days between two local date keys. Positive if `b` is later.
 * Used for "returning after 7+ days" — never for a streak.
 */
export function daysBetween(aKey, bKey) {
  const a = new Date(`${aKey}T00:00:00`);
  const b = new Date(`${bKey}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

/**
 * Which part of the day it is. Drives the greeting only.
 * @returns {'lateNight'|'morning'|'afternoon'|'evening'}
 */
export function partOfDay(d = new Date()) {
  const h = d.getHours();
  if (h >= 23 || h < 4) return 'lateNight';   // "It's late. I'm here."
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

/**
 * A human date for display, in the active language.
 * @param {string} dateKey  YYYY-MM-DD
 * @param {string} lang     'en' | 'ms'
 */
export function formatDate(dateKey, lang = 'en') {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString(lang === 'ms' ? 'ms-MY' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
}

/** Milliseconds until a given ISO timestamp. Negative if already past. */
export function msUntil(isoString) {
  return new Date(isoString).getTime() - Date.now();
}

/** An ISO timestamp `hours` from now. Used for the mood edit window. */
export function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 3600000).toISOString();
}
