/**
 * core/storage/db.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   The only file in the codebase that talks to IndexedDB. Everything else
 *   goes through a repository, and every repository goes through here.
 *
 * ============================================================================
 * WHY INDEXEDDB AND NOT LOCALSTORAGE
 * ============================================================================
 *   localStorage is synchronous — every read blocks the main thread, which
 *   means it blocks an animation. A breathing circle that stutters because
 *   the app is saving a mood is not a small cosmetic problem: the whole point
 *   of the pacer is a smooth, predictable rhythm to entrain to.
 *
 *   localStorage is also capped at roughly 5MB and stores strings only, so
 *   every read is a JSON.parse of the ENTIRE dataset. After a year of daily
 *   check-ins that is a real cost on a low-end phone — and low-end phones are
 *   the target, not the edge case.
 *
 *   Preferences DO stay in localStorage, deliberately, because they must be
 *   readable synchronously before the first paint to avoid a flash of the
 *   wrong theme. That is the one exception. Architecture §11.1.
 *
 * ============================================================================
 * WHY NOTHING HERE THROWS
 * ============================================================================
 *   Every function returns a Result (Ok/Err). IndexedDB fails for reasons
 *   that have nothing to do with this app: Safari private browsing, storage
 *   pressure, a corrupted profile, an OS eviction. If any of those surfaced
 *   as an uncaught exception during a panic session, the user would see a
 *   blank screen at the worst possible moment.
 *
 *   Making failure an ordinary return value forces every caller to decide
 *   what the user sees — and during a distress flow, the answer is "nothing
 *   at all, the circle keeps moving." Clinical Framework §6; Architecture §12.2.
 *
 * ============================================================================
 * DATA MAY BE EVICTED. THE APP MUST NOT WARN ABOUT IT.
 * ============================================================================
 *   iOS clears storage for sites unused for seven days, and a home-screen web
 *   app gets the same quota, not an exemption. We request persistent storage
 *   (app/register-sw.js) and encourage installation, which materially reduces
 *   the risk — but we never tell the user their feelings might disappear.
 *   That warning would add a background anxiety to an app whose entire job is
 *   to reduce it, in exchange for information they cannot act on.
 *   Architecture §11.6; Clinical Framework §11.3.
 *
 * DEPENDENCIES  ./migrations.js, core/utils/result.js
 * USED BY       core/storage/repositories/*  — and nothing else
 * SPEC          Architecture §11
 */

import { DB_NAME, DB_VERSION, MIGRATIONS } from './migrations.js';
import { Ok, Err } from '../utils/result.js';

/** The single cached connection. */
let connection = null;
let opening = null;

/**
 * Open the database, running any pending migrations.
 * Safe to call repeatedly — the connection is cached and concurrent callers
 * share one in-flight open.
 *
 * @returns {Promise<{ok: true, value: IDBDatabase} | {ok: false, code: string}>}
 */
export function open() {
  if (connection) return Promise.resolve(Ok(connection));
  if (opening) return opening;

  opening = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      // Some locked-down enterprise WebViews genuinely have no IndexedDB.
      return resolve(Err('storage-unavailable'));
    }

    let request;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (error) {
      // Safari in private browsing has historically thrown here rather than
      // firing onerror.
      return resolve(Err('storage-unavailable', error));
    }

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const tx = request.transaction;
      const from = event.oldVersion || 0;
      const to = event.newVersion || DB_VERSION;

      // Run EVERY migration between the version on this device and the
      // version this build expects, in ascending order. A device jumping
      // from v1 to v3 runs 2 and then 3.
      for (let version = from + 1; version <= to; version += 1) {
        const migrate = MIGRATIONS[version];
        if (typeof migrate === 'function') migrate(db, tx);
      }
    };

    request.onsuccess = () => {
      connection = request.result;

      // Another tab has opened a newer version. Close this connection so the
      // upgrade there is not blocked. The next call to open() reconnects.
      connection.onversionchange = () => {
        connection.close();
        connection = null;
      };

      // The connection can also be closed under us by the browser reclaiming
      // resources. Drop the cache so the next call reopens rather than using
      // a dead handle.
      connection.onclose = () => { connection = null; };

      resolve(Ok(connection));
    };

    request.onerror = () => resolve(Err('storage-unavailable', request.error));

    // Fires when another tab holds an older connection open. We do not force
    // anything — we simply fail this attempt and let the caller retry.
    request.onblocked = () => resolve(Err('storage-blocked'));
  }).finally(() => { opening = null; });

  return opening;
}

/**
 * Run one transaction and resolve with a Result.
 *
 * @param {string|string[]} stores
 * @param {'readonly'|'readwrite'} mode
 * @param {(tx: IDBTransaction) => IDBRequest|Promise<*>|*} work
 *        Receives the transaction. Return an IDBRequest to have its result
 *        unwrapped for you, or any plain value to pass it straight through.
 * @returns {Promise<Object>} Ok(value) | Err(code, detail)
 *
 * NOTE ON QUOTA
 *   A write that exceeds the quota rejects with a QuotaExceededError. It is
 *   translated to the stable code 'storage-full', which i18n maps to a plain
 *   sentence that blames nothing and no one: "I couldn't save that just now.
 *   Your phone's storage might be full."
 */
