# Module 7 — Your Data, Accessibility, Offline, Release

**Version 1.6.0** · Built 18 August 2026 · The final implementation module.

---

## 1. Overview

Module 7 is the module that can lose people's data. Every module before it only
ever added records. This one writes a file to the phone's Downloads folder,
merges a file back into the database, and — on request — destroys everything.

It also closes the four things that were deferred with the words "Module 7":
the accessibility audit, the offline proof, the performance measurement, and
the release documentation.

| # | Deliverable | What it is |
|---|---|---|
| 1 | **Your data screen** (`/data`) | Take a copy · Put one back · Delete everything |
| 2 | **Backup engine** (`core/storage/backup.js`) | Build, parse, merge-restore, destroy |
| 3 | **Accessibility audit** | axe-core over 108 page states, 4 modes; violations fixed, not reported |
| 4 | **Offline proof** | Network disconnected, every route walked, 22 assertions |
| 5 | **Performance work** | Stylesheet delivery rebuilt on measured evidence |
| 6 | **Release version** | One source of truth for the version number, shown in the Me tab |

### The two rules that govern this module

Both are written at the top of `core/storage/backup.js` and both are enforced
by tests, not by discipline.

**1. What Mika holds is a separate, explicit choice.**
The `thoughts` store is excluded from a backup unless the person ticks a box on
that screen, for that file. These are the only free-text disclosures in the
app; they were written to something that said *nobody reads this*; and a backup
file lands in a Downloads folder shared with a file manager, a cloud sync, and
whoever else uses the phone.

**2. A restore never overwrites and never deletes.**
It adds what is missing and leaves everything already on the device exactly as
it was. The realistic bad case is somebody restoring a three-month-old file
onto a phone that already holds three newer weeks. "Replace" destroys those
weeks silently. "Merge" cannot. The only cost is that a duplicate day keeps the
version already on the phone — which is also the newer one.

A useful side effect: merge-restore is safe to run twice, and a person who is
not sure whether it worked *will* run it twice.

---

## 2. Folder structure

Files added or changed in this module.

```
prc-app/
├── index.html                        CHANGED  links styles/app.css
├── offline.html                      CHANGED  same
├── sw.js                             CHANGED  v1.6.0, one stylesheet, new files
├── app/
│   ├── version.js                    NEW      the release number, one place
│   └── routes.js                     CHANGED  adds /data
├── core/
│   ├── storage/
│   │   └── backup.js                 NEW      build · parse · restore · destroy
│   └── i18n/locales/
│       ├── en.js                     CHANGED  data.* and me.* blocks
│       └── ms.js                     CHANGED  the same keys, in Bahasa Malaysia
├── features/
│   ├── data/
│   │   └── data.view.js              NEW      the Your data screen
│   ├── me/me.view.js                 CHANGED  name, haptics, data link, version
│   ├── panic/calm.view.js            CHANGED  screen-reader heading
│   ├── ground/ground.view.js         CHANGED  screen-reader heading
│   └── mika/mika.view.js             CHANGED  screen-reader heading
├── styles/
│   ├── main.css                      CHANGED  now the SOURCE, not the delivery
│   ├── app.css                       NEW      GENERATED — do not edit
│   ├── 01-tokens/colors.css          CHANGED  two contrast fixes
│   └── 04-features/data.css          NEW
├── tools/
│   └── build-css.py                  NEW      concatenates the layers
└── docs/
    ├── MODULE-07-DATA-AND-RELEASE.md NEW      this file
    ├── RELEASE-READINESS.md          NEW      the honest gate
    └── screenshots/                  NEW
```

---

## 3. HTML

No new HTML documents. `/data` is a hash route rendered by the existing
router, like every other screen.

Two changes to `index.html`:

| Change | Why |
|---|---|
| `styles/main.css` → `styles/app.css` | One stylesheet instead of 39. See §6. |
| Font-preload comment rewritten | It described the old @import chain, which no longer exists. A comment that describes code that is gone is worse than no comment. |

---

## 4. CSS

### `styles/04-features/data.css`

| Selector | Purpose |
|---|---|
| `.data-screen` | Screen width, cleared past the nav bar and the home indicator |
| `.data-check` | The whole opt-in row is the tap target, not a 16px square |
| `.data-check__box` | The platform checkbox, enlarged to 22px |
| `.data-file` | The platform file input, given a dashed drop-zone frame |
| `.data-file::file-selector-button` | The browser's own button, restyled to match the app |

