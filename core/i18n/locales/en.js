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
    /* Same screen behind both. The wording is the intervention: after a heavy
       day an activity is one more demand, so the app asks for presence
       instead. Clinical Framework §8.2. */
    offerBreathe: 'Breathe with me',
    offerSit: 'Sit with me a minute'
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
    /* Many people believe they are bad at breathing exercises, usually
       because an app once set a pace they could not follow. */
    intro: 'Nothing here needs you to be good at it.',
    breatheTitle: 'Breathe with me',
    breatheBody: 'A circle to follow. It starts where you are and slows down with you.',
    groundTitle: 'Come back to the room',
    groundBody: 'Five things you can see, then four you can touch. Slow and ordinary.',
    start: 'Start'
  },

  /* NEVER "take a deep breath". It is the most common instruction given to a
     panicking person and one of the least helpful — effortful, often already
     being over-done, and a demand at the moment there is no capacity to meet
     one. These three words describe what the circle is doing. Nothing is
     asked. Clinical Framework §2.4. */
  calm: {
    title: 'Breathing',
    in: 'In',
    hold: 'Hold',
    out: 'Out',
    stop: 'Stop here',
    after: 'You did some. That counts.',
    help: 'I need to talk to someone'
  },

  ground: {
    title: 'Coming back',
    step5: 'Five things you can see.',
    step4: 'Four things you can touch.',
    step3: 'Three things you can hear.',
    step2: 'Two things you can smell.',
    step1: 'One thing you can taste.',
    /* Two labels, because the last step asks for ONE thing and "I've got
       them" is wrong there. A small grammatical wobble on the final prompt of
       a grounding exercise is exactly the kind of thing that pulls a person
       back out of the room. */
    next: 'I\'ve got them',
    nextOne: 'I\'ve got it',
    after: 'You came back. That\'s the whole thing.'
  },

  feelings: {
    title: 'Feelings',
    intro: 'What you\'ve told me.',
    empty: 'Nothing here yet. That\'s allowed.',
    today: 'Today'
  },

  /* The honest version of a progress screen. No total, no streak, no
     percentage, no goal. The dated list IS the evidence.
     Clinical Framework §9.3. */
  garden: {
    title: 'Garden',
    /* Printed before anyone scrolls. Everyone arrives at a screen like this
       expecting to be told what they have lost. */
    intro: 'Nothing here disappears.',
    empty: 'This is yours. It started when you did.',
    grewFrom: 'It grew from these.',
    from: {
      'check-in': 'You said how you were.',
      session: 'You slowed down for a bit.',
      task: 'You did one small thing.',
      thought: 'You put a thought down.'
    }
  },

  task: {
    heading: 'One small thing',
    did: 'I did it',
    doneTitle: 'That was a real thing.',
    /* Said when "not now" has just made the ask smaller. Names the change,
       never apologises for it, never nudges. */
    softened: 'Something smaller, then.',
    resting: 'Nothing today, then. That\'s allowed.'
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
