# Module 4 — Behavioural Activation, Small Wins, and the Garden

**Status:** complete · **Version:** 1.3.1 · **Date:** 17 August 2026
**Verification:** 43 of 43 new checks passing · Modules 2 and 3 re-run clean (31/31, 40/40)

> **1.3.1 — found in real use.** Correcting the check-in inside its two-hour
> edit window left the task at the tier chosen from the *original* answer. A
> user who corrected "Okay" to "Very heavy" was still being asked to clear a
> surface. The task now follows a corrected check-in **down** — and never up.
> See §4, "When the check-in is corrected".

---

## 0 · Overview

Module 3 gave the app something to do in a bad moment. Module 4 gives it
something to do on an ordinary one — and gives back, for the first time,
visible evidence that any of it happened.

### What is now live

| Area | What shipped |
|---|---|
| **Today zone 3** | One task. Chosen from the check-in. Never two. |
| **Task catalogue** | 22 tasks in three tiers, Malaysian-appropriate, no numbers |
| **"Not now"** | Lowers the ask instead of nagging, then stops for the day |
| **Garden tab** | A drawn garden built from the growth ledger, plus the record |
| **Storage** | `tasks` store (migration v3) and the task repository |

### The three decisions that shaped this module

**1 · The task is not offered until there has been a check-in.**
Two reasons, and the second is the important one. Asking someone to do
something before asking how they are is the wrong way round for a companion —
and the tier is chosen from the mood and then *fixed for the day*, so a task
created before the check-in would be a task chosen for a day the person had
not yet described.

**2 · "Not now" makes the app ask for less.**
Not another task the same size. Not a reminder for tomorrow. A shower becomes
washing your face; washing your face becomes drinking some water; and at the
smallest tier one more "not now" ends the asking with *"Nothing today, then.
That's allowed."* This is the single most important behaviour in the module.

**3 · The garden shows what happened, never how much.**
No total, no streak, no percentage, no "4 away from the next stage". The
drawing grows, and beneath it sits a dated list of the specific things it grew
from. The list is the evidence; a number would be a score, and a score can be
low.

---

## 1 · Folder structure

```
prc-app/
├── sw.js                                 CACHE bumped to prc-v1.3.0-module4
│
├── core/
│   ├── content/task-catalogue.js    NEW  22 tasks, both languages
│   ├── components/Garden.js         NEW  the drawn garden
│   └── storage/
│       ├── migrations.js                 v3 — the tasks store
│       └── repositories/task.repo.js NEW
│
├── features/
│   ├── task/task-card.js            NEW  Today zone 3
│   ├── today/today.view.js               zone 3 wired in
│   └── garden/garden.view.js             rewritten
│
└── styles/
    ├── 03-components/
    │   ├── garden.css               NEW
    │   └── card.css                      actions now share the row exactly
    └── 04-features/
        ├── task.css                 NEW
        └── garden.css               NEW
```

### Why the catalogue lives in `core/content/`

It is the second file in the codebase to carry user-visible text outside the
locale files, after `core/safety/crisis-resources.js`, and for the same
reason: this is **structured data that happens to contain text**. A task is a
tier, an id and two sentences that must stay together. Splitting the sentences
into a locale file 200 lines away would make it possible to change the English
without the Malay, or to reorder one list without the other. Both languages
sit side by side so a reviewer can see at a glance whether they say the same
thing.

It sits in `core/`, not `features/`, because a repository in `core/storage/`
reads it — and `core` must never import from `features`.

---

## 2 · HTML

**No change to `index.html`.** The pinned CSP hash is untouched.

---

## 3 · CSS

### The one change to an existing component

`card.css` — the action row now uses `flex: 1 1 0` instead of `1 1 auto`.

With an auto basis the buttons are sized from their text first and only then
share the leftover space, so "I did it" and "Not now" came out 16px apart in
testing. Sixteen pixels is enough to read as a preference, and the whole
design of the task card rests on the two options being visibly equal.

### Where the task's buttons sit in the hierarchy

Both task actions are **outlined, not filled**, and both are `lg`. Today keeps
exactly one filled button — the calm offer in zone 4.

This is not a demotion of the task. A screen with two filled buttons makes the
eye choose before the person does. Placing both options one step below the
screen's primary, and level with each other, is the correct reading: doing the
task and not doing it are both fine, and neither is the most urgent thing on
the screen.

---

## 4 · JavaScript

### The task catalogue: four tests for inclusion

A task must pass all four.

| Test | Why |
|---|---|
| **One step** | "Tidy the kitchen" is a project. "Put one thing back where it belongs" is a step. Projects are where behavioural activation fails — a person with no capacity cannot find the first move. |
| **No number** | No reps, no minutes, no counts. A number is a target, a target can be missed. (This implements Clinical Framework Appendix D3, which struck a "20 squats" example from an earlier draft.) |
| **Finishable in a minute or two** | The point is not the activity. The point is the completion. |
| **Costs nothing, needs nobody** | No purchase, no appointment, no other person's cooperation, and nothing that assumes a house, a garden, a car or a job. |

