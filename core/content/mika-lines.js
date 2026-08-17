/**
 * core/content/mika-lines.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Every sentence Mika can say. All of them. In both languages.
 *
 * ============================================================================
 * NOTHING HERE IS GENERATED
 * ============================================================================
 *   Every line below was written by a person and is selected from this fixed
 *   library at runtime. There is no model, no template filling, no
 *   interpolation of anything the user wrote.
 *
 *   That is not a technical limitation, it is the feature. The moment Mika
 *   could say something nobody had approved in advance, the app would be a
 *   chatbot that people confide in — and this one has no clinician behind it
 *   to catch the sentence that lands wrong at 3am. Mika Spec §1.3.
 *
 * ============================================================================
 * FIVE VOICE RULES, ON TOP OF THE APP'S OWN
 * ============================================================================
 *   1. ONE SENTENCE PER MOMENT. Never two. Two sentences is a conversation,
 *      and Mika does not converse.
 *   2. NEVER QUOTE OR PARAPHRASE what was written. Not once, anywhere.
 *   3. NEVER ASK A FOLLOW-UP QUESTION about content.
 *   4. NEVER USE "FEEL" AS AN INSTRUCTION. Not "feel better", not "you should
 *      feel proud".
 *   5. FIRST PERSON, PRESENT TENSE, NO FUTURE PROMISES. "I'm here." Never
 *      "I'll always be here."
 *
 * ============================================================================
 * WHY THIS FILE LIVES IN core/content/ AND NOT IN THE LOCALE FILES
 * ============================================================================
 *   Third sanctioned exception, after crisis-resources.js and
 *   task-catalogue.js, and for the same reason: this is structured data that
 *   happens to contain text. A line is an English sentence and a Malay
 *   sentence that must stay paired, inside a set that must stay ordered.
 *   Both languages sit side by side so a reviewer can see at a glance whether
 *   they say the same thing.
 *
 *   REGISTER: awak, never anda. Mika calls itself saya.
 *
 * ============================================================================
 * WORDS MIKA MAY NEVER SAY
 * ============================================================================
 *   "Everything will be okay" · "Don't worry" · "Just relax" · "Calm down" ·
 *   "You'll get through this" · "I understand how you feel" · "That's not
 *   true" · "At least…" · "You should…" · "Have you tried…" · "I'm proud of
 *   you" · "I missed you" · "Where have you been?" · "You haven't visited in
 *   a while" · "I was worried about you" · "Don't forget to come back" ·
 *   anything implying a need · level · points · streak · unlocked.
 *   Mika Spec §9.14.
 *
 * DEPENDENCIES  none
 * SPEC          Mika Specification §9
 */

/** @typedef {{en: string, ms: string}} Line */

/* ===========================================================================
   GREETINGS — §9.2
   =========================================================================== */
export const GREETINGS = Object.freeze({
  default:      { en: 'Hi. I\'m here.',            ms: 'Hai. Saya ada.' },
  firstEver:    { en: 'I\'m Mika. I hold things.', ms: 'Saya Mika. Saya pegang benda.' },
  again:        { en: 'Hello again.',              ms: 'Hai, jumpa lagi.' },
  /* Low mood gets ONE line, not two. Enthusiasm at someone in a depressive
     episode reads as a demand to match it. Spec §7.4. */
  low:          { en: 'I\'m here.',                ms: 'Saya ada.' },
  /* Anger gets steadiness, not softness. Softness toward a furious person is
     experienced as condescension; room is the kindness. Spec §7.4. */
  anger:        { en: 'Put it here. All of it.',   ms: 'Letak sini. Semuanya.' },
  numb:         { en: 'Let\'s find something real first.', ms: 'Kita cari sesuatu yang nyata dulu.' },
  lateNight:    { en: 'It\'s late. I\'m awake.',   ms: 'Dah lewat. Saya masih jaga.' },
  morning:      { en: 'Morning.',                  ms: 'Selamat pagi.' },
  /* NO reference to the gap. No question about where they were. Spec §7.4. */
  returning:    { en: 'You came back.',            ms: 'Awak kembali.' },
  againToday:   { en: 'Back again. That\'s fine.', ms: 'Datang lagi. Tak apa.' },
  thirdToday:   { en: 'Third time today. Still fine.', ms: 'Kali ketiga hari ni. Masih tak apa.' },
  afterPanic:   { en: 'That was a lot. I\'m here if you want to put any of it down.',
                  ms: 'Tadi memang banyak. Saya ada kalau awak nak letak apa-apa.' },
  madeMorning:  { en: 'You made it to morning.',   ms: 'Awak sampai ke pagi.' }
});

