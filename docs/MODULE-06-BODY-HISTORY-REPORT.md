# Module 6 — The Body Log, the Mood History, and the Report

**Status:** complete · **Version:** 1.5.0 · **Date:** 18 August 2026
**Verification:** 57 of 57 new checks passing · Modules 2–5 re-run clean (32/32, 40/40, 44/44, 69/69)

---

## 0 · Overview

Three things that all point at the same place: **a ten-minute appointment.**

| Area | What shipped |
|---|---|
| **Body log** | 15 plain-word sensations, capped at three moments a day |
| **Mood history** | One mark per day. No line, no average, no verdict. |
| **Report** | A page to hand a clinician, with a print stylesheet |
| **Storage** | `symptoms` store (migration v5) |

### The decision that shaped the whole module

**A symptom tracker can make health anxiety worse**, and the mechanism is
well described: attention to the body increases detection of ordinary
sensation, detection prompts checking, checking prompts recording, and the
record becomes the reason for the next check. A tracker with a severity
slider and a trend line is a body-checking machine wearing a clinical
costume.

It is here anyway, for one reason that outweighs that: **a person who cannot
describe their symptoms in a ten-minute appointment gets worse care.** They
are asked "when did this start and what does it feel like" and cannot answer
— not because they do not know, but because they are frightened and the
question is hard.

So the feature was built for the appointment, not for browsing. Everything
below follows from that single reframing.

---

## 1 · Folder structure

```
prc-app/
├── sw.js                                     CACHE → prc-v1.5.0-module6
│
├── core/
│   ├── components/MoodRibbon.js         NEW  the history drawing
│   ├── content/symptom-catalogue.js     NEW  15 plain words, both languages
│   └── storage/
│       ├── migrations.js                     v5 — the symptoms store
│       └── repositories/symptom.repo.js NEW  with the daily cap
│
├── features/
│   ├── body/body.view.js                NEW  noticing, recorded plainly
│   ├── report/report.view.js            NEW  for an appointment
│   ├── feelings/feelings.view.js             + the ribbon, + a way in
│   └── me/me.view.js                         + a way to the report
│
└── styles/
    ├── 03-components/mood-ribbon.css    NEW
    ├── 04-features/body.css             NEW
    ├── 04-features/report.css           NEW
    └── 06-print/report.css              NEW  the sixth layer, finally used
```

---

## 2 · HTML

**No change to `index.html`.** The pinned CSP hash is untouched.

---

## 3 · CSS — the print layer

`styles/06-print/` has been reserved since Module 1 and is now in use.

The report is meant to be handed to a clinician. On paper that means black on
white with real margins — not the app's warm off-white, soft shadows and
rounded cards, which are for a phone at 3am and print as a grey wash that
makes small text harder to read.

| Rule | Why |
|---|---|
| Everything non-report is `display: none` | A printed page with a "Print" button drawn on it looks like a mistake, and a clinician trusts the rest of the page slightly less |
| `@page { margin: 16mm }` | Comfortable for a hole punch and a staple |
| `break-inside: avoid` on rows | A date must never be split from the thing that happened on it |
| `print-color-adjust: exact` on the marks | The scale is separated by luminance as well as hue, so it survives a black-and-white clinic printer |
| All animation and transition off | Nothing animates on paper |

Verified by emulating print media and asserting the nav, the buttons and the
background.

---

## 4 · JavaScript

### The body log — five rules

| # | Rule | What it rules out |
|---|---|---|
| 1 | **Plain words, not clinical ones** | "Chest feels tight", never "chest tightness"; "heart is going fast", never "palpitations" |
| 2 | **No severity, no scale, no duration** | Nothing to compare, so nothing to check against |
| 3 | **The app never says what it is** | Not "this can happen with anxiety", not "this is common" |
| 4 | **The app never reassures** | "It's probably nothing" is unsafe *and* it feeds the loop |
| 5 | **The standing line is always present** | Every state of the screen, in ordinary body text |

**The standing line**, verbatim: *"If something is new, bad, or frightening
you, please get it looked at by a doctor. This app can't tell you what it
is."*

It is deliberately **not styled as a warning** — no red, no icon, no box.
Something that looks like an alert on every visit stops being read by the
third visit. It is a fact that is always true, not an alert that has just
fired.

