/* RSVP Speed Reader - PDF Processing */

import { parseText } from "./rsvp.js";

// Clean up PDF text by removing unnecessary whitespace and invalid characters
export function cleanPDFText(text) {
  // Remove common PDF encoding artifacts and invalid unicode characters
  text = text
    // Remove box drawing characters and other common PDF artifacts
    .replace(/[\u2500-\u257F]/g, "") // Box drawing characters
    .replace(/[\uFFFD]/g, "") // Replacement character (�)
    .replace(/[\u0000-\u001F]/g, " ") // Control characters except newline/tab
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Zero-width spaces
    // Remove standalone square boxes and similar symbols
    .replace(/[□■▪▫]/g, "")
    // Normalize line breaks and excessive whitespace
    .replace(/[\r\n]+/g, " ") // Replace all line breaks with single space
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();

  return text;
}

// Load PDF.js library dynamically
export function loadPDFJS() {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Process PDF file
export async function processPDF(file, textInput, docTitleInput, pdfStatus) {
  pdfStatus.textContent = "Loading PDF...";

  try {
    // Load PDF.js library dynamically if not already loaded
    if (!window.pdfjsLib) {
      await loadPDFJS();
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    const totalPages = pdf.numPages;

    for (let i = 1; i <= totalPages; i++) {
      pdfStatus.textContent = `Processing page ${i}/${totalPages}...`;
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + " ";
    }

    // Clean up the extracted text
    fullText = cleanPDFText(fullText);

    textInput.value = fullText;

    // Set document title from filename if empty
    if (!docTitleInput.value) {
      docTitleInput.value = file.name.replace(".pdf", "");
    }

    const wordCount = parseText(fullText).length;
    pdfStatus.textContent = `${file.name}`;
  } catch (error) {
    console.error("Error processing PDF:", error);
    pdfStatus.textContent = "Error loading PDF. Try a different file.";
  }
}
