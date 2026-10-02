/**
 * Image compression and session sanitizer utilities for rural mobile/desktop environments.
 * Prevents oversized base64 images from clogging local storage and exceeding Firestore document limits (1MB).
 */

/**
 * Resizes an image file or base64 data string to max dimensions and compresses it to a lightweight data URL.
 * Typical 2-5MB smartphone photos are compressed down to ~25-50KB with crisp clarity.
 */
export async function compressImageToDataUrl(
  input: File | string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.72
): Promise<string> {
  return new Promise((resolve) => {
    // If not in browser environment, return empty or raw string
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      if (typeof input === 'string') return resolve(input);
      return resolve('');
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const processImage = () => {
      try {
        let width = img.naturalWidth || img.width || 800;
        let height = img.naturalHeight || img.height || 600;

        // Calculate aspect-ratio preserved scaling
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof input === 'string' ? input : '');
          return;
        }

        // Draw and compress
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to JPEG format for universal compatibility and high compression
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn("[ImageCompressor] Fallback due to canvas error:", err);
        resolve(typeof input === 'string' ? input : '');
      }
    };

    img.onload = processImage;
    img.onerror = () => {
      console.warn("[ImageCompressor] Failed to load image for compression");
      resolve(typeof input === 'string' ? input : '');
    };

    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(input);
    }
  });
}

/**
 * Strips huge base64 strings and prunes excessive historical records from a user session.
 * Ensures the user profile never balloons in localStorage or exceeds Firestore quotas.
 */
export function sanitizeUserSession(user: any): any {
  if (!user || typeof user !== 'object') return user;
  const cleaned = { ...user };

  // 1. Sanitize chatSessions if present
  if (typeof cleaned.chatSessions === 'string') {
    try {
      const sessions = JSON.parse(cleaned.chatSessions);
      if (Array.isArray(sessions)) {
        // Keep at most 15 sessions, max 25 messages per session
        const pruned = sessions.slice(0, 15).map((s: any) => ({
          ...s,
          messages: Array.isArray(s.messages)
            ? s.messages.slice(-25).map((m: any) => {
                const msgCopy = { ...m };
                if (msgCopy.image && typeof msgCopy.image === 'object') {
                  // If base64 payload is large or PDF, strip data to conserve storage
                  if (msgCopy.image.mimeType === 'application/pdf' || (msgCopy.image.data && msgCopy.image.data.length > 50000)) {
                    msgCopy.image = {
                      name: msgCopy.image.name || 'document',
                      mimeType: msgCopy.image.mimeType || 'application/octet-stream',
                      data: ''
                    };
                  }
                }
                return msgCopy;
              })
            : []
        }));
        cleaned.chatSessions = JSON.stringify(pruned);
      }
    } catch {
      cleaned.chatSessions = '[]';
    }
  }

  // 2. Sanitize solverSessions if present
  if (typeof cleaned.solverSessions === 'string') {
    try {
      const sessions = JSON.parse(cleaned.solverSessions);
      if (Array.isArray(sessions)) {
        const pruned = sessions.slice(0, 15).map((s: any) => ({
          ...s,
          messages: Array.isArray(s.messages)
            ? s.messages.slice(-25).map((m: any) => {
                const msgCopy = { ...m };
                if (msgCopy.attachmentUrl && msgCopy.attachmentUrl.length > 50000) {
                  msgCopy.attachmentUrl = ''; // strip heavy base64
                }
                return msgCopy;
              })
            : []
        }));
        cleaned.solverSessions = JSON.stringify(pruned);
      }
    } catch {
      cleaned.solverSessions = '[]';
    }
  }

  // 3. Sanitize mascotLessonsHistory if present
  if (typeof cleaned.mascotLessonsHistory === 'string') {
    try {
      const lessons = JSON.parse(cleaned.mascotLessonsHistory);
      if (Array.isArray(lessons)) {
        // Keep at most 10 recent lessons
        cleaned.mascotLessonsHistory = JSON.stringify(lessons.slice(0, 10));
      }
    } catch {
      cleaned.mascotLessonsHistory = '[]';
    }
  }

  return cleaned;
}
