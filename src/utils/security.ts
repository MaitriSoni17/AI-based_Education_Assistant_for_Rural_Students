/**
 * Cryptographic security utilities for Gramin Shiksha.
 * Implements salted SHA-256 hashing and constant-time verification for Admin PINs.
 * Uses standard Web Crypto API (compatible with modern browsers and Node.js).
 */

/**
 * Generate a random cryptographic hex salt.
 */
export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    globalThis.crypto.getRandomValues(array);
  } else {
    // Fallback pseudo-random for testing environments
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute salted SHA-256 hash of a PIN.
 * Returns format: "sha256$<salt>$<hash>"
 */
export async function hashPin(pin: string, existingSalt?: string): Promise<string> {
  const cleanPin = pin.trim();
  const salt = existingSalt || generateSalt(16);
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${cleanPin}`);

  const cryptoObj = (typeof window !== 'undefined' ? window.crypto : globalThis.crypto);
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error("Web Crypto API is not available in this environment.");
  }

  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `sha256$${salt}$${hashHex}`;
}

/**
 * Verifies an entered PIN against a stored credential string.
 * Supports:
 * 1. Salted hashes: "sha256$<salt>$<hash>"
 * 2. Backward compatibility with legacy unhashed PINs for smooth migration.
 */
export async function verifyPin(inputPin: string, storedHashOrPin: string | null | undefined): Promise<boolean> {
  if (!storedHashOrPin || !inputPin) return false;
  const cleanInput = inputPin.trim();

  // Case 1: Standard Salted SHA-256 format
  if (storedHashOrPin.startsWith('sha256$')) {
    const parts = storedHashOrPin.split('$');
    if (parts.length === 3) {
      const salt = parts[1];
      const expectedHash = parts[2];
      const recomputed = await hashPin(cleanInput, salt);
      const recomputedHash = recomputed.split('$')[2];
      
      // Constant-time string equality check to prevent timing attacks
      if (recomputedHash.length !== expectedHash.length) return false;
      let diff = 0;
      for (let i = 0; i < recomputedHash.length; i++) {
        diff |= recomputedHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
      }
      return diff === 0;
    }
  }

  // Case 2: Legacy fallback for existing unhashed credentials in database
  return cleanInput === storedHashOrPin.trim();
}

/**
 * Check if a credential string is in salted hash format
 */
export function isHashedPin(pinStr: string | null | undefined): boolean {
  return typeof pinStr === 'string' && pinStr.startsWith('sha256$');
}
