import type { IncomingMessage, ServerResponse } from 'http';
import { handleClassroomRequest } from '../src/server/routes/classroomViteMiddleware';

/**
 * Serverless function handler for Google Classroom endpoints
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = req.url || '/api/classroom/status';
  const handled = handleClassroomRequest(req, res, url);
  if (!handled) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'NOT_FOUND' }));
  }
}
