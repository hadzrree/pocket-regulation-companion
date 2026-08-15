# Module 3 — Breathing, Grounding, and Calm Mode

**Status:** complete · **Version:** 1.2.0 · **Date:** 15 August 2026
**Verification:** 40 of 40 automated checks passing

---

## 0 · Overview

Module 2 gave the app a memory. Module 3 gives it something to *do* in the
moment a person actually opens it — the screen for 3am, the screen for the
car park before a shift, the screen for when the room has stopped feeling
real.

### What is now live

| Area | What shipped |
|---|---|
| **Breathe tab** | Two practices. Not a library. |
| **Calm Mode** | The paced breathing circle, full screen, nav hidden |
| **Grounding** | 5-4-3-2-1, one prompt at a time, no timer, no typing |
| **Help screen** | A real route to the crisis numbers, reachable from panic |
| **Storage** | `sessions` store (migration v2) and the session repository |
| **Today zone 4** | The one primary button, its label following the check-in |
| **Refactor** | `CrisisList` extracted — one component, three callers |

### The three decisions that shaped this module

**1 · The circle starts fast and slows down.**
Nearly every breathing app opens at its target pace. For a calm person that
is pleasant; for a person breathing short and fast it is a rhythm they cannot
reach. They fall behind, and falling behind at *breathing* becomes evidence
they cannot do things properly. This circle starts at a 5.5 second cycle —
close to where anxious breathing already is — and lengthens by 0.9s each
cycle until it reaches 12 seconds. The user is followed first, then led.

**2 · The app never says "take a deep breath".**
It is the most common instruction given to a panicking person and one of the
least helpful: effortful, often already being over-done, and a demand at the
moment there is no capacity to meet one. The circle shows **In**, **Hold**,
**Out** — descriptions of what the shape is doing. Nothing is asked.

**3 · A session is a session.**
Three breaths counts. There is no minimum, no target, and — deliberately —
no `completed` field anywhere in the record. The moment that field exists,
the category of an *incomplete* session exists, and sooner or later something
in the interface displays it. The safest way to guarantee the app never tells
someone they failed at breathing is to store nothing that could be read that
way.

---

## 1 · Folder structure

New files marked **NEW**.

```
prc-app/
├── sw.js                              CACHE bumped to prc-v1.2.0-module3
├── app/routes.js                      three distress routes added
│
├── core/
│   ├── components/
│   │   ├── BreathingCircle.js    NEW  the pacer
│   │   └── CrisisList.js         NEW  extracted from checkin.js
│   └── storage/
│       ├── migrations.js              v2 — the sessions store
│       └── repositories/
│           └── session.repo.js   NEW
│
├── features/
│   ├── panic/calm.view.js        NEW  Calm Mode
│   ├── ground/ground.view.js     NEW  5-4-3-2-1
│   ├── crisis/crisis.view.js     NEW  the help screen
│   ├── regulate/regulate.view.js      rewritten — two practices
│   ├── today/today.view.js            zone 4 is now live
│   └── checkin/checkin.js             now uses CrisisList
│
└── styles/
    ├── 03-components/
    │   ├── breathing-circle.css  NEW
    │   └── crisis-list.css       NEW  moved out of checkin.css
    └── 04-features/
        ├── practice.css          NEW  all three distress screens
        ├── today.css                  zone 4
        └── checkin.css                crisis list rules removed
```

---

## 2 · HTML

**No change to `index.html` in this module.** Everything is built in
JavaScript through `el()`, which inserts strings as text nodes only.

The CSP hash on the inline theme script is untouched, so the Module 2 hazard
does not apply to this update: `sha256-Mr9yNWtoJI3dbJ1qHbxrjFxjpTtBKHuUTPhVsgojsNo=`
is still correct. Do not edit that script.

---

## 3 · CSS

| File | Layer | Why there |
|---|---|---|
| `breathing-circle.css` | 03 | used by Calm Mode, and by Module 5's companion |
| `crisis-list.css` | 03 | three callers already, a fourth in Module 7 |
| `practice.css` | 04 | layout for the three distress screens only |

### The layout rule for distress screens

One thing in the middle, the way out at the bottom, nothing else. The stage
takes all remaining height and centres its contents; the foot is pinned to
the thumb zone. **The exit is in the same place on all three screens and does
not move when the content above it changes height.** A control that moves is
a control that has to be found again, and finding things is expensive in the
states these screens exist for.

### There are no `@keyframes` for the circle

