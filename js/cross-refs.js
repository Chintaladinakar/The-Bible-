// Scriptura - cross references (KJV numbering), one file per book in bibles/xref/
// Each file is [[ "ROM 5:8;1JN 4:9-10", ... ], ...]: a string per verse, references split by ";"
import { CANON_BOOKS } from './bible-data.js';

const byId = Object.fromEntries(CANON_BOOKS.map(b => [b.id, b]));
const files = new Map();
const pending = new Map();

function load(bookId) {
  if (files.has(bookId)) return Promise.resolve(files.get(bookId));
  if (pending.has(bookId)) return pending.get(bookId);
  const promise = fetch(`bibles/xref/${bookId}.json`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      files.set(bookId, data);
      return data;
    })
    .finally(() => pending.delete(bookId));
  pending.set(bookId, promise);
  return promise;
}

const parse = (spec) => String(spec || '').split(';').filter(Boolean).map(ref => {
  const [, id, chapter, verse, to] = ref.match(/^(\w{3}) (\d+):(\d+)(?:-(\d+))?$/) || [];
  const book = byId[id];
  return book ? { book, chapter: +chapter, verse: +verse, to: to ? +to : +verse } : null;
}).filter(Boolean);

export const CrossRefs = {
  // Start fetching a book's references so the verse toolbar can show a count straight away
  prefetch(bookId) {
    load(bookId).catch(() => { /* fetched again when asked for */ });
  },

  // Count without waiting; null while the book's file is still loading
  countNow(bookId, chapter, verse) {
    const data = files.get(bookId);
    if (!data) return null;
    const spec = data[chapter - 1]?.[verse - 1];
    return spec ? spec.split(';').length : 0;
  },

  async forVerse(bookId, chapter, verse) {
    const data = await load(bookId);
    return parse(data[chapter - 1]?.[verse - 1]);
  }
};
