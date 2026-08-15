# Outstanding assets

## Fonts (2 files) — required before visual sign-off

`assets/fonts/nunito-variable.woff2`
`assets/fonts/inter-variable.woff2`

1. fonts.google.com → search **Nunito** → Get font → Download all. Repeat for **Inter**.
2. Unzip. Take the file with `VariableFont` in the name.
3. transfonter.org → upload the .ttf → format **WOFF2** → subset **Latin + Latin Extended**.
   (Latin Extended is required for Bahasa Malaysia.)
4. Rename to exactly `nunito-variable.woff2` and `inter-variable.woff2`.
5. Place in `assets/fonts/`.
6. Add both to the `SHELL` array in `sw.js` (a comment marks the spot).
7. Bump the `CACHE` string in `sw.js`.

Until then the app uses the system fallback stack and looks correct.

## App icons — generated placeholders, replace before public release

`assets/icons/app/` contains programmatically generated icons so the PWA is
installable. They are functional, not final artwork.

Maskable icon rule: all content must sit inside the central 80% circle.
