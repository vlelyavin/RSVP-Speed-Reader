/* RSVP Speed Reader - EPUB Processor */

// Load JSZip library from CDN
async function loadJSZip() {
  if (window.JSZip) {
    return;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load JSZip library"));
    document.head.appendChild(script);
  });
}

// Parse EPUB structure to find OPF file
async function parseEPUBStructure(zip) {
  // Read container.xml to find OPF location
  const containerFile = zip.file("META-INF/container.xml");
  if (!containerFile) {
    throw new Error("Invalid EPUB: Missing container.xml");
  }

  const containerXML = await containerFile.async("string");
  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerXML, "text/xml");

  const rootfile = containerDoc.querySelector("rootfile");
  if (!rootfile) {
    throw new Error("Invalid EPUB: No rootfile in container.xml");
  }

  const opfPath = rootfile.getAttribute("full-path");
  if (!opfPath) {
    throw new Error("Invalid EPUB: No OPF path specified");
  }

  // Read OPF file
  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error(`Invalid EPUB: OPF file not found at ${opfPath}`);
  }

  const opfContent = await opfFile.async("string");
  const opfDoc = parser.parseFromString(opfContent, "text/xml");

  return { opfPath, opfDoc };
}

// Extract metadata from OPF document
function extractMetadata(opfDoc) {
  const titleEl = opfDoc.querySelector("metadata title, title");
  const authorEl = opfDoc.querySelector("metadata creator, creator");

  const title = titleEl ? titleEl.textContent.trim() : "Untitled";
  const author = authorEl ? authorEl.textContent.trim() : "";

  return { title, author };
}

// Extract text content from EPUB in reading order
async function extractTextContent(zip, opfDoc, opfPath, epubStatus) {
  // Build manifest map (id -> href)
  const manifest = {};
  const manifestItems = opfDoc.querySelectorAll("manifest item");

  manifestItems.forEach((item) => {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    if (id && href) {
      manifest[id] = href;
    }
  });

  if (Object.keys(manifest).length === 0) {
    throw new Error("No items found in EPUB manifest");
  }

  // Get reading order from spine
  const spineItems = opfDoc.querySelectorAll("spine itemref");
  const contentFiles = [];

  spineItems.forEach((itemRef) => {
    const idref = itemRef.getAttribute("idref");
    if (idref && manifest[idref]) {
      contentFiles.push(manifest[idref]);
    }
  });

  if (contentFiles.length === 0) {
    throw new Error("No readable content found in EPUB");
  }

  // Extract text from each content file in order
  let fullText = "";
  const opfDir = opfPath.substring(0, opfPath.lastIndexOf("/") + 1);

  for (let i = 0; i < contentFiles.length; i++) {
    epubStatus.textContent = `Processing chapter ${i + 1}/${contentFiles.length}...`;

    // Resolve relative path from OPF directory
    const filePath = opfDir + contentFiles[i];
    const contentFile = zip.file(filePath);

    if (contentFile) {
      try {
        const xhtmlContent = await contentFile.async("string");
        const parser = new DOMParser();
        const contentDoc = parser.parseFromString(xhtmlContent, "text/html");
        const body = contentDoc.querySelector("body");

        if (body) {
          // Extract all text from body
          fullText += body.textContent + " ";
        }
      } catch (error) {
        console.warn(`Failed to process chapter ${i + 1}:`, error);
        // Continue with other chapters even if one fails
      }
    }
  }

  if (!fullText.trim()) {
    throw new Error("No text content extracted from EPUB");
  }

  return fullText;
}

// Clean extracted EPUB text
export function cleanEPUBText(text) {
  return (
    text
      // Remove excessive newlines and whitespace
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      // Remove zero-width characters
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      // Remove replacement character (�)
      .replace(/[\uFFFD]/g, "")
      .trim()
  );
}

// Main EPUB processing function
export async function processEPUB(file, textInput, docTitleInput, epubStatus) {
  try {
    epubStatus.textContent = "Loading EPUB...";

    // 1. Load JSZip library
    await loadJSZip();

    epubStatus.textContent = "Extracting EPUB contents...";

    // 2. Unzip EPUB file
    const arrayBuffer = await file.arrayBuffer();
    const zip = await window.JSZip.loadAsync(arrayBuffer);

    // 3. Parse EPUB structure
    const { opfPath, opfDoc } = await parseEPUBStructure(zip);

    // 4. Extract metadata
    const { title, author } = extractMetadata(opfDoc);

    // 5. Extract text content in reading order
    const fullText = await extractTextContent(zip, opfDoc, opfPath, epubStatus);

    // 6. Clean text
    const cleanedText = cleanEPUBText(fullText);

    // 7. Populate UI
    textInput.value = cleanedText;

    // Set document title (prefer metadata over filename)
    if (!docTitleInput.value) {
      docTitleInput.value = author ? `${title} - ${author}` : title;
    }

    // 8. Update status to show success
    epubStatus.textContent = docTitleInput.value;
  } catch (error) {
    console.error("Error processing EPUB:", error);
    epubStatus.textContent = "Error loading EPUB. Try a different file.";
  }
}
