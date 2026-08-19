"""
verify-a11y-states.py — Module 7, Task 52, second pass.

The first pass audited every route with an EMPTY database, which is the state
almost nobody is in after day two. This pass seeds real data and then drives
the screens into the states a user actually sees: a garden with plants, a
history list, a completed task, the body log's "that's enough" screen, Mika's
seven screens, the delete confirmation.

Also runs the high-contrast mode, which the first pass did not.
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
BASE   = "http://127.0.0.1:8099/index.html"
AXE    = pathlib.Path("/root/axe/axe.min.js").read_text()

RUN = {'runOnly': {'type': 'tag',
       'values': ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}}

SEED = """
async () => {
  const mood    = await import('./core/storage/repositories/mood.repo.js');
  const growth  = await import('./core/storage/repositories/growth.repo.js');
  const session = await import('./core/storage/repositories/session.repo.js');
  const task    = await import('./core/storage/repositories/task.repo.js');
  const thought = await import('./core/storage/repositories/thought.repo.js');
  const symptom = await import('./core/storage/repositories/symptom.repo.js');
  const db      = await import('./core/storage/db.js');
  const { STORES } = await import('./core/storage/migrations.js');

  // 14 days of history, written straight to the store so the once-a-day rule
  // is not in the way of building a fixture.
  const day = 86400000, now = Date.now();
  for (let i = 13; i >= 0; i--) {
    if (i % 4 === 3) continue;                       // some blank days on purpose
    const d = new Date(now - i * day);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    await db.put(STORES.MOODS, {
      dateKey: key, mood: (i % 5) + 1,
      note: i === 5 ? 'A note with some of my own words in it.' : '',
      createdAt: now - i * day, updatedAt: now - i * day, editableUntil: now - i * day
    });
    await db.add(STORES.GROWTH, { id: 'g' + i, kind: 'check-in', amount: 1, dateKey: key, at: now - i * day });
  }
  await session.record({ kind: session.KINDS.BREATHING, startedAt: now - 6000, cycles: 4 });
  await session.record({ kind: session.KINDS.GROUNDING, startedAt: now - 9000, cycles: 5 });
  await task.offer(3);
  await task.complete();
  await thought.hold('Something I did not want to carry around today.', 'direct');
  await thought.hold('A second one, longer, so the list has more than a single row in it and wraps onto two lines.', 'direct');
  await symptom.record(['tight-chest','fast-heart'], { note: 'after the meeting' });
  return true;
}
"""

MODES = [
    ('light', 'm',   'en', 'normal'),
    ('dark',  'm',   'en', 'normal'),
    ('light', 'xxl', 'ms', 'normal'),
    ('light', 'm',   'en', 'high'),
]

ROUTES = ['/today','/regulate','/feelings','/garden','/me','/crisis','/holding','/body','/report','/data']

def scan(page, label, out):
    page.wait_for_timeout(500)
    res = page.evaluate("axe.run(document, %s)" % json.dumps(RUN))
    for v in res['violations']:
        out.append({'where': label, 'id': v['id'], 'impact': v['impact'], 'help': v['help'],
                    'targets': [n['target'] for n in v['nodes']][:3],
                    'why': (v['nodes'][0].get('failureSummary') or '').replace('\n',' | ')[:200]})
    return len(res['violations'])

def main():
    out, states = [], 0
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        for theme, size, lang, contrast in MODES:
            mode = f'{theme}/{size}/{lang}/{contrast}'
            ctx = b.new_context(viewport={'width':390,'height':844})
            ctx.add_init_script(AXE)
            ctx.add_init_script("localStorage.setItem('prc.settings', JSON.stringify(%s));" %
                json.dumps({'theme':theme,'textSize':size,'lang':lang,'contrast':contrast,'motion':'reduced'}))
            page = ctx.new_page()
            page.goto(BASE + '#/today'); page.wait_for_timeout(700)
            page.evaluate(SEED)
            page.reload(); page.wait_for_timeout(900)

            for r in ROUTES:
                page.goto(BASE + '#' + r); page.wait_for_timeout(800)
                scan(page, f'{mode} {r}', out); states += 1

            # --- the delete confirmation, which only exists after a tap
            page.goto(BASE + '#/data'); page.wait_for_timeout(700)
            page.get_by_role('button').last.scroll_into_view_if_needed()
            btns = page.locator('.card button')
            for i in range(btns.count()):
                if 'delete' in (btns.nth(i).inner_text() or '').lower() or 'padam' in (btns.nth(i).inner_text() or '').lower():
                    btns.nth(i).click(); break
            scan(page, f'{mode} /data (confirm open)', out); states += 1

            # --- the body log's cap screen: three entries used up
            page.evaluate("""async () => {
              const s = await import('./core/storage/repositories/symptom.repo.js');
              await s.record(['dizzy']); await s.record(['hot']);
            }""")
            page.goto(BASE + '#/today'); page.wait_for_timeout(300)
            page.goto(BASE + '#/body'); page.wait_for_timeout(800)
            scan(page, f'{mode} /body (cap reached)', out); states += 1

            # --- Mika, first screen and the writing screen
            page.goto(BASE + '#/mika'); page.wait_for_timeout(1200)
            scan(page, f'{mode} /mika (greeting)', out); states += 1
            for _ in range(2):
                b2 = page.locator('.mika-screen button:visible')
                if b2.count():
                    b2.first.click(); page.wait_for_timeout(1400)
            scan(page, f'{mode} /mika (after two steps)', out); states += 1

            ctx.close()
        b.close()

    print(f'scanned {states} page states')
    if not out:
        print('NO VIOLATIONS'); return 0
    seen = {}
    for f in out:
        seen.setdefault((f['id'], f['where'].split(' ',1)[1]), f)
    print(f'\n{len(seen)} distinct violations:\n')
    for (rid, where), f in sorted(seen.items()):
        print(f"[{f['impact']}] {rid} @ {where}")
        print(f"    {f['help']}")
        print(f"    targets: {f['targets']}")
        print(f"    {f['why']}\n")
    return 1

sys.exit(main())
