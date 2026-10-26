// Scriptura - small DOM and text helpers shared by the modules

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]);

export const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const icon = (name, cls = '') => `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

export const $ = (id) => document.getElementById(id);

export const setText = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

export const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export const sentenceCase = (text) => {
  const s = String(text || '').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const enDash = (ref) => String(ref).replace(/(\d)-(\d)/g, '$1–$2');

export const todayKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