export async function run(stores, mode, work) {
  const opened = await open();
  if (!opened.ok) return opened;

  return new Promise((resolve) => {
    let tx;
    try {
      tx = opened.value.transaction(stores, mode);
    } catch (error) {
      return resolve(Err('storage-unavailable', error));
    }

    let payload;
    let settled = false;

    const fail = (code, detail) => {
      if (settled) return;
      settled = true;
      resolve(Err(code, detail));
    };

    tx.onabort = () => {
      const name = tx.error && tx.error.name;
      fail(name === 'QuotaExceededError' ? 'storage-full' : 'storage-failed', tx.error);
    };
    tx.onerror = () => {
      const name = tx.error && tx.error.name;
      fail(name === 'QuotaExceededError' ? 'storage-full' : 'storage-failed', tx.error);
    };

    // `oncomplete` is the ONLY place a write is considered successful.
    // A request's onsuccess fires before the transaction commits, so
    // resolving there would report "saved" for data that can still be lost.
    tx.oncomplete = () => {
      if (settled) return;
      settled = true;
      resolve(Ok(payload));
    };

    try {
      const result = work(tx);
      if (result && typeof result.addEventListener === 'function' && 'readyState' in result) {
        // An IDBRequest — capture its result when it lands.
        result.onsuccess = () => { payload = result.result; };
        result.onerror = () => fail('storage-failed', result.error);
      } else {
        payload = result;
      }
    } catch (error) {
      try { tx.abort(); } catch { /* already aborting */ }
      fail('storage-failed', error);
    }
  });
}

/* ---------------------------------------------------------------------------
   SMALL WRAPPERS
   Repositories use these rather than writing raw request plumbing.
--------------------------------------------------------------------------- */

/** Read one record by key. Ok(undefined) when there is no such record. */
export const get = (store, key) =>
  run(store, 'readonly', (tx) => tx.objectStore(store).get(key));

/** Read every record in a store. */
export const getAll = (store) =>
  run(store, 'readonly', (tx) => tx.objectStore(store).getAll());

/** Read every record matching an index value. */
export const getAllByIndex = (store, index, value) =>
  run(store, 'readonly', (tx) => tx.objectStore(store).index(index).getAll(value));

/** Count records in a store. */
export const count = (store) =>
  run(store, 'readonly', (tx) => tx.objectStore(store).count());

/** Insert, failing if the key already exists. */
export const add = (store, record) =>
  run(store, 'readwrite', (tx) => tx.objectStore(store).add(record));

/** Insert or replace. */
export const put = (store, record) =>
  run(store, 'readwrite', (tx) => tx.objectStore(store).put(record));

/**
 * The ONLY stores a single record may be removed from.
 *
 * ============================================================================
 * WHY THIS GUARD EXISTS RATHER THAN JUST A `remove()` FUNCTION
 * ============================================================================
 *   Until Module 5 there was no way to delete one record from anywhere, and
 *   that absence was load-bearing: it is the mechanism by which the growth
 *   ledger's append-only rule is enforced. Not a convention someone has to
 *   remember — an API that does not exist.
 *
 *   Module 5 broke the tie. A person's own written thoughts must be
 *   deletable, because being unable to take something back would make handing
 *   it over a loss rather than a loan, and nobody hands over anything under
 *   those terms.
 *
 *   So deletion exists, and it is fenced. `remove()` refuses every store
 *   except the ones listed here, and it refuses by returning an Err rather
 *   than throwing, so a mistake is visible in a test rather than at runtime.
 *   Adding STORES.GROWTH to this array would silently undo the single most
 *   load-bearing product decision in the app.
 *
 *   Clinical Framework §9.2; Mika Specification §10.1.
 */
const DELETABLE = Object.freeze(['thoughts']);

/**
 * Remove ONE record, from a store that permits it.
 *
 * @param {string} store  must be in DELETABLE
 * @param {*} key
 * @returns {Promise<Object>} Ok(true) | Err('not-deletable') | Err(storage code)
 */
export function remove(store, key) {
  if (!DELETABLE.includes(store)) {
    // Loud in a test, silent to the user, and impossible to ignore in review.
    console.error(`[db] refusing to delete from "${store}" — not in DELETABLE`);
    return Promise.resolve(Err('not-deletable', store));
  }
  return run(store, 'readwrite', (tx) => tx.objectStore(store).delete(key));
}

/**
 * DELETE THE WHOLE DATABASE.
 *
 * This is the ONLY deletion function in the storage layer, and it exists for
 * exactly one caller: the "delete everything" control in Settings (Module 7),
 * which the user reaches deliberately and confirms explicitly.
 *
 * The only OTHER deletion path is remove() above, which is fenced to the
 * stores in DELETABLE and refuses everything else. The growth ledger is not
 * in that list and must never be added to it — its append-only rule is
 * enforced by the absence of an API, not by a convention someone has to
 * remember. Clinical Framework §9.2.
 */
export function destroyEverything() {
  return new Promise((resolve) => {
    if (connection) { connection.close(); connection = null; }
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve(Ok(true));
    request.onerror   = () => resolve(Err('storage-failed', request.error));
    request.onblocked = () => resolve(Err('storage-blocked'));
  });
}

/** Test helper: drop the cached connection so the next open() reconnects. */
export function __resetForTests() {
  if (connection) connection.close();
  connection = null;
  opening = null;
}
