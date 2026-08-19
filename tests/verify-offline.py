"""
verify-offline.py — Module 7, Task 53.

Offline is not a feature of this app, it is the product. The person this was
built for is on a prepaid phone at 3am with no data left. So this does not
check that a service worker is registered; it turns the network off and walks
every screen.
"""
import json, sys
from playwright.sync_api import sync_playwright

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
BASE   = "http://127.0.0.1:8099/index.html"
ROUTES = ['/today','/regulate','/feelings','/garden','/me','/calm','/ground',
          '/crisis','/mika','/holding','/body','/report','/data']

passes, fails = [], []
def check(name, ok, detail=''):
    (passes if ok else fails).append(name)
    print(('  PASS  ' if ok else '  FAIL  ') + name + (f'  — {detail}' if detail else ''))

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width':390,'height':844})
    page = ctx.new_page()

    console_errors = []
    page.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)

    # ---------- ONLINE: first visit, measure what it costs ----------
    print('\nFIRST VISIT (online)')
    reqs = []
    page.on('requestfinished', lambda r: reqs.append(r))
    page.goto(BASE + '#/today', wait_until='networkidle')
    page.wait_for_timeout(1500)

    total = 0
    for r in reqs:
        try:
            sz = r.sizes()
            total += (sz.get('responseBodySize') or 0) + (sz.get('responseHeadersSize') or 0)
        except Exception:
            pass
    timing = page.evaluate("""() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const fp  = performance.getEntriesByName('first-contentful-paint')[0];
      return { fcp: fp ? Math.round(fp.startTime) : null,
               domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
               loadEvent: Math.round(nav.loadEventEnd || 0) };
    }""")
    print(f'  requests: {len(reqs)}   transferred: {total/1024:.0f} KB')
    print(f'  first contentful paint: {timing["fcp"]} ms   DOMContentLoaded: {timing["domContentLoaded"]} ms')

    # ---------- wait for the worker to finish precaching ----------
    page.wait_for_function("() => navigator.serviceWorker.controller !== null", timeout=15000)
    cached = page.evaluate("""async () => {
      const keys = await caches.keys();
      const c = await caches.open(keys[0]);
      return { cacheName: keys[0], entries: (await c.keys()).length };
    }""")
    print(f'\n  cache "{cached["cacheName"]}" holds {cached["entries"]} files')
    check('service worker is controlling the page', True)
    check('cache name matches this release', cached['cacheName'] == 'prc-v1.6.0-module7', cached['cacheName'])
    # Not a magic number. The service worker's own SHELL list is the
    # specification, so it is read from the source and compared entry by
    # entry — a file added to SHELL and then failing to cache is exactly the
    # bug this is meant to catch, and a count would have hidden it.
    import re as _re, pathlib as _pl
    sw_src = _pl.Path('/root/prc-app/sw.js').read_text()
    shell = _re.findall(r"'(\./[^']+)'", sw_src[sw_src.index('const SHELL'):sw_src.index("self.addEventListener('install'")])
    cached_urls = page.evaluate("""async () => {
      const keys = await caches.keys();
      const c = await caches.open(keys[0]);
      return (await c.keys()).map(r => new URL(r.url).pathname);
    }""")
    missing = [u for u in shell
               if not any(p.endswith(u[1:]) or (u == './' and p.endswith('/')) for p in cached_urls)]
    check('every file the service worker lists is actually cached',
          not missing, f'{len(shell)} listed, missing: {missing[:4]}')

    # ---------- OFFLINE ----------
    print('\nOFFLINE — network disconnected')
    ctx.set_offline(True)
    failed = []
    page.on('requestfailed', lambda r: failed.append(r.url))

    page.goto(BASE + '#/today')
    page.wait_for_timeout(1200)
    body = page.inner_text('#main')
    check('the app opens at all with no network', len(body.strip()) > 10, f'{len(body)} chars of content')

    # A route whose module fails to load does NOT go blank — the router falls
    # back to Today, which is right for the user and invisible to a test that
    # only counts characters. So the fallback itself is what gets asserted.
    for route in ROUTES:
        before = len([e for e in console_errors if 'failed to load view' in e])
        page.goto(BASE + '#' + route)
        page.wait_for_timeout(700)
        text = page.inner_text('#main').strip()
        buttons = page.locator('#main button').count()
        after = len([e for e in console_errors if 'failed to load view' in e])
        check(f'{route} renders offline', (len(text) > 5 or buttons > 0) and after == before,
              f'{len(text)} chars, {buttons} buttons' + ('  ROUTER FELL BACK' if after > before else ''))

    # the two things that matter most at 3am
    page.goto(BASE + '#/calm'); page.wait_for_timeout(1500)
    check('the breathing circle is animating offline',
          page.evaluate("document.getAnimations().length > 0"))
    page.goto(BASE + '#/crisis'); page.wait_for_timeout(800)
    crisis = page.inner_text('#main')
    check('the crisis numbers are readable offline', '15555' in crisis and '999' in crisis)

    # writing something down must still work
    page.goto(BASE + '#/today'); page.wait_for_timeout(900)
    moods = page.locator('#main [role="radio"], #main .mood')
    if moods.count():
        moods.first.click(); page.wait_for_timeout(1200)
    saved = page.evaluate("""async () => {
      const db = await import('./core/storage/db.js');
      const { STORES } = await import('./core/storage/migrations.js');
      const r = await db.count(STORES.MOODS);
      return r.ok ? r.value : -1;
    }""")
    check('a check-in saves with no network', saved >= 1, f'{saved} records')

    real_failures = [u for u in failed if not u.endswith('favicon.ico')]
    check('nothing tried to reach the network and failed',
          len(real_failures) == 0, str(real_failures[:3]))

    fatal = [e for e in console_errors if 'Failed to fetch' not in e]
    check('no console errors while offline', len(fatal) == 0, str(fatal[:2]))

    # ---------- back online, offline.html fallback for an unknown path ----------
    ctx.set_offline(False)
    b.close()

print(f'\n{len(passes)} passed, {len(fails)} failed')
if fails:
    print('FAILED: ' + ', '.join(fails))
sys.exit(1 if fails else 0)
