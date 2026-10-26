// Scriptura - local persistent storage & user state
import { todayKey } from './util.js';

const STORAGE_KEYS = {
  PREFERENCES: 'scriptura_preferences',
  HIGHLIGHTS: 'scriptura_highlights',
  BOOKMARKS: 'scriptura_bookmarks',
  NOTES: 'scriptura_notes',
  LAST_READ: 'scriptura_last_read',
  PLAN_PROGRESS: 'scriptura_plan_progress',
  READ_DAYS: 'scriptura_read_days',
  READ_LOG: 'scriptura_read_log'
};

const DEFAULT_PREFERENCES = {
  theme: 'auto', // 'auto' | 'theme-parchment' | 'theme-sepia' | 'theme-cathedral'
  fontFamily: 'font-serif',
  fontSize: 20, // px (16 - 28)
  lineHeight: 1.75,
  translation: 'kjv', // 'kjv' | 'tel' bundled; 'web' | 'asv' | 'bbe' from bible-api.com
  parallel: true, // show Telugu and English together
  prefsVersion: 3,
  showVerseNumbers: true,
  redLetter: true
};

// --- Permission to store ---
// Nothing reaches the browser's storage until the reader allows it. Until then, or after "Not now",
// changes are held in memory for this visit only. The "allowed" answer is the one thing kept for good.
const CONSENT_KEY = 'scriptura_consent';
const held = new Map();
const attemptListeners = new Set();
let declined = false;

const allowed = () => {
  try { return localStorage.getItem(CONSENT_KEY) === 'granted'; } catch { return false; }
};

