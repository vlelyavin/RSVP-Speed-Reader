/* RSVP Speed Reader - Main Entry Point */

import { state, loadSettings, saveDraft, loadDraft, clearDraft } from "./state.js";
import { displayWord, parseText, calculateDelay } from "./rsvp.js";
import { processPDF } from "./pdf-processor.js";
import {
  renderHistory,
  saveToHistory,
  loadFromHistory,
  resetFromHistory,
  deleteFromHistory,
  clearHistory,
} from "./history.js";
import {
  updateFontSizeSliderRange,
  updateSliderValuePosition,
  adjustSpeed,
  setupSettingsListeners,
} from "./settings.js";
import {
  showWelcomePopup,
  setupWelcomePopup,
  setupSidebarOverlay,
  updateProgress,
  setupProgressBar,
  setupDragAndDrop,
} from "./ui.js";

// DOM elements
const inputInterface = document.getElementById("inputInterface");
const readingInterface = document.getElementById("readingInterface");
const guideLines = document.querySelector(".guide-lines");
const textInput = document.getElementById("textInput");
const wordDisplay = document.getElementById("wordDisplay");
const startButton = document.getElementById("startBtn");
const resetButton = document.getElementById("resetButton");
const pauseButton = document.getElementById("pauseButton");
const stopButton = document.getElementById("stopButton");
const progressPercentage = document.getElementById("progressPercentage");
const progressBarWrapper = document.getElementById("progressBarWrapper");
const progressBarFill = document.getElementById("progressBarFill");