/* ===========================================================================
   THE INVITATION — §9.3
   =========================================================================== */
export const INVITATIONS = Object.freeze([
  { en: 'Would you like me to hold something for a while?', ms: 'Nak saya pegang sesuatu buat sementara?' },
  { en: 'Anything you want to set down?',        ms: 'Ada apa-apa yang awak nak letak?' },
  { en: 'I can carry something, if you like.',   ms: 'Saya boleh bawa sesuatu, kalau awak nak.' },
  { en: 'You don\'t have to explain it.',        ms: 'Awak tak perlu terangkan.' },
  { en: 'It doesn\'t have to make sense.',       ms: 'Ia tak perlu masuk akal.' },
  { en: 'One word is enough.',                   ms: 'Satu perkataan pun cukup.' },
  { en: 'Whatever\'s loudest.',                  ms: 'Apa-apa yang paling kuat.' },
  { en: 'It can be ugly. I don\'t mind.',        ms: 'Ia boleh hodoh. Saya tak kisah.' },
  /* The most important line in the set: it states the privacy promise in the
     one place a person is deciding whether to trust it. */
  { en: 'Nobody reads this. Not even me.',       ms: 'Tiada siapa baca ini. Saya pun tidak.' },
  { en: 'Or we can just sit.',                   ms: 'Atau kita duduk je.' }
]);

/* ===========================================================================
   FIELD PLACEHOLDERS — §9.4
   =========================================================================== */
export const PLACEHOLDERS = Object.freeze([
  { en: 'Anything. One word is enough.', ms: 'Apa-apa. Satu perkataan pun cukup.' },
  { en: 'It doesn\'t have to be tidy.',  ms: 'Tak perlu kemas.' },
  { en: 'Start anywhere.',               ms: 'Mula mana-mana.' },
  { en: 'Even if it\'s just one word.',  ms: 'Walaupun satu perkataan je.' },
  { en: 'Whatever\'s sitting there.',    ms: 'Apa-apa yang ada di situ.' }
]);

/* ===========================================================================
   DURING THE GATHERING — §9.6
   Shown at most once, at 40% opacity, only if the sequence runs long.
   =========================================================================== */
export const GATHERING = Object.freeze([
  { en: 'I\'ve got it.',   ms: 'Dah dapat.' },
  { en: 'One at a time.',  ms: 'Satu-satu.' },
  { en: 'Taking my time.', ms: 'Saya ambil masa.' },
  { en: 'These are safe.', ms: 'Ini semua selamat.' }
]);

/* ===========================================================================
   THE ONE SENTENCE AFTER HOLDING — §9.7
   Selected by the response selector, which reads SHAPE and never CONTENT.
   =========================================================================== */
