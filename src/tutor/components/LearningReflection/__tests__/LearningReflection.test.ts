import { describe, it, expect, beforeEach } from 'vitest';
import {
  LocalReflectionRepository,
  ReflectionRepository
} from '../../../../repositories/reflectionRepository';
import { LocalMARTutorClient } from '../../../client/LocalMARTutorClient';
import { MARTutorService } from '../../../../ai/tutor/MARTutorService';
import { MockTutorProvider } from '../../../../ai/providers/MockTutorProvider';
import { Subject, Topic } from '../../../../types/academic';
import { Lesson } from '../../../../types/lesson';
import { StorageAdapter } from '../../../../storage';

describe('TG18 — LearningReflection Logic & State Tests', () => {
  let mockStorageData: Record<string, any>;
  let mockStorage: StorageAdapter;
  let reflectionRepo: ReflectionRepository;
  let mockProvider: MockTutorProvider;
  let tutorService: MARTutorService;
  let client: LocalMARTutorClient;

  const sampleSubject: Subject = {
    id: 'rh-101',
    code: 'RH1',
    name: 'Gestión de Recursos Humanos',
    shortName: 'Recursos Humanos',
    description: 'Especialidad CETis 164',
    icon: '👥',
    topics: []
  };

  const sampleTopic: Topic = {
    id: 'tema-sinergia',
    subjectId: 'rh-101',
    name: 'Sinergia Organizacional',
    description: 'Cooperación en equipos',
    status: 'en_estudio',
    provenance: 'CLASS_ORIGIN'
  };

  const sampleLesson: Lesson = {
    id: 'leccion-01',
    subjectId: 'rh-101',
    subjectName: 'Recursos Humanos',
    topicId: 'tema-sinergia',
    topicName: 'Sinergia Organizacional',
    title: 'Lección 1: Fundamentos',
    description: 'Fundamentos de la lección',
    sections: []
  };

  beforeEach(() => {
    mockStorageData = {};
    mockStorage = {
      getItem: <T>(key: string): T | null => (mockStorageData[key] !== undefined ? mockStorageData[key] : null),
      setItem: <T>(key: string, val: T): void => {
        mockStorageData[key] = val;
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
    client = new LocalMARTutorClient({
      tutorService,
      initialAcademicContext: {
        subject: sampleSubject,
        topic: sampleTopic,
        lesson: sampleLesson
      }
    });
  });

  it('Guarda la reflexión en el repositorio con metadatos completos y procedencia USER_PROVIDED', () => {
    const saved = reflectionRepo.saveReflection({
      lessonId: sampleLesson.id,
      topicId: sampleTopic.id,
      topicName: sampleTopic.name,
      subjectId: sampleSubject.id,
      subjectName: sampleSubject.name,
      prompt: '¿Qué aprendiste hoy?',
      answer: 'Hoy aprendí que la sinergia multiplica el rendimiento.',
      provenance: 'USER_PROVIDED'
    });

    expect(saved.id).toBeDefined();
    expect(saved.provenance).toBe('USER_PROVIDED');
    expect(saved.answer).toBe('Hoy aprendí que la sinergia multiplica el rendimiento.');
    expect(saved.subjectName).toBe('Gestión de Recursos Humanos');
    expect(saved.topicName).toBe('Sinergia Organizacional');
  });

  it('Actualiza una reflexión existente si coincide el id o lessonId y blockId', () => {
    const r1 = reflectionRepo.saveReflection({
      lessonId: 'leccion-01',
      blockId: 'block-ref-1',
      prompt: '¿Qué aprendiste hoy?',
      answer: 'Primera versión'
    });

    const r2 = reflectionRepo.saveReflection({
      id: r1.id,
      lessonId: 'leccion-01',
      blockId: 'block-ref-1',
      prompt: '¿Qué aprendiste hoy?',
      answer: 'Segunda versión mejorada'
    });

    expect(r2.id).toBe(r1.id);
    expect(r2.answer).toBe('Segunda versión mejorada');
    expect(reflectionRepo.getAll().length).toBe(1);
  });

  it('El tutor responde en modo REVIEW entregando retroalimentación cualitativa cálida', async () => {
    client.setAcademicContext({
      subject: sampleSubject,
      topic: sampleTopic,
      studentReflectionText: 'Aprendí sobre el impacto de la comunicación en equipos'
    });

    const response = await client.sendMessage('Aprendí sobre el impacto de la comunicación en equipos', {
      mode: 'REVIEW',
      studentIntent: 'Reflexión de aprendizaje'
    });

    expect(response.sender).toBe('tutor');
    expect(response.mode).toBe('REVIEW');
    expect(response.text).toContain('🌸');
    expect(response.suggestedActions?.length).toBeGreaterThan(0);
  });

  it('No introduce Base64 ni datos binarios en la reflexión guardada', () => {
    const saved = reflectionRepo.saveReflection({
      topicId: sampleTopic.id,
      prompt: '¿Qué aprendiste hoy?',
      answer: 'Texto puro sin imágenes',
      provenance: 'USER_PROVIDED'
    });

    expect(saved.answer).not.toContain('data:image');
    expect(saved.answer).not.toContain('base64');
  });

  it('Permite consultar el historial de reflexiones asociadas a un tema', () => {
    reflectionRepo.saveReflection({
      topicId: sampleTopic.id,
      prompt: '¿Qué aprendiste hoy?',
      answer: 'Reflexión de ayer'
    });

    reflectionRepo.saveReflection({
      topicId: sampleTopic.id,
      prompt: '¿Qué aprendiste hoy?',
      answer: 'Reflexión de hoy'
    });

    const history = reflectionRepo.getByTopicId(sampleTopic.id);
    expect(history.length).toBe(2);
    expect(history[0].answer).toBe('Reflexión de hoy');
    expect(history[1].answer).toBe('Reflexión de ayer');
  });
});