// Input panel elements
const docTitleInput = document.getElementById("docTitle");
const pdfInput = document.getElementById("pdfInput");
const pdfStatus = document.getElementById("pdfStatus");
const resetBtn = document.getElementById("resetBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const historyEmpty = document.getElementById("historyEmpty");
const historyList = document.getElementById("historyList");
const dropOverlay = document.getElementById("dropOverlay");

// Settings elements
const fontSizeSlider = document.getElementById("fontSizeSlider");
const fontSizeValue = document.getElementById("fontSizeValue");
const speedSlider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");
const punctuationSlider = document.getElementById("punctuationSlider");
const punctuationValue = document.getElementById("punctuationValue");

// Sidebar elements
const sidebarLeft = document.getElementById("sidebarLeft");
const sidebarRight = document.getElementById("sidebarRight");
const sidebarOverlay = document.getElementById("sidebarOverlay");

// Welcome popup elements
const welcomePopupOverlay = document.getElementById("welcomePopupOverlay");
const welcomePopupClose = document.getElementById("welcomePopupClose");
const welcomePopupOk = document.getElementById("welcomePopupOk");

// Auto-save interval for reading progress
let progressAutoSaveInterval = null;

// Show next word
function showNextWord() {
  // Check if we've finished all words
  if (state.currentIndex >= state.words.length) {
    // Show alert
    alert("Playback has been finished");
    // Add 500ms delay after playback finishes before closing
    stopReading();
    return;
  }

  const word = state.words[state.currentIndex];
  displayWord(word, wordDisplay, guideLines);
  updateProgress(progressBarFill, progressPercentage);

  const delay = calculateDelay(word);
  state.currentIndex++;

  // Schedule next word if there are more words
  if (state.isPlaying && state.currentIndex < state.words.length) {
    state.timeoutId = setTimeout(showNextWord, delay);
  } else if (state.currentIndex >= state.words.length && state.isPlaying) {
    // All words displayed, wait for the last word's delay, then show alert
    setTimeout(() => {
      alert("playback has been finished");
      // Add 500ms delay after playback finishes before closing
      setTimeout(() => {
        stopReading();
      }, 500);
    }, delay);
  }
}

// Start reading
function startReading() {
  const text = textInput.value.trim();
  if (!text) {
    alert("Please enter some text to read.");
    return;
  }

  // Always parse words from current text
  const newWords = parseText(text);

  // If words changed, reset index
  if (state.words.length !== newWords.length || state.words.join(" ") !== newWords.join(" ")) {
    state.words = newWords;
    if (state.currentIndex >= state.words.length) {
      state.currentIndex = 0;
    }
  } else if (state.words.length === 0) {
    state.words = newWords;
    state.currentIndex = 0;
  }

  // Save to history when starting
  saveToHistory(textInput, docTitleInput);
  renderHistory(historyList, historyEmpty);

  state.isPlaying = true;

  inputInterface.classList.add("hidden");
  readingInterface.classList.remove("closing");
  readingInterface.classList.add("active");

  // Start auto-saving progress every 3 seconds during reading
  if (progressAutoSaveInterval) {
    clearInterval(progressAutoSaveInterval);
  }
  progressAutoSaveInterval = setInterval(() => {
    if (state.isPlaying && state.currentDocId) {
      saveToHistory(textInput, docTitleInput, true);
      renderHistory(historyList, historyEmpty);
    }
  }, 3000); // Auto-save every 3 seconds

  showNextWord();
}

// Pause/Resume reading
function togglePause() {
  state.isPlaying = !state.isPlaying;
  pauseButton.textContent = state.isPlaying ? "Pause" : "Resume";

  if (state.isPlaying) {
    showNextWord();
  } else {
    clearTimeout(state.timeoutId);
  }
}

// Stop reading
function stopReading() {
  // Save progress before stopping
  saveToHistory(textInput, docTitleInput, true);
  renderHistory(historyList, historyEmpty);

  state.isPlaying = false;
  clearTimeout(state.timeoutId);

  // Clear auto-save interval
  if (progressAutoSaveInterval) {
    clearInterval(progressAutoSaveInterval);
    progressAutoSaveInterval = null;
  }

  pauseButton.textContent = "Pause";

  // Animate closing
  readingInterface.classList.add("closing");
  readingInterface.classList.remove("active");

  // Wait for animation to complete before showing input interface
  setTimeout(() => {
    readingInterface.classList.remove("closing");
    inputInterface.classList.remove("hidden");
  }, 300);

  // Reset state for next reading session
  state.currentDocId = null;
  state.words = [];
  state.currentIndex = 0;
}

// Reset input - clears title and textarea
function resetInput() {
  state.currentIndex = 0;
  state.isPlaying = false;
  state.words = [];
  state.currentDocId = null;
  clearTimeout(state.timeoutId);
  textInput.value = "";
  docTitleInput.value = "";
  pdfStatus.textContent = "No PDF loaded";
  clearDraft(); // Clear saved draft
  if (readingInterface.classList.contains("active")) {
    stopReading();
  }
}

// Handle PDF upload
async function handlePDFUpload(e) {
  const file = e.target.files[0];
  if (file) {
    await processPDF(file, textInput, docTitleInput, pdfStatus);
    // Save draft after PDF is loaded
    saveDraft(docTitleInput.value, textInput.value);
  }
}

// Step to previous word (pauses playback)
function stepPrevWord() {
  if (state.words.length === 0) return;

  // Pause if playing
  if (state.isPlaying) {
    state.isPlaying = false;
    clearTimeout(state.timeoutId);
    pauseButton.textContent = "Resume";
  }

  // Move to previous word
  if (state.currentIndex > 0) {
    state.currentIndex--;
    displayWord(state.words[state.currentIndex], wordDisplay, guideLines);
    updateProgress(progressBarFill, progressPercentage);
  }
}

// Step to next word (pauses playback)
function stepNextWord() {
  if (state.words.length === 0) return;

  // Pause if playing
  if (state.isPlaying) {
    state.isPlaying = false;
    clearTimeout(state.timeoutId);
    pauseButton.textContent = "Resume";
  }

  // Move to next word
  if (state.currentIndex < state.words.length - 1) {
    state.currentIndex++;
    displayWord(state.words[state.currentIndex], wordDisplay, guideLines);
    updateProgress(progressBarFill, progressPercentage);
  }
}

// Reset progress during reading (pauses and resets to beginning)
function resetProgress() {
  if (state.words.length === 0) return;

  // Pause if playing
  if (state.isPlaying) {
    state.isPlaying = false;
    clearTimeout(state.timeoutId);
    pauseButton.textContent = "Resume";
  }

  // Reset to beginning
  state.currentIndex = 0;
  displayWord(state.words[state.currentIndex], wordDisplay, guideLines);
  updateProgress(progressBarFill, progressPercentage);
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Handle shortcuts in reading interface
  if (readingInterface.classList.contains("active")) {
    switch (e.key) {
      case " ":
        e.preventDefault();
        togglePause();
        break;
      case "r":
      case "R":
        e.preventDefault();
        resetProgress();
        break;
      case "ArrowLeft":
        e.preventDefault();
        stepPrevWord();
        break;
      case "ArrowRight":
        e.preventDefault();
        stepNextWord();
        break;
      case "Escape":
        e.preventDefault();
        stopReading();
        break;
      case "ArrowUp":
        e.preventDefault();
        adjustSpeed(50, speedSlider, speedValue);
        break;
      case "ArrowDown":
        e.preventDefault();
        adjustSpeed(-50, speedSlider, speedValue);
        break;
    }
    return;
  }

  // Handle shortcuts in input interface (only when not focused on text inputs)
  const isTextFocused = document.activeElement === textInput || document.activeElement === docTitleInput;

  if (!isTextFocused) {
    if (e.key === " ") {
      e.preventDefault();
      if (textInput.value.trim()) {
        startReading();
      }
    } else if (e.key.toLowerCase() === "r") {
      e.preventDefault();
      resetInput();
    }
  }
});

