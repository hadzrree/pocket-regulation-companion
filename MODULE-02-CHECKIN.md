# Module 2 — Component Library, Storage, and the Daily Check-in

**Status:** complete · **Version:** 1.1.0 · **Date:** 15 August 2026
**Verification:** 31 of 31 automated checks passing

---

## 0 · Overview

Module 1 built a shell that worked and looked plain. Module 2 is where the
app starts looking like the Design Language and starts *doing* something: it
adds the reusable component library, the on-device database, and the first
real feature — the daily check-in.

### What is now live

| Area | What shipped |
|---|---|
| **Icons** | 19 inline SVG icons, no font, no CDN, no sprite file |
| **Components** | Button, Card, MoodSelector, NavBar, Toast, EmptyState |
| **Typography** | Nunito and Inter, self-hosted, variable, 87 KB in normal use |
| **Storage** | IndexedDB with versioned migrations; mood and growth repositories |
| **Safety** | The five Malaysian crisis contacts, frozen into the bundle |
| **Feature** | The daily check-in: five faces, once a day, two-hour edit window |
| **Screens** | Today (zones 1–2 live), Feelings (the record), Me (unchanged) |

### What is deliberately still absent

- **Zone 3 of Today** — the one task. Module 4. It is *absent*, not stubbed
  with a "your task will appear here" box. An empty placeholder advertises a
  hole; nothing at all reads as a screen that is simply calm.
- **Zone 4 of Today** — the contextual calm offer. Module 3. Until the
  breathing pacer exists, that button would lead to an empty screen, so the
  zone carries an honest link to Feelings, which *is* built.
- **The garden and Mika.** Modules 4 and 5. The growth ledger they will read
  from is already recording, so nothing is lost in the meantime.

### Three decisions worth reading before the code

**1 · The mood scale stores 1–5 and shows words.**
The database needs an axis for the chart in Module 6, so the number exists.
The user never sees it. "3 out of 5" is a score, and a score invites
comparison, targets, and the feeling of failing. "Okay" is a description.
*Clinical Framework §12.4.*

**2 · The growth ledger has no delete and no update — structurally.**
`growth.repo.js` exports `record`, `all`, `total` and `stage`. There is no
`remove`, no `reset`, no `decay`. The storage layer beneath it exposes no
single-record delete either. The rule that the companion may only ever grow
is therefore not a convention someone has to remember — it is an API that
does not exist. A future developer asked to add a decay feature would have to
build the deletion machinery from scratch, and would find the reasoning while
doing it.

**3 · Nothing in the storage layer throws.**
Every function returns `Ok(value)` or `Err(code)`. IndexedDB fails for
reasons that have nothing to do with this app — Safari private browsing,
storage pressure, OS eviction. If any of those surfaced as an uncaught
exception during a panic session, the user would see a blank screen at the
worst possible moment.

---

## 1 · Folder structure

New files are marked **NEW**. Everything else is unchanged from Module 1.

```
prc-app/
├── index.html                         two font preload links added
├── sw.js                              CACHE bumped to prc-v1.1.0-module2
│
├── assets/
│   └── fonts/                    NEW  the four woff2 files + OFL.txt
│
├── core/
│   ├── components/               NEW  the component library
│   │   ├── icons.js                   19 icons, inline SVG
│   │   ├── Button.js                  5 variants, 4 sizes
│   │   ├── Card.js                    5 tones, 3 elevations
│   │   ├── MoodSelector.js            the five drawn faces
│   │   ├── NavBar.js                  replaces the inline nav in main.js
│   │   ├── Toast.js                   one at a time, never during distress
│   │   └── EmptyState.js
│   │
│   ├── storage/                  NEW  the only code that touches IndexedDB
│   │   ├── db.js                      open, migrate, transact, Result-wrapped
│   │   ├── migrations.js              the schema history. Add, never edit.
│   │   └── repositories/
│   │       ├── mood.repo.js           once a day, two-hour edit window
│   │       └── growth.repo.js         append-only. No delete. No update.
│   │
│   ├── safety/                   NEW
│   │   └── crisis-resources.js        frozen. No network. Works at 3am offline.
│   │
│   └── utils/
│       └── haptics.js            NEW  consent-aware, silent no-op on iOS
│
├── features/
│   ├── checkin/                  NEW
│   │   └── checkin.js                 the check-in block Today mounts
│   ├── today/today.view.js            rewritten — zones 1 and 2
│   └── feelings/feelings.view.js      rewritten — the record
│
└── styles/
    ├── 02-base/fonts.css              rewritten for the four real files
    ├── 03-components/
    │   ├── icon.css              NEW
    │   ├── button.css            NEW
    │   ├── card.css              NEW
    │   ├── mood-selector.css     NEW
    │   ├── toast.css             NEW
    │   ├── empty-state.css       NEW
    │   └── nav-bar.css                icons, motion preference, large text
    └── 04-features/
        ├── today.css             NEW
        ├── checkin.css           NEW
        └── feelings.css          NEW
```

