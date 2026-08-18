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
    offerSit: 'Sit with me a minute',
    /* Offered after a HEAVY check-in specifically — see today.view.js for why
       Very heavy gets the body first and Heavy gets Mika. */
    offerMika: 'Mika\'s here, if you want'
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

  /* Structural interface strings only. Everything Mika SAYS lives in
     core/content/mika-lines.js, paired with its Malay so the two can never
     drift apart. */
  mika: {
    title: 'Mika',
    srPresence: 'Mika, a small companion, is here with you.',
    srGathering: 'Mika is gathering what you wrote.',
    srHeld: 'Mika is holding it.',
    fieldLabel: 'What you want to set down',

    yesPlease: 'Yes, please',
    justSit: 'Just sit here',
    holdThis: 'Let Mika hold this',
    keepItMyself: 'Keep it myself',
    ratherNotWrite: 'I\'d rather not write',
    actuallyWrite: 'Actually, I\'ll write something',
    anotherStep: 'Would you like another small step?',
    imFinished: 'I\'m finished',
    stepBreathe: 'Breathe',
    stepGround: 'Come back to the room',
    keptYours: 'That\'s yours. I didn\'t keep it.',

    stayWithMe: 'Stay with me a minute?',
    notRightNow: 'Not right now',

    holdingTitle: 'What Mika is holding',
    openHolding: 'What Mika is holding',
    keepHolding: 'Mika can keep holding it',
    takeItBack: 'I\'ll take it back',
    tookBack: 'It\'s yours again.',
    holdAgain: 'Mika can hold it again',
    letGo: 'Let it go completely',
    letGoConfirm: 'This one won\'t come back.',
    letGoYes: 'Yes, let it go',
    letGone: 'Alright. It\'s gone.',
    undo: 'Actually, no'
  },

  feelings: {
    title: 'Feelings',
    intro: 'What you\'ve told me.',
    empty: 'Nothing here yet. That\'s allowed.',
    today: 'Today',
    history: 'Day by day'
  },

  /* ==========================================================================
     THE BODY LOG — the clinically riskiest copy in the app.
     The app NEVER says what a sensation is, NEVER reassures, and NEVER
     suggests a cause. The standing line appears on every state of the screen.
     Clinical Framework §10.
     ========================================================================== */
  body: {
    title: 'Something in my body',
    intro: 'Pick whatever fits. You don\'t have to explain it.',
    /* Not styled as a warning, and never dramatised. It is a fact that is
       always true, not an alert that has just fired. */
    standing:
      'If something is new, bad, or frightening you, please get it looked at ' +
      'by a doctor. This app can\'t tell you what it is.',
    note: 'Note this',
    notePlaceholder: 'Anything else worth remembering. Optional.',
    noted: 'Noted.',
    /* About the app, never about the person. */
    enough: 'That\'s enough for today. I\'ve got what you told me.',
    open: 'Something in my body',
    region: {
      chest: 'Chest and breathing',
      head: 'Head',
      gut: 'Stomach',
      body: 'All over'
    }
  },

  /* The one screen where counts are allowed — different audience, deliberate
     act, not ambient. See features/report/report.view.js. */
  report: {
    title: 'For an appointment',
    open: 'Something for an appointment',
    generated: 'Made on',
    scope:
      'This is what one person typed into a phone, with the dates they typed ' +
      'it. It is self-reported. It is not a medical record, not a diagnosis, ' +
      'not a screening result, and not validated. Please ask them about it ' +
      'rather than reading it alone.',
    moodTitle: 'Day by day',
    blankDays: 'Blank days are just blank.',
    daysRecorded: '{n} of the last {total} days have an entry.',
    bodyTitle: 'What the body noticed',
    bodyNone: 'Nothing recorded in this period.',
    didTitle: 'Things done',
    didBreathing: '{n} breathing sessions',
    didGrounding: '{n} grounding sessions',
    didTasks: '{n} small things finished',
    notIncluded:
      'What was written privately is not included here, on purpose. ' +
      'Please ask instead.',
    print: 'Print or save as PDF'
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
