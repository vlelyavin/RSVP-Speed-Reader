/* RSVP Speed Reader - State Management */

// Application state
export const state = {
  words: [],
  currentIndex: 0,
  isPlaying: false,
  timeoutId: null,
  currentDocId: null,
  settings: {
    fontSize: 72, // Will be adjusted based on device type in loadSettings
    speed: 300,
    punctuationPause: 150,
    fontFamily: "'Times New Roman', Times, Georgia, serif",
  },
};

// Load settings from localStorage
export function loadSettings() {
  const saved = localStorage.getItem("rsvpSettings");
  if (saved) {
    const parsed = JSON.parse(saved);
    state.settings = { ...state.settings, ...parsed };
  }
  return state.settings;
}

// Save settings to localStorage
export function saveSettings() {
  localStorage.setItem("rsvpSettings", JSON.stringify(state.settings));
}

// Save current draft (title and text) to localStorage
export function saveDraft(title, text) {
  const draft = {
    title: title || "",
    text: text || "",
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem("rsvpDraft", JSON.stringify(draft));
}

// Load current draft from localStorage
export function loadDraft() {
  const saved = localStorage.getItem("rsvpDraft");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Error loading draft:", e);
      return null;
    }
  }
  return null;
}

// Clear draft from localStorage
export function clearDraft() {
  localStorage.removeItem("rsvpDraft");
}
