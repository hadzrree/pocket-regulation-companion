/**
 * core/safety/risk-phrases.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Recognise — never interpret — a small number of unambiguous
 *           phrases a person may volunteer, and offer a phone number.
 *
 * ############################################################################
 * READ ALL OF THIS BEFORE CHANGING ONE LINE OF IT.
 * ############################################################################
 *
 * ============================================================================
 * THIS IS NOT SCREENING, AND THE DISTINCTION IS NOT A TECHNICALITY
 * ============================================================================
 *   The UX Strategy states the app performs no risk screening and asks no
 *   risk questions. That still holds. This file does not change it.
 *
 *   The app never ASKS. But when a person has VOLUNTEERED something,
 *   responding is not screening — it is the minimum decency of having been
 *   told. An app that reads "I don't want to be here anymore", animates a
 *   leaf, and replies "Got it" has failed that person in a way that is very
 *   hard to defend afterwards.
 *
 *   | Screening — still prohibited | Responding — this file            |
 *   |------------------------------|-----------------------------------|
 *   | The app asks about risk      | The user volunteers something     |
 *   | A score is produced          | Nothing is scored or classified   |
 *   | The result is recorded       | No flag survives the screen       |
 *   | Implies monitoring           | States plainly nobody is watching |
 *   | Fires on a schedule          | Fires only on what was written    |
 *
 * ============================================================================
 * WHAT THIS IS TECHNICALLY
 * ============================================================================
 *   A short array of strings and a substring match, run on the device, in
 *   memory. NO machine learning. NO model. NO inference. NO network call.
 *   The text never leaves the phone, and there is nowhere for it to go — the
 *   Content Security Policy pins `connect-src 'self'`, so the browser itself
 *   would refuse.
 *
 * ============================================================================
 * THE MATCH RESULT IS NEVER STORED. NOT ANYWHERE. NOT EVER.
 * ============================================================================
 *   `matches()` returns a boolean to the calling screen. When that screen
 *   unmounts, the boolean is gone. It is never written to IndexedDB, never
 *   counted, never used to change future behaviour, and never included in an
 *   export.
 *
 *   A stored flag would be a risk record. This app does not keep risk records,
 *   because a risk record is a thing that can be subpoenaed, seen by a family
 *   member on a shared phone, or used to decide something about a person
 *   without their knowledge. Mika Spec §10.4.2.
 *
 * ============================================================================
 * PRECISION OVER RECALL — DELIBERATELY
 * ============================================================================
 *   This list is SHORT and UNAMBIGUOUS. It is not trying to catch everything,
 *   and it will miss most genuine risk: people rarely write it plainly, and
 *   they use idiom, metaphor and languages this list does not cover.
 *
 *   That is an accepted, documented limitation, and the mitigation is
 *   structural rather than clever: the crisis numbers are permanently
 *   reachable in two taps from anywhere in the app, whatever anyone writes.
 *   Detection is a supplement. It is never the safety net.
 *
 *   A broad net would fire constantly, teach people to ignore it, and cost
 *   more than it caught.
 *
 * ============================================================================
 * WHAT MUST NEVER HAPPEN — Mika Spec §10.4.5
 * ============================================================================
 *   Never refuse the thought. Never skip or shorten the gathering. Never a
 *   full-screen modal. Never red, never a warning icon. Never the words
 *   "detected", "flagged", "concerning" or "crisis". Never delete or hide
 *   what they wrote. Never notify anyone. Never persist the flag. Never ask
 *   "are you safe?". Never repeat within a session. Never change Mika's
 *   expression to worried.
 *
 * ============================================================================
 * GOVERNANCE — NOT OPTIONAL
 * ============================================================================
 *   This list is reviewed by a clinician AND a native Bahasa Malaysia speaker
 *   before every release. Any change to the response copy requires clinical
 *   sign-off. The list is never shown in the interface.
 *
 *   Reviewed: NOT YET — this is a developer's draft and is marked as such in
 *   the module documentation. It must not ship to real users until a
 *   clinician has signed it off.
 *
 * DEPENDENCIES  none
 * USED BY       features/mika/mika.view.js — and nothing else
 * SPEC          Mika Specification §10.4
 */

/**
 * The phrase list.
 *
 * Kept short on purpose. Every entry must be a phrase that is very hard to
 * write by accident, in a sentence that is not about the person's own state.
 * If you find yourself adding something that could plausibly appear in a
 * complaint about a colleague, it does not belong here.
 */
const PHRASES = Object.freeze([
  /* ---- English ---------------------------------------------------------- */
  'kill myself',
  'killing myself',
  'end my life',
  'ending my life',
  'want to die',
  'wish i was dead',
  'wish i were dead',
  'better off dead',
  'better off without me',
  'dont want to be here anymore',
  'do not want to be here anymore',
  'no reason to live',
  'nothing to live for',
  'take my own life',
  'hurt myself',
  'harm myself',
  'cut myself',
  'suicidal',
  'suicide',

  /* ---- Bahasa Malaysia --------------------------------------------------- */
  'nak bunuh diri',
  'bunuh diri',
  'nak mati',
  'nak mati je',
  'baik aku mati',
  'lagi baik saya mati',
  'tak nak hidup',
  'tak mahu hidup',
  'tiada sebab untuk hidup',
  'cederakan diri',
  'sakiti diri sendiri',
  'lukakan diri'
]);

/**
 * Normalise text for matching.
 *
 * Lower-cased, diacritics stripped, apostrophes removed (so "don't" and
 * "dont" both match), and every run of whitespace or punctuation collapsed to
 * a single space. The result is padded with spaces so a word-boundary check
 * is a plain substring test.
 */
function normalise(text) {
  return ` ${String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip combining accents
    .replace(/['’]/g, '')          // don't -> dont
    .replace(/[^a-z0-9\s]/g, ' ')       // punctuation becomes space
    .replace(/\s+/g, ' ')
    .trim()} `;
}

/**
 * Does this text contain one of the phrases?
 *
 * @param {string} text  what the user wrote. NEVER stored, NEVER transmitted.
 * @returns {boolean}
 *
 * The phrases are padded with spaces on both sides before the substring test,
 * so "suicide" matches the word but "suicidence" would not. Without that,
 * substring matching produces false positives that feel uncanny — the user
 * cannot see why the card appeared, which is precisely the impression of
 * being read that this whole design is trying to avoid.
 */
export function matches(text) {
  if (!text) return false;
  const haystack = normalise(text);
  return PHRASES.some((phrase) => haystack.includes(` ${phrase} `));
}

/**
 * How often the response may appear.
 *
 * Once per session and once per 24 hours. Repetition reads as surveillance,
 * and a person who sees the card three times in one evening learns that the
 * app is watching them rather than that help exists.
 *
 * The 24-hour part is held in memory only — deliberately. Persisting it would
 * mean storing "this person triggered the risk path today", which is exactly
 * the record this design refuses to keep. The cost is that the cap resets if
 * the app is fully closed and reopened, and that is the correct trade: a
 * person who reopens the app hours later and writes it again is better served
 * by seeing the number than by the app remembering them.
 */
let lastShownAt = 0;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

/** True if the response may be shown right now. */
export function mayShow() {
  return Date.now() - lastShownAt > COOLDOWN_MS;
}

/** Record that it was shown. In memory. Nowhere else. */
export function markShown() {
  lastShownAt = Date.now();
}

/** Test helper only. */
export function __resetForTests() {
  lastShownAt = 0;
}
