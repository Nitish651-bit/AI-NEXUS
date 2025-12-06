import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

// Use a more reliable CDN with explicit mjs extension for modern browsers
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const DEFAULT_MAX_CHARS = 8000;

export interface ExtractedFile {
  type: 'text' | 'image';
  content: string; // text content or base64 data URL for images
  mimeType?: string;
}

/**
 * Extracts readable text content from a File or converts images to base64.
 * - Supports PDF, plain text files, and images.
 * - Truncates long documents to keep prompts within a safe size.
 */
export async function extractTextFromFile(
  file: File,
  maxChars: number = DEFAULT_MAX_CHARS
): Promise<string | null> {
  const result = await extractFileContent(file, maxChars);
  if (!result) return null;
  return result.type === 'text' ? result.content : null;
}

/**
 * Extracts file content with type information.
 * Returns structured data for both text and images.
 */
export async function extractFileContent(
  file: File,
  maxChars: number = DEFAULT_MAX_CHARS
): Promise<ExtractedFile | null> {
  try {
    // Handle images - convert to base64 for vision AI
    if (file.type.startsWith("image/")) {
      const base64 = await fileToBase64(file);
      return {
        type: 'image',
        content: base64,
        mimeType: file.type
      };
    }

    if (file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;

        let text = "";
        for (let pageNum = 1; pageNum <= pdf.numPages && text.length < maxChars; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          const pageText = (content.items as any[])
            .map((item) => ("str" in item ? (item as any).str : ""))
            .join(" ");

          if (pageText.trim()) {
            text += (text ? "\n\n" : "") + pageText;
          }
        }

        if (!text) {
          // If no text extracted, treat PDF as an image for OCR by the AI
          console.log("No text found in PDF, converting first page to image for AI vision");
          return await convertPdfToImage(file);
        }

        if (text.length > maxChars) {
          return {
            type: 'text',
            content: text.slice(0, maxChars) +
              "\n\n[Content truncated for length to keep the AI response focused.]"
          };
        }

        return { type: 'text', content: text };
      } catch (pdfError) {
        console.error("PDF parsing failed, converting to image for AI vision:", pdfError);
        // Fallback: convert PDF to image for AI vision analysis
        return await convertPdfToImage(file);
      }
    }

    if (file.type.startsWith("text/") || 
        file.name.endsWith('.txt') || 
        file.name.endsWith('.md') || 
        file.name.endsWith('.json') ||
        file.name.endsWith('.csv')) {
      const fullText = await file.text();
      if (!fullText.trim()) return null;

      if (fullText.length > maxChars) {
        return {
          type: 'text',
          content: fullText.slice(0, maxChars) +
            "\n\n[Content truncated for length to keep the AI response focused.]"
        };
      }

      return { type: 'text', content: fullText };
    }

    // Other file types are not yet supported
    return null;
  } catch (error) {
    console.error("Failed to extract content from file", file.name, error);
    return null;
  }
}

/**
 * Converts a File to a base64 data URL
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a PDF file to a base64 image (fallback when PDF parsing fails)
 * This sends the file as an image so the AI can use vision to read it
 */
async function convertPdfToImage(file: File): Promise<ExtractedFile | null> {
  try {
    // Read PDF as base64 and let AI vision handle it
    const base64 = await fileToBase64(file);
    return {
      type: 'image',
      content: base64,
      mimeType: 'application/pdf'
    };
  } catch (error) {
    console.error("Failed to convert PDF to image:", error);
    return null;
  }
}