**When you add a stylesheet you must touch three files, not one:**
the new CSS file, the right block of `styles/main.css`, and the `SHELL`
array in `sw.js`. Miss the third and the file works online and vanishes
offline — which is the hardest kind of bug to notice, because it only
appears on a phone with no signal.

---

## 2 · HTML

Only `index.html` changed, and only to add two lines:

```html
<link rel="preload" href="./assets/fonts/nunito-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="./assets/fonts/inter-latin.woff2"  as="font" type="font/woff2" crossorigin>
```

**Why preload.** Without it the browser discovers `main.css`, then
`fonts.css` inside it, then the font file — three round trips before a single
letter is drawn in the real typeface. Preloading starts the two Latin files
in parallel with the stylesheet, so the swap happens on the first frame.

**Why `crossorigin` on a same-origin file.** Fonts are always fetched in CORS
mode. A preload without it is treated as a *different* request: the file
downloads twice and the console warns that the preload went unused.

**Everything else is built in JavaScript.** There is no template, no
`innerHTML`, and no HTML string anywhere in the codebase. Every element comes
from `el()` in `core/utils/dom.js`, which inserts strings as text nodes only.
That is the single XSS boundary, and it holds because there is no other way
to make an element.

⚠️ **The CSP hash hazard, repeated from Module 1.** `index.html` contains one
inline script pinned by
`sha256-Mr9yNWtoJI3dbJ1qHbxrjFxjpTtBKHuUTPhVsgojsNo=`. **Editing that script —
even changing whitespace — silently breaks it.** The symptom is not an error:
it is a brief flash of the wrong theme on launch. If you ever edit it, open
the browser console, read the hash the browser reports, and paste that exact
string back into the CSP.

---

## 3 · CSS

### Where things live

| Layer | Files added | Rule |
|---|---|---|
| 03-components | icon, button, card, mood-selector, toast, empty-state | reusable anywhere |
| 04-features | today, checkin, feelings | belongs to exactly one journey |

If a style is used on two screens it belongs in 03. If it is used on one, it
belongs in 04. The numbered layers *are* the cascade — never reorder them.

### The rules this module encodes

- **Every button is a pill.** Nothing in the product has a sharp corner.
  Sharp corners read as institutional — forms, hospitals, portals.
- **The "quiet" variant is not weakened.** Standard product practice makes
  the decline option unattractive so users pick the other one. Here declining
  is a legitimate clinical choice, and the behavioural-activation model
  collapses if users feel pushed. `.btn--quiet` is full height, full
  contrast, and simply carries no fill.
- **Toned cards carry a 3px left edge *and* an icon or a word.** Roughly 1 in
  12 men has a colour vision deficiency, and every user of this app is
  someone not looking carefully.
- **Stroke width lives in CSS, not in the SVG attribute.** An SVG
  presentation attribute cannot hold a `var()`; it parses as invalid and
  falls back to 1, giving hairline icons that look like a rendering fault.
  Declared as a CSS property it resolves — and high-contrast mode can then
  thicken every icon in the app with one rule.
- **`min-width: 0` on the mood buttons.** Without it a flex item refuses to
  shrink below its content and the fifth face falls off a 320px screen.

### The one exception to the focus ring

