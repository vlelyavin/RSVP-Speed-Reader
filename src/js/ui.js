/* RSVP Speed Reader - UI Interactions */

import { state } from "./state.js";
import { displayWord } from "./rsvp.js";

// Welcome popup functions
export function showWelcomePopup(welcomePopupOverlay) {
  const hasSeenWelcome = localStorage.getItem("rsvpHasSeenWelcome");
  if (!hasSeenWelcome) {
    welcomePopupOverlay.classList.add("active");
  }
}

export function hideWelcomePopup(welcomePopupOverlay) {
  welcomePopupOverlay.classList.remove("active");
  localStorage.setItem("rsvpHasSeenWelcome", "true");
}

export function setupWelcomePopup(welcomePopupOverlay, welcomePopupClose, welcomePopupOk) {
  welcomePopupClose.addEventListener("click", () => hideWelcomePopup(welcomePopupOverlay));
  welcomePopupOk.addEventListener("click", () => hideWelcomePopup(welcomePopupOverlay));

  // Close popup when clicking overlay
  welcomePopupOverlay.addEventListener("click", (e) => {
    if (e.target === welcomePopupOverlay) {
      hideWelcomePopup(welcomePopupOverlay);
    }
  });
}

// Sidebar overlay interactions
export function setupSidebarOverlay(sidebarLeft, sidebarRight, sidebarOverlay) {
  sidebarLeft.addEventListener("mouseenter", () => {
    sidebarOverlay.classList.add("active");
  });

  sidebarLeft.addEventListener("mouseleave", () => {
    sidebarOverlay.classList.remove("active");
  });

  sidebarRight.addEventListener("mouseenter", () => {
    sidebarOverlay.classList.add("active");
  });

  sidebarRight.addEventListener("mouseleave", () => {
    sidebarOverlay.classList.remove("active");
  });
}

// Progress bar interaction
let isDraggingProgress = false;

function updateProgressFromPosition(clientX, progressBarWrapper, progressBarFill, progressPercentage, wordDisplay, guideLines) {
  const rect = progressBarWrapper.getBoundingClientRect();
  const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
  const percent = x / rect.width;
  const newIndex = Math.floor(percent * state.words.length);

  state.currentIndex = Math.max(0, Math.min(newIndex, state.words.length - 1));

  if (state.words.length > 0) {
    displayWord(state.words[state.currentIndex], wordDisplay, guideLines);
    updateProgress(progressBarFill, progressPercentage);
  }
}

export function updateProgress(progressBarFill, progressPercentage) {
  // Update progress bar
  const progressPercent = state.words.length > 0 ? (state.currentIndex / state.words.length) * 100 : 0;
  progressPercentage.textContent = `${progressPercent.toFixed(2)}%`;
  progressBarFill.style.width = `${progressPercent}%`;
}

export function setupProgressBar(progressBarWrapper, progressBarFill, progressPercentage, wordDisplay, guideLines) {
  progressBarWrapper.addEventListener("mousedown", (e) => {
    isDraggingProgress = true;
    updateProgressFromPosition(e.clientX, progressBarWrapper, progressBarFill, progressPercentage, wordDisplay, guideLines);
  });

  document.addEventListener("mousemove", (e) => {
    if (isDraggingProgress) {
      updateProgressFromPosition(e.clientX, progressBarWrapper, progressBarFill, progressPercentage, wordDisplay, guideLines);
    }
  });

  document.addEventListener("mouseup", () => {
    isDraggingProgress = false;
  });

  progressBarWrapper.addEventListener("click", (e) => {
    if (!isDraggingProgress) {
      updateProgressFromPosition(e.clientX, progressBarWrapper, progressBarFill, progressPercentage, wordDisplay, guideLines);
    }
  });
}

// Drag and drop for PDF
export function setupDragAndDrop(dropOverlay, processPDFCallback) {
  document.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropOverlay.classList.add("active");
  });

  document.addEventListener("dragleave", (e) => {
    if (e.relatedTarget === null || !document.contains(e.relatedTarget)) {
      dropOverlay.classList.remove("active");
    }
  });

  document.addEventListener("drop", (e) => {
    e.preventDefault();
    dropOverlay.classList.remove("active");
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      processPDFCallback(file);
    }
  });
}
