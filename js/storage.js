// Scriptura - local persistent storage & user state
import { todayKey } from './util.js';

const STORAGE_KEYS = {
  PREFERENCES: 'scriptura_preferences',
  HIGHLIGHTS: 'scriptura_highlights',
  BOOKMARKS: 'scriptura_bookmarks',
  NOTES: 'scriptura_notes',
  LAST_READ: 'scriptura_last_read',
  PLAN_PROGRESS: 'scriptura_plan_progress',
  STREAK: 'scriptura_streak',
  READ_LOG: 'scriptura_read_log'
};

const DEFAULT_PREFERENCES = {
  theme: 'auto', // 'auto' | 'theme-parchment' | 'theme-sepia' | 'theme-obsidian' | 'theme-cathedral'
  fontFamily: 'font-serif', // 'font-serif' | 'font-classic' | 'font-sans'
  fontSize: 20, // px (16 - 28)
  lineHeight: 1.75, // 1.55 | 1.75 | 1.95
  translation: 'kjv', // 'kjv' | 'tel' bundled; 'web' | 'asv' | 'bbe' from bible-api.com
  parallel: true, // show Telugu and English together
  prefsVersion: 2,
  showVerseNumbers: true,
  redLetter: true,
  ambientSound: false,
  ambientVolume: 0.35,
  ambientKind: 'organ' // 'organ' | 'rain' | 'stillness' | 'bells'
};

const same = (a, b) => a.book === b.book && a.chapter === b.chapter && a.verseNum === b.verseNum;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
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
    if (!saved || !saved.prefsVersion || saved.prefsVersion < 2) {
      prefs.parallel = true;
      prefs.prefsVersion = 2;
    }
    prefs.fontSize = Math.min(28, Math.max(16, Number(prefs.fontSize) || DEFAULT_PREFERENCES.fontSize));
    prefs.lineHeight = Number(prefs.lineHeight) || DEFAULT_PREFERENCES.lineHeight;
    return prefs;
  },

  savePreferences(prefs) {
    write(STORAGE_KEYS.PREFERENCES, prefs);
  },

  // --- Highlights ---
  getHighlights() {
    return read(STORAGE_KEYS.HIGHLIGHTS, []);
  },

  saveHighlight(highlight) {
    const highlights = this.getHighlights().filter(h => !same(h, highlight));
    highlights.push(highlight);
    write(STORAGE_KEYS.HIGHLIGHTS, highlights);
    return highlights;
  },

  removeHighlight(book, chapter, verseNum) {
    const highlights = this.getHighlights().filter(h => !same(h, { book, chapter, verseNum }));
    write(STORAGE_KEYS.HIGHLIGHTS, highlights);
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
  },

  removeBookmark(book, chapter, verseNum) {
    write(STORAGE_KEYS.BOOKMARKS, this.getBookmarks().filter(b => !same(b, { book, chapter, verseNum })));
  },

  // --- Notes ---
  getNotes() {
    return read(STORAGE_KEYS.NOTES, []);
  },

  saveNote(noteObj) {
    const notes = this.getNotes().filter(n => !same(n, noteObj));
    if (noteObj.content && noteObj.content.trim()) notes.unshift(noteObj);
    write(STORAGE_KEYS.NOTES, notes);
    return notes;
  },

  removeNote(book, chapter, verseNum) {
    write(STORAGE_KEYS.NOTES, this.getNotes().filter(n => !same(n, { book, chapter, verseNum })));
  },

  // --- Reading position, streak and log ---
  getLastRead() {
    const last = read(STORAGE_KEYS.LAST_READ, null);
    return last && last.book ? last : { book: 'Psalms', chapter: 23 };
  },

  saveLastRead(book, chapter) {
    write(STORAGE_KEYS.LAST_READ, { book, chapter });
    this.recordStreak();
  },

  getStreak() {
    return read(STORAGE_KEYS.STREAK, { count: 0, lastDate: '' });
  },

  // Days in a row, counted on the reader's local calendar
  recordStreak() {
    const today = todayKey();
    const streak = this.getStreak();
    if (streak.lastDate !== today) {
      const diffDays = streak.lastDate
        ? Math.round((new Date(`${today}T12:00:00`) - new Date(`${streak.lastDate}T12:00:00`)) / 86400000)
        : null;
      streak.count = diffDays === 1 ? (streak.count || 0) + 1 : 1;
      streak.lastDate = today;
      write(STORAGE_KEYS.STREAK, streak);
    }
    return streak;
  },

  // A streak only counts while it is still alive (read today or yesterday)
  currentStreak() {
    const streak = this.getStreak();
    if (!streak.lastDate) return 0;
    const diffDays = Math.round((new Date(`${todayKey()}T12:00:00`) - new Date(`${streak.lastDate}T12:00:00`)) / 86400000);
    return diffDays <= 1 ? streak.count || 0 : 0;
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
      readLog: this.getReadLog()
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

    const bookmarks = this.getBookmarks();
    (data.bookmarks || []).filter(valid).forEach(b => {
      if (!bookmarks.some(x => same(x, b))) { bookmarks.push(b); added++; }
    });
    write(STORAGE_KEYS.BOOKMARKS, bookmarks);

    const notes = this.getNotes();
    (data.notes || []).filter(n => valid(n) && n.content).forEach(n => {
      const i = notes.findIndex(x => same(x, n));
      if (i === -1) { notes.push(n); added++; }
      else if ((n.date || '') > (notes[i].date || '')) notes[i] = n;
    });
    write(STORAGE_KEYS.NOTES, notes);

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

    return { added };
  }
};
