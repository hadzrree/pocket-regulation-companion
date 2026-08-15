# Module 1 — Project Foundation

**Status:** Complete, verified, awaiting approval before Module 2.
**Phase:** 1 of 7
**Delivers:** Folder structure · Manifest · Service Worker · Design Tokens · Typography · Navigation · Accessibility preferences · Bilingual scaffolding
**Verified on:** Chromium 390×844 and 320×640, offline, at 150% text.

---

## 0. Three conflicts between the tech-stack brief and the finalised Architecture

Your brief lists Chart.js, Lucide Icons and Google Fonts. The Architecture Specification (§1.6) states **zero runtime dependencies**. Rather than silently choosing, here is each one and what I did.

### 0.1 Google Fonts → **same typefaces, self-hosted**

| | |
|---|---|
| **Conflict** | A CDN request fails offline, discloses the user's IP to a third party, and is blocked by the app's own CSP (`connect-src 'self'`). |
| **Resolution** | We use the Google Fonts **typefaces** — Nunito and Inter, exactly as the Design Language specifies — served from `assets/fonts/`. Same fonts, no third-party request, works offline. |
| **Status** | Implemented. `02-base/fonts.css` declares them; **the two WOFF2 files are the one outstanding asset** (§5). Until they exist the app renders in the system fallback and looks correct, just not final. |

### 0.2 Lucide Icons → **Lucide paths, inlined as SVG**

| | |
|---|---|
| **Conflict** | The npm package is a dependency and needs a build step. |
| **Resolution** | We use Lucide's actual icon paths, inlined as SVG in `assets/icons/ui/`, at stroke-width 1.75 per the Design Language. It **is** Lucide — just not the package. |
| **Status** | Deferred to Module 2, where the first icons are needed. Module 1's nav is text-only by design. |

### 0.3 Chart.js → **decision needed before Phase 6**

| | |
|---|---|
| **Conflict** | Three problems. **Size:** ~60–200 KB against a 300 KB total budget. **Offline:** would need self-hosting, so no CDN benefit. **Clinical:** Chart.js defaults are gridlines, axis borders, tooltips and legends — the Clinical Framework §16 prohibits all four, so we would spend most of the integration switching its features off. |
| **Architecture says** | `core/charts/` — three small SVG generator functions returning markup plus a plain-text screen-reader summary, which the Clinical Framework requires and Chart.js does not produce. |
| **Status** | **Not needed until Phase 6.** No decision required now. My recommendation is the SVG generators, but this is yours to make and nothing in Module 1 forecloses it. |

### 0.4 LocalStorage without IndexedDB — noted, not yet a conflict

Your brief lists LocalStorage. The Architecture (§6.1) requires **both**: localStorage for preferences (must be readable *before* first paint to avoid a theme flash) and IndexedDB for user-created data (5 MB limit, synchronous blocking during animation, string-only storage).

**Module 1 only needs preferences, so only localStorage is used.** IndexedDB arrives in Module 2 with the storage layer. Flagging it now so it is not a surprise.

---

## 1. Module Overview

Module 1 delivers a **running, deployable, installable, offline-capable application shell**. It is not a mock-up. You can put it on GitHub Pages today, add it to a phone's home screen, turn on aeroplane mode, and it still works.

**What it does:**
- Boots in the correct theme with no flash of the wrong colour
- Routes between five tabs with a fade transition
- Applies four accessibility preferences live, and remembers them
- Switches the entire interface between English and Bahasa Malaysia
- Registers a service worker that precaches the shell
- Works completely offline after the first visit
- Requests persistent storage, to reduce the risk of iOS eviction

**What it deliberately does not do yet:** any clinical feature. No check-in, no breathing, no tasks, no crisis path. Those are Modules 2–4, and building the shell first means each of them is developed against real accessibility settings rather than retrofitted.

### Why accessibility settings ship in Module 1

They are a clinical requirement, not a feature (Clinical Framework §14). If the rest of the app is built against one text size and one contrast level, retrofitting never fully works — you find out at 200% that three screens clip. Shipping them first means **every subsequent module is developed with them switched on**.

---

## 2. Folder Changes