**Two platform controls are deliberately not replaced.** A hand-drawn checkbox
has to reimplement indeterminate state, forced-colours mode and each assistive
technology's announcement, and usually gets two of the three wrong. A custom
file button has to be a `<button>` that clicks a hidden `<input>` — a pattern
that silently does nothing on several Android browsers.

**The delete card is not styled as a danger zone.** No red border, no warning
tint, no shaking. That convention comes from server administration, where the
risk belongs to the company. Here the data belongs to the person, and the risk
of deleting it is entirely theirs to take. Someone deleting a mental-health
record may be leaving an unsafe home, handing the phone on, or simply finished.
Painting their exit red tells them the app disapproves. The confirmation
carries the weight in words instead.

### Two colour tokens changed

Both were found by the audit, not by looking.

| Token | Was | Now | Measured |
|---|---|---|---|
| `--color-text-tertiary` (light) | `#8C837A` | `#756E66` | 3.7:1 → 4.9:1 on card |
| `--color-text-tertiary` (dark) | `#8F8880` | `#999189` | 4.50:1 → 5.1:1 on card |

The light value was documented as *"meta only, never sentences"*, on the common
assumption that small print is exempt. It is not: WCAG 2.2 requires 4.5:1 for
all text below 18.66px. axe flagged it on nine routes, including **every
bottom-navigation label** — which is how a person finds their way around the
app, not decoration.

The dark value is more interesting. It measured 4.50:1 on paper and 4.49:1 in
the browser, because sub-pixel rendering moves it. A value that lands exactly on
the threshold is not a pass; it is a coin toss decided by the device. It was
lifted until it had headroom.

---

## 5. JavaScript

### `core/storage/backup.js`

| Export | Returns | Notes |
|---|---|---|
| `FORMAT` | `1` | File-format version, independent of `DB_VERSION` |
| `build({includeThoughts})` | `Ok(backup)` | Five stores always; `thoughts` only on request |
| `filename(includeThoughts)` | `pocket-2026-08-18.json` | Adds `-with-writing` when it applies |
| `parse(file)` | `Ok(backup)` / `Err('bad-file')` / `Err('newer-file')` | Shape check, not a schema validator |
| `restore(backup)` | `Ok({added, kept})` | Never overwrites, never deletes |
| `destroyEverything()` | `Ok()` | Database **and** preferences |

**A correction made during this module: preferences are no longer in the file.**
An earlier draft copied the whole settings object in. Two things were wrong.
`restore()` does not apply settings and never should — silently changing
someone's theme, text size and language because they restored a backup is a
surprise, not a restore. Worse, preferences include **the name the person chose
to be called**, and the screen lists what the file contains without saying "and
your name". A file carrying an identifying detail the person was not told about
is exactly what this app exists not to do. Either the sentence changes or the
field goes. The field went.

**`parse()` is deliberately lenient.** It checks that the file is an object with
a `data` object, and that its `format` is not from the future. Nothing more. A
stricter validator would start rejecting files from a slightly older version,
which is precisely the moment a person needs it to work.

### `features/data/data.view.js`

Three cards. The download is a `Blob` and an object URL — assembled in memory
on the device and handed to the browser's own download machinery, so it works
with the phone in aeroplane mode.

The delete flow is two steps in place: the button hides, an inline
confirmation appears, and cancelling **puts the button back and moves focus to
it**. Without that focus move a screen-reader user who cancels is left on a node
that has just been removed from the document, and the reading position falls
silently back to the top of the page.

### `app/version.js`

One exported string. It exists because there is no server, no analytics and no
crash reporting — so when somebody says "it does the wrong thing", the only
available fact about which code is on their phone is the number at the bottom
of the Me tab. `verify-module7.py` asserts it matches the service worker's
cache string, because two version numbers that can disagree eventually will.

### Screen-reader headings on the three quiet screens

Calm, Grounding and Mika are deliberately almost empty — a person arriving is
panicking or overwhelmed, and a title bar is one more thing to process. But a
screen-reader user navigating by headings lands on a page with **no heading at
all** and is told nothing. Each now carries an `sr-only` `<h1>`.

