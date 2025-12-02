import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

// Use CDN worker to avoid bundler-specific configuration
GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.js";

const DEFAULT_MAX_CHARS = 8000;

/**
 * Extracts readable text content from a File.
 * - Supports PDF and plain text files.
 * - Truncates long documents to keep prompts within a safe size.
 */
export async function extractTextFromFile(
  file: File,
  maxChars: number = DEFAULT_MAX_CHARS
): Promise<string | null> {
  try {
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
        return (
          text.slice(0, maxChars) +
          "\n\n[Content truncated for length to keep the AI response focused.]"
        );
      }

      return text;
    }

    if (file.type.startsWith("text/")) {
      const fullText = await file.text();
      if (!fullText.trim()) return null;

      if (fullText.length > maxChars) {
        return (
          fullText.slice(0, maxChars) +
          "\n\n[Content truncated for length to keep the AI response focused.]"
        );
      }

      return fullText;
    }

    // Other file types (images, videos, etc.) are not yet supported for text extraction
    return null;
  } catch (error) {
    console.error("Failed to extract text from file", file.name, error);
    return null;
  }
}