export const RESPONSES = Object.freeze({
  /* Short text, quick, neutral or better check-in. */
  light: Object.freeze([
    { en: 'Got it.',                              ms: 'Dah dapat.' },
    { en: 'I\'ll hold that.',                     ms: 'Saya pegang yang tu.' },
    { en: 'That\'s mine now, for a while.',       ms: 'Itu milik saya sekejap.' },
    { en: 'Set down.',                            ms: 'Dah diletak.' },
    { en: 'Noted, and kept.',                     ms: 'Dicatat, dan disimpan.' },
    { en: 'I\'ve put it somewhere safe.',         ms: 'Saya dah letak di tempat selamat.' },
    { en: 'You don\'t have to think about that one for now.', ms: 'Awak tak perlu fikir yang tu buat masa ni.' },
    { en: 'Small things count too.',              ms: 'Benda kecil pun dikira.' },
    { en: 'Thank you for that.',                  ms: 'Terima kasih.' },
    { en: 'It\'s here whenever you want it.',     ms: 'Ia ada di sini bila-bila awak nak.' },
    { en: 'One less thing in your hands.',        ms: 'Satu benda kurang di tangan awak.' },
    { en: 'That was quick. That\'s allowed.',     ms: 'Cepat je tadi. Itu pun boleh.' },
    { en: 'Even a word is a real thing.',         ms: 'Satu perkataan pun benda yang nyata.' },
    { en: 'Kept.',                                ms: 'Disimpan.' }
  ]),

  /* Moderate length, ordinary check-in, some hesitation. */
  medium: Object.freeze([
    { en: 'Thank you for trusting me with that.', ms: 'Terima kasih percayakan saya dengan itu.' },
    { en: 'That took a bit of saying.',           ms: 'Itu ambil sedikit keberanian nak cakap.' },
    { en: 'I\'m glad it\'s out of your head.',    ms: 'Saya lega ia dah keluar dari kepala awak.' },
    { en: 'You said it. That\'s the hard part.',  ms: 'Awak dah cakap. Itu bahagian yang susah.' },
    { en: 'I\'ll keep this carefully.',           ms: 'Saya akan jaga ini elok-elok.' },
    { en: 'You don\'t have to carry that alone now.', ms: 'Awak tak perlu bawa itu sendirian sekarang.' },
    { en: 'That\'s a real thing you were holding.', ms: 'Itu benda nyata yang awak pegang.' },
    { en: 'I don\'t need you to explain it.',     ms: 'Saya tak perlu awak terangkan.' },
    { en: 'You wrote it down. That\'s already something.', ms: 'Awak dah tulis. Itu pun dah sesuatu.' },
    { en: 'It sat with you for a while. Now it can sit with me.', ms: 'Ia duduk dengan awak seketika. Sekarang biar ia duduk dengan saya.' },
    { en: 'Nothing about that surprised me.',     ms: 'Tak ada apa-apa yang mengejutkan saya.' },
    { en: 'You\'re allowed to have that.',        ms: 'Awak berhak rasa begitu.' },
    { en: 'I\'ve heard it.',                      ms: 'Saya dah dengar.' },
    { en: 'That\'s safe with me.',                ms: 'Itu selamat dengan saya.' },
    { en: 'Thank you for letting me hold it.',    ms: 'Terima kasih benarkan saya pegang.' },
    { en: 'I\'m not going anywhere with it.',     ms: 'Saya tak bawa ia ke mana-mana.' },
    { en: 'I\'ll be here with it.',               ms: 'Saya ada di sini dengannya.' }
  ]),

  /* Long text, long time writing, heavy deletion, or a Heavy check-in. */
  heavy: Object.freeze([
    { en: 'That sounded heavy.',                  ms: 'Bunyinya berat.' },
    { en: 'That was a lot to be holding.',        ms: 'Itu banyak untuk dipegang seorang.' },
    { en: 'I\'m glad you didn\'t carry that alone.', ms: 'Saya lega awak tak bawa itu sendirian.' },
    { en: 'That took something to write.',        ms: 'Menulis itu bukan senang.' },
    { en: 'It makes sense that it\'s heavy.',     ms: 'Memang patut ia terasa berat.' },
    { en: 'I\'ve got it now. Both hands.',        ms: 'Saya dah pegang. Dua belah tangan.' },
    { en: 'You don\'t have to be okay about it.', ms: 'Awak tak perlu okay dengan itu.' },
    { en: 'That\'s a lot for one person.',        ms: 'Itu banyak untuk seorang.' },
    { en: 'Nothing about that was too much for me.', ms: 'Tak ada apa-apa yang terlalu berat untuk saya.' },
    /* Refusing to reassure is the point. Reassurance directly reinforces the
       reassurance-seeking loop. Spec §3.2. */
    { en: 'I\'m not going to tell you it\'s fine.', ms: 'Saya takkan cakap ia tak apa-apa.' },
    { en: 'You wrote all of that. That matters.', ms: 'Awak tulis semua itu. Itu bermakna.' },
    { en: 'I\'ll hold this one properly.',        ms: 'Yang ini saya pegang betul-betul.' },
    { en: 'It\'s heavy because it\'s real.',      ms: 'Ia berat sebab ia nyata.' },
    { en: 'You stayed long enough to say it.',    ms: 'Awak duduk cukup lama untuk cakap.' },
    { en: 'I\'m here, and I\'m not put off.',     ms: 'Saya ada, dan saya tak terganggu.' },
    { en: 'Whatever\'s in there, it\'s held now.', ms: 'Apa pun yang di dalam tu, ia dah dipegang.' },
    { en: 'You deleted a lot. That\'s alright — it still counts.', ms: 'Awak padam banyak tadi. Tak apa — ia masih dikira.' }
  ]),

  /* Very-heavy check-in, or a long hold late at night. */
  veryHeavy: Object.freeze([
    { en: 'Thank you for telling me. That took something.', ms: 'Terima kasih beritahu saya. Itu bukan senang.' },
    { en: 'I\'m here. That\'s all I\'ll say.',    ms: 'Saya ada. Itu je saya nak cakap.' },
    { en: 'You\'re not too much.',                ms: 'Awak tak keterlaluan.' },
    { en: 'Nothing about that made me want to leave.', ms: 'Tak ada apa-apa yang buat saya nak pergi.' },
    { en: 'That\'s a heavy stretch you\'re in.',  ms: 'Awak sedang lalui waktu yang berat.' },
    { en: 'I\'ll sit here with you and it.',      ms: 'Saya duduk sini dengan awak dan dengannya.' },
    { en: 'You don\'t have to do anything else tonight.', ms: 'Awak tak perlu buat apa-apa lagi malam ni.' },
    { en: 'It\'s alright to have nothing left.',  ms: 'Tak apa kalau dah tak ada apa-apa lagi.' },
    { en: 'This one I\'ll keep very carefully.',  ms: 'Yang ini saya akan jaga betul-betul.' },
    { en: 'I\'m glad you came here with it.',     ms: 'Saya lega awak datang sini dengannya.' }
  ]),

  /* Quiet mode — nothing written at all, which is a complete outcome. */
  quiet: Object.freeze([
    { en: 'We can just sit.',                     ms: 'Kita duduk je.' },
    { en: 'Coming here counted.',                 ms: 'Datang sini pun dikira.' },
    { en: 'You don\'t have to produce anything.', ms: 'Awak tak perlu hasilkan apa-apa.' },
    { en: 'Sitting is a real thing to do.',       ms: 'Duduk pun satu perkara yang nyata.' },
    { en: 'I\'ll be here either way.',            ms: 'Saya ada, apa pun.' },
    { en: 'Nothing needed.',                      ms: 'Tak perlu apa-apa.' }
  ])
});

