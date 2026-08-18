/**
 * core/storage/migrations.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   The complete, ordered history of the database schema.
 *
 * HOW INDEXEDDB UPGRADES ACTUALLY WORK
 *   When the app opens the database with a version number higher than the one
 *   on the device, the browser fires ONE `upgradeneeded` event carrying
 *   `oldVersion` and `newVersion`. Every migration between those two numbers
 *   must run, in order, inside that single event. A user who last opened the
 *   app at v1 and returns after two updates jumps straight from 1 to 3 — so
 *   migration 2 and migration 3 both run, back to back.
 *
 * THE RULES
 *   1. NEVER EDIT A MIGRATION THAT HAS SHIPPED. Devices that already ran it
 *      will never run it again. Add a new one instead.
 *   2. NEVER DELETE USER DATA IN A MIGRATION. A schema change is a developer
 *      convenience; losing someone's six months of check-ins is not. If a
 *      field must change shape, transform it — do not drop the store.
 *   3. A migration cannot be async. IndexedDB closes the upgrade transaction
 *      the moment control returns to the event loop, so no `await`, no fetch,
 *      no setTimeout. Everything happens synchronously against `db` and `tx`.
 *
 * WHY THIS MATTERS MORE HERE THAN IN AN ORDINARY APP
 *   There is no backend, so there is no backup. The copy on the phone is the
 *   only copy that has ever existed. A migration bug is not a bad deploy that
 *   can be rolled back — it is permanent loss of something a person wrote
 *   down on their worst day. Clinical Framework §11.2.
 *
 * DEPENDENCIES  none
 * USED BY       core/storage/db.js
 * SPEC          Architecture §11.4
 */

/** The version the app expects. Bump this when adding a migration below. */
export const DB_VERSION = 5;

export const DB_NAME = 'prc';

/**
 * Store names, as constants, so a typo is a reference error rather than a
 * silently-created empty object store.
 */
export const STORES = Object.freeze({
  MOODS:    'moods',
  GROWTH:   'growth',
  META:     'meta',
  SESSIONS: 'sessions',
  TASKS:    'tasks',
  THOUGHTS: 'thoughts',
  SYMPTOMS: 'symptoms'
});

/**
 * Migrations, keyed by the version they bring the database TO.
 * Each receives (db, tx). Both are the live upgrade objects.
 *
 * @type {Record<number, (db: IDBDatabase, tx: IDBTransaction) => void>}
 */
