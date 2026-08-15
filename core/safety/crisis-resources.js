/**
 * core/safety/crisis-resources.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   The Malaysian crisis contacts, as a frozen constant.
 *
 * ============================================================================
 * WHY THIS FILE IS FROZEN, HARD-CODED, AND HAS NO NETWORK CALL
 * ============================================================================
 *   These numbers must work when there is no internet, no storage quota, no
 *   service worker, and no successful boot of anything else. They are part of
 *   the JavaScript bundle itself, so if the app renders at all, the numbers
 *   are present. Fetching them would mean that the one feature that must
 *   never fail is the one feature that depends on a network.
 *
 *   Object.freeze() means no other module can mutate them at runtime.
 *
 * ============================================================================
 * MAINTENANCE — READ BEFORE EVERY RELEASE
 * ============================================================================
 *   A crisis line that has changed its number is worse than no number at all:
 *   a person in distress dials, gets a dead tone, and concludes that nobody
 *   is there. VERIFY EVERY NUMBER BELOW AGAINST ITS OFFICIAL SOURCE BEFORE
 *   EACH RELEASE, and record the date in `verifiedOn`.
 *
 *   Verified: 2026-08-15
 *
 * ============================================================================
 * WHAT THIS APP DOES NOT DO
 * ============================================================================
 *   It does not auto-dial. It does not contact anyone on the user's behalf.
 *   It does not notify a clinician, a caregiver or an emergency service.
 *   Every one of those would be a surveillance feature wearing a safety
 *   costume, and the privacy promise is what makes disclosure possible in the
 *   first place. The app offers the number; the person decides.
 *   Clinical Framework §6.4; PRD §3.2.
 *
 * DEPENDENCIES  none
 * USED BY       the crisis card, the Me tab, Emergency Mode (Module 3)
 * SPEC          Clinical Framework §6; PRD S18
 */

export const VERIFIED_ON = '2026-08-15';

/**
 * Ordered deliberately: talk-to-someone lines first, emergency services last.
 *
 * WHY 999 IS NOT AT THE TOP
 *   Most people opening this card are distressed, not in immediate physical
 *   danger. Leading with emergency services frames their feeling as an
 *   emergency requiring intervention, which is both inaccurate and — for
 *   anyone who fears involuntary admission — a reason to close the app and
 *   tell nobody. The talk lines come first because they fit what is actually
 *   happening. 999 is present, clearly, for when it is needed.
 */
export const CRISIS_CONTACTS = Object.freeze([
  Object.freeze({
    id: 'heal',
    name: 'Talian HEAL',
    number: '15555',
    dial: 'tel:15555',
    hours: { en: '24 hours, every day', ms: '24 jam, setiap hari' },
    note: {
      en: 'Ministry of Health counselling line. Free.',
      ms: 'Talian kaunseling Kementerian Kesihatan. Percuma.'
    }
  }),
  Object.freeze({
    id: 'kasih',
    name: 'Talian Kasih',
    number: '15999',
    dial: 'tel:15999',
    hours: { en: '24 hours, every day', ms: '24 jam, setiap hari' },
    note: {
      en: 'Social welfare and family support.',
      ms: 'Sokongan kebajikan dan keluarga.'
    }
  }),
  Object.freeze({
    id: 'befrienders',
    name: 'Befrienders KL',
    number: '03-7627 2929',
    dial: 'tel:0376272929',
    hours: { en: '24 hours, every day', ms: '24 jam, setiap hari' },
    note: {
      en: 'Someone to talk to. Not counselling — listening.',
      ms: 'Ada orang untuk dengar. Bukan kaunseling — mendengar.'
    }
  }),
  Object.freeze({
    id: 'miasa',
    name: 'MIASA',
    number: '1-800-18-0066',
    dial: 'tel:1800180066',
    hours: { en: 'Daytime, most days', ms: 'Waktu siang, kebanyakan hari' },
    note: {
      en: 'Mental health peer support.',
      ms: 'Sokongan rakan sebaya kesihatan mental.'
    }
  }),
  Object.freeze({
    id: 'mers',
    name: 'MERS 999',
    number: '999',
    dial: 'tel:999',
    hours: { en: '24 hours, every day', ms: '24 jam, setiap hari' },
    note: {
      en: 'Ambulance, police, fire. When someone is in danger now.',
      ms: 'Ambulans, polis, bomba. Bila ada orang dalam bahaya sekarang.'
    }
  })
]);

/**
 * The contacts, with the free-text fields resolved to one language.
 * @param {'en'|'ms'} lang
 */
export function contactsFor(lang = 'en') {
  const code = lang === 'ms' ? 'ms' : 'en';
  return CRISIS_CONTACTS.map((c) => ({
    id: c.id,
    name: c.name,
    number: c.number,
    dial: c.dial,
    hours: c.hours[code],
    note: c.note[code]
  }));
}
