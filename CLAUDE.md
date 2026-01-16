# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RSVP Speed Reader** - A web-based speed reading application using Rapid Serial Visual Presentation (RSVP) technique with Optimal Recognition Point (ORP) highlighting.

**Live Site:** https://vlelyavin.github.io/RSVP-Speed-Reader/

**Chrome Extension:** Available in `extension/` directory - minimal extension for reading selected text on any webpage

## Development Commands

```bash
# Development server with hot reload (no obfuscation)
npm run dev

# Production build (with heavy obfuscation)
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages (manual - rarely needed)
npm run deploy
```

## Build System Architecture

### Source → Build Pipeline

- **Source root:** `src/` directory
- **Build output:** `dist/` directory
- **Base path:** `/RSVP-Speed-Reader/` (configured for GitHub Pages)
- **Build process:** Vite → Terser minification → JavaScript obfuscator → dist/

### Heavy Obfuscation

The production build uses aggressive JavaScript obfuscation for code protection:
- Control flow flattening (75% threshold)
- Dead code injection (40% threshold)
- Base64 string encoding
- Self-defending code
- All console logs removed
- Source maps disabled

**Important:** The obfuscation is intentional. Do not modify `vite.config.js` obfuscation settings without explicit user request.

## Code Architecture

### Modular ES6 Structure

The application was migrated from a monolithic 2,187-line HTML file to a modular architecture:

```
src/
├── index.html          # Minimal HTML shell (167 lines)
├── styles/             # Modular CSS (5 files)
│   ├── main.css
│   ├── sidebars.css
│   ├── welcome-popup.css
│   ├── reading-interface.css
│   └── responsive.css
└── js/                 # Modular JavaScript (7 files)
    ├── state.js        # State management, localStorage
    ├── rsvp.js         # ORP calculation, word display
    ├── pdf-processor.js # PDF.js integration, text cleaning
    ├── history.js      # Document history CRUD
    ├── settings.js     # UI settings, sliders
    ├── ui.js           # Popups, sidebars, progress bar
    └── main.js         # Entry point, initialization
```

### Data Flow

1. **state.js** - Single source of truth for app state
   - `state` object with words, currentIndex, settings
   - localStorage persistence (settings, drafts)

2. **main.js** - Orchestrates all modules
   - Imports and wires together all modules
   - Global window functions for inline HTML onclick handlers
   - Event listeners and initialization

3. **Key State Interactions:**
   - Text input → `parseText()` → `state.words`
   - Reading → `showNextWord()` → updates `state.currentIndex`
   - Auto-save → `saveToHistory()` every 3 seconds while playing
   - Draft persistence → auto-saves 500ms after typing stops

### Critical Features

**Auto-Save System (added recently):**
- Draft persistence: Auto-saves title + text to localStorage (500ms debounce)
- Reading progress: Auto-saves every 3 seconds during playback
- Page unload: Saves on beforeunload event
- Decimal precision: Progress tracked to 2 decimal places (e.g., 0.17%)

**ORP (Optimal Recognition Point):**
- Calculated in `rsvp.js:calculateORP()`
- Algorithm: word length → 0-3 letters=0, 4-5=1, 6-9=2, 10+=3
- Highlighted letter positioned at vertical center using text measurement

**PDF Processing:**
- Uses PDF.js library (loaded dynamically from CDN)
- `cleanPDFText()` removes artifacts: box characters, control chars, zero-width spaces
- Sets document title from filename automatically

## Deployment

### Automatic Deployment (GitHub Actions)

Every push to `main` branch triggers:
1. `.github/workflows/deploy.yml` workflow
2. Builds with `npm run build`
3. Deploys to GitHub Pages automatically

**Important:** GitHub Pages must be configured to use "GitHub Actions" as the source (not "Deploy from a branch").

### Manual Deployment (if needed)

```bash
npm run build
npm run deploy  # Pushes dist/ to gh-pages branch
```

## localStorage Schema

