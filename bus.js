/**
 * core/events/bus.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   Publish/subscribe for CROSS-FEATURE signals only.
 *
 * WHEN TO USE IT
 *   When something happens in one feature that another feature must react to,
 *   without the two importing each other. Example: logging a mood (feelings)
 *   must grow the garden (garden) — but neither feature may import the other.
 *
 * WHEN NOT TO USE IT
 *   Inside one feature. Just call the function. An event bus used for
 *   everything becomes untraceable: you cannot tell what happens when an
 *   event fires without searching the whole codebase.
 *
 * WHY THE EVENT LIST IS FROZEN
 *   A typo in a string event name is a silent no-op — the worst kind of bug.
 *   Importing EVENTS.MOOD_LOGGED means a typo is a runtime error instead.
 *
 * DEPENDENCIES  none
 * USED BY       features/*, core/storage/repositories/growth.repo.js
 * SPEC          Architecture §4.2
 */

/** The complete, closed set of cross-feature events. */
export const EVENTS = Object.freeze({
  MOOD_LOGGED:       'mood:logged',
  TASK_COMPLETED:    'task:completed',
  TASK_DECLINED:     'task:declined',
  SESSION_COMPLETED: 'session:completed',
  THOUGHT_HELD:      'thought:held',
  GROWTH_EARNED:     'growth:earned',
  CRISIS_OPENED:     'crisis:opened',
  SETTINGS_CHANGED:  'settings:changed',
  STORAGE_FAILED:    'storage:failed',
  APP_UPDATED:       'app:updated'
});

const handlers = new Map();

/**
 * Subscribe to an event.
 * @param {string} event  must be a value from EVENTS
 * @param {(payload: *) => void} fn
 * @returns {() => void} unsubscribe — views MUST call this in unmount()
 */
export function on(event, fn) {
  if (!Object.values(EVENTS).includes(event)) {
    throw new Error(`[bus] Unknown event "${event}". Add it to EVENTS first.`);
  }
  if (!handlers.has(event)) handlers.set(event, new Set());
  handlers.get(event).add(fn);
  return () => handlers.get(event)?.delete(fn);
}

/**
 * Publish an event.
 * @param {string} event
 * @param {*} [payload]
 */
export function emit(event, payload) {
  if (!Object.values(EVENTS).includes(event)) {
    throw new Error(`[bus] Unknown event "${event}". Add it to EVENTS first.`);
  }
  const set = handlers.get(event);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(payload);
    } catch (err) {
      // One broken listener must not stop the others, and must never surface
      // to the user during a distress flow.
      console.error(`[bus] handler for "${event}" threw:`, err);
    }
  }
}

/** Test helper only. */
export function __clearForTests() {
  handlers.clear();
}