// Make history functions global for inline onclick handlers
window.loadFromHistory = (id) => loadFromHistory(id, textInput, docTitleInput, clearDraft);
window.resetFromHistory = (id) => resetFromHistory(id, historyList, historyEmpty);
window.deleteFromHistory = (id) => deleteFromHistory(id, historyList, historyEmpty);

// Event listeners
startButton.addEventListener("click", startReading);
resetButton.addEventListener("click", resetProgress);
pauseButton.addEventListener("click", togglePause);
stopButton.addEventListener("click", stopReading);
resetBtn.addEventListener("click", resetInput);
pdfInput.addEventListener("change", handlePDFUpload);
clearHistoryBtn.addEventListener("click", () => clearHistory(historyList, historyEmpty));

// Setup UI components
setupWelcomePopup(welcomePopupOverlay, welcomePopupClose, welcomePopupOk);
setupSidebarOverlay(sidebarLeft, sidebarRight, sidebarOverlay);
setupProgressBar(progressBarWrapper, progressBarFill, progressPercentage, wordDisplay, guideLines);
setupDragAndDrop(dropOverlay, (file) => processPDF(file, textInput, docTitleInput, pdfStatus));
setupSettingsListeners(fontSizeSlider, fontSizeValue, speedSlider, speedValue, punctuationSlider, punctuationValue);

// Initialize
loadSettings();
updateFontSizeSliderRange(fontSizeSlider);

// Set slider values after range is updated
fontSizeSlider.value = state.settings.fontSize;
fontSizeValue.textContent = state.settings.fontSize + "px";
speedSlider.value = state.settings.speed;
speedValue.textContent = state.settings.speed + "wpm";
punctuationSlider.value = state.settings.punctuationPause;
punctuationValue.textContent = state.settings.punctuationPause + "ms";

// Initialize slider value positions
updateSliderValuePosition(fontSizeSlider, fontSizeValue);
updateSliderValuePosition(speedSlider, speedValue);
updateSliderValuePosition(punctuationSlider, punctuationValue);

// Render history and show welcome popup
renderHistory(historyList, historyEmpty);
showWelcomePopup(welcomePopupOverlay);

// Load draft on page load
const draft = loadDraft();
if (draft) {
  docTitleInput.value = draft.title;
  textInput.value = draft.text;
}

// Auto-save draft when title or text changes (debounced)
let draftSaveTimeout;
function autoSaveDraft() {
  clearTimeout(draftSaveTimeout);
  draftSaveTimeout = setTimeout(() => {
    saveDraft(docTitleInput.value, textInput.value);
  }, 500); // Save 500ms after user stops typing
}

docTitleInput.addEventListener("input", autoSaveDraft);
textInput.addEventListener("input", autoSaveDraft);

// Save progress before page unload (refresh or close)
window.addEventListener("beforeunload", (e) => {
  // Save draft if on input interface
  if (!readingInterface.classList.contains("active")) {
    saveDraft(docTitleInput.value, textInput.value);
  }

  // Save reading progress if currently reading
  if (readingInterface.classList.contains("active") && state.currentDocId) {
    saveToHistory(textInput, docTitleInput, true);
  }
});

// Update font size slider range on window resize
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const oldValue = state.settings.fontSize;
    updateFontSizeSliderRange(fontSizeSlider);
    // Update display if value changed
    if (oldValue !== state.settings.fontSize) {
      fontSizeSlider.value = state.settings.fontSize;
      fontSizeValue.textContent = state.settings.fontSize + "px";
    }
  }, 100);
});
