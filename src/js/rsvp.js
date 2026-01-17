/* RSVP Speed Reader - RSVP Logic */

import { state } from "./state.js";

// Calculate ORP (Optimal Recognition Point) index
export function calculateORP(word) {
  const length = word.length;
  if (length <= 3) return 0;
  if (length <= 5) return 1;
  if (length <= 9) return 2;
  return 3;
}

// Escape HTML to prevent XSS
export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Measure text width helper
let measureElement = null;
export function getTextWidth(text, fontSize, fontFamily) {
  if (!measureElement) {
    measureElement = document.createElement("span");
    measureElement.style.position = "absolute";
    measureElement.style.visibility = "hidden";
    measureElement.style.whiteSpace = "nowrap";
    document.body.appendChild(measureElement);
  }
  measureElement.style.fontSize = fontSize + "px";
  measureElement.style.fontFamily = fontFamily;
  measureElement.textContent = text;
  return measureElement.offsetWidth;
}

// Display word with ORP highlighting
export function displayWord(word, wordDisplay, guideLines) {
  const orpIndex = calculateORP(word);
  const beforeORP = word.substring(0, orpIndex);
  const orpLetter = word.substring(orpIndex, orpIndex + 1);
  const afterORP = word.substring(orpIndex + 1);

  // Apply font size and family
  wordDisplay.style.fontSize = state.settings.fontSize + "px";
  wordDisplay.style.fontFamily = state.settings.fontFamily;

  // Make a black gap in the vertical guide where the word appears (video-like)
  // Slightly larger than font size to account for ascenders/descenders.

  // Create word parts
  wordDisplay.innerHTML = `
    <span class="word-part">${escapeHtml(beforeORP)}</span>
    <span class="word-part orp-letter">${escapeHtml(orpLetter)}</span>
    <span class="word-part">${escapeHtml(afterORP)}</span>
  `;

  // Position word so ORP letter aligns with center vertical guide
  // Measure widths to calculate proper offset
  const fontFamily = state.settings.fontFamily;
  const beforeWidth = getTextWidth(beforeORP, state.settings.fontSize, fontFamily);
  const orpWidth = getTextWidth(orpLetter, state.settings.fontSize, fontFamily);
  const totalWidth = getTextWidth(word, state.settings.fontSize, fontFamily);

  // Calculate offset: center ORP letter at 50% of viewport
  // Offset = (beforeWidth + orpWidth/2) - totalWidth/2
  const offset = beforeWidth + orpWidth / 2 - totalWidth / 2;
  wordDisplay.style.transform = `translateX(${-offset}px)`;
}

// Parse text into words with smart splitting
export function parseText(text) {
  // First, split by whitespace
  let words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  // Process each word to handle sentence-ending punctuation and long words
  const processedWords = [];

  for (let word of words) {
    // Split on sentence-ending punctuation (. and ;) while preserving them
    // Match pattern: text followed by . or ; (capture both parts)
    const sentenceSplitRegex = /([^.;]+)([.;])/g;
    let lastIndex = 0;
    let match;
    let hasSentenceSplit = false;

    while ((match = sentenceSplitRegex.exec(word)) !== null) {
      hasSentenceSplit = true;
      // Add the text with its punctuation
      if (match[1].trim()) {
        processedWords.push(match[1].trim() + match[2]);
      }
      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text after the last punctuation
    if (hasSentenceSplit && lastIndex < word.length) {
      const remaining = word.substring(lastIndex).trim();
      if (remaining) {
        processedWords.push(remaining);
      }
    }

    // If no sentence punctuation was found, add the whole word
    if (!hasSentenceSplit) {
      processedWords.push(word);
    }
  }

  // Now split any words that are too long to fit on screen
  const maxWordLength = 30; // Conservative max characters per word
  const finalWords = [];

  for (let word of processedWords) {
    if (word.length > maxWordLength) {
      // Split long word into chunks
      const chunks = [];
      for (let i = 0; i < word.length; i += maxWordLength) {
        chunks.push(word.substring(i, i + maxWordLength));
      }
      finalWords.push(...chunks);
    } else {
      finalWords.push(word);
    }
  }

  return finalWords;
}

// Check if word ends with punctuation
export function hasPunctuation(word) {
  return /[.,!?;:]$/.test(word);
}

// Calculate delay for word
export function calculateDelay(word) {
  const baseDelay = (60 / state.settings.speed) * 1000; // Convert WPM to milliseconds
  const punctuationDelay = hasPunctuation(word) ? state.settings.punctuationPause : 0;
  return baseDelay + punctuationDelay;
}
