# Release Readiness — Pocket Regulation Companion v1.6.0

**Assessed 18 August 2026.** All seven implementation modules are complete.

> **This document exists to be honest about one thing: the software is
> finished and the app is not ready to be given to a patient.** Those are
> different statements, and conflating them is how digital mental-health tools
> get deployed before anyone has read what they say.

---

## 1. Verdict

| Question | Answer |
|---|---|
| Is the software complete against the seven specifications? | **Yes.** All 7 modules built, 304 automated assertions passing. |
| Is it technically safe to deploy publicly? | **Yes** — as a personal/demonstration build. |
| Can it be given to a patient at Hospital Sultanah Aminah? | **No. Not yet.** See §3. |
| Can it be shown to colleagues, or used to seek review? | **Yes**, with the disclaimer in §5. |

**The single blocking item is clinical, not technical.**

---

## 2. What is verified

### Automated, reproducible, all green on 18 August 2026

| Suite | Scope | Result |
|---|---|---|
| `verify-module2.py` | Components, storage, check-in | 32/32 |
| `verify-module3.py` | Breathing, grounding, Calm Mode, crisis | 40/40 |
| `verify-module4.py` | Behavioural activation, garden | 44/44 |
| `verify-module5.py` | Mika | 69/69 |
| `verify-module6.py` | Body log, history, report | 57/57 |
| `verify-module7.py` | Backup, restore, delete, release | 62/62 |
| `verify-a11y.py` | axe-core, 13 routes × 4 modes | 0 violations |
| `verify-a11y-states.py` | axe-core, populated and interactive states | 0 violations |
| `verify-offline.py` | Network disconnected, every route | 22/22 |

### Properties proven by test, not by intention

| Property | How it is proven |
|---|---|
| The app works with no network at all | Network disabled, all 13 routes walked, breathing animates, crisis numbers readable, a check-in saves |
| The growth ledger cannot shrink | `growth` absent from `DELETABLE`; asserted in four suites |
| A person can take back their own words | `thoughts` is the one deletable store |
| A restore cannot destroy newer data | Old file restored over a newer entry; newer entry survives |
| Private writing never leaves by accident | Opt-in per file, off by default, asserted |
| A backup carries nothing identifying | No `settings` key, no name; asserted |
| The interface meets WCAG 2.2 AA on colour, names, roles and structure | 108 audited page states, zero violations |
| Both languages carry the same interface | 192 / 192 key parity, asserted |
| An update can never interrupt a panic session | `skipWaiting()` absent; asserted |

### Measured, not assumed

| | Slow 3G | Fast 3G | Unthrottled |
|---|---|---|---|
| First visit — first paint | 4.6 s | 1.5 s | 0.20 s |
| **Return visit — first paint** | **0.15 s** | 0.15 s | 0.15 s |
| First-visit transfer | 160 KB | 199 KB | 200 KB |
| Return-visit network requests | **0** | 0 | 0 |

---

## 3. Blocking items — clinical

These cannot be closed by an engineer. Every one needs a named clinician to
read the actual words and sign.

| # | Item | Why it blocks |
|---|---|---|
| **B1** | **`core/safety/risk-phrases.js`** — ~31 English and Malay phrases that make Mika offer the crisis card, and the wording of that offer | This is the only place the app responds to something resembling risk. It is currently **a developer's draft**. A false negative means someone disclosing distress meets an ordinary response. A false positive means someone gets a crisis card for a figure of speech and stops writing honestly. Both are clinical harms and neither is an engineering judgement. |
| **B2** | The ~190 Mika lines, especially `heavy`, `veryHeavy` and `quiet` | These are what the app says to a person at their worst. They were written to a copy specification, not reviewed by a clinician. |
| **B3** | The 22 behavioural-activation tasks and the tier thresholds | A tier-1 task offered on a "Very heavy" day must genuinely be achievable at that level of function. |
| **B4** | The 15 body sensations and the standing line | The riskiest copy in the app. It must not reassure, must not suggest a cause, and must send people to a doctor without frightening them. |
| **B5** | Is a body-log cap of three entries per day right? | The cap exists to stop the log becoming a body-checking loop. Three is a considered guess, not a finding. |

---

## 4. Blocking items — language and people

| # | Item | Note |
|---|---|---|
| **L1** | Native-speaker review of **all** Bahasa Malaysia | Open questions carried since Module 3: **Tahan** for the breath hold, **"Dah buat"** for "I did it". Register throughout is *awak*, never *anda*. |
| **L2** | Confirm the name "Mika" with 8–10 Malaysian users | It must not carry an unintended meaning or association. |
| **L3** | Test the 2.4-second silence with users, not reviewers | Reviewers read it as a bug. Users are supposed to read it as being sat with. |
| **U1** | Screen reader pass — TalkBack and VoiceOver, by someone who uses one | axe covers roughly a third of WCAG. It cannot tell you whether the app makes sense to listen to. |
| **U2** | Install and use on a real Android phone and a real iPhone | Everything above was measured in Chromium on a desktop. |

---

## 5. If you show it to anyone before §3 is closed

Say this, in these words or close to them:

> This is a working prototype of an offline self-management app. It is not a
> medical device, it does not diagnose anything, and nothing it says has been
> clinically reviewed yet. Please look at the wording and tell me where it is
> wrong.

Do not describe it to a patient as something to use between sessions until B1
to B5 are signed.

---

## 6. Non-blocking, known, acceptable

| Item | Why it can wait |
|---|---|
| App icons are generated placeholders | Cosmetic. Documented in `docs/ASSETS.md`. |
| Anger / overthinking / numb entry registers exist in `mika-lines.js` but are not routed | Written, unreachable, harmless. A later module can route them. |
| Appendix D2 ("Cold as it goes") not applied in the spec documents | A documentation edit, not a code path. |
| No reminders | A deliberate refusal, documented in `features/me/me.view.js`. A web app cannot schedule a reliable local notification without a server, and an unreliable medication reminder is a safety problem, not a rough edge. |
| No account, no sync, no sharing | The product is defined by their absence. |

---

## 7. What a clinical reviewer should actually read

For B1 to B5, these are the files. They are plain text and every one is
readable without programming knowledge — the words are on their own lines,
in quotes, English and Malay side by side.

| Blocker | File | What to read |
|---|---|---|
| B1 | `core/safety/risk-phrases.js` | The phrase list, and the header explaining what it does and does not do |
| B1 | `core/content/mika-lines.js` → `RISK_LINES` | What is said when a phrase matches |
| B2 | `core/content/mika-lines.js` | `RESPONSES.heavy`, `RESPONSES.veryHeavy`, `RESPONSES.quiet` |
| B3 | `core/content/task-catalogue.js` | All 22 tasks, grouped by tier |
| B4 | `core/content/symptom-catalogue.js` | All 15 sensations |
| B4 | `core/i18n/locales/en.js` → `body.standing` | The standing line |
| — | `core/safety/crisis-resources.js` | The five services and their numbers. **Verified 15 August 2026 — re-verify before release.** |

---

## 8. Sign-off

| Item | Reviewer | Date | Signed |
|---|---|---|---|
| B1 Risk phrases and response | | | |
| B2 Mika lines | | | |
| B3 Task catalogue | | | |
| B4 Body sensations and standing line | | | |
| B5 Body-log daily cap | | | |
| L1 Bahasa Malaysia | | | |
| U1 Screen reader | | | |
| Crisis numbers re-verified | | | |
