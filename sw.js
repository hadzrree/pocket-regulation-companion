/**
 * sw.js — Service Worker
 * ---------------------------------------------------------------------------
 * THIS FILE MUST LIVE AT THE REPOSITORY ROOT.
 * A service worker's scope is limited to its own directory and below. Put it
 * in /js/ and it can only control /js/. Architecture §0.2.
 *
 * WHAT IT DOES
 *   Precaches the app shell so the app opens instantly and works with no
 *   network — which is the whole product. Someone at 3am on a phone with no
 *   signal must be able to reach the breathing screen.
 *
 * THE MOST SAFETY-SENSITIVE DECISION HERE
 *   skipWaiting() is NEVER called. A new version installs silently in the
 *   background and activates on the NEXT launch. Activating mid-session would
 *   reload the page — and if that happened during a panic session it would
 *   interrupt someone at their most vulnerable. Architecture §7.5.
 *
 * SPEC  Architecture §7.3, §7.5
 */

/* Bump this string on EVERY release. It is what triggers the update and the
   cleanup of the previous cache. */
const CACHE = 'prc-v1.0.1-module1';

/* The app shell. Every path relative — see the header note. */
const SHELL = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',

  './styles/main.css',
  './styles/01-tokens/colors.css',
  './styles/01-tokens/typography.css',
  './styles/01-tokens/spacing.css',
  './styles/01-tokens/radius.css',
  './styles/01-tokens/shadows.css',
  './styles/01-tokens/motion.css',
  './styles/01-tokens/layout.css',
  './styles/02-base/reset.css',
  './styles/02-base/fonts.css',
  './styles/02-base/elements.css',
  './styles/02-base/a11y.css',
  './styles/03-components/nav-bar.css',
  './styles/04-features/transitions.css',
  './styles/04-features/settings.css',
  './styles/05-utilities/layout.css',
  './styles/05-utilities/text.css',

  './app/main.js',
  './app/router.js',
  './app/routes.js',
  './app/register-sw.js',

  './core/store/store.js',
  './core/store/initial-state.js',
  './core/events/bus.js',
  './core/utils/dom.js',
  './core/utils/result.js',
  './core/utils/id.js',
  './core/utils/date.js',
  './core/a11y/prefs.js',
  './core/a11y/announce.js',
  './core/i18n/i18n.js',
  './core/i18n/locales/en.js',
  './core/i18n/locales/ms.js',

  './features/today/today.view.js',
  './features/regulate/regulate.view.js',
  './features/feelings/feelings.view.js',
  './features/garden/garden.view.js',
  './features/me/me.view.js',

  './assets/icons/favicon.svg',
  './assets/icons/app/icon-192.png',
  './assets/icons/app/icon-512.png',
  './assets/icons/app/maskable-512.png',
  './assets/icons/app/apple-touch-icon.png'

  /* Fonts are added here once the WOFF2 files exist — see docs/ASSETS.md.
     Audio is NEVER precached: it is large, optional, and most users never
     enable it. Architecture §7.3. */
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // addAll is atomic: if ONE file 404s the whole install fails, which is
      // what we want — a half-cached shell is worse than no cache.
      // We add individually with a catch so a single missing optional asset
      // (an icon that hasn't been made yet) doesn't block the whole install.
      Promise.all(
        SHELL.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[sw] could not cache', url, err);
          })
        )
      )
    )
  );

  /* NOTE: skipWaiting() is deliberately NOT called.
     Do not add it. See the header. Architecture §7.5. */
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only GET is cacheable, and the app makes no other kind of request.
  if (event.request.method !== 'GET') return;

  // Never touch cross-origin requests. The CSP means there shouldn't be any,
  // but a service worker must not become the thing that allows one.
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((hit) => {
      if (hit) return hit;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() =>
          // Offline and not cached. For a page navigation, show the fallback.
          // For anything else, fail quietly — a missing asset must never
          // become a visible error. Architecture §12.3.
          event.request.mode === 'navigate'
            ? caches.match('./offline.html')
            : new Response('', { status: 504, statusText: 'Offline' })
        );
    })
  );
});
