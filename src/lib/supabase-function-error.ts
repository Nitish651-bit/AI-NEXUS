type FunctionErrorLike = {
  message?: string;
  context?: Response;
};

export async function getSupabaseFunctionErrorMessage(
  error: unknown,
  fallback = "Request failed"
): Promise<string> {
  if (!error) return fallback;

  if (typeof error === "string") {
    return error;
  }

  const functionError = error as FunctionErrorLike;
  const genericMessage = "Edge Function returned a non-2xx status code";

  if (functionError.context) {
    try {
      const payload = await functionError.context.clone().json();
      if (typeof payload?.error === "string" && payload.error.trim()) {
        return payload.error;
      }
      if (typeof payload?.message === "string" && payload.message.trim()) {
        return payload.message;
      }
    } catch {
      // Ignore JSON parsing failures and fall back to text/message parsing.
    }

    try {
      const text = await functionError.context.clone().text();
      if (text.trim()) {
        return text;
      }
    } catch {
      // Ignore text parsing failures and fall back to the provided message.
    }
  }

  if (functionError.message && functionError.message !== genericMessage) {
    return functionError.message;
  }

  return fallback;
}