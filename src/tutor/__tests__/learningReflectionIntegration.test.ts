import { describe, it, expect, beforeEach } from 'vitest';
import { LocalMARTutorClient } from '../client/LocalMARTutorClient';
import { MARTutorService } from '../../ai/tutor/MARTutorService';
import { MockTutorProvider } from '../../ai/providers/MockTutorProvider';
import { ContextBuilder } from '../../ai/context/ContextBuilder';
import {
  LocalReflectionRepository,
  ReflectionRepository
} from '../../repositories/reflectionRepository';
import { Subject, Topic } from '../../types/academic';
import { Lesson } from '../../types/lesson';
import { StorageAdapter } from '../../storage';

describe('TG18 — Learning Reflection Integration & Pedagogical Flow', () => {
  let mockStorageData: Record<string, any>;
  let mockStorage: StorageAdapter;
  let reflectionRepo: ReflectionRepository;
  let mockProvider: MockTutorProvider;
  let tutorService: MARTutorService;
  let tutorClient: LocalMARTutorClient;

  const sampleSubject: Subject = {
    id: 'rh-101',
    code: 'RH1',
    name: 'Gestión de Recursos Humanos',
    shortName: 'Recursos Humanos',
    description: 'Fundamentos de administración de personal',
    icon: '👥',
    topics: []
  };

  const sampleTopic: Topic = {
    id: 'tema-sinergia-rh',
    subjectId: 'rh-101',
    name: 'Sinergia Organizacional',
    description: 'Integración colaborativa de equipos',
    status: 'en_estudio',
    provenance: 'CLASS_ORIGIN'
  };

  const sampleLesson: Lesson = {
    id: 'leccion-sinergia-01',
    subjectId: 'rh-101',
    subjectName: 'Recursos Humanos',
    topicId: 'tema-sinergia-rh',
    topicName: 'Sinergia Organizacional',
    title: 'Fundamentos de Sinergia',
    description: 'Fundamentos de Sinergia en RH',
    sections: []
  };

  beforeEach(() => {
    mockStorageData = {};
    mockStorage = {
      getItem: <T>(key: string): T | null => (mockStorageData[key] !== undefined ? mockStorageData[key] : null),
      setItem: <T>(key: string, value: T): void => {
        mockStorageData[key] = value;
      },
      removeItem: (key: string): void => {
        delete mockStorageData[key];
      },
      hasKey: (key: string): boolean => mockStorageData[key] !== undefined,
      clear: (): void => {
        mockStorageData = {};
      }
    };

    reflectionRepo = new LocalReflectionRepository(mockStorage);
    mockProvider = new MockTutorProvider({ simulatedDelayMs: 0 });
    tutorService = new MARTutorService({ provider: mockProvider });
    tutorClient = new LocalMARTutorClient({
      tutorService,
      initialAcademicContext: {
        subject: sampleSubject,
        topic: sampleTopic,
        lesson: sampleLesson
      }
    });
  });

  describe('1. Reflection Repository & Persistence', () => {
    it('Persiste una nueva reflexión de la estudiante con procedencia USER_PROVIDED', () => {
      const saved = reflectionRepo.saveReflection({
        subjectId: sampleSubject.id,
        subjectName: sampleSubject.name,
        topicId: sampleTopic.id,
        topicName: sampleTopic.name,
        lessonId: sampleLesson.id,
        prompt: '¿Qué aprendiste hoy?',
        answer: 'Hoy aprendí que la sinergia organizacional multiplica el impacto del trabajo en equipo.',
        provenance: 'USER_PROVIDED'
      });

      expect(saved.id).toBeDefined();
      expect(saved.provenance).toBe('USER_PROVIDED');
      expect(saved.answer).toContain('sinergia organizacional');
      expect(saved.subjectId).toBe('rh-101');
      expect(saved.topicId).toBe('tema-sinergia-rh');
      expect(saved.lessonId).toBe('leccion-sinergia-01');
      expect(saved.createdAt).toBeDefined();
    });

    it('Recupera reflexiones por lección, tema y materia', () => {
      reflectionRepo.saveReflection({
        subjectId: 'rh-101',
        topicId: 'tema-sinergia-rh',
        lessonId: 'leccion-sinergia-01',
        prompt: '¿Qué aprendiste hoy?',
        answer: 'Reflexión 1 de la lección'
      });

      reflectionRepo.saveReflection({
        subjectId: 'rh-101',
        topicId: 'tema-sinergia-rh',
        prompt: '¿Qué aprendiste hoy?',
        answer: 'Reflexión general del tema sin lección'
      });

      expect(reflectionRepo.getByLessonId('leccion-sinergia-01').length).toBe(1);
      expect(reflectionRepo.getByTopicId('tema-sinergia-rh').length).toBe(2);
      expect(reflectionRepo.getBySubjectId('rh-101').length).toBe(2);
      expect(reflectionRepo.getAll().length).toBe(2);
    });

    it('Mantiene la persistencia después de instanciar un nuevo ReflectionRepository sobre el mismo storage', () => {
      reflectionRepo.saveReflection({
        subjectId: 'rh-101',
        topicId: 'tema-sinergia-rh',
        prompt: '¿Qué aprendiste hoy?',
        answer: 'Persistencia garantizada'
      });

      const newRepoInstance = new LocalReflectionRepository(mockStorage);
      const retrieved = newRepoInstance.getByTopicId('tema-sinergia-rh');

      expect(retrieved.length).toBe(1);
      expect(retrieved[0].answer).toBe('Persistencia garantizada');
    });
  });

  describe('2. Pedagogical Feedback & Qualitative Interaction', () => {
    it('Caso 1: Reflexión clara — Entrega feedback pedagógico cualitativo sin calificaciones numéricas ni mastery', async () => {
      const studentText = 'Hoy aprendí que la sinergia en Recursos Humanos une talentos para optimizar la organización.';

      tutorClient.setAcademicContext({
        subject: sampleSubject,
        topic: sampleTopic,
        lesson: sampleLesson,
        studentReflectionText: studentText
      });

      const response = await tutorClient.sendMessage(studentText, {
        mode: 'REVIEW',
        studentIntent: 'Reflexión de aprendizaje'
      });

      expect(response.sender).toBe('tutor');
      expect(response.mode).toBe('REVIEW');
      expect(response.text).toContain('🌸');
      expect(response.text).toContain('Excelente reflexión');
      expect(response.provenance).toBe('AI_COMPLEMENTARY');

      // Reglas estrictas: No contener porcentajes, calificaciones ni niveles de dominio escolar
      expect(response.text).not.toMatch(/\d+%/);
      expect(response.text).not.toMatch(/calificación|puntuación|ranking|score|nivel avanzado|nivel insuficiente/i);
    });

    it('Caso 2: Reflexión parcialmente clara — Ofrece orientación constructiva y sugerencias de ampliación', async () => {
      const studentText = 'Hoy entendí más o menos una parte de cómo se coordinan los recursos.';

      tutorClient.setAcademicContext({
        subject: sampleSubject,
        topic: sampleTopic,
        studentReflectionText: studentText
      });

      const response = await tutorClient.sendMessage(studentText, {
        mode: 'REVIEW',
        studentIntent: 'Reflexión de aprendizaje parcial'
      });

      expect(response.text).toContain('🌸');
      expect(response.text).toContain('Vas por una muy buena idea');
      expect(response.text).toContain('podemos profundizar');
      expect(response.text).not.toMatch(/\d+%/);
    });

    it('Caso 3: Reflexión que expresa duda — Provee contención pedagógica cálida sin penalizaciones', async () => {
      const studentText = 'Tengo una duda, me resultó un poco confuso entender cómo se aplica la sinergia en una empresa.';

      tutorClient.setAcademicContext({
        subject: sampleSubject,
        topic: sampleTopic,
        studentReflectionText: studentText
      });

      const response = await tutorClient.sendMessage(studentText, {
        mode: 'REVIEW',
        studentIntent: 'Reflexión con dudas'
      });

      expect(response.text).toContain('🌸');
      expect(response.text).toContain('normal tener dudas');
      expect(response.text).toContain('repasemos juntos');
      expect(response.text).not.toMatch(/reprobad|incorrecto|fallaste/i);
    });

    it('Caso 4: Manejo de error de proveedor — El tutor entrega mensaje seguro y la reflexión permanece a salvo', async () => {
      // Guardar primero en repo
      const saved = reflectionRepo.saveReflection({
        subjectId: sampleSubject.id,
        topicId: sampleTopic.id,
        prompt: '¿Qué aprendiste hoy?',
        answer: 'Mi reflexión que no debe perderse ante errores',
        provenance: 'USER_PROVIDED'
      });

      // Simular fallo en proveedor de IA
      mockProvider.setConfig({
        shouldFail: true,
        failureError: new Error('Error temporal de conexión con el servicio')
      });

      const strictService = new MARTutorService({
        provider: mockProvider,
        useFallbackOnError: false
      });
      const failingClient = new LocalMARTutorClient({ tutorService: strictService });

      const response = await failingClient.sendMessage('Mi reflexión que no debe perderse');

      expect(response.isError).toBe(true);
      expect(response.text).toContain('Lo siento');

      // Verificar que los datos en el repositorio no sufrieron daño
      const retrieved = reflectionRepo.getByTopicId(sampleTopic.id);
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].id).toBe(saved.id);
      expect(retrieved[0].answer).toBe('Mi reflexión que no debe perderse ante errores');
    });
  });

  describe('3. ContextBuilder & Privacy Guarantees', () => {
    it('Incorpora la reflexión en studentInput.studentReflection sanitizada sin filtrar Base64 ni datos sensibles', () => {
      const rawReflection = 'Aprendí sobre sinergia en C:\\Users\\Mar\\secret_notes.txt con API AIzaSyFakeApiKey123456789012345678901234567';

      const payload = ContextBuilder.build({
        sessionId: 'test-session-reflection',
        pedagogicalMode: 'REVIEW',
        academicContext: {
          subject: sampleSubject,
          topic: sampleTopic,
          currentLesson: sampleLesson
        },
        studentInput: {
          latestUtterance: rawReflection,
          studentReflection: rawReflection
        }
      });

      expect(payload.pedagogicalMode).toBe('REVIEW');
      expect(payload.academicContext.topicName).toBe('Sinergia Organizacional');
      expect(payload.academicContext.subjectName).toBe('Gestión de Recursos Humanos');
      expect(payload.studentInput.studentReflection).toBeDefined();

      // Sanitización activa
      expect(payload.studentInput.studentReflection).not.toContain('C:\\Users');
      expect(payload.studentInput.studentReflection).not.toContain('AIzaSyFakeApiKey');
      expect(payload.studentInput.studentReflection).toContain('[ruta_local_oculta]');
      expect(payload.studentInput.studentReflection).toContain('[api_key_oculta]');

      // Garantía TG17: No hay Base64 inyectado accidentalmente en el payload de texto
      expect(payload.visualContext).toBeUndefined();
    });
  });
});
