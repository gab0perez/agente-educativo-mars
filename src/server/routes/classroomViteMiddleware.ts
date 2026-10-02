/**
 * Middleware para rutas de Google Classroom en Vite Dev Server (Node.js)
 * MAR - Agente Educativo
 */

import { IncomingMessage, ServerResponse } from 'http';
import { classroomApiClient } from '../integrations/google/ClassroomApiClient';
import { classroomTokenStore } from '../auth/ClassroomTokenStore';

export function handleClassroomRequest(req: IncomingMessage, res: ServerResponse, urlString: string): boolean {
  const parsedUrl = new URL(urlString, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = parsedUrl.pathname;

  // 1. Iniciar OAuth: GET /api/auth/google-classroom
  if (pathname === '/api/auth/google-classroom' && req.method === 'GET') {
    try {
      const state = `mar-state-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const url = classroomApiClient.getAuthUrl(state);
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
  if (pathname === '/api/auth/google-classroom/callback' && req.method === 'GET') {
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
      .exchangeCode(code)
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

        // Redirigir a la app con éxito
        res.writeHead(302, { Location: '/?classroom=connected#tasks' });
        res.end();
      })
      .catch((err) => {
        console.error('[ClassroomMiddleware] Error en callback OAuth:', err);
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h3>Error al vincular cuenta de Google Classroom:</h3><p>${err.message}</p>`);
      });

    return true;
  }

  // 3. Estado de Conexión: GET /api/classroom/status
  if (pathname === '/api/classroom/status' && req.method === 'GET') {
    const status = classroomTokenStore.getPublicStatus('mar-default');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status));
    return true;
  }

  // 4. Sincronización Real: POST /api/classroom/sync
  if (pathname === '/api/classroom/sync' && req.method === 'POST') {
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
            console.warn(`Error al obtener coursework para ${course.id}:`, err);
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
        console.error('[ClassroomMiddleware] Error en sync:', err);
        const status = err.message.includes('No hay una cuenta') ? 401 : 500;
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'SYNC_ERROR', message: err.message }));
      });

    return true;
  }

  // 5. Desconexión: POST /api/classroom/disconnect
  if (pathname === '/api/classroom/disconnect' && req.method === 'POST') {
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
