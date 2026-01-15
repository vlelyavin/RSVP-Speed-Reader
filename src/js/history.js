/* RSVP Speed Reader - History Management */

import { state } from "./state.js";
import { parseText, escapeHtml } from "./rsvp.js";

// Get history from localStorage
export function getHistory() {
  const saved = localStorage.getItem("rsvpHistory");
  return saved ? JSON.parse(saved) : [];
}

// Save history  to localStorage and render
export function saveHistory(history, historyList, historyEmpty) {
  localStorage.setItem("rsvpHistory", JSON.stringify(history));
  renderHistory(historyList, historyEmpty);
}

// Save current document to history
export function saveToHistory(textInput, docTitleInput, skipDuplicateCheck = false) {
  const text = textInput.value.trim();
  const title = docTitleInput.value.trim() || "Untitled Document";
  if (!text) return true;

  const history = getHistory();

  // Check if we're updating existing doc by ID
  let existingIndex = -1;
  if (state.currentDocId) {
    existingIndex = history.findIndex((doc) => doc.id === state.currentDocId);
  }

  const docId = existingIndex >= 0 ? history[existingIndex].id : Date.now();
  state.currentDocId = docId;

  const doc = {
    id: docId,
    title: title,
    text: text,
    wordCount: parseText(text).length,
    progress: state.currentIndex,
    savedAt: new Date().toLocaleString(),
  };

  if (existingIndex >= 0) {
    history[existingIndex] = doc;
  } else {
    history.unshift(doc);
  }

  // Note: This doesn't call saveHistory() to avoid circular dependency
  // Caller must call renderHistory() separately
  localStorage.setItem("rsvpHistory", JSON.stringify(history));
  return true;
}

// Render history list
export function renderHistory(historyList, historyEmpty) {
  const history = getHistory();

  if (history.length === 0) {
    historyEmpty.style.display = "block";
    historyList.innerHTML = "";
    return;
  }

  historyEmpty.style.display = "none";
  historyList.innerHTML = history
    .map((doc) => {
      const progressPercent =
        doc.progress && doc.wordCount ? ((doc.progress / doc.wordCount) * 100).toFixed(2) : "0.00";
      const progressForCircle = parseFloat(progressPercent);
      return `
        <li class="history-item" data-id="${doc.id}">
          <div class="history-item-info">
            <span class="history-item-title">${escapeHtml(doc.title)}</span>
            <span class="history-item-meta">
              <div class="progress-circle" style="background: conic-gradient(#e63946 ${
                progressForCircle * 3.6
              }deg, #222 0deg);"></div>
              ${progressPercent}% | ${doc.wordCount} words | ${doc.savedAt}
            </span>
          </div>
          <div class="history-item-actions">
            <button onclick="window.loadFromHistory(${doc.id})">Load</button>
            <button onclick="window.resetFromHistory(${doc.id})">Reset</button>
            <button class="delete" onclick="window.deleteFromHistory(${doc.id})">Delete</button>
          </div>
        </li>
      `;
    })
    .join("");
}

// Load document from history
export function loadFromHistory(id, textInput, docTitleInput, clearDraftCallback) {
  const history = getHistory();
  const doc = history.find((d) => d.id === id);
  if (doc) {
    textInput.value = doc.text;
    docTitleInput.value = doc.title;
    state.currentDocId = doc.id;
    state.currentIndex = doc.progress || 0;
    state.words = parseText(doc.text);
    // Clear draft when loading from history
    if (clearDraftCallback) {
      clearDraftCallback();
    }
    // Scroll to top of page
    window.scrollTo(0, 0);
  }
}

// Reset progress for a document
export function resetFromHistory(id, historyList, historyEmpty) {
  const history = getHistory();
  const docIndex = history.findIndex((d) => d.id === id);

  if (docIndex !== -1) {
    history[docIndex].progress = 0;
    saveHistory(history, historyList, historyEmpty);
  }
}

// Delete document from history
export function deleteFromHistory(id, historyList, historyEmpty) {
  const history = getHistory().filter((d) => d.id !== id);
  saveHistory(history, historyList, historyEmpty);
}

// Clear all history
export function clearHistory(historyList, historyEmpty) {
  if (confirm("Are you sure you want to clear all saved documents?")) {
    localStorage.removeItem("rsvpHistory");
    renderHistory(historyList, historyEmpty);
  }
}
