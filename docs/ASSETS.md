# Assets

## Fonts — DONE (Module 2)

The four font files are now in the repository. Nothing to do.

| File | Size | Covers |
|---|---|---|
| `assets/fonts/nunito-latin.woff2` | 39 KB | the app's voice — headings, buttons, sentences |
| `assets/fonts/nunito-latin-ext.woff2` | 35 KB | accented characters, fetched only if needed |
| `assets/fonts/inter-latin.woff2` | 48 KB | numerals, dates, captions, phone numbers |
| `assets/fonts/inter-latin-ext.woff2` | 85 KB | accented characters, fetched only if needed |

**What a typical user actually downloads: 87 KB**, not 208 KB. English and
Bahasa Malaysia are written entirely in Basic Latin, so the browser never
requests the two `-ext` files. They exist so that a name or a borrowed word
carrying a diacritic renders in the right typeface instead of silently
falling back to a system font in the middle of a word.

Both families are **variable** fonts: one file carries every weight from 400
to 800, rather than four separate static files per family.

### Licence

Nunito © 2014 The Nunito Project Authors.
Inter © 2016 The Inter Project Authors.
Both under the **SIL Open Font License 1.1** — full text in
`assets/fonts/OFL.txt`.

The OFL permits bundling and redistribution inside an application, on the
condition that the licence text travels with the files. That is why `OFL.txt`
is in the repository rather than only linked from a comment. Do not delete it.

### If you ever replace these files

Keep the family names (`Nunito`, `Inter`) and the weight ranges identical.
Every size token in `styles/01-tokens/typography.css` is drawn against these
metrics, and a family with different vertical proportions changes the rhythm
of every screen at once.

---

## App icons — generated placeholders, replace before public release

`assets/icons/app/` contains programmatically generated icons so the PWA is
installable. They are **functional, not final artwork**.

| File | Size | Purpose |
|---|---|---|
| `icon-192.png` | 192×192 | Android home screen |
| `icon-512.png` | 512×512 | splash screen, store listing |
| `maskable-512.png` | 512×512 | Android adaptive icon |
| `apple-touch-icon.png` | 180×180 | iOS home screen |
| `shortcut-calm.png` | 96×96 | long-press shortcut |

**Maskable icon rule:** all meaningful content must sit inside the central
80% circle. Android crops the corners to whatever shape the launcher uses,
and content outside that circle will be cut off on some phones.

---

## Crisis numbers — verify before every release

`core/safety/crisis-resources.js` carries a `VERIFIED_ON` date.

A crisis line that has changed its number is worse than no number at all: a
person in distress dials, gets a dead tone, and concludes that nobody is
there. Check every number against its official source before each release and
update the date.

Last verified: **2026-08-15**.
