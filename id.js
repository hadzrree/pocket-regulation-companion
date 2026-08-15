/**
 * core/utils/id.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Generate a unique id for a stored record.
 * SPEC      Architecture Appendix B
 *
 * PRIVACY NOTE
 *   These ids identify a RECORD, never a person or a device. They are
 *   generated fresh, stored only on this device, and never transmitted.
 *   Do not repurpose this as a device or install identifier — the app
 *   deliberately has none.
 */

/**
 * @returns {string} a UUID v4
 */
export function uid() {
  // Available on every browser this app targets, in a secure context
  // (GitHub Pages is HTTPS, localhost counts as secure).
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older WebViews. Still cryptographically random.
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;   // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80;   // variant
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Last resort. Not cryptographic, but ids here are not security-sensitive.
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
