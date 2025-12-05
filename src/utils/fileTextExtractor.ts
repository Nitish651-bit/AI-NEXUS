import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

// Use CDN worker to avoid bundler-specific configuration
GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.js";

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

      if (!text) return null;

      if (text.length > maxChars) {
        return {
          type: 'text',
          content: text.slice(0, maxChars) +
            "\n\n[Content truncated for length to keep the AI response focused.]"
        };
      }

      return { type: 'text', content: text };
    }

    if (file.type.startsWith("text/")) {
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
