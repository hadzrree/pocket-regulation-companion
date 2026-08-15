/**
 * core/a11y/prefs.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   Read, apply and persist the four user-preference modes: theme, text size,
 *   contrast, motion — plus language.
 *
 * HOW IT WORKS
 *   Every preference is a data-* attribute on <html>. CSS does the rest.
 *   No JavaScript recolours or resizes anything, ever.
 *
 * WHY LOCALSTORAGE AND NOT INDEXEDDB
 *   These values must be applied BEFORE the first paint or the user sees a
 *   flash of the wrong theme. At 3am, for the intended user, that is a bright
 *   white screen in a dark room. IndexedDB is asynchronous and cannot do it.
 *   This is the one place synchronous storage is the right answer.
 *   Architecture §6.1.
 *
 * DEPENDENCIES  core/store/store.js, core/events/bus.js, core/utils/result.js
 * USED BY       app/main.js (at boot), features/settings (Module 3)
 * SPEC          Architecture §3.4, §6.3; Clinical Framework §14
 */

import { setState, getState } from '../store/store.js';
import { emit, EVENTS } from '../events/bus.js';
import { Ok, Err } from '../utils/result.js';

const KEY = 'prc.settings';

/** Must match initial-state.js. Duplicated deliberately: this file has to work
 *  even if the store has not booted yet. */
const DEFAULTS = {
  name: '', lang: 'en', theme: 'auto', textSize: 'm', contrast: 'normal',
  motion: 'full', sound: false, haptics: true, remindersEnabled: false,
  reminderTime: null, medicationReminder: false, goal: null
};

/**
 * Load settings from localStorage.
 * Corruption is never fatal: whatever parsed is merged onto the defaults, so
 * a damaged value costs the user one preference, not all of them.
 * Architecture §12.3.
 * @returns {Object} a complete settings object
 */
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULTS };
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

/**
 * Persist settings.
 * @returns {{ok: boolean}} never throws — see core/utils/result.js
 */
export function save(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
    return Ok(settings);
  } catch (err) {
    // Quota exceeded, or private browsing with storage disabled.
    emit(EVENTS.STORAGE_FAILED, { where: 'prefs', err });
    return Err('storage-full', err);
  }
}

/**
 * Write the preference attributes onto <html>.
 * This is the ONLY function that touches those attributes.
 * @param {Object} settings
 */
export function apply(settings) {
  const html = document.documentElement;

  // 'auto' means "follow the OS". We resolve it here rather than leaving the
  // attribute off, so the value on <html> is always the theme actually shown —
  // which makes debugging and testing far simpler.
  const resolvedTheme = settings.theme === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : settings.theme;

  html.dataset.theme    = resolvedTheme;
  html.dataset.textsize = settings.textSize;
  html.dataset.contrast = settings.contrast;
  html.dataset.motion   = settings.motion;
  html.lang             = settings.lang;

  // Keep the browser UI (status bar, scrollbars) in step with the theme.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolvedTheme === 'dark' ? '#16151A' : '#FBF7F2');
}

/**
 * Change one preference: apply it, persist it, put it in the store, announce it.
 * @param {string} key
 * @param {*} value
 */
export function set(key, value) {
  const settings = { ...getState().settings, [key]: value };
  apply(settings);
  save(settings);
  setState({ settings, lang: settings.lang });
  emit(EVENTS.SETTINGS_CHANGED, { key, value });
}

/**
 * Boot-time initialisation. Called once, from app/main.js.
 * Also wires the OS theme listener so 'auto' actually follows the system.
 */
export function init() {
  const settings = load();
  apply(settings);
  setState({ settings, lang: settings.lang });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = getState().settings;
    if (current.theme === 'auto') apply(current);
  });

  return settings;
}
