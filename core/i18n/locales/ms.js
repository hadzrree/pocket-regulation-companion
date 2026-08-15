/**
 * core/i18n/locales/ms.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Every Bahasa Malaysia UI string.
 *
 * REGISTER — READ THIS BEFORE EDITING
 *   Use "awak", NEVER "anda".
 *   "Anda" is the register of banks, government forms and corporate notices.
 *   "Awak" is the register of a friend. The whole emotional premise of the
 *   product rests on this choice. Clinical Framework §13.4.
 *
 *   Everyday spoken BM with natural particles — je, pun, dulu, ya.
 *   Code-switching where a Malaysian actually would.
 *   No clinical terms: no "kemurungan klinikal", no "gangguan kecemasan".
 *
 * REVIEW GATE
 *   Every string here is reviewed by a native speaker before release, and
 *   ideally by real users, not only a translator. Clinical Framework
 *   Appendix A.
 */

export const ms = {
  app: {
    name: 'Pocket Regulation Companion',
    short: 'Pocket'
  },

  nav: {
    today: 'Hari Ini',
    regulate: 'Nafas',
    feelings: 'Rasa',
    garden: 'Taman',
    me: 'Saya',
    label: 'Utama'
  },

  a11y: {
    skipToContent: 'Terus ke kandungan',
    getHelpNow: 'Dapatkan bantuan sekarang',
    liveRegion: 'Pengumuman'
  },

  greeting: {
    morning: 'Selamat pagi.',
    afternoon: 'Selamat petang.',
    evening: 'Selamat malam.',
    lateNight: 'Dah lewat. Saya ada.',
    morningAfterHard: 'Awak sampai ke pagi.',
    returning: 'Awak kembali.',
    againToday: 'Datang lagi. Tak apa.'
  },

  today: {
    subtitle: 'Satu benda kecil pun cukup hari ni.',
    placeholder: 'Hari awak bermula di sini.',
    seeFeelings: 'Tengok apa awak dah beritahu'
  },

  /* Perkataan, bukan nombor. Skor mengundang perbandingan dan rasa gagal. */
  mood: {
    veryHeavy: 'Berat sangat',
    heavy: 'Berat',
    okay: 'Okay',
    good: 'Baik',
    light: 'Ringan'
  },

  checkin: {
    question: 'Macam mana rasa awak sekarang?',
    saved: 'Dah dicatat. Terima kasih.',
    changed: 'Dah tukar.',
    response: {
      1: 'Terima kasih sebab beritahu saya. Hari ni boleh jadi kecil je.',
      2: 'Bunyi macam berat. Tak payah buat benda besar hari ni.',
      3: 'Okay pun satu jawapan yang betul.',
      4: 'Saya lega sikit dah ringan.',
      5: 'Itu patut diperasan.'
    }
  },

  crisis: {
    cardTitle: 'Ada orang boleh jawab',
    cardBody:
      'Kalau hari ni terlalu berat untuk awak tanggung, ada orang yang jawab ' +
      'telefon bila-bila masa. Awak tak perlu dalam bahaya untuk telefon.',
    open: 'Lihat nombor',
    title: 'Orang yang menjawab',
    intro: 'Percuma, bila-bila masa. Awak pilih siapa nak telefon.',
    call: 'Telefon'
  },

  regulate: {
    title: 'Nafas',
    intro: 'Hembus sikit lebih panjang. Itu je.',
    comingSoon: 'Pemandu nafas akan datang dalam Modul 3.'
  },

  feelings: {
    title: 'Rasa',
    intro: 'Apa yang awak dah beritahu saya.',
    empty: 'Belum ada apa-apa lagi. Tak apa.',
    today: 'Hari ini'
  },

  garden: {
    title: 'Taman',
    empty: 'Ini milik awak. Ia bermula bila awak mula.',
    comingSoon: 'Taman awak mula tumbuh dalam Modul 4.'
  },

  me: {
    title: 'Saya',
    appearance: 'Paparan',
    theme: 'Tema',
    themeAuto: 'Ikut telefon saya',
    themeLight: 'Cerah',
    themeDark: 'Malam',
    textSize: 'Saiz teks',
    contrast: 'Kontras lebih tinggi',
    motion: 'Kurangkan pergerakan',
    language: 'Bahasa',
    about: 'Tentang',
    on: 'Hidup',
    off: 'Mati'
  },

  scope: {
    statement:
      'Ini teman, bukan doktor. Ia tidak mendiagnos apa-apa, ' +
      'tiada sesiapa memerhati apa yang awak tulis, dan ia tidak boleh ' +
      'gantikan jumpa seseorang. Kalau badan awak rasa tak kena atau awak ' +
      'dalam bahaya, sila dapatkan bantuan sebenar.'
  },

  common: {
    close: 'Tutup',
    back: 'Bawa saya balik',
    notNow: 'Bukan sekarang',
    okay: 'Okay',
    ready: 'Saya dah sedia',
    stay: 'Duduk sekejap',
    finish: 'Habis di sini',
    stopping: 'Berhenti pun tak apa. Awak dah buat sikit.'
  },

  errors: {
    'storage-full': 'Saya tak dapat simpan tadi. Mungkin storan telefon dah penuh.',
    'general': 'Ada masalah di pihak saya. Bukan salah awak.',
    'dial-failed': 'Panggilan tak berjaya. Ini nombornya.'
  },

  update: {
    installed: 'Saya dikemas kini di latar. Tiada apa yang hilang.'
  }
};
