import { describe, it, expect, beforeEach } from 'vitest';
import { AcademicContextResolver } from '../AcademicContextResolver';
import {
  LocalSubjectRepository,
  LocalTopicRepository,
  LocalLessonRepository,
  LocalNoteRepository,
  LocalReflectionRepository
} from '../../../repositories';
import { Subject } from '../../../types/academic';
import { Lesson } from '../../../types/lesson';
import { Note } from '../../../types/notes';
import { Reflection } from '../../../types/reflection';

describe('TG16 — AcademicContextResolver Unit Tests', () => {
  let resolver: AcademicContextResolver;
  let subjectRepo: LocalSubjectRepository;
  let topicRepo: LocalTopicRepository;
  let lessonRepo: LocalLessonRepository;
  let noteRepo: LocalNoteRepository;
  let reflectionRepo: LocalReflectionRepository;

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
        title: 'Introducción',
        blocks: [
          {
            id: 'b-1',
            type: 'paragraph',
            content: 'La sinergia representa el trabajo conjunto.'
          },
          {
            id: 'b-2',
            type: 'keyPoint',
            title: 'Cooperación activa',
            content: 'Efecto multiplicador del trabajo conjunto.'
          }
        ]
      }
    ]
  };

  const sampleNote: Note = {
    id: 'note-01',
    subjectId: 'ciencias-3',
    subjectName: 'Ciencias Naturales III',
    topicId: 'tema-sinergia',
    topicName: 'Sinergia',
    title: 'Apunte en clase de Sinergia',
    content: 'El todo es mayor que la suma de sus partes',
    provenance: 'CLASS_ORIGIN',
    createdAt: '2026-09-25T12:00:00.000Z',
    updatedAt: '2026-09-25T12:00:00.000Z',
    images: []
  };

  const sampleReflection: Reflection = {
    id: 'ref-01',
    lessonId: 'leccion-sinergia',
    blockId: 'b-ref',
    prompt: '¿Dónde has visto sinergia en tu vida diaria?',
    answer: 'En el trabajo en equipo de la escuela',
    createdAt: '2026-09-25T12:00:00.000Z',
    updatedAt: '2026-09-25T12:00:00.000Z'
  };

  beforeEach(() => {
    mockStorage.clear();
    mockStorage.setItem('subjects', [sampleSubject]);
    mockStorage.setItem('lessons', [sampleLesson]);
    mockStorage.setItem('notes', [sampleNote]);
    mockStorage.setItem('reflections', [sampleReflection]);

    subjectRepo = new LocalSubjectRepository(mockStorage);
    topicRepo = new LocalTopicRepository(subjectRepo);
    lessonRepo = new LocalLessonRepository(mockStorage);
    noteRepo = new LocalNoteRepository(mockStorage);
    reflectionRepo = new LocalReflectionRepository(mockStorage);

    resolver = new AcademicContextResolver({
      subjectRepo,
      topicRepo,
      lessonRepo,
      noteRepo,
      reflectionRepo
    });
  });

  it('Test 1: Resuelve correctamente materia, tema y lección a partir de topicId', () => {
    const result = resolver.resolve({ topicId: 'tema-sinergia' });

    expect(result.topic?.name).toBe('Sinergia');
    expect(result.subject?.name).toBe('Ciencias Naturales III');
    expect(result.lesson?.title).toBe('Fundamentos de la Sinergia');
    expect(result.keyConcepts).toContain('Sinergia');
    expect(result.keyConcepts).toContain('Cooperación activa');
  });

  it('Test 2: Resuelve notas explícitas seleccionadas por ID conservando su provenance', () => {
    const result = resolver.resolve({
      subjectId: 'ciencias-3',
      selectedNoteIds: ['note-01']
    });

    expect(result.selectedNotes.length).toBe(1);
    expect(result.selectedNotes[0].id).toBe('note-01');
    expect(result.selectedNotes[0].provenance).toBe('CLASS_ORIGIN');
    expect(result.activeNote?.id).toBe('note-01');
  });

  it('Test 3: Resuelve reflexiones previas asociadas a la lección seleccionada', () => {
    const result = resolver.resolve({ lessonId: 'leccion-sinergia' });

    expect(result.lesson?.id).toBe('leccion-sinergia');
    expect(result.relevantReflections.length).toBe(1);
    expect(result.relevantReflections[0].answer).toBe('En el trabajo en equipo de la escuela');
  });

  it('Test 4: Maneja de forma segura selecciones vacías o con IDs inexistentes sin inventar información', () => {
    const result = resolver.resolve({
      subjectId: 'no-existe',
      topicId: 'no-existe-tema'
    });

    expect(result.subject).toBeUndefined();
    expect(result.topic).toBeUndefined();
    expect(result.lesson).toBeUndefined();
    expect(result.selectedNotes.length).toBe(0);
    expect(result.keyConcepts.length).toBe(0);
  });

  it('Test 5: Conserva el texto de reflexión de la estudiante cuando se suministra en la selección', () => {
    const result = resolver.resolve({
      topicId: 'tema-sinergia',
      studentReflectionText: 'Tengo duda de cómo se aplica a Recursos Humanos'
    });

    expect(result.studentReflectionText).toBe('Tengo duda de cómo se aplica a Recursos Humanos');
  });
});
