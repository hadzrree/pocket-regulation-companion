/**
 * core/content/task-catalogue.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Every task the app will ever suggest, in three tiers of effort.
 *
 * ============================================================================
 * WHY THE TEXT LIVES HERE AND NOT IN THE LOCALE FILES
 * ============================================================================
 *   The house rule is that every UI string lives in core/i18n/locales/*. This
 *   file is the second sanctioned exception, and it sits in core/content/ for
 *   the same reason core/safety/crisis-resources.js sits where it does: these are not UI strings, they are
 *   STRUCTURED DATA that happens to contain text. A task is a tier, an id and
 *   two sentences that must stay together — splitting the sentences into a
 *   locale file 200 lines away would make it possible to change the English
 *   without the Malay, and to reorder one list without the other.
 *
 *   Both languages are side by side here, deliberately, so a reviewer can see
 *   at a glance whether they say the same thing.
 *
 * ============================================================================
 * WHAT MAKES A TASK BELONG IN THIS LIST
 * ============================================================================
 *   Four tests. A task must pass all four:
 *
 *   1. IT IS ONE STEP. "Tidy the kitchen" is a project. "Put one thing back
 *      where it belongs" is a step. Projects are where behavioural activation
 *      fails, because a person with no capacity cannot find the first move.
 *
 *   2. IT HAS NO NUMBER. No reps, no minutes, no counts. A number is a
 *      target, a target can be missed, and being told you managed 12 of 20
 *      squats is the exact experience this app exists to avoid. (This is
 *      Clinical Framework Appendix D3, which struck a "20 squats" example
 *      from an earlier draft of the specifications.)
 *
 *   3. IT IS FINISHABLE IN A MINUTE OR TWO. The point is not the activity.
 *      The point is the completion — evidence, in the person's own week, that
 *      they did a thing they intended to do.
 *
 *   4. IT COSTS NOTHING AND NEEDS NOBODY. No purchase, no appointment, no
 *      other person's cooperation, no equipment, and nothing that assumes a
 *      house, a garden, a car or a job.
 *
 * ============================================================================
 * WHY BEHAVIOURAL ACTIVATION IS ARRANGED THIS WAY ROUND
 * ============================================================================
 *   The evidence base for behavioural activation in depression is among the
 *   strongest for any psychological intervention, and its core insight is
 *   counter-intuitive: ACTION COMES BEFORE MOTIVATION, not after. Waiting to
 *   feel like doing something is the trap; doing a small thing while still
 *   feeling nothing is the intervention.
 *
 *   That is why the app never asks "what do you feel up to?" — a question
 *   that invites the person to consult a feeling that is currently telling
 *   them nothing is possible. It offers one specific small thing instead.
 *
 * ============================================================================
 * THE TIERS
 * ============================================================================
 *   0 — can be done without leaving the bed or the chair
 *   1 — needs standing up, stays inside the house
 *   2 — a slightly bigger single step
 *
 *   The tier offered is chosen from the day's check-in, and it goes DOWN when
 *   someone says "not now". It never goes up within a day. See task.repo.js.
 *
 * DEPENDENCIES  none
 * SPEC          Clinical Framework §8; PRD S20-S23
 */

/**
 * @typedef {{id: string, tier: 0|1|2, en: string, ms: string}} Task
 * @type {Task[]}
 */