```javascript
// Settings
rsvpSettings: {
  fontSize: 72,           // 24-120 desktop, 10-48 mobile
  speed: 300,             // WPM
  punctuationPause: 150,  // milliseconds
  fontFamily: string
}

// Current draft (auto-saved)
rsvpDraft: {
  title: string,
  text: string,
  savedAt: ISO timestamp
}

// Document history
rsvpHistory: [{
  id: timestamp,
  title: string,
  text: string,
  wordCount: number,
  progress: number,       // Current word index
  savedAt: string         // Localized datetime
}]

// First-time user flag
rsvpHasSeenWelcome: "true"
```

## Mobile vs Desktop

Font size slider automatically adjusts range based on viewport:
- **Desktop:** 24-120px
- **Mobile:** 10-48px (≈ desktop / 2.5)
- Conversion happens automatically on window resize
- Settings persist across device types

## Important Constraints

1. **No React/Next.js:** Pure vanilla JavaScript with ES6 modules
2. **No backend:** Everything runs client-side
3. **localStorage only:** All persistence is local
4. **GitHub Pages:** Static hosting, base path must be `/RSVP-Speed-Reader/`
5. **Code protection:** Heavy obfuscation is intentional, not a bug
6. **PDF.js:** Loaded from CDN (https://cdnjs.cloudflare.com)

## Making Changes

### Adding Features

- New CSS → Add to appropriate file in `src/styles/`
- New JavaScript → Import in `main.js` or create new module
- State changes → Update `state.js` first
- Rebuild required → Run `npm run build` before testing production

### Testing Locally

```bash
npm run dev               # Test in development (no obfuscation)
npm run build             # Build production version
npm run preview           # Test built version locally
```

### Common Pitfalls

1. **Forgetting to import in main.js** - New functions must be imported and called
2. **Direct DOM manipulation** - Use existing patterns (no jQuery, no frameworks)
3. **Hardcoded paths** - Use relative paths that work with `/RSVP-Speed-Reader/` base
4. **localStorage overwrites** - Always read-modify-write, never just write
5. **Auto-save conflicts** - Be aware of the 3-second interval when modifying history

## Code Style Patterns

- **Event listeners:** Always in `main.js` or setup functions
- **Global functions:** Only for HTML onclick handlers (`window.loadFromHistory`, etc.)
- **State mutations:** Always through state object, never direct DOM
- **Error handling:** Minimal - simple alerts for user-facing errors
- **Comments:** Present tense, explain "why" not "what"

## Chrome Extension

A minimal Chrome extension version is available in the `extension/` directory.

### Extension Architecture

```
extension/
├── manifest.json          # Manifest v3 configuration
├── background.js          # Context menu handler
├── content-script.js      # Overlay injection & RSVP logic
├── rsvp-core.js          # Pure RSVP functions (extracted from src/js/rsvp.js)
└── styles/
    ├── overlay.css       # Fullscreen overlay styles
    └── reset.css         # Style isolation
```

### Key Differences from Web App

**Simplified scope:**
- ✅ Context menu: "Read with RSVP" on selected text
- ✅ Fullscreen overlay with RSVP player
- ✅ Keyboard controls (Space, arrows, Esc, R)
- ✅ Inline settings (speed, font size)
- ❌ No localStorage persistence
- ❌ No document history
- ❌ No PDF support
- ❌ No file uploads

**Technical details:**
- Uses Shadow DOM for style isolation from host pages
- Minimal permissions: `contextMenus`, `activeTab` only
- ~70% code reuse from web app (RSVP core functions unchanged)
- Pure vanilla JS, ES6 modules, no frameworks
- All state in-memory only

### Extension Development

To load and test:
1. Go to `chrome://extensions/`
2. Enable Developer mode
3. Load unpacked → select `extension/` directory
4. Test on any webpage by selecting text → right-click → "Read with RSVP"

See `extension/README.md` and `extension/INSTALLATION.md` for details.
