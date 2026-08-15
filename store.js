/**
 * core/store/store.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   The entire state management system for this application. About 50 lines.
 *
 * WHY SO SMALL
 *   The app has roughly a dozen fields of ephemeral state. Redux, MobX, signals
 *   or a proxy-based reactive system would each add a dependency and a mental
 *   model larger than the problem. This is deliberately small enough to read
 *   in one sitting — which matters, because a beginner developer has to be
 *   able to maintain this app.
 *
 * WHAT BELONGS HERE
 *   Only ephemeral, session-scoped UI state: current route, whether we are in
 *   a distress flow, today's cached mood, settings.
 *
 * WHAT DOES NOT BELONG HERE
 *   Persisted data — mood history, thoughts, sessions, the growth ledger.
 *   Mirroring the database into memory creates two sources of truth and the
 *   synchronisation bugs that follow. Views read from repositories on mount.
 *
 * DEPENDENCIES  ./initial-state.js
 * USED BY       app/router.js, every view
 * SPEC          Architecture §11
 */

import { initialState } from './initial-state.js';

// Module-private. Nothing outside this file holds a reference to it.
const state = { ...initialState };
const subscribers = new Set();

/**
 * Read the current state.
 * Treat the returned object as READ-ONLY. Mutating it directly will not
 * notify subscribers and will cause the UI to drift out of sync.
 * @returns {Object}
 */
export function getState() {
  return state;
}

/**
 * Merge a partial update into state and notify every subscriber.
 * @param {Object} partial
 */
export function setState(partial) {
  const prev = { ...state };
  Object.assign(state, partial);
  for (const fn of subscribers) {
    try {
      fn(state, prev);
    } catch (err) {
      // A broken subscriber must never break the app, and during a distress
      // flow it must never surface. Log locally and carry on.
      console.error('[store] subscriber threw:', err);
    }
  }
}

/**
 * Subscribe to state changes.
 *
 * IMPORTANT: every view MUST call the returned function in unmount().
 * A leaked subscriber keeps a whole torn-down view alive in memory.
 *
 * @param {(state: Object, prev: Object) => void} fn
 * @returns {() => void} unsubscribe
 */
export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/**
 * Derive a value from state.
 * @example  const inFlow = select(s => s.inDistressFlow);
 */
export function select(fn) {
  return fn(state);
}

/**
 * Reset to initial state. Test helper only — never called by the app.
 * @private
 */
export function __resetForTests() {
  Object.assign(state, initialState);
  subscribers.clear();
}