export const Consent = {
  allowed,
  state: () => (allowed() ? 'granted' : declined ? 'declined' : 'unknown'),

  // Anything kept from an earlier visit (before saving needed permission)
  hasStoredData() {
    try { return Object.keys(localStorage).some(k => k.startsWith('scriptura_') && k !== CONSENT_KEY); } catch { return false; }
  },

  onSaveAttempt(fn) { attemptListeners.add(fn); },

  grant() {
    try {
      localStorage.setItem(CONSENT_KEY, 'granted');
      held.forEach((value, key) => localStorage.setItem(key, value));
      held.clear();
    } catch {
      return false;
    }
    declined = false;
    keepData();
    return true;
  },

  decline() { declined = true; },

  // Stop saving: stored data stays usable for the rest of this visit, but leaves the device now
  revoke() {
    try {
      Object.keys(localStorage).filter(k => k.startsWith('scriptura_')).forEach(k => {
        if (k !== CONSENT_KEY && !held.has(k)) held.set(k, localStorage.getItem(k));
        localStorage.removeItem(k);
      });
    } catch { /* storage blocked */ }
    declined = true;
  },

  // Raw access for modules with their own keys (the chapter cache in bible-source.js)
  getItem(key) {
    if (held.has(key)) return held.get(key);
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem(key, value) {
    if (allowed()) {
      try { localStorage.setItem(key, value); return true; } catch { return false; }
    }
    held.set(key, value);
    return true;
  },
  removeItem(key) {
    held.delete(key);
    try { localStorage.removeItem(key); } catch { /* storage blocked */ }
  }
};

// Something the reader chose to save: ask for permission if it has not been given
function saved() {
  if (allowed()) keepData();
  else attemptListeners.forEach(fn => fn(Consent.state()));
}

// Ask the browser to keep this data instead of clearing it when space runs low or the site sits unused.
let persistAsked = false;
function keepData() {
  if (persistAsked || !navigator.storage?.persist) return;
  persistAsked = true;
  navigator.storage.persisted()
    .then(already => already || navigator.storage.persist())
    .catch(() => { /* the data still saves; the browser just may clear it later */ });
}

const same = (a, b) => a.book === b.book && a.chapter === b.chapter && a.verseNum === b.verseNum;

function read(key, fallback) {
  try {
    const raw = Consent.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    return Consent.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage save error:', e);
    return false;
  }
}

export const Storage = {
  getPreferences() {
    const saved = read(STORAGE_KEYS.PREFERENCES, {});
    const prefs = { ...DEFAULT_PREFERENCES, ...(saved && typeof saved === 'object' ? saved : {}) };
    // Version 2 made Telugu + English the default; turn it on once for settings saved before that
    if (!saved || !saved.prefsVersion || saved.prefsVersion < 2) prefs.parallel = true;
    // Version 3 trimmed settings to theme, size and language; drop choices that no longer have a control
    if (!saved || !saved.prefsVersion || saved.prefsVersion < 3) {
      const themeMap = { 'theme-olive': 'theme-parchment', 'theme-obsidian': 'theme-cathedral' };
      prefs.theme = themeMap[prefs.theme] || prefs.theme;
      prefs.fontFamily = DEFAULT_PREFERENCES.fontFamily;
      prefs.lineHeight = DEFAULT_PREFERENCES.lineHeight;
      prefs.redLetter = DEFAULT_PREFERENCES.redLetter;
      prefs.prefsVersion = 3;
      write(STORAGE_KEYS.PREFERENCES, prefs);
    }
    prefs.fontSize = Math.min(28, Math.max(16, Number(prefs.fontSize) || DEFAULT_PREFERENCES.fontSize));
    prefs.lineHeight = Number(prefs.lineHeight) || DEFAULT_PREFERENCES.lineHeight;
    return prefs;
  },

  savePreferences(prefs) {
    write(STORAGE_KEYS.PREFERENCES, prefs);
    saved();
  },

  // --- Highlights ---
  getHighlights() {
    return read(STORAGE_KEYS.HIGHLIGHTS, []);
  },

  saveHighlight(highlight) {
    const highlights = this.getHighlights().filter(h => !same(h, highlight));
    highlights.push(highlight);
    write(STORAGE_KEYS.HIGHLIGHTS, highlights);
    saved();
    return highlights;
  },

  removeHighlight(book, chapter, verseNum) {
    const highlights = this.getHighlights().filter(h => !same(h, { book, chapter, verseNum }));
    write(STORAGE_KEYS.HIGHLIGHTS, highlights);
    saved();
    return highlights;
  },

  // --- Bookmarks ---
  getBookmarks() {
    return read(STORAGE_KEYS.BOOKMARKS, []);
  },

  toggleBookmark(bookmark) {
    const exists = this.getBookmarks().some(b => same(b, bookmark));
    if (exists) this.removeBookmark(bookmark.book, bookmark.chapter, bookmark.verseNum);
    else this.addBookmark(bookmark);
    return { isBookmarked: !exists };
  },

  addBookmark(bookmark) {
    const bookmarks = this.getBookmarks().filter(b => !same(b, bookmark));
    bookmarks.unshift(bookmark);
    write(STORAGE_KEYS.BOOKMARKS, bookmarks);
    saved();
  },

  removeBookmark(book, chapter, verseNum) {
    write(STORAGE_KEYS.BOOKMARKS, this.getBookmarks().filter(b => !same(b, { book, chapter, verseNum })));
    saved();
  },

  // --- Notes ---
  getNotes() {
    return read(STORAGE_KEYS.NOTES, []);
  },

  saveNote(noteObj) {
    const notes = this.getNotes().filter(n => !same(n, noteObj));
    if (noteObj.content && noteObj.content.trim()) notes.unshift(noteObj);
    write(STORAGE_KEYS.NOTES, notes);
    saved();
    return notes;
  },

  removeNote(book, chapter, verseNum) {
    write(STORAGE_KEYS.NOTES, this.getNotes().filter(n => !same(n, { book, chapter, verseNum })));
    saved();
  },

  // --- Reading position, streak and log ---
  // null until the reader has opened a chapter themselves
  getLastRead() {
    const last = read(STORAGE_KEYS.LAST_READ, null);
    return last && last.book ? last : null;
  },

  saveLastRead(book, chapter) {
    write(STORAGE_KEYS.LAST_READ, { book, chapter });
  },

  // Days (local calendar) on which at least one chapter was finished
  getReadDays() {
    let days = read(STORAGE_KEYS.READ_DAYS, null);
    if (!Array.isArray(days)) {
      // First run since the old counter: rebuild from chapters actually finished, then drop the counter
      days = [...new Set(Object.values(this.getReadLog()).filter(d => typeof d === 'string'))].sort();
      if (days.length) write(STORAGE_KEYS.READ_DAYS, days);
      Consent.removeItem('scriptura_streak');
    }
    return days;
  },

  // Days in a row with a finished chapter, ending today or yesterday (alive until a whole day is missed)
  currentStreak() {
    const days = new Set(this.getReadDays());
    const cursor = new Date();
    if (!days.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    let count = 0;
    while (days.has(todayKey(cursor))) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  },

  // { "Psalms|23": "2026-10-25", ... } — the latest day each chapter was finished
  getReadLog() {
    return read(STORAGE_KEYS.READ_LOG, {});
  },

  markRead(book, chapter) {
    const log = this.getReadLog();
    const key = `${book}|${chapter}`;
    const today = todayKey();
    const isNew = log[key] !== today;
    if (isNew) {
      log[key] = today;
      write(STORAGE_KEYS.READ_LOG, log);
    }
    // Finishing a chapter is what keeps the streak going, not just opening the app
    const days = this.getReadDays();
    if (!days.includes(today)) {
      days.push(today);
      write(STORAGE_KEYS.READ_DAYS, days);
    }
    return isNew;
  },

  // --- Reading plans ---
  getPlanProgress(planId) {
    const all = read(STORAGE_KEYS.PLAN_PROGRESS, {});
    return Array.isArray(all[planId]) ? all[planId] : [];
  },

  setPlanDay(planId, day, done) {
    const all = read(STORAGE_KEYS.PLAN_PROGRESS, {});
    const days = new Set(Array.isArray(all[planId]) ? all[planId] : []);
    if (done) days.add(day);
    else days.delete(day);
    all[planId] = [...days].sort((a, b) => a - b);
    write(STORAGE_KEYS.PLAN_PROGRESS, all);
    saved();
    return all[planId];
  },

  togglePlanDay(planId, day) {
    return this.setPlanDay(planId, day, !this.getPlanProgress(planId).includes(day));
  },

  // --- Backup ---
  exportAll() {
    return {
      app: 'scriptura',
      version: 1,
      exportedAt: new Date().toISOString(),
      highlights: this.getHighlights(),
      bookmarks: this.getBookmarks(),
      notes: this.getNotes(),
      planProgress: read(STORAGE_KEYS.PLAN_PROGRESS, {}),
      readLog: this.getReadLog(),
      readDays: this.getReadDays()
    };
  },

  // Merges a backup into what is already here; nothing on this device is deleted
  importAll(data) {
    if (!data || data.app !== 'scriptura') throw new Error('Not a Scriptura backup');
    const valid = (x) => x && typeof x.book === 'string' && Number.isFinite(x.chapter) && Number.isFinite(x.verseNum);
    let added = 0;

    const highlights = this.getHighlights();
    (data.highlights || []).filter(valid).forEach(h => {
      if (!highlights.some(x => same(x, h))) { highlights.push(h); added++; }
    });
    write(STORAGE_KEYS.HIGHLIGHTS, highlights);
    saved();

    const bookmarks = this.getBookmarks();
    (data.bookmarks || []).filter(valid).forEach(b => {
      if (!bookmarks.some(x => same(x, b))) { bookmarks.push(b); added++; }
    });
    write(STORAGE_KEYS.BOOKMARKS, bookmarks);
    saved();

    const notes = this.getNotes();
    (data.notes || []).filter(n => valid(n) && n.content).forEach(n => {
      const i = notes.findIndex(x => same(x, n));
      if (i === -1) { notes.push(n); added++; }
      else if ((n.date || '') > (notes[i].date || '')) notes[i] = n;
    });
    write(STORAGE_KEYS.NOTES, notes);
    saved();

    const plans = read(STORAGE_KEYS.PLAN_PROGRESS, {});
    Object.entries(data.planProgress || {}).forEach(([id, days]) => {
      if (Array.isArray(days)) plans[id] = [...new Set([...(plans[id] || []), ...days.filter(Number.isFinite)])].sort((a, b) => a - b);
    });
    write(STORAGE_KEYS.PLAN_PROGRESS, plans);

    const log = this.getReadLog();
    Object.entries(data.readLog || {}).forEach(([key, date]) => {
      if (typeof date === 'string' && (!log[key] || date > log[key])) log[key] = date;
    });
    write(STORAGE_KEYS.READ_LOG, log);

    const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
    const days = new Set([...this.getReadDays(), ...(data.readDays || []).filter(isDay), ...Object.values(data.readLog || {}).filter(isDay)]);
    write(STORAGE_KEYS.READ_DAYS, [...days].sort());

    return { added };
  }
};
