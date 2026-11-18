// nbinding design system: small helpers for the interactive components. No dependencies, no build.
// import { overlay, toast, copy, onHold, prefs, calendar, mark, esc, money, amountWords, terms } from './nb.js';

/** Escape text for HTML. Use it on every value that comes from a person or a link. */
export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** The brand mark: hatched both ways, like the overlap it stands for. Inherits `color`. */
export const mark = (size = 26, cls = 'nb-brand__mark') => `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 26 26" aria-hidden="true"><rect x="1" y="1" width="24" height="24" rx="7" fill="currentColor"/><path d="M7 19 19 7M7 13l6-6M13 19l6-6" stroke="var(--nb-surface)" stroke-width="1.6" stroke-linecap="round"/><path d="M7 7l12 12M13 7l6 6M7 13l6 6" stroke="var(--nb-surface)" stroke-width="1.6" stroke-linecap="round" opacity=".45"/></svg>`;

/**
 * Show a sheet or dialog that is already in the page (hidden), with a scrim, focus trap, Escape to close
 * and focus returned to whatever opened it. Returns a function that closes it.
 */
export function overlay(el, { onClose } = {}) {
  const opener = document.activeElement;
  const scrim = document.createElement('div');
  scrim.className = 'nb-scrim';
  el.before(scrim);
  el.hidden = false;
  document.body.classList.add('nb-locked');
  const focusables = () => [...el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(x => !x.disabled && !x.hidden);
  (el.querySelector('[data-nb-autofocus]') || focusables()[0] || el).focus();
  const key = e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables(); if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
  };
  const close = () => {
    document.removeEventListener('keydown', key);
    scrim.remove(); el.hidden = true;
    document.body.classList.remove('nb-locked');
    opener?.focus?.();
    onClose?.();
  };
  document.addEventListener('keydown', key);
  scrim.addEventListener('click', close);
  el.querySelectorAll('[data-nb-close]').forEach(b => b.addEventListener('click', close, { once: true }));
  return close;
}

let toastTimer;
/** A short status message at the bottom of the screen, announced to screen readers. */
export function toast(message, ms = 2200) {
  let t = document.querySelector('.nb-toast:not(.nb-toast--inline)');
  if (!t) { t = document.createElement('div'); t.className = 'nb-toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = message; t.dataset.show = 'true';
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.dataset.show = 'false'; }, ms);
}

/** Copy text, falling back to a hidden textarea where the clipboard API is blocked. Resolves true on success. */
export async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    ta.style.cssText = 'position:fixed;opacity:0'; document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { /* stays false */ }
    ta.remove(); return ok;
  }
}

/**
 * Hold-to-press on any element matching `selector` inside `root` (also right-click). Calls `onHold(el)`.
 * The click that follows a hold is swallowed so a tap action doesn't also run.
 */
export function onHold(root, selector, handler, ms = 480) {
  let timer = null, held = null;
  root.addEventListener('pointerdown', e => {
    const el = e.target.closest(selector);
    if (!el || el.disabled) return;
    clearTimeout(timer);
    timer = setTimeout(() => { held = el; handler(el); }, ms);
  });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel', 'scroll']) root.addEventListener(ev, () => clearTimeout(timer), true);
  root.addEventListener('click', e => { if (held && e.target.closest(selector) === held) { e.stopImmediatePropagation(); e.preventDefault(); } held = null; }, true);
  root.addEventListener('contextmenu', e => {
    const el = e.target.closest(selector);
    if (!el || el.disabled) return;
    e.preventDefault(); clearTimeout(timer); handler(el);
  });
}