```
pocket-regulation-companion/
├── index.html                    NEW  the only HTML file
├── manifest.webmanifest          NEW  PWA manifest, all paths relative
├── sw.js                         NEW  service worker (MUST be at root)
├── offline.html                  NEW  fallback, rarely seen
├── 404.html                      NEW  GitHub Pages → back into the app
├── .nojekyll                     NEW  stop Pages ignoring _underscore files
│
├── assets/
│   ├── fonts/                    NEW  (empty — see §5)
│   ├── icons/
│   │   ├── favicon.svg           NEW
│   │   └── app/                  NEW  192, 512, maskable, apple-touch, shortcut
│   ├── illustrations/            NEW  (empty, Module 4)
│   └── audio/                    NEW  (empty, Module 7)
│
├── styles/
│   ├── main.css                  NEW  the ONLY linked stylesheet
│   ├── 01-tokens/  (7 files)     NEW  colours, type, spacing, radius,
│   │                                  shadows, motion, layout
│   ├── 02-base/    (4 files)     NEW  reset, fonts, elements, a11y
│   ├── 03-components/            NEW  nav-bar.css
│   ├── 04-features/              NEW  transitions.css, settings.css
│   ├── 05-utilities/ (2 files)   NEW  layout, text
│   └── 06-print/                 NEW  (empty, Module 7)
│
├── app/
│   ├── main.js                   NEW  boot sequence
│   ├── router.js                 NEW  hash routing + view lifecycle
│   ├── routes.js                 NEW  route table
│   └── register-sw.js            NEW  SW registration + persistence
│
├── core/
│   ├── store/       (2 files)    NEW  store.js, initial-state.js
│   ├── events/bus.js             NEW  frozen event list
│   ├── a11y/        (2 files)    NEW  prefs.js, announce.js
│   ├── i18n/        (3 files)    NEW  i18n.js, locales/en.js, locales/ms.js
│   ├── utils/       (4 files)    NEW  dom, result, id, date
│   ├── storage/                  NEW  (empty, Module 2)
│   ├── components/               NEW  (empty, Module 2)
│   ├── animation/                NEW  (empty, Module 3)
│   ├── charts/                   NEW  (empty, Phase 6)
│   └── safety/                   NEW  (empty, Module 3 — crisis resources)
│
├── features/       (5 views)     NEW  today, regulate, feelings, garden, me
├── data/                         NEW  (empty, Module 4)
├── tests/                        NEW  unit / e2e / manual
└── docs/                         NEW  this file
```

**37 files created.**

---

## 3. Files Created

Full source is in the repository. Each file opens with a header stating its purpose, dependencies and the specification section it implements.

### Entry point

| File | Purpose | Depends on | Connects to |
|---|---|---|---|
| `index.html` | The only HTML file. Declares the shell landmarks, CSP, and the one inline script | `styles/main.css`, `app/main.js` | Everything |
| `manifest.webmanifest` | PWA metadata, icons, the "Calm me now" shortcut | icons | Browser install |
| `sw.js` | Precache the shell, serve offline, never interrupt a session with an update | — | Registered by `register-sw.js` |
| `offline.html` | Fallback if a navigation happens offline and uncached | `main.css` | `sw.js` |
| `404.html` | Redirects stray paths back into the app | — | GitHub Pages |

### Styles — six layers

| File | Purpose |
|---|---|
| `main.css` | Imports the six layers **in cascade order**. Never reorder |
| `01-tokens/colors.css` | 100+ colour tokens, light and night. Contrast-verified |
| `01-tokens/typography.css` | The type scale, all derived from `--font-scale` |
| `01-tokens/spacing.css` | The 4 px grid |
| `01-tokens/radius.css` | Nothing has a sharp corner |
| `01-tokens/shadows.css` | Warm-tinted, never black |
| `01-tokens/motion.css` | Durations and easing. No component may invent one |
| `01-tokens/layout.css` | Touch targets, safe areas, z-index scale |
| `02-base/reset.css` | Minimal, opinionated |
| `02-base/fonts.css` | Self-hosted `@font-face` |
| `02-base/elements.css` | Bare element defaults |
| `02-base/a11y.css` | Focus ring, `.sr-only`, skip link, and the four preference modes |
| `03-components/nav-bar.css` | Five-tab bottom navigation |
| `04-features/transitions.css` | Page fades |
| `04-features/settings.css` | Preference groups |
| `05-utilities/layout.css` | `.u-stack`, `.u-row`, `.u-screen` … |
| `05-utilities/text.css` | `.t-h1`, `.t-body`, `.t-caption` … |

### Application layer

