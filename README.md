# The Bible

The Bible is a Bible reader that works offline. It opens on a home dashboard with the verse of the day, and reads the King James Version and the Telugu Bible side by side. Tap any verse to see related verses (cross references) with their text. Highlights, bookmarks, notes and reading plans stay on your device.

Plain HTML, CSS and JavaScript, with no build step.

## Run it locally

```
node serve.js
```

Then open http://127.0.0.1:8080.

## What's inside

- `index.html`, `css/`, `js/`: the app
- `bibles/kjv/`, `bibles/tel/`: one JSON file per book, loaded when a book is opened
- `bibles/xref/`: cross references, one JSON file per book
- `fonts/`: self-hosted fonts (SIL Open Font License, see `fonts/licenses/`)
- `sw.js`, `manifest.webmanifest`: offline support and installing as an app
- `privacy.html`, `terms.html`, `licenses.html`: policy and licence pages

## Sources and licences

The full list, with what was changed in each, is on the in-app [Licenses & credits](licenses.html) page and in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Privacy: [privacy.html](privacy.html). Terms: [terms.html](terms.html).

- King James Version: public domain (Crown copyright in the UK); data files from aruljohn/Bible-kjv, MIT (see `bibles/kjv/LICENSE`)
- Telugu Bible: from aruljohn/Bible-telugu, MIT (see `bibles/tel/LICENSE`)
- WEB, ASV and BBE: public domain, loaded from bible-api.com when a reader chooses them
- Cross references: josephilipraja/bible-cross-reference-json, GPL-2.0 (see `bibles/xref/LICENSE`); its source, SoulLiberty's MetaV (now Theographic Bible Metadata), is CC BY-SA 4.0
- Fonts: Fraunces, Literata, Geist and Noto Serif Telugu, SIL Open Font License 1.1

© 2026 DC. App design, code and original writing; third-party works keep their own licences.
