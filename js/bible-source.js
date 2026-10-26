// Scriptura - chapter source: Bibles bundled with the app (KJV, Telugu) load book by book from /bibles;
// other translations come from bible-api.com (free, no key) and are kept on this device for offline reading.
import { CANON_BOOKS, OFFLINE_PASSAGES, RED_LETTER_VERSES, SINGLE_CHAPTER_VERSES } from './bible-data.js';

const API_BASE = 'https://bible-api.com/';
const CACHE_KEY = 'scriptura_chapters_v1';
const OFFLINE_BOOKS_KEY = 'scriptura_offline_books';
const CACHE_LIMIT = 180;

export const TRANSLATIONS = [
  { id: 'kjv', short: 'KJV', name: 'King James Version', lang: 'en', local: true },
  { id: 'tel', short: 'తెలుగు', name: 'Telugu Bible (తెలుగు బైబిల్)', lang: 'te', local: true },
  { id: 'web', short: 'WEB', name: 'World English Bible', lang: 'en' },
  { id: 'asv', short: 'ASV', name: 'American Standard Version', lang: 'en' },
  { id: 'bbe', short: 'BBE', name: 'Bible in Basic English', lang: 'en' }
];

export const translationById = (id) => TRANSLATIONS.find(t => t.id === id) || TRANSLATIONS[0];
const isLocal = (tr) => !!translationById(tr).local && translationById(tr).id === tr;

