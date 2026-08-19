"""
verify-perf.py — Module 7, Task 53b.

Measures instead of guessing. Three questions:
  1. What does a first visit cost on a slow connection?
  2. What does a return visit cost, which is what almost every visit is?
  3. Does the 40-file @import chain in main.css need concatenating?

The target user is on a prepaid Malaysian phone plan, often on 3G outside
the Klang Valley, so the slow number is the one that matters.
"""
import sys, statistics
from playwright.sync_api import sync_playwright

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
BASE   = "http://127.0.0.1:8099/index.html"

# Chrome DevTools "Slow 3G": 400 kbps down, 400ms RTT.
SLOW3G = {'offline': False, 'downloadThroughput': 400*1024/8,
          'uploadThroughput': 400*1024/8, 'latency': 400}
FAST3G = {'offline': False, 'downloadThroughput': 1.6*1024*1024/8,
          'uploadThroughput': 750*1024/8, 'latency': 150}

def measure(pw, throttle, label, warm=False):
    b = pw.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width':390,'height':844})
    page = ctx.new_page()
    reqs = []
    page.on('requestfinished', lambda r: reqs.append(r))

    cdp = ctx.new_cdp_session(page)
    cdp.send('Network.enable')
    if throttle:
        cdp.send('Network.emulateNetworkConditions', throttle)

    if warm:
        # First load populates the service-worker cache, then we measure the
        # SECOND load — which is what a real user experiences from day two on.
        cdp.send('Network.emulateNetworkConditions', {'offline': False,
                 'downloadThroughput': -1, 'uploadThroughput': -1, 'latency': 0})
        page.goto(BASE + '#/today', wait_until='networkidle')
        page.wait_for_function("() => navigator.serviceWorker.controller !== null", timeout=20000)
        page.wait_for_timeout(2500)
        reqs.clear()
        if throttle:
            cdp.send('Network.emulateNetworkConditions', throttle)

    page.goto(BASE + '#/today', wait_until='load')
    page.wait_for_timeout(1000)

    total = 0
    for r in reqs:
        try:
            sz = r.sizes()
            total += (sz.get('responseBodySize') or 0)
        except Exception:
            pass
    m = page.evaluate("""() => {
      const fp = performance.getEntriesByName('first-contentful-paint')[0];
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const css = performance.getEntriesByType('resource').filter(r => r.name.endsWith('.css'));
      return { fcp: fp ? Math.round(fp.startTime) : null,
               dcl: Math.round(nav.domContentLoadedEventEnd || 0),
               cssFiles: css.length,
               cssDone: css.length ? Math.round(Math.max(...css.map(c => c.responseEnd))) : 0 };
    }""")
    b.close()
    return {'label': label, 'requests': len(reqs), 'kb': total/1024, **m}

rows = []
with sync_playwright() as pw:
    rows.append(measure(pw, None,    'first visit, no throttling'))
    rows.append(measure(pw, FAST3G,  'first visit, Fast 3G'))
    rows.append(measure(pw, SLOW3G,  'first visit, Slow 3G'))
    rows.append(measure(pw, SLOW3G,  'RETURN visit, Slow 3G', warm=True))

w = max(len(r['label']) for r in rows)
print(f"\n{'':<{w}}  {'reqs':>5} {'KB':>7} {'FCP ms':>8} {'DCL ms':>8} {'CSS files':>10} {'CSS done ms':>12}")
for r in rows:
    print(f"{r['label']:<{w}}  {r['requests']:>5} {r['kb']:>7.0f} {str(r['fcp']):>8} {r['dcl']:>8} {r['cssFiles']:>10} {r['cssDone']:>12}")

print("""
READING THIS TABLE
  The CSS column is the one the architecture note flagged: main.css @imports
  the layer files, and every one of them is render-blocking. If "CSS done"
  dominates FCP on Slow 3G, the layers need concatenating at deploy time.
  The RETURN row is the honest everyday number — after the first visit the
  service worker serves everything from disk and the network is not used.""")
