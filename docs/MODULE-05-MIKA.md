# Module 5 — Mika, the Emotional Companion

**Status:** complete · **Version:** 1.4.0 · **Date:** 17 August 2026
**Verification:** 69 of 69 new checks passing · Modules 2, 3 and 4 re-run clean (32/32, 40/40, 44/44)

> ## ⚠ ONE THING MUST HAPPEN BEFORE REAL USERS SEE THIS
>
> `core/safety/risk-phrases.js` contains a **developer's draft** of the phrase
> list that triggers the crisis offer. It has not been reviewed by a clinician
> or by a native Bahasa Malaysia speaker.
>
> The module is safe to run, test and demonstrate. It must not be given to a
> patient until that review has happened, and the file says so in its own
> header. See §9C.

---

## 0 · Overview

Mika holds what you cannot put down.

A small translucent mound that lives in the garden, breathes at the app's own
therapeutic pace, and takes anything you write without flinching. It is not a
pet, not a therapist, not a chatbot, and not a friend who is disappointed in
you.

### What is now live

| Area | What shipped |
|---|---|
| **Mika** | Five growth stages, six states, drawn SVG, ambient life |
| **The flow** | Seven screens: arrive, tell, hand over, be received, next step, quiet, ending |
| **Microcopy** | ~190 human-written bilingual lines. Nothing generated. |
| **Response selector** | Picks one sentence from the *shape* of what happened |
| **Storage** | `thoughts` store (migration v4) and a **fenced** single-record delete |
| **Holding** | "What Mika is holding" — take it back, or let it go with undo |
| **Risk path** | On-device phrase recognition, in memory only, never stored |
| **Integration** | Mika in the garden · Today zone 4 after a Heavy check-in · Feelings |

### The one-sentence test

> **If Mika ever makes the user feel they owe it something, the feature has
> failed.**

Everything below is downstream of that sentence. Mika has no needs, no hunger,
no unread state, and no behaviour that happens while you are away. It is
identical on day 1 and day 400.

---

## 1 · Folder structure

```
prc-app/
├── sw.js                                    CACHE → prc-v1.4.0-module5
│
├── core/
│   ├── components/Mika.js              NEW  the character
│   ├── content/mika-lines.js           NEW  every sentence Mika can say
│   ├── safety/risk-phrases.js          NEW  ⚠ needs clinical sign-off
│   └── storage/
│       ├── db.js                            + a FENCED remove()
│       ├── migrations.js                    v4 — the thoughts store
│       └── repositories/thought.repo.js NEW
│
├── features/
│   ├── mika/mika.view.js               NEW  the seven screens
│   ├── mika/response-selector.js       NEW  pure, shape-only
│   ├── holding/holding.view.js         NEW  what Mika is holding
│   ├── today/today.view.js                  zone 4 can now offer Mika
│   ├── feelings/feelings.view.js            a way into the holding screen
│   └── garden/garden.view.js                Mika lives in the garden
│
└── styles/
    ├── 02-base/reset.css                    + the [hidden] fix (see §3)
    ├── 03-components/mika.css          NEW
    └── 04-features/mika.css            NEW
```

---

## 2 · HTML

**No change to `index.html`.** The pinned CSP hash is untouched.

The `<textarea>` in the Mika flow is the first real text input in the app. It
carries `spellcheck="false"`, `autocapitalize="none"` and `autocorrect="off"`
— the app does not tidy what someone writes about their own life.

---

## 3 · CSS — and a real bug this module found

### The `[hidden]` fix

`styles/02-base/reset.css` gained one line:

```css
[hidden] { display: none !important; }
```

Browsers style `[hidden]` in their *user-agent* stylesheet, which is the
weakest possible source. Any class that sets `display` beats it — and this app
has several (`.btn--full { display: flex }`, `.u-stack-sm { display: flex }`).
So `node.hidden = true` silently did nothing on those elements.

**What that actually caused, in shipped code:**

- The crisis numbers inside the check-in's care card were visible from the
  moment the card appeared, so **"See the numbers" had nothing to reveal.**
  That has been live since Module 2.
- Mika's "Let Mika hold this" button was on screen with an empty field — the
  exact state the design says cannot exist.

Neither failed loudly. Both were invisible in code review *and* invisible in a
passing test suite, because a thing being **more** visible than intended
breaks no assertion anyone thinks to write. Module 5's suite now asserts the
button's absence explicitly.

