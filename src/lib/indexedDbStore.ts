const DB_NAME = 'GyaanBotOfflineDB';
const STORE_NAME = 'files_data';
const META_STORE_NAME = 'files_meta';
const DB_VERSION = 2;

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(META_STORE_NAME)) {
        db.createObjectStore(META_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Converts a Base64 Data URL to a native binary Blob to eliminate ~33% memory overhead
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0]?.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const base64Data = parts[1] || '';
    if (typeof Buffer !== 'undefined') {
      const buf = Buffer.from(base64Data, 'base64');
      return new Blob([buf], { type: mime });
    }
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([byteNumbers], { type: mime });
  } catch (e) {
    // Fallback if data is not a standard data URL
    return new Blob([dataUrl], { type: 'text/plain' });
  }
}

/**
 * Converts a binary Blob back to a Data URL (isomorphic for browser & testing runtimes)
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
  // Node.js isomorphic fallback
  const buffer = await blob.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
}

/**
 * Saves file data into IndexedDB as a binary Blob to minimize device RAM/storage pressure.
 * Supports both raw Data URL strings and direct Blob objects.
 */
export async function saveFileLocal(fileId: string, fileData: string | Blob): Promise<void> {
  try {
    const db = await getDB();
    // Convert base64 data URLs to binary Blob for ~33% memory reduction
    const payload = typeof fileData === 'string' && fileData.startsWith('data:')
      ? dataUrlToBlob(fileData)
      : fileData;

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(payload, fileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Failed to save file data to IndexedDB:", err);
  }
}

/**
 * Retrieves file data from IndexedDB, returning a Data URL string.
 * Transparently supports both modern binary Blobs and legacy string records.
 */
export async function getFileLocal(fileId: string): Promise<string | null> {
  try {
    const db = await getDB();
    return new Promise<string | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fileId);
      request.onsuccess = async () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }
        if (result instanceof Blob) {
          try {
            const dataUrl = await blobToDataUrl(result);
            resolve(dataUrl);
          } catch (blobErr) {
            console.warn("Error converting Blob to Data URL:", blobErr);
            resolve(null);
          }
        } else if (typeof result === 'string') {
          // Legacy backwards compatibility for previously cached Base64 strings
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Failed to retrieve file data from IndexedDB:", err);
    return null;
  }
}

/**
 * Retrieves the raw binary Blob directly from IndexedDB without base64 conversion.
 */
export async function getFileBlobLocal(fileId: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    return new Promise<Blob | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result;
        if (result instanceof Blob) {
          resolve(result);
        } else if (typeof result === 'string') {
          resolve(dataUrlToBlob(result));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Failed to retrieve Blob from IndexedDB:", err);
    return null;
  }
}

export async function deleteFileLocal(fileId: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME, META_STORE_NAME], 'readwrite');
      transaction.objectStore(STORE_NAME).delete(fileId);
      transaction.objectStore(META_STORE_NAME).delete(fileId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn("Failed to delete file data from IndexedDB:", err);
  }
}

export async function saveFileMetaLocal(file: any): Promise<void> {
  try {
    const db = await getDB();
    const cleanMeta = { ...file };
    // Keep metadata lightweight by removing massive raw data URLs from the metadata store
    delete cleanMeta.fileDataUrl;
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(META_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(META_STORE_NAME);
      const request = store.put(cleanMeta);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Failed to save file metadata to IndexedDB:", err);
  }
}

export async function getAllFilesMetaLocal(): Promise<any[]> {
  try {
    const db = await getDB();
    return new Promise<any[]>((resolve, reject) => {
      const transaction = db.transaction(META_STORE_NAME, 'readonly');
      const store = transaction.objectStore(META_STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Failed to retrieve all file metadata from IndexedDB:", err);
    return [];
  }
}