`#main` carries `tabindex="-1"` so the router can move focus into new content
after a route change — which made it match `[tabindex]:focus-visible` and
draw a sage ring around the *entire screen* on every navigation.

The ring is now removed on `#main` only, deliberately:

- WCAG 2.4.7 governs user interface **components**. `#main` is a landmark,
  not a control — nobody activates it, so there is no state to communicate.
- Screen reader users are not relying on it: the router announces the new
  screen title through the polite live region at the same moment focus lands.
- Keyboard users are not stranded: focus really is inside `#main`, so their
  next Tab reaches the first control on the new screen.

Every actual control keeps its full 3px ring.

---

## 4 · JavaScript

### The component contract

Every component is a **function that returns a node** — not a class, not a
framework component. Some also return a small control surface:

```js
const { node, setValue, destroy } = MoodSelector({ value, onSelect });
container.appendChild(node);
// later, in the view's unmount():
destroy();
```

If a component adds a listener, an observer or a timer, it returns a
`destroy()` and the view calls it. This is not tidiness. A breathing pacer
left subscribed after navigation would fire a haptic pulse on an unrelated
screen.

### The check-in, step by step

1. Today mounts and paints the greeting **immediately** — it needs no storage.
2. `loadToday()` asks IndexedDB for today's record.
3. The check-in card is inserted when the answer arrives, usually within a
   frame or two. **There is no spinner.** A loading spinner on a mental
   health app's home screen is a small anxiety for no benefit.
4. The user taps a face. The face lights and the response sentence appears
   **before** the write completes — waiting for IndexedDB before acknowledging
   a feeling puts a pause exactly where a pause reads as hesitation.
5. `mood.repo.save()` writes the record, and on the *first* answer of the day
   appends one entry to the growth ledger.
6. A toast confirms the first answer. Later adjustments are silent — a toast
   on every change would be chatter.

### The once-daily rule and the edit window

| Situation | What happens |
|---|---|
| First answer today | Saved. One growth entry. Toast: "Noted. Thank you." |
| Changed within 2 hours | Same record updated. **No extra growth.** Silent. |
| After 2 hours | Faces stop responding. The chosen one stays lit. |
| Returning to Today later | The answer is shown. The question is not asked again. |

The window is measured from the **first** save, not from each edit —
otherwise an edit at 01:59 would extend it to 03:59 and it would never close.

**Why a window exists:** people mis-tap, and people realise a minute later
that "Okay" was not true. **Why it closes:** an always-editable history is a
draft, not a record. Part of the value of a mood log is that it tells you
something you had forgotten — which only works if today-you cannot quietly
rewrite last-Tuesday-you into a better mood.

**What the app never says:** *locked*, *expired*, *you can no longer edit
this*. There is no message at all. The faces simply stop responding.

### The crisis card

Selecting the lowest face reveals a quiet card offering phone numbers.

**It is not a risk assessment.** One low mood rating is not a suicide risk
score, and this app does not compute one. An on-device app that flagged
people as "at risk" would be making a clinical judgement it has no grounds
for and no way to follow up.

**It is not an alert.** Nobody is notified. Nothing is transmitted. No
clinician, caregiver or service learns anything. The app never dials.

**It is an offer, worded as one:** *"You don't have to be in danger to call."*
It appears below the response, in the "care" tone, at ordinary size — not as
a modal, not as a red banner, not with a warning icon. Making it dramatic
would punish honesty, and a user who learns that answering truthfully
summons an alarming screen will stop answering truthfully.

Once opened it **stays** open for the session, even if the user then changes
their face to "Heavy". Collapsing it would look like the app withdrawing an
offer of help.

The numbers are real `<a href="tel:">` links, ordered talk-lines first and
`999` last — most people opening this card are distressed, not in immediate
physical danger, and leading with emergency services frames their feeling as
something requiring intervention.

### Storage, in one page

```
features/            call repositories, never db.js
  └── repositories/  enforce the clinical rules, return Result
        └── db.js    the only file that touches IndexedDB
```

- **`moods`** — keyed by the **local** date (`2026-08-15`). `new Date()
  .toISOString()` returns UTC; for a user in Malaysia (UTC+8) anything logged
  before 08:00 would be filed under yesterday, breaking three clinical rules
  from one timezone bug.
