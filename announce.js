/**
 * core/a11y/announce.js
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   Manage the single aria-live region, so screen reader users are told when
 *   something changes that they cannot see.
 *
 * THE RULE THAT MATTERS
 *   Announcements are ALWAYS polite, never assertive.
 *
 *   `assertive` interrupts whatever the screen reader is currently saying.
 *   In this app that would mean cutting across a user mid-sentence to tell
 *   them a mood was saved — and on the crisis card, an assertive interruption
 *   would be genuinely alarming for someone already distressed.
 *   Clinical Framework §14; Architecture §9.3.
 *
 * DEPENDENCIES  none
 * USED BY       every view that changes something without a visible focus move
 * SPEC          Architecture §9.3
 */

let region = null;
let clearTimer = null;

/** Find (or lazily create) the live region declared in index.html. */
function getRegion() {
  if (region && document.body.contains(region)) return region;
  region = document.getElementById('live');
  if (!region) {
    region = document.createElement('div');
    region.id = 'live';
    region.className = 'sr-only';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
  }
  return region;
}

/**
 * Announce a message politely.
 *
 * @param {string} message  plain text. Keep it short — a screen reader user
 *                          hearing a paragraph mid-task is not being helped.
 *
 * IMPLEMENTATION NOTE
 *   The region is cleared first and the message set on the next frame.
 *   Without this, setting the same text twice in a row is not announced at
 *   all, because the DOM did not change.
 */
export function announce(message) {
  const node = getRegion();
  clearTimeout(clearTimer);
  node.textContent = '';

  requestAnimationFrame(() => {
    node.textContent = String(message ?? '');
    // Clear after a while so the region doesn't linger in the accessibility
    // tree as stale content.
    clearTimer = setTimeout(() => { node.textContent = ''; }, 4000);
  });
}

/**
 * Announce a route change. Called by the router.
 * Screen reader users get no visual page-change cue, so this is how they know.
 */
export function announceRoute(title) {
  announce(title);
}
