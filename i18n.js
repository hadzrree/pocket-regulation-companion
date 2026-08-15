/**
 * core/i18n/i18n.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Look up a UI string in the active language.
 *
 * WHY BILINGUAL FROM DAY ONE, NOT LATER
 *   Retrofitting i18n means touching every file that ever wrote a string.
 *   Bahasa Malaysia parity is a clinical requirement, not a localisation
 *   task — Clinical Framework §22 — and crisis content in particular must be
 *   equally available in both languages.
 *
 * THE REGISTER DECISION
 *   Bahasa Malaysia uses "awak", NEVER "anda". "Anda" is the register of
 *   banks, government forms and corporate notices; "awak" is the register of
 *   a friend. The entire emotional premise of the product depends on it.
 *   Clinical Framework §13.4.
 *
 * DEPENDENCIES  ./locales/en.js, ./locales/ms.js, core/store/store.js
 * USED BY       every view and component that displays text
 * SPEC          Architecture §4.2
 */

import { en } from './locales/en.js';
import { ms } from './locales/ms.js';
import { getState } from '../store/store.js';

const LOCALES = { en, ms };

/**
 * Translate a key.
 *
 * @param {string} key    dot path, e.g. 'nav.today'
 * @param {Object} [vars] optional {name} interpolation
 * @returns {string}
 *
 * MISSING KEYS return the key itself and log a warning — never an empty
 * string. A missing translation must be VISIBLE in testing rather than
 * invisible in production.
 */
export function t(key, vars) {
  const lang = getState().lang || 'en';
  const dict = LOCALES[lang] || en;

  let value = key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), dict);

  // Fall back to English before giving up, so a partially translated locale
  // degrades to readable rather than to key names.
  if (value === undefined && lang !== 'en') {
    value = key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), en);
  }

  if (value === undefined) {
    console.warn(`[i18n] missing key: ${key} (${lang})`);
    return key;
  }

  if (vars) {
    return String(value).replace(/\{(\w+)\}/g, (_, name) =>
      vars[name] !== undefined ? vars[name] : `{${name}}`
    );
  }

  return value;
}

/** Available languages, for the settings screen. */
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ms', label: 'Bahasa Malaysia' }
];

/**
 * Development helper: list keys present in English but missing elsewhere.
 * CI runs this — bilingual parity is a release blocker, not a backlog item.
 */
export function missingKeys(lang) {
  const flatten = (obj, prefix = '') =>
    Object.entries(obj).flatMap(([k, v]) =>
      v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`]
    );
  const enKeys = new Set(flatten(en));
  const otherKeys = new Set(flatten(LOCALES[lang] || {}));
  return [...enKeys].filter((k) => !otherKeys.has(k));
}
