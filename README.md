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

## Outstanding assets

Two font files. See `docs/MODULE-01-FOUNDATION.md` §5 for step-by-step
instructions. The app runs correctly without them, in the system fallback.

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
| 2 | Component library, storage layer, mood check-in | Not started |
| 3 | Breathing, grounding, Calm Mode, crisis | Not started |
| 4 | Behavioural activation, garden | Not started |
| 5 | Mika | Not started |
| 6 | Symptoms, history, charts | Not started |
| 7 | Export, reminders, optimisation | Not started |