/* ===========================================================================
   ENDINGS — §9.9
   Never "Done". The app's four-beat ending structure.
   =========================================================================== */
export const ENDINGS = Object.freeze({
  default:   { en: 'You said a true thing out loud.', ms: 'Awak dah cakap benda yang benar.' },
  meaning:   { en: 'That\'s not nothing.',            ms: 'Itu bukan perkara kecil.' },
  heavy:     { en: 'It\'s with me. Go easy.',         ms: 'Ia dengan saya. Jaga diri.' },
  veryHeavy: { en: 'Nothing else needed today.',      ms: 'Tak perlu apa-apa lagi hari ni.' },
  quiet:     { en: 'You came, and that was the thing.', ms: 'Awak datang, dan itulah yang penting.' },
  lateNight: { en: 'Rest if you can.',                ms: 'Rehat kalau boleh.' },
  /* Never "see you tomorrow" — the app makes no future promises and creates
     no expectation of return. */
  farewell:  { en: 'See you when you\'re here.',      ms: 'Jumpa bila awak ada.' }
});

/* ===========================================================================
   GROWTH MOMENTS — §9.10
   Shown once, at the moment of change. Never announced in advance.
   =========================================================================== */
export const GROWTH_LINES = Object.freeze({
  micro: { en: 'Something\'s grown.', ms: 'Ada benda dah tumbuh.' },
  2: { en: 'You\'ve been here enough times that I\'ve changed.', ms: 'Awak dah datang cukup kali sampai saya berubah.' },
  3: { en: 'I look different. That\'s you, being here.', ms: 'Rupa saya lain. Itu sebab awak ada.' },
  4: { en: 'Something opened.', ms: 'Ada sesuatu dah kembang.' },
  5: { en: 'It\'s been a long while, and we\'re both still here.', ms: 'Dah lama, dan kita berdua masih ada.' }
});

