/**
 * Safe fetch wrapper that handles non-JSON error responses (e.g. "Rate exceeded.", HTML error pages, 429/500 plain text)
 * without throwing unhandled SyntaxError: Unexpected token 'R', "Rate exceeded." is not valid JSON.
 */

import { checkAndRecordAiRateLimit, getSystemSettings } from './systemSettings';

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  fallbackData?: Partial<T>
): Promise<T> {
  // Check if target endpoint is an AI service endpoint
  const isAiRoute = url.includes('/api/gemini');

  if (isAiRoute) {
    const rateCheck = checkAndRecordAiRateLimit();
    if (!rateCheck.allowed) {
      const msg = rateCheck.errorMsg || `AI rate limit of ${rateCheck.limit} req/min reached. Please wait a moment.`;
      console.warn(`[safeFetchJson] Rate limit blocked request to ${url}:`, msg);
      return {
        success: false,
        text: msg,
        message: msg,
        error: msg,
        rateLimited: true,
        ...(fallbackData || {})
      } as unknown as T;
    }
  }

  // Inject Low-Bandwidth headers & compression settings
  const settings = getSystemSettings();
  const reqHeaders = new Headers(options?.headers || {});
  if (settings.bandwidthCompression) {
    reqHeaders.set('X-Low-Bandwidth', 'true');
  }

  const modifiedOptions: RequestInit = {
    ...options,
    headers: reqHeaders,
  };

  try {
    const response = await fetch(url, modifiedOptions);
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