### The tiers

| Tier | What it means | Examples |
|---|---|---|
| 0 | without getting up | Drink a few sips of water · Let a bit of daylight in · Roll your shoulders once |
| 1 | up, but still inside | Wash your face · Open a window · Make a drink — kopi, teh, plain water |
| 2 | a slightly bigger single step | Go and take a shower · Walk to the end of the road and back · Message one person |

### Mood → tier

| Check-in | Tier |
|---|---|
| Very heavy | 0 |
| Heavy, Okay | 1 |
| Good, Light | 2 |

**The mapping is the intervention.** Offering the same task to a person on
their worst day and their best one fails one of them — and it is always the
same one it fails.

### Behavioural activation, arranged the right way round

The evidence base for behavioural activation in depression is among the
strongest for any psychological intervention, and its core insight is
counter-intuitive: **action comes before motivation, not after.** Waiting to
feel like doing something is the trap; doing a small thing while still feeling
nothing is the intervention.

That is why the app never asks *"what do you feel up to?"* — a question that
invites the person to consult a feeling currently telling them nothing is
possible. It offers one specific small thing instead.

### The full task lifecycle

| State | What is on screen |
|---|---|
| No check-in yet | Nothing. Zone 3 is empty. |
| Offered | The task, "I did it", "Not now" |
| Softened | A quiet line — "Something smaller, then." — and a smaller task |
| Resting | "Nothing today, then. That's allowed." No buttons. |
| Done | The task shown as a record, with a check. Nothing further asked. |

The task is **persisted the moment it is offered**, so closing and reopening
the app shows the same one. A suggestion that changes every time you look at
it cannot be committed to, and quietly teaches that nothing here is real.

### When the check-in is corrected

The task's tier is chosen from the check-in and then fixed, so the suggestion
is stable and can be committed to. But the check-in itself stays editable for
two hours, precisely because people mis-tap and because people realise a
minute later that "Okay" was not true.

So a correction pulls the task with it:

| Correction | What happens to the task |
|---|---|
| Okay → Very heavy | Re-offered at tier 0 |
| Very heavy → Good | **Nothing.** The ask never grows. |
| Any correction, task already done | Nothing |
| Any correction, app already resting | Nothing |

**It only ever goes down.** Raising the ask because someone said they felt
better would teach them that admitting to a good hour costs something — the
same failure as pushing after a decline. Within a day, demand can fall and
cannot rise.

The correction does **not** increment `softenings`. The person did not decline
anything; they corrected how they were.

### Nothing records a failure

`doneAt` is either a timestamp or null. Null means "not yet", and no code path
anywhere reads it as anything else. There is no `skipped`, no `refused`, no
`expired`. Yesterday's untouched task is simply yesterday's task.

`softenings` counts how many times the person said "not now" today. It exists
for exactly one purpose — to make the next suggestion smaller — is never
displayed, and is never summed across days. The only behaviour it can cause is
the app asking for less.

### There is no second task

Completing today's task does not unlock another. This is a real trade-off,
chosen deliberately: someone having a good day could certainly manage three,
but an app that offers a second the moment you finish the first is a to-do
list, and a to-do list is a thing you can fall behind on. The ceiling protects
the bad days at the cost of a little upside on the good ones.

### The garden

| Input | Source |
|---|---|
| Stage (1–5) | `growth.stageFor(total)` — thresholds 0 / 4 / 12 / 28 / 60 |
| Scatter objects | one per growth entry, capped at 28 |
| Sky | the current time of day — the one thing not earned |
| Fireflies | stage 5 only |

**It cannot go backwards.** Every input is a sum of an append-only store, and
there is no code path here or beneath it that can make the garden smaller —
not after a bad week, not after three months away. *"Your plant died while you
were unwell"* is a sentence this app must never be able to produce, so the
machinery that could produce it does not exist.

**Every single thing is drawn, not just the total.** Five stages is coarse;
someone who checks in twice would see no change. So each growth entry also
places its own small object in the soil — a tuft of grass, a pebble, a tiny
flower. Check in once and something appears that was not there before.

**Positions come from a deterministic hash of the entry's index, not
`Math.random()`.** The garden must look identical every time it is opened.
A garden that rearranges itself on each visit is decoration; a garden that
stays put is a *place*, and only a place accumulates meaning. This is
verified automatically by comparing the drawing across a reload.

---

## 5 · Assets

**Nothing new.** The garden is drawn SVG built from the existing
`--color-garden-*` palette, so it recolours correctly for the night theme
without a single value being repeated.

---

## 6 · Animations

