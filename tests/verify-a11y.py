"""
verify-a11y.py — Module 7, Task 52.

Runs axe-core over EVERY route, in BOTH themes, at default and 200% text.
axe is injected at TEST TIME ONLY (add_init_script, which is how the browser
loads it despite the app's CSP). Nothing is added to the shipped app, so the
"zero runtime dependencies" rule in Architecture 1.6 still holds.
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
BASE   = "http://127.0.0.1:8099/index.html"
AXE    = pathlib.Path("/root/axe/axe.min.js").read_text()

ROUTES = ['/today', '/regulate', '/feelings', '/garden', '/me',
          '/calm', '/ground', '/crisis', '/mika', '/holding',
          '/body', '/report', '/data']

# theme, textSize, lang
MODES = [
    ('light', 'm',  'en'),
    ('dark',  'm',  'en'),
    ('light', 'xxl','en'),
    ('light', 'm',  'ms'),
]

RUN = {
    'runOnly': {'type': 'tag',
                'values': ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']}
}

def main():
    findings = []
    checked = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        for theme, size, lang in MODES:
            ctx = browser.new_context(viewport={'width': 390, 'height': 844})
            ctx.add_init_script(AXE)
            ctx.add_init_script(
                "localStorage.setItem('prc.settings', JSON.stringify(%s));"
                % json.dumps({'theme': theme, 'textSize': size, 'lang': lang,
                              'contrast': 'normal', 'motion': 'reduced'})
            )
            page = ctx.new_page()
            for route in ROUTES:
                page.goto(BASE + '#' + route)
                page.wait_for_timeout(900)
                res = page.evaluate("axe.run(document, %s)" % json.dumps(RUN))
                checked += 1
                for v in res['violations']:
                    findings.append({
                        'mode': f'{theme}/{size}/{lang}',
                        'route': route,
                        'id': v['id'],
                        'impact': v['impact'],
                        'help': v['help'],
                        'targets': [n['target'] for n in v['nodes']][:4],
                        'summary': (v['nodes'][0].get('failureSummary') or '').replace('\n', ' | ')[:220]
                    })
            ctx.close()
        browser.close()

    print(f"scanned {checked} page states across {len(ROUTES)} routes x {len(MODES)} modes")
    if not findings:
        print("NO VIOLATIONS")
        return 0

    # group identical rule+route so the list is readable
    seen = {}
    for f in findings:
        k = (f['id'], f['route'])
        seen.setdefault(k, f)
        seen[k].setdefault('modes', set())
        seen[k]['modes'] = seen[k].get('modes', set()) | {f['mode']}

    print(f"\n{len(seen)} distinct violations:\n")
    for (rid, route), f in sorted(seen.items(), key=lambda x: (x[0][0], x[0][1])):
        print(f"[{f['impact']}] {rid} @ {route}  ({', '.join(sorted(f['modes']))})")
        print(f"    {f['help']}")
        print(f"    targets: {f['targets']}")
        print(f"    {f['summary']}")
        print()
    return 1

sys.exit(main())
