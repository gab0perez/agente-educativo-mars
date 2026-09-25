import { Reflection } from '../types/reflection';
import { StorageAdapter, defaultStorageAdapter } from '../storage';
import { ProvenanceOrigin } from '../types/provenance';

export interface ReflectionRepository {
  getAll(): Reflection[];
  getByLessonId(lessonId: string): Reflection[];
  getByTopicId(topicId: string): Reflection[];
  getBySubjectId(subjectId: string): Reflection[];
  getByLessonAndBlock(lessonId: string, blockId: string): Reflection | null;
  saveReflection(data: {
    id?: string;
    lessonId?: string;
    blockId?: string;
    subjectId?: string;
    subjectName?: string;
    topicId?: string;
    topicName?: string;
    prompt: string;
    answer: string;
    provenance?: ProvenanceOrigin;
  }): Reflection;
  clear(): void;
}

const REFLECTIONS_STORAGE_KEY = 'reflections';

export class LocalReflectionRepository implements ReflectionRepository {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorageAdapter) {
    this.storage = storage;
  }

  getAll(): Reflection[] {
    return this.storage.getItem<Reflection[]>(REFLECTIONS_STORAGE_KEY) || [];
  }

  getByLessonId(lessonId: string): Reflection[] {
    const reflections = this.getAll();
    return reflections.filter((r) => r.lessonId === lessonId);
  }

  getByTopicId(topicId: string): Reflection[] {
    const reflections = this.getAll();
    return reflections.filter((r) => r.topicId === topicId);
  }

  getBySubjectId(subjectId: string): Reflection[] {
    const reflections = this.getAll();
    return reflections.filter((r) => r.subjectId === subjectId);
  }

  getByLessonAndBlock(lessonId: string, blockId: string): Reflection | null {
    const reflections = this.getAll();
    return reflections.find((r) => r.lessonId === lessonId && r.blockId === blockId) || null;
  }

  saveReflection(data: {
    id?: string;
    lessonId?: string;
    blockId?: string;
    subjectId?: string;
    subjectName?: string;
    topicId?: string;
    topicName?: string;
    prompt: string;
    answer: string;
    provenance?: ProvenanceOrigin;
  }): Reflection {
    const reflections = this.getAll();
    const now = new Date().toISOString();

    // Si ya existe una reflexión para la misma lección y bloque, o mismo ID, se actualiza
    const existingIndex = reflections.findIndex(
      (r) =>
        (data.id && r.id === data.id) ||
        (data.blockId && data.lessonId && r.lessonId === data.lessonId && r.blockId === data.blockId)
    );

    let savedReflection: Reflection;

    if (existingIndex !== -1) {
      savedReflection = {
        ...reflections[existingIndex],
        subjectId: data.subjectId || reflections[existingIndex].subjectId,
        subjectName: data.subjectName || reflections[existingIndex].subjectName,
        topicId: data.topicId || reflections[existingIndex].topicId,
        topicName: data.topicName || reflections[existingIndex].topicName,
        prompt: data.prompt,
        answer: data.answer,
        provenance: data.provenance || reflections[existingIndex].provenance || 'USER_PROVIDED',
        updatedAt: now
      };
      reflections[existingIndex] = savedReflection;
    } else {
      savedReflection = {
        id: data.id || `reflection-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        lessonId: data.lessonId,
        blockId: data.blockId,
        subjectId: data.subjectId,
        subjectName: data.subjectName,
        topicId: data.topicId,
        topicName: data.topicName,
        prompt: data.prompt,
        answer: data.answer,
        provenance: data.provenance || 'USER_PROVIDED',
        createdAt: now,
        updatedAt: now
      };
      reflections.unshift(savedReflection);
    }

    this.storage.setItem(REFLECTIONS_STORAGE_KEY, reflections);
    return savedReflection;
  }

  clear(): void {
    this.storage.removeItem(REFLECTIONS_STORAGE_KEY);
  }
}

export const reflectionRepository = new LocalReflectionRepository();
