/**
 * Adaptador de almacenamiento binario para imágenes de apuntes
 * Utiliza IndexedDB nativo del navegador para evitar saturar localStorage
 */

const DB_NAME = 'mar_image_db';
const DB_VERSION = 1;
const STORE_NAME = 'note_images';

export interface ImageStorageAdapter {
  saveImage(id: string, data: Blob | File | string): Promise<string>;
  getImage(id: string): Promise<Blob | string | null>;
  getImageUrl(id: string): Promise<string | null>;
  deleteImage(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  clear(): Promise<void>;
}

export class IndexedDBImageStorageAdapter implements ImageStorageAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryFallback = new Map<string, Blob | string>();

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB no está disponible en este entorno.'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        try {
          const request = window.indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME);
            }
          };

          request.onsuccess = () => {
            resolve(request.result);
          };

          request.onerror = () => {
            console.warn('[ImageStorage] Error al abrir IndexedDB, usando fallback en memoria.', request.error);
            reject(request.error);
          };
        } catch (err) {
          reject(err);
        }
      });
    }

    return this.dbPromise;
  }

  async saveImage(id: string, data: Blob | File | string): Promise<string> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(data, id);

        req.onsuccess = () => resolve(id);
        req.onerror = () => {
          console.warn('[ImageStorage] Error en put IndexedDB, guardando en memoria.');
          this.memoryFallback.set(id, data);
          resolve(id);
        };
      });
    } catch {
      this.memoryFallback.set(id, data);
      return id;
    }
  }

  async getImage(id: string): Promise<Blob | string | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => {
          const result = req.result;
          if (result !== undefined && result !== null) {
            resolve(result as Blob | string);
          } else {
            resolve(this.memoryFallback.get(id) || null);
          }
        };

        req.onerror = () => {
          resolve(this.memoryFallback.get(id) || null);
        };
      });
    } catch {
      return this.memoryFallback.get(id) || null;
    }
  }

  async getImageUrl(id: string): Promise<string | null> {
    const data = await this.getImage(id);
    if (!data) return null;

    if (typeof data === 'string') {
      return data;
    }

    if (data instanceof Blob) {
      return URL.createObjectURL(data);
    }

    return null;
  }

  async deleteImage(id: string): Promise<void> {
    this.memoryFallback.delete(id);

    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);

        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {
      // Ignorar silenciosamente si no hay DB
    }
  }

  async exists(id: string): Promise<boolean> {
    const data = await this.getImage(id);
    return data !== null;
  }

  async clear(): Promise<void> {
    this.memoryFallback.clear();

    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {
      // Ignorar si no hay DB
    }
  }
}

export const imageStorageAdapter = new IndexedDBImageStorageAdapter();
