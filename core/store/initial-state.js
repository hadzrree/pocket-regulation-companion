/**
 * core/store/initial-state.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Documents the exact shape of application state. If a field is not
 *           here, it does not exist in the store.
 * SPEC      Architecture §11.3
 */

export const initialState = {
  /* ---- Navigation ------------------------------------------------------- */
  route: '/today',
  previousRoute: null,

  /**
   * True while the user is inside Calm Mode, the panic flow, or any distress
   * journey.
   *
   * THIS FLAG IS SAFETY-CRITICAL. It gates:
   *   - error display        (no error may EVER appear during a distress flow)
   *   - navigation chrome    (nav bar hides)
   *   - the install prompt   (never shown mid-distress)
   *   - service worker update activation
   * Clinical Framework §6, Architecture §12.1
   */
  inDistressFlow: false,

  /* ---- Today ------------------------------------------------------------ */
  todayMood: null,      // 1..5, cached so views don't re-read on every render
  energy: null,         // 'none' | 'little' | 'some' — THIS SESSION ONLY
  currentTask: null,
  sessionStart: null,

  /* ---- Companion -------------------------------------------------------- */
  companionStage: 1,    // 1..5, DERIVED from the growth ledger, never stored

  /* ---- Preferences (mirrored from localStorage at boot) ----------------- */
  settings: {
    name: '',
    lang: 'en',              // 'en' | 'ms'
    theme: 'auto',           // 'auto' | 'light' | 'dark'
    textSize: 'm',           // s | m | l | xl | xxl
    contrast: 'normal',      // 'normal' | 'high'
    motion: 'full',          // 'full' | 'reduced'
    sound: false,            // OFF by default — Design Language §19
    haptics: true,
    remindersEnabled: false, // OFF by default — the app never initiates
    reminderTime: null,
    medicationReminder: false, // opt-in ONLY. Never suggested, never inferred.
    goal: null
  },

  /* ---- System ----------------------------------------------------------- */
  lang: 'en',
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  updateWaiting: false,   // a new service worker is installed and waiting
  onboarded: false
};