### Mika's size on its own screen

The stage sizes in `Mika.js` (40px → 76px) are sizes for Mika standing in the
*garden*, among plants, at a glance. On its own screen — where it is the only
thing present — that read as lost rather than small. `mika.css` scales the
same five steps by the same factor, so the growth from stage 1 to stage 5 is
exactly as proportionate as it is in the garden. Nothing about the drawing
changes.

---

## 4 · JavaScript

### The character

| Element | Specification |
|---|---|
| Silhouette | A soft asymmetric mound. Never an animal, never a face on legs. |
| Material | Translucent — `mika` is the Malay word for the clear acetate sheet on a bound report |
| Eyes | Two dots. No eyelashes, no eyebrows, no whites. |
| Mouth | **Absent at rest.** A permanent smile reads as performance. |
| Contact | Always touching the ground. Floating reads as anxious. |
| Breathing | **12 seconds** — the app's own 4-2-6 cycle, never mentioned |
| Core pulse | **4 seconds**, deliberately out of phase with the breathing |
| Blink | Every 4–7s, randomised, double 14% of the time |

**The two rhythms are the point.** Breathing at 12s and the core glowing at 4s
drift in and out of sync, and that drift is what makes something read as alive
rather than as a loop. A single looped animation reads as a GIF.

**The emotional range is six states and six is the ceiling.** There is no sad
state, no worried state and no disappointed state. A companion that looks
upset when you are upset hands you a second person to take care of, at the
moment you have least capacity for it.

### A specification conflict, resolved

§7.1 lists the mouth as present in "content, comforting and happy". The state
table in §7.3 says comforting has "mouth absent". **The state table wins** —
it is the more specific statement, and a smile while comforting someone after
a heavy disclosure would be exactly wrong. Noted in the code at the point of
the decision.

### The response selector

It reads the **shape** of what happened. It never reads the **content**.

| Signal | What it indicates |
|---|---|
| Character count | One word vs a paragraph — very different acts |
| Time in the field | A long pause before writing suggests difficulty |
| Deletion ratio | Heavy rewriting suggests shame or precision-seeking |
| Today's check-in | Heavy or Very heavy shifts the whole set |
| Entry point | Anger, overthinking and numb need different registers |
| Hour | Late-night responses are quieter |

**The function has no parameter for the text.** That is enforced by the
signature, not by discipline — there is nothing a future developer could look
at even if they wanted to. It is a pure function, so the most emotionally
loaded decision in the app is trivially unit-testable, which is the only
reason to trust it.

Buckets: `light` · `medium` · `heavy` · `veryHeavy` · `quiet`.

### The seven screens

| # | Screen | What matters |
|---|---|---|
| 1 | Arrival | **The screen quiets first, then Mika arrives.** Reversed, it reads as an interruption. |
| 2 | The field | Mika's gaze is **averted** while you write. No counter, no prompt, no tags. |
| 3 | The gathering | 7.2s, skippable by a tap **anywhere**. Nothing is eaten, burned or deleted. |
| 4 | Received | One sentence, then **2.4 seconds of silence**. |
| 5 | Next step | Three options max; the third is always the exit. |
| 6 | Quiet mode | A complete outcome. Nothing is asked, ever. |
| 7 | Ending | Four beats. Never "Done". |

**The 2.4-second silence is load-bearing.** It will feel too long in a design
review. An immediate next-step prompt turns being heard into a transaction.

**Quiet mode exists because a significant proportion of users** — in
depressive episodes and dissociative states — will open this and be unable to
produce words. Making that a supported outcome rather than an abandonment is
the difference between a feature that serves this population and one that
serves only its articulate members.

### Managed timers

This flow is built almost entirely out of delays: a 600ms line stagger, a 7.2s
gathering, a 2.4s silence, a 3.2s ending. Every one of them now goes through
one `later()` helper and one cancel list.

Found during testing: a timer surviving a navigation could fire a render call
against a screen the user had already left, wiping whatever they opened next.
Module 3 learned the same lesson with the breathing pacer.

### Growth is for arriving

Writing a paragraph, writing one word, sitting in quiet mode writing nothing,
and opening Mika then leaving after ten seconds **all produce the same
growth** — once per local day.

