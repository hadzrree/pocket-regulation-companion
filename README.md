# Pocket Regulation Companion

A free, offline-first Progressive Web App that supports emotional regulation
between therapy sessions. Designed by an Occupational Therapist.

**Not a medical device. Not a diagnostic tool. Not a treatment.
Not a monitored service.**

---

## Run it locally

You need [Node.js](https://nodejs.org) only for the local server — the app
itself has zero dependencies.

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open the URL it prints. **Do not open index.html directly** — `file://`
blocks ES modules and service workers.

## Deploy

Push to GitHub, then **Settings → Pages → Deploy from a branch → main → /(root)**.

**Every path in this codebase is relative.** There is no leading `/` anywhere.
GitHub Pages serves from a sub-path, and a leading slash resolves to the domain
root instead. This one rule prevents most PWA-on-Pages failures.

## If you change any CSS

The six numbered style layers are concatenated into `styles/app.css`, which is
the only stylesheet the app loads. After editing a layer file, run:

```bash
python3 tools/build-css.py
```

`styles/main.css` still decides the cascade order — it is the source of truth
and the build script reads it. `styles/app.css` is generated output; editing it
directly works until the next build and is then thrown away. The Module 7 test
suite fails if the two have drifted, so forgetting is loud rather than silent.

## Documentation

The six governing specifications live in `docs/`. They are the source of truth
and this code follows them:

1. Clinical Framework — what the app may do therapeutically
2. UX Strategy — how that becomes journeys
3. Design Language — how journeys look and move
4. Mika Specification — the emotional companion
5. Software Architecture — how it is built
6. Product Requirements — what gets built, in what order

**Where a technical convenience conflicts with a clinical rule, the rule wins.**

## Build status

| Module | Scope | Status |
|---|---|---|
| 1 | Foundation, PWA, tokens, navigation, accessibility, bilingual | ✅ Complete |
| 2 | Component library, storage layer, mood check-in | ✅ Complete |
| 3 | Breathing, grounding, Calm Mode, crisis | ✅ Complete |
| 4 | Behavioural activation, garden | ✅ Complete |
| 5 | Mika, the emotional companion | ✅ Complete |
| 6 | Body log, mood history, report for an appointment | ✅ Complete |
| 7 | Backup, restore, delete, accessibility audit, offline, release | ✅ Complete |

**Version 1.6.0.** 304 automated assertions passing; 108 page states audited
with axe-core, zero violations; every route verified with the network
disconnected.

## Before anyone is given this app

The software is finished. It is **not** clinically signed off, and the
difference matters. Read **`docs/RELEASE-READINESS.md`** — it lists five items
that need a named clinician to read the actual words, the most important being
the risk-phrase list in `core/safety/risk-phrases.js`, which is currently a
developer's draft.

## Verifying a build

```bash
python3 -m http.server 8099 --bind 127.0.0.1 &
python3 tests/verify-module7.py      # and module2..6
python3 tests/verify-a11y.py
python3 tests/verify-offline.py
```

Requires Playwright and Chromium.

## Outstanding assets

App icons are generated placeholders. See `docs/ASSETS.md`.
