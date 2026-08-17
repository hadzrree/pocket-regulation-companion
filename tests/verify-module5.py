"""Module 5 verification — Mika, the thought store, and the risk path."""
import pathlib, sys, re
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8099"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
SHOTS = pathlib.Path("/root/shots5"); SHOTS.mkdir(exist_ok=True)

results = []
def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("  PASS  " if ok else "  FAIL  ") + name + ((" :: " + str(detail)) if detail else ""))

BANNED = ["streak", "level", "points", "unlocked", "detected", "flagged",
          "concerning", "don't worry", "calm down", "i'm proud of you",
          "i missed you", "where have you been"]

SECRET = "the thing I never say out loud is that I am exhausted by all of it"

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

    def set_prefs(**kw):
        page.evaluate("""(kw) => {
            const s = JSON.parse(localStorage.getItem('prc.settings') || '{}');
            Object.assign(s, kw);
            localStorage.setItem('prc.settings', JSON.stringify(s));
        }""", kw)

    # ---------- 1. arrival ----------
    page.goto(f"{BASE}/index.html#/mika", wait_until="networkidle")
    page.wait_for_selector(".mika", timeout=5000)
    check("Mika is drawn", page.locator(".mika__shell").count() == 1)
    check("nav bar is hidden — Mika gets no tab", page.locator("#nav").is_hidden())
    page.wait_for_selector(".mika-screen__foot .btn", timeout=6000)
    page.wait_for_timeout(400)
    check("the greeting arrives a line at a time", page.locator(".mika-line").count() == 2)
    check("three ways forward, no more", page.locator(".mika-screen__foot .btn").count() == 3)
    body = page.locator("#main").inner_text().lower()
    check("no game or guilt vocabulary on arrival",
          not any(w in body for w in BANNED), [w for w in BANNED if w in body])
    check("Mika is aria-hidden — ambient motion never announces",
          page.get_attribute(".mika", "aria-hidden") == "true")
    page.screenshot(path=SHOTS / "01-arrival.png")

    # ---------- 2. the thoughts store and growth for arriving ----------
    page.wait_for_timeout(500)
    thoughts = read("thoughts")
    check("thoughts store exists (migration v4 ran)", thoughts != "NO-STORE")
    growth = read("growth")
    check("arriving grows the garden", any(g["kind"] == "thought" for g in growth),
          [g["kind"] for g in growth])
    before = len([g for g in growth if g["kind"] == "thought"])

    # ---------- 3. the field ----------
    page.locator(".mika-screen__foot .btn--primary").click()
    page.wait_for_selector(".mika-field", timeout=5000)
    check("the field is unlimited and unadorned",
          page.locator(".mika-field").count() == 1)
    fieldtext = page.locator("#main").inner_text()
    check("no character or word counter", not re.search(r"\b\d+\s*/\s*\d+", fieldtext))
    check("hand-over does not exist until something is written",
          page.locator(".mika-screen__foot .btn--primary").is_hidden())

    page.fill(".mika-field", SECRET)
    page.wait_for_timeout(300)
    check("hand-over appears once there is something to hand over",
          page.locator(".mika-screen__foot .btn--primary").is_visible())
    page.screenshot(path=SHOTS / "02-writing.png")

    # ---------- 4. the gathering ----------
    page.locator(".mika-screen__foot .btn--primary").click()
    page.wait_for_selector(".gathering", timeout=5000)
    page.wait_for_timeout(900)
    leaves = page.locator(".leaf").count()
    check("the text becomes leaves", 6 <= leaves <= 14, leaves)
    check("nothing is deleted — leaves settle inside Mika",
          page.locator(".gathering__mika .mika").count() == 1)
    page.screenshot(path=SHOTS / "03-gathering.png")

    # saved BEFORE the animation finishes
    saved_early = read("thoughts")
    check("the thought is saved before the animation ends",
          len(saved_early) == 1 and saved_early[0]["text"] == SECRET, len(saved_early))
    check("no risk flag is stored on the record",
          not any(k in saved_early[0] for k in ("risk", "flag", "sentiment", "category")),
          list(saved_early[0]))

    # skippable by a tap anywhere
    page.locator(".gathering").click()
    page.wait_for_selector(".mika-line--received", timeout=5000)
    check("the gathering can be skipped by a tap anywhere", True)

    # ---------- 5. received ----------
    sentence = page.locator(".mika-line--received").inner_text()
    check("exactly one sentence", sentence.count(".") + sentence.count("?") <= 2, sentence)
    check("Mika never quotes what was written",
          SECRET[:20].lower() not in sentence.lower() and "exhausted" not in sentence.lower(),
          sentence)
    check("no buttons during the silence",
          page.locator(".mika-screen__foot .btn").count() == 0)
    page.screenshot(path=SHOTS / "04-received.png")
    page.wait_for_timeout(2700)
    check("after the silence, two ways forward",
          page.locator(".mika-screen__foot .btn").count() == 2,
          page.locator(".mika-screen__foot .btn").count())

    # ---------- 6. visiting twice does not double the growth ----------
    # Leave the route first. navigate() is a no-op when the hash is unchanged,
    # so going straight from /mika to /mika would never remount the view.
    def open_mika():
        """Arrive at Mika the way a returning user does: a fresh launch.

        A hash-only change would leave the previous session's module state in
        place, which is not what a real second visit looks like."""
        page.goto(f"{BASE}/index.html#/mika", wait_until="networkidle")
        page.reload(wait_until="networkidle")
        try:
            page.wait_for_selector("[data-screen='arrival'] .mika-screen__foot .btn",
                                   timeout=12000)
        except Exception:
            print("    !! arrival never appeared; screen=",
                  page.get_attribute(".mika-screen", "data-screen")
                  if page.locator(".mika-screen").count() else "no .mika-screen",
                  "| main:", page.locator("#main").inner_text()[:120].replace("\n", " "))
            raise

    open_mika()
    page.wait_for_timeout(600)
    after = len([g for g in read("growth") if g["kind"] == "thought"])
    check("a second visit the same day does not grow again", before == after, (before, after))

    # ---------- 7. quiet mode is a real destination ----------
    page.locator(".mika-screen__foot .btn--quiet").first.click()
    page.wait_for_selector("[data-screen='quiet']", timeout=5000)
    check("quiet mode is a real destination, not a dead end",
          page.locator("[data-screen='quiet'] .mika-line").count() == 1)
    check("quiet mode asks for nothing", page.locator(".mika-field").count() == 0)
    check("and still offers a way onward and a way out",
          page.locator("[data-screen='quiet'] .mika-screen__foot .btn").count() == 2)
    page.screenshot(path=SHOTS / "05-quiet.png")

    # ---------- 8. the ending ----------
    page.locator("[data-screen='quiet'] .mika-screen__foot .btn").last.click()
    page.wait_for_selector("[data-screen='ending']", timeout=5000)
    page.wait_for_selector("[data-screen='ending'] .mika-screen__foot .btn", timeout=6000)
    page.wait_for_timeout(300)
    ending = page.locator("#main").inner_text().lower()
    check("the ending never says 'done'", "done" not in ending, ending[:80])
    check("two ways out of the ending",
          page.locator("[data-screen='ending'] .mika-screen__foot .btn").count() == 2)
    page.screenshot(path=SHOTS / "06-ending.png")

    # ---------- 9. Mika NEVER appears in a distress flow ----------
    for route in ("/calm", "/ground", "/crisis"):
        page.goto(f"{BASE}/index.html#{route}", wait_until="networkidle")
        page.wait_for_timeout(500)
        check(f"Mika is absent from {route}", page.locator(".mika").count() == 0)

    # ---------- 10. what Mika is holding ----------
    page.goto(f"{BASE}/index.html#/holding", wait_until="networkidle")
    page.wait_for_selector(".held", timeout=5000)
    check("held thoughts are listed", page.locator(".held").count() == 1)
    holdtext = page.locator("#main").inner_text()
    check("no counter, no badge, no number",
          not re.search(r"\b\d+\b", holdtext.replace("Mika", "")), holdtext[:80])
    check("collapsed, only the first few words show",
          SECRET not in holdtext, holdtext[:80])
    page.locator(".held__toggle").click()
    page.wait_for_timeout(400)
    check("opening shows the text exactly as written",
          SECRET in page.locator(".held__text").inner_text())
    check("three choices, and keeping it is first",
          page.locator(".held__actions .btn").count() == 3)
    page.screenshot(path=SHOTS / "07-holding.png")

    # take it back, then put it back
    page.locator(".held__actions .btn--quiet").first.click()
    page.wait_for_timeout(600)
    rows = read("thoughts")
    check("taking it back does not delete it",
          len(rows) == 1 and rows[0]["returnedAt"] is not None, rows)

    # ---------- 11. the storage layer refuses to delete growth ----------
    refused = page.evaluate("""async () => {
        const db = await import('./core/storage/db.js');
        const r = await db.remove('growth', 'anything');
        return r.ok === false && r.code === 'not-deletable';
    }""")
    check("the storage layer refuses to delete from the growth ledger", refused is True, refused)
    allowed = page.evaluate("""async () => {
        const db = await import('./core/storage/db.js');
        const r = await db.remove('thoughts', 'no-such-id');
        return r.ok === true;
    }""")
    check("but permits it for the user's own thoughts", allowed is True, allowed)
    # the console error from the refusal is expected and is not an app fault
    errors = [e for e in errors if "refusing to delete" not in e]

    # ---------- 12. the risk path ----------
    page.evaluate("""() => new Promise(res => {
        const r = indexedDB.open('prc');
        r.onsuccess = () => { const db = r.result;
          const tx = db.transaction('thoughts', 'readwrite');
          tx.objectStore('thoughts').clear();
          tx.oncomplete = () => res(true); };
    })""")
    open_mika()
    page.locator(".mika-screen__foot .btn--primary").click()
    page.wait_for_selector(".mika-field")
    RISKY = "some days I really don't want to be here anymore and I am tired"
    page.fill(".mika-field", RISKY)
    page.wait_for_timeout(200)
    page.locator(".mika-screen__foot .btn--primary").click()
    page.wait_for_selector(".gathering", timeout=5000)
    page.wait_for_timeout(900)
    risk_leaves = page.locator(".leaf").count()
    check("the gathering is NOT shortened on the risk path", risk_leaves >= 6, risk_leaves)
    check("the thought is still taken", len(read("thoughts")) == 1)
    page.locator(".gathering").click()
    page.wait_for_selector(".mika-line--received", timeout=5000)
    page.wait_for_timeout(2900)
    check("the risk card appears", page.locator(".mika-risk").count() == 1)
    check("it is a card, never a modal",
          page.locator("dialog[open]").count() == 0 and
          page.evaluate("() => getComputedStyle(document.querySelector('.mika-risk')).position") == "static")
    check("it is announced politely, never assertively",
          page.get_attribute(".mika-risk", "aria-live") == "polite")
    check("it offers the real numbers", page.locator(".mika-risk a.crisis-line").count() == 5)
    risktext = page.locator("#main").inner_text().lower()
    check("never says detected, flagged, concerning or crisis",
          not any(w in risktext for w in ("detected", "flagged", "concerning", "crisis")),
          [w for w in ("detected", "flagged", "concerning", "crisis") if w in risktext])
    check("never asks a risk question",
          not any(w in risktext for w in ("are you safe", "are you thinking", "do you intend")))
    check("covers the false positive", "not where you are" in risktext)
    check("a way past it is always present",
          page.locator(".mika-screen__foot .btn--quiet").count() >= 1)
    stored = read("thoughts")
    check("NOTHING about the match is stored",
          not any(k in stored[0] for k in ("risk", "flagged", "matched", "concern")),
          list(stored[0]))
    page.screenshot(path=SHOTS / "08-risk-offer.png", full_page=True)

    # Frequency cap — WITHIN a session. Deliberately not a reload: the cap is
    # held in memory only, because persisting it would mean storing "this
    # person triggered the risk path today", which is exactly the record this
    # design refuses to keep. A fresh launch resetting it is the documented,
    # accepted trade. See core/safety/risk-phrases.js.
    page.goto(f"{BASE}/index.html#/today", wait_until="networkidle")
    page.wait_for_timeout(600)
    page.goto(f"{BASE}/index.html#/mika", wait_until="networkidle")
    page.wait_for_selector("[data-screen='arrival'] .mika-screen__foot .btn", timeout=20000)
    page.locator(".mika-screen__foot .btn--primary").click()
    page.wait_for_selector(".mika-field")
    page.fill(".mika-field", RISKY)
    page.locator(".mika-screen__foot .btn--primary").click()
    page.wait_for_selector(".gathering"); page.locator(".gathering").click()
    page.wait_for_selector(".mika-line--received"); page.wait_for_timeout(2900)
    check("the offer does not repeat within the cap", page.locator(".mika-risk").count() == 0)

    # ---------- 13. the response selector reads shape, never content ----------
    shape = page.evaluate("""async () => {
        const m = await import('./features/mika/response-selector.js');
        return {
            quiet: m.selectBucket({ length: 0 }),
            light: m.selectBucket({ length: 12, seconds: 10, mood: 4 }),
            heavy: m.selectBucket({ length: 400, seconds: 30, mood: 3 }),
            veryHeavy: m.selectBucket({ length: 12, seconds: 5, mood: 1 }),
            deleting: m.selectBucket({ length: 120, seconds: 40, deletionRatio: 0.8, mood: 3 }),
            takesNoText: m.selectBucket.length
        };
    }""")
    check("shape only: nothing written is 'quiet'", shape["quiet"] == "quiet")
    check("shape only: short and quick is 'light'", shape["light"] == "light")
    check("shape only: long is 'heavy'", shape["heavy"] == "heavy")
    check("shape only: a very heavy day overrides brevity", shape["veryHeavy"] == "veryHeavy")
    check("shape only: heavy deleting reads as heavy", shape["deleting"] == "heavy")

    src = pathlib.Path("/root/prc-app/features/mika/response-selector.js").read_text()
    check("the selector cannot see the text at all",
          "text" not in src.split("export function selectBucket")[1].split("}")[0])

    # ---------- 14. Today zone 4 after a Heavy check-in ----------
    page.goto(f"{BASE}/index.html#/today", wait_until="networkidle")
    page.wait_for_selector(".mood[data-mood='2']", timeout=5000)
    page.locator(".mood[data-mood='2']").click()
    page.wait_for_timeout(900)
    label = page.locator(".today__offer .btn__label").inner_text()
    check("a Heavy day offers Mika", label == "Mika's here, if you want", label)
    page.locator(".mood[data-mood='1']").click()
    page.wait_for_timeout(700)
    label1 = page.locator(".today__offer .btn__label").inner_text()
    check("a Very heavy day offers presence, not writing",
          label1 == "Sit with me a minute", label1)
    check("still exactly one filled button on Today",
          page.locator(".today .btn--primary").count() == 1)

    # ---------- 15. Mika lives in the garden ----------
    page.goto(f"{BASE}/index.html#/garden", wait_until="networkidle")
    page.wait_for_selector(".garden-scene__mika .mika", timeout=5000)
    check("Mika is in the garden", page.locator(".garden-scene__mika .mika").count() == 1)
    box = page.evaluate("""() => { const r = document.querySelector('.garden-scene__mika')
        .getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }""")
    check("and is a real 48px target", box[0] >= 48 and box[1] >= 48, box)
    page.wait_for_timeout(900)
    page.screenshot(path=SHOTS / "09-garden-with-mika.png")

    # ---------- 16. reduced motion ----------
    page.goto(f"{BASE}/index.html#/me", wait_until="networkidle")
    set_prefs(motion="reduced")
    page.reload(wait_until="networkidle")
    open_mika()
    sways = page.evaluate("""() => getComputedStyle(document.querySelector('.mika__sway')).animationName""")
    check("reduced motion: the sway stops", sways == "none", sways)
    breathes = page.evaluate("""() => getComputedStyle(document.querySelector('.mika__breath')).animationName""")
    check("reduced motion: the breathing is KEPT — it is therapeutic content",
          breathes == "mika-breathe", breathes)
    page.locator(".mika-screen__foot .btn--primary").click()
    page.wait_for_selector(".mika-field")
    page.fill(".mika-field", "short one")
    page.locator(".mika-screen__foot .btn--primary").click()
    page.wait_for_selector(".gathering", timeout=5000)
    check("reduced motion: the leaves do not travel",
          page.locator(".leaf--still").count() > 0)
    page.wait_for_selector(".mika-line--received", timeout=5000)
    check("reduced motion: the meaning still arrives", True)
    page.screenshot(path=SHOTS / "10-reduced.png")

    # ---------- 17. bahasa malaysia ----------
    page.goto(f"{BASE}/index.html#/me", wait_until="networkidle")
    set_prefs(motion="full", lang="ms", theme="dark")
    page.reload(wait_until="networkidle")
    open_mika()
    page.wait_for_timeout(400)
    bm = page.locator("#main").inner_text()
    check("Mika speaks Malay", "Saya" in bm or "saya" in bm, bm[:70])
    check("no 'anda' anywhere", " anda " not in bm.lower(), bm[:100])
    page.screenshot(path=SHOTS / "11-mika-night-bahasa.png")

    # ---------- 18. narrow screen ----------
    page.set_viewport_size({"width": 320, "height": 720})
    page.goto(f"{BASE}/index.html#/holding", wait_until="networkidle")
    page.wait_for_timeout(700)
    of = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check("no overflow at 320px", of <= 0, of)

    check("no console errors across the whole run", not errors, errors[:5])
    browser.close()

print("\n" + "=" * 62)
passed = sum(1 for _, ok, _ in results if ok)
print(f"{passed}/{len(results)} checks passed")
print("=" * 62)
sys.exit(0 if passed == len(results) else 1)