| File | Purpose | Key decision |
|---|---|---|
| `app/main.js` | Boot sequence, global error handling, nav construction | Error handler is **gated on `inDistressFlow`** |
| `app/router.js` | Hash routing, view lifecycle, transitions | Calls `unmount()` before every navigation |
| `app/routes.js` | Route table with lazy `import()` | Only Today loads at boot |
| `app/register-sw.js` | SW registration and `storage.persist()` | **Never calls `skipWaiting()`** |

### Core

| File | Purpose | Key decision |
|---|---|---|
| `core/store/store.js` | ~50-line observable store | Persisted data is **not** mirrored here |
| `core/store/initial-state.js` | The exact shape of state | `inDistressFlow` documented as safety-critical |
| `core/events/bus.js` | Cross-feature pub/sub | Event list **frozen** — a typo throws |
| `core/a11y/prefs.js` | Load, apply and persist preferences | The only code touching `data-*` on `<html>` |
| `core/a11y/announce.js` | The single aria-live region | **Always polite, never assertive** |
| `core/i18n/i18n.js` | `t(key)` lookup | Missing keys return the key and warn |
| `core/i18n/locales/en.js` | Every English string | Copy rules in the header |
| `core/i18n/locales/ms.js` | Every BM string | **"awak", never "anda"** |
| `core/utils/dom.js` | `el`, `safeText`, `on`, `once` | **The XSS boundary** |
| `core/utils/result.js` | `Ok` / `Err` | Storage never throws |
| `core/utils/id.js` | UUID | Identifies a record, never a person |
| `core/utils/date.js` | **Local**-date handling | UTC would break three clinical rules |

### Features

| File | Scope in Module 1 |
|---|---|
| `features/today/today.view.js` | Zone 1 (greeting) live; zones 2–4 marked with comments |
| `features/regulate/regulate.view.js` | Placeholder |
| `features/feelings/feelings.view.js` | Placeholder |
| `features/garden/garden.view.js` | Placeholder with the day-one empty state |
| `features/me/me.view.js` | **Fully live** — all four preferences and language |

---

## 4. Design Decisions Explained

### 4.1 Every path is relative. No leading `/` anywhere.

On GitHub Pages the app is served from `https://user.github.io/repo-name/`. A leading slash resolves to the **domain** root. This single mistake causes the blank-screen-after-deploy failure, the missing manifest, and a service worker that registers but controls nothing. One rule prevents all of it, and it costs nothing if you later move to a custom domain.

### 4.2 The one inline script, and why the CSP hash matters

`index.html` contains the only inline script in the application: it reads saved preferences from localStorage and applies them to `<html>` **before the first paint**. Reading them from IndexedDB is impossible — it is asynchronous, so a night-mode user would see a flash of white first. At 3 a.m., for the intended user, that is a bright white screen in a dark room.

The CSP pins that script by SHA-256 hash rather than allowing `'unsafe-inline'`.

> ⚠️ **Maintenance hazard.** If you edit that script — even the whitespace — the hash no longer matches and the browser silently refuses to run it. The app still works (the theme is re-applied by `prefs.init()`), so **nothing looks broken except the flash returns**. If you change it, open DevTools Console; the error names the correct new hash. Paste it into the CSP. This is in the testing checklist.

### 4.3 The service worker never calls `skipWaiting()`

A new version installs silently in the background and activates on the **next** launch. Activating mid-session reloads the page. If that happened during a panic session it would interrupt someone at their most vulnerable — the exact unpredictability trauma-informed design forbids. There is also no "new version available, reload now" banner, because it is an interruption with no user benefit here.

### 4.4 The error handler is gated on `inDistressFlow`

```js
if (getState().inDistressFlow) return;   // silence
```

The Clinical Framework states no error may appear during Calm Mode or the panic flow. Implementing that as one gate in one place — rather than remembering it at forty call sites — is why `inDistressFlow` lives in the store rather than being derived.

### 4.5 Dates are local, never UTC

`new Date().toISOString()` returns UTC. For a user in Malaysia (UTC+8), anything logged before 08:00 local would file under **yesterday** — silently breaking the once-daily check-in, the two-hour edit window, and the symptom-check cap. Three clinical rules, from one timezone bug. `core/utils/date.js` works in local time throughout and is on the must-unit-test list.

### 4.6 The DOM helpers are the XSS boundary

`el()` inserts string children as **text nodes**. `safeText()` uses `textContent`. There is no way to pass HTML through either. To render markup a developer must build elements explicitly — which makes the dangerous path deliberate and visible in review, rather than an accident. Combined with the CSP, this is why user-written text can be stored verbatim and rendered safely.

