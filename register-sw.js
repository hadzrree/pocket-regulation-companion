/**
 * app/register-sw.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   Register the service worker and handle updates.
 *
 * THE MOST SAFETY-SENSITIVE DECISION IN THIS FILE
 *   We never call skipWaiting() automatically, and we never show a
 *   "new version available, reload now" banner.
 *
 *   A new version activating mid-session would reload the page. If that
 *   happened during a panic session it would interrupt someone at their most
 *   vulnerable — exactly the unpredictability trauma-informed design forbids.
 *   So: the new worker installs silently in the background, enters "waiting",
 *   and activates on the NEXT launch. The user notices nothing.
 *   Architecture §7.5.
 *
 * PATHS
 *   './sw.js' — relative, never '/sw.js'. On GitHub Pages the app is served
 *   from /<repo-name>/, so a leading slash resolves to the domain root and
 *   the registration silently fails to control anything. Architecture §0.2.
 *
 * DEPENDENCIES  core/store/store.js
 * USED BY       app/main.js
 */

import { setState } from '../core/store/store.js';

/**
 * Register the service worker.
 * Failure is non-fatal: the app works fine without it, just not offline.
 */
export async function register() {
  if (!('serviceWorker' in navigator)) return null;

  try {
    // scope './' limits the worker to this directory and below — which on
    // GitHub Pages is exactly the app.
    const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });

    // A worker is already waiting from a previous visit.
    if (reg.waiting) setState({ updateWaiting: true });

    reg.addEventListener('updatefound', () => {
      const incoming = reg.installing;
      if (!incoming) return;
      incoming.addEventListener('statechange', () => {
        // 'installed' + an existing controller means: an update is ready and
        // waiting. We do NOT activate it. We do NOT tell the user.
        if (incoming.state === 'installed' && navigator.serviceWorker.controller) {
          setState({ updateWaiting: true });
          console.info('[sw] update installed and waiting for next launch');
        }
      });
    });

    return reg;
  } catch (err) {
    console.warn('[sw] registration failed:', err);
    return null;
  }
}

/**
 * Ask the browser to make our storage persistent.
 *
 * WHY THIS MATTERS MORE HERE THAN ALMOST ANYWHERE
 *   iOS evicts website data when storage is under pressure OR when a site has
 *   not been interacted with for a while — and an installed home-screen web
 *   app gets the same quota as a browser tab, not an exemption. This app's
 *   entire value is an on-device record with no cloud backup, so eviction
 *   would silently break the "nothing can ever be lost" rule.
 *
 *   WebKit grants persistence on heuristics that explicitly include whether
 *   the site is installed to the home screen — which is why the install
 *   prompt (Module 7) is framed as a data-safety feature, not growth.
 *
 *   We never tell the user their data might disappear. A person with anxiety
 *   does not need a new thing to worry about and cannot act on it anyway.
 *   We protect it quietly and recover gracefully. Architecture §0.1.
 */
export async function requestPersistence() {
  if (!navigator.storage || !navigator.storage.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    const granted = await navigator.storage.persist();
    console.info(`[storage] persistent: ${granted}`);
    return granted;
  } catch {
    return false;
  }
}
