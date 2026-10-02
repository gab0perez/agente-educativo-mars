/**
 * Almacén Seguro de Credenciales y Tokens de Google Classroom en el Servidor (Node.js)
 * MAR - Agente Educativo
 * 
 * NUNCA almacena ni expone tokens en el frontend / localStorage.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface StoredStudentCredential {
  studentId: string;
  googleUserId: string;
  email: string;
  displayName: string;
  pictureUrl?: string;
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  scopes: string[];
  connectedAt: string;
  lastSyncedAt?: string;
}

const TOKENS_FILE_PATH = path.resolve(process.cwd(), '.mar-tokens.json');

export class ClassroomTokenStore {
  private inMemoryStore: Map<string, StoredStudentCredential> = new Map();

  constructor() {
    this.loadFromFile();
  }

  private loadFromFile(): void {
    try {
      if (fs.existsSync(TOKENS_FILE_PATH)) {
        const raw = fs.readFileSync(TOKENS_FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          data.forEach((cred: StoredStudentCredential) => {
            if (cred && cred.studentId) {
              this.inMemoryStore.set(cred.studentId, cred);
            }
          });
        }
      }
    } catch (error) {
      console.warn('[ClassroomTokenStore] No se pudo leer el archivo de tokens, usando almacén en memoria:', error);
    }
  }

  private persistToFile(): void {
    try {
      const items = Array.from(this.inMemoryStore.values());
      fs.writeFileSync(TOKENS_FILE_PATH, JSON.stringify(items, null, 2), 'utf-8');
    } catch (error) {
      console.warn('[ClassroomTokenStore] No se pudo persistir tokens a disco:', error);
    }
  }

  public saveCredential(cred: StoredStudentCredential): void {
    this.inMemoryStore.set(cred.studentId, cred);
    this.persistToFile();
  }

  public getCredential(studentId: string = 'mar-default'): StoredStudentCredential | null {
    return this.inMemoryStore.get(studentId) || null;
  }

  public updateLastSynced(studentId: string = 'mar-default'): void {
    const cred = this.inMemoryStore.get(studentId);
    if (cred) {
      cred.lastSyncedAt = new Date().toISOString();
      this.persistToFile();
    }
  }

  public updateAccessToken(studentId: string, accessToken: string, expiryDate?: number): void {
    const cred = this.inMemoryStore.get(studentId);
    if (cred) {
      cred.accessToken = accessToken;
      if (expiryDate) cred.expiryDate = expiryDate;
      this.persistToFile();
    }
  }

  public deleteCredential(studentId: string = 'mar-default'): boolean {
    const existed = this.inMemoryStore.delete(studentId);
    if (existed) {
      this.persistToFile();
    }
    return existed;
  }

  public getPublicStatus(studentId: string = 'mar-default'): {
    isConnected: boolean;
    email?: string;
    displayName?: string;
    pictureUrl?: string;
    lastSyncedAt?: string;
  } {
    const cred = this.inMemoryStore.get(studentId);
    if (!cred) {
      return { isConnected: false };
    }
    return {
      isConnected: true,
      email: cred.email,
      displayName: cred.displayName,
      pictureUrl: cred.pictureUrl,
      lastSyncedAt: cred.lastSyncedAt
    };
  }
}

export const classroomTokenStore = new ClassroomTokenStore();