const POETRY_BOOKS = new Set(['JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'LAM']);

const BOOK_ALIASES = {
  ps: 'PSA', psa: 'PSA', pss: 'PSA', psalm: 'PSA',
  jn: 'JHN', jhn: 'JHN', mt: 'MAT', mk: 'MRK', lk: 'LUK',
  song: 'SNG', songs: 'SNG', songofsongs: 'SNG', sos: 'SNG', canticles: 'SNG',
  eccl: 'ECC', qoheleth: 'ECC', rev: 'REV', revelations: 'REV',
  phil: 'PHP', php: 'PHP', phm: 'PHM', philem: 'PHM', jas: 'JAS',
  '1jn': '1JN', '2jn': '2JN', '3jn': '3JN'
};

const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const TELUGU = /[ఀ-౿]/;

export const canonPosition = (bookName, chapter) => CANON_BOOKS.findIndex(b => b.name === bookName) * 1000 + chapter;

export function findBook(query) {
  const n = normalize(query);
  if (!n) return null;
  if (BOOK_ALIASES[n]) return CANON_BOOKS.find(b => b.id === BOOK_ALIASES[n]) || null;
  return CANON_BOOKS.find(b => normalize(b.name) === n || b.id.toLowerCase() === n) || null;
}

function matchBookPrefix(text) {
  const exact = findBook(text);
  if (exact) return exact;
  const n = normalize(text);
  if (n.length < 2) return null;
  return CANON_BOOKS.find(b => normalize(b.name).startsWith(n)) || null;
}

// Telugu names as typed: spaces don't matter, a prefix is enough ("యోహాను" finds John)
function matchTeluguBook(text) {
  const names = bookNames.tel;
  if (!names) return null;
  const typed = text.replace(/\s+/g, '');
  if (!typed) return null;
  return CANON_BOOKS.find(b => names[b.id] && names[b.id].replace(/\s+/g, '').startsWith(typed)) || null;
}

// "John 3:16", "1 cor 13", "ii kings 2", "ps 23", "Jude 5", "యోహాను 3:16" -> { book, chapter, verse }
export function parseReference(input) {
  const raw = String(input || '').trim();
  let book = null;
  let chapterText;
  let verseText;
  if (TELUGU.test(raw)) {
    const t = raw.match(/^((?:[1-3]\s*)?[ఀ-౿][ఀ-౿\s]*?)\s*(\d{1,3})(?:\s*[:.]\s*(\d{1,3})(?:\s*[-–]\s*\d{1,3})?)?$/);
    if (!t) return null;
    book = matchTeluguBook(t[1]);
    [, , chapterText, verseText] = t;
  } else {
    const m = raw.match(/^(?:([1-3])\s*|(i{1,3})\s+)?([a-z][a-z .]*?)\.?\s*(\d{1,3})(?:\s*[:.]\s*(\d{1,3})(?:\s*[-–]\s*\d{1,3})?)?$/i);
    if (!m) return null;
    const prefix = m[1] || { i: '1', ii: '2', iii: '3' }[(m[2] || '').toLowerCase()] || '';
    book = matchBookPrefix(prefix + m[3]);
    chapterText = m[4];
    verseText = m[5];
  }
  if (!book) return null;
  let chapter = parseInt(chapterText, 10);
  let verse = verseText ? parseInt(verseText, 10) : null;
  if (book.chapters === 1 && !verseText && chapter > 1) {
    verse = chapter;
    chapter = 1;
  }
  if (chapter < 1 || chapter > book.chapters) return null;
  return { book, chapter, verse };
}

const parseRanges = (spec) => {
  const set = new Set();
  String(spec || '').split(',').filter(Boolean).forEach(part => {
    const [a, b] = part.split('-').map(Number);
    for (let i = a; i <= (b || a); i++) set.add(i);
  });
  return set;
};

const cleanText = (text) => String(text || '').replace(/\s+/g, ' ').trim();

// --- Bundled Bibles: one JSON file per book, [[verse1, verse2, ...], ...] ---
const localBooks = new Map();
const pendingBooks = new Map();
const bookNames = {};

function readOfflineBooks() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_BOOKS_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function markOffline(tr, bookId) {
  // Only a page under the service worker gets the file into the offline cache
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;
  const all = readOfflineBooks();
  const list = new Set(all[tr] || []);
  if (list.has(bookId)) return;
  list.add(bookId);
  all[tr] = [...list];
  try { localStorage.setItem(OFFLINE_BOOKS_KEY, JSON.stringify(all)); } catch { /* storage full */ }
}

function loadLocalBook(tr, book) {
  const key = `${tr}:${book.id}`;
  if (localBooks.has(key)) return Promise.resolve(localBooks.get(key));
  if (pendingBooks.has(key)) return pendingBooks.get(key);
  const promise = fetch(`bibles/${tr}/${book.id}.json`)
    .then(res => {
      if (!res.ok) throw fail(res.status === 404 ? 'notfound' : 'network');
      return res.json();
    })
    .then(chapters => {
      localBooks.set(key, chapters);
      markOffline(tr, book.id);
      return chapters;
    })
    .catch(err => {
      throw err.code ? err : fail(navigator.onLine ? 'network' : 'offline');
    })
    .finally(() => pendingBooks.delete(key));
  pendingBooks.set(key, promise);
  return promise;
}

// --- Device cache for API translations (localStorage, least-recently-read chapters drop first) ---
let memoryCache = null;

function loadCache() {
  if (memoryCache) return memoryCache;
  try {
    memoryCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {};
  } catch {
    memoryCache = {};
  }
  return memoryCache;
}

function persistCache() {
  const cache = loadCache();
  const byAge = () => Object.keys(cache).sort((a, b) => cache[a].t - cache[b].t);
  const keys = byAge();
  if (keys.length > CACHE_LIMIT) keys.slice(0, keys.length - CACHE_LIMIT).forEach(k => delete cache[k]);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return true;
    } catch {
      const ks = byAge();
      if (!ks.length) return false;
      ks.slice(0, Math.max(1, Math.ceil(ks.length / 3))).forEach(k => delete cache[k]);
    }
  }
  return false;
}

const cacheKey = (translation, bookId, chapter) => `${translation}:${bookId}_${chapter}`;

const fail = (code, message) => Object.assign(new Error(message || code), { code });

