/**
 * core/utils/result.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   A tiny Ok/Err type. Storage and repository functions NEVER throw — they
 *   return a Result, so every caller has to consciously handle failure rather
 *   than being able to ignore it.
 *
 * WHY NOT JUST THROW
 *   Because of one rule in the Clinical Framework: no error may ever appear
 *   during a distress flow. An uncaught exception in a panic session would
 *   surface a browser error or a blank screen at the worst possible moment.
 *   Making failure an ordinary return value means the calling code decides
 *   what the user sees — and during Calm Mode, the answer is "nothing at all,
 *   the circle keeps moving."
 *
 * DEPENDENCIES  none
 * USED BY       core/storage/*, every repository, every view that saves
 * SPEC          Architecture §12.2
 */

/**
 * @param {*} value
 * @returns {{ok: true, value: *}}
 */
export const Ok = (value) => ({ ok: true, value });

/**
 * @param {string} code    a stable, translatable key e.g. 'storage-full'
 * @param {*} [detail]     anything useful for the local log. Never shown raw.
 * @returns {{ok: false, code: string, detail: *}}
 */
export const Err = (code, detail) => ({ ok: false, code, detail });

/** Type guard, for readability at call sites. */
export const isOk = (result) => result && result.ok === true;

/**
 * Unwrap with a fallback. Use when a failure genuinely doesn't matter.
 * @example  const name = unwrapOr(await prefs.get('name'), '');
 */
export const unwrapOr = (result, fallback) => (isOk(result) ? result.value : fallback);
