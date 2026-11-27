/**
 * Shared history persistence, sanitization, size-capping, and non-destructive merge helpers
 * for AI Study Chatbot, Smart Equation Hub, and PDF AI Solver.
 */

export interface GenericHistorySession {
  id: string;
  title: string;
  timestamp: string;
  updatedAt?: number;
  starred?: boolean;
  activePageNum?: number;
  messages: any[];
  [key: string]: any;
}

/**
 * Formats a concise human-readable date + time stamp (e.g. "Nov 26, 07:22 PM")
 * so sessions remain clearly dated across 24h+ rollovers.
 */
export function formatSessionTimestamp(date: Date = new Date()): string {
  try {
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return date.toISOString();
  }
}

/**
 * Builds a deterministic, Firestore-rule-safe document ID for PDF AI Solver history
 * matching ^[a-zA-Z0-9_\-.:]+$ and max length <= 128.
 */
export function buildPdfHistoryDocId(fileId?: string, fileName?: string): string {
  const raw = (fileId || fileName || 'doc').trim();
  // Compute a short deterministic hash of the full raw key to avoid collisions when truncated
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
  }
  const hashHex = (hash >>> 0).toString(36);
  const cleanPrefix = raw
    .replace(/[^a-zA-Z0-9_\-.:]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 90) || 'doc';
  return `pdf_${cleanPrefix}_${hashHex}`.slice(0, 120);
}

/**
 * Strips heavy base64 payloads from a session list while preserving all text,
 * metadata, replies, timestamps, and lightweight attachments.
 */
export function pruneHistorySessions<T extends GenericHistorySession>(
  sessions: T[],
  maxSessions: number = 30,
  maxMessagesPerSession: number = 35
): T[] {
  if (!Array.isArray(sessions)) return [];

  return sessions.slice(0, maxSessions).map((s) => {
    const messages = Array.isArray(s.messages)
      ? s.messages.slice(-maxMessagesPerSession).map((m: any) => {
          if (!m || typeof m !== 'object') return m;
          const copy = { ...m };
          if (copy.image && typeof copy.image === 'object') {
            if (copy.image.mimeType === 'application/pdf' || (copy.image.data && copy.image.data.length > 35000)) {
              copy.image = {
                name: copy.image.name || 'document',
                mimeType: copy.image.mimeType || 'application/octet-stream',
                data: ''
              };
            }
          }
          if (typeof copy.attachmentUrl === 'string' && copy.attachmentUrl.length > 35000) {
            copy.attachmentUrl = '';
          }
          return copy;
        })
      : [];

    return {
      ...s,
      updatedAt: typeof s.updatedAt === 'number' ? s.updatedAt : Date.now(),
      messages
    };
  });
}

/**
 * Serializes sessions to JSON while guaranteeing the output stays under `maxBytes`
 * (keeping newest & starred sessions first if trimming is required).
 */
export function capSerializedSessions<T extends GenericHistorySession>(
  sessions: T[],
  maxBytes: number = 150000,
  maxSessions: number = 25,
  maxMessagesPerSession: number = 30
): string {
  const pruned = pruneHistorySessions(sessions, maxSessions, maxMessagesPerSession);
  let candidate = pruned;
  let serialized = JSON.stringify(candidate);

  while (candidate.length > 1 && new TextEncoder().encode(serialized).length > maxBytes) {
    // Drop the oldest non-starred session first, or oldest session overall
    const unstarredRevIdx = [...candidate].reverse().findIndex((s) => !s.starred);
    if (unstarredRevIdx !== -1) {
      const dropIdx = candidate.length - 1 - unstarredRevIdx;
      candidate = candidate.filter((_, idx) => idx !== dropIdx);
    } else {
      candidate = candidate.slice(0, candidate.length - 1);
    }
    serialized = JSON.stringify(candidate);
  }

  // If even 1 session is huge, trim its oldest messages
  if (candidate.length === 1 && new TextEncoder().encode(serialized).length > maxBytes) {
    let msgs = [...(candidate[0].messages || [])];
    while (msgs.length > 2 && new TextEncoder().encode(JSON.stringify([{ ...candidate[0], messages: msgs }])).length > maxBytes) {
      msgs = msgs.slice(1);
    }
    serialized = JSON.stringify([{ ...candidate[0], messages: msgs }]);
  }

  return serialized;
}