**Rules 3 and 4 each stand alone.** The app has no idea whether a racing
heart is a panic attack or an arrhythmia, and the one time it guesses wrong
is the time that matters. Separately, reassurance is the specific thing that
maintains health anxiety — being told "it's nothing" relieves the person for
an hour and teaches them to come back for more.

### One record is one moment

A panic episode is a tight chest *and* a fast heart *and* not being able to
get a full breath, all at once. That is one thing that happened, not three.

Storing it as three would also burn all three of the day's entries on a
single episode, turning the cap from a protection into an obstruction.

### The daily cap — three moments

The only cap in the application, because this is the only feature that can be
used **compulsively**. A person in a health-anxiety spiral will check their
pulse forty times in an evening, and an app that accepts forty entries has
become the instrument of the spiral rather than a record of it.

Three is enough for a real day — morning, afternoon, a bad night — and few
enough that the log cannot become the checking behaviour itself.

**The cap message is about the app, never the person.** Not "you have logged
too many times" — *"That's enough for today. I've got what you told me."*
Someone in a spiral being told they have done something too often has just
been handed one more thing to be wrong about. Asserted in the test suite.

### There is no route to a symptom history

You can record. You cannot scroll back.

That is the most important structural decision in the module. A scrollable
symptom feed is a body-checking instrument: the person reads yesterday's
entry to decide whether today is worse, and the comparison generates the next
check.

The record is not hidden — it is in the report, which is a deliberate act
with a reason attached. Going to make a report for an appointment is not the
same behaviour as scrolling a feed.

### Noticing earns no growth

Every other action in the app grows the garden. This one does not. Rewarding
the noticing of a body sensation would give a checking loop a reason to run.

### The mood history

| Refused | Why |
|---|---|
| A line between the marks | A line says "trajectory", and a trajectory continues. Four days down reads as "getting worse" to the person least able to hear it. |
| An average | A number that can be low |
| A numeric axis | Turns days into scores |
| Highlighting a run of low days | The app has no business drawing attention to a pattern it cannot interpret |

**A gap is a small dot on the baseline and is never labelled.** Not "missed",
not "no data", not a broken line. The screen says *"Blank days are just
blank"* once, in words, and then leaves them alone.

**The drawing is `aria-hidden` and replaced by a real list** of day → word.
A screen reader user gets the same facts as everyone else, rather than a
summary somebody wrote about the chart.

### Chart.js versus hand-written SVG — decided

**Hand-written SVG.** Three reasons, ascending:

1. ~60KB for a drawing this app can do in 80 lines.
2. It would be the first runtime dependency in the codebase, and "zero
   runtime dependencies" is what makes the offline promise absolute rather
   than aspirational.
3. **Decisively:** every chart library exists to make trends legible. Its
   defaults are axes, gridlines, tooltips with values, and a line through the
   points — and every one of those is a thing this chart must not have. The
   library would be fought at every step and would win eventually, because
   one day somebody would enable a default because it looked better.
   **Eighty lines that cannot draw a trend line are safer than a library
   configured not to.**

The garden and Mika are hand-drawn SVG for the same reason and it has now
worked three times.

### The report — where counts become allowed

Everywhere else in the app a count is forbidden. Here they appear. The
exception rests on three conditions, and **all three must hold**:

1. **The audience is different.** It is written for a clinician in a
   consultation the person chose to attend. "Eleven of the last thirty days"
   is the difference between a bad fortnight and a bad quarter.
2. **It is deliberate.** Nobody arrives by scrolling. You go to Me and press
   a button that says it is for an appointment.
3. **It is not ambient.** Not on a tab, not on Today, and nothing links to it
   from a flow used while struggling.

**If a future change breaks any one of those** — a shortcut from Today, a
summary card in Feelings, a notification — the numbers stop being defensible
and must come out.

### What the report deliberately excludes

**Everything the person wrote to Mika.** Those are private disclosures made
to an app that promised nobody was reading them, and putting them on a page
addressed to a clinician would break that promise in the one place it matters
most.

The report says so on the page: *"What was written privately is not included
here, on purpose. Please ask instead."* — so a clinician knows the omission
is a design decision rather than missing data.

