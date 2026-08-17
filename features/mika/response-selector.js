/**
 * features/mika/response-selector.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Choose the one sentence Mika says after holding something.
 *
 * ############################################################################
 * THE ABSOLUTE CONSTRAINT
 * ############################################################################
 *   This function reads the SHAPE of what happened. It never reads the
 *   CONTENT of what was written.
 *
 *   It receives a character count, a duration, a deletion ratio, today's
 *   check-in, an entry point and the hour. It does NOT receive the text — and
 *   that is enforced by the signature, not by discipline. There is no
 *   parameter it could look at even if a future developer wanted to.
 *
 *   Mika never quotes, paraphrases, summarises, categorises or refers to what
 *   the user wrote. If it ever appeared to know what was said, the user would
 *   reasonably conclude they are being read by something. They are not, and
 *   the design must never suggest otherwise. Mika Spec §3.3.
 *
 * ============================================================================
 * WHY THESE SIGNALS
 * ============================================================================
 *   | Signal          | What it indicates                                  |
 *   |-----------------|----------------------------------------------------|
 *   | Character count | One word vs a paragraph — very different acts       |
 *   | Time in field   | A long pause before writing suggests difficulty     |
 *   | Deletion ratio  | Heavy rewriting suggests shame or precision-seeking |
 *   | Today's check-in| Heavy or Very heavy shifts the whole response set    |
 *   | Entry point     | Anger, overthinking and numb need different registers|
 *   | Hour            | Late-night responses are quieter                    |
 *
 *   None of them says anything about the subject matter. A person writing
 *   four hundred words about a wonderful day and a person writing four
 *   hundred words about a terrible one land in the same bucket, and the line
 *   they get — "You wrote all of that. That matters." — is true of both.
 *
 * ============================================================================
 * A PURE FUNCTION, ON PURPOSE
 * ============================================================================
 *   No storage, no clock reading inside it, no randomness in the branch. Same
 *   signals in, same bucket out. That makes the most emotionally loaded
 *   decision in the app trivially unit-testable, which is the only reason to
 *   trust it.
 *
 * DEPENDENCIES  none
 * SPEC          Mika Specification §3.3, §9.7
 */

/** The buckets, matching the sets in core/content/mika-lines.js. */
export const BUCKETS = Object.freeze({
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
  VERY_HEAVY: 'veryHeavy',
  QUIET: 'quiet'
});

/**
 * @param {Object} signals
 * @param {number} signals.length        characters written
 * @param {number} signals.seconds       seconds spent in the field
 * @param {number} signals.deletionRatio characters deleted ÷ characters typed
 * @param {number|null} signals.mood     today's check-in, 1..5, or null
 * @param {string} signals.entry         'direct'|'anger'|'overthinking'|'numb'|'low'
 * @param {number} signals.hour          0..23, local
 * @param {boolean} [signals.wroteNothing]
 * @returns {string} a BUCKETS value
 */
export function selectBucket({
  length = 0,
  seconds = 0,
  deletionRatio = 0,
  mood = null,
  entry = 'direct',
  hour = 12,
  wroteNothing = false
} = {}) {
  // Sitting without writing is a complete outcome, not a lesser one.
  if (wroteNothing || length === 0) return BUCKETS.QUIET;

  /* A Very-heavy check-in overrides everything else. Someone who has already
     told the app their day is very heavy does not need a breezy "Got it."
     even if they only typed four characters — the four characters are the
     signal, not the brevity. */
  if (mood === 1) return BUCKETS.VERY_HEAVY;

  /* A long hold late at night is treated the same way. 23:00–04:00 is when
     the app's own greeting changes to "It's late. I'm here." */
  const lateNight = hour >= 23 || hour < 4;
  if (lateNight && length > 240) return BUCKETS.VERY_HEAVY;

  /* Heavy: a lot of text, a long time, a lot of deleting, or a Heavy
     check-in. Any ONE of these is enough — they are alternatives, not a
     score to be accumulated. Requiring two would mean a person who wrote six
     hundred words quickly got a light response. */
  if (mood === 2) return BUCKETS.HEAVY;
  if (length > 280) return BUCKETS.HEAVY;
  if (seconds > 180) return BUCKETS.HEAVY;
  if (deletionRatio > 0.5 && length > 40) return BUCKETS.HEAVY;

  /* Light: short and quick, with nothing else pointing the other way. */
  if (length <= 40 && seconds < 45 && deletionRatio < 0.3) return BUCKETS.LIGHT;

  return BUCKETS.MEDIUM;
}

/**
 * Which of Mika's six states belongs to a bucket.
 *
 * `glad` is deliberately absent: the two-hop animation is reserved for growth
 * moments and is NEVER used after a heavy hold. Hopping at someone who has
 * just written something painful would be the single worst frame in the app.
 * Mika Spec §7.3.
 */
export function stateForBucket(bucket) {
  if (bucket === BUCKETS.HEAVY || bucket === BUCKETS.VERY_HEAVY) return 'comforting';
  if (bucket === BUCKETS.QUIET) return 'resting';
  return 'content';
}
