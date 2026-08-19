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
    offerBreathe: 'Bernafas dengan saya',
    offerSit: 'Duduk dengan saya sekejap',
    offerMika: 'Mika ada, kalau awak nak'
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
    intro: 'Tak ada apa-apa di sini yang perlukan awak pandai.',
    breatheTitle: 'Bernafas dengan saya',
    breatheBody: 'Satu bulatan untuk diikut. Ia mula di tempat awak, lepas tu perlahan sama-sama.',
    groundTitle: 'Kembali ke bilik ni',
    groundBody: 'Lima benda yang awak nampak, lepas tu empat yang awak boleh sentuh. Perlahan dan biasa je.',
    start: 'Mula'
  },

  calm: {
    title: 'Nafas',
    in: 'Masuk',
    hold: 'Tahan',
    out: 'Keluar',
    stop: 'Berhenti di sini',
    after: 'Awak dah buat sikit. Itu dikira.',
    help: 'Saya nak cakap dengan seseorang'
  },

  ground: {
    title: 'Kembali',
    step5: 'Lima benda yang awak boleh nampak.',
    step4: 'Empat benda yang awak boleh sentuh.',
    step3: 'Tiga benda yang awak boleh dengar.',
    step2: 'Dua benda yang awak boleh bau.',
    step1: 'Satu rasa dalam mulut awak.',
    next: 'Dah jumpa',
    nextOne: 'Dah jumpa',
    after: 'Awak dah kembali. Itu je yang penting.'
  },

  mika: {
    title: 'Mika',
    srPresence: 'Mika, teman kecil, ada bersama awak.',
    srGathering: 'Mika sedang kumpul apa yang awak tulis.',
    srHeld: 'Mika sedang pegang.',
    fieldLabel: 'Apa yang awak nak letak',

    yesPlease: 'Ya, boleh',
    justSit: 'Duduk sini je',
    holdThis: 'Biar Mika pegang',
    keepItMyself: 'Saya simpan sendiri',
    ratherNotWrite: 'Saya tak nak tulis',
    actuallyWrite: 'Sebenarnya, saya nak tulis',
    anotherStep: 'Nak satu langkah kecil lagi?',
    imFinished: 'Saya dah habis',
    stepBreathe: 'Bernafas',
    stepGround: 'Kembali ke bilik ni',
    keptYours: 'Itu milik awak. Saya tak simpan.',

    stayWithMe: 'Duduk dengan saya seminit?',
    notRightNow: 'Bukan sekarang',

    holdingTitle: 'Apa Mika pegang',
    openHolding: 'Apa Mika pegang',
    keepHolding: 'Biar Mika terus pegang',
    takeItBack: 'Saya ambil balik',
    tookBack: 'Ia milik awak semula.',
    holdAgain: 'Biar Mika pegang semula',
    letGo: 'Lepaskan sepenuhnya',
    letGoConfirm: 'Yang ini takkan kembali.',
    letGoYes: 'Ya, lepaskan',
    letGone: 'Baiklah. Ia dah tiada.',
    undo: 'Sebenarnya, tak jadi'
  },

  feelings: {
    title: 'Rasa',
    intro: 'Apa yang awak dah beritahu saya.',
    empty: 'Belum ada apa-apa lagi. Tak apa.',
    today: 'Hari ini',
    history: 'Hari demi hari'
  },

  body: {
    title: 'Sesuatu pada badan saya',
    intro: 'Pilih mana yang kena. Awak tak perlu terangkan.',
    standing:
      'Kalau ada benda yang baru, teruk, atau menakutkan awak, sila jumpa ' +
      'doktor. Aplikasi ni tak boleh beritahu apa puncanya.',
    note: 'Catat ini',
    notePlaceholder: 'Apa-apa lagi yang patut diingat. Ikut suka.',
    noted: 'Dah dicatat.',
    enough: 'Cukup untuk hari ni. Saya dah dapat apa yang awak beritahu.',
    open: 'Sesuatu pada badan saya',
    region: {
      chest: 'Dada dan pernafasan',
      head: 'Kepala',
      gut: 'Perut',
      body: 'Seluruh badan'
    }
  },

  report: {
    title: 'Untuk temujanji',
    open: 'Sesuatu untuk temujanji',
    generated: 'Dibuat pada',
    scope:
      'Ini apa yang seseorang taip dalam telefon, dengan tarikh ia ditaip. ' +
      'Ia dilapor sendiri. Ia bukan rekod perubatan, bukan diagnosis, bukan ' +
      'keputusan saringan, dan tidak disahkan. Sila tanya orangnya, jangan ' +
      'baca sendiri sahaja.',
    moodTitle: 'Hari demi hari',
    blankDays: 'Hari kosong memang kosong je.',
    daysRecorded: '{n} daripada {total} hari terakhir ada catatan.',
    bodyTitle: 'Apa yang badan rasa',
    bodyNone: 'Tiada catatan dalam tempoh ini.',
    didTitle: 'Perkara yang dibuat',
    didBreathing: '{n} sesi bernafas',
    didGrounding: '{n} sesi kembali ke bilik',
    didTasks: '{n} benda kecil disiapkan',
    notIncluded:
      'Apa yang ditulis secara peribadi tidak dimasukkan di sini, dengan ' +
      'sengaja. Sila tanya.',
    print: 'Cetak atau simpan sebagai PDF'
  },


  garden: {
    title: 'Taman',
    intro: 'Tiada apa-apa di sini yang hilang.',
    empty: 'Ini milik awak. Ia bermula bila awak mula.',
    grewFrom: 'Ia tumbuh daripada semua ni.',
    from: {
      'check-in': 'Awak beritahu macam mana rasa awak.',
      session: 'Awak perlahankan diri sekejap.',
      task: 'Awak buat satu benda kecil.',
      thought: 'Awak letak satu fikiran.'
    }
  },

  task: {
    heading: 'Satu benda kecil',
    did: 'Dah buat',
    doneTitle: 'Itu benda betul yang awak dah buat.',
    softened: 'Kalau macam tu, benda yang lebih kecil.',
    resting: 'Tak apa, tak payah hari ni. Itu pun okay.'
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
    off: 'Mati',
    name: 'Nama panggilan awak',
    namePlaceholder: 'Boleh biar kosong kalau nak',
    haptics: 'Getar sikit bila tekan',
    data: 'Data awak',
    openData: 'Buat salinan, atau padam semua',
    never: 'Aplikasi ni tak pernah hantar notifikasi dan tak pernah minta awak kembali.',
    version: 'Versi'
  },

  data: {
    title: 'Data awak',
    intro: 'Ia ada dalam telefon ni je, tak ada di tempat lain.',

    copyTitle: 'Buat salinan',
    copyBody: 'Satu fail yang awak boleh simpan, kalau telefon ni hilang.',
    copyContains: 'Fail ni ada semakan rasa awak, taman awak, apa yang awak buat, dan apa yang badan awak rasa.',
    includeWriting: 'Masukkan sekali apa yang Mika pegang',
    copyAction: 'Buat salinan',
    copyDone: 'Dah simpan dalam muat turun awak.',

    restoreTitle: 'Masukkan balik salinan',
    restoreBody: 'Pilih fail yang awak buat dulu.',
    restoreAction: 'Pilih fail',
    restoreSafe: 'Ini cuma tambah apa yang tiada. Apa yang dah ada tak diubah atau dibuang.',
    restoreDone: 'Dah masukkan balik {added} benda.',
    restoreBad: 'Saya tak dapat baca fail tu. Mungkin bukan fail saya.',
    restoreNewer: 'Fail tu daripada versi yang lebih baru daripada ini.',

    deleteTitle: 'Padam semua',
    deleteBody: 'Semua semakan rasa, semua yang Mika pegang, dan taman awak.',
    deleteAction: 'Padam semua',
    deleteConfirm: 'Ini tak boleh dibatalkan, dan tiada salinan di tempat lain.',
    deleteYes: 'Ya, padam semua'
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
