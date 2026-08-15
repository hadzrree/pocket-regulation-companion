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
  }

  /* Module 3 adds:
   *   '/calm'   → features/panic/calm.view.js   navTab: null, distress: true
   *   '/crisis' → features/crisis/crisis.view.js navTab: null, distress: true
   * Both hide the navigation bar. Clinical Framework §6.
   */
};

/** Where an unknown hash goes. Never render an unrecognised route. */
export const DEFAULT_ROUTE = '/today';
