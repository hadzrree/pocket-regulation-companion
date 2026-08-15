/**
 * core/components/Button.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Every button in the application comes from here.
 *
 * WHY A FACTORY RATHER THAN JUST WRITING <button class="btn">
 *   Four things must be true of EVERY interactive control in this app, and
 *   three of them are easy to forget:
 *
 *     1. type="button"  — a bare <button> inside a form submits it. There are
 *        no forms here yet, but there will be, and the failure is silent.
 *     2. 400ms double-tap suppression — tremor and slow motor planning cause
 *        accidental double presses. Clinical Framework §14.
 *     3. A haptic pulse that respects the user's setting.
 *     4. A minimum 48px target (56px in a distress flow).
 *
 *   Putting them in one factory means they are true by construction, not by
 *   remembering. That is the whole argument for this file.
 *
 * VARIANTS AND WHAT THEY MEAN
 *   primary    the ONE action on a screen. Never two on one screen.
 *   secondary  a real alternative, equal in weight to declining.
 *   quiet      a way out. "Not now", "Stop here". Must never look punished.
 *   ghost      navigation and low-stakes actions.
 *   crisis     the emergency control. 72px, its own colour, always reachable.
 *
 * A NOTE ON THE "QUIET" VARIANT
 *   In most products the decline option is deliberately made less attractive.
 *   Here it must not be. A user who chooses "Not now" has made a legitimate,
 *   self-aware choice and the interface must not shame them for it — the
 *   whole behavioural-activation model depends on declining being safe.
 *   Clinical Framework §8.3.
 *
 * DEPENDENCIES  core/utils/dom, core/utils/haptics, ./icons.js
 * SPEC          Design Language §5; Clinical Framework §14
 */

import { el, on, once } from '../utils/dom.js';
import { pulse, HAPTIC } from '../utils/haptics.js';
import { icon as buildIcon } from './icons.js';

/**
 * @param {Object} config
 * @param {string} config.label            visible text. Required.
 * @param {Function} [config.onClick]
 * @param {'primary'|'secondary'|'quiet'|'ghost'|'crisis'} [config.variant='primary']
 * @param {'sm'|'md'|'lg'|'xl'} [config.size='lg']
 * @param {string} [config.icon]           an icons.js name
 * @param {'start'|'end'} [config.iconPos='start']
 * @param {boolean} [config.full=false]    stretch to the container width
 * @param {boolean} [config.disabled=false]
 * @param {string} [config.ariaLabel]      when the visible label is not enough
 * @param {Object} [config.data]           data-* attributes
 * @returns {HTMLButtonElement}
 */
export function Button({
  label,
  onClick,
  variant = 'primary',
  size = 'lg',
  icon,
  iconPos = 'start',
  full = false,
  disabled = false,
  ariaLabel,
  data = {}
}) {
  const attrs = {
    type: 'button',
    class: `btn btn--${variant} btn--${size}${full ? ' btn--full' : ''}`,
    disabled: disabled || null,
    'aria-label': ariaLabel || null
  };
  for (const [k, v] of Object.entries(data)) attrs[`data-${k}`] = v;

  const children = [el('span', { class: 'btn__label' }, label)];
  if (icon) {
    const glyph = buildIcon(icon, { size: size === 'sm' ? 18 : 20, class: 'btn__icon' });
    if (iconPos === 'end') children.push(glyph);
    else children.unshift(glyph);
  }

  const node = el('button', attrs, children);

  if (typeof onClick === 'function') {
    // once() is the 400ms suppression. It wraps the handler, so a component
    // author cannot accidentally opt out of it.
    const guarded = once((event) => {
      pulse(HAPTIC.tap);
      onClick(event);
    });
    node.__cleanup = on(node, 'click', guarded);
  }

  return node;
}

/**
 * Remove the listener a Button added.
 * Views that build buttons into a container they later clear() can skip this —
 * removing the node removes its listeners. Call it when a button outlives its
 * view, which currently only happens for the persistent crisis control.
 */
export function destroyButton(node) {
  if (node && typeof node.__cleanup === 'function') {
    node.__cleanup();
    node.__cleanup = null;
  }
}
