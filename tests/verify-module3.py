"""Module 3 verification — breathing, grounding, crisis routes."""
import pathlib, sys, re
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8099"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
SHOTS = pathlib.Path("/root/shots3"); SHOTS.mkdir(exist_ok=True)

results = []
def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("  PASS  " if ok else "  FAIL  ") + name + ((" :: " + str(detail)) if detail else ""))

def set_prefs(page, **kw):
    page.evaluate("""(kw) => {
        const s = JSON.parse(localStorage.getItem('prc.settings') || '{}');
        Object.assign(s, kw);
        localStorage.setItem('prc.settings', JSON.stringify(s));
    }""", kw)

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 390, "height": 844},
                              device_scale_factor=2, has_touch=True, locale="en-GB")
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

    # ---------- 1. the Breathe tab ----------
    page.goto(f"{BASE}/index.html#/regulate", wait_until="networkidle")
    page.wait_for_selector(".regulate .card", timeout=5000)
    cards = page.locator(".regulate > .card").count()
    check("Breathe tab offers exactly two practices", cards == 2, cards)
    text = page.locator("#main").inner_text().lower()
    check("no 'coming soon' anywhere", "coming soon" not in text and "module 3" not in text)
    page.screenshot(path=SHOTS / "01-regulate.png")

    # ---------- 2. Calm Mode ----------
    page.locator(".regulate .btn--primary").click()
    page.wait_for_selector(".breath__disc", timeout=5000)
    check("nav bar is hidden in Calm Mode", page.locator("#nav").is_hidden())
    check("no header, no back chevron — one thing on screen",
          page.locator(".practice h1, .practice header").count() == 0)

    # the word cycles
    seen = set()
    for _ in range(28):
        w = page.locator(".breath__word").inner_text().strip()
        if w: seen.add(w)
        page.wait_for_timeout(250)
    check("the circle names all three phases", seen == {"In", "Hold", "Out"}, sorted(seen))

    body = page.locator("#main").inner_text().lower()
    check("never says 'take a deep breath'", "deep breath" not in body)
    check("no timer or countdown on screen", not re.search(r"\d+\s*(s|sec|min)\b", body), body[:80])

    # the circle actually moves
    t1 = page.evaluate("() => getComputedStyle(document.querySelector('.breath__disc')).transform")
    page.wait_for_timeout(700)
    t2 = page.evaluate("() => getComputedStyle(document.querySelector('.breath__disc')).transform")
    check("the circle is animating", t1 != t2, (t1, t2))

    page.screenshot(path=SHOTS / "02-calm.png")

    # ---------- 3. no error may surface during a distress flow ----------
    shown = page.evaluate("""async () => {
        const toast = await import('./core/components/Toast.js');
        return toast.show('THIS MUST NOT APPEAR');
    }""")
    page.wait_for_timeout(300)
    check("Toast.show() is refused inside a distress flow", shown is False, shown)
    check("nothing was rendered by the refused toast", page.locator(".toast").count() == 0)

    # ---------- 4. the way out ----------
    check("the stop control is present from the first frame",
          page.locator(".practice__foot .btn--quiet").count() == 1)
    check("a route to a phone number exists with the nav hidden",
          page.locator(".calm__help").count() == 1)

    page.locator(".practice__foot .btn--quiet").click()
    page.wait_for_selector(".practice__after", timeout=3000)
    after = page.locator(".practice__after-text").inner_text()
    check("closing line contains no duration or count",
          not re.search(r"\d", after), after)
    check("closing line does not say 'done'", "done" not in after.lower(), after)
    page.screenshot(path=SHOTS / "03-calm-after.png")

    # ---------- 5. the session was recorded ----------
    def read(store):
        return page.evaluate("""(store) => new Promise(res => {
            const r = indexedDB.open('prc');
            r.onsuccess = () => { const db = r.result;
              if (!db.objectStoreNames.contains(store)) return res('NO-STORE');
              const q = db.transaction(store).objectStore(store).getAll();
              q.onsuccess = () => res(q.result); q.onerror = () => res('ERR'); };
            r.onerror = () => res('ERR');
        })""", store)

    page.wait_for_timeout(500)
    sessions = read("sessions")
    check("the sessions store exists (migration v2 ran)", sessions != "NO-STORE")
    check("one breathing session recorded", len(sessions) == 1 and sessions[0]["kind"] == "breathing", sessions)
    check("the record has no 'completed' field", "completed" not in (sessions[0] if sessions else {}), sessions)
    growth = read("growth")
    check("the session earned growth", any(g["kind"] == "session" for g in growth), growth)

    # ---------- 6. Grounding ----------
    page.goto(f"{BASE}/index.html#/ground", wait_until="networkidle")
    page.wait_for_selector(".practice--ground", timeout=5000)
    check("grounding hides the nav too", page.locator("#nav").is_hidden())
    check("five step dots, not a percentage bar", page.locator(".steps__dot").count() == 5)
    check("no text input anywhere", page.locator("input, textarea").count() == 0)
    prompts = []
    for i in range(5):
        prompts.append(page.locator(".practice__prompt").inner_text())
        if i < 4:
            page.locator(".practice__foot .btn--primary").click()
            page.wait_for_timeout(250)
    check("prompts descend five to one",
          prompts == ["Five things you can see.", "Four things you can touch.",
                      "Three things you can hear.", "Two things you can smell.",
                      "One thing you can taste."], prompts)
    page.screenshot(path=SHOTS / "04-ground.png")
    page.locator(".practice__foot .btn--primary").click()
    page.wait_for_selector(".practice__after", timeout=3000)
    check("grounding ends with a closing line", page.locator(".practice__after-text").count() == 1)
    page.wait_for_timeout(500)
    sessions2 = read("sessions")
    check("grounding session recorded", len(sessions2) == 2, [s["kind"] for s in sessions2])

    # ---------- 7. the help screen ----------
    page.goto(f"{BASE}/index.html#/crisis", wait_until="networkidle")
    page.wait_for_selector(".crisis-screen", timeout=5000)
    check("help screen hides the nav", page.locator("#nav").is_hidden())
    check("five numbers as tel: links", page.locator("a.crisis-line").count() == 5)
    hrefs = page.eval_on_selector_all("a.crisis-line", "e => e.map(x => x.getAttribute('href'))")
    check("HEAL first, 999 last", hrefs[0] == "tel:15555" and hrefs[-1] == "tel:999", hrefs)
    heights = page.evaluate("""() => [...document.querySelectorAll('a.crisis-line')]
        .map(a => Math.round(a.getBoundingClientRect().height))""")
    check("crisis targets >= 72px", all(h >= 72 for h in heights), heights)
    check("there is a way back", page.locator(".crisis-screen__foot .btn").count() == 1)
    txt = page.locator("#main").inner_text().lower()
    check("no risk screening question", not any(w in txt for w in
          ["hurt yourself", "suicid", "are you thinking", "assess"]))
    page.screenshot(path=SHOTS / "05-crisis.png")

    # ---------- 8. Today zone 4 follows the check-in ----------
    page.goto(f"{BASE}/index.html#/today", wait_until="networkidle")
    page.wait_for_selector(".today__offer .btn", timeout=5000)
    check("exactly one primary button on Today",
          page.locator(".today .btn--primary").count() == 1)
    label_before = page.locator(".today__offer .btn__label").inner_text()
    page.wait_for_selector(".mood[data-mood='1']")
    page.locator(".mood[data-mood='1']").click()
    page.wait_for_timeout(600)
    label_low = page.locator(".today__offer .btn__label").inner_text()
    check("offer label softens after a heavy check-in",
          label_before == "Breathe with me" and label_low == "Sit with me a minute",
          (label_before, label_low))
    page.screenshot(path=SHOTS / "06-today-offer.png")

    # ---------- 9. reduced motion ----------
    page.goto(f"{BASE}/index.html#/me", wait_until="networkidle")
    set_prefs(page, motion="reduced")
    page.reload(wait_until="networkidle")
    page.goto(f"{BASE}/index.html#/calm", wait_until="networkidle")
    page.wait_for_selector(".breath__disc", timeout=5000)
    scales = []
    for _ in range(8):
        scales.append(page.evaluate(
            "() => getComputedStyle(document.querySelector('.breath__disc')).transform"))
        page.wait_for_timeout(400)
    check("reduced motion: the circle never changes size", len(set(scales)) == 1, set(scales))
    ops = []
    for _ in range(8):
        ops.append(page.evaluate(
            "() => getComputedStyle(document.querySelector('.breath__disc')).opacity"))
        page.wait_for_timeout(400)
    check("reduced motion: the pacing is still visible", len(set(ops)) > 1, sorted(set(ops))[:4])
    words = set()
    for _ in range(12):
        w = page.locator(".breath__word").inner_text().strip()
        if w: words.add(w)
        page.wait_for_timeout(300)
    check("reduced motion: the words still pace", len(words) >= 2, sorted(words))
    page.screenshot(path=SHOTS / "07-calm-reduced.png")

    # ---------- 10. narrow screen and Bahasa Malaysia ----------
    page.goto(f"{BASE}/index.html#/me", wait_until="networkidle")
    set_prefs(page, motion="full", lang="ms", theme="dark")
    page.reload(wait_until="networkidle")
    page.goto(f"{BASE}/index.html#/calm", wait_until="networkidle")
    page.wait_for_selector(".breath__disc")
    page.wait_for_timeout(900)
    stop_label = page.locator(".practice__foot .btn--quiet .btn__label").inner_text()
    check("Calm Mode is translated", stop_label == "Berhenti di sini", stop_label)
    page.screenshot(path=SHOTS / "08-calm-bm-dark.png")

    page.set_viewport_size({"width": 320, "height": 720})
    page.goto(f"{BASE}/index.html#/ground", wait_until="networkidle")
    page.wait_for_selector(".practice--ground")
    of = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check("no overflow at 320px", of <= 0, of)

    # ---------- 11. the pacer stops when you leave ----------
    page.goto(f"{BASE}/index.html#/calm", wait_until="networkidle")
    page.wait_for_selector(".breath__disc")
    page.wait_for_timeout(600)
    page.goto(f"{BASE}/index.html#/today", wait_until="networkidle")
    page.wait_for_timeout(400)
    live = page.evaluate("() => document.querySelectorAll('.breath__disc').length")
    check("the pacer is gone after navigating away", live == 0, live)
    # getAnimations() also returns ordinary CSS transitions belonging to the
    # screen we just navigated TO, so a bare count proves nothing. What would
    # be a real leak is an animation still driving a node that is no longer in
    # the document — that is the shape of a pacer left running after unmount.
    page.wait_for_timeout(2000)
    leaked = page.evaluate("""() => document.getAnimations().filter(a => {
        const target = a.effect && a.effect.target;
        return !target || !target.isConnected
            || (target.classList && target.classList.contains('breath__disc'));
    }).length""")
    check("no animation left driving a detached node", leaked == 0, leaked)

    check("no console errors across the whole run", not errors, errors[:5])
    browser.close()

print("\n" + "=" * 62)
passed = sum(1 for _, ok, _ in results if ok)
print(f"{passed}/{len(results)} checks passed")
print("=" * 62)
sys.exit(0 if passed == len(results) else 1)