### 4.7 Fade transitions, never slide

Sliding implies distance and urgency. This app has neither.

### 4.8 Focus is not moved on first render

The router moves focus to `#main` on navigation, so keyboard users are not stranded at the top of the document. But **not on the initial load** — on first paint the natural focus position is the top, where the skip link lives. Stealing focus immediately would mean a keyboard user is never offered it. Found and fixed during verification.

---

## 5. Assets Required

Everything else is generated. **Two files are outstanding.**

| Asset | Status | What to do |
|---|---|---|
| `assets/fonts/nunito-variable.woff2` | ❌ Missing | See below |
| `assets/fonts/inter-variable.woff2` | ❌ Missing | See below |
| `assets/icons/app/icon-192.png` | ✅ Generated | — |
| `assets/icons/app/icon-512.png` | ✅ Generated | — |
| `assets/icons/app/maskable-512.png` | ✅ Generated | — |
| `assets/icons/app/apple-touch-icon.png` | ✅ Generated | — |
| `assets/icons/app/shortcut-calm.png` | ✅ Generated | — |
| `assets/icons/favicon.svg` | ✅ Generated | — |

### Getting the two font files — step by step

1. Go to **fonts.google.com**. Search **Nunito**. Click **Get font**, then **Download all**. Repeat for **Inter**.
2. Unzip. You want the **variable** `.ttf` — the file with `VariableFont` in its name.
3. Go to a web font converter (for example **transfonter.org**). Upload the Nunito variable `.ttf`.
4. Set format to **WOFF2**. Under subsetting, include **Latin** and **Latin Extended**. *(Latin Extended is required — Bahasa Malaysia needs it.)*
5. Convert, download, and rename the file to exactly **`nunito-variable.woff2`**.
6. Repeat for Inter → **`inter-variable.woff2`**.
7. Put both into `assets/fonts/`.
8. Open `sw.js` and add them to the `SHELL` array — there is a comment marking the spot.
9. Bump the `CACHE` string in `sw.js` (e.g. `prc-v1.0.2-module1`) so the new files are picked up.

**Until then:** the app renders in the system fallback stack. It looks correct, just not final. Nothing breaks, and there are exactly two 404s in the console.

The app icons were generated programmatically to unblock installation. **Replace them with proper artwork before public release** — they are functional, not final.

---

## 6. Testing Guide

### 6.1 Manual test checklist

```
BOOT
[ ] Opens with no visible flash of the wrong theme
[ ] Greeting matches the time of day
[ ] Five nav tabs, all labelled
[ ] Console shows only the two font 404s — nothing else

NAVIGATION
[ ] All five tabs navigate and highlight correctly
[ ] The selected tab floats upward onto the sage puck
[ ] Transitions fade, never slide
[ ] Browser back / forward work
[ ] Refreshing on #/garden stays on Garden
[ ] An invalid hash (#/nonsense) lands on Today, not a blank screen

PREFERENCES  (Me tab)
[ ] Theme: Match my phone / Light / Night all apply instantly
[ ] Text size: five steps, all visibly different
[ ] Higher contrast: On deepens the ink and outlines replace shadows
[ ] Reduce movement: On stills the transitions
[ ] Language: switches EVERYTHING including the five nav labels
[ ] Close and reopen — every preference persisted
[ ] Theme applied before first paint, no flash on reload

OFFLINE   ← the one that matters
[ ] Load once online, then turn off the network
[ ] Reload — the app still opens
[ ] All five tabs still navigate
[ ] Styling intact
[ ] No "you are offline" message (correct — silence is the design)

INSTALL
[ ] Android Chrome: menu → Add to Home screen
[ ] iPhone Safari: Share → Add to Home Screen
[ ] Opens from the home screen with no browser bar
[ ] Icon looks right on the home screen
[ ] Works from the home screen in aeroplane mode

CSP
[ ] If you edited the inline script in index.html, check the Console for a
    "Refused to execute inline script" error. It names the correct new hash —
    paste it into the CSP meta tag.
```

### 6.2 Accessibility checklist

