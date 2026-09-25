import { PracticeActivity, PracticeAttempt } from '../domain/types';
import { StorageAdapter, defaultStorageAdapter } from '../../storage';

export interface IPracticeRepository {
  // Actividades
  getActivities(): PracticeActivity[];
  getActivityById(id: string): PracticeActivity | null;
  getActivitiesByTopicId(topicId: string): PracticeActivity[];
  getActivitiesByLessonId(lessonId: string): PracticeActivity[];
  saveActivity(activity: Omit<PracticeActivity, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): PracticeActivity;

  // Intentos
  getAttempts(): PracticeAttempt[];
  getAttemptById(id: string): PracticeAttempt | null;
  getAttemptsByActivityId(activityId: string): PracticeAttempt[];
  saveAttempt(attempt: Omit<PracticeAttempt, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): PracticeAttempt;

  clear(): void;
}

export const PRACTICE_ACTIVITIES_KEY = 'practice_activities';
export const PRACTICE_ATTEMPTS_KEY = 'practice_attempts';

export class LocalPracticeRepository implements IPracticeRepository {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorageAdapter) {
    this.storage = storage;
  }

  getActivities(): PracticeActivity[] {
    return this.storage.getItem<PracticeActivity[]>(PRACTICE_ACTIVITIES_KEY) || [];
  }

  getActivityById(id: string): PracticeActivity | null {
    const list = this.getActivities();
    return list.find((a) => a.id === id) || null;
  }

  getActivitiesByTopicId(topicId: string): PracticeActivity[] {
    const list = this.getActivities();
    return list.filter((a) => a.topicId === topicId);
  }

  getActivitiesByLessonId(lessonId: string): PracticeActivity[] {
    const list = this.getActivities();
    return list.filter((a) => a.lessonId === lessonId);
  }

  saveActivity(activityData: Omit<PracticeActivity, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): PracticeActivity {
    const list = this.getActivities();
    const now = new Date().toISOString();

    const existingIndex = activityData.id
      ? list.findIndex((a) => a.id === activityData.id)
      : -1;

    let saved: PracticeActivity;

    if (existingIndex !== -1) {
      saved = {
        ...list[existingIndex],
        ...activityData,
        id: list[existingIndex].id,
        createdAt: list[existingIndex].createdAt
      };
      list[existingIndex] = saved;
    } else {
      saved = {
        ...activityData,
        id: activityData.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: activityData.createdAt || now
      };
      list.unshift(saved);
    }

    this.storage.setItem(PRACTICE_ACTIVITIES_KEY, list);
    return saved;
  }

  getAttempts(): PracticeAttempt[] {
    return this.storage.getItem<PracticeAttempt[]>(PRACTICE_ATTEMPTS_KEY) || [];
  }

  getAttemptById(id: string): PracticeAttempt | null {
    const list = this.getAttempts();
    return list.find((a) => a.id === id) || null;
  }

  getAttemptsByActivityId(activityId: string): PracticeAttempt[] {
    const list = this.getAttempts();
    return list.filter((a) => a.activityId === activityId);
  }

  saveAttempt(attemptData: Omit<PracticeAttempt, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): PracticeAttempt {
    const list = this.getAttempts();
    const now = new Date().toISOString();

    const saved: PracticeAttempt = {
      ...attemptData,
      id: attemptData.id || `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: attemptData.createdAt || now
    };

    list.unshift(saved);
    this.storage.setItem(PRACTICE_ATTEMPTS_KEY, list);
    return saved;
  }

  clear(): void {
    this.storage.removeItem(PRACTICE_ACTIVITIES_KEY);
    this.storage.removeItem(PRACTICE_ATTEMPTS_KEY);
  }
}

export const practiceRepository = new LocalPracticeRepository();
