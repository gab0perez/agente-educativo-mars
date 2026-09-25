import { Subject } from '../types/academic';
import { StorageAdapter, defaultStorageAdapter } from '../storage';

export interface SubjectRepository {
  getAll(): Subject[];
  getById(id: string): Subject | null;
  create(subject: Subject): void;
  update(subject: Subject): void;
  saveAll(subjects: Subject[]): void;
}

const SUBJECTS_STORAGE_KEY = 'subjects';

export class LocalSubjectRepository implements SubjectRepository {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorageAdapter) {
    this.storage = storage;
  }

  getAll(): Subject[] {
    return this.storage.getItem<Subject[]>(SUBJECTS_STORAGE_KEY) || [];
  }

  getById(id: string): Subject | null {
    const subjects = this.getAll();
    return subjects.find((s) => s.id === id) || null;
  }

  create(subject: Subject): void {
    const subjects = this.getAll();
    if (!subjects.some((s) => s.id === subject.id)) {
      subjects.push(subject);
      this.storage.setItem(SUBJECTS_STORAGE_KEY, subjects);
    }
  }

  update(subject: Subject): void {
    const subjects = this.getAll();
    const index = subjects.findIndex((s) => s.id === subject.id);
    if (index !== -1) {
      subjects[index] = subject;
      this.storage.setItem(SUBJECTS_STORAGE_KEY, subjects);
    }
  }

  saveAll(subjects: Subject[]): void {
    this.storage.setItem(SUBJECTS_STORAGE_KEY, subjects);
  }
}

export const subjectRepository = new LocalSubjectRepository();
