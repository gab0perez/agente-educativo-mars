import type { IncomingMessage, ServerResponse } from 'http';
import * as fs from 'fs';
import * as path from 'path';

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

class ClassroomTokenStore {
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
    } catch {
      // Fallback seguro a memoria
    }
  }

  private persistToFile(): void {
    try {
      const items = Array.from(this.inMemoryStore.values());
      fs.writeFileSync(TOKENS_FILE_PATH, JSON.stringify(items, null, 2), 'utf-8');
    } catch {
      // Fallback seguro a memoria
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

const tokenStore = new ClassroomTokenStore();

const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

class ClassroomApiClient {
  public get clientId(): string {
    return process.env.GOOGLE_CLIENT_ID || '';
  }

  public get clientSecret(): string {
    return process.env.GOOGLE_CLIENT_SECRET || '';
  }

  public getAuthUrl(state: string, redirectUri: string): string {
    const clientId = this.clientId;
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID no está configurado en las variables de entorno de Vercel.');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: CLASSROOM_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  public async exchangeCode(code: string, redirectUri: string) {
    const clientId = this.clientId;
    const clientSecret = this.clientSecret;
    if (!clientId || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no configurados.');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Google OAuth error: ${tokenResponse.status} ${errorText}`);
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
      throw new Error('No se pudo obtener información del perfil de Google.');
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
    const cred = tokenStore.getCredential(studentId);
    if (!cred) {
      throw new Error('No hay una cuenta de Google Classroom conectada.');
    }

    if (cred.expiryDate && Date.now() < cred.expiryDate - 60000) {
      return cred.accessToken;
    }

    if (!cred.refreshToken) {
      throw new Error('La sesión ha expirado y no hay refresh token. Vuelve a conectar tu cuenta.');
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
      throw new Error('Error al refrescar token de Google.');
    }

    const refreshData = await refreshResponse.json();
    const newAccessToken = refreshData.access_token;
    const expiresIn = refreshData.expires_in || 3600;
    const newExpiry = Date.now() + expiresIn * 1000;

    tokenStore.updateAccessToken(studentId, newAccessToken, newExpiry);
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
        throw new Error(`Google Classroom API error: ${res.status}`);
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
    const cred = tokenStore.getCredential(studentId);
    if (cred && cred.accessToken) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(cred.accessToken)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
      } catch {
        // revocado silencioso
      }
    }
    return tokenStore.deleteCredential(studentId);
  }
}

const apiClient = new ClassroomApiClient();

/**
 * Handler universal para endpoints de Google Classroom
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'agente-educativo-mars.vercel.app';
    const protocol = (req.headers['x-forwarded-proto'] as string) || (host.includes('localhost') ? 'http' : 'https');
    const rawUrl = req.url || '';

    const parsedUrl = new URL(rawUrl, `${protocol}://${host}`);
    const pathname = parsedUrl.pathname;
    const action = parsedUrl.searchParams.get('action') || '';

    const redirectUri =
      process.env.GOOGLE_CLASSROOM_REDIRECT_URI || `${protocol}://${host}/api/auth/google-classroom/callback`;

    // 1. Iniciar OAuth
    if (
      action === 'auth' ||
      pathname === '/api/auth/google-classroom' ||
      pathname === '/api/auth/google-classroom/' ||
      (rawUrl.includes('/api/auth/google-classroom') && !rawUrl.includes('/callback'))
    ) {
      try {
        const state = `mar-state-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const url = apiClient.getAuthUrl(state, redirectUri);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ url, state }));
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Error al generar URL de autorización';
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'AUTH_URL_ERROR', message: msg }));
      }
      return;
    }

    // 2. Callback OAuth
    if (action === 'callback' || pathname.includes('/api/auth/google-classroom/callback') || rawUrl.includes('/callback')) {
      const code = parsedUrl.searchParams.get('code');
      const errorParam = parsedUrl.searchParams.get('error');

      if (errorParam) {
        res.writeHead(302, { Location: `/?classroom_error=${encodeURIComponent(errorParam)}#tasks` });
        res.end();
        return;
      }

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h3>Error: Código de autorización no proporcionado por Google.</h3>');
        return;
      }

      try {
        const { accessToken, refreshToken, expiryDate, scopes, userInfo } = await apiClient.exchangeCode(code, redirectUri);
        tokenStore.saveCredential({
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
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h3>Error al vincular Google Classroom:</h3><p>${err?.message || err}</p>`);
      }
      return;
    }

    // 3. Estado de Conexión
    if (action === 'status' || pathname.includes('/status') || rawUrl.includes('/status')) {
      const status = tokenStore.getPublicStatus('mar-default');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status));
      return;
    }

    // 4. Sincronización Real
    if ((action === 'sync' || pathname.includes('/sync') || rawUrl.includes('/sync')) && req.method === 'POST') {
      try {
        const accessToken = await apiClient.getValidAccessToken('mar-default');
        const courses = await apiClient.fetchRealCourses(accessToken);
        const allCourseWork: Array<{ courseId: string; courseWork: any[] }> = [];

        for (const course of courses) {
          try {
            const courseWork = await apiClient.fetchRealCourseWork(accessToken, course.id);
            allCourseWork.push({ courseId: course.id, courseWork });
          } catch {
            // Continuar con los demás cursos
          }
        }

        tokenStore.updateLastSynced('mar-default');
        const now = new Date().toISOString();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            courses,
            allCourseWork,
            syncedAt: now
          })
        );
      } catch (err: any) {
        const status = String(err?.message || '').includes('No hay una cuenta') ? 401 : 500;
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'SYNC_ERROR', message: err?.message || err }));
      }
      return;
    }

    // 5. Desconexión
    if ((action === 'disconnect' || pathname.includes('/disconnect') || rawUrl.includes('/disconnect')) && req.method === 'POST') {
      try {
        await apiClient.disconnect('mar-default');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'DISCONNECT_ERROR', message: err?.message || err }));
      }
      return;
    }

    // Ruta por defecto: Estado
    const defaultStatus = tokenStore.getPublicStatus('mar-default');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(defaultStatus));
  } catch (globalErr: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'INTERNAL_SERVER_ERROR', message: globalErr?.message || String(globalErr) }));
  }
}
