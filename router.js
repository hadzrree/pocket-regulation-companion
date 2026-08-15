/**
 * app/router.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   Hash routing, view lifecycle, page transitions, and nav-bar visibility.
 *
 * THE VIEW CONTRACT
 *   Every view module exports the same three functions. This uniformity is
 *   what lets the router manage any view without knowing anything about it:
 *
 *     mount(container, params)   build the DOM, subscribe to things
 *     update(state)              optional — react to a store change
 *     unmount()                  remove EVERY listener, cancel EVERY timer
 *
 *   unmount() is not optional and not best-effort. A breathing pacer left
 *   running after navigation is a battery drain and, worse, a haptic pulse
 *   firing on an unrelated screen. Architecture §4.5.
 *
 * TRANSITIONS
 *   Fade, never slide. Sliding implies distance and urgency; this app has
 *   neither. Design Language §11.
 *
 * DEPENDENCIES  ./routes.js, core/store, core/a11y/announce, core/utils/dom
 * USED BY       app/main.js
 * SPEC          Architecture §4.5, §6
 */

import { routes, DEFAULT_ROUTE } from './routes.js';
import { setState, getState, subscribe } from '../core/store/store.js';
import { announceRoute } from '../core/a11y/announce.js';
import { clear, qs } from '../core/utils/dom.js';
import { t } from '../core/i18n/i18n.js';

let currentView = null;      // the mounted module
let currentPath = null;
let isFirstRender = true;    // see the focus note in render()
let unsubscribeStore = null;
let container = null;

/** Normalise location.hash into a route path. */
function pathFromHash() {
  const raw = (location.hash || '').replace(/^#/, '');
  const path = raw.split('?')[0] || DEFAULT_ROUTE;
  // An unknown route is never rendered — it goes to Today. Architecture §14.4.
  return routes[path] ? path : DEFAULT_ROUTE;
}

/** Parse ?a=b from the hash into an object. */
function paramsFromHash() {
  const raw = (location.hash || '').replace(/^#/, '');
  const query = raw.split('?')[1];
  return query ? Object.fromEntries(new URLSearchParams(query)) : {};
}

/**
 * Tear down the current view completely.
 * Any error here is logged, never surfaced — a failure to clean up must not
 * become a visible error, least of all during a distress flow.
 */
function teardown() {
  if (unsubscribeStore) { unsubscribeStore(); unsubscribeStore = null; }
  if (currentView && typeof currentView.unmount === 'function') {
    try {
      currentView.unmount();
    } catch (err) {
      console.error('[router] unmount threw:', err);
    }
  }
  currentView = null;
}

/** Show or hide the bottom navigation for a route. */
function setNavVisibility(route) {
  const nav = qs('#nav');
  if (!nav) return;
  const hidden = route.navTab === null;
  nav.hidden = hidden;
  nav.setAttribute('aria-hidden', String(hidden));
  // Highlight the active tab. NavBar (Module 2) reads this attribute.
  nav.dataset.active = route.navTab || '';
}

/**
 * Navigate to a path. Called by the hashchange listener and by navigate().
 */
async function render(path) {
  const route = routes[path];
  if (!route) return;

  const previous = currentPath;
  teardown();

  setState({
    route: path,
    previousRoute: previous,
    inDistressFlow: Boolean(route.distress)
  });

  setNavVisibility(route);

  // Fade the old content out, then the new content in. 200ms out / 320ms in,
  // within the --duration-slower page-transition budget.
  container.classList.add('is-leaving');
  await new Promise((r) => setTimeout(r, 160));

  clear(container);
  container.classList.remove('is-leaving');

  let module;
  try {
    module = await route.load();
  } catch (err) {
    // A chunk failed to load — almost always a stale cache after a deploy.
    // Recover to Today rather than showing a blank screen. Architecture §12.4.
    console.error('[router] failed to load view:', path, err);
    if (path !== DEFAULT_ROUTE) return render(DEFAULT_ROUTE);
    return;
  }

  currentView = module;
  currentPath = path;

  try {
    module.mount(container, paramsFromHash());
  } catch (err) {
    console.error('[router] mount threw:', path, err);
  }

  // Wire optional reactive updates.
  if (typeof module.update === 'function') {
    unsubscribeStore = subscribe((state) => {
      try { module.update(state); } catch (e) { console.error('[router] update threw:', e); }
    });
  }

  container.classList.add('is-entering');
  requestAnimationFrame(() => container.classList.remove('is-entering'));

  // Screen reader users get no visual page-change cue.
  announceRoute(t(route.titleKey));

  // Move focus to the new content so keyboard users are not left at the top
  // of the document. tabindex="-1" on #main makes this possible.
  //
  // NOT on the very first render, though. On initial page load the natural
  // focus position is the top of the document, where the skip link lives.
  // Stealing focus into #main immediately would mean a keyboard user is never
  // offered the skip link at all. On every SUBSEQUENT navigation, moving
  // focus is correct — otherwise they'd have to tab back through the whole
  // page to reach new content.
  if (!isFirstRender) container.focus({ preventScroll: true });
  isFirstRender = false;
  window.scrollTo({ top: 0, behavior: 'auto' });
}

/**
 * Programmatic navigation.
 * @param {string} path e.g. '/garden'
 */
export function navigate(path) {
  if (path === currentPath) return;
  location.hash = `#${path}`;
}

/** The path currently displayed. */
export function current() {
  return currentPath;
}

/**
 * Start routing. Called once from app/main.js.
 * @param {HTMLElement} mountPoint  normally #main
 */
export function start(mountPoint) {
  container = mountPoint;
  window.addEventListener('hashchange', () => render(pathFromHash()));
  return render(pathFromHash());
}
