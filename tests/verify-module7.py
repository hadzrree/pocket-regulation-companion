"""
verify-module7.py — Module 7 (Export, Backup, Accessibility, Offline, Release)

Run with the app served at http://127.0.0.1:8099.

WHAT THIS SUITE IS FOR
  Module 7 is the module that can lose people's data. Everything before it
  only ever added records; this one writes a file, merges a file back, and
  deletes the whole database. So the assertions here are mostly about what
  must NOT happen: a restore must not overwrite, a backup must not carry
  anything the person was not told about, and a cancel must actually cancel.

  The accessibility and offline passes live in verify-a11y.py,
  verify-a11y-states.py and verify-offline.py, which are separate because
  they need throttling and network control.
"""
import json
import os
import re
import subprocess
import sys

from playwright.sync_api import sync_playwright

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
BASE = "http://127.0.0.1:8099/index.html"
APP = "/root/prc-app"

passes, fails = [], []


def check(name, ok, detail=""):
    (passes if ok else fails).append(name)
    print(("  PASS  " if ok else "  FAIL  ") + name + (f"  — {detail}" if detail else ""))


def read(rel):
    return open(os.path.join(APP, rel), encoding="utf-8").read()


# ===========================================================================
# 1. SOURCE-LEVEL INVARIANTS
# ===========================================================================
print("\n1. SOURCE")

sw = read("sw.js")
index = read("index.html")
version = read("app/version.js")
backup_src = read("core/storage/backup.js")
db_src = read("core/storage/db.js")

check("service worker cache bumped for this release",
      "prc-v1.6.0-module7" in sw)

app_version = re.search(r"APP_VERSION = '([^']+)'", version).group(1)
cache_version = re.search(r"CACHE = 'prc-v([\d.]+)-", sw).group(1)
check("APP_VERSION and the cache string agree",
      app_version == cache_version, f"{app_version} vs {cache_version}")

check("index.html links the built stylesheet, not the @import index",
      "./styles/app.css" in index and "./styles/main.css" not in index)

check("app.css is precached", "'./styles/app.css'" in sw)
check("the layer files are NOT precached — nothing fetches them",
      "'./styles/01-tokens/colors.css'" not in sw)
check("backup.js is precached", "'./core/storage/backup.js'" in sw)
check("the data view is precached", "'./features/data/data.view.js'" in sw)
check("version.js is precached", "'./app/version.js'" in sw)

# --- the generated stylesheet must match its sources ----------------------
sys.path.insert(0, os.path.join(APP, "tools"))
import importlib.util

spec = importlib.util.spec_from_file_location("buildcss", os.path.join(APP, "tools/build-css.py"))
buildcss = importlib.util.module_from_spec(spec)
spec.loader.exec_module(buildcss)
rebuilt = buildcss.build()
committed = read("styles/app.css")
check("app.css is in step with the layer files it was built from",
      rebuilt == committed,
      "run: python3 tools/build-css.py" if rebuilt != committed else "")

check("app.css rebases font paths out of 02-base/",
      "url('../assets/fonts/nunito-latin.woff2')" in committed
      or 'url("../assets/fonts/nunito-latin.woff2")' in committed)
check("the print layer is still inside @media print after concatenation",
      "@media print {" in committed)

# --- the rules that keep the growth ledger append-only --------------------
check("growth is still not deletable",
      "'growth'" not in re.search(r"DELETABLE = Object\.freeze\(\[([^\]]*)\]", db_src).group(1))
check("thoughts is still the one deletable store",
      "'thoughts'" in re.search(r"DELETABLE = Object\.freeze\(\[([^\]]*)\]", db_src).group(1))

# --- what a backup file may contain ---------------------------------------
check("thoughts are not in the ALWAYS list",
      "STORES.THOUGHTS" not in re.search(r"ALWAYS = Object\.freeze\(\[(.*?)\]\)",
                                         backup_src, re.S).group(1))
check("preferences are not written into the backup file",
      "settings," not in backup_src and "settings:" not in backup_src)
