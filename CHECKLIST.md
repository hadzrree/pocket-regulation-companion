# Manual clinical safety checklist

Run before every release. This is the last line of defence for what automation
cannot check. Module 1 covers only the sections marked ✅ — the rest activate
as their features are built.

## ✅ FOUNDATION  (Module 1)
- [ ] Opens with no flash of the wrong theme
- [ ] Works fully offline after first load
- [ ] Installs to the home screen on iOS and Android
- [ ] All five tabs navigate and highlight
- [ ] Every preference applies instantly and persists
- [ ] Language switch translates EVERYTHING including nav labels
- [ ] Skip link is first in tab order
- [ ] 200% text at 320px: no clipping, no horizontal scroll
- [ ] Console clean except the two documented font 404s

## CRISIS  (Module 3)
- [ ] Every crisis number dials on a real Malaysian phone
- [ ] Crisis reachable in ≤2 taps from every screen
- [ ] Crisis works with the network fully disabled
- [ ] "Take me back" present on every crisis screen
- [ ] No red fill, no alarm sound, no blocking modal

## PANIC  (Module 3)
- [ ] FAB → circle moving in under 400ms on a low-end Android
- [ ] Zero buttons in the first 60 seconds
- [ ] No number visible anywhere on screen
- [ ] Haptic fires ONCE per phase, never twice
- [ ] Nothing announced assertively

## SYMPTOMS  (Module 6)
- [ ] Chest tight + Overwhelming → red flag, questions skipped
- [ ] "I'm not sure" → medical care output
- [ ] Safety footer present on the REASSURING output too
- [ ] Fourth check in one day is capped
- [ ] The app never states a symptom "is" anxiety

## LANGUAGE  (every module)
- [ ] No banned word anywhere
- [ ] BM uses "awak", never "anda"
- [ ] Nothing says "Done" at the end of an activity
- [ ] No streak, no percentage, no absence reference

## DATA  (Module 4+)
- [ ] Growth never decreases after a simulated missed week
- [ ] Nothing deletes without explicit user action
- [ ] Export → wipe → restore returns everything
- [ ] Update mid-session does not interrupt it
