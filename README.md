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
- `fonts/`: self-hosted fonts (SIL Open Font License, see `fonts/licenses/`)
- `sw.js`, `manifest.webmanifest`: offline support and installing as an app

## Sources

- King James Version: public domain, from aruljohn/Bible-kjv (see `bibles/kjv/LICENSE`)
- Telugu Bible: from aruljohn/Bible-telugu, MIT (see `bibles/tel/LICENSE`)
- WEB, ASV and BBE chapters load from bible-api.com when online
