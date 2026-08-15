/**
 * core/utils/dom.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   The ONLY DOM helpers in the codebase. Everything that creates or mutates
 *   an element goes through here.
 *
 * WHY THIS FILE EXISTS
 *   `safeText()` and `el()` are the single defence against XSS. The user
 *   writes free text (thoughts, their name) which is later rendered. If any
 *   part of the app assigns user text to innerHTML, a crafted string could
 *   execute script. There is no server to attack here — but there IS the
 *   user's own private data, and this is a mental health app where the
 *   privacy promise is the foundation on which people disclose.
 *
 *   Both functions below insert strings as TEXT NODES. There is no way to
 *   pass HTML through them. That is deliberate: to render markup a developer
 *   must build elements explicitly, which makes the dangerous path visible in
 *   code review rather than accidental.
 *
 * DEPENDENCIES  none
 * USED BY       every component and every view
 * SPEC          Architecture §4.2, §14.2
 */

/**
 * Create an element.
 *
 * @param {string} tag              e.g. 'button'
 * @param {Object} [attrs]          attributes. null/undefined values skipped.
 *                                  'class' maps to className. Everything else
 *                                  uses setAttribute, so data-* and aria-*
 *                                  work without special handling.
 * @param {(Node|string)[]|Node|string} [children]
 *                                  strings become TEXT NODES, never HTML.
 * @returns {HTMLElement}
 *
 * @example
 *   el('button', { class: 'btn', 'aria-label': 'Close' }, 'Close')
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  }

  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.appendChild(
      typeof child === 'string' || typeof child === 'number'
        ? document.createTextNode(String(child))
        : child
    );
  }

  return node;
}

/**
 * Set an element's text content safely.
 * The only sanctioned way to put user-supplied text on screen.
 *
 * @param {Node} node
 * @param {*} value   null/undefined render as an empty string, not "null"
 * @returns {Node}    for chaining
 */
export function safeText(node, value) {
  node.textContent = value === null || value === undefined ? '' : String(value);
  return node;
}

/**
 * Add an event listener and get back a function that removes it.
 *
 * WHY THE RETURN VALUE MATTERS
 *   Forgotten listeners are the most common memory leak in a hand-written
 *   SPA, and in this app a leaked listener can be worse than a leak — a
 *   breathing pacer left subscribed after navigation would fire a haptic
 *   pulse on an unrelated screen. Every view collects these and calls them
 *   all in unmount(). See app/router.js.
 *
 * @returns {() => void} unsubscribe
 */
export function on(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}

/** querySelector, scoped. */
export const qs = (selector, root = document) => root.querySelector(selector);

/** querySelectorAll as a real array, scoped. */
export const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Remove every child of a node. Used by the router when swapping views. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/**
 * Suppress an accidental second tap within `ms`.
 *
 * WHY
 *   Tremor and slow motor planning cause double-taps. Clinical Framework §14
 *   requires 400ms suppression on every interactive control. Wrapping the
 *   handler here means no component has to remember.
 *
 * @param {Function} fn
 * @param {number} [ms=400]
 */
export function once(fn, ms = 400) {
  let last = 0;
  return (...args) => {
    const now = performance.now();
    if (now - last < ms) return;
    last = now;
    return fn(...args);
  };
}
