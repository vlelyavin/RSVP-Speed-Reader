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
└── js/                 # Modular JavaScript (8 files)
    ├── state.js        # State management, localStorage
    ├── rsvp.js         # ORP calculation, word display
    ├── pdf-processor.js # PDF.js integration, text cleaning
    ├── epub-processor.js # JSZip integration, EPUB text extraction
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

**EPUB Processing:**
- Uses JSZip library (loaded dynamically from CDN)
- Parses EPUB structure: container.xml → OPF → spine (reading order)
- Extracts text from XHTML files in correct order
- `cleanEPUBText()` removes HTML artifacts and excessive whitespace

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
7. **JSZip:** Loaded from CDN for EPUB processing
8. **Extension:** Manifest V3, Shadow DOM for isolation

## Making Changes

### Adding Features

- New CSS → Add to appropriate file in `src/styles/`
- New JavaScript → Import in `main.js` or create new module
- State changes → Update `state.js` first
- Rebuild required → Run `npm run build` before testing production

### Extension Changes

- Overlay HTML → Modify `getOverlayHTML()` in `content-script.js`
- Overlay styles → Update `extension/styles/overlay.css`
- X integration → Modify `extension/x-integration.js`
- Content script → Update `extension/content-script.js`

### Testing Locally

```bash
# Web app
npm run dev               # Test in development (no obfuscation)
npm run build             # Build production version
npm run preview           # Test built version locally

# Extension
# Load unpacked extension from extension/ folder in Chrome
chrome://extensions/ → Enable Developer Mode → Load unpacked
```

### Common Pitfalls

1. **Forgetting to import in main.js** - New functions must be imported and called
2. **Direct DOM manipulation** - Use existing patterns (no jQuery, no frameworks)
3. **Hardcoded paths** - Use relative paths that work with `/RSVP-Speed-Reader/` base
4. **localStorage overwrites** - Always read-modify-write, never just write
5. **Auto-save conflicts** - Be aware of the 3-second interval when modifying history
6. **Extension isolation** - Remember Shadow DOM isolation, styles won't leak
7. **X menu timing** - Menu detection requires delays for DOM rendering
8. **Focus management** - Overlay needs explicit focus for keyboard events

## Code Style Patterns

- **Event listeners:** Always in `main.js` or setup functions
- **Global functions:** Only for HTML onclick handlers (`window.loadFromHistory`, etc.)
- **State mutations:** Always through state object, never direct DOM
- **Error handling:** Minimal - simple alerts for user-facing errors
- **Comments:** Present tense, explain "why" not "what"
- **Extension events:** Use custom events for cross-script communication

## Chrome Extension

### Architecture

The extension mirrors the web app functionality with:
- **Context menu integration:** Right-click selected text → "Read with RSVP"
- **X (Twitter) integration:** Adds "Speed read" button to post/article menus
- **Shadow DOM:** Isolates overlay styles from host page
- **Event-based communication:** Custom events for X integration

```
extension/
├── manifest.json           # Manifest V3 configuration
├── background.js           # Service worker for context menu
├── content-script.js       # Main overlay injection script
├── x-integration.js        # X (Twitter) menu integration
└── styles/
    ├── reset.css          # CSS reset for content scripts
    └── overlay.css        # Overlay and reading interface styles
```

### X Integration Details

**Menu Detection:**
- MutationObserver watches for `[role="menu"]` elements
- Also detects X's dynamic menu structure via `r-kemksi` class
- Processes menus with 50ms delay for rendering

**Menu Item Structure:**
- Matches X's native menu item styling
- Theme-aware colors (light/dark mode detection)
- Eye icon SVG with proper sizing (18.75px)
- Hover effects matching X's UX

**Text Extraction (4-tier strategy):**
1. Detailed tweet view: `article[data-testid="tweet"][tabindex="-1"]`
2. Walk up from menu: Find parent `<article>` element
3. All articles: Query all and use first with substantial text (>50 chars)
4. Lang elements: Fallback to `[lang][dir="auto"]` elements

**Key Implementation Points:**
- WeakSet tracks processed menus to avoid duplicates
- Theme detection via `window.getComputedStyle(document.body).backgroundColor`
- Custom event `rsvpStartReading` dispatched to content script
- Robust insertion with multiple fallback strategies

### Extension Overlay Features

**Sidebar Controls:**
- Button in top-left corner opens settings sidebar
- No hover-to-open behavior (removed for better UX)
- Close button in sidebar header
- Overlay backdrop darkens page when sidebar open

**Keyboard Shortcuts:**
- Space: Start/pause reading
- R: Reset to beginning
- ← →: Step through words
- ↑ ↓: Adjust speed
- Esc: Close overlay

**Focus Management:**
- Overlay container made focusable with `tabindex="-1"`
- Auto-focused on injection for immediate keyboard input
- No need to click overlay first

### Extension Development

To load and test:
1. Go to `chrome://extensions/`
2. Enable Developer mode
3. Load unpacked → select `extension/` directory
4. Test context menu: Select text → right-click → "Read with RSVP"
5. Test X integration: Visit X.com → Click three-dot menu on any post → "Speed read"

## Recent Implementation Notes

### X Integration Menu Item Fix (2026-01-16)
- Fixed text visibility by adding proper theme-aware text color
- Simplified HTML structure for proper horizontal layout
- Added explicit `minHeight: 44px` and cursor styling
- Hover effects now work correctly with proper background color transitions

### Sidebar UI Updates (2026-01-16)
- Added settings button in top-left corner (sliders icon)
- Removed hover-to-open sidebar behavior
- Added sidebar header with title and close button
- Moved slider values to RIGHT of sliders (was on left)
- Added "Esc" key hint to both sidebar and bottom controls

### Focus Management Fix (2026-01-16)
- Made overlay container focusable with `tabindex="-1"`
- Auto-focus overlay on injection for immediate keyboard input
- Resolves issue where Space key didn't work until clicking overlay

### Menu Detection Enhancement (2026-01-16)
- Added detection for X's dynamic menu structure (`r-kemksi` class)
- Improved insertion logic with better parent node handling
- Multiple fallback strategies for robust menu item positioning

## File References

### Web App Core Files
- [src/index.html](src/index.html) - Main HTML structure
- [src/js/main.js](src/js/main.js) - Entry point and orchestration
- [src/js/state.js](src/js/state.js) - State management
- [src/js/rsvp.js](src/js/rsvp.js) - ORP calculation and word display
- [src/js/pdf-processor.js](src/js/pdf-processor.js) - PDF text extraction
- [src/js/epub-processor.js](src/js/epub-processor.js) - EPUB text extraction

### Extension Core Files
- [extension/manifest.json](extension/manifest.json) - Extension configuration
- [extension/content-script.js](extension/content-script.js) - Overlay injection
- [extension/x-integration.js](extension/x-integration.js) - X menu integration
- [extension/background.js](extension/background.js) - Context menu service worker
- [extension/styles/overlay.css](extension/styles/overlay.css) - Overlay styles
