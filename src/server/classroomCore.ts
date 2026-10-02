/**
 * Core unificado de Google Classroom para Backend (Node.js / Vite / Vercel Serverless)
 * MAR - Agente Educativo
 */

import * as fs from 'fs';
import * as path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  alternateLink?: string;
  courseState?: string;
}

export interface ClassroomCourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  alternateLink?: string;
  dueDate?: { year?: number; month?: number; day?: number };
  dueTime?: { hours?: number; minutes?: number; seconds?: number };
  maxPoints?: number;
  state?: string;
}

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

const TOKENS_FILE_PATH =
  process.env.VERCEL || process.env.NODE_ENV === 'production'
    ? path.resolve('/tmp', '.mar-tokens.json')
    : path.resolve(process.cwd(), '.mar-tokens.json');

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
      console.warn('[ClassroomTokenStore] No se pudo leer tokens:', error);
    }
  }

  private persistToFile(): void {
    try {
      const items = Array.from(this.inMemoryStore.values());
      fs.writeFileSync(TOKENS_FILE_PATH, JSON.stringify(items, null, 2), 'utf-8');
    } catch (error) {
      console.warn('[ClassroomTokenStore] Fallback a memoria:', error);
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

export const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export interface ClassroomApiConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  tokenStore?: ClassroomTokenStore;
}

export class ClassroomApiClient {
  private customClientId?: string;
  private customClientSecret?: string;
  private customRedirectUri?: string;
  private tokenStore: ClassroomTokenStore;

  constructor(config: ClassroomApiConfig = {}) {
    this.customClientId = config.clientId;
    this.customClientSecret = config.clientSecret;
    this.customRedirectUri = config.redirectUri;
    this.tokenStore = config.tokenStore || classroomTokenStore;
  }

  public get clientId(): string {
    return this.customClientId || process.env.GOOGLE_CLIENT_ID || '';
  }

  public get clientSecret(): string {
    return this.customClientSecret || process.env.GOOGLE_CLIENT_SECRET || '';
  }

  public get redirectUri(): string {
    return this.customRedirectUri || process.env.GOOGLE_CLASSROOM_REDIRECT_URI || 'http://localhost:3000/api/auth/google-classroom/callback';
  }

  public getAuthUrl(state: string, redirectUriOverride?: string): string {
    const clientId = this.clientId;
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID no está configurado en las variables de entorno del servidor.');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUriOverride || this.redirectUri,
      response_type: 'code',
      scope: CLASSROOM_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  public async exchangeCode(code: string, redirectUriOverride?: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiryDate: number;
    scopes: string[];
    userInfo: { id: string; email: string; name: string; picture?: string };
  }> {
    const clientId = this.clientId;
    const clientSecret = this.clientSecret;
    if (!clientId || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no están configurados en el servidor.');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUriOverride || this.redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Error al intercambiar código con Google OAuth: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 3600;
    const expiryDate = Date.now() + expiresIn * 1000;
    const scopes = tokenData.scope ? tokenData.scope.split(' ') : CLASSROOM_SCOPES;

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userInfoResponse.ok) {
      throw new Error('No se pudo obtener la información de perfil de Google del usuario.');
    }

    const userInfo = await userInfoResponse.json();

    return {
      accessToken,
      refreshToken,
      expiryDate,
      scopes,
      userInfo: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name || userInfo.email,
        picture: userInfo.picture
      }
    };
  }

  public async getValidAccessToken(studentId: string = 'mar-default'): Promise<string> {
    const cred = this.tokenStore.getCredential(studentId);
    if (!cred) {
      throw new Error('No hay una cuenta de Google Classroom conectada.');
    }

    if (cred.expiryDate && Date.now() < cred.expiryDate - 60000) {
      return cred.accessToken;
    }

    if (!cred.refreshToken) {
      throw new Error('La sesión de Google Classroom ha expirado y no hay refresh token. Por favor vuelve a conectar tu cuenta.');
    }

    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: cred.refreshToken,
        grant_type: 'refresh_token'
      }).toString()
    });

    if (!refreshResponse.ok) {
      const errText = await refreshResponse.text();
      throw new Error(`Error al refrescar token de Google: ${refreshResponse.status} ${errText}`);
    }

    const refreshData = await refreshResponse.json();
    const newAccessToken = refreshData.access_token;
    const expiresIn = refreshData.expires_in || 3600;
    const newExpiry = Date.now() + expiresIn * 1000;

    this.tokenStore.updateAccessToken(studentId, newAccessToken, newExpiry);
    return newAccessToken;
  }

  public async fetchRealCourses(accessToken: string): Promise<ClassroomCourse[]> {
    const courses: ClassroomCourse[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const url: string = `https://classroom.googleapis.com/v1/courses?studentId=me&courseStates=ACTIVE${
        pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''
      }`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        throw new Error(`Google Classroom API error al listar cursos: ${res.status} ${errorMsg}`);
      }

      const data = await res.json();
      if (data.courses && Array.isArray(data.courses)) {
        for (const raw of data.courses) {
          courses.push({
            id: raw.id,
            name: raw.name,
            section: raw.section,
            descriptionHeading: raw.descriptionHeading,
            alternateLink: raw.alternateLink,
            courseState: raw.courseState
          });
        }
      }

      pageToken = data.nextPageToken;
    } while (pageToken);

    return courses;
  }

  public async fetchRealCourseWork(accessToken: string, courseId: string): Promise<ClassroomCourseWork[]> {
    const courseWorkList: ClassroomCourseWork[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const url: string = `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/courseWork?courseWorkStates=PUBLISHED${
        pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''
      }`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!res.ok) {
        console.warn(`[ClassroomApiClient] No se pudo obtener tareas para curso ${courseId}: ${res.status}`);
        break;
      }

      const data = await res.json();
      if (data.courseWork && Array.isArray(data.courseWork)) {
        for (const raw of data.courseWork) {
          courseWorkList.push({
            id: raw.id,
            courseId: raw.courseId || courseId,
            title: raw.title,
            description: raw.description,
            alternateLink: raw.alternateLink,
            dueDate: raw.dueDate ? { year: raw.dueDate.year, month: raw.dueDate.month, day: raw.dueDate.day } : undefined,
            dueTime: raw.dueTime ? { hours: raw.dueTime.hours, minutes: raw.dueTime.minutes, seconds: raw.dueTime.seconds } : undefined,
            maxPoints: raw.maxPoints,
            state: raw.state
          });
        }
      }

      pageToken = data.nextPageToken;
    } while (pageToken);

    return courseWorkList;
  }

  public async disconnect(studentId: string = 'mar-default'): Promise<boolean> {
    const cred = this.tokenStore.getCredential(studentId);
    if (cred && cred.accessToken) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(cred.accessToken)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
      } catch (err) {
        console.warn('[ClassroomApiClient] Error al revocar token:', err);
      }
    }
    return this.tokenStore.deleteCredential(studentId);
  }
}

