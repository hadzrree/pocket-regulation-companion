/**
 * features/crisis/crisis.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   The help screen. Phone numbers, nothing else.
 *
 * ============================================================================
 * WHY THIS IS ITS OWN SCREEN AND NOT A DIALOG
 * ============================================================================
 *   A dialog can be dismissed by an accidental tap outside it, sits on top of
 *   whatever was underneath, and traps focus in a way that some screen reader
 *   and switch-access setups handle badly. A route is a place: it can be
 *   reached from anywhere, it survives the browser back button, and it can be
 *   bookmarked or added to the home screen as a shortcut by someone who wants
 *   the numbers one tap away.
 *
 * ============================================================================
 * MARKED AS A DISTRESS FLOW
 * ============================================================================
 *   `distress: true` in the route table hides the navigation bar and silences
 *   every error path. Someone who reached this screen should not, under any
 *   circumstances, be shown "something went wrong".
 *
 * ============================================================================
 * WHAT IS NOT ON THIS SCREEN
 * ============================================================================
 *   No safety plan questionnaire. No "are you thinking of hurting yourself?".
 *   No risk triage. No auto-dial. No countdown before calling. No message
 *   sent to anyone.
 *
 *   Screening someone at the moment they are looking for a phone number puts
 *   an obstacle between them and the number. If they wanted to be assessed
 *   they would call the line, which is staffed by people trained to do it.
 *   The app's entire job here is to be a short, calm, accurate list.
 *   Clinical Framework §6.4.
 *
 * DEPENDENCIES  core/components/CrisisList, core/components/Button
 * SPEC          Clinical Framework §6; PRD S18
 */

import { el, clear } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';
import { CrisisList } from '../../core/components/CrisisList.js';
import { Button } from '../../core/components/Button.js';
import { navigate } from '../../app/router.js';
import { emit, EVENTS } from '../../core/events/bus.js';

export function mount(container) {
  emit(EVENTS.CRISIS_OPENED, { from: 'route' });

  clear(container);
  container.appendChild(
    el('div', { class: 'u-screen u-screen-y u-stack crisis-screen' }, [
      el('h1', { class: 't-h2' }, t('crisis.title')),
      el('p', { class: 't-body t-muted' }, t('crisis.intro')),
      CrisisList(),

      /* The way back. A real control, at the bottom, because the navigation
         bar is hidden on this route — a screen with no exit is a trap, and a
         trap is the last thing this particular screen may be. */
      el('div', { class: 'crisis-screen__foot' },
        Button({
          label: t('common.back'),
          variant: 'quiet',
          size: 'lg',
          full: true,
          icon: 'arrowLeft',
          onClick: () => navigate('/today')
        })
      )
    ])
  );
}

export function unmount() {}