The pace changes every cycle, so durations come from JavaScript through the
Web Animations API. Only `transform` and `opacity` are animated — the two
properties a browser composites without touching layout or paint. A stutter
here is not cosmetic: it breaks the rhythm the person is entraining to.

---

## 4 · JavaScript

### The pace ramp

| Cycle | Total | In | Hold | Out |
|---|---|---|---|---|
| 1 | 5.5s | 1.8s | 0.9s | 2.8s |
| 3 | 7.3s | 2.4s | 1.2s | 3.7s |
| 5 | 9.1s | 3.0s | 1.5s | 4.6s |
| 8+ | 12.0s | 4.0s | 2.0s | 6.0s |

The proportions stay constant (4 : 2 : 6) as the cycle lengthens. The out-
breath is always longer than the in-breath — that is the common feature of
the paced-breathing protocols that show an effect, at roughly five breaths a
minute.

**The app does not explain why it works, and neither does the code beyond
that.** Mechanistic claims about the vagus nerve are widespread in wellbeing
apps and are not currently well supported; a 2026 review by a large group of
autonomic researchers found the popular framing untenable. The practice is
kept, the mechanism story is not told. Telling someone a confident
physiological story that later turns out to be wrong costs trust this app
cannot afford. *Clinical Framework §2.8.*

### What `distress: true` actually does

All three new routes carry it. It sets `inDistressFlow` in the store, which:

- silences the global error handler
- makes `Toast.show()` return `false` without rendering
- suppresses the install prompt
- stops a waiting service worker from activating

**While a person is on one of these screens, the app makes no announcements
of its own, for any reason.** This is verified automatically: the test suite
imports the toast module inside Calm Mode, calls `show()`, and asserts that
it is refused and that nothing appears in the DOM.

### Calm Mode has no start button

The circle is already moving when the screen opens. A start button seems
considerate but it is one more decision at the moment decision-making is
hardest, and it makes the app ask for something before it gives anything.
Someone who opened it by accident loses nothing — the exit is the largest
control on screen.

### The way out is always there

"Stop here" is visible from the first frame and never moves. No confirmation,
no "are you sure", no attempt to keep the user for one more breath. An app
that makes leaving slightly difficult has learned the wrong lesson from
engagement design, and in a distress flow it is a real harm: the person needs
to know, *before* they commit, that they can get out instantly.

### Saving happens once, however the user left

There are three ways out of Calm Mode — the stop button, the browser back
gesture, and navigating elsewhere — and all three funnel into one `finish()`
guarded by a `recorded` flag. A session with no completed breath is not
saved: that is the accidental-open case, and inventing a record for it would
make the garden less honest, not more generous.

### Grounding has no text box

Most implementations ask the user to type the five things they can see. This
one does not:

1. Typing is hard when your hands are shaking, and asking for it turns a
   grounding exercise into a data entry task.
2. It changes the point. Looking around the room *is* the intervention;
   writing it down is a record of the intervention.
3. Anything typed would be stored, which means a disclosure made during a bad
   moment now exists on the phone. The privacy promise is easiest to keep by
   not collecting it.

The count descends — five, four, three, two, one — so each step asks for less
than the one before, and the exercise ends on the easiest one.

### Today zone 4

| Check-in | Button says |
|---|---|
| none, Okay, Good, Light | **Breathe with me** |
| Heavy, Very heavy | **Sit with me a minute** |

**Both open the same screen.** Nothing behind the button differs. The wording
*is* the intervention: to someone who has just said their day is very heavy,
an activity is one more demand, and demand has to fall as capacity falls or
the person disengages entirely. "Sit with me a minute" asks for nothing
except presence — which is what the breathing screen delivers anyway.

---

## 5 · Assets

**Nothing new.** No images, no audio, no additional fonts. The circle is
drawn SVG, the icons come from the existing set. Module 3 adds about 26 KB of
JavaScript and CSS and nothing else.

---

## 6 · Animations

| What | Duration | Curve |
|---|---|---|
| Inhale | 1.8s → 4.0s | pure sine — no sharp start, no sharp stop |
| Hold | 0.9s → 2.0s | the shape rests, deliberately |
| Exhale | 2.8s → 6.0s | same sine |
| Step dot filling | 360ms | spring |
| Closing line | 520ms | fade and 8px rise |

### Reduced movement

With "Reduce movement" on, **the circle does not change size.** A large shape
growing and shrinking in the centre of the visual field is exactly the
pattern that triggers vestibular symptoms.

The pacing is not removed — that would leave the screen useless for the
people who asked for the accommodation. The circle holds one size and its
fill opacity eases between two values instead. No travel, no scale change,
nothing for the vestibular system to track, and the rhythm is still visible.
The word and the haptic pulse carry it as well.