| What | Duration | Notes |
|---|---|---|
| Garden settling in | 1200ms | once on arrival, never on a re-render |
| Fireflies | 5.5s loop | a slow irregular fade, never a blink — a blink reads as an alert |
| "Something smaller, then." | 360ms | fade only |
| Task card press | 160ms | the standard button press |

Reduced movement stops the fireflies and the settle entirely, and leaves the
fireflies at a steady soft glow. They are decoration; the accommodation costs
nothing.

---

## 7 · Accessibility

| Requirement | How it is met |
|---|---|
| The two task actions | Identical width and height, verified in the browser |
| Neither is disabled or hidden | Verified |
| Task announcements | "That was a real thing." / "Something smaller, then." through the polite live region |
| The garden | `role="img"` with a label; the record below carries the same information as text |
| Stage dots | `role="presentation"` — decorative; the drawing already says it |
| 320px and 200% text | No overflow on Today or Garden, verified |

---

## 8 · Error handling

| Failure | What the user sees |
|---|---|
| The task cannot be saved | The card still shows what they chose. Nothing is said. |
| Growth cannot be recorded | Nothing. The task itself already succeeded. |
| The garden cannot be read | The empty state, not an error. |
| Completing twice (double tap) | Nothing. The second call is a no-op and cannot inflate the garden — verified. |

---

## 9 · Testing checklist

### A · Automated — 42 of 42 passing

`python3 tests/verify-module4.py`, with Modules 2 and 3 re-run to catch
regressions (they pass 31/31 and 40/40 after the `card.css` change).

Covers: no task before a check-in; migration v3; a light day getting tier 2;
one record per day; one card on screen; no number in the task text; the two
actions being exactly the same size and neither being a filled primary; Today
keeping exactly one filled button; the task surviving a reload; declining
lowering the tier and offering a different task; the softened line; **no
scolding language anywhere after declining**; declining twice more reaching
tier 0 and then resting; nothing recording a refusal; completing setting
`doneAt` and earning growth; the card stopping once done; no second task;
**completing twice not inflating the garden**; the garden drawn with one
object per thing done; five stage dots and no percentage; no total, streak or
goal language; the "nothing disappears" line; **the garden being pixel-identical
across a reload**; more growth reaching a later stage; the scatter capped;
no API existing to remove growth; Bahasa Malaysia with no "anda"; and no
overflow at 320px or 200% text.

### B · By hand, on a real phone (10 minutes)

1. Check in as **Light**. You should get a tier-2 task — a shower, a walk, a
   message. Close the app, reopen it: **the same task.**
2. Press **Not now**. The next one should be visibly smaller, with one quiet
   line naming the change. Press it twice more; the app should stop asking and
   say that is allowed.
3. Tomorrow, check in as **Very heavy**. The task should be something you
   could do without sitting up.
4. Do a task, breathe, and check in. Then open **Garden**. There should be
   three new objects in the soil and three dated lines beneath.
5. Open Garden in the morning and again at night — the sky should differ.
6. Me → Reduce movement → On. The fireflies should stop moving.
7. Turn on TalkBack or VoiceOver on Today. Both task buttons should be
   announced as ordinary buttons, neither as "dimmed".

### C · The clinical review, before Module 5

Read the 22 tasks in `core/content/task-catalogue.js` aloud, in both
languages, and ask of each one:

- Would a patient at Hospital Sultanah Aminah recognise this as something
  *they* could do today, in their home, with what they have?
- Does any tier-0 task still assume more capacity than "very heavy" allows?
- Is **"Dah buat"** the right register for "I did it", or does it sound like
  reporting to someone?

This list is the part of the module most likely to need your hand rather than
mine — I can write the machinery, but which small thing is actually doable in
a Johor Bahru flat on a bad Tuesday is your knowledge, not mine.

---

## 10 · Future extension points

| Where | What plugs in | Module |
|---|---|---|
| `migrations.js` v4 | `thoughts` store | 5 |
| `Garden.js` | Mika stands in the garden at stage ≥ 2 | 5 |
| `growth.repo.js` GROWTH | `THOUGHT` is already declared | 5 |
| `garden.view.js` | tapping a scatter object to see what it was | 6 |
| `task-catalogue.js` | user-added tasks, **if** research supports it | — |
| `task.repo.js` | avoiding tasks declined repeatedly across days | — |

**Two rules for whoever builds Module 5:**

1. Migration **v4** is reserved for `thoughts`. Add, never edit.
2. Bump `CACHE` in `sw.js` and add every new file to `SHELL`.

---

## 11 · Deploying

Same as before. Replace the files, commit, wait for the green tick, then close
the app completely on your phone and reopen it.

**This update changes the database schema (v2 → v3).** The migration runs
automatically on first launch and adds an empty store; nothing existing is
touched. Your check-ins, sessions and growth are all preserved.
