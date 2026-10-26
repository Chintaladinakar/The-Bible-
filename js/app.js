// Scriptura v3 - Master Application Controller
import { CANON_BOOKS, OFFLINE_PASSAGES, DAILY_DEVOTIONALS, READING_PLANS, MOOD_VERSES } from './bible-data.js';
import { BibleSource, TRANSLATIONS, translationById, findBook, parseReference, canonPosition } from './bible-source.js';
import { Storage, Consent } from './storage.js';
import { pwa } from './pwa.js';
import { renderVerseCard } from './share-card.js';
import { CrossRefs } from './cross-refs.js';
import { esc, escapeRegExp, icon, $, setText, reduceMotion, clamp, sentenceCase, enDash, todayKey } from './util.js';

// Status-bar colour per theme; Auto pairs Daylight with Night
const THEME_COLORS = {
  'theme-parchment': '#FBFAF7',
  'theme-sepia': '#F5EEE1',
  'theme-cathedral': '#0C1020'
};
const LIGHT_THEME = 'theme-parchment';
const DARK_THEME = 'theme-cathedral';
const TABS = ['daily', 'reader', 'search', 'library'];
const HIGHLIGHT_COLORS = ['gold', 'rose', 'emerald', 'sky', 'amethyst'];
const COLOR_NAMES = { gold: 'Gold', rose: 'Rose', emerald: 'Green', sky: 'Blue', amethyst: 'Violet' };
const SECTION_LABELS = {
  'OT-Law': 'The Law',
  'OT-History': 'History',
  'OT-Poetry & Wisdom': 'Poetry & wisdom',
  'OT-Prophecy': 'Prophets',
  'NT-Gospels': 'Gospels',
  'NT-History': 'Acts',
  'NT-Epistles': 'Letters',
  'NT-Prophecy': 'Revelation'
};
const MEMORIZE_LEVELS = [
  { label: 'None', hide: () => false },
  { label: 'Some', hide: (i) => i % 4 === 3 },
  { label: 'Half', hide: (i) => i % 2 === 1 },
  { label: 'Most', hide: (i) => i % 4 !== 0 },
  { label: 'All', hide: () => true }
];

const mobileLayout = window.matchMedia('(max-width: 1023px)');
const sheetLayout = window.matchMedia('(max-width: 767px)');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

const sameVerse = (x, book, chapter, verseNum) => x.book === book && x.chapter === chapter && x.verseNum === verseNum;
const TELUGU_TEXT = /[ఀ-౿]/;
// First user-perceived character, so a Telugu letter keeps its vowel sign
const firstGrapheme = (text) => {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const first = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)[Symbol.iterator]().next().value;
    if (first) return first.segment;
  }
  return Array.from(text)[0] || '';
};

class ScripturaApp {
  constructor() {
    this.currentBook = 'Psalms';
    this.currentChapter = 23;
    this.chapter = null;
    this.selectedVerse = null;
    this.preferences = Storage.getPreferences();
    this.activeTab = 'daily';
    this.libraryTab = 'highlights';
    this.libraryColor = 'all';
    this.canonFilter = 'ALL';
    this.dailyOffset = 0;
    this.scrollMemory = {};
    this.lastScrollY = 0;
    this.openSheet = null;
    this.lastFocus = null;
    this.fetchController = null;
    this.fetchTimer = null;
    this.prefetchTimer = null;
    this.pendingFull = null;
    this.cardStyle = 'night';
    this.memo = null;
    this.chapterOpenedAt = 0;
    this.endVisible = false;
    this.readMarked = false;
  }

  init() {
    pwa.init();
    pwa.onConnectivityChange = (online) => this.onConnectivity(online);
    if (!TRANSLATIONS.some(t => t.id === this.preferences.translation)) this.preferences.translation = 'kjv';
    this.renderTranslationOptions();
    this.renderMemorizeLevels();
    this.applyPreferences();
    systemDark.addEventListener?.('change', () => {
      if (this.preferences.theme === 'auto') this.applyPreferences();
    });

    const last = Storage.getLastRead() || { book: 'Psalms', chapter: 23 };
    const book = findBook(last.book) || findBook('Psalms');
    this.currentBook = book.name;
    this.currentChapter = clamp(Number(last.chapter) || 1, 1, book.chapters);

    this.bindEvents();
    this.setupSheets();
    // Once the reader scrolls on their own, stop steering the page back to a verse they jumped to
    ['wheel', 'touchstart', 'keydown'].forEach(type => window.addEventListener(type, () => { this.revealTarget = null; }, { passive: true }));
    this.setupScrollChrome();
    this.setupReadTracking();

    const route = this.parseRoute(location.hash);
    if (route?.book) {
      this.currentBook = route.book.name;
      this.currentChapter = route.chapter;
    }
    this.renderReader({ animate: false, revealVerse: route?.verse });
    window.addEventListener('hashchange', () => this.followRoute(this.parseRoute(location.hash)));

    this.renderDailyDevotional();
    this.renderContinueCard();
    this.renderPlans();
    this.renderPassageStrip();
    this.renderLibrary();
    this.handleSearch('');
    this.updateSearchScope();
    this.ensureBookNames();

    // The app opens on Home unless a link points at a chapter or another tab
    // A chapter left in the address bar only sets where "Continue reading" goes; shortcuts add "open" to jump straight in
    const launchTab = route?.open ? (route.book ? 'reader' : route.tab) : 'daily';
    this.switchTab(launchTab || 'daily', { restoreScroll: false });

    requestAnimationFrame(() => document.documentElement.classList.add('is-ready'));
  }

  // =====================================================================
  // Preferences
  // =====================================================================
  resolvedTheme() {
    const theme = this.preferences.theme;
    if (theme === 'auto' || !THEME_COLORS[theme]) return systemDark.matches ? DARK_THEME : LIGHT_THEME;
    return theme;
  }