- **`growth`** — the append-only ledger. A ledger rather than a counter,
  because a stored number can drift and cannot be audited, while a ledger's
  total is always the sum of things that actually happened.
- **`meta`** — small internal values. **Preferences do not live here** — they
  stay in `localStorage` so the theme can be applied before the first paint.

`tx.oncomplete` is the only place a write is treated as successful. A
request's `onsuccess` fires *before* the transaction commits, so resolving
there would report "saved" for data that can still be lost.

### Data may be evicted. The app must not warn about it.

iOS clears storage for sites unused for seven days, and a home-screen web app
gets the same quota — not an exemption. We request persistent storage and
encourage installation, which materially reduces the risk. We never tell the
user their feelings might disappear. That warning would add a background
anxiety to an app whose entire job is to reduce it, in exchange for
information they cannot act on.

---

## 5 · Assets

Fonts are **done** — see `docs/ASSETS.md`. Four files, 208 KB on disk, 87 KB
in normal use, SIL Open Font License 1.1, licence text shipped alongside.

Icons are inline SVG in `core/components/icons.js`. Nineteen of them. No icon
font (a missing glyph where the crisis icon should be is not an acceptable
failure mode), no CDN, no sprite file.

App icons remain generated placeholders — functional, not final artwork.

---

## 6 · Animations

Every duration and curve comes from `01-tokens/motion.css`. **No component
invents a value.** That is what keeps forty screens feeling like one product.

| What | Duration | Curve | Why |
|---|---|---|---|
| Button press | 160ms | standard | scale 0.972, never a colour flash |
| Face select | 240ms | spring | 8% lift, max 4% overshoot |
| Response line | 520ms | out-soft | fade + 6px rise — arriving, not opening |
| Crisis card | 520ms | out-soft | the same gentle arrival, not a pop |
| Toast | 360ms | out-soft | fade + 8px rise, never a slide from an edge |
| Card lift | 240ms | standard | 1.5% on hover |

Sliding implies distance and urgency. This app has neither.

**Reduced movement** removes every transform and keeps every colour change.
Feedback still happens — it just stops moving. It also **silences haptics**:
for a user with vestibular sensitivity or sensory over-responsivity, an
unexpected vibration is the same category of problem as an unexpected
animation.

---

## 7 · Accessibility

| Requirement | How it is met |
|---|---|
| Touch targets | Mood faces 55×89px, nav tabs 68×56px, crisis lines ≥ 72px |
| Keyboard | Real `radiogroup` with roving tabindex; ← → ↑ ↓ Home End |
| Tab order | Skip link is the first stop — verified automatically |
| Screen reader | Each face announces its **word**: "Okay, radio button, 3 of 5" |
| Announcements | Always polite, never assertive — nothing interrupts mid-word |
| Icons | Always `aria-hidden` — every icon sits beside a word |
| Colour | Selection carries fill + ring + scale + bold label, never colour alone |
| Text size | No overflow at 200% — verified automatically |
| Narrow screens | No overflow at 320px — verified automatically |
| Interactive cards | Real `<button>` elements, not divs with click handlers |
| Toast | Never takes focus; announced through the live region instead |

**Double-tap suppression (400ms)** is built into `Button` and `Card`, because
tremor and slow motor planning cause accidental repeats.

It is deliberately **not** applied to the mood faces. Suppression exists to
stop an accidental repeat *action*; choosing a mood is idempotent — tapping
"Okay" twice means Okay. Applying it there would instead break the common
case of someone changing their mind quickly between two adjacent faces.

---

## 8 · Error handling

| Failure | What the user sees |
|---|---|
| IndexedDB unavailable | The check-in still works visually. Nothing is said. |
| Quota exceeded | One quiet sentence: *"I couldn't save that just now. Your phone's storage might be full."* |
| Storage error during a distress flow | **Nothing.** `Toast.show()` returns silently when `inDistressFlow` is true. |
| Growth entry fails to write | Nothing. The check-in already succeeded. |
| Edit attempted after the window | Nothing. The real stored answer is repainted. |
| A view module fails to load | The router recovers to Today. |

