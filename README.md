# RSVP Speed Reader

a web-based speed reading app using rapid serial visual presentation (RSVP) with optimal recognition point (ORP) highlighting. also available as a chrome extension.

**[try it live](https://vlelyavin.github.io/RSVP-Speed-Reader/)**

## what it does

- paste or type any text and read it word-by-word at your chosen speed
- ORP highlighting - the optimal letter in each word is highlighted so your eye locks on faster
- adjustable speed (WPM), font size, and punctuation pause
- PDF and EPUB import - drag and drop or pick a file
- reading history with progress tracking and auto-save
- works fully offline - no backend, no accounts, everything stays in your browser

## chrome extension

- select any text on a page → right-click → "read with RSVP"
- integrates into X (twitter) post menus - "speed read" option on any tweet
- keyboard shortcuts: space (play/pause), arrows (step/speed), esc (close)

### install extension

1. download and unzip `extension.zip` from this repo
2. go to `chrome://extensions/` → enable developer mode
3. "load unpacked" → select the unzipped folder

## development

```bash
npm install
npm run dev      # dev server with hot reload
npm run build    # production build (with obfuscation)
npm run preview  # preview production build
```

## tech

- vanilla javascript, ES6 modules, no frameworks
- vite for bundling
- PDF.js and JSZip loaded from CDN
- localStorage for all persistence
- shadow DOM isolation in the extension
- deployed to github pages via actions on push to main

## how ORP works

the app calculates the optimal recognition point for each word - the letter your eye naturally fixates on first. short words (1-3 letters) highlight the first letter, longer words shift the highlight further in. the highlighted letter is positioned at the vertical center of the display so your eye stays still while words flash by.
