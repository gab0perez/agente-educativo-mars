import { LearningEvidence, EvidenceSource } from '../domain/types';
import { StorageAdapter, defaultStorageAdapter } from '../../storage';

export interface ILearningEvidenceRepository {
  getAll(): LearningEvidence[];
  getById(id: string): LearningEvidence | null;
  getByTopicId(topicId: string): LearningEvidence[];
  getBySubjectId(subjectId: string): LearningEvidence[];
  getByLessonId(lessonId: string): LearningEvidence[];
  getBySource(source: EvidenceSource): LearningEvidence[];
  getByReferenceId(referenceId: string): LearningEvidence[];
  save(evidence: Omit<LearningEvidence, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): LearningEvidence;
  clear(): void;
}

export const EVIDENCE_STORAGE_KEY = 'learning_evidences';

export class LocalLearningEvidenceRepository implements ILearningEvidenceRepository {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorageAdapter) {
    this.storage = storage;
  }

  getAll(): LearningEvidence[] {
    return this.storage.getItem<LearningEvidence[]>(EVIDENCE_STORAGE_KEY) || [];
  }

  getById(id: string): LearningEvidence | null {
    const list = this.getAll();
    return list.find((e) => e.id === id) || null;
  }

  getByTopicId(topicId: string): LearningEvidence[] {
    const list = this.getAll();
    return list.filter((e) => e.topicId === topicId);
  }

  getBySubjectId(subjectId: string): LearningEvidence[] {
    const list = this.getAll();
    return list.filter((e) => e.subjectId === subjectId);
  }

  getByLessonId(lessonId: string): LearningEvidence[] {
    const list = this.getAll();
    return list.filter((e) => e.lessonId === lessonId);
  }

  getBySource(source: EvidenceSource): LearningEvidence[] {
    const list = this.getAll();
    return list.filter((e) => e.source === source);
  }

  getByReferenceId(referenceId: string): LearningEvidence[] {
    const list = this.getAll();
    return list.filter((e) => e.sourceReferenceId === referenceId);
  }

  save(evidenceData: Omit<LearningEvidence, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): LearningEvidence {
    const list = this.getAll();
    const now = new Date().toISOString();

    const existingIndex = evidenceData.id
      ? list.findIndex((e) => e.id === evidenceData.id)
      : -1;

    let saved: LearningEvidence;

    if (existingIndex !== -1) {
      saved = {
        ...list[existingIndex],
        ...evidenceData,
        id: list[existingIndex].id,
        createdAt: list[existingIndex].createdAt
      };
      list[existingIndex] = saved;
    } else {
      saved = {
        ...evidenceData,
        id: evidenceData.id || `evidence-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: evidenceData.createdAt || now
      };
      list.unshift(saved);
    }

    this.storage.setItem(EVIDENCE_STORAGE_KEY, list);
    return saved;
  }

  clear(): void {
    this.storage.removeItem(EVIDENCE_STORAGE_KEY);
  }
}

export const learningEvidenceRepository = new LocalLearningEvidenceRepository();
