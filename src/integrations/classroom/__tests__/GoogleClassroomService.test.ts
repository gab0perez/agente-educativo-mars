import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClassroomTokenStore } from '../../../server/auth/ClassroomTokenStore';
import { ClassroomApiClient, CLASSROOM_SCOPES } from '../../../server/integrations/google/ClassroomApiClient';
import { GoogleClassroomService } from '../GoogleClassroomService';
import { LocalStorageAdapter } from '../../../storage';
import { LocalAcademicTaskRepository } from '../../../repositories/academicTaskRepository';
import { LocalSubjectRepository } from '../../../repositories/subjectRepository';
import { MOCK_FIXTURE_COURSES, MOCK_FIXTURE_COURSEWORK } from './fixtures/mockClassroomFixture';

describe('Google Classroom — Arquitectura Real y Aislamiento de Tokens', () => {
  let tokenStore: ClassroomTokenStore;
  let apiClient: ClassroomApiClient;
  let storage: LocalStorageAdapter;
  let taskRepo: LocalAcademicTaskRepository;
  let subjectRepo: LocalSubjectRepository;
  let clientService: GoogleClassroomService;

  beforeEach(() => {
    tokenStore = new ClassroomTokenStore();
    tokenStore.deleteCredential('mar-default');

    apiClient = new ClassroomApiClient({
      clientId: 'mock-client-id.apps.googleusercontent.com',
      clientSecret: 'mock-client-secret',
      redirectUri: 'http://localhost:3000/api/auth/google-classroom/callback',
      tokenStore
    });

    storage = new LocalStorageAdapter('test:real_classroom:');
    storage.clear();
    taskRepo = new LocalAcademicTaskRepository(storage);
    subjectRepo = new LocalSubjectRepository(storage);

    clientService = new GoogleClassroomService({
      taskRepository: taskRepo,
      subjectRepository: subjectRepo
    });
  });

  describe('1. Scopes y Seguridad de OAuth 2.0', () => {
    it('debe solicitar exclusivamente los scopes de mínimo privilegio (solo lectura)', () => {
      expect(CLASSROOM_SCOPES).toEqual([
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]);
      // Ningún scope de escritura
      expect(CLASSROOM_SCOPES.some((s: string) => s.includes('modify') || s.includes('write'))).toBe(false);
    });

    it('genera la URL oficial de Google OAuth con parámetros de seguridad', () => {
      const url = apiClient.getAuthUrl('test-state-123');
      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=mock-client-id.apps.googleusercontent.com');
      expect(url).toContain('state=test-state-123');
      expect(url).toContain('access_type=offline');
      expect(url).toContain('prompt=consent');
    });
  });

  describe('2. Almacén de Credenciales en Servidor (Cero localStorage)', () => {
    it('almacena tokens en el servidor y solo expone estado público al cliente', () => {
      tokenStore.saveCredential({
        studentId: 'mar-default',
        googleUserId: 'google-user-999',
        email: 'mar.estudiante@escuela.edu.mx',
        displayName: 'Mar G.',
        accessToken: 'secret-access-token',
        refreshToken: 'secret-refresh-token',
        expiryDate: Date.now() + 3600000,
        scopes: CLASSROOM_SCOPES,
        connectedAt: new Date().toISOString()
      });

      const publicStatus = tokenStore.getPublicStatus('mar-default');
      expect(publicStatus.isConnected).toBe(true);
      expect(publicStatus.email).toBe('mar.estudiante@escuela.edu.mx');
      expect((publicStatus as any).accessToken).toBeUndefined();
      expect((publicStatus as any).refreshToken).toBeUndefined();

      // Verificar que en localStorage no hay tokens
      expect(storage.getItem('access_token')).toBeNull();
      expect(storage.getItem('refresh_token')).toBeNull();
    });
  });

  describe('3. Sincronización Real e Idempotencia en MAR', () => {
    it('normaliza cursos y tareas reales desde la respuesta de Google sin inventar datos', async () => {
      // Mock del endpoint backend /api/classroom/sync
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === '/api/classroom/sync') {
          return {
            ok: true,
            json: async () => ({
              courses: MOCK_FIXTURE_COURSES,
              allCourseWork: [
                { courseId: '101', courseWork: [MOCK_FIXTURE_COURSEWORK[0]] },
                { courseId: '102', courseWork: [MOCK_FIXTURE_COURSEWORK[1]] }
              ],
              syncedAt: new Date().toISOString()
            })
          };
        }
        return { ok: false };
      });

      const result = await clientService.syncNow();
      expect(result.coursesSynced).toBe(2);
      expect(result.tasksCreated).toBe(2);

      // Verificar que los subjects fueron creados con los nombres reales de Classroom
      const subjects = subjectRepo.getAll();
      expect(subjects.length).toBe(2);
      expect(subjects[0].name).toBe('Recursos Humanos');
      expect(subjects[1].name).toBe('Pensamiento Matemático');

      // Verificar tareas reales
      const tasks = taskRepo.getAll();
      expect(tasks.length).toBe(2);
      const rhTask = tasks.find((t) => t.classroomMetadata?.courseWorkId === '201');
      expect(rhTask).toBeDefined();
      expect(rhTask?.title).toBe('Investigación sobre Entrevistas Laborales');
      expect(rhTask?.subjectName).toBe('Recursos Humanos');
      expect(rhTask?.origin).toBe('GOOGLE_CLASSROOM');
    });

    it('es idempotente: una segunda sincronización actualiza sin duplicar tareas ni materias', async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url === '/api/classroom/sync') {
          return {
            ok: true,
            json: async () => ({
              courses: MOCK_FIXTURE_COURSES,
              allCourseWork: [
                { courseId: '101', courseWork: [MOCK_FIXTURE_COURSEWORK[0]] }
              ],
              syncedAt: new Date().toISOString()
            })
          };
        }
        return { ok: false };
      });

      // Primera sincronización
      const first = await clientService.syncNow();
      expect(first.tasksCreated).toBe(1);
      expect(first.tasksUpdated).toBe(0);
      expect(taskRepo.getAll().length).toBe(1);

      // Segunda sincronización
      const second = await clientService.syncNow();
      expect(second.tasksCreated).toBe(0);
      expect(second.tasksUpdated).toBe(1);
      expect(taskRepo.getAll().length).toBe(1);
    });
  });
});
