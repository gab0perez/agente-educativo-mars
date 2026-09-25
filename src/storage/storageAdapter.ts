/**
 * Interfaz de adaptador de persistencia para MAR
 * Permite desacoplar el dominio de la tecnología concreta (LocalStorage, IndexedDB, etc.)
 */
export interface StorageAdapter {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
  hasKey(key: string): boolean;
}
