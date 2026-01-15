/* RSVP Speed Reader - Settings Management */

import { state, saveSettings } from "./state.js";

// Check if device is mobile
export function isMobile() {
  return window.innerWidth <= 768;
}

// Update font size slider range based on device type
export function updateFontSizeSliderRange(fontSizeSlider) {
  const isMobileDevice = isMobile();
  if (isMobileDevice) {
    // Mobile: divide by 2.5 (24/2.5=9.6≈10, 120/2.5=48, 72/2.5=28.8≈29)
    fontSizeSlider.min = 10;
    fontSizeSlider.max = 48;
    // If current value is desktop range, convert to mobile range
    if (state.settings.fontSize > 48) {
      state.settings.fontSize = Math.round(state.settings.fontSize / 2.5);
      saveSettings();
    }
    // Set default if no saved value or value is out of range
    if (!state.settings.fontSize || state.settings.fontSize < 10 || state.settings.fontSize > 48) {
      state.settings.fontSize = 29; // Default mobile: 72/2.5 ≈ 29
      saveSettings();
    }
  } else {
    // Desktop: original range
    fontSizeSlider.min = 24;
    fontSizeSlider.max = 120;
    // If current value is mobile range, convert to desktop range
    if (state.settings.fontSize <= 48) {
      state.settings.fontSize = Math.round(state.settings.fontSize * 2.5);
      saveSettings();
    }
    // Set default if no saved value or value is out of range
    if (!state.settings.fontSize || state.settings.fontSize < 24 || state.settings.fontSize > 120) {
      state.settings.fontSize = 72; // Default desktop
      saveSettings();
    }
  }
}

// Update slider value position based on thumb position
export function updateSliderValuePosition(slider, valueElement) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const value = parseFloat(slider.value);

  // Calculate percentage (0 to 1)
  const percentage = (value - min) / (max - min);

  // Account for thumb size (16px width, so 8px on each side)
  // The thumb's center position needs adjustment at the edges
  const thumbWidth = 16;
  const sliderWidth = slider.offsetWidth;
  const availableWidth = sliderWidth - thumbWidth;

  // Calculate pixel position
  const position = percentage * availableWidth + thumbWidth / 2;

  valueElement.style.left = `${position}px`;
}

// Adjust speed by delta
export function adjustSpeed(delta, speedSlider, speedValue) {
  const newSpeed = Math.max(100, Math.min(1000, state.settings.speed + delta));
  state.settings.speed = newSpeed;
  speedSlider.value = newSpeed;
  speedValue.textContent = newSpeed + " wpm";
  saveSettings();
}

// Setup settings event listeners
export function setupSettingsListeners(
  fontSizeSlider,
  fontSizeValue,
  speedSlider,
  speedValue,
  punctuationSlider,
  punctuationValue
) {
  fontSizeSlider.addEventListener("input", (e) => {
    state.settings.fontSize = parseInt(e.target.value);
    fontSizeValue.textContent = state.settings.fontSize + "px";
    updateSliderValuePosition(fontSizeSlider, fontSizeValue);
    saveSettings();
  });

  speedSlider.addEventListener("input", (e) => {
    state.settings.speed = parseInt(e.target.value);
    speedValue.textContent = state.settings.speed + " wpm";
    updateSliderValuePosition(speedSlider, speedValue);
    saveSettings();
  });

  punctuationSlider.addEventListener("input", (e) => {
    state.settings.punctuationPause = parseInt(e.target.value);
    punctuationValue.textContent = state.settings.punctuationPause + "ms";
    updateSliderValuePosition(punctuationSlider, punctuationValue);
    saveSettings();
  });
}