export const BibleSource = {
  isLocal,

  // Telugu names for book headings; English stays the fallback
  async loadBookNames(tr) {
    if (bookNames[tr] || !isLocal(tr) || tr === 'kjv') return bookNames[tr] || null;
    try {
      const res = await fetch(`bibles/${tr}/books.json`);
      if (res.ok) bookNames[tr] = await res.json();
    } catch { /* names are optional */ }
    return bookNames[tr] || null;
  },

  bookName(tr, book) {
    return (bookNames[tr] && bookNames[tr][book.id]) || book.name;
  },

  curated(bookId, chapter) {
    return OFFLINE_PASSAGES[`${bookId}_${chapter}`] || null;
  },

  isExcerpt(passage) {
    if (!passage) return false;
    return passage.verses[0].num !== 1 || passage.verses.some((v, i) => i > 0 && v.num !== passage.verses[i - 1].num + 1);
  },

  isPoetry(bookId, chapter) {
    const curated = this.curated(bookId, chapter);
    return curated ? !!curated.isPoetry : POETRY_BOOKS.has(bookId);
  },

  redLetters(bookId, chapter) {
    const set = parseRanges(RED_LETTER_VERSES[`${bookId}_${chapter}`]);
    const curated = this.curated(bookId, chapter);
    if (curated) curated.verses.forEach(v => { if (v.isChrist) set.add(v.num); });
    return set;
  },

  has(translation, bookId, chapter) {
    if (isLocal(translation)) {
      return localBooks.has(`${translation}:${bookId}`) || (readOfflineBooks()[translation] || []).includes(bookId);
    }
    return !!loadCache()[cacheKey(translation, bookId, chapter)];
  },

  // Synchronous read of text already on hand (bundled book in memory, or cached API chapter)
  cached(translation, bookId, chapter) {
    if (isLocal(translation)) {
      const chapters = localBooks.get(`${translation}:${bookId}`);
      const verses = chapters && chapters[chapter - 1];
      return verses ? verses.map((text, i) => ({ num: i + 1, text })).filter(v => v.text) : null;
    }
    const entry = loadCache()[cacheKey(translation, bookId, chapter)];
    if (!entry) return null;
    entry.t = Date.now();
    return entry.v.map(([num, text]) => ({ num, text }));
  },

  // Chapter numbers of a book that can be read without a connection
  savedChapters(translation, book) {
    const saved = new Set();
    if (isLocal(translation) && this.has(translation, book.id, 1)) {
      for (let ch = 1; ch <= book.chapters; ch++) saved.add(ch);
    } else {
      const prefix = `${translation}:${book.id}_`;
      Object.keys(loadCache()).forEach(k => { if (k.startsWith(prefix)) saved.add(Number(k.slice(prefix.length))); });
    }
    if (translation !== 'tel') Object.values(OFFLINE_PASSAGES).forEach(p => { if (p.book === book.name) saved.add(p.chapter); });
    return saved;
  },

  // Every readable-offline chapter in canonical order: [{ book, chapter, title }]
  savedList(translation) {
    const seen = new Map();
    if (translation !== 'tel') Object.values(OFFLINE_PASSAGES).forEach(p => seen.set(`${p.book}|${p.chapter}`, { book: p.book, chapter: p.chapter, title: p.title }));
    if (isLocal(translation)) {
      CANON_BOOKS.forEach(book => {
        if (!this.has(translation, book.id, 1)) return;
        for (let ch = 1; ch <= book.chapters; ch++) {
          if (!seen.has(`${book.name}|${ch}`)) seen.set(`${book.name}|${ch}`, { book: book.name, chapter: ch, title: '' });
        }
      });
    } else {
      const prefix = `${translation}:`;
      Object.keys(loadCache()).forEach(k => {
        if (!k.startsWith(prefix)) return;
        const [bookId, ch] = k.slice(prefix.length).split('_');
        const book = CANON_BOOKS.find(b => b.id === bookId);
        if (book && !seen.has(`${book.name}|${ch}`)) seen.set(`${book.name}|${ch}`, { book: book.name, chapter: Number(ch), title: '' });
      });
    }
    return [...seen.values()].sort((a, b) => canonPosition(a.book, a.chapter) - canonPosition(b.book, b.chapter));
  },

  // Books of a bundled Bible that are in memory or saved for offline use
  booksOnDevice(translation) {
    return CANON_BOOKS.filter(b => this.has(translation, b.id, 1)).length;
  },

  // Text that search can scan right now. Curated passages are KJV, so they only join KJV and API searches.
  searchCorpus(translation) {
    const corpus = [];
    const covered = new Set();
    if (isLocal(translation)) {
      CANON_BOOKS.forEach(book => {
        const chapters = localBooks.get(`${translation}:${book.id}`);
        if (!chapters) return;
        chapters.forEach((verses, i) => {
          covered.add(`${book.name}|${i + 1}`);
          corpus.push({ book: book.name, chapter: i + 1, verses: verses.map((text, n) => ({ num: n + 1, text })) });
        });
      });
    } else {
      const cache = loadCache();
      const prefix = `${translation}:`;
      Object.keys(cache).forEach(k => {
        if (!k.startsWith(prefix)) return;
        const [bookId, ch] = k.slice(prefix.length).split('_');
        const book = CANON_BOOKS.find(b => b.id === bookId);
        if (!book) return;
        covered.add(`${book.name}|${ch}`);
        corpus.push({ book: book.name, chapter: Number(ch), verses: cache[k].v.map(([num, text]) => ({ num, text })) });
      });
    }
    if (translation !== 'tel') {
      Object.values(OFFLINE_PASSAGES).forEach(p => {
        if (!covered.has(`${p.book}|${p.chapter}`)) corpus.push({ book: p.book, chapter: p.chapter, verses: p.verses });
      });
    }
    return corpus.sort((a, b) => canonPosition(a.book, a.chapter) - canonPosition(b.book, b.chapter));
  },

  // Load every book of a bundled Bible (saves it for offline use under the service worker)
  async downloadAll(translation, onProgress) {
    const books = CANON_BOOKS.slice();
    let done = 0;
    const worker = async () => {
      while (books.length) {
        const book = books.shift();
        await loadLocalBook(translation, book);
        done++;
        if (onProgress) onProgress(done, CANON_BOOKS.length);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  },

  stats() {
    const cache = loadCache();
    const count = Object.keys(cache).length;
    let bytes = 0;
    try { bytes = (localStorage.getItem(CACHE_KEY) || '').length * 2; } catch { /* storage blocked */ }
    return { count, bytes };
  },

  async clear() {
    memoryCache = {};
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(OFFLINE_BOOKS_KEY);
    } catch { /* storage blocked */ }
    if (!('caches' in window)) return;
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        if (new URL(request.url).pathname.includes('/bibles/') && !request.url.endsWith('books.json')) await cache.delete(request);
      }
    }
  },

  async fetchChapter(translation, book, chapter, { signal } = {}) {
    if (isLocal(translation)) {
      await loadLocalBook(translation, book);
      const verses = this.cached(translation, book.id, chapter);
      if (!verses || !verses.length) throw fail('notfound');
      return verses;
    }

    const single = SINGLE_CHAPTER_VERSES[book.id];
    const ref = single ? `${book.name.replace(/ /g, '+')}+1:1-${single}` : `${book.name.replace(/ /g, '+')}+${chapter}`;
    let res;
    try {
      res = await fetch(`${API_BASE}${ref}?translation=${encodeURIComponent(translation)}`, { signal });
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      throw fail(navigator.onLine ? 'network' : 'offline');
    }
    if (res.status === 429) throw fail('rate');
    if (res.status === 404) throw fail('notfound');
    if (!res.ok) throw fail('network', `HTTP ${res.status}`);

    let data;
    try {
      data = await res.json();
    } catch {
      throw fail('network', 'Bad response');
    }
    const verses = (data.verses || [])
      .filter(v => single || v.chapter === chapter)
      .map(v => ({ num: v.verse, text: cleanText(v.text) }))
      .filter(v => v.text);
    if (!verses.length) throw fail('notfound');

    loadCache()[cacheKey(translation, book.id, chapter)] = { t: Date.now(), v: verses.map(v => [v.num, v.text]) };
    persistCache();
    return verses;
  }
};