/** Reader's display settings: text size, reading font, theme, help with dates or numbers, spacing, reduced motion. */
export const prefs = {
  defaults: { size: 100, font: 'default', theme: 'system', dateHelp: false, numberHelp: false, spacing: false, motion: false },
  read(key = 'nb-display') {
    try { return { ...this.defaults, ...JSON.parse(sessionStorage.getItem(key)) }; } catch { return { ...this.defaults }; }
  },
  apply(p, key = 'nb-display') {
    const root = document.documentElement;
    root.style.setProperty('--nb-text-scale', (p.size || 100) / 100);
    if (p.theme === 'light' || p.theme === 'dark') root.dataset.theme = p.theme; else delete root.dataset.theme;
    root.dataset.nbFont = p.font;
    root.dataset.nbDateHelp = String(!!p.dateHelp);
    root.dataset.nbNumberHelp = String(!!p.numberHelp);
    root.dataset.nbSpacing = String(!!p.spacing);
    root.dataset.nbMotion = String(!!p.motion);
    try { sessionStorage.setItem(key, JSON.stringify(p)); } catch { /* private mode: applies to this page only */ }
  },
};

/**
 * Render a month of day cells as HTML (escaped). `days` and `theirs` map ISO dates to
 * { times: 'M'|'ME'|..., maybe: true }. Modes: 'edit' (mine/theirs/both), 'pick' (choosable/chosen), 'view'.
 */
export function calendar({ month, today = '', days = {}, theirs = {}, mode = 'edit', choosable = {}, chosen = [], counts = {}, lead = '', locale } = {}) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)), count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const name = first.toLocaleDateString(locale, { month: 'long', timeZone: 'UTC' });
  const cells = Array.from({ length: offset }, () => '<span class="nb-cell nb-cell--blank" aria-hidden="true"></span>');
  for (let d = 1; d <= count; d++) {
    const iso = `${month}-${String(d).padStart(2, '0')}`, mine = days[iso], their = theirs[iso], past = today && iso < today;
    const dt = new Date(Date.UTC(y, m - 1, d));
    const cls = ['nb-cell']; let label = dt.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }), pressed = '', disabled = past;
    let info = mine;
    if (mode === 'edit') {
      if (mine && their) cls.push('nb-cell--both'); else if (mine) cls.push('nb-cell--mine'); else if (their) { cls.push('nb-cell--theirs'); info = their; }
      if (mine?.maybe) cls.push('nb-cell--maybe');
      pressed = ` aria-pressed="${!!mine}"`;
      label += mine ? `, you're free${mine.maybe ? ' (maybe)' : ''}` : ', not marked';
      if (their) label += `, they're free${their.maybe ? ' (maybe)' : ''}`;
    } else {
      info = choosable[iso];
      if (chosen.includes(iso)) { cls.push('nb-cell--chosen'); pressed = ' aria-pressed="true"'; }
      else if (info) { cls.push('nb-cell--choosable'); pressed = ' aria-pressed="false"'; }
      else disabled = true;
      if (info) label += counts[iso] ? `, ${counts[iso].replace('/', ' of ')} can make it` : ', you can choose this day';
      if (info?.maybe) cls.push('nb-cell--maybe');
      if (mode === 'view') disabled = true;
    }
    if (past) cls.push('nb-cell--past');
    if (iso === today) cls.push('nb-cell--today');
    const tags = counts[iso] || info?.times || '';
    const wd = iso === today ? 'Today' : dt.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' });
    cells.push(`<button class="${cls.join(' ')}" data-day="${iso}"${pressed}${disabled ? ' disabled' : ''} aria-label="${esc(label)}"><span class="nb-cell__wd" aria-hidden="true">${esc(wd)}</span><span class="nb-cell__num">${d}</span>${tags ? `<span class="nb-cell__tags">${esc(tags)}</span>` : ''}${info?.maybe ? '<span class="nb-cell__q" aria-hidden="true">?</span>' : ''}</button>`);
  }
  const wds = Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2024, 0, 1 + i)).toLocaleDateString(locale, { weekday: 'narrow', timeZone: 'UTC' }));
  return `<div class="nb-cal${mode === 'edit' ? '' : ' nb-cal--compact'}">
    <div class="nb-cal__head"><h3 class="nb-cal__month">${esc(name)} <span class="nb-cal__year">${y}</span></h3>
      <span class="nb-cal__nav"><button class="nb-icon-button" data-nb-month="-1" aria-label="Previous month"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><button class="nb-icon-button" data-nb-month="1" aria-label="Next month"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button></span></div>
    ${lead ? `<p class="nb-cal__lead">${esc(lead)}</p>` : ''}
    <div class="nb-cal__grid nb-cal__weekdays" aria-hidden="true">${wds.map(w => `<span>${esc(w)}</span>`).join('')}</div>
    <div class="nb-cal__grid">${cells.join('')}</div>
  </div>`;
}

