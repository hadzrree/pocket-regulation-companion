/**
 * core/i18n/locales/en.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Every English UI string.
 *
 * COPY RULES (Clinical Framework §13, PRD §14)
 *   - Warm, not cheerful. Honest, not positive. Brief, not curt.
 *   - NEVER: should, must, need to, don't forget, remember to, make sure
 *   - NEVER: failed, missed, streak, overdue, inactive
 *   - NEVER: don't worry, calm down, relax, it's just anxiety
 *   - NEVER: any clinical word — symptom, severity, disorder, score
 *   - No activity ever ends with "Done".
 *
 * Every key added here MUST be added to ms.js in the same commit.
 */

export const en = {
  app: {
    name: 'Pocket Regulation Companion',
    short: 'Pocket'
  },

  nav: {
    today: 'Today',
    regulate: 'Breathe',
    feelings: 'Feelings',
    garden: 'Garden',
    me: 'Me',
    label: 'Main'
  },

  a11y: {
    skipToContent: 'Skip to content',
    getHelpNow: 'Get help now',
    liveRegion: 'Announcements'
  },

  greeting: {
    morning: 'Good morning.',
    afternoon: 'Afternoon.',
    evening: 'Evening.',
    lateNight: "It's late. I'm here.",
    morningAfterHard: 'You made it to morning.',
    returning: 'You came back.',
    againToday: 'Back again. That\'s fine.'
  },

  today: {
    subtitle: 'One small thing is enough today.',
    placeholder: 'Your day starts here.',
    seeFeelings: 'See what you\'ve told me'
  },

  /* The five faces. WORDS, NEVER NUMBERS — a score invites comparison,
     targets, and the feeling of failing. A description does not.
     Clinical Framework §12.4. */
  mood: {
    veryHeavy: 'Very heavy',
    heavy: 'Heavy',
    okay: 'Okay',
    good: 'Good',
    light: 'Light'
  },

  checkin: {
    question: 'How are you, right now?',
    saved: 'Noted. Thank you.',
    changed: 'Changed.',
    /* The response lowers what it asks for as the mood falls. At the bottom
       of the scale the app asks for nothing at all. UX Strategy §5.1. */
    response: {
      1: 'Thank you for telling me. Today can be very small.',
      2: 'That sounds heavy. Nothing big today.',
      3: 'Okay is a real answer.',
      4: 'I\'m glad it\'s a bit lighter.',
      5: 'That\'s worth noticing.'
    }
  },

  /* Offered, never imposed. The app shows numbers; the person decides.
     It never dials, never alerts anyone, never contacts a clinician.
     Clinical Framework §6.4. */
  crisis: {
    cardTitle: 'Someone can pick up',
    cardBody:
      'If today is more than you can hold, there are people who answer the ' +
      'phone at any hour. You don\'t have to be in danger to call.',
    open: 'See the numbers',
    title: 'People who answer',
    intro: 'Free, any hour. You choose who to call.',
    call: 'Call'
  },

  regulate: {
    title: 'Breathe',
    intro: 'Slow the out-breath a little. That\'s all this is.',
    comingSoon: 'The breathing pacer arrives in Module 3.'
  },

  feelings: {
    title: 'Feelings',
    intro: 'What you\'ve told me.',
    empty: 'Nothing here yet. That\'s allowed.',
    today: 'Today'
  },

  garden: {
    title: 'Garden',
    empty: 'This is yours. It started when you did.',
    comingSoon: 'Your garden starts growing in Module 4.'
  },

  me: {
    title: 'Me',
    appearance: 'Appearance',
    theme: 'Theme',
    themeAuto: 'Match my phone',
    themeLight: 'Light',
    themeDark: 'Night',
    textSize: 'Text size',
    contrast: 'Higher contrast',
    motion: 'Reduce movement',
    language: 'Language',
    about: 'About',
    on: 'On',
    off: 'Off'
  },

  scope: {
    statement:
      "This is a companion, not a doctor. It doesn't diagnose anything, " +
      'nobody is watching what you write, and it can\'t replace seeing someone. ' +
      'If something feels wrong with your body or you\'re in danger, please get real help.'
  },

  common: {
    close: 'Close',
    back: 'Take me back',
    notNow: 'Not now',
    okay: 'Okay',
    ready: "I'm ready",
    stay: 'Stay a moment',
    finish: 'Finish here',
    stopping: 'Stopping is fine. You did some.'
  },

  errors: {
    'storage-full': "I couldn't save that just now. Your phone's storage might be full.",
    'general': "Something went wrong on my side. You didn't do anything.",
    'dial-failed': "The call didn't start. Here's the number."
  },

  update: {
    installed: 'I updated in the background. Nothing was lost.'
  }
};
