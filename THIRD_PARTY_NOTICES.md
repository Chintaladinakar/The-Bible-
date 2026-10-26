# Third-party notices

The Bible includes the works below. Each keeps its own copyright and licence. The same list is shown to readers on the [Licenses & credits](licenses.html) page.

© 2026 DC for the app's design, code and original writing (daily reflections, prayers, reading plans and the "How are you feeling?" selections).

## Bible texts

**King James Version** (`bibles/kjv/`)
- Text: public domain in most of the world. In the United Kingdom, rights in the Authorized Version are vested in the Crown.
- Data files: [aruljohn/Bible-kjv](https://github.com/aruljohn/Bible-kjv), © 2019 Arul John, MIT License. Full text: `bibles/kjv/LICENSE`.
- Changes: converted to one compact file per book.

**Telugu Bible** (`bibles/tel/`)
- [aruljohn/Bible-telugu](https://github.com/aruljohn/Bible-telugu), © 2021 Arul John, MIT License. Full text: `bibles/tel/LICENSE`.
- Changes: converted to one compact file per book; matched to the KJV book list (Song of Songs as Song of Solomon); one empty verse (2 Chronicles 35:27) skipped; the Deuteronomy book name corrected.

**World English Bible, American Standard Version (1901), Bible in Basic English**
- Public domain, as listed by [bible-api.com](https://bible-api.com/data). Not bundled; loaded from bible-api.com only when a reader chooses one of them.

## Cross references (`bibles/xref/`)

- [josephilipraja/bible-cross-reference-json](https://github.com/josephilipraja/bible-cross-reference-json), GNU General Public License version 2. Full text: `bibles/xref/LICENSE`.
- That collection credits the MetaV project by SoulLiberty, now [Theographic Bible Metadata](https://github.com/robertrouse/theographic-bible-metadata), Creative Commons Attribution-ShareAlike 4.0.
- Changes: converted from 32 numbered files into one file per book with KJV book codes; runs of consecutive verses merged into ranges; 45 references to verses that do not exist removed. The modified data is the `bibles/xref/*.json` files in this repository.

## Fonts (`fonts/`)

All under the SIL Open Font License 1.1 (texts in `fonts/licenses/`), served as subsets containing only the characters the app uses. None declares a Reserved Font Name.

| Font | Copyright | Source |
| --- | --- | --- |
| Fraunces | 2018 The Fraunces Project Authors | https://github.com/undercasetype/Fraunces |
| Literata | 2017 The Literata Project Authors | https://github.com/googlefonts/literata |
| Geist | 2024 The Geist Project Authors | https://github.com/vercel/geist-font |
| Noto Serif Telugu | 2022 The Noto Project Authors | https://github.com/notofonts/telugu |

## Services

- **bible-api.com**: free public API for the WEB, ASV and BBE chapters; no key or account.
- **Vercel**: hosts the website.