  applyPreferences() {
    const root = document.documentElement;
    const theme = this.resolvedTheme();
    [...root.classList].filter(c => c.startsWith('theme-') || c.startsWith('font-')).forEach(c => root.classList.remove(c));
    root.classList.add(theme, 'font-serif');

    // Status bar: follow the system in auto mode, otherwise pin both schemes to the chosen theme
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      const schemeTheme = (meta.getAttribute('media') || '').includes('dark') ? DARK_THEME : LIGHT_THEME;
      meta.setAttribute('content', THEME_COLORS[this.preferences.theme === 'auto' ? schemeTheme : theme]);
    });

    root.style.setProperty('--reader-font-size', `${this.preferences.fontSize}px`);
    root.style.setProperty('--reader-line-height', String(this.preferences.lineHeight));

    const sizeInput = $('input-font-size');
    if (sizeInput) sizeInput.value = this.preferences.fontSize;
    setText('label-font-size', `${this.preferences.fontSize} px`);

    const parallelCheck = $('check-parallel');
    if (parallelCheck) parallelCheck.checked = !!this.preferences.parallel;

    const checks = [
      ['.theme-btn', btn => btn.dataset.theme === this.preferences.theme],
      ['[data-translation]', btn => btn.dataset.translation === this.preferences.translation]
    ];
    checks.forEach(([selector, isOn]) => {
      document.querySelectorAll(selector).forEach(btn => btn.setAttribute('aria-checked', String(isOn(btn))));
    });

    const notes = {
      kjv: 'King James Version, public domain (Crown copyright in the UK). Built into the app, so every chapter opens instantly.',
      tel: 'Telugu Bible (తెలుగు బైబిల్) from Arul John’s Bible-telugu collection, MIT License. Built into the app; each book loads the first time you open it.'
    };
    const tr = translationById(this.preferences.translation);
    setText('translation-note', notes[tr.id] || `${tr.name}, public domain. Chapters load from bible-api.com when you open them, and stay on this device for offline reading if you allow saving.`);
    this.updateOfflineRow();
    this.updateDataRow();
  }

  setPref(key, value) {
    const anchor = key === 'fontSize' ? this.captureReadingAnchor() : null;
    this.preferences[key] = value;
    Storage.savePreferences(this.preferences);
    this.applyPreferences();
    if (anchor) this.restoreReadingAnchor(anchor);
  }

  // Keep the verse at the top of the screen in place when the text reflows
  captureReadingAnchor() {
    if (this.activeTab !== 'reader') return null;
    const el = this.firstVisibleVerseElement();
    return el ? { el, top: el.getBoundingClientRect().top } : null;
  }

  restoreReadingAnchor({ el, top }) {
    if (!el.isConnected) return;
    window.scrollBy({ top: el.getBoundingClientRect().top - top, behavior: 'instant' });
  }

  setTranslation(id) {
    if (id === this.preferences.translation) return;
    this.setPref('translation', id);
    this.renderReader({ animate: true });
    this.ensureBookNames();
    this.updateLocationUI();
    this.renderContinueCard();
    this.renderPlans();
    this.renderPassageStrip();
    this.renderDailyDevotional();
    this.updateSearchScope();
    if (this.activeTab === 'search') this.handleSearch($('search-query-input').value);
  }

  setParallel(on) {
    this.setPref('parallel', on);
    this.ensureBookNames();
    if (this.hasText()) this.paintChapter();
    this.renderPassageStrip();
  }

  // "Download for offline" row in settings: only bundled Bibles can be saved whole
  updateOfflineRow() {
    const row = $('offline-row');
    if (!row) return;
    const tr = translationById(this.preferences.translation);
    row.classList.toggle('hidden', !tr.local);
    if (!tr.local || this.downloading) return;
    const size = { kjv: '4 MB', tel: '9.8 MB' }[tr.id];
    const onDevice = BibleSource.booksOnDevice(tr.id);
    const btn = $('btn-download-bible');
    if (onDevice >= 66) {
      setText('offline-note', `All 66 books of the ${tr.short} are on this device. Reading and search work without a connection.`);
      btn.textContent = 'Downloaded';
      btn.disabled = true;
    } else {
      setText('offline-note', `${onDevice} of 66 books on this device. Download the rest (${size}) to read and search everywhere offline.`);
      btn.textContent = 'Download';
      btn.disabled = false;
    }
  }

  async downloadBible() {
    const tr = this.preferences.translation;
    if (!BibleSource.isLocal(tr) || this.downloading) return;
    this.downloading = true;
    const btn = $('btn-download-bible');
    btn.disabled = true;
    try {
      await BibleSource.downloadAll(tr, (done, total) => {
        btn.textContent = `${done} / ${total}`;
        setText('offline-note', `Downloading ${translationById(tr).short}: ${done} of ${total} books…`);
      });
      pwa.showToast(`The whole ${translationById(tr).short} Bible is on this device`);
    } catch {
      pwa.showToast('The download stopped. Check your connection and try again.');
    } finally {
      this.downloading = false;
      this.updateOfflineRow();
      this.updateSearchScope();
      if (this.activeTab === 'search') this.handleSearch($('search-query-input').value);
    }
  }

  renderTranslationOptions() {
    $('translation-options').innerHTML = TRANSLATIONS.map(t => `
      <button class="segment pressable" role="radio" aria-checked="false" data-translation="${t.id}" title="${esc(t.name)}">${t.short}</button>
    `).join('');
  }

  // =====================================================================
  // Events
  // =====================================================================
  bindEvents() {
    // Navigation-style actions anywhere in the app share one delegated handler
    document.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('[data-tab]');
      if (tabBtn) {
        pwa.haptic();
        this.onTabPress(tabBtn.dataset.tab);
        return;
      }

      const goto = e.target.closest('[data-goto]');
      if (goto) {
        const [book, chapter, verse] = goto.dataset.goto.split('|');
        pwa.haptic();
        this.loadPassage(book, Number(chapter), verse ? Number(verse) : null);
        return;
      }

      const action = e.target.closest('[data-action]');
      if (action) {
        this.runAction(action.dataset.action, action);
        return;
      }

      // A tap outside the verse UI dismisses the verse toolbar
      if (this.selectedVerse && !e.target.closest('.verse, .verse-toolbar, #sheet-layer')) this.dismissVerseAction();
    });

    // Reader chrome
    $('btn-picker-location').addEventListener('click', () => { pwa.haptic(); this.openPicker(); });
    $('btn-prev-top').addEventListener('click', () => this.navigateChapter(-1));
    $('btn-next-top').addEventListener('click', () => this.navigateChapter(1));
    $('btn-appearance').addEventListener('click', () => { pwa.haptic(); this.openDrawer('appearance-drawer'); });
    document.querySelectorAll('.pwa-install-btn').forEach(btn => btn.addEventListener('click', () => pwa.promptInstall()));

    // Verses
    const content = $('reading-content');
    content.addEventListener('click', (e) => {
      const verseEl = e.target.closest('.verse');
      if (!verseEl) return;
      if (e.target.closest('.note-chip')) {
        this.selectVerse(verseEl);
        this.openNoteEditor();
        return;
      }
      const selection = window.getSelection ? window.getSelection() : null;
      if (selection && !selection.isCollapsed && String(selection).trim()) return; // the reader is selecting text
      if (verseEl.classList.contains('is-selected')) {
        this.dismissVerseAction();
        return;
      }
      pwa.haptic();
      this.selectVerse(verseEl);
    });
    content.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('verse')) {
        e.preventDefault();
        this.selectVerse(e.target, { fromKeyboard: true });
      }
    });

    // Verse toolbar
    document.querySelectorAll('.hl-swatch').forEach(swatch => swatch.addEventListener('click', () => {
      pwa.haptic();
      this.highlightSelected(swatch.dataset.color);
    }));
    $('btn-action-bookmark').addEventListener('click', () => { pwa.haptic(); this.bookmarkSelected(); });
    $('btn-action-note').addEventListener('click', () => this.openNoteEditor());
    $('btn-action-copy').addEventListener('click', () => this.copySelected());
    $('btn-action-share').addEventListener('click', () => this.openCardGenerator());
    $('btn-action-memorize').addEventListener('click', () => this.openMemorize());
    $('btn-action-related').addEventListener('click', () => this.openCrossRefs());

    // Cross references
    $('xref-body').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-xref-filter]');
      if (chip && this.xref?.refs) {
        this.xref.filter = chip.dataset.xrefFilter;
        this.renderCrossRefs();
        $('xref-body').querySelector('.xref-filters')?.scrollIntoView({ block: 'start' });
        return;
      }
      const item = e.target.closest('[data-xref]');
      if (item) this.followCrossRef(item.dataset.xref);
    });
    $('xref-back').addEventListener('click', () => this.returnFromCrossRef());
    $('xref-dismiss').addEventListener('click', () => this.hideCrossRefReturn());

    // Settings
    document.querySelectorAll('.theme-btn').forEach(btn => btn.addEventListener('click', () => this.setPref('theme', btn.dataset.theme)));
    $('translation-options').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-translation]');
      if (btn) this.setTranslation(btn.dataset.translation);
    });
    $('input-font-size').addEventListener('input', (e) => this.setPref('fontSize', parseInt(e.target.value, 10)));
    $('btn-size-down').addEventListener('click', () => this.setPref('fontSize', clamp(this.preferences.fontSize - 1, 16, 28)));
    $('btn-size-up').addEventListener('click', () => this.setPref('fontSize', clamp(this.preferences.fontSize + 1, 16, 28)));
    $('check-parallel').addEventListener('change', (e) => this.setParallel(e.target.checked));

    $('btn-download-bible').addEventListener('click', () => this.downloadBible());

    // Permission to save on this device
    Consent.onSaveAttempt(state => this.onSaveAttempt(state));
    $('consent-allow').addEventListener('click', () => this.allowSaving());
    $('consent-later').addEventListener('click', () => this.declineSaving());
    $('btn-data-toggle').addEventListener('click', () => this.toggleSaving());
    $('btn-data-delete').addEventListener('click', () => {
      Consent.revoke();
      this.updateDataRow();
      pwa.showToast('Data from earlier visits is deleted from this device.');
    });

    // Picker
    $('canon-filters').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter]');
      if (!chip) return;
      this.canonFilter = chip.dataset.filter;
      this.renderCanonMatrix();
    });
    $('canon-books-grid').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-pick-book]');
      if (!btn) return;
      pwa.haptic();
      this.openChapterMatrix(CANON_BOOKS.find(b => b.id === btn.dataset.pickBook));
    });
    $('chapter-matrix').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-pick-chapter]');
      if (!btn || !this.pickerBook) return;
      pwa.haptic();
      this.loadPassage(this.pickerBook.name, Number(btn.dataset.pickChapter));
    });
    $('picker-back').addEventListener('click', () => this.showPickerPane('books', 'back'));

    // Note sheet
    $('btn-save-reflection').addEventListener('click', () => this.saveNote());
    $('btn-delete-note').addEventListener('click', () => this.deleteNote());
    $('note-input-area').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.saveNote();
      }
    });

    // Share sheet
    $('btn-card-copy').addEventListener('click', () => this.copyShareText());
    $('btn-card-share').addEventListener('click', () => this.shareCard());
    document.querySelectorAll('.card-style').forEach(btn => btn.addEventListener('click', () => this.setCardStyle(btn.dataset.cardStyle)));

    // Memorize sheet
    $('memorize-levels').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-level]');
      if (!btn || !this.memo) return;
      this.memo.level = Number(btn.dataset.level);
      this.memo.revealed.clear();
      this.renderMemorize();
    });
    $('memorize-text').addEventListener('click', (e) => {
      const blank = e.target.closest('.mem-blank');
      if (!blank || !this.memo) return;
      const i = Number(blank.dataset.i);
      if (this.memo.revealed.has(i)) this.memo.revealed.delete(i);
      else this.memo.revealed.add(i);
      this.renderMemorize();
    });

    // Search
    const searchInput = $('search-query-input');
    searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    $('search-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const ref = parseReference(searchInput.value);
      if (ref) {
        this.loadPassage(ref.book.name, ref.chapter, ref.verse);
        return;
      }
      searchInput.blur();
    });
    $('search-clear').addEventListener('click', () => {
      searchInput.value = '';
      this.handleSearch('');
      searchInput.focus();
    });
    $('view-search').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-query]');
      if (!chip) return;
      searchInput.value = chip.dataset.query;
      this.handleSearch(chip.dataset.query);
    });

    // Library
    $('library-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('[data-lib]');
      if (!tab) return;
      this.libraryTab = tab.dataset.lib;
      this.renderLibrary();
    });
    $('btn-export').addEventListener('click', () => this.exportLibrary());
    $('import-file').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) this.importLibrary(file);
      e.target.value = '';
    });

    // Today
    $('daily-prev').addEventListener('click', () => { this.dailyOffset -= 1; this.renderDailyDevotional(); });
    $('daily-next').addEventListener('click', () => { this.dailyOffset = Math.min(0, this.dailyOffset + 1); this.renderDailyDevotional(); });
    $('daily-reset').addEventListener('click', () => { this.dailyOffset = 0; this.renderDailyDevotional(); });
    $('daily-jump-btn').addEventListener('click', () => {
      const dev = this.todayDev;
      if (dev) this.loadPassage(dev.book, dev.chapter, dev.verseNum);
    });
    $('daily-share-btn').addEventListener('click', () => {
      const dev = this.todayDev;
      if (dev) this.openShareCard({ text: dev.text, reference: `${dev.refLabel} · KJV` });
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.openSheet && this.selectedVerse) {
        this.dismissVerseAction({ restoreFocus: true });
        return;
      }
      if (e.defaultPrevented || this.openSheet || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === '/') {
        e.preventDefault();
        this.switchTab('search');
        searchInput.focus();
      } else if (this.activeTab === 'reader' && e.key === 'ArrowLeft') {
        this.navigateChapter(-1);
      } else if (this.activeTab === 'reader' && e.key === 'ArrowRight') {
        this.navigateChapter(1);
      }
    });
  }

  runAction(name, el) {
    switch (name) {
      case 'retry-chapter':
        this.renderReader({ animate: false });
        break;
      case 'show-full':
        this.showFullChapter();
        break;
      case 'open-settings':
        this.openDrawer('appearance-drawer');
        break;
      case 'download-bible':
        this.downloadBible();
        break;
      case 'open-picker':
        pwa.haptic();
        this.openPicker();
        break;
      case 'memorize-today': {
        const dev = this.todayDev;
        if (dev) this.openMemorizeText(dev.teluguText || dev.text, $('daily-ref').textContent);
        break;
      }
      case 'remove-item':
        this.removeLibraryItem(el.dataset.key);
        break;
      case 'hl-filter':
        this.libraryColor = el.dataset.color;
        this.renderLibrary();
        break;
      case 'plan-check':
        pwa.haptic();
        Storage.togglePlanDay(el.dataset.plan, Number(el.dataset.day));
        this.renderPlans();
        break;
      case 'plan-open': {
        const plan = READING_PLANS.find(p => p.id === el.dataset.plan);
        const reading = plan && plan.readings.find(r => r.day === Number(el.dataset.day));
        if (!reading) break;
        Storage.setPlanDay(plan.id, reading.day, true);
        this.renderPlans();
        this.loadPassage(reading.book, reading.ch);
        break;
      }
      default:
        break;
    }
  }

  // =====================================================================
  // Routing & tabs
  // =====================================================================
  parseRoute(hash) {
    const h = String(hash || '').replace(/^#/, '');
    if (!h) return null;
    const params = new URLSearchParams(h);
    const open = params.has('open');
    const first = h.split('&')[0];
    if (first === 'home') return { tab: 'daily', open };
    if (TABS.includes(first)) return { tab: first, open };
    const book = findBook(params.get('book'));
    if (!book) return null;
    return {
      book,
      open,
      chapter: clamp(parseInt(params.get('ch'), 10) || 1, 1, book.chapters),
      verse: parseInt(params.get('v'), 10) || null
    };
  }

  followRoute(route) {
    if (!route) return;
    if (route.tab) this.switchTab(route.tab, { restoreScroll: false });
    else this.loadPassage(route.book.name, route.chapter, route.verse);
  }

  syncHash() {
    const hash = this.activeTab === 'reader'
      ? `#book=${encodeURIComponent(this.currentBook)}&ch=${this.currentChapter}`
      : this.activeTab === 'daily' ? '#home' : `#${this.activeTab}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }

  onTabPress(tabId) {
    // Tapping the tab you are on returns to the top, like native apps
    if (tabId === this.activeTab) {
      window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
      return;
    }
    this.switchTab(tabId);
  }

  switchTab(tabId, { restoreScroll = true } = {}) {
    if (!TABS.includes(tabId)) tabId = 'reader';
    if (this.activeTab !== tabId) this.scrollMemory[this.activeTab] = window.scrollY;
    this.activeTab = tabId;
    if (tabId !== 'reader') this.dismissVerseAction();

    document.body.dataset.view = tabId;
    document.querySelectorAll('.rail-link[data-tab], .tab[data-tab]').forEach(el => {
      const on = el.dataset.tab === tabId;
      el.classList.toggle('is-active', on);
      if (on) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
    $('tab-bar').style.setProperty('--tab-index', TABS.indexOf(tabId));
    document.querySelectorAll('.view').forEach(view => view.classList.toggle('is-active', view.id === `view-${tabId}`));

    if (tabId === 'reader' && this.chapter) Storage.saveLastRead(this.chapter.book.name, this.chapter.ch);
    if (tabId === 'library') this.renderLibrary();
    if (tabId === 'daily') this.renderContinueCard();
    if (tabId === 'search') this.updateSearchScope();

    document.body.classList.remove('chrome-hidden');
    window.scrollTo({ top: restoreScroll ? (this.scrollMemory[tabId] || 0) : 0, behavior: 'instant' });
    this.lastScrollY = window.scrollY;
    this.updateScrollState();
    this.syncHash();
  }

  // =====================================================================
  // Reader
  // =====================================================================
  get book() {
    return findBook(this.currentBook);
  }

  // Book names follow the reading language: Telugu names while reading the Telugu Bible
  chapterLabel(bookName, chapter) {
    if (this.preferences.translation === 'tel') {
      const book = findBook(bookName);
      if (book) return `${BibleSource.bookName('tel', book)} ${chapter}`;
    }
    return this.englishLabel(bookName, chapter);
  }

  englishLabel(bookName, chapter) {
    return bookName === 'Psalms' ? `Psalm ${chapter}` : `${bookName} ${chapter}`;
  }

  // The other bundled language, shown under each verse when parallel reading is on
  parallelPartner() {
    if (!this.preferences.parallel || !this.hasText()) return null;
    return this.chapter.translation === 'tel' ? 'kjv' : 'tel';
  }

  ensureBookNames() {
    if (this.preferences.translation !== 'tel' && !this.preferences.parallel) return;
    BibleSource.loadBookNames('tel').then(names => {
      if (!names) return;
      this.updateLocationUI();
      if (this.chapter) this.paintChapter();
      this.renderContinueCard();
      this.renderPlans();
      this.renderPassageStrip();
      if (this.todayDev) this.renderDailyDevotional();
    });
  }

  verseLabel(bookName, chapter, verse) {
    return `${this.chapterLabel(bookName, chapter)}:${verse}`;
  }

  sectionLabel(book) {
    return `${book.testament === 'OT' ? 'Old' : 'New'} Testament · ${SECTION_LABELS[`${book.testament}-${book.genre}`]}`;
  }

  hasText() {
    return !!this.chapter && (this.chapter.status === 'full' || this.chapter.status === 'curated');
  }

  renderReader({ animate = true, revealVerse = null } = {}) {
    const book = this.book;
    const ch = this.currentChapter;
    const tr = this.preferences.translation;
    this.abortChapterFetch();
    this.pendingFull = null;

    const curated = BibleSource.curated(book.id, ch);
    const cached = BibleSource.cached(tr, book.id, ch);
    const online = navigator.onLine;
    // Bundled Bibles may already sit in the offline cache, so try them even without a connection
    const canLoad = online || BibleSource.isLocal(tr);
    let state;
    if (cached) state = { status: 'full', verses: cached, translation: tr };
    else if (canLoad) state = { status: 'loading' };
    else if (curated) state = { status: 'curated', verses: curated.verses, translation: 'kjv' };
    else state = { status: 'missing', reason: 'offline' };

    this.chapter = { book, ch, curated, ...state };
    this.chapterOpenedAt = Date.now();
    this.readMarked = false;
    this.paintChapter({ animate, revealVerse });

    if (!cached && canLoad) {
      // A short pause lets fast chapter-flipping skip requests it no longer needs
      this.fetchTimer = setTimeout(() => this.fetchChapter({ revealVerse }), BibleSource.isLocal(tr) ? 30 : 80);
    } else {
      this.schedulePrefetch();
    }

    if (this.activeTab === 'reader') Storage.saveLastRead(book.name, ch);
    this.updateLocationUI();
    this.updateRailStreak();
    if (this.activeTab === 'reader') this.syncHash();
  }

  paintChapter({ animate = false, revealVerse = null } = {}) {
    const { book, ch, curated, status } = this.chapter;
    CrossRefs.prefetch(book.id);
    const label = this.chapterLabel(book.name, ch);
    const excerpt = status === 'curated' && BibleSource.isExcerpt(curated);
    const teluguHead = this.preferences.translation === 'tel' && status !== 'curated';

    const tags = [];
    if (this.hasText()) tags.push(translationById(this.chapter.translation).short);
    if (this.parallelPartner()) tags.push(translationById(this.parallelPartner()).short);
    if (excerpt) tags.push('Selected verses');
    // Telugu headings keep the English reference beside them for bilingual readers
    const eyebrow = teluguHead ? this.englishLabel(book.name, ch) : curated ? label : this.sectionLabel(book);
    const title = teluguHead ? label : curated ? curated.title : label;
    const subtitle = teluguHead ? curated?.title : curated?.subtitle;
    // With both languages on, name the chapter in Telugu too
    const teluguLabel = !teluguHead && this.parallelPartner() === 'tel' ? `${BibleSource.bookName('tel', book)} ${ch}` : '';
    const teluguTag = teluguLabel && teluguLabel !== `${book.name} ${ch}` ? `<span class="tag tag-te" lang="te">${esc(teluguLabel)}</span>` : '';
    $('chapter-eyebrow').innerHTML = `<span class="eyebrow">${esc(eyebrow)}</span>${tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}${teluguTag}`;
    setText('chapter-title', title);
    const sub = $('chapter-subtitle');
    sub.textContent = subtitle || '';
    sub.classList.toggle('hidden', !subtitle);
    document.title = `${label} — The Bible`;

    this.renderNotice();

    const container = $('reading-content');
    const textLang = this.hasText() ? translationById(this.chapter.translation).lang : 'en';
    container.setAttribute('aria-busy', String(status === 'loading'));
    container.setAttribute('lang', textLang);
    container.className = `scripture ${BibleSource.isPoetry(book.id, ch) ? 'is-poetry' : 'is-prose'}${this.parallelPartner() ? ' is-parallel' : ''}`;
    if (status === 'loading') container.innerHTML = this.skeletonHTML(label);
    else if (status === 'missing') container.innerHTML = this.missingChapterHTML();
    else container.innerHTML = this.versesHTML();
    this.loadParallel();

    if (animate) {
      container.classList.add('is-entering');
      container.addEventListener('animationend', () => container.classList.remove('is-entering'), { once: true });
    }

    this.renderChapterNav();
    this.updateReadingProgress();
    if (revealVerse && this.hasText()) requestAnimationFrame(() => this.revealVerse(revealVerse));
    if (this.tryMarkRead) requestAnimationFrame(() => this.tryMarkRead());
  }

  // Load the partner language for parallel reading, then redraw in place
  loadParallel() {
    const partner = this.parallelPartner();
    if (!partner) return;
    const { book, ch } = this.chapter;
    if (BibleSource.cached(partner, book.id, ch)) return;
    BibleSource.fetchChapter(partner, book, ch)
      .then(() => {
        if (this.chapter.book !== book || this.chapter.ch !== ch || !this.hasText()) return;
        $('reading-content').innerHTML = this.versesHTML();
        // The added lines push the text down: bring back a verse that was just jumped to
        const target = this.revealTarget;
        const age = target ? Date.now() - target.at : Infinity;
        if (target && target.book === book.name && target.ch === ch && age < 4000) this.revealVerse(target.num, { flash: age < 1500 });
      })
      .catch(() => { /* the main text still reads fine on its own */ });
  }

  versesHTML() {
    const { book, ch, verses } = this.chapter;
    const poetry = BibleSource.isPoetry(book.id, ch);
    const partner = this.parallelPartner();
    const partnerVerses = partner ? BibleSource.cached(partner, book.id, ch) : null;
    const partnerText = new Map((partnerVerses || []).map(v => [v.num, v.text]));
    const partnerLang = partner ? translationById(partner).lang : '';
    const red = this.preferences.redLetter ? BibleSource.redLetters(book.id, ch) : new Set();
    const highlights = Storage.getHighlights().filter(h => h.book === book.name && h.chapter === ch);
    const bookmarks = Storage.getBookmarks().filter(b => b.book === book.name && b.chapter === ch);
    const notes = Storage.getNotes().filter(n => n.book === book.name && n.chapter === ch);
    const dropNumeral = !poetry && !partner && verses[0]?.num === 1;

    const parts = [];
    if (dropNumeral) parts.push(`<span class="chapter-drop" aria-hidden="true">${ch}</span>`);
    verses.forEach((v, i) => {
      const prevNum = i === 0 ? 0 : verses[i - 1].num;
      if (v.num > prevNum + 1) parts.push(this.gapMarker(prevNum + 1, v.num - 1));

      const hl = highlights.find(h => h.verseNum === v.num);
      const cls = ['verse'];
      if (hl && HIGHLIGHT_COLORS.includes(hl.color)) cls.push(`hl-${hl.color}`);
      if (bookmarks.some(b => b.verseNum === v.num)) cls.push('is-bookmarked');
      const num = i === 0 && dropNumeral
        ? '<span class="visually-hidden">Verse 1 </span>'
        : `<sup class="verse-num">${v.num}</sup>`;
      const ink = `<span class="verse-ink${red.has(v.num) ? ' words-of-christ' : ''}">${this.typesetVerse(v.text)}</span>`;
      const note = notes.some(n => n.verseNum === v.num)
        ? `<button type="button" class="note-chip" aria-label="Open your note on verse ${v.num}">${icon('note')}</button>`
        : '';
      const alt = partnerText.get(v.num)
        ? `<span class="verse-alt" lang="${partnerLang}">${this.typesetVerse(partnerText.get(v.num))}</span>`
        : '';
      parts.push(`<span class="${cls.join(' ')}" data-verse="${v.num}" tabindex="0">${num}<span class="verse-text">${ink}${note}${alt}</span></span>`);
    });
    return parts.join(poetry || partner ? '' : ' ');
  }

  // Printed Bibles set the divine name (LORD, GOD) in small capitals
  typesetVerse(text) {
    return esc(text).replace(/\b(LORD|GOD)(?=\b)/g, (word) => `<span class="divine-name">${word.charAt(0)}${word.slice(1).toLowerCase()}</span>`);
  }

  gapMarker(from, to) {
    const label = from === to ? `Verse ${from} is not included` : `Verses ${from}–${to} are not included`;
    return `<span class="verse-gap" role="note" aria-label="${label}" title="${label}">…</span>`;
  }

  skeletonHTML(label) {
    return `<div class="reader-skeleton" aria-hidden="true">${'<span></span>'.repeat(14)}</div><p class="visually-hidden">Loading ${esc(label)}</p>`;
  }

  missingChapterHTML() {
    const { book, ch, reason } = this.chapter;
    const label = this.chapterLabel(book.name, ch);
    const tr = translationById(this.preferences.translation);
    const copy = {
      offline: [`${label} isn’t on this device yet`, 'You’re offline. Open this chapter once while connected and it stays readable without a connection.'],
      rate: ['The Bible service is busy', 'Too many chapters were requested in a short time. Wait a few seconds, then try again.'],
      notfound: [`${label} isn’t available in the ${tr.name}`, 'Choose another translation in Reading settings, or try again later.'],
      network: [`${label} didn’t load`, 'The Bible service couldn’t be reached. Check your connection and try again.']
    };
    const [title, text] = copy[reason] || copy.network;
    const retry = reason === 'offline'
      ? ''
      : `<button class="btn btn-secondary btn-sm pressable" data-action="retry-chapter">${icon('refresh', 'icon-sm')}<span>Try again</span></button>`;
    const nearby = this.nearbySaved(4);
    const list = nearby.length ? `
      <p class="empty-text">Saved on this device</p>
      <ul class="suggest-list">${nearby.map(p => `
        <li><button class="suggest pressable" data-goto="${esc(p.book)}|${p.chapter}">
          <span class="suggest-ref">${esc(this.chapterLabel(p.book, p.chapter))}</span>
          <span class="suggest-title">${esc(p.title || this.sectionLabel(findBook(p.book)))}</span>
          ${icon('chev-right', 'icon-sm')}
        </button></li>`).join('')}
      </ul>` : '';
    return `<div class="chapter-empty"><h2 class="empty-title">${esc(title)}</h2><p class="empty-text">${esc(text)}</p>${retry}${list}</div>`;
  }

  nearbySaved(count) {
    const target = canonPosition(this.currentBook, this.currentChapter);
    return BibleSource.savedList(this.preferences.translation)
      .filter(p => !(p.book === this.currentBook && p.chapter === this.currentChapter))
      .sort((a, b) => Math.abs(canonPosition(a.book, a.chapter) - target) - Math.abs(canonPosition(b.book, b.chapter) - target))
      .slice(0, count)
      .sort((a, b) => canonPosition(a.book, a.chapter) - canonPosition(b.book, b.chapter));
  }

  renderNotice() {
    const el = $('chapter-notice');
    const { status, curated, book, ch, fetchError } = this.chapter;
    const label = this.chapterLabel(book.name, ch);
    let html = '';
    if (this.pendingFull) {
      html = `<p><strong>The full chapter is ready.</strong> You’re reading selected verses.</p>
        <button class="btn btn-secondary pressable" data-action="show-full">Show all verses</button>`;
    } else if (status === 'curated') {
      const excerpt = BibleSource.isExcerpt(curated);
      if (this.preferences.translation !== 'kjv') {
        html = `<p>Showing the English passage saved with the app. The ${esc(translationById(this.preferences.translation).name)} for ${esc(label)} downloads when you’re online.</p>`;
      } else if (excerpt && !navigator.onLine) {
        html = `<p><strong>Selected verses.</strong> Connect to the internet to read all of ${esc(label)}; it will stay on this device afterwards.</p>`;
      } else if (excerpt && fetchError) {
        html = `<p><strong>Selected verses.</strong> The full chapter didn’t load.</p>
          <button class="btn btn-secondary pressable" data-action="retry-chapter">${icon('refresh', 'icon-sm')}<span>Try again</span></button>`;
      }
    }
    el.innerHTML = html;
    el.classList.toggle('hidden', !html);
  }

  async fetchChapter({ revealVerse = null } = {}) {
    const { book, ch } = this.chapter;
    const tr = this.preferences.translation;
    const controller = new AbortController();
    this.fetchController = controller;
    try {
      const verses = await BibleSource.fetchChapter(tr, book, ch, { signal: controller.signal });
      if (this.fetchController !== controller) return;
      this.fetchController = null;
      const prev = this.chapter;
      if (prev.book !== book || prev.ch !== ch) return;
      this.updateSearchScope();

      if (prev.status === 'curated') {
        if (tr === 'kjv' && prev.verses.length === verses.length) {
          // The curated text was already the whole chapter; nothing to redraw
          this.chapter = { ...prev, status: 'full', verses, translation: tr };
          this.schedulePrefetch();
          return;
        }
        if (window.scrollY > 240 || this.selectedVerse) {
          // Never move text under someone who is reading: offer the swap instead
          this.pendingFull = { verses, translation: tr };
          this.renderNotice();
          return;
        }
      }
      this.chapter = { ...prev, status: 'full', verses, translation: tr, fetchError: null };
      this.paintChapter({ animate: true, revealVerse });
      this.schedulePrefetch();
    } catch (err) {
      if (err.name === 'AbortError' || this.fetchController !== controller) return;
      this.fetchController = null;
      const prev = this.chapter;
      if (prev.status === 'loading' && prev.curated) {
        // Fall back to the passage that ships inside the app
        this.chapter = { ...prev, status: 'curated', verses: prev.curated.verses, translation: 'kjv', fetchError: err.code || 'network' };
        this.paintChapter();
      } else if (prev.status === 'loading') {
        this.chapter = { ...prev, status: 'missing', reason: err.code || 'network' };
        this.paintChapter();
      } else {
        this.chapter = { ...prev, fetchError: err.code || 'network' };
        this.renderNotice();
      }
    }
  }

  abortChapterFetch() {
    clearTimeout(this.fetchTimer);
    clearTimeout(this.prefetchTimer);
    if (this.fetchController) {
      this.fetchController.abort();
      this.fetchController = null;
    }
  }

  // Quietly save the next chapter so turning the page is instant and works offline
  schedulePrefetch() {
    clearTimeout(this.prefetchTimer);
    if (!navigator.onLine) return;
    this.prefetchTimer = setTimeout(() => {
      const next = this.adjacentChapter(1);
      if (!next || this.activeTab !== 'reader') return;
      const book = findBook(next.book);
      const tr = this.preferences.translation;
      if (BibleSource.has(tr, book.id, next.chapter)) return;
      BibleSource.fetchChapter(tr, book, next.chapter)
        .then(() => this.updateSearchScope())
        .catch(() => { /* a missed prefetch is harmless */ });
    }, 5000);
  }

  showFullChapter() {
    if (!this.pendingFull) return;
    const anchor = this.selectedVerse?.verseNum || Number(this.firstVisibleVerseElement()?.dataset.verse) || null;
    this.chapter = { ...this.chapter, status: 'full', verses: this.pendingFull.verses, translation: this.pendingFull.translation };
    this.pendingFull = null;
    this.dismissVerseAction();
    this.paintChapter({ animate: true });
    if (anchor) requestAnimationFrame(() => this.revealVerse(anchor, { flash: false }));
  }

  renderChapterNav() {
    const nav = $('chapter-nav');
    const card = (target, dir) => {
      if (!target) return '<span class="cn-btn cn-empty" aria-hidden="true"></span>';
      const book = findBook(target.book);
      const curated = BibleSource.curated(book.id, target.chapter);
      let sub = '';
      if (curated) sub = curated.title;
      else if (target.book !== this.currentBook) sub = this.sectionLabel(book);
      const direction = dir === 'prev'
        ? `${icon('chev-left', 'icon-xs')}Previous`
        : `Next${icon('chev-right', 'icon-xs')}`;
      return `<button class="cn-btn cn-${dir} pressable" data-goto="${esc(target.book)}|${target.chapter}">
        <span class="cn-dir">${direction}</span>
        <span class="cn-title">${esc(this.chapterLabel(target.book, target.chapter))}</span>
        ${sub ? `<span class="cn-sub">${esc(sub)}</span>` : ''}
      </button>`;
    };
    const readToday = Storage.getReadLog()[`${this.currentBook}|${this.currentChapter}`] === todayKey();
    const mark = readToday ? `<p class="read-mark">${icon('check', 'icon-sm')}Read today</p>` : '';
    nav.innerHTML = mark + card(this.adjacentChapter(-1), 'prev') + card(this.adjacentChapter(1), 'next');
    nav.classList.toggle('hidden', this.chapter.status === 'loading');
  }

  adjacentChapter(delta) {
    let bookIndex = CANON_BOOKS.findIndex(b => b.name === this.currentBook);
    if (bookIndex < 0) return null;
    let chapter = this.currentChapter + delta;
    if (chapter < 1) {
      bookIndex -= 1;
      if (bookIndex < 0) return null;
      chapter = CANON_BOOKS[bookIndex].chapters;
    } else if (chapter > CANON_BOOKS[bookIndex].chapters) {
      bookIndex += 1;
      if (bookIndex >= CANON_BOOKS.length) return null;
      chapter = 1;
    }
    return { book: CANON_BOOKS[bookIndex].name, chapter };
  }

  navigateChapter(delta) {
    const target = this.adjacentChapter(delta);
    if (target) this.loadPassage(target.book, target.chapter);
  }

  loadPassage(book, chapter, verseNum = null) {
    const target = findBook(book);
    if (!target) return;
    const ch = clamp(Math.round(chapter) || 1, 1, target.chapters);
    const changed = target.name !== this.currentBook || ch !== this.currentChapter;

    this.closeAllDrawers();
    this.dismissVerseAction();
    this.currentBook = target.name;
    this.currentChapter = ch;
    this.scrollMemory.reader = 0;
    if (changed || !this.hasText()) this.renderReader({ animate: true, revealVerse: verseNum });
    this.switchTab('reader', { restoreScroll: false });
    if (!changed && verseNum) requestAnimationFrame(() => this.revealVerse(verseNum));
  }

  revealVerse(num, { flash = true } = {}) {
    const el = document.querySelector(`#reading-content .verse[data-verse="${num}"]`);
    if (!el) return;
    this.revealTarget = { book: this.currentBook, ch: this.currentChapter, num, at: Date.now() };
    el.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
    if (!flash) return;
    el.classList.remove('is-flash');
    void el.offsetWidth;
    el.classList.add('is-flash');
    setTimeout(() => el.classList.remove('is-flash'), 1900);
  }

  firstVisibleVerseElement() {
    const barBottom = $('top-bar').getBoundingClientRect().bottom;
    return [...document.querySelectorAll('#reading-content .verse')].find(el => el.getBoundingClientRect().bottom > barBottom + 8) || null;
  }

  updateLocationUI() {
    const label = this.chapterLabel(this.currentBook, this.currentChapter);
    setText('location-text', label);
    $('btn-picker-location').setAttribute('aria-label', `${label}. Choose a book and chapter`);
    document.querySelectorAll('[data-passage-label]').forEach(el => { el.textContent = label; });
    $('btn-prev-top').disabled = !this.adjacentChapter(-1);
    $('btn-next-top').disabled = !this.adjacentChapter(1);
  }

  // =====================================================================
  // Reading progress, read log and immersive scrolling
  // =====================================================================
  setupScrollChrome() {
    let ticking = false;
    this.lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        this.updateScrollState();
      });
    }, { passive: true });
    window.addEventListener('resize', () => this.updateReadingProgress(), { passive: true });
  }

  updateScrollState() {
    const y = Math.max(0, window.scrollY);
    const dy = y - this.lastScrollY;
    document.body.classList.toggle('is-scrolled', y > 8);
    const nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 96;
    const canHide = mobileLayout.matches && this.activeTab === 'reader' && !this.selectedVerse && !this.openSheet;
    if (!canHide || y < 120 || nearBottom) document.body.classList.remove('chrome-hidden');
    else if (dy > 10) document.body.classList.add('chrome-hidden');
    else if (dy < -10) document.body.classList.remove('chrome-hidden');
    if (Math.abs(dy) > 10 || y < 120) this.lastScrollY = y;
    this.updateReadingProgress();
  }

  updateReadingProgress() {
    if (this.activeTab !== 'reader') return;
    // 0 while the first verse is still below the bar, 1 when the chapter's end reaches the bottom
    const article = $('reading-content');
    const end = $('chapter-end');
    const barBottom = $('top-bar').offsetHeight;
    const start = article.getBoundingClientRect().top + window.scrollY - barBottom;
    const finish = end.getBoundingClientRect().top + window.scrollY - window.innerHeight;
    const progress = finish > start + 40 ? clamp((window.scrollY - start) / (finish - start), 0, 1) : 0;
    $('read-progress').style.setProperty('--progress', progress.toFixed(3));
  }

  // A chapter counts as read once its end has been on screen and it has been open a little while
  setupReadTracking() {
    if (!('IntersectionObserver' in window)) return;
    const tryMark = () => {
      if (!this.endVisible || this.readMarked || this.activeTab !== 'reader' || !this.hasText()) return;
      const wait = 6000 - (Date.now() - this.chapterOpenedAt);
      if (wait > 0) {
        clearTimeout(this.readTimer);
        this.readTimer = setTimeout(tryMark, wait + 50);
        return;
      }
      this.readMarked = true;
      Storage.markRead(this.currentBook, this.currentChapter);
      this.renderChapterNav();
      this.updateRailStreak();
    };
    // Short chapters can show their end while still loading, so re-check after every paint too
    this.tryMarkRead = tryMark;
    new IntersectionObserver((entries) => {
      this.endVisible = entries.some(e => e.isIntersecting);
      tryMark();
    }).observe($('chapter-end'));
  }

  updateRailStreak() {
    const streak = Storage.currentStreak();
    setText('rail-streak', streak >= 2 ? `${streak} days` : '');
  }

  onConnectivity(online) {
    if (!this.chapter) return;
    if (online) {
      const curatedPartial = this.chapter.status === 'curated'
        && (BibleSource.isExcerpt(this.chapter.curated) || this.preferences.translation !== 'kjv');
      if (this.chapter.status === 'missing' || curatedPartial) {
        if (window.scrollY < 240 && !this.selectedVerse) this.renderReader({ animate: false });
        else this.fetchChapter();
      }
    } else {
      this.renderNotice();
    }
  }

  // =====================================================================
  // Verse selection & toolbar
  // =====================================================================
  selectVerse(element, { fromKeyboard = false } = {}) {
    const num = Number(element.dataset.verse);
    const verse = this.chapter?.verses?.find(v => v.num === num);
    if (!verse) return;
    document.querySelectorAll('#reading-content .verse.is-selected').forEach(el => el.classList.remove('is-selected'));
    element.classList.add('is-selected');
    this.selectedVerse = { book: this.currentBook, chapter: this.currentChapter, verseNum: num, text: verse.text, element };
    this.updateVerseToolbar();

    const bar = $('verse-action-bar');
    bar.classList.add('is-visible');
    bar.removeAttribute('inert');
    bar.setAttribute('aria-hidden', 'false');
    document.body.classList.add('has-verse-toolbar');
    document.body.classList.remove('chrome-hidden');
    if (fromKeyboard) bar.querySelector('.hl-swatch')?.focus();

    // Keep the chosen verse clear of the toolbar
    requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      const barTop = window.innerHeight - bar.offsetHeight - 24;
      if (rect.bottom > barTop) window.scrollBy({ top: rect.bottom - barTop + 16, behavior: reduceMotion() ? 'auto' : 'smooth' });
    });
  }

  updateVerseToolbar() {
    const { book, chapter, verseNum } = this.selectedVerse;
    setText('vt-ref', this.verseLabel(book, chapter, verseNum));
    const hl = Storage.getHighlights().find(h => sameVerse(h, book, chapter, verseNum));
    document.querySelectorAll('.hl-swatch[data-color]').forEach(s => {
      if (s.dataset.color === 'clear') {
        s.disabled = !hl;
        return;
      }
      s.setAttribute('aria-pressed', String(!!hl && s.dataset.color === hl.color));
    });
    const marked = Storage.getBookmarks().some(b => sameVerse(b, book, chapter, verseNum));
    $('btn-action-bookmark').setAttribute('aria-pressed', String(marked));
    setText('vt-bookmark-label', marked ? 'Saved' : 'Bookmark');
    this.updateRelatedButton();
  }

  dismissVerseAction({ restoreFocus = false } = {}) {
    const el = this.selectedVerse?.element;
    document.querySelectorAll('#reading-content .verse.is-selected').forEach(v => v.classList.remove('is-selected'));
    const bar = $('verse-action-bar');
    if (restoreFocus && el?.isConnected && bar.contains(document.activeElement)) el.focus({ preventScroll: true });
    bar.classList.remove('is-visible');
    bar.setAttribute('inert', '');
    bar.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('has-verse-toolbar');
    this.selectedVerse = null;
  }

  highlightSelected(color) {
    if (!this.selectedVerse) return;
    const { book, chapter, verseNum, text, element } = this.selectedVerse;
    const current = Storage.getHighlights().find(h => sameVerse(h, book, chapter, verseNum));
    element.classList.remove(...HIGHLIGHT_COLORS.map(c => `hl-${c}`));

    // Tapping the color a verse already has removes it
    if (color === 'clear' || current?.color === color) {
      Storage.removeHighlight(book, chapter, verseNum);
    } else {
      element.classList.add(`hl-${color}`);
      Storage.saveHighlight({ book, chapter, verseNum, color, text, date: new Date().toISOString() });
    }
    this.dismissVerseAction();
    this.updateLibraryCounts();
  }

  bookmarkSelected() {
    if (!this.selectedVerse) return;
    const { book, chapter, verseNum, text, element } = this.selectedVerse;
    const { isBookmarked } = Storage.toggleBookmark({ book, chapter, verseNum, text, date: new Date().toISOString() });
    element.classList.toggle('is-bookmarked', isBookmarked);
    this.dismissVerseAction();
    this.updateLibraryCounts();
    if (isBookmarked) {
      pwa.showToast(`Bookmarked ${this.verseLabel(book, chapter, verseNum)}`, 'success', {
        actionLabel: 'View',
        onAction: () => {
          this.libraryTab = 'bookmarks';
          this.switchTab('library');
        }
      });
    }
  }

  async copySelected() {
    if (!this.selectedVerse) return;
    const { book, chapter, verseNum, text } = this.selectedVerse;
    const ref = `${this.verseLabel(book, chapter, verseNum)} ${translationById(this.chapter.translation).short}`;
    const ok = await this.copyText(`“${text}” — ${ref}`);
    this.dismissVerseAction();
    pwa.showToast(ok ? `Copied ${this.verseLabel(book, chapter, verseNum)}` : 'Couldn’t copy. Select the text and copy it instead.');
  }

  async copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      const area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', '');
      area.className = 'visually-hidden';
      document.body.append(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      area.remove();
      return ok;
    }
  }

  // =====================================================================
  // Notes
  // =====================================================================
  openNoteEditor() {
    if (!this.selectedVerse) return;
    const { book, chapter, verseNum, text } = this.selectedVerse;
    this.noteTarget = { book, chapter, verseNum, text };
    const existing = Storage.getNotes().find(n => sameVerse(n, book, chapter, verseNum));
    setText('note-ref-display', this.verseLabel(book, chapter, verseNum));
    setText('note-verse-text', text);
    $('note-input-area').value = existing ? existing.content : '';
    $('btn-delete-note').classList.toggle('hidden', !existing);
    this.dismissVerseAction();
    this.openDrawer('note-drawer');
    $('note-input-area').focus({ preventScroll: true });
  }

  saveNote() {
    const target = this.noteTarget;
    if (!target) return;
    const content = $('note-input-area').value.trim();
    const existed = Storage.getNotes().some(n => sameVerse(n, target.book, target.chapter, target.verseNum));
    Storage.saveNote({
      id: `${target.book}_${target.chapter}_${target.verseNum}`,
      book: target.book,
      chapter: target.chapter,
      verseNum: target.verseNum,
      verseText: target.text,
      content,
      date: new Date().toISOString()
    });
    this.noteTarget = null;
    this.closeAllDrawers();
    this.refreshAnnotations();
    if (content) pwa.showToast(existed ? 'Note updated' : 'Note saved');
    else if (existed) pwa.showToast('Note removed');
  }

  deleteNote() {
    const target = this.noteTarget;
    if (!target) return;
    const note = Storage.getNotes().find(n => sameVerse(n, target.book, target.chapter, target.verseNum));
    Storage.removeNote(target.book, target.chapter, target.verseNum);
    this.noteTarget = null;
    this.closeAllDrawers();
    this.refreshAnnotations();
    if (note) {
      pwa.showToast('Note deleted', 'info', {
        actionLabel: 'Undo',
        onAction: () => {
          Storage.saveNote(note);
          this.refreshAnnotations();
        }
      });
    }
  }

  // Redraw verse markers in place without replaying the chapter's entrance
  refreshAnnotations() {
    if (this.hasText()) {
      const container = $('reading-content');
      container.innerHTML = this.versesHTML();
    }
    this.renderLibrary();
  }

  // =====================================================================
  // Sharing
  // =====================================================================
  openCardGenerator() {
    if (!this.selectedVerse) return;
    const { book, chapter, verseNum, text } = this.selectedVerse;
    this.dismissVerseAction();
    this.openShareCard({ text, reference: `${this.verseLabel(book, chapter, verseNum)} · ${translationById(this.chapter.translation).short}` });
  }

  openShareCard({ text, reference }) {
    this.shareTarget = { text, reference };
    setText('card-preview-text', `“${text}”`);
    $('card-preview-text').lang = TELUGU_TEXT.test(text) ? 'te' : 'en';
    setText('card-preview-ref', reference);
    this.setCardStyle(this.cardStyle);
    this.openDrawer('card-drawer');
  }

  setCardStyle(style) {
    this.cardStyle = style;
    $('verse-card').dataset.style = style;
    document.querySelectorAll('.card-style').forEach(btn => btn.setAttribute('aria-checked', String(btn.dataset.cardStyle === style)));
    this.prepareCard();
  }

  // iPhone Safari only opens the share sheet straight from a tap, with no waiting in between,
  // so the picture is drawn ahead of time: when the sheet opens and whenever the style changes
  prepareCard() {
    const target = this.shareTarget;
    const style = this.cardStyle;
    if (!target) return;
    this.cardFile = null;
    const btn = $('btn-card-share');
    btn.disabled = true;
    renderVerseCard({ text: target.text, reference: target.reference, style })
      .then(blob => {
        if (this.shareTarget !== target || this.cardStyle !== style) return;
        const slug = target.reference.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        this.cardFile = new File([blob], `${slug.length > 3 ? slug : 'verse'}.png`, { type: 'image/png' });
      })
      .catch(() => { /* shareCard explains it */ })
      .finally(() => { if (this.shareTarget === target) btn.disabled = false; });
  }

  async copyShareText() {
    if (!this.shareTarget) return;
    const { text, reference } = this.shareTarget;
    const ok = await this.copyText(`“${text}” — ${reference}`);
    pwa.showToast(ok ? 'Verse copied' : 'Couldn’t copy. Select the text and copy it instead.');
    if (ok) this.closeAllDrawers();
  }

  // Sends the card picture to the share sheet; nothing is awaited before navigator.share so iPhone allows it
  shareCard() {
    const file = this.cardFile;
    if (!file) {
      pwa.showToast('The card couldn’t be drawn on this device. Copy the text instead.');
      return;
    }
    if (navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file] })
        .then(() => this.closeAllDrawers())
        .catch(err => {
          if (err.name !== 'AbortError') pwa.showToast('Sharing didn’t work here. Copy the text instead.');
        });
      return;
    }
    // Browsers that can't share images (some desktops): put the picture on the clipboard to paste into a chat
    this.copyImage(file).then(ok => {
      pwa.showToast(ok ? 'Card copied. Paste it into any chat or post.' : 'This browser can’t share pictures. Copy the text instead.');
      if (ok) this.closeAllDrawers();
    });
  }

  async copyImage(file) {
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') return false;
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': file })]);
      return true;
    } catch {
      return false;
    }
  }

  downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // =====================================================================
  // Memorize
  // =====================================================================
  renderMemorizeLevels() {
    $('memorize-levels').innerHTML = MEMORIZE_LEVELS.map((level, i) => `
      <button class="segment pressable" role="radio" aria-checked="false" data-level="${i}">${level.label}</button>
    `).join('');
  }

  // =====================================================================
  // Cross references
  // =====================================================================
  // Count on the toolbar button; the book's file usually arrived while the chapter was read
  updateRelatedButton() {
    const sel = this.selectedVerse;
    const btn = $('btn-action-related');
    const badge = $('vt-related-count');
    const book = sel && findBook(sel.book);
    if (!book) return;
    const count = CrossRefs.countNow(book.id, sel.chapter, sel.verseNum);
    if (count === null) {
      badge.hidden = true;
      btn.disabled = false;
      btn.setAttribute('aria-label', 'Related verses');
      CrossRefs.forVerse(book.id, sel.chapter, sel.verseNum)
        .then(() => { if (this.selectedVerse === sel) this.updateRelatedButton(); })
        .catch(() => { /* the sheet explains a failed load */ });
      return;
    }
    btn.disabled = count === 0;
    badge.hidden = count === 0;
    badge.textContent = count > 99 ? '99+' : String(count);
    btn.setAttribute('aria-label', count ? `Related verses, ${count}` : 'No related verses');
  }

  async openCrossRefs(source = null, { filter = 'ALL', scrollTop = 0 } = {}) {
    if (!source) {
      if (!this.selectedVerse) return;
      const { book, chapter, verseNum, text } = this.selectedVerse;
      source = { book, chapter, verse: verseNum, text, lang: this.preferences.translation === 'tel' ? 'te' : 'en' };
      this.dismissVerseAction();
    }
    const book = findBook(source.book);
    if (!book) return;
    this.xref = { source, filter, refs: null };
    const body = $('xref-body');
    body.innerHTML = `${this.crossRefSourceHTML(source)}<p class="xref-status">Finding related verses…</p>`;
    this.openDrawer('xref-sheet');
    let refs;
    try {
      refs = await CrossRefs.forVerse(book.id, source.chapter, source.verse);
    } catch {
      if (this.xref?.source !== source) return;
      body.innerHTML = `${this.crossRefSourceHTML(source)}<p class="xref-status">Related verses couldn’t load. Check your connection and try again.</p>`;
      return;
    }
    if (this.xref?.source !== source) return;
    this.xref.refs = refs;
    this.renderCrossRefs();
    body.scrollTop = scrollTop;
  }

  crossRefSourceHTML(source) {
    return `<figure class="xref-source">
      <figcaption class="xref-source-ref">${esc(this.verseLabel(source.book, source.chapter, source.verse))}</figcaption>
      <blockquote class="xref-source-text" lang="${source.lang}">${esc(source.text)}</blockquote>
    </figure>`;
  }

  crossRefLabel(ref) {
    return `${this.chapterLabel(ref.book.name, ref.chapter)}:${ref.verse}${ref.to > ref.verse ? `–${ref.to}` : ''}`;
  }

  renderCrossRefs() {
    const { source, refs, filter } = this.xref;
    const counts = {
      ALL: refs.length,
      OT: refs.filter(r => r.book.testament === 'OT').length,
      NT: refs.filter(r => r.book.testament === 'NT').length
    };
    const shown = filter === 'ALL' ? refs : refs.filter(r => r.book.testament === filter);
    const groups = [];
    shown.forEach(r => {
      const last = groups[groups.length - 1];
      if (last && last.book === r.book) last.refs.push(r);
      else groups.push({ book: r.book, refs: [r] });
    });

    const telugu = this.preferences.translation === 'tel';
    const summary = refs.length
      ? `${refs.length} related ${refs.length === 1 ? 'verse' : 'verses'} · tap one to read it in its chapter`
      : 'No cross references are listed for this verse.';
    const chips = counts.OT && counts.NT
      ? `<div class="chip-row chip-row--scroll xref-filters" role="group" aria-label="Show related verses from">${[['ALL', 'All'], ['OT', 'Old Testament'], ['NT', 'New Testament']].map(([id, label]) =>
          `<button class="chip pressable${filter === id ? ' is-active' : ''}" data-xref-filter="${id}" aria-pressed="${filter === id}">${label}<span class="chip-count">${counts[id]}</span></button>`).join('')}</div>`
      : '';
    const kjvNote = !telugu && this.preferences.translation !== 'kjv' ? '<p class="xref-note">Related verses are shown in the King James Version.</p>' : '';

    $('xref-body').innerHTML = `${this.crossRefSourceHTML(source)}
      <p class="xref-summary">${summary}</p>${chips}${kjvNote}
      ${groups.map(g => `<section class="xref-group" data-book="${g.book.id}">
        <h3 class="xref-book"${telugu ? ' lang="te"' : ''}>${esc(BibleSource.bookName(telugu ? 'tel' : 'kjv', g.book))}<span>${g.refs.length}</span></h3>
        <ul class="xref-list">${g.refs.map(r => `<li>
          <button class="xref-item pressable" data-xref="${g.book.id}|${r.chapter}|${r.verse}">
            <span class="xref-ref"${telugu ? ' lang="te"' : ''}>${esc(this.crossRefLabel(r))}</span>
            <span class="xref-text" data-range="${r.chapter}|${r.verse}|${r.to}"><span class="xref-skel"></span><span class="xref-skel"></span></span>
          </button></li>`).join('')}</ul>
      </section>`).join('')}`;
    this.observeCrossRefText();
  }

  // Verse text fills in book by book as each group nears the view, so long lists stay quick
  observeCrossRefText() {
    this.xrefObserver?.disconnect();
    const body = $('xref-body');
    const groups = body.querySelectorAll('.xref-group');
    if (!('IntersectionObserver' in window)) {
      groups.forEach(g => this.fillCrossRefGroup(g));
      return;
    }
    this.xrefObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        this.xrefObserver.unobserve(entry.target);
        this.fillCrossRefGroup(entry.target);
      });
    }, { root: body, rootMargin: '400px 0px' });
    groups.forEach(g => this.xrefObserver.observe(g));
  }

  async fillCrossRefGroup(group) {
    const book = CANON_BOOKS.find(b => b.id === group.dataset.book);
    const tr = this.preferences.translation === 'tel' ? 'tel' : 'kjv';
    for (const slot of group.querySelectorAll('[data-range]')) {
      const [chapter, from, to] = slot.dataset.range.split('|').map(Number);
      try {
        const verses = (await BibleSource.fetchChapter(tr, book, chapter)).filter(v => v.num >= from && v.num <= to);
        if (!verses.length) throw new Error('missing');
        slot.lang = tr === 'tel' ? 'te' : 'en';
        slot.innerHTML = verses.map(v => `${to > from ? `<sup>${v.num}</sup>` : ''}${esc(v.text)}`).join(' ');
      } catch {
        slot.innerHTML = '<span class="xref-missing">Tap to read this verse</span>';
      }
    }
  }

  followCrossRef(spec) {
    const [id, chapter, verse] = spec.split('|');
    const book = CANON_BOOKS.find(b => b.id === id);
    if (!book || !this.xref) return;
    const { source } = this.xref;
    this.xrefReturn = { source, filter: this.xref.filter, scrollTop: $('xref-body').scrollTop };
    this.closeSheet($('xref-sheet'), { restoreFocus: false });
    this.loadPassage(book.name, Number(chapter), Number(verse));
    setText('xref-back-label', `Back to ${this.verseLabel(source.book, source.chapter, source.verse)}`);
    $('xref-return').hidden = false;
  }

  hideCrossRefReturn() {
    this.xrefReturn = null;
    $('xref-return').hidden = true;
  }

  // Back to the verse the trail started from, with its list open where it was left
  returnFromCrossRef() {
    const back = this.xrefReturn;
    if (!back) return;
    this.hideCrossRefReturn();
    this.loadPassage(back.source.book, back.source.chapter, back.source.verse);
    this.openCrossRefs(back.source, { filter: back.filter, scrollTop: back.scrollTop });
  }

  openMemorize() {
    if (!this.selectedVerse) return;
    const { book, chapter, verseNum, text } = this.selectedVerse;
    this.dismissVerseAction();
    this.openMemorizeText(text, this.verseLabel(book, chapter, verseNum));
  }

  openMemorizeText(text, reference) {
    this.memo = { words: text.split(/\s+/).filter(Boolean), level: 1, revealed: new Set() };
    setText('memorize-ref', reference);
    $('memorize-text').lang = TELUGU_TEXT.test(text) ? 'te' : 'en';
    this.renderMemorize();
    this.openDrawer('memorize-drawer');
  }

  renderMemorize() {
    const { words, level, revealed } = this.memo;
    const rule = MEMORIZE_LEVELS[level];
    let hidden = 0;
    $('memorize-text').innerHTML = words.map((word, i) => {
      // Marks (\p{M}) belong to the word: Telugu vowel signs must stay with their letters
      const [, lead, core, trail] = word.match(/^([^\p{L}\p{N}\p{M}]*)(.*?)([^\p{L}\p{N}\p{M}]*)$/u);
      if (!core || !rule.hide(i)) return esc(word);
      hidden++;
      const open = revealed.has(i);
      const first = firstGrapheme(core);
      const label = open ? core : `Hidden word starting with ${first}, tap to show`;
      return `${esc(lead)}<button type="button" class="mem-blank${open ? ' is-revealed' : ''}" data-i="${i}" aria-label="${esc(label)}"><span class="mem-first">${esc(first)}</span>${esc(core.slice(first.length))}</button>${esc(trail)}`;
    }).join(' ');
    setText('memorize-level-value', `${hidden} of ${words.length} words hidden`);
    document.querySelectorAll('#memorize-levels .segment').forEach(btn => btn.setAttribute('aria-checked', String(Number(btn.dataset.level) === level)));
  }

  // =====================================================================
  // Book & chapter picker
  // =====================================================================
  openPicker() {
    this.showPickerPane('books');
    this.renderCanonMatrix();
    this.openDrawer('picker-sheet');
    requestAnimationFrame(() => {
      document.querySelector('#canon-books-grid .is-current')?.scrollIntoView({ block: 'center' });
    });
  }

  renderCanonMatrix() {
    const tr = this.preferences.translation;
    // Chapters the reader has finished, per book
    const readByBook = new Map();
    Object.keys(Storage.getReadLog()).forEach(key => {
      const book = key.split('|')[0];
      readByBook.set(book, (readByBook.get(book) || 0) + 1);
    });
    const f = this.canonFilter;
    const list = CANON_BOOKS.filter(b => f === 'ALL'
      || (f === 'OT' && b.testament === 'OT')
      || (f === 'NT' && b.testament === 'NT')
      || (f === 'POETRY' && b.genre === 'Poetry & Wisdom')
      || (f === 'GOSPELS' && b.genre === 'Gospels')
      || (f === 'STARTED' && readByBook.has(b.name)));

    const groups = [];
    list.forEach(book => {
      const key = `${book.testament}-${book.genre}`;
      let group = groups[groups.length - 1];
      if (!group || group.key !== key) groups.push(group = { key, testament: book.testament, books: [] });
      group.books.push(book);
    });

    $('canon-books-grid').innerHTML = groups.map(g => `
      <section class="book-group">
        <h3 class="book-group-title">${esc(SECTION_LABELS[g.key])}<span>${g.testament === 'OT' ? 'Old Testament' : 'New Testament'}</span></h3>
        <div class="book-grid">${g.books.map(b => {
          const read = Math.min(readByBook.get(b.name) || 0, b.chapters);
          const current = b.name === this.currentBook;
          // Bilingual names whenever Telugu is in play: the reading language first, the other beneath
          const bilingual = tr === 'tel' || this.preferences.parallel;
          const teluguName = bilingual ? BibleSource.bookName('tel', b) : '';
          const hasTelugu = teluguName && teluguName !== b.name;
          const [primary, primaryLang, secondary, secondaryLang] = tr === 'tel' && hasTelugu
            ? [teluguName, 'te', b.name, 'en']
            : [b.name, 'en', hasTelugu ? teluguName : '', 'te'];
          const readTag = read ? `<span class="book-read">${read === b.chapters ? 'all read' : `${read} read`}</span>` : '';
          return `<button class="book-btn pressable${current ? ' is-current' : ''}" data-pick-book="${b.id}"${current ? ' aria-current="true"' : ''}>
            <span class="book-name" lang="${primaryLang}">${esc(primary)}</span>
            ${secondary ? `<span class="book-alt" lang="${secondaryLang}">${esc(secondary)}</span>` : ''}
            <span class="book-meta">${b.chapters} ${b.chapters === 1 ? 'chapter' : 'chapters'}${readTag}</span>
          </button>`;
        }).join('')}</div>
      </section>`).join('') || `
      <div class="empty-state">
        <span class="empty-icon">${icon('read')}</span>
        <h3 class="empty-title">No books started yet</h3>
        <p class="empty-text">Read a chapter to the end and its book shows up here.</p>
      </div>`;

    document.querySelectorAll('#canon-filters .chip').forEach(chip => {
      const on = chip.dataset.filter === f;
      chip.classList.toggle('is-active', on);
      chip.setAttribute('aria-pressed', String(on));
    });
  }

  openChapterMatrix(book) {
    if (!book) return;
    if (book.chapters === 1) {
      this.loadPassage(book.name, 1);
      return;
    }
    this.pickerBook = book;
    this.pickerScroll = $('picker-body').scrollTop;
    const log = Storage.getReadLog();
    let anyRead = false;
    $('chapter-matrix').innerHTML = Array.from({ length: book.chapters }, (_, i) => i + 1).map(n => {
      const isRead = !!log[`${book.name}|${n}`];
      const isCurrent = book.name === this.currentBook && n === this.currentChapter;
      anyRead = anyRead || isRead;
      const cls = ['ch-btn', 'pressable', isRead && 'is-read', isCurrent && 'is-current'].filter(Boolean).join(' ');
      const label = [`Chapter ${n}`, isRead && 'read', isCurrent && 'now reading'].filter(Boolean).join(', ');
      return `<button class="${cls}" data-pick-chapter="${n}" aria-label="${label}"${isCurrent ? ' aria-current="true"' : ''}>${n}</button>`;
    }).join('');
    $('picker-legend').classList.toggle('hidden', !anyRead);
    this.showPickerPane('chapters', 'forward');
    setText('picker-title', this.preferences.translation === 'tel' ? BibleSource.bookName('tel', book) : book.name);
  }

  showPickerPane(name, dir = 'forward') {
    const sheet = $('picker-sheet');
    sheet.dataset.dir = dir;
    sheet.querySelectorAll('.picker-pane').forEach(p => p.classList.toggle('is-active', p.dataset.pane === name));
    $('picker-back').classList.toggle('hidden', name !== 'chapters');
    const body = $('picker-body');
    if (name === 'books') {
      setText('picker-title', 'Books');
      body.scrollTop = dir === 'back' ? this.pickerScroll || 0 : 0;
    } else {
      body.scrollTop = 0;
      requestAnimationFrame(() => document.querySelector('#chapter-matrix .is-current')?.scrollIntoView({ block: 'center' }));
    }
  }

  // =====================================================================
  // Today
  // =====================================================================
  renderDailyDevotional() {
    const date = new Date();
    date.setDate(date.getDate() + this.dailyOffset);
    const index = (date.getDate() + date.getMonth() * 30) % DAILY_DEVOTIONALS.length;
    const dev = DAILY_DEVOTIONALS[index];
    const passage = OFFLINE_PASSAGES[dev.passageKey];
    this.todayDev = { ...dev, book: passage.book, chapter: passage.chapter, refLabel: enDash(dev.reference) };

    setText('daily-date', date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }));
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const heading = this.dailyOffset === 0 ? greeting : this.dailyOffset === -1 ? 'Yesterday' : date.toLocaleDateString(undefined, { weekday: 'long' });
    setText('daily-heading', heading);
    setText('home-sub', this.dailyOffset === 0 ? 'Here is your verse for today.' : 'The verse, reflection and prayer for this day.');
    $('daily-next').disabled = this.dailyOffset >= 0;
    $('daily-reset').classList.toggle('hidden', this.dailyOffset === 0);

    setText('daily-tag', sentenceCase(dev.theme));
    setText('daily-quote', `“${dev.text}”`);
    $('daily-quote').lang = 'en';
    setText('daily-ref', this.todayDev.refLabel);
    setText('daily-med-text', dev.meditation);
    setText('daily-prayer-text', dev.prayer);
    setText('daily-jump-label', `Read ${this.chapterLabel(passage.book, passage.chapter)}`);
    if (this.preferences.translation === 'tel') this.showTeluguDailyVerse(this.todayDev);
  }

  // The verse of the day in Telugu; the reflection and prayer stay as written
  showTeluguDailyVerse(dev) {
    const range = /:(\d+)(?:-(\d+))?$/.exec(dev.reference);
    const book = findBook(dev.book);
    if (!range || !book) return;
    const from = Number(range[1]);
    const to = Number(range[2] || range[1]);
    BibleSource.fetchChapter('tel', book, dev.chapter)
      .then(verses => {
        if (this.todayDev !== dev || this.preferences.translation !== 'tel') return;
        const text = verses.filter(v => v.num >= from && v.num <= to).map(v => v.text).join(' ');
        if (!text) return;
        dev.teluguText = text;
        setText('daily-quote', `“${text}”`);
        $('daily-quote').lang = 'te';
        setText('daily-ref', `${this.chapterLabel(dev.book, dev.chapter)}:${from}${to !== from ? `–${to}` : ''} · ${dev.refLabel}`);
      })
      .catch(() => { /* the English verse stays */ });
  }

  renderContinueCard() {
    const saved = Storage.getLastRead();
    const last = saved || { book: 'Psalms', chapter: 23 };
    const book = findBook(last.book) || findBook('Psalms');
    const chapter = clamp(Number(last.chapter) || 1, 1, book.chapters);
    const curated = BibleSource.curated(book.id, chapter);
    const label = this.chapterLabel(book.name, chapter);
    const streak = Storage.currentStreak();
    const log = Storage.getReadLog();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const thisWeek = Object.values(log).filter(d => d >= todayKey(weekAgo)).length;
    const total = Object.keys(log).length;

    $('continue-card').innerHTML = `
      <div class="continue-card bezel-core">
        <span class="continue-label">${saved ? 'Continue reading' : 'Start reading'}</span>
        <span class="continue-title">${esc(label)}</span>
        <span class="continue-sub">${esc(saved ? (curated ? curated.title : this.sectionLabel(book)) : `A good first chapter: ${curated ? curated.title : this.sectionLabel(book)}`)}</span>
        <button class="btn btn-primary pressable" data-goto="${esc(book.name)}|${chapter}" aria-label="${saved ? 'Continue reading' : 'Start reading'} ${esc(label)}">${icon('arrow-right')}</button>
        <div class="continue-stats">
          <span>${icon('flame', 'icon-sm')}${streak ? `${streak}-day streak` : 'Finish a chapter to start a streak'}</span>
          ${thisWeek ? `<span>${icon('check', 'icon-sm')}${thisWeek} ${thisWeek === 1 ? 'chapter' : 'chapters'} this week</span>` : ''}
          ${total > thisWeek ? `<span>${icon('read', 'icon-sm')}${total} read in all</span>` : ''}
        </div>
      </div>`;
    this.renderHomeTiles();
  }

  // Live details on the Home quick-action tiles
  renderHomeTiles() {
    const shown = [translationById(this.preferences.translation).short];
    if (this.preferences.parallel) shown.push(this.preferences.translation === 'tel' ? 'KJV' : 'తెలుగు');
    setText('tile-read-sub', `66 books · ${shown.join(' + ')}`);
    const h = Storage.getHighlights().length;
    const b = Storage.getBookmarks().length;
    const n = Storage.getNotes().length;
    const parts = [h && `${h} ${h === 1 ? 'highlight' : 'highlights'}`, b && `${b} ${b === 1 ? 'bookmark' : 'bookmarks'}`, n && `${n} ${n === 1 ? 'note' : 'notes'}`].filter(Boolean);
    setText('tile-library-sub', parts.length ? parts.slice(0, 2).join(' · ') : 'Highlights and notes');
  }

  // Home strip "How are you feeling?": a verse for each feeling, opening the chapter at that verse
  renderPassageStrip() {
    const telugu = this.preferences.translation === 'tel';
    const showTe = telugu || this.preferences.parallel;
    $('passage-strip').innerHTML = MOOD_VERSES.map(m => `
      <button class="mood-card pressable" data-goto="${esc(m.book)}|${m.chapter}|${m.verse}">
        <span class="mood-name" lang="en">${esc(m.label)}</span>
        ${showTe ? `<span class="mood-te" lang="te">${esc(m.labelTe)}</span>` : ''}
        <span class="mood-text" lang="${telugu ? 'te' : 'en'}">“${esc(telugu ? m.textTe : m.text)}”</span>
        <span class="mood-ref"${telugu ? ' lang="te"' : ''}>${esc(this.chapterLabel(m.book, m.chapter))}:${m.verse}</span>
      </button>`).join('');
  }

  renderPlans() {
    $('reading-plans-list').innerHTML = READING_PLANS.map(plan => {
      const done = Storage.getPlanProgress(plan.id);
      const count = plan.readings.filter(r => done.includes(r.day)).length;
      const total = plan.readings.length;
      const nextUp = plan.readings.find(r => !done.includes(r.day));
      return `
        <article class="plan-card bezel"><div class="plan-core bezel-core">
          <header class="plan-head">
            <h3 class="plan-name">${esc(plan.name)}</h3>
            <span class="plan-count">${count === total ? 'Complete' : `${count} of ${total} days`}</span>
          </header>
          <div class="plan-progress" role="progressbar" aria-label="${esc(plan.name)} progress" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${count}">
            <span style="--p:${Math.round((count / total) * 100)}%"></span>
          </div>
          <p class="plan-desc">${esc(plan.description)}</p>
          <ol class="plan-days">${plan.readings.map(r => {
            const isDone = done.includes(r.day);
            const isNext = nextUp && nextUp.day === r.day;
            return `<li class="plan-day${isDone ? ' is-done' : ''}${isNext ? ' is-next' : ''}">
              <button class="plan-check pressable" data-action="plan-check" data-plan="${plan.id}" data-day="${r.day}" aria-pressed="${isDone}" aria-label="Day ${r.day}, ${isDone ? 'read. Mark as unread' : 'mark as read'}">${icon('check', 'icon-xs')}</button>
              <button class="plan-open pressable" data-action="plan-open" data-plan="${plan.id}" data-day="${r.day}">
                <span class="pd-day">${isNext ? 'Next' : `Day ${r.day}`}</span>
                <span class="pd-title">${esc(r.title)}</span>
                <span class="pd-ref">${esc(this.chapterLabel(r.book, r.ch))}</span>
              </button>
            </li>`;
          }).join('')}</ol>
        </div></article>`;
    }).join('');
  }

  // =====================================================================
  // Library
  // =====================================================================
  updateLibraryCounts(data) {
    const d = data || { highlights: Storage.getHighlights(), bookmarks: Storage.getBookmarks(), notes: Storage.getNotes() };
    setText('count-highlights', d.highlights.length);
    setText('count-bookmarks', d.bookmarks.length);
    setText('count-notes', d.notes.length);
    const total = d.highlights.length + d.bookmarks.length + d.notes.length;
    setText('rail-library-count', total ? String(total) : '');
  }

  renderLibrary() {
    const data = { highlights: Storage.getHighlights(), bookmarks: Storage.getBookmarks(), notes: Storage.getNotes() };
    this.updateLibraryCounts(data);
    document.querySelectorAll('#library-tabs .segment').forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.lib === this.libraryTab)));

    const kind = this.libraryTab;
    let items = [...data[kind]].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

    const filter = $('color-filter');
    if (kind === 'highlights') {
      const used = HIGHLIGHT_COLORS.filter(c => data.highlights.some(h => h.color === c));
      if (!used.includes(this.libraryColor)) this.libraryColor = 'all';
      filter.innerHTML = [
        `<button class="color-chip pressable" data-action="hl-filter" data-color="all" aria-pressed="${this.libraryColor === 'all'}">All</button>`,
        ...used.map(c => `<button class="color-chip pressable" data-action="hl-filter" data-color="${c}" aria-pressed="${this.libraryColor === c}"><i class="hl-dot hl-dot-${c}"></i>${COLOR_NAMES[c]}</button>`)
      ].join('');
      filter.classList.toggle('hidden', used.length < 2);
      if (this.libraryColor !== 'all') items = items.filter(h => h.color === this.libraryColor);
    } else {
      filter.classList.add('hidden');
    }

    $('library-list').innerHTML = items.length
      ? `<ul class="lib-items">${items.map(item => this.libraryItemHTML(kind, item)).join('')}</ul>`
      : this.libraryEmptyHTML(kind);
  }

  libraryItemHTML(kind, item) {
    const ref = this.verseLabel(item.book, item.chapter, item.verseNum);
    const date = item.date ? new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';
    const dot = kind === 'highlights' && HIGHLIGHT_COLORS.includes(item.color) ? `<i class="hl-dot hl-dot-${item.color}"></i>` : '';
    const body = kind === 'notes'
      ? `<span class="lib-note">${esc(item.content)}</span><span class="lib-quote">${esc(item.verseText)}</span>`
      : `<span class="lib-text">${esc(item.text)}</span>`;
    const noun = { highlights: 'highlight', bookmarks: 'bookmark', notes: 'note' }[kind];
    return `<li class="lib-item">
      <button class="lib-open pressable" data-goto="${esc(item.book)}|${item.chapter}|${item.verseNum}">
        <span class="lib-ref">${dot}${esc(ref)}${date ? `<span class="lib-date">${esc(date)}</span>` : ''}</span>
        ${body}
      </button>
      <button class="icon-btn lib-remove pressable" data-action="remove-item" data-key="${esc(`${kind}|${item.book}|${item.chapter}|${item.verseNum}`)}" aria-label="Remove ${noun} on ${esc(ref)}">${icon('trash')}</button>
    </li>`;
  }

  libraryEmptyHTML(kind) {
    const copy = {
      highlights: ['highlight', 'No highlights yet', 'Tap a verse while reading, then pick a color.'],
      bookmarks: ['bookmark', 'No bookmarks yet', 'Tap a verse and choose Bookmark to keep your place.'],
      notes: ['note', 'No notes yet', 'Tap a verse and choose Note to write down a thought or a prayer.']
    }[kind];
    return `<div class="empty-state">
      <span class="empty-icon">${icon(copy[0])}</span>
      <h2 class="empty-title">${copy[1]}</h2>
      <p class="empty-text">${copy[2]}</p>
      <button class="btn btn-secondary pressable" data-tab="reader">Open ${esc(this.chapterLabel(this.currentBook, this.currentChapter))}</button>
    </div>`;
  }

  removeLibraryItem(key) {
    const [kind, book, chapter, verseNum] = String(key).split('|');
    const ch = Number(chapter);
    const v = Number(verseNum);
    let restore = null;
    if (kind === 'highlights') {
      const item = Storage.getHighlights().find(h => sameVerse(h, book, ch, v));
      Storage.removeHighlight(book, ch, v);
      restore = () => item && Storage.saveHighlight(item);
    } else if (kind === 'bookmarks') {
      const item = Storage.getBookmarks().find(b => sameVerse(b, book, ch, v));
      Storage.removeBookmark(book, ch, v);
      restore = () => item && Storage.addBookmark(item);
    } else if (kind === 'notes') {
      const item = Storage.getNotes().find(n => sameVerse(n, book, ch, v));
      Storage.removeNote(book, ch, v);
      restore = () => item && Storage.saveNote(item);
    }
    if (!restore) return;
    this.refreshAnnotations();
    const noun = { highlights: 'Highlight', bookmarks: 'Bookmark', notes: 'Note' }[kind];
    pwa.showToast(`${noun} removed`, 'info', {
      actionLabel: 'Undo',
      onAction: () => {
        restore();
        this.refreshAnnotations();
      }
    });
  }

  exportLibrary() {
    const data = Storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    this.downloadBlob(blob, `scriptura-library-${todayKey()}.json`);
    const count = data.highlights.length + data.bookmarks.length + data.notes.length;
    pwa.showToast(`Backup saved with ${count} ${count === 1 ? 'item' : 'items'}`);
  }

  async importLibrary(file) {
    try {
      const data = JSON.parse(await file.text());
      const { added } = Storage.importAll(data);
      this.refreshAnnotations();
      this.renderPlans();
      this.renderContinueCard();
      pwa.showToast(added ? `Restored ${added} ${added === 1 ? 'item' : 'items'} from the backup` : 'Everything in that backup is already here');
    } catch {
      pwa.showToast('That file isn’t a backup from this app.');
    }
  }

  // =====================================================================
  // Search
  // =====================================================================
  updateSearchScope() {
    const tr = this.preferences.translation;
    if (BibleSource.isLocal(tr)) {
      const books = BibleSource.booksOnDevice(tr);
      setText('search-scope', books >= 66 ? `Whole ${translationById(tr).short} Bible` : `${books} of 66 books on this device`);
      return;
    }
    const count = BibleSource.savedList(tr).length;
    setText('search-scope', `${count} ${count === 1 ? 'chapter' : 'chapters'} on this device`);
  }

  // Bundled Bibles: books already saved offline are read into memory so search covers them
  ensureSearchCorpus(tr) {
    if (!BibleSource.isLocal(tr) || this.loadingCorpus) return;
    if (BibleSource.booksOnDevice(tr) < 66 || BibleSource.searchCorpus(tr).length >= 1189) return;
    this.loadingCorpus = true;
    BibleSource.downloadAll(tr)
      .catch(() => { /* search what is in memory */ })
      .finally(() => {
        this.loadingCorpus = false;
        if (this.activeTab === 'search') this.handleSearch($('search-query-input').value);
      });
  }

  handleSearch(query) {
    const raw = String(query || '').trim();
    const q = raw.toLowerCase();
    $('search-clear').classList.toggle('hidden', !raw);
    const container = $('search-results');
    const ref = parseReference(raw);

    if (q.length < 2 && !ref) {
      container.innerHTML = this.savedListHTML();
      return;
    }

    let html = '';
    if (ref) {
      const label = ref.verse ? this.verseLabel(ref.book.name, ref.chapter, ref.verse) : this.chapterLabel(ref.book.name, ref.chapter);
      html += `<button class="goto-result pressable" data-goto="${esc(ref.book.name)}|${ref.chapter}${ref.verse ? `|${ref.verse}` : ''}">
        <span class="goto-copy"><span class="goto-label">Go to</span><span class="goto-ref">${esc(label)}</span></span>
        <span class="btn-orb" aria-hidden="true">${icon('arrow-right')}</span>
      </button>`;
    }

    const tr = this.preferences.translation;
    const matcher = new RegExp(escapeRegExp(q), 'i');
    this.ensureSearchCorpus(tr);
    const corpus = BibleSource.searchCorpus(tr);
    const local = BibleSource.isLocal(tr);
    const onDevice = local ? BibleSource.booksOnDevice(tr) : 0;
    if (local && onDevice < 66) {
      const size = { kjv: '4 MB', tel: '9.8 MB' }[tr];
      html += `<div class="chapter-notice search-scope-note">
        <p><strong>Searching ${onDevice} of 66 books.</strong> Download the whole ${esc(translationById(tr).short)} Bible once (${size}) to search all of it, even offline.</p>
        <button class="btn btn-secondary pressable" data-action="download-bible">${icon('cloud', 'icon-sm')}<span>Download</span></button>
      </div>`;
    } else if (local && this.loadingCorpus) {
      html += '<p class="search-status">Opening the rest of the Bible…</p>';
    }
    const chapterHits = Object.values(OFFLINE_PASSAGES)
      .filter(p => matcher.test(p.title) || matcher.test(p.subtitle))
      .sort((a, b) => canonPosition(a.book, a.chapter) - canonPosition(b.book, b.chapter));
    const verseHits = [];
    corpus.forEach(c => c.verses.forEach(v => {
      if (matcher.test(v.text)) verseHits.push({ book: c.book, chapter: c.chapter, verseNum: v.num, text: v.text });
    }));

    if (chapterHits.length) {
      html += `<section class="result-group">
        <h2 class="result-group-title">Chapters <span>${chapterHits.length}</span></h2>
        <ul>${chapterHits.map(p => `<li><button class="result pressable" data-goto="${esc(p.book)}|${p.chapter}">
          <span class="result-ref">${esc(this.chapterLabel(p.book, p.chapter))}</span>
          <span class="result-title">${this.highlightWord(p.title, q)}</span>
        </button></li>`).join('')}</ul>
      </section>`;
    }
    if (verseHits.length) {
      const shown = verseHits.slice(0, 150);
      html += `<section class="result-group">
        <h2 class="result-group-title">Verses <span>${verseHits.length > shown.length ? `${shown.length} of ${verseHits.length}` : verseHits.length}</span></h2>
        <ul>${shown.map(m => `<li><button class="result pressable" data-goto="${esc(m.book)}|${m.chapter}|${m.verseNum}">
          <span class="result-ref">${esc(this.verseLabel(m.book, m.chapter, m.verseNum))}</span>
          <span class="result-text">${this.highlightWord(m.text, q)}</span>
        </button></li>`).join('')}</ul>
      </section>`;
    }
    if (!chapterHits.length && !verseHits.length && !ref) {
      const scope = local && onDevice >= 66 ? `the whole ${translationById(tr).short} Bible` : `the ${corpus.length} chapters on this device`;
      html += `<div class="search-empty">
        <h2 class="empty-title">No matches for “${esc(raw)}”</h2>
        <p class="empty-text">Search looked through ${esc(scope)}. Try a shorter word, or type a reference such as John 3:16${tr === 'tel' ? ' or యోహాను 3:16' : ''}.</p>
      </div>${this.savedListHTML()}`;
    }
    container.lang = tr === 'tel' ? 'te' : 'en';
    container.innerHTML = html;
  }

  highlightWord(text, query) {
    if (!query) return esc(text);
    const parts = String(text).split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
    return parts.map((part, i) => (i % 2 ? `<mark>${esc(part)}</mark>` : esc(part))).join('');
  }

  savedListHTML() {
    const tr = this.preferences.translation;
    // A bundled Bible has every chapter; suggest the well-loved passages instead of listing 1,189 chapters
    if (BibleSource.isLocal(tr)) {
      const picks = Object.values(OFFLINE_PASSAGES).sort((a, b) => canonPosition(a.book, a.chapter) - canonPosition(b.book, b.chapter));
      return `<section class="result-group">
        <h2 class="result-group-title">Start with</h2>
        <ul class="offline-list">${picks.map(p => `<li><button class="offline-item pressable" data-goto="${esc(p.book)}|${p.chapter}">
          <span class="oi-ref">${esc(this.chapterLabel(p.book, p.chapter))}</span>
          <span class="oi-title" lang="en">${esc(p.title)}</span>
        </button></li>`).join('')}</ul>
      </section>`;
    }
    const list = BibleSource.savedList(tr);
    return `<section class="result-group">
      <h2 class="result-group-title">On this device <span>${list.length}</span></h2>
      <ul class="offline-list">${list.map(p => `<li><button class="offline-item pressable" data-goto="${esc(p.book)}|${p.chapter}">
        <span class="oi-ref">${esc(this.chapterLabel(p.book, p.chapter))}</span>
        <span class="oi-title">${esc(p.title || this.sectionLabel(findBook(p.book)))}</span>
      </button></li>`).join('')}</ul>
    </section>`;
  }

  // =====================================================================
  // Permission to save on this device
  // =====================================================================
  onSaveAttempt(state) {
    if (state === 'unknown') {
      // Ask after the sheet the reader is working in closes, so the question never covers their work
      if (this.openSheet) {
        if (this.openSheet.id !== 'consent-sheet') this.consentPending = true;
      } else {
        this.openConsent();
      }
      return;
    }
    // Said "Not now" earlier in this visit: a quiet reminder, at most every half minute
    if (Date.now() - (this.consentToastAt || 0) < 30000) return;
    this.consentToastAt = Date.now();
    pwa.showToast('Not saved on this device. It lasts until you close the app.', 'info', {
      actionLabel: 'Allow saving',
      onAction: () => this.allowSaving()
    });
  }

  openConsent() {
    this.consentPending = false;
    if (Consent.state() !== 'unknown') return;
    this.consentAnswered = false;
    this.openDrawer('consent-sheet');
  }

  allowSaving() {
    this.consentAnswered = true;
    this.consentPending = false;
    if (!Consent.grant()) {
      pwa.showToast('This browser is blocking storage, so nothing can be saved.');
      return;
    }
    this.closeSheet($('consent-sheet'));
    this.updateDataRow();
    pwa.showToast('Saving on this device. Your highlights, notes and settings will be here next time.', 'success');
  }

  declineSaving() {
    this.consentAnswered = true;
    this.consentPending = false;
    Consent.decline();
    this.closeSheet($('consent-sheet'));
    this.updateDataRow();
  }

  // Settings: allow saving, or (after a second tap) delete everything and stop
  toggleSaving() {
    const btn = $('btn-data-toggle');
    if (!Consent.allowed()) {
      this.allowSaving();
      return;
    }
    if (btn.dataset.confirm !== 'yes') {
      btn.dataset.confirm = 'yes';
      btn.textContent = 'Delete and turn off';
      btn.classList.add('btn-danger');
      return;
    }
    Consent.revoke();
    this.updateDataRow();
    pwa.showToast('Saved data deleted from this device. Nothing new will be saved.');
  }

  updateDataRow() {
    const on = Consent.allowed();
    const earlier = !on && Consent.hasStoredData();
    setText('data-note', on
      ? 'Highlights, bookmarks, notes, settings and your streak are saved in this browser.'
      : earlier
        ? 'Not saving new changes. Data from an earlier visit is still in this browser.'
        : 'Not saving. Changes last until you close the app.');
    const btn = $('btn-data-toggle');
    btn.textContent = on ? 'Turn off' : 'Allow';
    btn.dataset.confirm = '';
    btn.classList.remove('btn-danger');
    $('btn-data-delete').classList.toggle('hidden', !earlier);
  }

  // =====================================================================
  // Sheets
  // =====================================================================
  setupSheets() {
    // Sheets are plain layers the app opens itself rather than <dialog>, so they behave the same everywhere, iOS Safari included
    const layer = $('sheet-layer');
    $('sheet-scrim').addEventListener('click', () => this.closeAllDrawers());
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !this.openSheet) return;
      e.preventDefault();
      this.closeSheet(this.openSheet);
    });
    // Keep keyboard focus inside the open sheet
    layer.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !this.openSheet) return;
      const items = [...this.openSheet.querySelectorAll('button:not([disabled]), input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])')]
        .filter(el => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    layer.querySelectorAll('.sheet').forEach(sheet => {
      sheet.querySelectorAll('.sheet-close-btn').forEach(btn => btn.addEventListener('click', () => this.closeSheet(sheet)));
      this.setupSheetDrag(sheet);
    });
  }

  openDrawer(id) {
    const sheet = $(id);
    if (!sheet) return;
    if (this.openSheet && this.openSheet !== sheet) this.closeSheet(this.openSheet, { immediate: true, restoreFocus: false });
    else if (!this.openSheet) this.lastFocus = document.activeElement;
    const layer = $('sheet-layer');
    layer.hidden = false;
    sheet.hidden = false;
    this.openSheet = sheet;
    // The rest of the page is out of reach while a sheet is open; only what was reachable gets restored
    if (!this.inertWhileSheet) {
      this.inertWhileSheet = [...document.body.children].filter(el => el !== layer && el.id !== 'toast-container' && el.tagName !== 'SCRIPT' && !el.hasAttribute('inert'));
      this.inertWhileSheet.forEach(el => el.setAttribute('inert', ''));
    }
    document.documentElement.classList.add('has-sheet');
    document.body.classList.remove('chrome-hidden');
    sheet.getBoundingClientRect(); // commit the closed position so the opening transition runs
    requestAnimationFrame(() => {
      layer.classList.add('is-open');
      sheet.classList.add('is-open');
      if (!sheet.contains(document.activeElement)) sheet.focus({ preventScroll: true });
    });
  }

  closeSheet(sheet, { immediate = false, restoreFocus = true } = {}) {
    if (!sheet || sheet.hidden) return;
    const layer = $('sheet-layer');
    sheet.classList.remove('is-open', 'is-dragging');
    sheet.style.transform = '';
    if (this.openSheet === sheet) {
      this.openSheet = null;
      document.documentElement.classList.remove('has-sheet');
      layer.classList.remove('is-open');
      this.inertWhileSheet?.forEach(el => el.removeAttribute('inert'));
      this.inertWhileSheet = null;
    }
    const finish = () => {
      if (sheet.classList.contains('is-open')) return; // reopened meanwhile
      sheet.hidden = true;
      if (!this.openSheet) layer.hidden = true;
      if (restoreFocus && !this.openSheet && this.lastFocus?.isConnected) this.lastFocus.focus({ preventScroll: true });
      if (sheet.id === 'consent-sheet' && !this.consentAnswered) this.declineSaving();
      if (this.consentPending && !this.openSheet) setTimeout(() => this.openConsent(), 120);
    };
    if (immediate || reduceMotion()) {
      finish();
      return;
    }
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      sheet.removeEventListener('transitionend', onEnd);
      finish();
    };
    const onEnd = (e) => { if (e.target === sheet) end(); };
    sheet.addEventListener('transitionend', onEnd);
    setTimeout(end, 480);
  }

  closeAllDrawers() {
    if (this.openSheet) this.closeSheet(this.openSheet);
  }

  // Drag the handle down to dismiss a bottom sheet
  setupSheetDrag(sheet) {
    const grip = sheet.querySelector('[data-sheet-grip]');
    if (!grip) return;
    let startY = 0;
    let startTime = 0;
    let dy = 0;
    let pointerId = null;

    grip.addEventListener('pointerdown', (e) => {
      if (!sheetLayout.matches || e.button !== 0 || e.target.closest('button, a, input')) return;
      pointerId = e.pointerId;
      startY = e.clientY;
      startTime = performance.now();
      dy = 0;
      grip.setPointerCapture(pointerId);
      sheet.classList.add('is-dragging');
    });
    grip.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pointerId) return;
      const raw = e.clientY - startY;
      dy = raw > 0 ? raw : raw * 0.2; // resist dragging upwards
      sheet.style.transform = `translateY(${dy}px)`;
    });
    const end = (e) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      const velocity = dy / Math.max(1, performance.now() - startTime);
      sheet.classList.remove('is-dragging');
      if (dy > 110 || (dy > 24 && velocity > 0.55)) this.closeSheet(sheet);
      else sheet.style.transform = '';
    };
    grip.addEventListener('pointerup', end);
    grip.addEventListener('pointercancel', end);
  }
}

window.app = new ScripturaApp();
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => window.app.init());
} else {
  window.app.init();
}
