import type { IncomingMessage, ServerResponse } from 'http';
import { handleClassroomRequest } from '../../../src/server/classroomCore';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const handled = handleClassroomRequest(req, res, '/api/auth/google-classroom');
  if (!handled && !res.headersSent) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'NOT_FOUND' }));
  }
}
