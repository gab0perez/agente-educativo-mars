import { describe, it, expect, beforeEach } from 'vitest';
import { LocalMARTutorClient } from '../client/LocalMARTutorClient';
import { MARTutorService } from '../../ai/tutor/MARTutorService';
import { MockTutorProvider } from '../../ai/providers/MockTutorProvider';
import { AcademicContextResolver } from '../academic/AcademicContextResolver';
import {
  LocalSubjectRepository,
  LocalTopicRepository,
  LocalLessonRepository,
  LocalNoteRepository,
  LocalReflectionRepository
} from '../../repositories';
import { Subject } from '../../types/academic';
import { Lesson } from '../../types/lesson';
import { Note } from '../../types/notes';

describe('TG16 — Academic Context Integration Tests', () => {
  let mockProvider: MockTutorProvider;
  let tutorService: MARTutorService;
  let client: LocalMARTutorClient;
  let resolver: AcademicContextResolver;

  const mockStorage: any = {
    data: {} as Record<string, any>,
    getItem: (key: string) => mockStorage.data[key] || null,
    setItem: (key: string, val: any) => {
      mockStorage.data[key] = val;
    },
    removeItem: (key: string) => {
      delete mockStorage.data[key];
    },
    clear: () => {
      mockStorage.data = {};
    }
  };

  const sampleSubject: Subject = {
    id: 'ciencias-3',
    code: 'CN3',
    name: 'Ciencias Naturales III',
    shortName: 'Ciencias III',
    description: 'Ecosistemas y sinergia',
    icon: '🌱',
    topics: [
      {
        id: 'tema-sinergia',
        subjectId: 'ciencias-3',
        name: 'Sinergia',
        description: 'Cooperación biológica',
        status: 'en_estudio',
        provenance: 'CLASS_ORIGIN'
      },
      {
        id: 'tema-entropia',
        subjectId: 'ciencias-3',
        name: 'Entropía',
        description: 'Desorden termodinámico',
        status: 'nuevo',
        provenance: 'CLASS_ORIGIN'
      }
    ]
  };

  const sampleLesson: Lesson = {
    id: 'leccion-sinergia',
    topicId: 'tema-sinergia',
    subjectId: 'ciencias-3',
    subjectName: 'Ciencias Naturales III',
    topicName: 'Sinergia',
    title: 'Fundamentos de la Sinergia',
    description: 'Lección interactiva de sinergia',
    sections: [
      {
        id: 'sec-1',
        stepNumber: 1,
        title: 'Introducción a Sinergia',
        blocks: [
          {
            id: 'b-1',
            type: 'keyPoint',
            title: 'Efecto multiplicador',
            content: 'El resultado conjunto supera la suma de las partes.'
          }
        ]
      }
    ]
  };

  const sampleNote: Note = {
    id: 'note-sinergia-01',
    subjectId: 'ciencias-3',
    subjectName: 'Ciencias Naturales III',
    topicId: 'tema-sinergia',
    topicName: 'Sinergia',
    title: 'Apunte manuscrito de clase',
    content: '1 + 1 > 2 en sistemas biológicos',
    provenance: 'CLASS_ORIGIN',
    createdAt: '2026-09-25T12:00:00.000Z',
    updatedAt: '2026-09-25T12:00:00.000Z',
    images: []
  };

  beforeEach(() => {
    mockStorage.clear();
    mockStorage.setItem('subjects', [sampleSubject]);
    mockStorage.setItem('lessons', [sampleLesson]);
    mockStorage.setItem('notes', [sampleNote]);

    const subjectRepo = new LocalSubjectRepository(mockStorage);
    const topicRepo = new LocalTopicRepository(subjectRepo);
    const lessonRepo = new LocalLessonRepository(mockStorage);
    const noteRepo = new LocalNoteRepository(mockStorage);
    const reflectionRepo = new LocalReflectionRepository(mockStorage);

    resolver = new AcademicContextResolver({
      subjectRepo,
      topicRepo,
      lessonRepo,
      noteRepo,
      reflectionRepo
    });

    mockProvider = new MockTutorProvider({ simulatedDelayMs: 0 });
    tutorService = new MARTutorService({ provider: mockProvider });
    client = new LocalMARTutorClient({
      tutorService,
      academicResolver: resolver
    });
  });

  it('Test 1: Inicializa el cliente a partir de una selección referencial (IDs) y resuelve los datos académicos', () => {
    client.setAcademicSelection({
      subjectId: 'ciencias-3',
      topicId: 'tema-sinergia',
      selectedNoteIds: ['note-sinergia-01']
    });

    const ctx = client.getAcademicContext();
    expect(ctx.subject?.name).toBe('Ciencias Naturales III');
    expect(ctx.topic?.name).toBe('Sinergia');
    expect(ctx.lesson?.title).toBe('Fundamentos de la Sinergia');
    expect(ctx.selectedNotes?.length).toBe(1);
    expect(ctx.selectedNotes?.[0].title).toBe('Apunte manuscrito de clase');
    expect(ctx.keyConcepts).toContain('Sinergia');
    expect(ctx.keyConcepts).toContain('Efecto multiplicador');
  });

  it('Test 2: Envía mensaje con contexto académico enriquecido y recibe respuesta pedagógica congruente', async () => {
    client.setAcademicSelection({
      topicId: 'tema-sinergia'
    });

    const response = await client.sendMessage('Explícame este tema', { mode: 'EXPLAIN' });

    expect(response).toBeDefined();
    expect(response.sender).toBe('tutor');
    expect(response.mode).toBe('EXPLAIN');
    expect(response.provenance).toBe('AI_COMPLEMENTARY');
    expect(response.text).toContain('Explicación');
  });

  it('Test 3: Al cambiar de tema explícitamente, actualiza el contexto sin mezclar temas anteriores', () => {
    client.setAcademicSelection({ topicId: 'tema-sinergia' });
    expect(client.getAcademicContext().topic?.name).toBe('Sinergia');

    // Cambiar a entropía
    client.setAcademicSelection({ topicId: 'tema-entropia' });
    const newCtx = client.getAcademicContext();

    expect(newCtx.topic?.name).toBe('Entropía');
    expect(newCtx.lesson).toBeUndefined(); // Entropía no tiene lección asociada
  });

  it('Test 4: Respeta la procedencia de apuntes de clase sin falsificarla como verdad absoluta', () => {
    client.setAcademicSelection({
      topicId: 'tema-sinergia',
      selectedNoteIds: ['note-sinergia-01']
    });

    const notes = client.getAcademicContext().selectedNotes;
    expect(notes?.[0].provenance).toBe('CLASS_ORIGIN');
  });

  it('Test 5: Flujo completo integrado: Selección -> Resolver -> Client -> Service -> ContextBuilder -> Response -> UI', async () => {
    client.setAcademicSelection({
      subjectId: 'ciencias-3',
      topicId: 'tema-sinergia',
      studentReflectionText: 'Quiero aplicarlo a mi proyecto de clase'
    });

    const response = await client.sendMessage('Dame un ejemplo', { mode: 'EXAMPLE' });

    expect(response.id).toBeDefined();
    expect(response.mode).toBe('EXAMPLE');
    expect(response.suggestedActions?.length).toBeGreaterThan(0);
    expect(JSON.stringify(response)).not.toContain('AIzaSy');
  });
});