```
[ ] Tab from a fresh load reaches the SKIP LINK first
[ ] Enter on the skip link moves focus to main content
[ ] Every nav tab reachable by Tab, activatable by Enter and Space
[ ] Focus ring visible on every interactive element
[ ] Preference groups announce as radiogroups with a name
[ ] Route changes are announced politely (VoiceOver / TalkBack)
[ ] Nothing is announced assertively
[ ] Text at 200% (xxl): no clipping, no horizontal scroll, at 320px wide
[ ] Content clears the bottom nav at every text size
[ ] All touch targets ≥48px  (verified: minimum 52px)
[ ] High contrast mode readable in both themes
[ ] Reduce movement stills transitions
[ ] Colour is never the only signal
```

### 6.3 Performance checklist

```
[ ] Lighthouse Performance ≥95   (run after adding the fonts)
[ ] Lighthouse Accessibility 100
[ ] Lighthouse Best Practices ≥95
[ ] Lighthouse PWA: installable, offline-capable
[ ] First paint under 1s on a throttled 4G profile
[ ] Repeat load: 0 network bytes (fully precached)
[ ] No layout shift on load or navigation
[ ] Verified on a real low-end Android, not only an emulator
```

### 6.4 Responsive checklist

```
[ ] 320px  — no horizontal scroll, nothing clipped   ✅ verified
[ ] 390px  — the design target                        ✅ verified
[ ] 768px  — centred at 480px, generous gutters
[ ] 1280px — same, still centred. Desktop is NOT a different design
[ ] Landscape — usable, nav still reachable
[ ] Safe areas respected on a notched device
```

### 6.5 Edge case checklist

```
[ ] localStorage disabled (private browsing) — app still runs on defaults
[ ] Corrupted prc.settings — merges onto defaults, does not reset everything
[ ] Unknown route — lands on Today
[ ] Rapid tab switching — no stuck transitions, no leaked listeners
[ ] Hard refresh mid-transition — recovers
[ ] Two tabs open — preferences in one do not corrupt the other
[ ] Service worker unsupported — app works, just not offline
[ ] Font files missing — system fallback, app looks correct
```

### 6.6 Automated verification already run

| Check | Result |
|---|---|
| Boot: theme, text size, language, title, tabs, live region, skip link | ✅ Pass |
| Navigate all five routes, hash + highlight correct | ✅ Pass |
| Preferences apply, persist, and survive reload | ✅ Pass |
| Language switch translates views **and** nav | ✅ Pass (bug found and fixed) |
| Service worker registers, activates, correct scope | ✅ Pass |
| Full offline reload | ✅ Pass |
| Skip link first in tab order | ✅ Pass (bug found and fixed) |
| 200% text at 320px: no overflow, content clears nav | ✅ Pass |
| Minimum touch target | ✅ 52px |
| Console errors | ✅ None except two font 404s |

---

## 7. Future Extension Notes

### Where Module 2 plugs in

| What | Where |
|---|---|
| Components | `core/components/*.js` + one CSS file each, `@import`ed in `main.css` block 03 |
| NavBar component | Replaces `buildNav()` in `main.js`. Adds Lucide icons and the floating puck. **The markup contract is already set** — `.navbar__tab[data-tab][aria-selected]` |
| Storage layer | `core/storage/db.js` + `repositories/*.repo.js`. Nothing else may touch IndexedDB |
| Mood check-in | `features/feelings/` — replaces the placeholder |
| Today zones 2–4 | Comment markers are already in `today.view.js` |

### Extension points deliberately left open

| Point | Ready for |
|---|---|
| `routes.js` | `/calm` and `/crisis` with `navTab: null, distress: true`. The nav-hiding logic already works |
| `EVENTS` in `bus.js` | Ten events declared, none wired yet |
| `initial-state.js` | `inDistressFlow` already gates the error handler |
| `03-components/` and `04-features/` blocks in `main.css` | Marked with comments |
| `core/charts/`, `core/safety/`, `core/animation/` | Folders exist, empty |
| `i18n` | Adding Mandarin or Tamil is one file in `locales/` |
| `prefs.js` | Adding a preference is one key, one CSS block, one settings group |

### Known debt carried forward

| Item | When |
|---|---|
| Two font files | Before any visual sign-off |
| App icons are generated placeholders | Before public release |
| No unit tests yet | Module 2 — `date.js` and `prefs.js` first |
| No axe-core in CI | Module 2, alongside the component library |
| `buildNav()` in `main.js` is temporary | Module 2 replaces it with the NavBar component |
| Lighthouse not yet run | After the fonts land — it will misreport without them |

---

*Module 1 complete. Awaiting approval before Module 2 (Component Library + Navigation).*