/** Pounds for people: "£425,000", or "£1,250.50" when there are pence. */
export const money = n => {
  const v = Math.round(Number(n || 0) * 100) / 100;
  return (v < 0 ? '−£' : '£') + Math.abs(v).toLocaleString('en-GB', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
};

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const under100 = n => n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
const under1000 = n => n < 100 ? under100(n) : `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ' and ' + under100(n % 100) : ''}`;
const wholeWords = n => {
  if (n === 0) return 'zero';
  const parts = [];
  for (const [size, name] of [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']]) {
    if (n >= size) { parts.push(`${under1000(Math.floor(n / size))} ${name}`); n %= size; }
  }
  if (n) parts.push(parts.length && n < 100 ? `and ${under100(n)}` : under1000(n));
  return parts.join(', ').replace(', and', ' and');
};
/** An amount in British English words, to read back under a money field: "Four hundred and twenty-five thousand pounds". */
export function amountWords(n) {
  const v = Math.round(Math.abs(Number(n || 0)) * 100), pounds = Math.floor(v / 100), pence = v % 100;
  let out = pounds || !pence ? `${wholeWords(pounds)} ${pounds === 1 ? 'pound' : 'pounds'}` : '';
  if (pence) out += `${out ? ' and ' : ''}${wholeWords(pence)} ${pence === 1 ? 'penny' : 'pence'}`;
  if (Number(n) < 0) out = 'minus ' + out;
  return out[0].toUpperCase() + out.slice(1);
}

/**
 * Plain-language terms: a `<button class="nb-term" data-nb-term aria-expanded="false" aria-controls="id">` opens
 * the `.nb-term-pop` with that id beside it. One open at a time; Escape, a second tap or a tap elsewhere closes it.
 */
export function terms(root = document) {
  let open = null;
  const close = (refocus) => {
    if (!open) return;
    const [btn, pop] = open; open = null;
    pop.hidden = true; btn.setAttribute('aria-expanded', 'false');
    if (refocus) btn.focus();
  };
  const place = (btn, pop) => {
    const r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    const left = Math.min(Math.max(12, r.left), innerWidth - w - 12);
    const below = r.bottom + 8 + h <= innerHeight || r.top < h + 8;
    pop.style.left = `${left}px`;
    pop.style.top = `${below ? r.bottom + 8 : r.top - h - 8}px`;
  };
  root.addEventListener('click', e => {
    const btn = e.target.closest('[data-nb-term]');
    if (!btn) { if (open && !open[1].contains(e.target)) close(false); return; }
    const pop = document.getElementById(btn.getAttribute('aria-controls'));
    if (!pop) return;
    const same = open?.[0] === btn;
    close(false);
    if (same) return;
    pop.hidden = false; btn.setAttribute('aria-expanded', 'true');
    place(btn, pop); open = [btn, pop];
  });
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && open) { e.preventDefault(); close(true); } });
  // Follow the word as the page moves; close once it has scrolled out of view.
  const follow = () => {
    if (!open) return;
    const r = open[0].getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) close(false); else place(...open);
  };
  addEventListener('scroll', follow, { passive: true, capture: true });
  addEventListener('resize', follow);
  return () => close(false);
}