Only error codes with a written, human sentence are ever displayed. `t()`
returns the *key* when a translation is missing, so falling through to
`t('errors.' + code)` blindly could put `errors.storage-blocked` on screen.
Unlisted codes get the general sentence instead.

Every message blames nothing and nobody: *"Something went wrong on my side.
You didn't do anything."*

---

## 9 · Testing checklist

### A · Automated — 31 of 31 passing

Run: `python3 verify-module2.py` (with the app served on port 8099).

Covers boot without console errors, five faces with real geometry, touch
target sizes, no horizontal overflow at 390px / 320px / 200% text, skip link
first in tab order, arrow-key selection, roving tabindex, one mood record,
one growth entry, edits earning no extra growth, the crisis card appearing
and not being a modal, five `tel:` links with HEAL first, ≥72px crisis
targets, persistence across reload, the question not being asked twice, the
Feelings list, the absence of score/trend/streak language, night theme,
Bahasa Malaysia re-translation of the nav and the mood words, and the
structural absence of a delete API.

### B · By hand, on a real phone (15 minutes)

1. Open the app. Tap a face. Confirm the sentence appears immediately.
2. Close the app fully. Reopen it. **The answer is still there and the
   question is not asked again.**
3. Tap a different face. Confirm no second toast and no second growth entry.
4. Tap "Very heavy". Confirm the offer is calm, not alarming. Tap "See the
   numbers". Confirm the numbers are legible and the targets are large.
5. Switch on aeroplane mode. Reload. **Everything still works.**
6. Me → Text size → largest. Return to Today. Nothing is cut off.
7. Me → Reduce movement → On. Tap a face. Feedback happens; nothing moves.
8. Me → Bahasa Malaysia. Confirm the nav tabs *and* the mood words change.
9. Me → Night. Confirm nothing is pure black and nothing is pure white.
10. Turn on VoiceOver or TalkBack. Swipe to a face. It should say the **word**,
    not a number.

### C · The clinical review, before Module 3

Read every string in `en.js` and `ms.js` against the copy rules. No *should*,
*must*, *need to*, *don't forget*, *remember to*. No *failed*, *missed*,
*streak*, *overdue*, *inactive*. No clinical word. **The Bahasa Malaysia
strings need a native speaker, not only a translator** — the register
decision ("awak", never "anda") is load-bearing and a translator working from
English will not feel it.

---

## 10 · Future extension points

| Where | What plugs in | Module |
|---|---|---|
| `today.view.js` zone 3 | the one task card | 4 |
| `today.view.js` zone 4 | the contextual 64px calm offer | 3 |
| `migrations.js` v2 | `sessions` store — breathing and grounding | 3 |
| `migrations.js` v3 | `tasks` store | 4 |
| `migrations.js` v4 | `thoughts` store — what the user tells Mika | 5 |
| `migrations.js` v5 | `symptoms` store | 6 |
| `growth.repo.js` GROWTH | `SESSION`, `TASK`, `THOUGHT` are already declared | 3–5 |
| `growth.repo.js` STAGES | the companion reads `stageFor()` unchanged | 5 |
| `checkin.js` | an optional note field beneath the faces | 5 |
| `feelings.view.js` | the eight-point entry map; the chart | 5, 6 |
| `crisis-resources.js` | Emergency Mode reads the same frozen constant | 3 |
| `Toast.js` | an `undo` action is already supported by the API | 4 |

**Two rules for whoever builds Module 3:**

1. Add migrations, never edit them. A device that already ran a migration
   will never run it again. There is no backend, so there is no backup — the
   copy on the phone is the only copy that has ever existed.
2. Bump `CACHE` in `sw.js` and add every new file to `SHELL`. A file missing
   from `SHELL` works perfectly online and disappears offline.

---

## 11 · Deploying this update

Same as Module 1 — replace the files in your GitHub repository and commit.

The service worker **never calls `skipWaiting()`**, so an update installs in
the background and activates the next time the app is launched, never in the
middle of a session. A user who is mid-breath when you deploy will not have
the app change underneath them. Expect to close and reopen the app once
before you see the new version.