**Nothing leaves the device.** No upload, no share sheet, no email, no cloud.
It is printed, or shown on the screen. The decision about who reads it stays
entirely with the person.

---

## 5 · Assets

**Nothing new.** The ribbon is drawn SVG using the existing mood palette.

---

## 6 · Animations

**None.** This is the first module that adds no motion at all. A chart that
animates in draws the eye to a change that is not news, and the body log is
not a screen anybody should be enjoying.

---

## 7 · Accessibility

| Requirement | How it is met |
|---|---|
| The chart | `aria-hidden`, with a real `<ul>` of day → word beside it |
| Sensation chips | `aria-pressed` toggles, 48px, plain words |
| The standing line | Ordinary text in the reading order, on every state |
| The cap | Announced as text, never only as a disabled control |
| Colour | The mood scale is separated by luminance as well as hue |
| Print | Survives a black-and-white printer |
| 320px | No overflow on `/body`, `/feelings` or `/report` |

---

## 8 · Error handling

| Failure | What the user sees |
|---|---|
| Storage unreadable when checking the cap | The picker, not an error. Trouble never blocks noticing. |
| The entry cannot be saved | The cap screen, which is honest — nothing was recorded |
| The report cannot read a store | That section shows its empty line, not an error |

---

## 9 · Testing checklist

### A · Automated — 57 of 57 passing

`python3 tests/verify-module6.py`, plus Modules 2–5 re-run.

Covers: the log reachable from Feelings; 15 sensations in 4 regions; **the
standing line on every state**; **no interpreting language anywhere**; no
clinical vocabulary; no severity control; **no past entries on the screen**;
the save action not existing until something is chosen; migration v5; **one
record holding several sensations**; the note kept verbatim; **no severity,
scale, duration, cause, category or sentiment stored**; no interpretation
after saving; **no breathing exercise pushed after a physical symptom**;
noticing earning no growth; three moments allowed; the fourth refused;
**the cap message being about the app**; nothing written past the cap; one
mark per day; blank days drawn; **no trend line, one baseline, no numeric
axis**; no verdict language; a gap never called a miss; the text equivalent
matching the marks; the report reachable only from Me; **the report stating
what it is not**; the day count present; private writing excluded and said
so; print hiding the nav and buttons and printing on white; Bahasa Malaysia;
and no overflow at 320px.

### B · By hand (10 minutes)

1. Feelings → Something in my body. Pick two things. Add a note. Save.
2. Do it twice more, then try a fourth. Read the message carefully — does it
   sound like the app stopping, or like you being told off?
3. Feelings → look at the ribbon. Cover the words. **Does it look like it is
   telling you how you are doing, or like it is showing you what you said?**
   If the former, something is wrong.
4. Me → Something for an appointment → Print or save as PDF. Print it.
5. Read the printed page as if a patient handed it to you in clinic. Is the
   header enough for you to know what you are holding?

### C · Clinical review — the parts that need you

1. **The 15 sensations.** Are these the words your patients actually use? Is
   anything missing that comes up weekly at Hospital Sultanah Aminah? Is
   anything here that would frighten someone to see written down?
2. **The daily cap of three.** Right number, or too few for a genuinely bad
   day? This is a judgement call and I have no data for it.
3. **The standing line.** It has to survive being read fifty times without
   becoming wallpaper, and still be there the once it matters.
4. **The report header.** Would it satisfy a colleague that this is not a
   clinical instrument?
5. **The Bahasa Malaysia sensation words** — same native-speaker review as
   everything else.

---

## 10 · Future extension points

| Where | What plugs in | Module |
|---|---|---|
| `report.view.js` | a chosen date range instead of a fixed 30 days | 7 |
| `report.view.js` | export as a file rather than print | 7 |
| `symptom.repo.js` | worry postponement on a noted sensation | — |
| `MoodRibbon.js` | a longer window, if a clinician asks for one | — |

**Permanently excluded:** a severity slider · a symptom frequency count · a
"most common symptom" · correlating symptoms with mood · a trend line on any
chart · any statement about what a sensation means.

---

## 11 · Deploying

**This update changes the database schema (v4 → v5)** — the migration runs
automatically and adds an empty store; nothing existing is touched.

Same as before: replace the files, commit, then close the app completely on
your phone and reopen it.
