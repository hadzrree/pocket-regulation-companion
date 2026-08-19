#!/usr/bin/env python3
"""
tools/build-css.py
===============================================================================
WHAT THIS DOES
  Reads the @import list in styles/main.css, concatenates the layer files in
  that exact order, and writes styles/app.css. index.html links app.css and
  nothing else.

WHY, WHEN THE ARCHITECTURE SAYS "NO BUILD STEP"
  It says no build step for the APPLICATION — no bundler, no transpiler, no
  framework, nothing between the source and the browser. That still holds:
  every JavaScript file is served exactly as written.

  This is different, and it exists because it was measured. On a Slow 3G
  connection the 38-file @import chain took 6.1 seconds to resolve before the
  first paint, because the browser cannot discover a single layer file until
  main.css has arrived and been parsed. Concatenated, the same CSS took 2.9
  seconds and first paint moved from 6.6s to 4.6s. On a returning visit, which
  is nearly every visit, 288ms became 160ms.

  Two seconds of blank screen is the difference between a person deciding this
  app works and deciding it does not. That is worth one generated file.

THE SOURCE OF TRUTH IS STILL THE LAYER FILES
  styles/main.css and styles/01..06/ are what you edit. styles/app.css is
  output — never edit it, it will be overwritten. verify-module7.py rebuilds
  it in memory and fails the suite if the committed copy has drifted, so the
  two cannot silently fall out of step.

HOW TO RUN IT
  python3 tools/build-css.py          (from the project root)

  You only need this if you have edited a CSS file. Nothing else in the
  project requires it, and deploying does not run it.
===============================================================================
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STYLES = os.path.join(ROOT, 'styles')

HEADER = """/* =============================================================================
   app.css — GENERATED FILE. DO NOT EDIT.

   Built by tools/build-css.py from styles/main.css and the layer files it
   imports, in cascade order. Edit those; then run:

       python3 tools/build-css.py

   Editing this file directly will work until the next build and then be
   silently thrown away, which is the worst kind of bug to chase.
   ============================================================================= */

"""


def build():
    """Return the full text of app.css. Pure — writes nothing."""
    main = open(os.path.join(STYLES, 'main.css'), encoding='utf-8').read()
    order = re.findall(r"@import url\('\./([^']+)'\);", main)
    if not order:
        raise SystemExit('build-css: found no @import lines in styles/main.css')

    parts = [HEADER]
    for rel in order:
        path = os.path.join(STYLES, rel)
        if not os.path.exists(path):
            raise SystemExit(
                'build-css: styles/main.css imports %s, which does not exist' % rel)
        css = open(path, encoding='utf-8').read()

        # A layer file sits one directory deeper than app.css, so every
        # relative url() in it has to be rewritten or the fonts 404 in
        # production while working perfectly in development.
        folder = os.path.dirname(rel)

        def rebase(match):
            raw = match.group(1).strip()
            quote = ''
            if raw[:1] in ('"', "'"):
                quote, raw = raw[0], raw[1:-1]
            if raw.startswith(('data:', 'http:', 'https:', '/', '#')):
                return match.group(0)
            fixed = os.path.normpath(os.path.join(folder, raw)).replace(os.sep, '/')
            return 'url(%s%s%s)' % (quote, fixed, quote)

        css = re.sub(r'url\(([^)]+)\)', rebase, css)
        rule = '=' * max(0, 60 - len(rel))
        parts.append('/* ===== %s %s */\n%s\n' % (rel, rule, css.rstrip()))

    return '\n'.join(parts)


def main():
    out = build()
    target = os.path.join(STYLES, 'app.css')
    existing = None
    if os.path.exists(target):
        existing = open(target, encoding='utf-8').read()
    if existing == out:
        print('app.css already up to date (%d KB)' % (len(out) // 1024))
        return 0
    open(target, 'w', encoding='utf-8').write(out)
    print('wrote styles/app.css — %d KB from %d layer files'
          % (len(out) // 1024, out.count('/* ===== ')))
    return 0


if __name__ == '__main__':
    sys.exit(main())
