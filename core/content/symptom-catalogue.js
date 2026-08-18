/**
 * core/content/symptom-catalogue.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The plain words a person can use for something in their body.
 *
 * ############################################################################
 * THIS IS THE CLINICALLY RISKIEST LIST IN THE APPLICATION.
 * ############################################################################
 *
 * ============================================================================
 * WHY A BODY LOG IS DANGEROUS, AND WHY IT IS STILL HERE
 * ============================================================================
 *   Tracking physical sensations can make health anxiety worse. The mechanism
 *   is well described: attention to the body increases the detection of
 *   ordinary sensation, detection prompts checking, checking prompts
 *   recording, and the record becomes the reason for the next check. A
 *   symptom tracker with a severity slider and a trend line is a
 *   body-checking machine wearing a clinical costume.
 *
 *   It is here anyway, for one reason that outweighs that: **a person who
 *   cannot describe their symptoms in a ten-minute appointment gets worse
 *   care.** People arrive at a clinic, are asked "when did this start and
 *   what does it feel like", and cannot answer — not because they do not
 *   know, but because they are frightened and the question is hard. A short
 *   dated list of plain words fixes that, and it is the single most useful
 *   thing this app can hand to a doctor.
 *
 *   So the feature is built for the APPOINTMENT, not for browsing. Every
 *   design decision below follows from that.
 *
 * ============================================================================
 * THE FIVE RULES
 * ============================================================================
 *   1. PLAIN WORDS, NOT CLINICAL ONES. "Chest feels tight", never
 *      "chest tightness"; "heart is racing", never "palpitations". A person
 *      reading their own clinical vocabulary back at 2am is reading a
 *      diagnosis they gave themselves.
 *
 *   2. NO SEVERITY, NO SCALE, NO DURATION. Nothing to compare, so nothing to
 *      check against. See the migration comment for why.
 *
 *   3. THE APP NEVER SAYS WHAT IT IS. Not "this can happen with anxiety", not
 *      "this is common", not "try not to worry". The app has no idea whether
 *      a racing heart is a panic attack or an arrhythmia, and the one time it
 *      guesses wrong is the time that matters.
 *
 *   4. THE APP NEVER REASSURES. "It's probably nothing" is unsafe AND it
 *      feeds the reassurance-seeking loop, which is the thing that keeps
 *      health anxiety running. Reassurance is the treatment that makes the
 *      condition worse.
 *
 *   5. THE STANDING LINE IS ALWAYS PRESENT. Every screen that touches this
 *      feature carries, plainly and without drama: if it is new, bad, or
 *      frightening you, get it looked at. Not as an alert — as a fact that is
 *      always true.
 *
 * ============================================================================
 * WHY THE TEXT LIVES HERE
 * ============================================================================
 *   Fourth sanctioned exception to "all strings in the locale files", for the
 *   same reason as crisis-resources.js, task-catalogue.js and mika-lines.js:
 *   structured data that happens to contain text, where the English and the
 *   Malay must stay paired and the list must stay ordered.
 *
 * DEPENDENCIES  none
 * SPEC          Clinical Framework §10; PRD S34-S36
 */

/**
 * Body sensations, grouped by region so a person can find one quickly without
 * reading all of them. Fifteen in total — enough to be recognisable, short
 * enough to scan when frightened.
 *
 * @typedef {{id: string, region: string, en: string, ms: string}} Sensation
 * @type {Sensation[]}
 */
export const SENSATIONS = Object.freeze([
  /* ---- Chest and breathing ---------------------------------------------- */
  { id: 'chest-tight',  region: 'chest', en: 'Chest feels tight',        ms: 'Dada rasa ketat' },
  { id: 'heart-fast',   region: 'chest', en: 'Heart is going fast',      ms: 'Jantung laju' },
  { id: 'breath-short', region: 'chest', en: 'Hard to get a full breath', ms: 'Susah nak tarik nafas penuh' },

  /* ---- Head -------------------------------------------------------------- */
  { id: 'dizzy',        region: 'head',  en: 'Dizzy or unsteady',        ms: 'Pening atau tak stabil' },
  { id: 'headache',     region: 'head',  en: 'Head aches',               ms: 'Kepala sakit' },
  { id: 'far-away',     region: 'head',  en: 'Everything feels far away', ms: 'Semua rasa jauh' },
  { id: 'blurry',       region: 'head',  en: 'Vision is odd',            ms: 'Penglihatan pelik' },

  /* ---- Stomach ----------------------------------------------------------- */
  { id: 'nausea',       region: 'gut',   en: 'Feel sick',                ms: 'Rasa nak muntah' },
  { id: 'stomach',      region: 'gut',   en: 'Stomach is churning',      ms: 'Perut memulas' },
  { id: 'no-appetite',  region: 'gut',   en: 'Not hungry at all',        ms: 'Langsung tak lapar' },

  /* ---- Whole body -------------------------------------------------------- */
  { id: 'shaky',        region: 'body',  en: 'Shaky',                    ms: 'Menggeletar' },
  { id: 'sweating',     region: 'body',  en: 'Sweating',                 ms: 'Berpeluh' },
  { id: 'tense',        region: 'body',  en: 'Muscles are tense',        ms: 'Otot tegang' },
  { id: 'exhausted',    region: 'body',  en: 'Body is heavy and tired',  ms: 'Badan berat dan penat' },
  { id: 'cant-sleep',   region: 'body',  en: 'Could not sleep',          ms: 'Tak boleh tidur' }
]);

/** The regions, in display order. */
export const REGIONS = Object.freeze(['chest', 'head', 'gut', 'body']);

/** Everything in one region. */
export function sensationsIn(region) {
  return SENSATIONS.filter((s) => s.region === region);
}

/** Look one up. */
export function sensationById(id) {
  return SENSATIONS.find((s) => s.id === id) || null;
}

/** The word in the active language. */
export function sensationText(sensation, lang) {
  if (!sensation) return '';
  return lang === 'ms' ? sensation.ms : sensation.en;
}
