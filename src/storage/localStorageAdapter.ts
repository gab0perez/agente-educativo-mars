import { StorageAdapter } from './storageAdapter';

export const MAR_STORAGE_PREFIX = 'mar:v1:';

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;
  private memoryFallback: Map<string, string>;

  constructor(prefix: string = MAR_STORAGE_PREFIX) {
    this.prefix = prefix;
    this.memoryFallback = new Map<string, string>();
  }

  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = `${this.prefix}__test__`;
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  getItem<T>(key: string): T | null {
    const fullKey = this.getFullKey(key);

    try {
      let rawData: string | null = null;

      if (this.isLocalStorageAvailable()) {
        rawData = window.localStorage.getItem(fullKey);
      } else {
        rawData = this.memoryFallback.get(fullKey) || null;
      }

      if (rawData === null || rawData === undefined) {
        return null;
      }

      return JSON.parse(rawData) as T;
    } catch (error) {
      console.warn(`[LocalStorageAdapter] Error al leer o deserializar la clave "${key}". Se retornará null.`, error);
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    const fullKey = this.getFullKey(key);

    try {
      const serialized = JSON.stringify(value);

      if (this.isLocalStorageAvailable()) {
        window.localStorage.setItem(fullKey, serialized);
      } else {
        this.memoryFallback.set(fullKey, serialized);
      }
    } catch (error) {
      console.error(`[LocalStorageAdapter] Error al guardar la clave "${key}".`, error);
    }
  }

  removeItem(key: string): void {
    const fullKey = this.getFullKey(key);

    try {
      if (this.isLocalStorageAvailable()) {
        window.localStorage.removeItem(fullKey);
      } else {
        this.memoryFallback.delete(fullKey);
      }
    } catch (error) {
      console.warn(`[LocalStorageAdapter] Error al remover la clave "${key}".`, error);
    }
  }

  hasKey(key: string): boolean {
    const fullKey = this.getFullKey(key);

    try {
      if (this.isLocalStorageAvailable()) {
        return window.localStorage.getItem(fullKey) !== null;
      }
      return this.memoryFallback.has(fullKey);
    } catch {
      return false;
    }
  }

  clear(): void {
    try {
      if (this.isLocalStorageAvailable()) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith(this.prefix)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => window.localStorage.removeItem(k));
      }
      this.memoryFallback.clear();
    } catch (error) {
      console.warn('[LocalStorageAdapter] Error al limpiar almacenamiento.', error);
    }
  }
}

export const defaultStorageAdapter = new LocalStorageAdapter();
