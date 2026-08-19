/**
 * features/data/data.view.js
 * ---------------------------------------------------------------------------
 * PURPOSE   Your data — take a copy, put one back, or destroy all of it.
 *
 * ============================================================================
 * WHY THIS SCREEN EXISTS AT ALL
 * ============================================================================
 *   There is no account and no server. That is the privacy promise, and it
 *   has a cost the person did not choose: **a lost phone is a lost year.**
 *
 *   A backup file is the only honest answer to that. Without one, "your data
 *   never leaves your device" quietly also means "your data dies with your
 *   device", and nobody agreed to that when they started writing things down.
 *
 * ============================================================================
 * THE PERSON IS TOLD WHAT IS IN THE FILE BEFORE IT IS MADE
 * ============================================================================
 *   Not afterwards, not in a help page. On this screen, above the button,
 *   in a sentence.
 *
 *   Backup features usually say "Export data" and produce something opaque.
 *   Here the file lands in a Downloads folder shared with a file manager, a
 *   cloud sync and whoever else uses the phone, so the person needs to know
 *   what they are putting there while they are deciding.
 *
 * ============================================================================
 * DELETING IS OFFERED PLAINLY AND IS NOT MADE FRIGHTENING
 * ============================================================================
 *   No red button, no warning triangle, no typed confirmation, no guilt about
 *   losing progress. Someone deleting their mental health data may be leaving
 *   an abusive household, handing the phone on, or simply done — and none of
 *   those people should have to fight an interface that is sulking.
 *
 *   One clear sentence about what will happen, one confirmation, and it goes.
 *
 * DEPENDENCIES  core/storage/backup, core/components/Button
 * SPEC          Architecture §16; PRD S40-S42; Clinical Framework §11
 */

import { el, clear, on } from '../../core/utils/dom.js';
import { t } from '../../core/i18n/i18n.js';
import { Button } from '../../core/components/Button.js';
import { Card } from '../../core/components/Card.js';
import * as toast from '../../core/components/Toast.js';
import * as backup from '../../core/storage/backup.js';
import { navigate } from '../../app/router.js';
import { announce } from '../../core/a11y/announce.js';
import { isOk } from '../../core/utils/result.js';

let alive = false;
let cleanups = [];
let includeThoughts = false;

export function mount(container) {
  alive = true;
  includeThoughts = false;

  const host = el('div', { class: 'u-screen u-screen-y u-stack data-screen' });
  clear(container);
  container.appendChild(host);

  host.appendChild(el('h1', { class: 't-h2' }, t('data.title')));
  host.appendChild(el('p', { class: 't-subtitle' }, t('data.intro')));

  host.appendChild(takeACopy());
  host.appendChild(putOneBack());
  host.appendChild(deleteEverything());

  host.appendChild(Button({
    label: t('common.back'), variant: 'quiet', size: 'md', full: true,
    onClick: () => navigate('/me')
  }));
}

/* ==========================================================================
   TAKE A COPY
   ========================================================================== */
function takeACopy() {
  /* The opt-in for private writing. A real checkbox with a real label, not a
     switch buried in a settings list — this is the moment the person decides
     that their own words may exist outside the app. */
  const check = el('input', { type: 'checkbox', id: 'inc-thoughts', class: 'data-check__box' });
  cleanups.push(on(check, 'change', () => { includeThoughts = check.checked; }));

  const optIn = el('label', { class: 'data-check', for: 'inc-thoughts' }, [
    check,
    el('span', { class: 't-body-sm' }, t('data.includeWriting'))
  ]);

  return Card({
    title: t('data.copyTitle'),
    /* Not a tick. A tick beside "Take a copy" reads as "copy taken", and
       someone who glances at this screen and believes their data is already
       backed up will not press the button. Shield: something kept safe. */
    icon: 'shield',
    tone: 'plain',
    body: [
      el('p', { class: 't-body' }, t('data.copyBody')),
      /* What is in the file, stated before the button. */
      el('p', { class: 't-caption t-muted' }, t('data.copyContains')),
      optIn
    ],
    actions: [
      Button({
        label: t('data.copyAction'), variant: 'secondary', size: 'lg',
        onClick: handleExport
      })
    ]
  });
}

