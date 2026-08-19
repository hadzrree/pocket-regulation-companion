/**
 * app/routes.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The route table. Hash → a function that lazily imports the view.
 *
 * WHY HASH ROUTING
 *   GitHub Pages is a static host with no server-side rewrites. With History
 *   API routing, a hard refresh on /garden would 404 because there is no
 *   /garden file. Hash routing (#/garden) never leaves index.html, so refresh
 *   and deep links always work. 404.html is a belt-and-braces fallback.
 *   Architecture §0.2.
 *
 * WHY DYNAMIC import()
 *   Only the router and Today load at boot. Every other view is fetched on
 *   first navigation, then cached by the service worker. This keeps the
 *   parse-and-execute cost at startup under the 60KB budget.
 *   Architecture §8.2.
 *
 * DEPENDENCIES  none at module load (imports happen on demand)
 * USED BY       app/router.js
 */

/**
 * Each entry:
 *   load        () => Promise<{mount, update?, unmount}>
 *   titleKey    i18n key, announced to screen readers on navigation
 *   navTab      which bottom-nav tab highlights, or null to hide the nav
 *   distress    true if entering this route sets state.inDistressFlow
 */
export const routes = {
  '/today': {
    load: () => import('../features/today/today.view.js'),
    titleKey: 'nav.today',
    navTab: 'today',
    distress: false
  },
  '/regulate': {
    load: () => import('../features/regulate/regulate.view.js'),
    titleKey: 'nav.regulate',
    navTab: 'regulate',
    distress: false
  },
  '/feelings': {
    load: () => import('../features/feelings/feelings.view.js'),
    titleKey: 'nav.feelings',
    navTab: 'feelings',
    distress: false
  },
  '/garden': {
    load: () => import('../features/garden/garden.view.js'),
    titleKey: 'nav.garden',
    navTab: 'garden',
    distress: false
  },
  '/me': {
    load: () => import('../features/me/me.view.js'),
    titleKey: 'nav.me',
    navTab: 'me',
    distress: false
  },

  /* ---- Module 3 · the distress routes -------------------------------------
     All three set navTab: null, which hides the navigation bar, and
     distress: true, which sets state.inDistressFlow.

     WHAT `distress: true` ACTUALLY DOES
       - the global error handler stops surfacing anything
       - Toast.show() returns silently
       - the install prompt is suppressed
       - a waiting service worker will not activate

     In other words: while a person is on one of these screens, the app makes
     no announcements of its own for any reason. Clinical Framework §6.3;
     Architecture §12.1. */

  '/calm': {
    load: () => import('../features/panic/calm.view.js'),
    titleKey: 'calm.title',
    navTab: null,
    distress: true
  },
  '/ground': {
    load: () => import('../features/ground/ground.view.js'),
    titleKey: 'ground.title',
    navTab: null,
    distress: true
  },
  '/crisis': {
    load: () => import('../features/crisis/crisis.view.js'),
    titleKey: 'crisis.title',
    navTab: null,
    distress: true
  },

  /* ---- Module 5 · Mika ----------------------------------------------------
     navTab: null — the nav bar fades out, because the screen quiets before
     Mika arrives and a five-tab bar underneath would undo that entirely.
     Mika gets no tab of its own. Five tabs, permanently. Mika Spec §0.

     distress: FALSE — and that is deliberate. Mika is not a distress flow;
     it is a place to set something down, and it must be able to tell the
     person in its own voice if a save failed. What it must never do is show
     a SYSTEM error mid-gathering, and that is handled by writing the thought
     to storage BEFORE the animation starts rather than by a global flag. */
  '/mika': {
    load: () => import('../features/mika/mika.view.js'),
    titleKey: 'mika.title',
    navTab: null,
    distress: false
  },

  /* The Thought Park, renamed in the interface only. Same storage, same
     rules, same permanence. It keeps the Feelings tab highlighted because
     that is where it lives. */
  '/holding': {
    load: () => import('../features/holding/holding.view.js'),
    titleKey: 'mika.holdingTitle',
    navTab: 'feelings',
    distress: false
  },

  /* ---- Module 6 ----------------------------------------------------------
     The body log keeps the Feelings tab lit, because that is where it lives
     and where the person came from.

     THERE IS DELIBERATELY NO ROUTE TO A SYMPTOM HISTORY. You can record; you
     cannot scroll back. A scrollable symptom feed is a body-checking
     instrument — the person reads yesterday's entry to decide whether today
     is worse, and the comparison generates the next check. The record lives
     in the report, which is a deliberate act with a reason attached.
     Clinical Framework §10.3. */
  '/body': {
    load: () => import('../features/body/body.view.js'),
    titleKey: 'body.title',
    navTab: 'feelings',
    distress: false
  },

  /* Reached only from Me. Nothing links to it from a flow someone uses while
     they are struggling — see the note about counts in report.view.js. */
  '/report': {
    load: () => import('../features/report/report.view.js'),
    titleKey: 'report.title',
    navTab: 'me',
    distress: false
  },

  /* Module 7. The only screen from which anything can leave the device. */
  '/data': {
    load: () => import('../features/data/data.view.js'),
    titleKey: 'data.title',
    navTab: 'me',
    distress: false
  }
};

/** Where an unknown hash goes. Never render an unrecognised route. */
export const DEFAULT_ROUTE = '/today';