check("restore never calls delete or put",
      ".remove(" not in backup_src and "db.put(" not in backup_src)

# --- copy rules ------------------------------------------------------------
def strip_comments(src):
    """Comments are not copy.

    An earlier version of this check read the whole file and flagged every
    banned word — including the ones in the header that exist precisely to say
    "never use these". A linter that fails on its own documentation teaches
    people to ignore it, so the comments come out first.
    """
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    return re.sub(r"^\s*//.*$", "", src, flags=re.M)


en_copy = strip_comments(read("core/i18n/locales/en.js")).lower()
banned = ["you should", "you must", "don't forget", "make sure", "remember to",
          "streak", "overdue", "you failed", "you missed", "calm down",
          "don't worry", "it's just anxiety"]
found = [w for w in banned if w in en_copy]
check("no forbidden words in the English copy", not found, str(found))

# --- i18n parity -----------------------------------------------------------
def keys_of(path):
    src = strip_comments(read(path))
    body = src[src.index("= {"):]
    out, stack = set(), []
    for line in body.splitlines():
        s = line.strip()
        m = re.match(r"^([A-Za-z_$][\w$]*|'[^']+'|\d+):\s*\{", s)
        if m:
            stack.append(m.group(1).strip("'"))
            continue
        m = re.match(r"^([A-Za-z_$][\w$]*|'[^']+'|\d+):\s*", s)
        if m and not s.startswith("//") and not s.startswith("*"):
            out.add(".".join(stack + [m.group(1).strip("'")]))
        if s.startswith("}"):
            if stack:
                stack.pop()
    return out


k_en, k_ms = keys_of("core/i18n/locales/en.js"), keys_of("core/i18n/locales/ms.js")
check("EN/BM key parity", k_en == k_ms,
      f"{len(k_en)} vs {len(k_ms)}; missing in BM: {sorted(k_en - k_ms)[:5]}; "
      f"extra: {sorted(k_ms - k_en)[:5]}")

# --- the two contrast fixes from the Module 7 audit ------------------------
colors = read("styles/01-tokens/colors.css")
check("light tertiary text meets 4.5:1", "#756E66" in colors)
check("dark tertiary text meets 4.5:1 with headroom", "#999189" in colors)

# --- the screen-reader headings on the three quiet screens -----------------
for f, key in [("features/panic/calm.view.js", "calm.title"),
               ("features/ground/ground.view.js", "ground.title"),
               ("features/mika/mika.view.js", "mika.title")]:
    src = read(f)
    check(f"{f.split('/')[1]} has a screen-reader h1",
          f"'h1', {{ class: 'sr-only' }}, t('{key}')" in src)
    check(f"{f.split('/')[1]}'s h1 is outside the node that gets cleared",
          "container.appendChild(el('h1'" in src)

for f in ["core/storage/backup.js", "features/data/data.view.js",
          "features/me/me.view.js", "app/version.js", "sw.js"]:
    r = subprocess.run(["node", "--check", os.path.join(APP, f)],
                       capture_output=True, text=True)
    check(f"{f} parses", r.returncode == 0, r.stderr.strip()[:120])


# ===========================================================================
# 2. BEHAVIOUR IN A REAL BROWSER
# ===========================================================================
print("\n2. BEHAVIOUR")

