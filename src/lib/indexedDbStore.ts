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

export async function saveFileLocal(fileId: string, fileDataUrl: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(fileDataUrl, fileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Failed to save file data to IndexedDB:", err);
  }
}

export async function getFileLocal(fileId: string): Promise<string | null> {
  try {
    const db = await getDB();
    return new Promise<string | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fileId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Failed to retrieve file data from IndexedDB:", err);
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