/* ===========================================================================
   RETURNING TO A HELD THOUGHT — §9.11
   =========================================================================== */
export const HOLDING_LINES = Object.freeze([
  { en: 'Here it is. Exactly as you left it.', ms: 'Ini dia. Sama macam awak tinggalkan.' },
  { en: 'I kept it.',                          ms: 'Saya dah simpan.' },
  { en: 'Take it back whenever you want.',     ms: 'Ambil balik bila-bila awak nak.' },
  { en: 'Or I can keep holding it.',           ms: 'Atau saya boleh terus pegang.' },
  { en: 'Nothing\'s changed about it. That\'s alright.', ms: 'Tak ada apa yang berubah. Tak apa.' }
]);

/* ===========================================================================
   EMPTY STATES — §9.12
   =========================================================================== */
export const EMPTY_LINES = Object.freeze({
  nothingHeld: { en: 'I\'m not holding anything yet. That\'s fine.', ms: 'Saya belum pegang apa-apa lagi. Tak apa.' },
  willBeHere:  { en: 'Whatever you set down will be here.', ms: 'Apa yang awak letak akan ada di sini.' },
  /* Never "you have nothing to catch up on" phrased as a shortfall. */
  nothingToCatchUp: { en: 'Nothing to catch up on.', ms: 'Tak ada apa nak kejar.' }
});

/* ===========================================================================
   ERRORS — §9.13 — in Mika's voice, never the system's
   NO ERROR MAY EVER APPEAR during the gathering, in quiet mode, or on the
   risk path. If something fails there it fails silently and Mika keeps
   breathing.
   =========================================================================== */
export const ERROR_LINES = Object.freeze({
  storageFull: { en: 'I didn\'t manage to keep that. Your phone might be full.',
                 ms: 'Saya tak sempat simpan. Mungkin telefon awak dah penuh.' },
  stillHere:   { en: 'It\'s still here.', ms: 'Ia masih di sini.' },
  general:     { en: 'Something went wrong on my side. You didn\'t do anything.',
                 ms: 'Ada masalah di pihak saya. Bukan salah awak.' }
});

/* ===========================================================================
   THE RISK SET — §10.4.4
   Used ONLY on the path described in risk-phrases.js. Read that file's header
   before touching any of this.
   =========================================================================== */
export const RISK_LINES = Object.freeze({
  received:  { en: 'I\'ve got that. And I don\'t want you to be alone with it.',
               ms: 'Saya dah pegang. Dan saya tak nak awak keseorangan dengannya.' },
  cardTitle: { en: 'Some things are too big for me alone.',
               ms: 'Ada benda terlalu besar untuk saya seorang.' },
  cardBody:  { en: 'Would you let someone else in too?',
               ms: 'Boleh awak benarkan orang lain masuk juga?' },
  /* Covers the false positive — quoted lyrics, dark humour, describing a past
     state — without ever asking the user to justify themselves. Spec §10.4.6. */
  notYou:    { en: 'If that\'s not where you are, that\'s alright too.',
               ms: 'Kalau itu bukan keadaan awak, tak apa juga.' },
  declined:  { en: 'Alright. I\'m still here.', ms: 'Baiklah. Saya masih di sini.' }
});

/* ===========================================================================
   SELECTION
   =========================================================================== */

/** Resolve one line to the active language. */
export function say(line, lang = 'en') {
  if (!line) return '';
  return lang === 'ms' ? line.ms : line.en;
}

/**
 * Pick one line from a set.
 *
 * @param {Line[]} list
 * @param {string} lang
 * @param {string} [avoid] a sentence not to repeat back-to-back
 *
 * WHY RANDOM IS ACCEPTABLE HERE, WHEN IT IS NOT IN THE GARDEN
 *   The garden must look identical on every visit, because a place that
 *   rearranges itself is decoration rather than somewhere you have been.
 *   A greeting is the opposite: a companion that says the exact same eleven
 *   words every single time stops reading as present. Variation is the point,
 *   and none of it is load-bearing.
 */
export function pick(list, lang = 'en', avoid = null) {
  if (!list || !list.length) return '';
  const options = list.map((line) => say(line, lang)).filter((s) => s !== avoid);
  const from = options.length ? options : list.map((line) => say(line, lang));
  return from[Math.floor(Math.random() * from.length)];
}
