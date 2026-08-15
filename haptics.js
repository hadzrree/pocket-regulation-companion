/**
 * core/utils/haptics.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   A single, honest wrapper around navigator.vibrate.
 *
 * WHY A WRAPPER RATHER THAN CALLING vibrate() DIRECTLY
 *   Three reasons, in order of importance:
 *
 *   1. CONSENT. Haptics is a user setting. A buzz the user did not ask for,
 *      on a phone in a quiet clinic waiting room, is an intrusion. Routing
 *      every pulse through here means the setting cannot be forgotten in one
 *      component.
 *
 *   2. iOS DOES NOT SUPPORT IT. Safari has never shipped navigator.vibrate,
 *      and web apps on iOS have no other haptics API. This wrapper is a
 *      silent no-op there. That is a real constraint, not a bug to work
 *      around: nothing in this app may DEPEND on a haptic being felt. Every
 *      pulse is a bonus on top of a visual change that already carries the
 *      meaning. Architecture §7.4.
 *
 *   3. THE PATTERNS ARE CLINICAL. A sharp double-buzz is an alarm. This app
 *      never alarms. Every pattern below is a single soft pulse, and the
 *      longest is 40ms. Design Language §12.
 *
 * REDUCED MOTION
 *   "Reduce movement" also silences haptics. For a user with vestibular
 *   sensitivity or sensory over-responsivity — common in the autistic and
 *   anxious populations this app serves — an unexpected vibration is the same
 *   category of problem as an unexpected animation.
 *
 * DEPENDENCIES  core/store/store.js
 * USED BY       Button, MoodSelector, the breathing pacer (Module 3)
 * SPEC          Design Language §12; Architecture §7.4
 */

import { getState } from '../store/store.js';

/**
 * The complete, closed set of haptic patterns.
 * Durations in ms. Arrays alternate vibrate/pause.
 */
export const HAPTIC = Object.freeze({
  tap:      12,        // any button press
  select:   18,        // a choice registered — mood face, option
  complete: [24, 60, 24],  // something finished. Two soft taps, never sharp.
  breathIn: 10,        // the turn of a breath cycle
  breathOut: 14
});

/** True when a pulse is allowed right now. */
function enabled() {
  const { settings } = getState();
  if (!settings || settings.haptics === false) return false;
  if (settings.motion === 'reduced') return false;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;
  return true;
}

/**
 * Fire a haptic pulse. Silent no-op when unsupported or switched off.
 * @param {number|number[]} pattern  use a HAPTIC constant
 */
export function pulse(pattern = HAPTIC.tap) {
  if (!enabled()) return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    // Some Android WebViews throw when the page is backgrounded. Never
    // surface this — a failed buzz is not an error the user needs to know.
    return false;
  }
}

/** Stop any pulse in progress. Called when leaving a breathing session. */
export function stop() {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(0); } catch { /* ignore */ }
  }
}

/**
 * Whether this device can do haptics at all.
 * Used by Settings (Module 7) to hide the toggle rather than offer a switch
 * that does nothing — an offer the app cannot keep is worse than no offer.
 */
export function isSupported() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}
