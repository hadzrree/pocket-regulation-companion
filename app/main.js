/**
 * app/main.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   The boot sequence. The first module the page loads, and the only place
 *   that knows the whole app exists.
 *
 * ORDER MATTERS
 *   1. Preferences first — so the correct theme and text size are applied
 *      before anything is drawn.
 *   2. Global error handlers second — so a failure during boot is caught.
 *   3. Navigation bar third — so the shell is present.
 *   4. Router last — it renders the first view.
 *   5. Service worker and persistence AFTER first paint, so they never delay
 *      the thing the user is waiting for.
 *
 * DEPENDENCIES  core/a11y/prefs, core/store, core/events, app/router,
 *               app/register-sw, core/i18n
 * USED BY       index.html (<script type="module" src="./app/main.js">)
 * SPEC          Architecture §2, §12
 */

import * as prefs from '../core/a11y/prefs.js';
import { getState, setState } from '../core/store/store.js';
import { on as busOn, EVENTS } from '../core/events/bus.js';
import { start as startRouter, navigate } from './router.js';
import { register as registerSW, requestPersistence } from './register-sw.js';
import { t } from '../core/i18n/i18n.js';
import { el, qs, on } from '../core/utils/dom.js';

/* ---------------------------------------------------------------------------
   1 · GLOBAL ERROR HANDLING
   The rule that governs this whole section: NO ERROR MAY EVER BE VISIBLE
   DURING A DISTRESS FLOW. If something fails inside Calm Mode, it fails
   silently and the breathing circle keeps moving.
   Clinical Framework §6; Architecture §12.1.
--------------------------------------------------------------------------- */

const errorLog = [];   // ring buffer, last 50. Local only. Never transmitted.

function logError(kind, detail) {
  errorLog.push({ kind, detail: String(detail), at: new Date().toISOString() });
  if (errorLog.length > 50) errorLog.shift();
}

/** Exposed for Settings → "Something's not right" (Module 7). */
export function getErrorLog() {
  return [...errorLog];
}

function handleGlobalError(kind, detail) {
  logError(kind, detail);
  console.error(`[${kind}]`, detail);

  // The gate. Silence during distress.
  if (getState().inDistressFlow) return;

  // Otherwise: recover to Today rather than leaving a blank screen.
  const main = qs('#main');
  if (main && !main.hasChildNodes()) navigate('/today');
}

window.addEventListener('error', (e) => handleGlobalError('error', e.message));
window.addEventListener('unhandledrejection', (e) => handleGlobalError('rejection', e.reason));

/* ---------------------------------------------------------------------------
   2 · CONNECTIVITY
   We track it, but we never announce it. Offline is the NORMAL state for this
   app; telling the user about it would be noise. Architecture §12.3.
--------------------------------------------------------------------------- */

window.addEventListener('online',  () => setState({ isOnline: true }));
window.addEventListener('offline', () => setState({ isOnline: false }));

/* ---------------------------------------------------------------------------
   3 · NAVIGATION BAR
   A minimal version lives here in Module 1 so the shell is navigable.
   Module 2 replaces it with the full NavBar component (floating selected tab,
   Lucide icons, safe-area padding). The markup contract stays the same.
--------------------------------------------------------------------------- */

const TABS = [
  { id: 'today',    path: '/today',    key: 'nav.today' },
  { id: 'regulate', path: '/regulate', key: 'nav.regulate' },
  { id: 'feelings', path: '/feelings', key: 'nav.feelings' },
  { id: 'garden',   path: '/garden',   key: 'nav.garden' },
  { id: 'me',       path: '/me',       key: 'nav.me' }
];

let navObserver = null;

function buildNav() {
  const nav = qs('#nav');
  if (!nav) return;

  // Rebuild from scratch. This function is called again whenever the language
  // changes, so labels must not be assumed to already exist.
  if (navObserver) { navObserver.disconnect(); navObserver = null; }
  while (nav.firstChild) nav.removeChild(nav.firstChild);

  nav.setAttribute('aria-label', t('nav.label'));
  const list = el('div', { class: 'navbar', role: 'tablist' });

  for (const tab of TABS) {
    const button = el(
      'button',
      {
        class: 'navbar__tab',
        role: 'tab',
        type: 'button',
        'data-tab': tab.id,
        'aria-selected': 'false'
      },
      [el('span', { class: 'navbar__label' }, t(tab.key))]
    );
    on(button, 'click', () => navigate(tab.path));
    list.appendChild(button);
  }

  nav.appendChild(list);

  // Reflect the active tab whenever the router updates nav.dataset.active.
  const sync = () => {
    const active = nav.dataset.active;
    for (const b of list.querySelectorAll('.navbar__tab')) {
      b.setAttribute('aria-selected', String(b.dataset.tab === active));
    }
  };
  navObserver = new MutationObserver(sync);
  navObserver.observe(nav, { attributes: true, attributeFilter: ['data-active'] });
  sync();
}

/**
 * Rebuild anything that contains translated text when the language changes.
 *
 * WHY THIS EXISTS
 *   The nav bar is built once at boot. Without this, switching to Bahasa
 *   Malaysia re-rendered the current view but left the five tab labels in
 *   English — the app would be half-translated, which is worse than not
 *   offering the language at all. Bilingual parity is a clinical requirement,
 *   not a nicety. Clinical Framework §22.
 */
function wireLanguageRebuild() {
  busOn(EVENTS.SETTINGS_CHANGED, ({ key }) => {
    if (key !== 'lang') return;
    document.title = t('app.name');
    const skip = qs('.skip-link');
    if (skip) skip.textContent = t('a11y.skipToContent');
    buildNav();
  });
}

/* ---------------------------------------------------------------------------
   4 · BOOT
--------------------------------------------------------------------------- */

async function boot() {
  // Preferences first. The inline script in <head> already applied the theme
  // to avoid a flash; this re-applies from the same source and puts the values
  // into the store so the rest of the app can read them.
  prefs.init();

  // Set the document title in the active language.
  document.title = t('app.name');
  qs('.skip-link') && (qs('.skip-link').textContent = t('a11y.skipToContent'));

  buildNav();
  wireLanguageRebuild();

  const main = qs('#main');
  await startRouter(main);

  // Everything below happens AFTER first paint. None of it may block the
  // thing the user is waiting for.
  requestIdleCallback_(() => {
    registerSW();
    requestPersistence();
  });
}

/** requestIdleCallback with a setTimeout fallback (Safari). */
function requestIdleCallback_(fn) {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 2000 });
  else setTimeout(fn, 200);
}

// The module is deferred by nature, so the DOM is already parsed.
boot().catch((err) => handleGlobalError('boot', err));
