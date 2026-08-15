/**
 * core/components/Toast.js
 * ---------------------------------------------------------------------------
 * PURPOSE   A brief message that appears, is read, and leaves by itself.
 *
 * THE THREE RULES THAT GOVERN THIS COMPONENT
 *
 *   1. NEVER DURING A DISTRESS FLOW. If `inDistressFlow` is true, show()
 *      returns silently. A toast sliding in over a breathing circle is an
 *      interruption at the exact moment interruption is most harmful.
 *      Clinical Framework §6; Architecture §12.1.
 *
 *   2. NEVER FOR AN ERROR THE USER CANNOT ACT ON. "Sync failed" is noise.
 *      Toasts here confirm that something the user did was kept, or explain
 *      something they can respond to.
 *
 *   3. NEVER TAKES FOCUS. Focus stays exactly where the user put it. The
 *      message is announced through the polite live region instead, so screen
 *      reader users hear it when they reach a natural pause rather than being
 *      cut off mid-word.
 *
 * WHY ONE TOAST AT A TIME
 *   A stack of toasts is a queue of demands. Showing a new one replaces the
 *   old one — the most recent thing is the only thing worth saying.
 *
 * DEPENDENCIES  core/utils/dom, core/a11y/announce, core/store
 * SPEC          Design Language §16; Clinical Framework §6
 */

import { el, on, qs } from '../utils/dom.js';
import { announce } from '../a11y/announce.js';
import { getState } from '../store/store.js';
import { icon as buildIcon } from './icons.js';
import { t } from '../i18n/i18n.js';

let host = null;
let hideTimer = null;
let cleanup = null;

/** The container is created once, lazily, and reused. */
function getHost() {
  if (host && document.body.contains(host)) return host;
  host = qs('#toast-host');
  if (!host) {
    host = el('div', { id: 'toast-host', class: 'toast-host' });
    document.body.appendChild(host);
  }
  return host;
}

/**
 * Show a toast.
 *
 * @param {string} message
 * @param {Object} [options]
 * @param {'info'|'kept'|'care'} [options.tone='kept']
 * @param {number} [options.duration=4200]  ms. Long enough to read slowly.
 * @param {{label: string, onClick: Function}} [options.action]
 * @returns {boolean} false if suppressed
 */
export function show(message, options = {}) {
  // Rule 1. The gate.
  if (getState().inDistressFlow) return false;

  const { tone = 'kept', duration = 4200, action } = options;

  dismiss();

  const node = el('div', { class: `toast toast--${tone}`, role: 'status' }, [
    buildIcon(tone === 'care' ? 'heart' : 'check', { size: 20, class: 'toast__icon' }),
    el('p', { class: 'toast__text' }, message),
    action
      ? el('button', { type: 'button', class: 'toast__action' }, action.label)
      : null,
    el('button', {
      type: 'button',
      class: 'toast__close',
      'aria-label': t('common.close')
    }, buildIcon('x', { size: 18 }))
  ].filter(Boolean));

  const removers = [];
  const closeBtn = node.querySelector('.toast__close');
  removers.push(on(closeBtn, 'click', dismiss));

  if (action) {
    const actionBtn = node.querySelector('.toast__action');
    removers.push(on(actionBtn, 'click', () => { dismiss(); action.onClick(); }));
  }
  cleanup = () => removers.forEach((fn) => fn());

  getHost().appendChild(node);
  requestAnimationFrame(() => node.classList.add('is-visible'));

  // Rule 3. Announced, not focused.
  announce(message);

  hideTimer = setTimeout(dismiss, duration);
  return true;
}

/** Remove the current toast, if any. Safe to call at any time. */
export function dismiss() {
  clearTimeout(hideTimer);
  hideTimer = null;
  if (cleanup) { cleanup(); cleanup = null; }

  const current = getHost().firstElementChild;
  if (!current) return;

  current.classList.remove('is-visible');
  // Wait for the fade before removing, so it does not vanish abruptly.
  setTimeout(() => current.remove(), 260);
}
