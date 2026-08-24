/**
 * Safe fetch wrapper that handles non-JSON error responses (e.g. "Rate exceeded.", HTML error pages, 429/500 plain text)
 * without throwing unhandled SyntaxError: Unexpected token 'R', "Rate exceeded." is not valid JSON.
 */

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  fallbackData?: Partial<T>
): Promise<T> {
  try {
    const response = await fetch(url, options);
    const rawText = await response.text();
    const trimmed = rawText.trim();

    let parsed: any = null;
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        parsed = JSON.parse(trimmed);
      } catch (err) {
        console.warn(`[safeFetchJson] Failed to parse JSON from ${url}:`, err);
      }
    }

    if (parsed) {
      // If response had a non-200 status but returned JSON with message/error
      if (!response.ok && !parsed.text && !parsed.message) {
        parsed.message = `Server error (${response.status})`;
      }
      return parsed as T;
    }

    // Handle non-JSON response (e.g. "Rate exceeded.", "502 Bad Gateway", HTML error)
    const isRateLimit = trimmed.toLowerCase().includes("rate") || response.status === 429;
    const errorText = isRateLimit
      ? "AI service rate limit exceeded. Please wait a moment and try again."
      : (trimmed.slice(0, 150) || `Server returned status ${response.status}`);

    console.warn(`[safeFetchJson] Non-JSON response from ${url} (Status ${response.status}):`, trimmed);

    return {
      success: false,
      text: errorText,
      message: errorText,
      error: errorText,
      ...(fallbackData || {})
    } as unknown as T;
  } catch (netErr: any) {
    console.error(`[safeFetchJson] Network exception fetching ${url}:`, netErr);
    const errorMsg = netErr?.message || "Network error. Please check your connection.";
    return {
      success: false,
      text: errorMsg,
      message: errorMsg,
      error: errorMsg,
      ...(fallbackData || {})
    } as unknown as T;
  }
}
