/**
 * core/components/NavBar.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The five-tab bottom navigation. Replaces the minimal version that
 *           lived inline in app/main.js during Module 1.
 *
 * FIVE TABS, NEVER SIX
 *   Every additional tab is another decision to make before the user has done
 *   the thing they opened the app to do. Five is the ceiling and it is not
 *   negotiable — a sixth feature earns a place inside an existing tab, or it
 *   does not ship. PRD §3.1.
 *
 * ICON AND WORD, ALWAYS
 *   Icon-only navigation forces RECALL ("which one was the leaf?"). Icon plus
 *   word allows RECOGNITION. Recall is expensive when concentration is gone,
 *   which is precisely when this app is opened. Clinical Framework §14.
 *
 * HOW THE ACTIVE TAB IS SET
 *   The router writes `nav.dataset.active`. This component observes that one
 *   attribute and repaints. The router therefore never needs to import the
 *   nav bar, and the nav bar never needs to know the route table — either
 *   could be replaced without touching the other.
 *
 * THE BAR DISAPPEARS COMPLETELY in Calm Mode and Emergency Mode. In those
 *   moments there is one thing to do, so there is one thing on screen.
 *
 * DEPENDENCIES  core/utils/dom, core/i18n, ./icons.js, app/router
 * SPEC          Design Language §15; Clinical Framework §14; PRD S05
 */

import { el, on, clear } from '../utils/dom.js';
import { t } from '../i18n/i18n.js';
import { icon as buildIcon } from './icons.js';
import { pulse, HAPTIC } from '../utils/haptics.js';

/** The complete tab set. Adding a sixth entry here is a spec violation. */
export const TABS = Object.freeze([
  { id: 'today',    path: '/today',    key: 'nav.today',    icon: 'home' },
  { id: 'regulate', path: '/regulate', key: 'nav.regulate', icon: 'wind' },
  { id: 'feelings', path: '/feelings', key: 'nav.feelings', icon: 'heart' },
  { id: 'garden',   path: '/garden',   key: 'nav.garden',   icon: 'sprout' },
  { id: 'me',       path: '/me',       key: 'nav.me',       icon: 'user' }
]);

let observer = null;
let cleanups = [];

/**
 * Build (or rebuild) the navigation bar inside the given <nav>.
 *
 * IDEMPOTENT BY DESIGN. It is called again on every language change, so it
 * must fully tear down what it built last time. The Module 1 bug this
 * prevents: switching to Bahasa Malaysia re-rendered the view but left five
 * English tab labels behind, leaving the app half-translated.
 *
 * @param {HTMLElement} nav          the #nav element
 * @param {(path:string) => void} onNavigate
 */
export function mount(nav, onNavigate) {
  if (!nav) return;
  destroy();

  nav.setAttribute('aria-label', t('nav.label'));
  clear(nav);

  const list = el('div', { class: 'navbar', role: 'tablist' });

  const buttons = TABS.map((tab) => {
    const button = el('button', {
      class: 'navbar__tab',
      role: 'tab',
      type: 'button',
      'data-tab': tab.id,
      'aria-selected': 'false'
    }, [
      el('span', { class: 'navbar__glyph' }, buildIcon(tab.icon, { size: 24 })),
      el('span', { class: 'navbar__label' }, t(tab.key))
    ]);

    cleanups.push(on(button, 'click', () => {
      pulse(HAPTIC.tap);
      onNavigate(tab.path);
    }));

    list.appendChild(button);
    return button;
  });

  nav.appendChild(list);

  /** Reflect nav.dataset.active onto the five tabs. */
  const paint = () => {
    const active = nav.dataset.active;
    buttons.forEach((b) => {
      const isActive = b.dataset.tab === active;
      b.setAttribute('aria-selected', String(isActive));
      // The selected icon also thickens. Position is never carried by colour
      // alone — Design Language §18.
      const glyph = b.querySelector('.icon');
      if (glyph) glyph.classList.toggle('icon--bold', isActive);
    });
  };

  observer = new MutationObserver(paint);
  observer.observe(nav, { attributes: true, attributeFilter: ['data-active'] });
  paint();
}

/** Remove every listener and observer this component added. */
export function destroy() {
  if (observer) { observer.disconnect(); observer = null; }
  cleanups.forEach((fn) => fn());
  cleanups = [];
}
