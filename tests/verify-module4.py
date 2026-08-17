"""Module 4 verification — behavioural activation and the garden."""
import pathlib, sys, re
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8099"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
SHOTS = pathlib.Path("/root/shots4"); SHOTS.mkdir(exist_ok=True)

results = []
def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("  PASS  " if ok else "  FAIL  ") + name + ((" :: " + str(detail)) if detail else ""))

BANNED = ["streak", "missed", "failed", "overdue", "inactive", "you should",
          "don't forget", "remember to", "score", "goal", "target", "% "]

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 390, "height": 844},
                              device_scale_factor=2, has_touch=True, locale="en-GB")
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

    def read(store):
        return page.evaluate("""(store) => new Promise(res => {
            const r = indexedDB.open('prc');
            r.onsuccess = () => { const db = r.result;
              if (!db.objectStoreNames.contains(store)) return res('NO-STORE');
              const q = db.transaction(store).objectStore(store).getAll();
              q.onsuccess = () => res(q.result); q.onerror = () => res('ERR'); };
            r.onerror = () => res('ERR');
        })""", store)

    # ---------- 1. no task before the check-in ----------
    page.goto(f"{BASE}/index.html#/today", wait_until="networkidle")
    page.wait_for_selector(".mood-row", timeout=5000)
    page.wait_for_timeout(700)
    check("no task is offered before a check-in", page.locator(".task .card").count() == 0)
    page.screenshot(path=SHOTS / "01-today-before.png")

    # ---------- 2. the task follows the check-in ----------
    page.locator(".mood[data-mood='5']").click()      # Light -> tier 2
    page.wait_for_selector(".task .card", timeout=5000)
    page.wait_for_timeout(400)
    tasks = read("tasks")
    check("tasks store exists (migration v3 ran)", tasks != "NO-STORE")
    check("a light day gets the largest tier", tasks and tasks[0]["tier"] == 2, tasks)
    check("only ever one task record per day", len(tasks) == 1, len(tasks))
    check("exactly one task card on screen", page.locator(".task .card").count() == 1)
    first_text = page.locator(".task__text").inner_text()
    check("the task has no number in it", not re.search(r"\d", first_text), first_text)

    # ---------- 3. the two buttons are equals ----------
    widths = page.evaluate("""() => [...document.querySelectorAll('.task .card__actions .btn')]
        .map(b => { const r = b.getBoundingClientRect();
                    return [Math.round(r.width), Math.round(r.height)]; })""")
    check("two actions, same size", len(widths) == 2 and widths[0] == widths[1], widths)
    check("neither action is disabled or hidden",
          page.locator(".task .card__actions .btn:disabled").count() == 0)
    check("neither task action is a filled primary",
          page.locator(".task .btn--primary").count() == 0)
    check("Today still has exactly one filled button",
          page.locator(".today .btn--primary").count() == 1,
          page.locator(".today .btn--primary").count())
    page.screenshot(path=SHOTS / "02-today-task.png")

    # ---------- 4. the task survives a reload ----------
    page.reload(wait_until="networkidle")
    page.wait_for_selector(".task__text", timeout=5000)
    check("the same task is still there after a reload",
          page.locator(".task__text").inner_text() == first_text, first_text)

    # ---------- 4b. correcting the check-in pulls the task down ----------
    # This is the case a real user hit: checked in as Okay, got a tier-1 task,
    # then corrected the answer to Very heavy inside the two-hour edit window.
    page.locator(".mood[data-mood='1']").click()
    page.wait_for_timeout(900)
    tasks_low = read("tasks")
    check("correcting the check-in down pulls the task down",
          tasks_low[0]["tier"] == 0, tasks_low[0]["tier"])
    check("the correction is not counted as a decline",
          tasks_low[0]["softenings"] == 0, tasks_low[0]["softenings"])
    check("the smaller task is actually on screen",
          page.locator(".task__text").inner_text() != first_text,
          page.locator(".task__text").inner_text())

    # ...and correcting UPWARD must never make the ask bigger.
    page.locator(".mood[data-mood='5']").click()
    page.wait_for_timeout(900)
    tasks_up = read("tasks")
    check("correcting the check-in up never raises the ask",
          tasks_up[0]["tier"] == 0, tasks_up[0]["tier"])
    page.screenshot(path=SHOTS / "02b-today-task-pulled-down.png")

    # ---------- 5. "not now" makes the ask smaller ----------
    page.locator(".task .card__actions .btn--quiet").click()
    page.wait_for_timeout(700)
    tasks2 = read("tasks")
    check("declining at the smallest tier stops the asking straight away",
          tasks2[0]["resting"] is True, tasks2[0])
    resting_now = page.locator(".task").inner_text()
    check("and says it is allowed", "allowed" in resting_now.lower(), resting_now)
    body = page.locator("#main").inner_text().lower()
    check("no scolding language after declining",
          not any(w in body for w in BANNED), [w for w in BANNED if w in body])
    check("no buttons remain in the task card",
          page.locator(".task .btn").count() == 0)
    check("nothing recorded a refusal",
          not any(k in tasks2[0] for k in ("skipped", "refused", "failed", "expired")), list(tasks2[0]))
    page.screenshot(path=SHOTS / "04-today-resting.png")

    # ---------- 5b. the full decline ladder, from the top ----------
    page.evaluate("""() => new Promise(res => {
        const r = indexedDB.open('prc');
        r.onsuccess = () => { const db = r.result;
          const tx = db.transaction('tasks', 'readwrite');
          tx.objectStore('tasks').clear();
          tx.oncomplete = () => res(true); };
    })""")
    page.reload(wait_until="networkidle")
    page.wait_for_selector(".task .card__actions .btn--quiet", timeout=5000)
    seen_tiers = []
    for _ in range(3):
        seen_tiers.append(read("tasks")[0]["tier"])
        page.locator(".task .card__actions .btn--quiet").click()
        page.wait_for_timeout(650)
    check("the ladder descends 2 -> 1 -> 0 then rests",
          seen_tiers == [2, 1, 0] and read("tasks")[0]["resting"] is True, seen_tiers)
    page.screenshot(path=SHOTS / "03-today-softened.png")

    # ---------- 6. a fresh day, completed ----------
    page.evaluate("""() => new Promise(res => {
        const r = indexedDB.open('prc');
        r.onsuccess = () => { const db = r.result;
          const tx = db.transaction('tasks', 'readwrite');
          tx.objectStore('tasks').clear();
          tx.oncomplete = () => res(true); };
    })""")
    page.reload(wait_until="networkidle")
    page.wait_for_selector(".task .card__actions .btn--secondary", timeout=5000)
    page.locator(".task .card__actions .btn--secondary").click()
    page.wait_for_timeout(800)
    tasks5 = read("tasks")
    check("completing sets doneAt", bool(tasks5[0]["doneAt"]), tasks5[0])
    growth = read("growth")
    check("completing earns growth", any(g["kind"] == "task" for g in growth),
          [g["kind"] for g in growth])
    check("the card stops asking once done", page.locator(".task .card__actions").count() == 0)
    check("no second task is offered", page.locator(".task .card").count() == 1)
    page.screenshot(path=SHOTS / "05-today-task-done.png")

    # double tap must not double-count
    before = len([g for g in growth if g["kind"] == "task"])
    page.evaluate("""async () => {
        const repo = await import('./core/storage/repositories/task.repo.js');
        await repo.complete(); await repo.complete();
    }""")
    page.wait_for_timeout(500)
    after = len([g for g in read("growth") if g["kind"] == "task"])
    check("completing twice cannot inflate the garden", before == after, (before, after))

    # ---------- 7. the garden ----------
    page.goto(f"{BASE}/index.html#/garden", wait_until="networkidle")
    page.wait_for_selector(".garden", timeout=5000)
    check("the garden is drawn", page.locator(".garden__plant").count() == 1)
    scatter = page.locator(".garden__scatter > *").count()
    total = sum(g["amount"] for g in read("growth"))
    check("one object per thing actually done", scatter == min(total, 28), (scatter, total))
    check("five stage dots, no percentage", page.locator(".garden-stages__dot").count() == 5)
    gtext = page.locator("#main").inner_text()
    check("the garden shows no total or score",
          not re.search(r"\b\d+\s*(of|/)\s*\d+\b", gtext) and "%" not in gtext, gtext[:120])
    check("no streak or goal language on the garden",
          not any(w in gtext.lower() for w in BANNED), [w for w in BANNED if w in gtext.lower()])
    check("it says nothing disappears", "disappears" in gtext.lower())
    check("the record lists what it grew from", page.locator(".grew-row").count() >= 1)
    page.screenshot(path=SHOTS / "06-garden.png")

    # ---------- 8. the garden is deterministic ----------
    def positions():
        return page.evaluate("""() => [...document.querySelectorAll('.garden__scatter > *')]
            .map(n => n.getAttribute('cx') || n.getAttribute('d') || n.outerHTML.slice(0, 60))""")
    a = positions()
    page.reload(wait_until="networkidle")
    page.wait_for_selector(".garden")
    b = positions()
    check("the garden looks identical every time it is opened", a == b, (a[:2], b[:2]))

    # ---------- 9. the garden cannot shrink ----------
    stage_before = page.locator(".garden-stages__dot.is-reached").count()
    page.evaluate("""() => new Promise(res => {
        const r = indexedDB.open('prc');
        r.onsuccess = () => { const db = r.result;
          const tx = db.transaction('growth', 'readwrite');
          const store = tx.objectStore('growth');
          for (let i = 0; i < 60; i++) store.add({
              id: 'seed-' + i, kind: 'check-in', amount: 1,
              dateKey: '2026-07-' + String((i % 28) + 1).padStart(2, '0'),
              at: '2026-07-01T00:00:00.000Z' });
          tx.oncomplete = () => res(true); };
    })""")
    page.reload(wait_until="networkidle")
    page.wait_for_selector(".garden")
    stage_after = page.locator(".garden-stages__dot.is-reached").count()
    check("more growth means a later stage", stage_after > stage_before, (stage_before, stage_after))
    check("the last stage brings fireflies", page.locator(".garden__firefly").count() == 6)
    scatter_capped = page.locator(".garden__scatter > *").count()
    check("the scatter is capped, not unbounded", scatter_capped == 28, scatter_capped)
    page.screenshot(path=SHOTS / "07-garden-stage5.png")

    # the storage layer offers no way to remove a growth entry
    growth_src = pathlib.Path("/root/prc-app/core/storage/repositories/growth.repo.js").read_text()
    check("the growth repo exposes no way to remove an entry",
          "export function remove" not in growth_src and "export function reset" not in growth_src)
    # Module 5 introduced ONE fenced deletion path, for the user's own written
    # thoughts. The invariant to assert is therefore no longer "the string
    # .delete( does not appear" — it is that the growth ledger is not in the
    # fence, which is the thing that actually matters.
    db_src = pathlib.Path("/root/prc-app/core/storage/db.js").read_text()
    fence = db_src.split("const DELETABLE = Object.freeze(")[1].split(")")[0]
    check("the delete fence exists and excludes growth",
          "thoughts" in fence and "growth" not in fence, fence.strip())

    # ---------- 10. bahasa malaysia and the night theme ----------
    page.goto(f"{BASE}/index.html#/me", wait_until="networkidle")
    # Selected by data attribute, not by visible label — the label changes
    # language, which is the thing being tested.
    page.locator("[data-name='theme'][data-value='dark']").click()
    page.wait_for_timeout(400)
    page.locator("[data-name='lang'][data-value='ms']").click()
    page.wait_for_timeout(400)
    page.goto(f"{BASE}/index.html#/garden", wait_until="networkidle")
    page.wait_for_selector(".garden")
    bm = page.locator("#main").inner_text()
    check("the garden is translated", "Taman" in bm and "hilang" in bm, bm[:80])
    check("no 'anda' anywhere", "anda" not in bm.lower().replace("kandungan", ""), bm[:120])
    page.wait_for_timeout(900)
    page.screenshot(path=SHOTS / "08-garden-night-bm.png")

    page.goto(f"{BASE}/index.html#/today", wait_until="networkidle")
    page.wait_for_selector(".task", timeout=5000)
    page.wait_for_timeout(600)
    page.screenshot(path=SHOTS / "09-today-night-bm.png")

    # ---------- 11. narrow and large text ----------
    page.set_viewport_size({"width": 320, "height": 720})
    page.goto(f"{BASE}/index.html#/garden", wait_until="networkidle")
    page.wait_for_selector(".garden")
    of = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check("garden: no overflow at 320px", of <= 0, of)

    page.goto(f"{BASE}/index.html#/me", wait_until="networkidle")
    page.locator("[data-name='textSize'][data-value='xxl']").click()
    page.wait_for_timeout(300)
    page.goto(f"{BASE}/index.html#/today", wait_until="networkidle")
    page.wait_for_selector(".task", timeout=5000)
    of2 = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check("today: no overflow at 320px and 200% text", of2 <= 0, of2)

    check("no console errors across the whole run", not errors, errors[:5])
    browser.close()

print("\n" + "=" * 62)
passed = sum(1 for _, ok, _ in results if ok)
print(f"{passed}/{len(results)} checks passed")
print("=" * 62)
sys.exit(0 if passed == len(results) else 1)
