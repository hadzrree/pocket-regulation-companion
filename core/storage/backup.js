/**
 * core/storage/backup.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Getting the data out, putting it back, and destroying it.
 *
 * ############################################################################
 * THIS IS THE FIRST THING IN THE PROJECT THAT CAN LEAVE THE DEVICE.
 * ############################################################################
 *   Every other module was built on the promise that nothing goes anywhere.
 *   A backup file breaks that by design — it exists precisely so the person
 *   can move their own data somewhere else.
 *
 *   So the promise changes shape rather than disappearing: nothing leaves
 *   WITHOUT THE PERSON DOING IT DELIBERATELY, and they are told exactly what
 *   is in the file before it is made.
 *
 * ============================================================================
 * WHAT MIKA HOLDS IS A SEPARATE, EXPLICIT CHOICE
 * ============================================================================
 *   The thoughts store is excluded unless the person opts in, on that screen,
 *   for that file.
 *
 *   This is not caution for its own sake. Those are the only free-text
 *   disclosures in the app, they were written to something that said "nobody
 *   reads this, not even me", and a backup file lands in a Downloads folder
 *   that is shared with everything else on the phone — a file manager, a
 *   cloud sync, whoever else uses the device. The Module 6 report excludes
 *   them for the same reason and says so on the page.
 *
 *   Making it one checkbox is not a formality: it is the moment the person
 *   decides that their own words may exist outside the app.
 *
 * ============================================================================
 * RESTORE NEVER OVERWRITES AND NEVER DELETES
 * ============================================================================
 *   A restore ADDS what is missing and leaves everything already on the
 *   device exactly as it is.
 *
 *   The obvious alternative — wipe and replace — is what most backup features
 *   do, and it is wrong here. The realistic bad case is a person restoring an
 *   old file onto a phone that already has three weeks of newer entries on
 *   it. "Replace" silently destroys three weeks of somebody's worst month.
 *   "Merge" cannot, and the cost is only that a duplicate day keeps the
 *   version already on the phone.
 *
 *   It also means restore is safe to run twice, which matters because a
 *   person who is not sure whether it worked will run it again.
 *
 * DEPENDENCIES  ./db.js, ./migrations.js, core/a11y/prefs
 * SPEC          Architecture §16; PRD S40-S42
 */

import { STORES, DB_VERSION } from './migrations.js';
import * as db from './db.js';
import { Ok, Err, isOk } from '../utils/result.js';
import { localDateKey } from '../utils/date.js';

/** The file format version. Independent of the database version. */
export const FORMAT = 1;

/**
 * Stores that always go in a backup.
 * `thoughts` is deliberately NOT here — see the header.
 */
const ALWAYS = Object.freeze([
  STORES.MOODS, STORES.GROWTH, STORES.SESSIONS, STORES.TASKS, STORES.SYMPTOMS
]);

/**
 * Build a backup object.
 *
 * @param {Object} [options]
 * @param {boolean} [options.includeThoughts=false]  the person's own words
 * @returns {Promise<Object>} Ok(backup) | Err(code)
 */
export async function build({ includeThoughts = false } = {}) {
  const data = {};
  const stores = includeThoughts ? [...ALWAYS, STORES.THOUGHTS] : ALWAYS;

  for (const store of stores) {
    const result = await db.getAll(store);
    if (!isOk(result)) return result;
    data[store] = result.value || [];
  }

  /* SETTINGS ARE NOT IN THE FILE, AND THAT IS A CORRECTION.

     An earlier draft of this function copied the whole preferences object in.
     Two things were wrong with that. First, restore() does not apply settings
     and never should — silently changing someone's theme, text size and
     language because they restored a backup is not a restore, it is a
     surprise. So they were dead weight.

     Second, and worse: preferences include the name the person chose to be
     called. The screen above this button lists what the file contains, and
     that list does not say "and your name". A file that carries an
     identifying detail the person was not told about is exactly the thing
     this whole app is built not to do. Either the sentence changes or the
     field goes. The field goes. */

  return Ok({
    /* A header a human can read in a text editor, because somebody will open
       this file wondering what it is. */
    app: 'Pocket Regulation Companion',
    note: includeThoughts
      ? 'Contains private writing. Keep this file somewhere private.'
      : 'Private writing is NOT included in this file.',
    format: FORMAT,
    dbVersion: DB_VERSION,
    exportedOn: localDateKey(),
    includesThoughts: includeThoughts,
    data
  });
}

/** A filename that says what it is and when, without naming the person. */
export function filename(includeThoughts) {
  return `pocket-${localDateKey()}${includeThoughts ? '-with-writing' : ''}.json`;
}

/**
 * Read a backup file the person picked.
 * @param {File} file
 * @returns {Promise<Object>} Ok(backup) | Err('bad-file')
 */
export async function parse(file) {
  let text;
  try {
    text = await file.text();
  } catch (error) {
    return Err('bad-file', error);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return Err('bad-file', error);
  }

  /* Shape check, not a schema validator. Enough to be sure this is one of our
     files rather than a photo somebody renamed, and no more — a stricter
     check would start rejecting files from a slightly older version, which is
     exactly when a person needs it to work. */
  if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
    return Err('bad-file');
  }
  if (parsed.format > FORMAT) return Err('newer-file');

  return Ok(parsed);
}

/**
 * Put a backup back. Adds what is missing, changes nothing that exists.
 *
 * @param {Object} backup  from parse()
 * @returns {Promise<Object>} Ok({added, kept}) — counts, for the confirmation
 */
export async function restore(backup) {
  let added = 0;
  let kept = 0;

  for (const [store, rows] of Object.entries(backup.data || {})) {
    if (!Object.values(STORES).includes(store)) continue;   // unknown store, skip
    if (!Array.isArray(rows)) continue;

    for (const row of rows) {
      const key = store === STORES.MOODS ? row.dateKey
        : store === STORES.TASKS ? row.dateKey
        : row.id;
      if (key === undefined || key === null) continue;

      const existing = await db.get(store, key);
      if (isOk(existing) && existing.value) { kept += 1; continue; }   // never overwrite

      const written = await db.add(store, row);
      if (isOk(written)) added += 1;
    }
  }

  return Ok({ added, kept });
}

/**
 * Destroy everything on this device.
 *
 * The database AND the preferences. A person who asks the app to forget them
 * and finds their name still on the greeting screen has been half-obeyed,
 * which is worse than being refused.
 *
 * There is no undo, and the interface says so before it runs.
 */
export async function destroyEverything() {
  const result = await db.destroyEverything();
  try {
    localStorage.removeItem('prc.settings');
  } catch { /* a locked-down browser; the database is the part that matters */ }
  return result;
}