Contingent reward makes the reward a verdict on performance, and on a day when
someone can do nothing, a performance-contingent companion delivers that
verdict precisely when it is least survivable.

The once-a-day cap exists so the garden rewards *showing up* rather than
*app-opening*: twelve visits in an evening are greeted warmly twelve times and
grow the garden once.

### The fenced delete

Until this module there was no way to delete a single record from anywhere,
and that absence was load-bearing — it is the mechanism enforcing the growth
ledger's append-only rule.

Module 5 broke the tie: a person's own written thoughts must be deletable,
because if you cannot take something back, handing it over is a loss rather
than a loan, and nobody hands anything over under those terms.

So `db.remove()` exists and is **fenced**:

```js
const DELETABLE = Object.freeze(['thoughts']);
```

It refuses every other store by returning an `Err`, not by throwing, so a
mistake shows up in a test rather than at runtime. **Adding `growth` to that
array would silently undo the single most load-bearing product decision in the
app.** Verified automatically, at runtime, in three suites.

---

## 5 · Assets

**Nothing new.** Mika is drawn SVG built from the existing palette. The module
adds roughly 48 KB of JavaScript and CSS.

---

## 6 · Animations

| What | Duration | Notes |
|---|---|---|
| Screen quiets | 600ms | before Mika appears, never after |
| Ambient breathing | 12,000ms | the app's own therapeutic cycle |
| Core pulse | 4,000ms | deliberately out of phase |
| Sway | 6,000ms | inherited from the garden plants |
| Blink | 180ms | every 4–7s, randomised |
| Line arrival | 520ms | one line at a time, 600ms apart |
| The gathering | 7,200ms | skippable at every frame |
| Comforting lean | 1,600ms | 6°, held, returned |
| Quietly glad | 900ms × 2 | growth only — **never after a heavy hold** |

### Reduced movement

| Removed | Kept |
|---|---|
| Sway, hops, the comforting lean, leaf travel | **Ambient breathing at 12s** |
| The screen-quiet fade, line rises | Blinking, at half frequency |
| | The core pulse |

**The breathing stays.** It is therapeutic content, not decoration, and the
design language's motion exception covers exactly this case. The
reduced-motion gathering is 1.6s of cross-fade with no travel at all, and the
meaning survives entirely — verified automatically.

---

## 7 · Accessibility

| Requirement | How it is met |
|---|---|
| Mika's presence | Announced **once** on arrival, never again |
| Ambient motion | `aria-hidden` — it never produces an announcement |
| The gathering | Two polite announcements: gathering, then held. **Not one per leaf.** |
| The risk card | `role="region"`, `aria-live="polite"` — **never assertive** |
| Skipping | A tap **anywhere**; no precise target for someone with a tremor |
| Typing difficulty | One word is explicitly enough; quiet mode needs no input |
| Meaning | Every state Mika expresses is also carried by text |
| 320px | No overflow, verified |

**Mika is never the only channel for meaning.** A user who never perceives the
character loses nothing functional.

---

## 8 · The risk path

**Read `core/safety/risk-phrases.js` in full before touching any of it.**

### It is not screening

The app never *asks*. But when a person has *volunteered* something,
responding is not screening — it is the minimum decency of having been told.
An app that reads "I don't want to be here anymore", animates a leaf, and
replies "Got it" has failed that person in a way that is very hard to defend.

| Screening — still prohibited | Responding — this module |
|---|---|
| The app asks about risk | The user volunteers something |
| A score is produced | Nothing is scored or classified |
| The result is recorded | No flag survives the screen |
| Implies monitoring | States plainly nobody is watching |

### What it technically is

A short array of strings and a substring match, on the device, in memory. No
model, no inference, no network call. The CSP pins `connect-src 'self'`, so
the browser itself would refuse to send it anywhere.

### The critical design decision

**The normal flow is not interrupted, aborted or replaced. Mika still takes
the thought, and the gathering runs in full.** Refusing it, or swapping in a
warning screen, communicates *what you said is too much* — the precise message
that stops people disclosing.

### What never happens

Never red. Never a modal. Never a warning icon. Never the words "detected",
"flagged", "concerning" or "crisis". Never "are you safe?". Never a
notification to anyone. Never a stored flag. Never a repeat within the cap.
**Never a worried expression on Mika** — it does not mirror distress.