SEED = """async () => {
  const db = await import('./core/storage/db.js');
  const { STORES } = await import('./core/storage/migrations.js');
  const thought = await import('./core/storage/repositories/thought.repo.js');
  await db.put(STORES.MOODS, { dateKey: '2026-01-01', mood: 3, note: 'ORIGINAL',
    createdAt: 1, updatedAt: 1, editableUntil: 1 });
  await db.add(STORES.GROWTH, { id: 'seed-1', kind: 'check-in', amount: 1,
    dateKey: '2026-01-01', at: 1 });
  await thought.hold('private words', 'direct');
  return true;
}"""

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 390, "height": 844})
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE + "#/today")
    page.wait_for_timeout(900)
    page.evaluate(SEED)

    # ---- a backup excludes private writing by default ---------------------
    plain = page.evaluate("""async () => {
      const b = await import('./core/storage/backup.js');
      const r = await b.build();
      return { ok: r.ok, keys: Object.keys(r.value.data), file: r.value,
               name: b.filename(false) };
    }""")
    check("a plain backup carries the five ordinary stores",
          sorted(plain["keys"]) == ["growth", "moods", "sessions", "symptoms", "tasks"],
          str(sorted(plain["keys"])))
    check("a plain backup contains no private writing",
          "thoughts" not in plain["keys"])
    check("the file says so in words a person can read",
          "NOT included" in plain["file"]["note"])
    check("no name, no settings, nothing identifying in the file",
          "settings" not in plain["file"])
    check("the filename says what it is and when",
          plain["name"].startswith("pocket-") and plain["name"].endswith(".json")
          and "with-writing" not in plain["name"], plain["name"])

    # ---- opting in ---------------------------------------------------------
    opted = page.evaluate("""async () => {
      const b = await import('./core/storage/backup.js');
      const r = await b.build({ includeThoughts: true });
      return { keys: Object.keys(r.value.data), note: r.value.note,
               n: r.value.data.thoughts.length, name: b.filename(true) };
    }""")
    check("opting in adds the private writing", "thoughts" in opted["keys"] and opted["n"] == 1)
    check("the file warns that it now carries private writing",
          "private" in opted["note"].lower())
    check("the filename says so too", "with-writing" in opted["name"])

    # ---- RESTORE NEVER OVERWRITES -----------------------------------------
    merged = page.evaluate("""async () => {
      const b = await import('./core/storage/backup.js');
      const db = await import('./core/storage/db.js');
      const { STORES } = await import('./core/storage/migrations.js');

      const file = (await b.build()).value;

      // The realistic bad case: an OLD file restored onto a phone that has
      // newer entries. The file's copy of 2026-01-01 says ORIGINAL; the phone
      // now says EDITED LATER. The phone must win.
      await db.put(STORES.MOODS, { dateKey: '2026-01-01', mood: 5,
        note: 'EDITED LATER', createdAt: 1, updatedAt: 2, editableUntil: 1 });
      // ...and a day the phone does not have at all, which must come back.
      file.data.moods.push({ dateKey: '2025-12-25', mood: 2, note: 'FROM FILE',
        createdAt: 1, updatedAt: 1, editableUntil: 1 });

      const out = await b.restore(file);
      const kept = await db.get(STORES.MOODS, '2026-01-01');
      const back = await db.get(STORES.MOODS, '2025-12-25');
      const growth = await db.count(STORES.GROWTH);
      return { added: out.value.added, keptCount: out.value.kept,
               keptNote: kept.value.note, restoredNote: back.value && back.value.note,
               growth: growth.value };
    }""")
    check("a restore does not overwrite what is already on the phone",
          merged["keptNote"] == "EDITED LATER", merged["keptNote"])
    check("a restore does bring back what is missing",
          merged["restoredNote"] == "FROM FILE", str(merged["restoredNote"]))
    check("it reports what it added", merged["added"] == 1, str(merged["added"]))
    check("it reports what it left alone", merged["keptCount"] >= 1, str(merged["keptCount"]))
    check("the growth ledger did not gain a duplicate", merged["growth"] == 1,
          str(merged["growth"]))

    # ---- restoring twice is safe ------------------------------------------
    twice = page.evaluate("""async () => {
      const b = await import('./core/storage/backup.js');
      const db = await import('./core/storage/db.js');
      const { STORES } = await import('./core/storage/migrations.js');
      const file = (await b.build()).value;
      const first = await b.restore(file);
      const before = (await db.count(STORES.MOODS)).value;
      const second = await b.restore(file);
      const after = (await db.count(STORES.MOODS)).value;
      return { firstAdded: first.value.added, secondAdded: second.value.added,
               before, after };
    }""")
    check("running a restore twice changes nothing the second time",
          twice["secondAdded"] == 0 and twice["before"] == twice["after"],
          str(twice))

    # ---- a file that is not one of ours ------------------------------------
    bad = page.evaluate("""async () => {
      const b = await import('./core/storage/backup.js');
      const junk  = new File(['this is a photo, not a backup'], 'x.json', {type:'application/json'});
      const wrong = new File([JSON.stringify({hello:'world'})], 'y.json', {type:'application/json'});
      const newer = new File([JSON.stringify({format: 99, data: {}})], 'z.json', {type:'application/json'});
      const good  = new File([JSON.stringify((await b.build()).value)], 'g.json', {type:'application/json'});
      return {
        junk:  (await b.parse(junk)).code,
        wrong: (await b.parse(wrong)).code,
        newer: (await b.parse(newer)).code,
        good:  (await b.parse(good)).ok
      };
    }""")
    check("unreadable rubbish is refused, not crashed on", bad["junk"] == "bad-file")
    check("valid JSON that is not ours is refused", bad["wrong"] == "bad-file")
    check("a file from a newer version is named as such", bad["newer"] == "newer-file")
    check("our own file is accepted", bad["good"] is True)

    # ---- the screen ---------------------------------------------------------
    page.goto(BASE + "#/data")
    page.wait_for_timeout(900)
    text = page.inner_text("#main")
    check("the data screen says where the data lives", "this phone" in text.lower())
    check("it lists what is in the file BEFORE the button",
          text.index("check-ins") < text.index("Make a copy"))
    check("the private-writing opt-in is off by default",
          page.locator(".data-check__box").is_checked() is False)
    check("the file picker has a name a screen reader can use",
          page.locator(".data-file").get_attribute("aria-label") not in (None, "", "data.restoreAction"))

    # ---- deleting is two steps, and cancel really cancels -------------------
    delete_btn = page.get_by_role("button", name="Delete everything").first
    delete_btn.click()
    page.wait_for_timeout(400)
    check("deleting asks once first",
          "can't be undone" in page.inner_text("#main"))
    page.get_by_role("button", name="Not now").first.click()
    page.wait_for_timeout(400)
    after_cancel = page.inner_text("#main")
    check("cancelling puts the delete button back",
          "Delete everything" in after_cancel and "can't be undone" not in after_cancel)

    still_there = page.evaluate("""async () => {
      const db = await import('./core/storage/db.js');
      const { STORES } = await import('./core/storage/migrations.js');
      return (await db.count(STORES.MOODS)).value;
    }""")
    check("cancelling deleted nothing", still_there > 0, str(still_there))

    # ---- and deleting really deletes ---------------------------------------
    gone = page.evaluate("""async () => {
      const b = await import('./core/storage/backup.js');
      localStorage.setItem('prc.settings', JSON.stringify({ name: 'Aisyah' }));
      await b.destroyEverything();
      const db = await import('./core/storage/db.js');
      const { STORES } = await import('./core/storage/migrations.js');
      const moods = await db.count(STORES.MOODS);
      const thoughts = await db.count(STORES.THOUGHTS);
      return { moods: moods.value, thoughts: thoughts.value,
               settings: localStorage.getItem('prc.settings') };
    }""")
    check("deleting everything empties the database",
          gone["moods"] == 0 and gone["thoughts"] == 0, str(gone))
    check("deleting everything also forgets the person's name",
          gone["settings"] is None, str(gone["settings"]))

    # ---- the Me tab -----------------------------------------------------------
    page.goto(BASE + "#/me")
    page.wait_for_timeout(900)
    me = page.inner_text("#main")
    check("the Me tab shows the release number", app_version in me, app_version)
    check("the Me tab says the app will never chase anyone",
          "never sends notifications" in me)
    check("the Me tab links to the data screen", "Take a copy" in me or "delete" in me.lower())

    check("no console errors anywhere in this run", not errors, str(errors[:2]))
    browser.close()

print(f"\n{len(passes)} passed, {len(fails)} failed")
if fails:
    print("FAILED:")
    for f in fails:
        print("  - " + f)
sys.exit(1 if fails else 0)
