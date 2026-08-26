/**
 * System Settings Manager
 * Persists and enforces Administrator Settings (2G / Low-Bandwidth Mode & AI Tutor Query Rate Limiting)
 */

export interface SystemSettings {
  bandwidthCompression: boolean;
  aiRateLimit: 'High (100 req/min)' | 'Standard (60 req/min)' | 'Strict (30 req/min)';
}

const SETTINGS_KEY = 'gramin_system_settings';
const RATE_LIMIT_TIMESTAMPS_KEY = 'gramin_ai_request_timestamps';

const DEFAULT_SETTINGS: SystemSettings = {
  bandwidthCompression: true,
  aiRateLimit: 'High (100 req/min)',
};

/**
 * Get current system settings from localStorage or defaults
 */
export function getSystemSettings(): SystemSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      bandwidthCompression: typeof parsed.bandwidthCompression === 'boolean' ? parsed.bandwidthCompression : true,
      aiRateLimit: parsed.aiRateLimit || 'High (100 req/min)',
    };
  } catch (err) {
    console.warn('[SystemSettings] Failed to parse system settings, using defaults:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update and persist system settings
 */
export function updateSystemSettings(partial: Partial<SystemSettings>): SystemSettings {
  const current = getSystemSettings();
  const updated: SystemSettings = { ...current, ...partial };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gramin_settings_changed', { detail: updated }));
    }
  } catch (err) {
    console.error('[SystemSettings] Failed to save settings to localStorage:', err);
  }
  return updated;
}

/**
 * Extract numerical limit per minute from aiRateLimit setting
 */
export function getAiRateLimitNumber(limitSetting?: string): number {
  const str = limitSetting || getSystemSettings().aiRateLimit;
  if (str.includes('30')) return 30;
  if (str.includes('60')) return 60;
  return 100;
}

/**
 * Enforce AI Query Rate Limiting based on administrator setting.
 * Checks requests in a rolling 60-second window.
 */
export function checkAndRecordAiRateLimit(): { allowed: boolean; limit: number; retryAfterSec?: number; errorMsg?: string } {
  if (typeof window === 'undefined') return { allowed: true, limit: 100 };

  const settings = getSystemSettings();
  const maxReqPerMin = getAiRateLimitNumber(settings.aiRateLimit);
  const now = Date.now();
  const windowMs = 60 * 1000;

  try {
    const rawStamps = localStorage.getItem(RATE_LIMIT_TIMESTAMPS_KEY);
    let stamps: number[] = rawStamps ? JSON.parse(rawStamps) : [];
    
    // Filter out timestamps older than 60 seconds
    stamps = stamps.filter(t => now - t < windowMs);

    if (stamps.length >= maxReqPerMin) {
      const oldestStamp = stamps[0];
      const timeToWaitMs = windowMs - (now - oldestStamp);
      const retryAfterSec = Math.max(1, Math.ceil(timeToWaitMs / 1000));
      return {
        allowed: false,
        limit: maxReqPerMin,
        retryAfterSec,
        errorMsg: `⚠️ Administrator AI Tutor Query Limit Reached (${maxReqPerMin} req/min). Please wait ${retryAfterSec} seconds before asking another question.`
      };
    }

    // Record this request timestamp
    stamps.push(now);
    localStorage.setItem(RATE_LIMIT_TIMESTAMPS_KEY, JSON.stringify(stamps));
    return { allowed: true, limit: maxReqPerMin };
  } catch (err) {
    console.warn('[SystemSettings] Error enforcing rate limit:', err);
    return { allowed: true, limit: maxReqPerMin };
  }
}