All of these are asserted automatically.

### Honest limitations

- **It misses most genuine risk.** People rarely write it plainly, and they
  use idiom, metaphor and languages this list does not cover. The mitigation
  is structural: the crisis numbers are reachable in two taps from anywhere,
  whatever anyone writes. **Detection is a supplement. It is never the safety
  net.**
- **False positives will occur** — song lyrics, quoting someone, dark humour,
  describing a past state. Covered by the line *"If that's not where you are,
  that's alright too."*
- **This is not clinical risk assessment** and must never be described as
  such, internally or externally.

---

## 9 · Testing checklist

### A · Automated — 69 of 69 passing

`python3 tests/verify-module5.py`, plus Modules 2–4 re-run.

Covers Mika being drawn and `aria-hidden`; the nav hidden; the greeting
arriving a line at a time; three ways forward; **no game or guilt vocabulary**;
migration v4; growth for arriving and **not** for a second visit the same day;
the field with no counter; **the hand-over button not existing until something
is written**; 6–14 leaves; **the thought saved before the animation ends**; no
risk flag on the record; skip-anywhere; one sentence; **Mika never quoting what
was written**; no buttons during the silence; quiet mode as a real
destination; the ending never saying "Done"; **Mika absent from /calm, /ground
and /crisis**; the holding list with no counter; the text exactly as written;
take-back not deleting; **the delete fence refusing growth and permitting
thoughts**; the gathering not shortened on the risk path; the risk card not
being a modal, being polite-announced, offering five real numbers, never using
the forbidden words, never asking a risk question; **nothing about the match
stored**; the in-session frequency cap; the selector's five buckets and its
inability to see text; Today's zone 4 for Heavy and Very heavy; Mika in the
garden at a 48px target; reduced motion stopping the sway while **keeping the
breathing**; Bahasa Malaysia with no "anda"; and no overflow at 320px.

### B · By hand, on a real phone (15 minutes)

1. Garden → tap Mika. Watch it for thirty seconds without doing anything. It
   should feel present, not idle-looping.
2. Write one word and hand it over. Then write a long paragraph on another
   day. The response should differ in register without ever referring to what
   you wrote.
3. Tap during the gathering. It should finish instantly.
4. Choose **Just sit here**. Stay for two minutes. **Nothing should happen.**
5. Feelings → What Mika is holding. Open a thought. Take it back. Let one go,
   then press undo.
6. Me → Reduce movement → On. Open Mika. **It must still breathe.**
7. Check in as Heavy on Today. The button should offer Mika.
8. Turn on TalkBack or VoiceOver. Mika should be announced once, and the
   gathering twice — not once per leaf.

### C · Clinical review — REQUIRED before any real user

1. **The risk phrase list.** Clinician plus native BM speaker. Precision over
   recall. This is a release blocker and the file says so.
2. **The risk response copy.** Any change requires clinical sign-off.
3. **The ~190 lines in `mika-lines.js`.** Particularly the *heavy* and *very
   heavy* sets — those are what someone reads at 3am after writing the hardest
   thing they have written all year.
4. **The name.** Confirm with 8–10 Malaysian users that the acetate
   association reads as warm rather than odd. The visual identity survives a
   rename intact.
5. **The 2.4-second silence.** Test it with users, not reviewers. Reviewers
   will say it is too long.

---

## 10 · Future extension points

| Where | What plugs in | Module |
|---|---|---|
| `migrations.js` v5 | `symptoms` store | 6 |
| `mika.view.js` | voice-note holding — the waveform becomes the leaf | — |
| `Mika.js` | weather and seasonal light in the scene | — |
| `holding.view.js` | worry postponement — "come back to this on Thursday" | 6 |
| `mika-lines.js` | the anger, overthinking and numb entry sets are written but not yet routed | 6 |

**Permanently excluded**, and these are not backlog items: Mika asking the
user to come back · reacting to absence · having needs, hunger or mood decay ·
skins, accessories, currency or a shop · comparison to other users ·
expressing sadness, worry or disappointment · sending anything the user wrote
anywhere, for any reason.

---

## 11 · Deploying

Same as before. **This update changes the database schema (v3 → v4)** — the
migration runs automatically and adds an empty store; nothing existing is
touched.

Close the app completely on your phone and reopen it once after deploying.