export const TASKS = Object.freeze([
  /* ---- Tier 0 · without getting up -------------------------------------- */
  { id: 'water',    tier: 0, en: 'Drink a few sips of water.',                 ms: 'Minum air sikit.' },
  { id: 'feet',     tier: 0, en: 'Put your feet flat on the floor for a bit.', ms: 'Letak kaki rata atas lantai sekejap.' },
  { id: 'light',    tier: 0, en: 'Let a bit of daylight in.',                  ms: 'Bagi cahaya masuk sikit.' },
  { id: 'position', tier: 0, en: 'Change position. Sit up, or lie down properly.', ms: 'Tukar posisi. Duduk, atau baring elok-elok.' },
  { id: 'shoulders',tier: 0, en: 'Roll your shoulders once, slowly.',          ms: 'Pusing bahu sekali, perlahan-lahan.' },
  { id: 'blanket',  tier: 0, en: 'Straighten the blanket around you.',         ms: 'Betulkan selimut sekeliling awak.' },

  /* ---- Tier 1 · up, but still inside ------------------------------------ */
  { id: 'face',     tier: 1, en: 'Wash your face.',                            ms: 'Basuh muka.' },
  { id: 'teeth',    tier: 1, en: 'Brush your teeth.',                          ms: 'Gosok gigi.' },
  { id: 'window',   tier: 1, en: 'Open a window.',                             ms: 'Buka tingkap.' },
  { id: 'drink',    tier: 1, en: 'Make a drink — kopi, teh, plain water, anything.', ms: 'Buat air — kopi, teh, air kosong, apa-apa je.' },
  { id: 'clothes',  tier: 1, en: 'Change into different clothes.',             ms: 'Tukar baju.' },
  { id: 'oneThing', tier: 1, en: 'Put one thing back where it belongs.',       ms: 'Letak satu benda balik ke tempatnya.' },
  { id: 'surface',  tier: 1, en: 'Clear one small surface.',                   ms: 'Kemas satu ruang kecil.' },
  { id: 'door',     tier: 1, en: 'Step outside the door for a minute.',        ms: 'Keluar depan pintu sekejap.' },

  /* ---- Tier 2 · a slightly bigger single step --------------------------- */
  { id: 'shower',   tier: 2, en: 'Go and take a shower.',                      ms: 'Pergi mandi.' },
  { id: 'walk',     tier: 2, en: 'Walk to the end of the road and back.',      ms: 'Jalan sampai hujung jalan, lepas tu balik.' },
  { id: 'message',  tier: 2, en: 'Message one person. Anything at all.',       ms: 'Mesej satu orang. Apa-apa pun boleh.' },
  { id: 'eat',      tier: 2, en: 'Heat something up and eat it.',              ms: 'Panaskan sesuatu, lepas tu makan.' },
  { id: 'dishes',   tier: 2, en: 'Wash the dishes that are there.',            ms: 'Basuh pinggan yang ada tu.' },
  { id: 'outside',  tier: 2, en: 'Sit outside for a while.',                   ms: 'Duduk luar sekejap.' },
  { id: 'song',     tier: 2, en: 'Put on one song and listen to the whole thing.', ms: 'Pasang satu lagu, dengar sampai habis.' },
  { id: 'sweep',    tier: 2, en: 'Sweep one room.',                            ms: 'Sapu satu bilik.' }
]);

/** Every task at one tier. */
export function tasksAtTier(tier) {
  return TASKS.filter((task) => task.tier === tier);
}

/** Look one up by id. */
export function taskById(id) {
  return TASKS.find((task) => task.id === id) || null;
}

/**
 * The task text in the active language.
 * @param {Task} task
 * @param {'en'|'ms'} lang
 */
export function taskText(task, lang) {
  if (!task) return '';
  return lang === 'ms' ? task.ms : task.en;
}

/**
 * Which tier a day starts at, given the check-in.
 *
 * THE MAPPING IS THE INTERVENTION.
 * A person who has said their day is very heavy is offered something they
 * could do without sitting up. A person who said it is light is offered a
 * shower or a walk. Offering the same task to both would fail one of them —
 * and it is always the same one it fails.
 *
 * @param {number|null} mood 1..5, or null when there has been no check-in
 * @returns {0|1|2}
 */
export function tierForMood(mood) {
  if (mood === null || mood === undefined) return 1;   // no check-in: the middle
  if (mood <= 1) return 0;
  if (mood <= 3) return 1;
  return 2;
}
