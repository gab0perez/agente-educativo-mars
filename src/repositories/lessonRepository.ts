import { Lesson } from '../types/lesson';
import { StorageAdapter, defaultStorageAdapter } from '../storage';

export interface LessonRepository {
  getAll(): Lesson[];
  getById(id: string): Lesson | null;
  getByTopicId(topicId: string): Lesson | null;
  save(lesson: Lesson): void;
  saveAll(lessons: Lesson[]): void;
}

const LESSONS_STORAGE_KEY = 'lessons';

export class LocalLessonRepository implements LessonRepository {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorageAdapter) {
    this.storage = storage;
  }

  getAll(): Lesson[] {
    return this.storage.getItem<Lesson[]>(LESSONS_STORAGE_KEY) || [];
  }

  getById(id: string): Lesson | null {
    const lessons = this.getAll();
    return lessons.find((l) => l.id === id) || null;
  }

  getByTopicId(topicId: string): Lesson | null {
    const lessons = this.getAll();
    return lessons.find((l) => l.topicId === topicId) || null;
  }

  save(lesson: Lesson): void {
    const lessons = this.getAll();
    const index = lessons.findIndex((l) => l.id === lesson.id);

    if (index !== -1) {
      lessons[index] = lesson;
    } else {
      lessons.push(lesson);
    }

    this.storage.setItem(LESSONS_STORAGE_KEY, lessons);
  }

  saveAll(lessons: Lesson[]): void {
    this.storage.setItem(LESSONS_STORAGE_KEY, lessons);
  }
}

export const lessonRepository = new LocalLessonRepository();
