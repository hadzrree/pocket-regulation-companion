"""
Module 2 verification suite.
Runs the real app in Chromium and checks behaviour, storage rules,
accessibility and layout. Screenshots land in /root/shots/.
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8099"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
SHOTS = pathlib.Path("/root/shots")
SHOTS.mkdir(exist_ok=True)

results = []
def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("  PASS  " if ok else "  FAIL  ") + name + ((" :: " + str(detail)) if detail else ""))

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 390, "height": 844},
                              device_scale_factor=2, has_touch=True, locale="en-GB")
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

    # ---------- 1. boot ----------
    page.goto(f"{BASE}/index.html#/today", wait_until="networkidle")
    page.wait_for_selector(".mood-row", timeout=5000)
    check("boots with no console errors", not errors, errors[:3])

    faces = page.locator(".mood").count()
    check("five mood faces render", faces == 5, faces)

    # every face has drawn geometry
    geom = page.evaluate("""() => [...document.querySelectorAll('.mood-face')]
        .map(s => s.querySelectorAll('circle,path,ellipse').length)""")
    check("every face has drawn geometry", all(g >= 3 for g in geom), geom)

    page.screenshot(path=SHOTS / "01-today-light-fresh.png", full_page=True)

    # ---------- 2. touch targets ----------
    boxes = page.evaluate("""() => [...document.querySelectorAll('.mood')]
        .map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })""")
    check("mood targets >= 48px in both axes", all(w >= 48 and h >= 48 for w, h in boxes), boxes)

    navbox = page.evaluate("""() => [...document.querySelectorAll('.navbar__tab')]
        .map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })""")
    check("nav tabs >= 48px tall", all(h >= 48 for _, h in navbox), navbox)

    check("nav renders 5 icons", page.locator(".navbar__tab .icon").count() == 5)

    # ---------- 3. no horizontal overflow ----------
    overflow = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check("no horizontal overflow at 390px", overflow <= 0, overflow)

    # ---------- 4. keyboard: skip link first ----------
    order = []
    page.keyboard.press("Tab")
    for _ in range(4):
        order.append(page.evaluate("() => document.activeElement.className || document.activeElement.tagName"))
        page.keyboard.press("Tab")
    check("skip link is the first tab stop", "skip-link" in str(order[0]), order)

    # ---------- 5. radiogroup keyboard ----------
    page.locator(".mood[data-mood='3']").focus()
    page.keyboard.press("ArrowRight")
    sel = page.evaluate("() => document.querySelector('.mood[aria-checked=\\'true\\']')?.dataset.mood")
    check("ArrowRight selects the next face", sel == "4", sel)
    tabbables = page.evaluate("""() => [...document.querySelectorAll('.mood')].filter(b => b.tabIndex === 0).length""")
    check("roving tabindex: exactly one tab stop", tabbables == 1, tabbables)

    page.wait_for_timeout(600)
    page.screenshot(path=SHOTS / "02-today-selected-good.png", full_page=True)

    # ---------- 6. storage: one record, one growth entry ----------
    def read_db(store):
        return page.evaluate("""(store) => new Promise(res => {
            const r = indexedDB.open('prc');
            r.onsuccess = () => { const db = r.result;
              const q = db.transaction(store).objectStore(store).getAll();
              q.onsuccess = () => res(q.result); q.onerror = () => res('ERR'); };
            r.onerror = () => res('ERR');
        })""", store)

    page.wait_for_timeout(400)
    moods = read_db("moods")
    growth = read_db("growth")
    check("one mood record for today", len(moods) == 1, moods)
    check("one growth entry earned", len(growth) == 1, growth)

    # ---------- 7. editing does not earn more growth ----------
    page.locator(".mood[data-mood='2']").click()
    page.wait_for_timeout(500)
    moods2 = read_db("moods")
    growth2 = read_db("growth")
    check("edit updates the same record", len(moods2) == 1 and moods2[0]["mood"] == 2, moods2)
    check("edit earns NO extra growth", len(growth2) == 1, len(growth2))

    # ---------- 8. crisis card on the lowest face ----------
    page.locator(".mood[data-mood='1']").click()
    page.wait_for_timeout(500)
    check("crisis offer appears on 'Very heavy'", page.locator(".card--care").count() == 1)
    check("crisis offer is NOT a modal", page.locator("dialog[open], .modal").count() == 0)
    page.locator(".card--care button").first.click()
    page.wait_for_timeout(300)
    tel = page.locator("a.crisis-line").count()
    check("five crisis numbers, as tel: links", tel == 5, tel)
    hrefs = page.eval_on_selector_all("a.crisis-line", "els => els.map(e => e.getAttribute('href'))")
    check("HEAL 15555 present and first", hrefs and hrefs[0] == "tel:15555", hrefs)
    crisis_h = page.evaluate("""() => [...document.querySelectorAll('a.crisis-line')]
        .map(a => Math.round(a.getBoundingClientRect().height))""")
    check("crisis targets >= 72px", all(h >= 72 for h in crisis_h), crisis_h)
    page.screenshot(path=SHOTS / "03-today-crisis-open.png", full_page=True)

    # ---------- 9. persistence across reload ----------
    page.reload(wait_until="networkidle")
    page.wait_for_selector(".mood[aria-checked='true']", timeout=5000)
    restored = page.evaluate("() => document.querySelector('.mood[aria-checked=\\'true\\']').dataset.mood")
    check("answer survives a reload", restored == "1", restored)
    check("question is not asked twice", page.locator(".checkin__response").count() == 1)

    # ---------- 10. feelings tab ----------
    page.goto(f"{BASE}/index.html#/feelings", wait_until="networkidle")
    page.wait_for_selector(".feeling-row", timeout=5000)
    check("feelings lists the recorded day", page.locator(".feeling-row").count() == 1)
    body = page.locator("#main").inner_text()
    banned = ["score", "average", "trend", "streak", "missed", "failed", "/5"]
    found = [w for w in banned if w in body.lower()]
    check("no score / trend / streak language", not found, found)
    page.screenshot(path=SHOTS / "04-feelings-light.png", full_page=True)

    # ---------- 11. dark theme ----------
    page.goto(f"{BASE}/index.html#/me", wait_until="networkidle")
    page.get_by_role("radio", name="Night").click()
    page.wait_for_timeout(400)
    theme = page.evaluate("() => document.documentElement.dataset.theme")
    check("night theme applies", theme == "dark", theme)
    page.goto(f"{BASE}/index.html#/today", wait_until="networkidle")
    page.wait_for_selector(".mood-row")
    page.wait_for_timeout(700)
    page.screenshot(path=SHOTS / "05-today-dark.png", full_page=True)
    page.goto(f"{BASE}/index.html#/feelings", wait_until="networkidle")
    page.wait_for_selector(".feeling-row")
    page.screenshot(path=SHOTS / "06-feelings-dark.png", full_page=True)

    # ---------- 12. bahasa malaysia ----------
    page.goto(f"{BASE}/index.html#/me", wait_until="networkidle")
    page.get_by_role("radio", name="Bahasa Malaysia").click()
    page.wait_for_timeout(400)
    navtext = page.locator("#nav").inner_text()
    check("nav re-translates to BM", "Hari Ini" in navtext and "Rasa" in navtext, navtext.replace("\n", " "))
    page.goto(f"{BASE}/index.html#/today", wait_until="networkidle")
    page.wait_for_selector(".mood-row")
    labels = page.eval_on_selector_all(".mood__label", "els => els.map(e => e.textContent)")
    check("mood words are in BM", labels == ["Berat sangat", "Berat", "Okay", "Baik", "Ringan"], labels)
    page.wait_for_timeout(700)
    page.screenshot(path=SHOTS / "07-today-bm-dark.png", full_page=True)

    # ---------- 13. back to light + english, large text ----------
    page.goto(f"{BASE}/index.html#/me", wait_until="networkidle")
    page.get_by_role("radio", name="English").click()
    page.wait_for_timeout(300)
    page.get_by_role("radio", name="Light").click()
    page.wait_for_timeout(300)
    # largest text size is the 5th 'A'
    page.locator("[data-name='textSize'][data-value='xxl']").click()
    page.wait_for_timeout(300)
    page.goto(f"{BASE}/index.html#/today", wait_until="networkidle")
    page.wait_for_selector(".mood-row")
    overflow_xl = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check("no overflow at 200% text size", overflow_xl <= 0, overflow_xl)
    page.wait_for_timeout(600)
    page.screenshot(path=SHOTS / "08-today-xxl-text.png", full_page=True)
    page.locator("[data-name='textSize'][data-value='m']").click() if page.locator("[data-name='textSize']").count() else None

    # ---------- 14. narrow screen ----------
    page.set_viewport_size({"width": 320, "height": 720})
    page.goto(f"{BASE}/index.html#/me", wait_until="networkidle")
    page.locator("[data-name='textSize'][data-value='m']").click()
    page.wait_for_timeout(300)
    page.goto(f"{BASE}/index.html#/today", wait_until="networkidle")
    page.wait_for_selector(".mood-row")
    of320 = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check("no overflow at 320px", of320 <= 0, of320)
    page.wait_for_timeout(600)
    page.screenshot(path=SHOTS / "09-today-320.png", full_page=True)

    # ---------- 15. append-only ledger has no delete API ----------
    src = pathlib.Path("/root/prc-app/core/storage/repositories/growth.repo.js").read_text()
    dbsrc = pathlib.Path("/root/prc-app/core/storage/db.js").read_text()
    check("growth repo exports no delete/update",
          "export function remove" not in src and "export const remove" not in src
          and "delete" not in src.split("*/")[-1].lower(), "")
    check("growth repo exposes no way to remove an entry",
          "export function remove" not in src and "export function reset" not in src, "")
    # Module 5 introduced ONE fenced deletion path, for the user's own written
    # thoughts. The invariant to assert is therefore no longer "the string
    # .delete( does not appear" — it is that the growth ledger is not in the
    # fence, which is the thing that actually matters.
    db_src = pathlib.Path("/root/prc-app/core/storage/db.js").read_text()
    fence = db_src.split("const DELETABLE = Object.freeze(")[1].split(")")[0]
    check("the delete fence exists and excludes growth",
          "thoughts" in fence and "growth" not in fence, fence.strip())

    # ---------- 16. no console errors overall ----------
    check("no console errors across the whole run", not errors, errors[:5])

    browser.close()

print("\n" + "=" * 62)
passed = sum(1 for _, ok, _ in results if ok)
print(f"{passed}/{len(results)} checks passed")
print("=" * 62)
sys.exit(0 if passed == len(results) else 1)