/**
 * Safely parses a JSON session array from string or array.
 */
export function parseSessionList<T extends GenericHistorySession>(raw: unknown): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Merges two session lists non-destructively by session ID, keeping the richer/newer version.
 * Used when reconciling localStorage, User doc, and Firestore study_history subcollection.
 */
export function mergeHistorySessions<T extends GenericHistorySession>(
  primary: T[],
  secondary: T[],
  maxSessions: number = 30
): T[] {
  const byId = new Map<string, T>();
  const orderedIds: string[] = [];

  const upsert = (session: T) => {
    if (!session || !session.id) return;
    const existing = byId.get(session.id);
    if (!existing) {
      byId.set(session.id, session);
      orderedIds.push(session.id);
      return;
    }

    const existingMsgLen = Array.isArray(existing.messages) ? existing.messages.length : 0;
    const incomingMsgLen = Array.isArray(session.messages) ? session.messages.length : 0;
    const existingTs = typeof existing.updatedAt === 'number' ? existing.updatedAt : 0;
    const incomingTs = typeof session.updatedAt === 'number' ? session.updatedAt : 0;

    const useIncoming =
      incomingTs > existingTs ||
      (incomingTs === existingTs && incomingMsgLen > existingMsgLen);

    const winner = useIncoming ? session : existing;
    const loser = useIncoming ? existing : session;

    byId.set(session.id, {
      ...loser,
      ...winner,
      starred: Boolean(existing.starred || session.starred),
      messages: incomingMsgLen >= existingMsgLen ? session.messages : existing.messages,
      updatedAt: Math.max(existingTs, incomingTs) || Date.now()
    });
  };

  for (const s of primary) upsert(s);
  for (const s of secondary) upsert(s);

  return orderedIds
    .map((id) => byId.get(id)!)
    .slice(0, maxSessions);
}

/**
 * Merges two JSON-serialized session strings non-destructively.
 * If neither has valid sessions, returns undefined or '[]' cleanly.
 */
export function mergeSerializedSessions(
  localRaw?: string,
  remoteRaw?: string,
  maxBytes: number = 150000
): string | undefined {
  const localList = parseSessionList(localRaw);
  const remoteList = parseSessionList(remoteRaw);

  if (localList.length === 0 && remoteList.length === 0) {
    return remoteRaw ?? localRaw;
  }
  if (localList.length > 0 && remoteList.length === 0) {
    return capSerializedSessions(localList, maxBytes);
  }
  if (remoteList.length > 0 && localList.length === 0) {
    return capSerializedSessions(remoteList, maxBytes);
  }
  return capSerializedSessions(mergeHistorySessions(localList, remoteList), maxBytes);
}

/**
 * Writes a value to localStorage safely; if QuotaExceededError happens (often due to cached PDF blobs),
 * evicts stale `gramin_pdf_cache_*` entries first and retries so study history is never silently dropped.
 */
export function safeWriteHistoryToLocalStorage(key: string, value: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    try {
      const cacheKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('gramin_pdf_cache_')) {
          cacheKeys.push(k);
        }
      }
      for (const k of cacheKeys) {
        localStorage.removeItem(k);
      }
      localStorage.setItem(key, value);
    } catch (retryErr) {
      console.warn(`[HistoryPersistence] Failed to write localStorage key "${key}":`, retryErr || err);
    }
  }
}

export function readHistoryFromLocalStorage<T extends GenericHistorySession>(key: string): T[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return parseSessionList<T>(raw);
  } catch {
    return [];
  }
}