export const classroomApiClient = new ClassroomApiClient();

export function handleClassroomRequest(req: IncomingMessage, res: ServerResponse, urlString?: string): boolean {
  const rawUrl = urlString || req.url || '';
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost:3000';
  const protocol = (req.headers['x-forwarded-proto'] as string) || (host.includes('localhost') ? 'http' : 'https');
  const matchedPath = (req.headers['x-matched-path'] as string) || (req.headers['x-invoke-path'] as string) || '';

  const parsedUrl = new URL(rawUrl, `${protocol}://${host}`);
  const pathname = matchedPath || parsedUrl.pathname;

  const redirectUri =
    process.env.GOOGLE_CLASSROOM_REDIRECT_URI || `${protocol}://${host}/api/auth/google-classroom/callback`;

  // 1. Iniciar OAuth: GET /api/auth/google-classroom
  if (
    pathname === '/api/auth/google-classroom' ||
    pathname === '/api/auth/google-classroom/' ||
    rawUrl.includes('/api/auth/google-classroom') && !rawUrl.includes('/callback')
  ) {
    try {
      const state = `mar-state-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const url = classroomApiClient.getAuthUrl(state, redirectUri);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ url, state }));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al generar URL de autorización';
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'AUTH_URL_ERROR', message: msg }));
    }
    return true;
  }

  // 2. Callback OAuth: GET /api/auth/google-classroom/callback
  if (pathname.includes('/api/auth/google-classroom/callback') || rawUrl.includes('/callback')) {
    const code = parsedUrl.searchParams.get('code');
    const errorParam = parsedUrl.searchParams.get('error');

    if (errorParam) {
      res.writeHead(302, { Location: `/?classroom_error=${encodeURIComponent(errorParam)}#tasks` });
      res.end();
      return true;
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h3>Error: Código de autorización no proporcionado por Google.</h3>');
      return true;
    }

    classroomApiClient
      .exchangeCode(code, redirectUri)
      .then(({ accessToken, refreshToken, expiryDate, scopes, userInfo }) => {
        classroomTokenStore.saveCredential({
          studentId: 'mar-default',
          googleUserId: userInfo.id,
          email: userInfo.email,
          displayName: userInfo.name,
          pictureUrl: userInfo.picture,
          accessToken,
          refreshToken,
          expiryDate,
          scopes,
          connectedAt: new Date().toISOString()
        });

        res.writeHead(302, { Location: '/?classroom=connected#tasks' });
        res.end();
      })
      .catch((err) => {
        console.error('[ClassroomMiddleware] Error en callback:', err);
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h3>Error al vincular cuenta de Google Classroom:</h3><p>${err.message}</p>`);
      });

    return true;
  }

  // 3. Estado de Conexión: GET /api/classroom/status
  if (pathname.includes('/status') || rawUrl.includes('/status')) {
    const status = classroomTokenStore.getPublicStatus('mar-default');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status));
    return true;
  }

  // 4. Sincronización Real: POST /api/classroom/sync
  if ((pathname.includes('/sync') || rawUrl.includes('/sync')) && req.method === 'POST') {
    classroomApiClient
      .getValidAccessToken('mar-default')
      .then(async (accessToken) => {
        const courses = await classroomApiClient.fetchRealCourses(accessToken);
        const allCourseWork: Array<{ courseId: string; courseWork: any[] }> = [];

        for (const course of courses) {
          try {
            const courseWork = await classroomApiClient.fetchRealCourseWork(accessToken, course.id);
            allCourseWork.push({ courseId: course.id, courseWork });
          } catch (err) {
            console.warn(`Error coursework para ${course.id}:`, err);
          }
        }

        classroomTokenStore.updateLastSynced('mar-default');
        const now = new Date().toISOString();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            courses,
            allCourseWork,
            syncedAt: now
          })
        );
      })
      .catch((err) => {
        console.error('[ClassroomMiddleware] Error sync:', err);
        const status = err.message.includes('No hay una cuenta') ? 401 : 500;
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'SYNC_ERROR', message: err.message }));
      });

    return true;
  }

  // 5. Desconexión: POST /api/classroom/disconnect
  if ((pathname.includes('/disconnect') || rawUrl.includes('/disconnect')) && req.method === 'POST') {
    classroomApiClient
      .disconnect('mar-default')
      .then(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      })
      .catch((err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'DISCONNECT_ERROR', message: err.message }));
      });

    return true;
  }

  return false;
}