It is appended to the route container, not to the view's own node, because
every state of those screens rebuilds that node with `clear()`. Inside, the
heading would survive exactly one render and then vanish — a bug that no
visual test could ever see.

---

## 6. The stylesheet was rebuilt on measured evidence

`styles/main.css` used to be what `index.html` linked, pulling in 38 layer
files with `@import`. The header carried a note from Module 1: *if first paint
ever misses target, concatenate the layers at deploy time.* Module 7 measured
it rather than assuming.

The problem with `@import` is discovery: the browser cannot ask for a single
layer file until `main.css` has arrived **and been parsed**. Every layer is
render-blocking, so the whole chain sits in front of the first pixel.

Measured on Chromium at 390×844 with gzip, matching what GitHub Pages sends:

| | @import (before) | Concatenated (after) |
|---|---|---|
| First visit, no throttling — FCP | 304 ms | **204 ms** |
| First visit, Fast 3G — FCP | 2300 ms | **1456 ms** |
| First visit, Slow 3G — FCP | 6644 ms | **4644 ms** |
| First visit, Slow 3G — CSS resolved | 6064 ms | **2955 ms** |
| **Return visit, Slow 3G — FCP** | 288 ms | **152 ms** |
| Requests on first visit | 77 | **39** |

An intermediate option — 38 `<link>` tags in `index.html` — was also built and
measured. It recovered only about a second of the two, and split the cascade
order across two files. It was discarded.

**This does not break the "no build step" rule.** That rule is about the
application: no bundler, no transpiler, no framework, nothing between the
JavaScript source and the browser. Every `.js` file is still served exactly as
written. `tools/build-css.py` concatenates text files in a listed order, and
`verify-module7.py` rebuilds `app.css` in memory and fails the suite if the
committed copy has drifted — so forgetting to run it is loud, not silent.

The layer files remain the source of truth and remain in the repository. They
are simply no longer precached, because nothing fetches them: the service worker
cache went from 110 files to 72, and stopped spending 125 KB of somebody's data
plan on files no browser will ever ask for.

---

## 7. Assets

Nothing new. Four screenshots were added under `docs/screenshots/` for the
release record.

App icons remain generated placeholders — see `docs/ASSETS.md`. They are the
one outstanding asset item and are cosmetic, not functional.

---

## 8. Animations

None added. The delete confirmation appears without a transition on purpose: an
animation on a destructive confirmation reads as the interface performing
reluctance, and this screen does not argue with the person.

---

## 9. Accessibility

### The audit

axe-core 4.13.0, injected at **test time only** via Playwright's
`add_init_script` — which is how it loads despite the app's CSP, and why the
app still ships with zero runtime dependencies.

| Pass | Coverage | States |
|---|---|---|
| `verify-a11y.py` | 13 routes × light / dark / 200% text / Bahasa Malaysia | 52 |
| `verify-a11y-states.py` | 10 routes with 14 days of seeded data, plus high-contrast mode, plus the states that only exist after a tap: the delete confirmation, the body log at its daily cap, Mika's greeting and two screens in | 56 |

