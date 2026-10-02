/**
 * Cliente Backend de la API de Google Classroom y OAuth 2.0
 * MAR - Agente Educativo (Solo Lectura y Mínimo Privilegio)
 */

import { ClassroomCourse, ClassroomCourseWork } from '../../../types/classroom';
import { ClassroomTokenStore, classroomTokenStore } from '../../auth/ClassroomTokenStore';

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
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private tokenStore: ClassroomTokenStore;

  constructor(config: ClassroomApiConfig = {}) {
    this.clientId = config.clientId || process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = config.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = config.redirectUri || process.env.GOOGLE_CLASSROOM_REDIRECT_URI || 'http://localhost:3000/api/auth/google-classroom/callback';
    this.tokenStore = config.tokenStore || classroomTokenStore;
  }

  public getAuthUrl(state: string, redirectUriOverride?: string): string {
    if (!this.clientId) {
      throw new Error('GOOGLE_CLIENT_ID no está configurado en las variables de entorno del servidor.');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
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
    if (!this.clientId || !this.clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no están configurados en el servidor.');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
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

    // Obtener información del usuario autenticado
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

    // Verificar si el token sigue vigente (con margen de 60 segundos)
    if (cred.expiryDate && Date.now() < cred.expiryDate - 60000) {
      return cred.accessToken;
    }

    // Si expiró y tenemos refresh token, refrescarlo
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
        // Algunos cursos pueden no tener permisos o tener el módulo desactivado, manejamos con gracia
        console.warn(`[ClassroomApiClient] No se pudo obtener tareas para el curso ${courseId}: ${res.status}`);
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
        console.warn('[ClassroomApiClient] Error al revocar token en Google:', err);
      }
    }
    return this.tokenStore.deleteCredential(studentId);
  }
}

export const classroomApiClient = new ClassroomApiClient();