async function handleExport() {
  const result = await backup.build({ includeThoughts });
  if (!alive) return;

  if (!isOk(result)) {
    toast.show(t('errors.general'), { tone: 'care' });
    return;
  }

  /* A Blob and an object URL. No network, no server, no third party — the
     file is assembled in memory on the device and handed straight to the
     browser's download machinery. It works with the phone in aeroplane mode,
     which is the point. */
  const blob = new Blob([JSON.stringify(result.value, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = el('a', { href: url, download: backup.filename(includeThoughts) });
  document.body.appendChild(link);
  link.click();
  link.remove();
  /* Released on the next tick. An object URL held forever keeps the whole
     backup alive in memory. */
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  toast.show(t('data.copyDone'), { tone: 'kept' });
  announce(t('data.copyDone'));
}

/* ==========================================================================
   PUT ONE BACK
   ========================================================================== */
function putOneBack() {
  const input = el('input', {
    type: 'file',
    accept: 'application/json,.json',
    class: 'data-file',
    /* A file input's own text is supplied by the browser ("No file
       chosen"), which tells a screen-reader user nothing about what the
       control is for. The label has to come from us. */
    'aria-label': t('data.restoreAction')
  });

  cleanups.push(on(input, 'change', async () => {
    const file = input.files && input.files[0];
    if (!file) return;

    const parsed = await backup.parse(file);
    if (!alive) return;

    if (!isOk(parsed)) {
      toast.show(t(parsed.code === 'newer-file' ? 'data.restoreNewer' : 'data.restoreBad'),
                 { tone: 'care' });
      input.value = '';
      return;
    }

    const done = await backup.restore(parsed.value);
    if (!alive) return;
    input.value = '';

    if (!isOk(done)) {
      toast.show(t('errors.general'), { tone: 'care' });
      return;
    }

    const message = t('data.restoreDone', { added: String(done.value.added) });
    toast.show(message, { tone: 'kept' });
    announce(message);
  }));

  return Card({
    title: t('data.restoreTitle'),
    icon: 'plus',
    tone: 'plain',
    body: [
      el('p', { class: 't-body' }, t('data.restoreBody')),
      /* Said before they choose a file, not after it has run. */
      el('p', { class: 't-caption t-muted' }, t('data.restoreSafe')),
      input
    ]
  });
}

/* ==========================================================================
   DELETE EVERYTHING
   ========================================================================== */
function deleteEverything() {
  const slot = el('div', { class: 'u-stack-sm' });

  const start = Button({
    label: t('data.deleteAction'), variant: 'quiet', size: 'lg', full: true,
    onClick: () => {
      start.hidden = true;
      /* The cancel path hands the button back and puts focus on it. Without
         the focus move a screen-reader user who cancels is left on a node
         that has just been removed from the document, and the reading
         position silently falls back to the top of the page. */
      slot.appendChild(confirmBlock(() => {
        start.hidden = false;
        start.focus();
      }));
    }
  });
  slot.appendChild(start);

  return Card({
    title: t('data.deleteTitle'),
    tone: 'plain',
    elevation: 'flat',
    body: [
      el('p', { class: 't-body' }, t('data.deleteBody')),
      slot
    ]
  });
}

function confirmBlock(onCancel) {
  const block = el('div', { class: 'u-stack-sm' }, [
    el('p', { class: 't-body' }, t('data.deleteConfirm')),
    Button({
      label: t('data.deleteYes'), variant: 'quiet', size: 'lg', full: true,
      onClick: async () => {
        await backup.destroyEverything();
        /* A full reload, not a re-render. Every module holds state in memory —
           a cached mood, a companion stage, a store subscription — and the
           only way to be certain none of it survives a deletion is to start
           the application again from nothing. */
        location.replace(location.pathname + '#/today');
        location.reload();
      }
    }),
    Button({
      label: t('common.notNow'), variant: 'secondary', size: 'md', full: true,
      onClick: () => { block.remove(); onCancel(); }
    })
  ]);
  return block;
}

export function unmount() {
  alive = false;
  cleanups.forEach((fn) => fn());
  cleanups = [];
}
