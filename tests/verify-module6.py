"""Module 6 verification — the body log, the mood history, and the report."""
import pathlib, sys, re
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8099"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
SHOTS = pathlib.Path("/root/shots6"); SHOTS.mkdir(exist_ok=True)

results = []
def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("  PASS  " if ok else "  FAIL  ") + name + ((" :: " + str(detail)) if detail else ""))

# Things the app must never say about a physical sensation.
INTERPRETING = ["just anxiety", "it's anxiety", "probably nothing", "don't worry",
                "nothing to worry", "this is common", "perfectly normal",
                "try not to worry", "calm down", "panic attack", "symptom of"]
# Things a chart must never assert.
VERDICTS = ["average", "trend", "improving", "getting worse", "streak",
            "on track", "compared to last"]

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
              if (!db.objectStoreNames.contains(store)) { db.close(); return res('NO-STORE'); }
              const q = db.transaction(store).objectStore(store).getAll();
              q.onsuccess = () => { const v = q.result; db.close(); res(v); };
              q.onerror = () => { db.close(); res('ERR'); }; };
            r.onerror = () => res('ERR');
        })""", store)

    def open_body():
        """Leave the route first, then come back — two hash changes in the same
        tick race the router's fade. Then wait for whichever state actually
        rendered rather than guessing with a timeout."""
        page.goto(f"{BASE}/index.html#/today", wait_until="networkidle")
        page.wait_for_timeout(400)
        page.goto(f"{BASE}/index.html#/body", wait_until="networkidle")
        page.wait_for_selector(".sensation, .body-log__enough", timeout=10000)

    def log_one(chips=2, note=""):
        open_body()
        if page.locator(".sensation").count() == 0:
            return False
        for i in range(chips):
            page.locator(".sensation").nth(i).click()
        if note:
            page.fill(".body-log__note", note)
        page.locator(".body-log .btn--primary").click()
        page.wait_for_timeout(600)
        return True

    # ---------- 1. reachable from Feelings ----------
    page.goto(f"{BASE}/index.html#/feelings", wait_until="networkidle")
    page.wait_for_timeout(800)
    labels = page.eval_on_selector_all(".btn__label", "e => e.map(x => x.textContent)")
    check("Feelings offers the body log", "Something in my body" in labels, labels)

    # ---------- 2. the log screen ----------
    page.goto(f"{BASE}/index.html#/body", wait_until="networkidle")
    page.wait_for_selector(".sensation", timeout=8000)
    check("the sensations are listed", page.locator(".sensation").count() == 15,
          page.locator(".sensation").count())
    check("grouped by region, four regions", page.locator(".body-log__region").count() == 4)
    check("the standing line is present", page.locator(".body-log__standing").count() == 1)
    standing = page.locator(".body-log__standing").inner_text().lower()
    check("the standing line names a doctor", "doctor" in standing, standing)
    check("and admits the app cannot tell them what it is",
          "can't tell you what it is" in standing, standing)

    body_text = page.locator("#main").inner_text().lower()
    check("the app never interprets a sensation",
          not any(w in body_text for w in INTERPRETING),
          [w for w in INTERPRETING if w in body_text])
    check("no clinical vocabulary in the words",
          not any(w in body_text for w in ("palpitation", "dyspnoea", "syncope", "symptom")),
          body_text[:80])
    check("no severity scale anywhere",
          page.locator("input[type=range], .slider").count() == 0)
    check("no number is asked for", not re.search(r"\b(1|0)\s*(-|to)\s*10\b", body_text))
    check("no past entries are shown on this screen",
          page.locator(".symptom-history, .body-log__history").count() == 0)
    check("the save action does not exist until something is chosen",
          page.locator(".body-log .btn--primary").is_hidden())
    page.screenshot(path=SHOTS / "01-body-log.png", full_page=True)

    # ---------- 3. one record is one moment ----------
    page.locator(".sensation").nth(0).click()
    page.locator(".sensation").nth(1).click()
    page.wait_for_timeout(200)
    check("the save action appears once something is chosen",
          page.locator(".body-log .btn--primary").is_visible())
    page.fill(".body-log__note", "worse when I stand up")
    page.locator(".body-log .btn--primary").click()
    page.wait_for_timeout(700)

    rows = read("symptoms")
    check("symptoms store exists (migration v5 ran)", rows != "NO-STORE")
    check("one record, holding both sensations at once",
          len(rows) == 1 and len(rows[0]["sensationIds"]) == 2, rows)
    check("the note is kept exactly as typed",
          rows[0]["note"] == "worse when I stand up", rows[0].get("note"))
    check("no severity, scale, duration or cause is stored",
          not any(k in rows[0] for k in ("severity", "scale", "score", "duration",
                                         "cause", "category", "sentiment")),
          list(rows[0]))

    after = page.locator("#main").inner_text().lower()
    check("after saving, no interpretation is offered",
          not any(w in after for w in INTERPRETING), [w for w in INTERPRETING if w in after])
    check("after saving, the standing line is still there",
          page.locator(".body-log__standing").count() == 1)
    check("after saving, no breathing exercise is pushed",
          "breathe" not in after, after[:80])
    page.screenshot(path=SHOTS / "02-body-noted.png")

    # ---------- 4. noticing does not grow the garden ----------
    growth = read("growth")
    check("noticing a sensation earns no growth",
          not any(g["kind"] in ("symptom", "body") for g in growth),
          sorted({g["kind"] for g in growth}))

    # ---------- 5. the daily cap ----------
    log_one(chips=1)
    log_one(chips=1)
    rows3 = read("symptoms")
    check("three moments can be recorded in a day", len(rows3) == 3, len(rows3))

    open_body()
    page.wait_for_selector(".body-log__enough", timeout=8000)
    enough = page.locator(".body-log__enough").inner_text()
    check("a fourth is not offered", page.locator(".sensation").count() == 0)
    check("the cap message is about the app, not the person",
          "you have" not in enough.lower() and "too many" not in enough.lower()
          and "i've got what you told me" in enough.lower(), enough)
    check("the standing line survives the cap",
          page.locator(".body-log__standing").count() == 1)
    check("nothing extra was written past the cap", len(read("symptoms")) == 3)
    page.screenshot(path=SHOTS / "03-body-enough.png")

    # ---------- 6. the mood ribbon ----------
    page.goto(f"{BASE}/index.html#/today", wait_until="networkidle")
    page.wait_for_selector(".mood[data-mood='4']", timeout=8000)
    page.locator(".mood[data-mood='4']").click()
    page.wait_for_timeout(700)

    # seed a spread of past days so the drawing has something in it
    page.evaluate("""() => new Promise(res => {
        const r = indexedDB.open('prc');
        r.onsuccess = () => { const db = r.result;
          const tx = db.transaction('moods', 'readwrite');
          const s = tx.objectStore('moods');
          const today = new Date();
          for (let i = 1; i < 26; i += 1) {
            if (i % 4 === 0) continue;               // deliberate blank days
            const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0')
                      + '-' + String(d.getDate()).padStart(2,'0');
            s.put({ dateKey: key, mood: (i % 5) + 1, note: '',
                    createdAt: key + 'T09:00:00.000Z', updatedAt: key + 'T09:00:00.000Z',
                    editableUntil: key + 'T11:00:00.000Z' });
          }
          tx.oncomplete = () => { db.close(); res(true); }; };
    })""")

    page.goto(f"{BASE}/index.html#/feelings", wait_until="networkidle")
    page.wait_for_selector(".ribbon", timeout=8000)
    marks = page.locator(".ribbon__day").count()
    blanks = page.locator(".ribbon__blank").count()
    check("one mark per recorded day", marks > 0, marks)
    check("blank days are drawn, not skipped", blanks > 0, blanks)
    check("thirty days in total", marks + blanks == 30, (marks, blanks))
    check("no trend line is drawn", page.locator(".ribbon polyline, .ribbon path").count() == 0)
    check("only one line in the drawing, and it is the baseline",
          page.locator(".ribbon line").count() == 1)
    check("no numeric axis", page.locator(".ribbon text").count() == 0)

    ribbon_text = page.locator("#main").inner_text().lower()
    check("the chart asserts no verdict",
          not any(w in ribbon_text for w in VERDICTS), [w for w in VERDICTS if w in ribbon_text])
    check("a gap is never called a miss",
          "missed" not in ribbon_text and "no data" not in ribbon_text)
    check("blank days are named once, plainly", "blank days are just blank" in ribbon_text)
    check("the drawing has a text equivalent",
          page.locator(".ribbon-figure .sr-only li").count() == marks,
          (page.locator(".ribbon-figure .sr-only li").count(), marks))
    check("the drawing itself is hidden from screen readers",
          page.get_attribute(".ribbon", "aria-hidden") == "true")
    page.screenshot(path=SHOTS / "04-feelings-ribbon.png", full_page=True)

    # ---------- 7. the report ----------
    page.goto(f"{BASE}/index.html#/me", wait_until="networkidle")
    page.wait_for_timeout(600)
    me_labels = page.eval_on_selector_all(".btn__label", "e => e.map(x => x.textContent)")
    check("the report is reachable from Me", "Something for an appointment" in me_labels, me_labels)

    page.goto(f"{BASE}/index.html#/report", wait_until="networkidle")
    page.wait_for_selector(".report__head", timeout=8000)
    rep = page.locator("#main").inner_text()
    low = rep.lower()
    check("the report states what it is not",
          all(w in low for w in ("not a medical record", "not a diagnosis", "self-reported")),
          low[:120])
    check("it asks the clinician to talk to the person",
          "please ask" in low, low[:120])
    check("it carries the drawing", page.locator(".report .ribbon").count() == 1)
    check("it gives a day count for the clinician",
          re.search(r"\d+ of the last 30 days", rep) is not None, rep[:200])
    check("it lists what the body noticed", page.locator(".report__row").count() >= 1)
    check("private writing is excluded, and says so",
          "not included here" in low, low[-200:])
    check("nothing the person wrote to Mika appears",
          "exhausted by all of it" not in low)
    check("the report asserts no verdict",
          not any(w in low for w in VERDICTS), [w for w in VERDICTS if w in low])
    page.screenshot(path=SHOTS / "05-report.png", full_page=True)

    # ---------- 8. printing ----------
    page.emulate_media(media="print")
    page.wait_for_timeout(300)
    hidden = page.evaluate("""() => ({
        nav: getComputedStyle(document.querySelector('#nav')).display,
        buttons: [...document.querySelectorAll('.report__controls .btn')]
                   .map(b => getComputedStyle(b).display),
        bg: getComputedStyle(document.body).backgroundColor
    })""")
    check("print hides the navigation", hidden["nav"] == "none", hidden["nav"])
    check("print hides the buttons", all(d == "none" for d in hidden["buttons"]), hidden["buttons"])
    check("print is on white", hidden["bg"] in ("rgb(255, 255, 255)",), hidden["bg"])
    check("the drawing still prints", page.locator(".report .ribbon").count() == 1)
    page.screenshot(path=SHOTS / "06-report-print.png", full_page=True)
    page.emulate_media(media="screen")

    # ---------- 9. bahasa malaysia ----------
    page.goto(f"{BASE}/index.html#/me", wait_until="networkidle")
    page.locator("[data-name='lang'][data-value='ms']").click()
    page.wait_for_timeout(500)
    # Clear the day's entries so the PICKER renders — the cap screen is a
    # different state and would not exercise the sensation words at all.
    page.evaluate("""() => new Promise(res => {
        const r = indexedDB.open('prc');
        r.onsuccess = () => { const db = r.result;
          const tx = db.transaction('symptoms', 'readwrite');
          tx.objectStore('symptoms').clear();
          tx.oncomplete = () => { db.close(); res(true); }; };
    })""")
    open_body()
    page.wait_for_selector(".sensation", timeout=8000)
    bm = page.locator("#main").inner_text()
    check("the sensation words are translated",
          "Dada rasa ketat" in bm and "Jantung laju" in bm, bm[:70])
    check("the standing line is translated", "doktor" in bm.lower(), bm[:120])
    check("no 'anda' anywhere", " anda " not in bm.lower(), bm[:120])
    page.screenshot(path=SHOTS / "07-body-bahasa.png", full_page=True)

    # ---------- 10. narrow screen ----------
    page.set_viewport_size({"width": 320, "height": 720})
    for route in ("/body", "/feelings", "/report"):
        page.goto(f"{BASE}/index.html#{route}", wait_until="networkidle")
        page.wait_for_timeout(700)
        of = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
        check(f"no overflow at 320px on {route}", of <= 0, of)

    check("no console errors across the whole run", not errors, errors[:5])
    browser.close()

print("\n" + "=" * 62)
passed = sum(1 for _, ok, _ in results if ok)
print(f"{passed}/{len(results)} checks passed")
print("=" * 62)
sys.exit(0 if passed == len(results) else 1)
