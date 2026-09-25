import { MasteryState } from '../domain/types';
import { StorageAdapter, defaultStorageAdapter } from '../../storage';

export interface IMasteryRepository {
  getAll(): MasteryState[];
  getById(id: string): MasteryState | null;
  getByTopicId(topicId: string): MasteryState[];
  getByTopicAndConcept(topicId: string, conceptId?: string): MasteryState | null;
  getBySubjectId(subjectId: string): MasteryState[];
  save(mastery: Omit<MasteryState, 'id' | 'updatedAt'> & { id?: string; updatedAt?: string }): MasteryState;
  clear(): void;
}

export const MASTERY_STORAGE_KEY = 'mastery_states';

export class LocalMasteryRepository implements IMasteryRepository {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorageAdapter) {
    this.storage = storage;
  }

  getAll(): MasteryState[] {
    return this.storage.getItem<MasteryState[]>(MASTERY_STORAGE_KEY) || [];
  }

  getById(id: string): MasteryState | null {
    const list = this.getAll();
    return list.find((m) => m.id === id) || null;
  }

  getByTopicId(topicId: string): MasteryState[] {
    const list = this.getAll();
    return list.filter((m) => m.topicId === topicId);
  }

  getByTopicAndConcept(topicId: string, conceptId?: string): MasteryState | null {
    const list = this.getAll();
    return (
      list.find(
        (m) =>
          m.topicId === topicId &&
          (conceptId ? m.conceptId === conceptId : !m.conceptId)
      ) || null
    );
  }

  getBySubjectId(subjectId: string): MasteryState[] {
    const list = this.getAll();
    return list.filter((m) => m.subjectId === subjectId);
  }

  save(masteryData: Omit<MasteryState, 'id' | 'updatedAt'> & { id?: string; updatedAt?: string }): MasteryState {
    const list = this.getAll();
    const now = new Date().toISOString();

    const existingIndex = list.findIndex((m) => {
      if (masteryData.id && m.id === masteryData.id) return true;
      return (
        m.topicId === masteryData.topicId &&
        (masteryData.conceptId
          ? m.conceptId === masteryData.conceptId
          : !m.conceptId)
      );
    });

    let saved: MasteryState;

    if (existingIndex !== -1) {
      saved = {
        ...list[existingIndex],
        ...masteryData,
        id: list[existingIndex].id,
        updatedAt: masteryData.updatedAt || now
      };
      list[existingIndex] = saved;
    } else {
      saved = {
        ...masteryData,
        id: masteryData.id || `mastery-${masteryData.topicId}${masteryData.conceptId ? `-${masteryData.conceptId}` : ''}`,
        updatedAt: masteryData.updatedAt || now
      };
      list.unshift(saved);
    }

    this.storage.setItem(MASTERY_STORAGE_KEY, list);
    return saved;
  }

  clear(): void {
    this.storage.removeItem(MASTERY_STORAGE_KEY);
  }
}

export const masteryRepository = new LocalMasteryRepository();
