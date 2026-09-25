import { ReviewItem } from '../domain/types';
import { StorageAdapter, defaultStorageAdapter } from '../../storage';

export interface IReviewRepository {
  getAll(): ReviewItem[];
  getById(id: string): ReviewItem | null;
  getPending(): ReviewItem[];
  getByTopicId(topicId: string): ReviewItem[];
  getBySubjectId(subjectId: string): ReviewItem[];
  save(item: Omit<ReviewItem, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): ReviewItem;
  markCompleted(id: string): ReviewItem | null;
  remove(id: string): void;
  clear(): void;
}

export const REVIEW_STORAGE_KEY = 'review_items';

export class LocalReviewRepository implements IReviewRepository {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorageAdapter) {
    this.storage = storage;
  }

  getAll(): ReviewItem[] {
    return this.storage.getItem<ReviewItem[]>(REVIEW_STORAGE_KEY) || [];
  }

  getById(id: string): ReviewItem | null {
    const list = this.getAll();
    return list.find((r) => r.id === id) || null;
  }

  getPending(): ReviewItem[] {
    const list = this.getAll();
    return list.filter((r) => !r.completedAt);
  }

  getByTopicId(topicId: string): ReviewItem[] {
    const list = this.getAll();
    return list.filter((r) => r.topicId === topicId);
  }

  getBySubjectId(subjectId: string): ReviewItem[] {
    const list = this.getAll();
    return list.filter((r) => r.subjectId === subjectId);
  }

  save(itemData: Omit<ReviewItem, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): ReviewItem {
    const list = this.getAll();
    const now = new Date().toISOString();

    // 1. Buscar si ya existe por ID
    let existingIndex = itemData.id
      ? list.findIndex((r) => r.id === itemData.id)
      : -1;

    // 2. Si no se encontró por ID, buscar si ya existe un item PENDIENTE idéntico (mismo topicId, reason y recommendedActivity)
    if (existingIndex === -1 && itemData.topicId) {
      existingIndex = list.findIndex(
        (r) =>
          !r.completedAt &&
          r.topicId === itemData.topicId &&
          r.reason === itemData.reason &&
          r.recommendedActivity === itemData.recommendedActivity
      );
    }

    let saved: ReviewItem;

    if (existingIndex !== -1) {
      saved = {
        ...list[existingIndex],
        ...itemData,
        id: list[existingIndex].id,
        createdAt: list[existingIndex].createdAt
      };
      list[existingIndex] = saved;
    } else {
      saved = {
        ...itemData,
        id: itemData.id || `review-${itemData.topicId}-${itemData.reason?.toLowerCase() || 'item'}-${Date.now()}`,
        createdAt: itemData.createdAt || now
      };
      list.unshift(saved);
    }

    this.storage.setItem(REVIEW_STORAGE_KEY, list);
    return saved;
  }

  markCompleted(id: string): ReviewItem | null {
    const list = this.getAll();
    const index = list.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const updated: ReviewItem = {
      ...list[index],
      completedAt: new Date().toISOString()
    };
    list[index] = updated;
    this.storage.setItem(REVIEW_STORAGE_KEY, list);
    return updated;
  }

  remove(id: string): void {
    const list = this.getAll();
    const filtered = list.filter((r) => r.id !== id);
    this.storage.setItem(REVIEW_STORAGE_KEY, filtered);
  }

  clear(): void {
    this.storage.removeItem(REVIEW_STORAGE_KEY);
  }
}

export const reviewRepository = new LocalReviewRepository();
