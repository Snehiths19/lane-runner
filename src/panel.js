// On-screen tuning panel: one slider per value in TUNING_RANGES, plus
// Copy settings and Reset. Sliders write straight into the live cfg.

import { DEFAULTS, TUNING_RANGES } from './config.js';

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

// onChange(): a value changed. onCopy(): Copy settings pressed. onClose(): Done pressed.
// Returns showCopyFallback(text) for when the clipboard is blocked.
export function buildPanel(container, cfg, { onChange, onCopy, onClose }) {
  container.append(el('h2', { textContent: 'Tuning' }));

  const rows = {};
  for (const [key, [min, max, step, label]] of Object.entries(TUNING_RANGES)) {
    const out = el('output', { textContent: cfg[key] });
    const input = el('input', { type: 'range', min, max, step, value: cfg[key] });
    input.addEventListener('input', () => {
      cfg[key] = Number(input.value);
      out.textContent = input.value;
      onChange();
    });
    container.append(el('label', { className: 'tune-row' },
      el('span', { className: 'tune-label', textContent: label }), out, input));
    rows[key] = { input, out };
  }

  const fallback = el('textarea', { className: 'copy-fallback', readOnly: true, hidden: true, rows: 3 });
  const copy = el('button', { type: 'button', textContent: 'Copy settings' });
  copy.addEventListener('click', () => { copy.blur(); onCopy(); });
  const reset = el('button', { type: 'button', textContent: 'Reset to defaults' });
  reset.addEventListener('click', () => {
    reset.blur();
    Object.assign(cfg, DEFAULTS);
    for (const [key, { input, out }] of Object.entries(rows)) {
      input.value = cfg[key];
      out.textContent = cfg[key];
    }
    fallback.hidden = true;
    onChange();
  });
  const done = el('button', { type: 'button', className: 'done', textContent: 'Done' });
  done.addEventListener('click', () => { done.blur(); onClose(); });
  container.append(el('div', { className: 'tune-buttons' }, copy, reset, done), fallback);

  return function showCopyFallback(text) {
    fallback.value = text;
    fallback.hidden = false;
    fallback.focus();
    fallback.select();
  };
}