All three behaviours are verified automatically: that the scale never
changes, that the opacity still does, and that the words still cycle.

---

## 7 · Accessibility

| Requirement | How it is met |
|---|---|
| The circle is invisible to screen readers | Phase announced through a polite live region |
| Announcements never interrupt | `aria-live="polite"`, never assertive |
| Stop control | Full width, 48px, first in the foot, never moves |
| Crisis targets | 72px — the only control in the app with its own minimum |
| Grounding prompts | Announced on each step |
| Step dots | `role="presentation"` — the prompt already says which step |
| No text entry | Nothing to type means nothing to type badly |
| 320px screens | No overflow, verified |
| Reduced motion | Pacing preserved without scale change, verified |

---

## 8 · Error handling

| Failure | What the user sees |
|---|---|
| Storage fails while breathing | **Nothing.** The circle keeps moving. |
| Session cannot be saved | Nothing. It is logged to the console only. |
| A distress view fails to load | The router recovers to Today. |
| Anything at all, inside `/calm`, `/ground`, `/crisis` | Nothing. |

The last row is the whole point of the module's error strategy. It is not a
best effort — it is enforced by one flag checked in four places, and tested.

---

## 9 · Testing checklist

### A · Automated — 40 of 40 passing

`python3 tests/verify-module3.py` with the app served on port 8099.

Covers: two practices and no "coming soon"; nav hidden on all three distress
routes; all three breath phases named; the absence of "deep breath" and of
any timer; the circle actually animating; **the toast system refusing to
render inside a distress flow**; the stop control present from the first
frame; a route to a phone number with the nav hidden; a closing line with no
number and no "done"; migration v2 running; the session recorded with no
`completed` field; growth earned; five step dots and no text input; prompts
descending five to one; the grounding session recorded; five `tel:` links
with HEAL first and 999 last; 72px crisis targets; a way back; no risk
screening language; exactly one primary button on Today; the offer label
softening after a heavy check-in; reduced motion holding the scale constant
while the opacity still moves; Bahasa Malaysia; no overflow at 320px; and no
animation left driving a detached node after navigating away.

### B · By hand, on a real phone (10 minutes)

1. Breathe tab → **Start**. Follow the circle for two minutes. It should feel
   like it is getting slower without you noticing when.
2. Watch the first cycle against a clock: about 5.5 seconds. By the eighth,
   about 12.
3. Press **Stop here** after three breaths. Confirm the closing line says
   "You did some. That counts." and nothing else.
4. Open Calm Mode and press the browser back gesture instead. Reopen. There
   should be no leftover buzzing and no second session in the record.
5. Me → Reduce movement → On. Open Calm Mode. **The circle must not change
   size.** The word and the fading must still pace.
6. Aeroplane mode. Open Calm Mode and the help screen. Both work.
7. Tap a crisis number. Your dialler should open with the number filled in
   and **not** call it.
8. Turn on TalkBack or VoiceOver in Calm Mode. You should hear "In", "Hold",
   "Out" without being interrupted mid-word.

### C · The clinical review, before Module 4

Read the Calm Mode and Grounding copy aloud. In particular:

- Is "You did some. That counts." right, or does it read as consolation?
- Does "Sit with me a minute" land as gentler than "Breathe with me", or as
  patronising?
- Is **Tahan** the right word for the hold phase in Bahasa Malaysia, or does
  it carry too much effort? This one needs a native speaker's ear.

---

## 10 · Future extension points

| Where | What plugs in | Module |
|---|---|---|
| `today.view.js` zone 3 | the one task card | 4 |
| `migrations.js` v3 | `tasks` store | 4 |
| `session.repo.js` | the garden reads sessions for the history | 4 |
| `BreathingCircle.js` | Mika breathes at the same pace beside the circle | 5 |
| `crisis-resources.js` | Settings shows the same list a fourth time | 7 |
| `calm.view.js` | an optional pattern picker, **only if** research shows the fixed pace fails a real group of users | — |

**Two rules for whoever builds Module 4:**

1. Add migrations, never edit them. v3 is reserved for `tasks`.
2. Bump `CACHE` in `sw.js` and add every new file to `SHELL`. A file missing
   from `SHELL` works online and vanishes offline.

---

## 11 · Deploying

Same as before. Replace the files in your repository, commit, wait for the
green tick, then **close the app completely on your phone and reopen it** —
the service worker never swaps mid-session, by design.