export const MIGRATIONS = {
  /* -------------------------------------------------------------------------
     v1 — Module 2. Moods, the growth ledger, and a small meta store.
  ------------------------------------------------------------------------- */
  1(db) {
    /* MOODS
       keyPath is the LOCAL date key ('2026-08-15'), not a generated id.

       WHY THE DATE IS THE KEY
       The once-daily rule is then enforced by the database itself rather than
       by a check in application code that someone could forget to write. Two
       check-ins on one day is not a bug that can happen — the second put()
       replaces the first, which is exactly the edit behaviour we want inside
       the two-hour window, and which the repository refuses outside it.

       Record shape:
         { dateKey, mood, note, createdAt, updatedAt, editableUntil }
    */
    if (!db.objectStoreNames.contains(STORES.MOODS)) {
      const moods = db.createObjectStore(STORES.MOODS, { keyPath: 'dateKey' });
      // For the history list and the chart in Module 6: newest first, by day.
      moods.createIndex('byCreatedAt', 'createdAt');
    }

    /* GROWTH — the append-only ledger.

       Every entry is one thing the user did. Nothing is ever removed and
       nothing is ever recalculated. The companion's stage is derived by
       summing this store, which is why the companion can never shrink: there
       is no code path that subtracts. Clinical Framework §9.2.

       Record shape:
         { id, kind, amount, dateKey, at }
    */
    if (!db.objectStoreNames.contains(STORES.GROWTH)) {
      const growth = db.createObjectStore(STORES.GROWTH, { keyPath: 'id' });
      growth.createIndex('byDateKey', 'dateKey');
      growth.createIndex('byAt', 'at');
    }

    /* META — small internal values that are not user content.
       Never used for preferences; those live in localStorage so the theme can
       be applied before the first paint. Architecture §11.1. */
    if (!db.objectStoreNames.contains(STORES.META)) {
      db.createObjectStore(STORES.META, { keyPath: 'key' });
    }
  },

  /* -------------------------------------------------------------------------
     v2 — Module 3. Breathing and grounding sessions.
  ------------------------------------------------------------------------- */
  2(db) {
    /* SESSIONS — one record per regulation practice the user did.

       Record shape:
         { id, kind, startedAt, endedAt, seconds, cycles, dateKey }

       WHAT IS DELIBERATELY NOT STORED
       No target, no goal, no "completed" flag, and no comparison to any
       previous session. A session that lasted twenty seconds is a session.
       Storing a completion flag would create the category of an INCOMPLETE
       session, and the moment that category exists something in the interface
       will eventually display it — and the app would be telling a person who
       stopped early that they failed at breathing.
       Clinical Framework §5.5, §9.3.
    */
    if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
      const sessions = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
      sessions.createIndex('byDateKey', 'dateKey');
      sessions.createIndex('byStartedAt', 'startedAt');
    }
  },

  /* -------------------------------------------------------------------------
     v3 — Module 4. The one small thing.
  ------------------------------------------------------------------------- */
  3(db) {
    /* TASKS — keyed by the LOCAL date, like moods.

       ONE RECORD PER DAY, because there is one task per day. The schema
       enforces it: there is no way to store a second offer for the same date,
       so "a list of today's tasks" is not a thing this database can hold.

       Record shape:
         { dateKey, taskId, tier, offeredAt, doneAt, softenings, seen }

       ON `softenings`
       It counts how many times the person said "not now" today, and it exists
       for exactly one purpose: to make the next suggestion SMALLER. It is
       never displayed, never summed across days, and the only behaviour it
       can cause is the app asking for less. There is deliberately no field
       anywhere in this store that records a task as refused, skipped or
       failed. Clinical Framework §8.3.
    */
    if (!db.objectStoreNames.contains(STORES.TASKS)) {
      const tasks = db.createObjectStore(STORES.TASKS, { keyPath: 'dateKey' });
      tasks.createIndex('byOfferedAt', 'offeredAt');
    }
  },

  /* -------------------------------------------------------------------------
     v4 — Module 5. What Mika holds.
  ------------------------------------------------------------------------- */
  4(db) {
    /* THOUGHTS — one record per thing the user handed over.

       Record shape:
         { id, text, heldAt, dateKey, entry, returnedAt }

       WHAT IS STORED, AND WHAT IS NOT
       `text` is exactly what the person typed, unedited and unanalysed. There
       is NO sentiment field, NO category, NO keyword list, NO risk flag and NO
       summary. Nothing in this record could tell a reader anything the person
       did not choose to write, and nothing in it could be aggregated into a
       profile.

       `entry` records which door they came in by — anger, overthinking, numb —
       because the response register differs. It says nothing about content.

       THE RISK MATCH IS NOT HERE AND MUST NEVER BE ADDED. A stored flag would
       be a risk record, and this app keeps none. See core/safety/risk-phrases.js.

       THIS IS THE ONE STORE THE USER MAY DELETE FROM. Their words are theirs,
       and being unable to take something back would make handing it over a
       loss rather than a loan. See the DELETABLE guard in db.js.
       Mika Spec §2.3, §10.1.
    */
    if (!db.objectStoreNames.contains(STORES.THOUGHTS)) {
      const thoughts = db.createObjectStore(STORES.THOUGHTS, { keyPath: 'id' });
      thoughts.createIndex('byHeldAt', 'heldAt');
      thoughts.createIndex('byDateKey', 'dateKey');
    }
  },

  /* -------------------------------------------------------------------------
     v5 — Module 6. What the body noticed.
  ------------------------------------------------------------------------- */
  5(db) {
    /* SYMPTOMS — one record per thing the person noticed in their body.

       Record shape:
         { id, sensationIds, note, at, dateKey }

       ONE RECORD IS ONE MOMENT, not one sensation. A panic episode is a tight
       chest AND a fast heart AND not being able to get a full breath, all at
       once — it is one thing that happened, not three. Storing it as three
       would also burn three of the day's three entries on a single episode,
       which would turn the cap from a protection into an obstruction.

       READ THIS BEFORE ADDING A FIELD.

       There is NO severity. NO 1-10 scale. NO duration. NO "is this better or
       worse than last time". NO cause. NO category.

       Every one of those turns noticing into MEASURING, and measuring a body
       sensation is the exact mechanism by which health anxiety maintains
       itself: the person checks, records a number, compares it to the last
       number, and the comparison generates the next check. A tracker with a
       severity slider is a body-checking machine with a clinical costume on.

       What is stored is the plainest possible fact — a person noticed a thing
       in their body, on a date. That is enough to be useful in a ten-minute
       appointment, and not enough to feed a loop.
       Clinical Framework §10; PRD S34-S36.
    */
    if (!db.objectStoreNames.contains(STORES.SYMPTOMS)) {
      const symptoms = db.createObjectStore(STORES.SYMPTOMS, { keyPath: 'id' });
      symptoms.createIndex('byDateKey', 'dateKey');
      symptoms.createIndex('byAt', 'at');
    }
  }

  /* -------------------------------------------------------------------------
     FUTURE MIGRATIONS GO HERE. Add, never edit.
     Remember to bump DB_VERSION above in the same commit.
  ------------------------------------------------------------------------- */
};