Rules run: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`,
`best-practice`.

### What it found, and what was done

| Finding | Severity | Response |
|---|---|---|
| `color-contrast` — tertiary text on 9 routes, light theme | serious | Token darkened. §4 |
| `color-contrast` — tertiary text on 2 routes, dark theme, populated only | serious | Token lightened. §4 |
| `page-has-heading-one` — Calm, Grounding, Mika | moderate | `sr-only` `<h1>` added. §5 |

**Result: 108 page states, zero violations.**

The second pass exists because the first one audited every route with an empty
database — a state almost nobody is in after day two. Both of the dark-theme
findings appeared **only** with data on screen.

### What an automated audit cannot check

axe verifies roughly a third of WCAG. Still outstanding, and listed in
`RELEASE-READINESS.md`: a real screen-reader pass (TalkBack and VoiceOver),
keyboard-only navigation of the Mika flow, and testing with someone who
actually uses assistive technology.

---

## 10. Error handling

| Situation | What happens | What the person sees |
|---|---|---|
| Export fails | `build()` returns `Err`; no file is written | "Something went wrong on my side. You didn't do anything." |
| File is not ours | `parse()` returns `Err('bad-file')` | "I couldn't read that file. It might not be one of mine." |
| File is from a newer version | `Err('newer-file')` | "That file is from a newer version than this one." |
| Restore fails mid-way | Whatever was added stays added | The general error message |
| A day exists in both file and phone | The phone's copy is kept, counted in `kept` | "Put back {n} things." |
| Storage full during restore | `db.add` returns `Err`; that row is skipped, the rest continue | The count reflects what actually landed |
| Delete cancelled | Nothing is touched | The delete button returns, focused |
| Delete confirmed | Database dropped, `prc.settings` removed, app reloaded | The app opens as if new |

No error message in this module blames the person, and none uses a technical
word. `errors.general` says *"You didn't do anything"* because the intended user
will otherwise assume they did.

---

## 11. Testing checklist

### Automated — all green on 18 August 2026

| Suite | Checks | Result |
|---|---|---|
| `verify-module2.py` | 32 | 32/32 |
| `verify-module3.py` | 40 | 40/40 |
| `verify-module4.py` | 44 | 44/44 |
| `verify-module5.py` | 69 | 69/69 |
| `verify-module6.py` | 57 | 57/57 |
| `verify-module7.py` | 62 | 62/62 |
| `verify-a11y.py` | 52 states | 0 violations |
| `verify-a11y-states.py` | 56 states | 0 violations |
| `verify-offline.py` | 22 | 22/22 |
| **Total** | **304 assertions + 108 audited states** | **all passing** |

Notable assertions in `verify-module7.py`:

- an old file restored onto a phone with newer entries **keeps the newer entry**
- restoring the same file twice adds nothing the second time
- the growth ledger gains no duplicate on restore
- a plain backup contains no `thoughts` key and no `settings` key
- rubbish, foreign JSON and future-format files are each refused distinctly
- cancelling the delete leaves the record count unchanged
- deleting also removes the person's name from `localStorage`
- `app.css` still matches the layer files it was built from
- `growth` is still absent from `DELETABLE`; `thoughts` is still in it
- EN/BM key parity: **192 / 192**

### Manual — before anyone is given this app

- [ ] **Clinical sign-off on `core/safety/risk-phrases.js`** — release blocker
- [ ] Clinical review of the ~190 Mika lines, especially the heavy sets
- [ ] Clinical review of the 22 tasks and the 15 body sensations
- [ ] Native-speaker review of all Bahasa Malaysia
- [ ] Screen reader: TalkBack (Android) and VoiceOver (iOS), full pass
- [ ] Install to home screen on a real Android phone and a real iPhone
- [ ] Take a copy, delete everything, put the copy back — on a real device
- [ ] Print the report from a phone to PDF and read it on paper

---

## 12. Future extension points

| Point | Where | Note |
|---|---|---|
| Backup format v2 | `FORMAT` in `backup.js` | `parse()` already refuses future files by name, so v1 apps degrade politely |
| A new store in a backup | `ALWAYS` in `backup.js` | One line. Ask first whether it should be opt-in like `thoughts` |
| Restoring preferences | `restore()` | Deliberately absent. If ever added, it must be a separate, visible choice |
| Encrypted backup | `build()` / `parse()` | Would need a passphrase, which means a forgotten passphrase, which means a lost backup. Consider carefully |
| Concatenating JavaScript too | `tools/` | Measure first. The JS is 34 files and did not dominate any measurement |
| Sharing a report | `features/report/` | Would be the second thing that can leave the device. The same two rules apply |

---

## 13. Deploying this version

The service worker cache is `prc-v1.6.0-module7`. Uploading the files is not
enough on its own — the previous worker keeps serving the old cache until the
app is next launched, by design (`skipWaiting()` is never called, so an update
can never interrupt somebody mid-panic).

1. Upload the changed folders **one at a time**. GitHub's web uploader silently
   drops folders from a mixed select-all.
2. Confirm `sw.js` at the repository root contains `prc-v1.6.0-module7`.
3. Confirm `styles/app.css` exists in the repository. **The app will render
   unstyled without it** — it is a generated file, so it must actually be
   uploaded.
4. On the phone: close the app completely (swipe it out of the app switcher),
   then reopen. Once for the new worker to install, once more for it to take
   over.
5. Check the bottom of the Me tab. It should read **Version 1.6.0**.
