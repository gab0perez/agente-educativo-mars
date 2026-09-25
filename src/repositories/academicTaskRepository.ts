import { AcademicTask, CreateTaskInput, UpdateTaskInput } from '../types/task';
import { StorageAdapter, defaultStorageAdapter } from '../storage';

export interface IAcademicTaskRepository {
  getAll(): AcademicTask[];
  getById(id: string): AcademicTask | null;
  getPending(): AcademicTask[];
  getCompleted(): AcademicTask[];
  getBySubject(subjectId: string): AcademicTask[];
  getByTopic(topicId: string): AcademicTask[];
  create(input: CreateTaskInput): AcademicTask;
  update(id: string, updates: UpdateTaskInput): AcademicTask | null;
  delete(id: string): boolean;
  markCompleted(id: string): AcademicTask | null;
  markPending(id: string): AcademicTask | null;
  clear(): void;
}

export const ACADEMIC_TASKS_STORAGE_KEY = 'academic_tasks';

export class LocalAcademicTaskRepository implements IAcademicTaskRepository {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorageAdapter) {
    this.storage = storage;
  }

  getAll(): AcademicTask[] {
    return this.storage.getItem<AcademicTask[]>(ACADEMIC_TASKS_STORAGE_KEY) || [];
  }

  getById(id: string): AcademicTask | null {
    const tasks = this.getAll();
    return tasks.find((t) => t.id === id) || null;
  }

  getPending(): AcademicTask[] {
    const tasks = this.getAll();
    return tasks.filter((t) => t.status === 'PENDING');
  }

  getCompleted(): AcademicTask[] {
    const tasks = this.getAll();
    return tasks.filter((t) => t.status === 'COMPLETED');
  }

  getBySubject(subjectId: string): AcademicTask[] {
    const tasks = this.getAll();
    return tasks.filter((t) => t.subjectId === subjectId);
  }

  getByTopic(topicId: string): AcademicTask[] {
    const tasks = this.getAll();
    return tasks.filter((t) => t.topicId === topicId);
  }

  create(input: CreateTaskInput): AcademicTask {
    const trimmedTitle = input.title?.trim();
    if (!trimmedTitle) {
      throw new Error('El título de la tarea académica es obligatorio.');
    }

    const tasks = this.getAll();
    const now = new Date().toISOString();

    const newTask: AcademicTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: trimmedTitle,
      description: input.description?.trim() || undefined,
      subjectId: input.subjectId || undefined,
      subjectName: input.subjectName || undefined,
      topicId: input.topicId || undefined,
      topicName: input.topicName || undefined,
      dueAt: input.dueAt || undefined,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now
    };

    tasks.unshift(newTask);
    this.storage.setItem(ACADEMIC_TASKS_STORAGE_KEY, tasks);
    return newTask;
  }

  update(id: string, updates: UpdateTaskInput): AcademicTask | null {
    const tasks = this.getAll();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      return null;
    }

    if (updates.title !== undefined) {
      const trimmed = updates.title.trim();
      if (!trimmed) {
        throw new Error('El título de la tarea académica no puede estar vacío.');
      }
      tasks[index].title = trimmed;
    }

    if (updates.description !== undefined) {
      tasks[index].description = updates.description ? updates.description.trim() : undefined;
    }

    if (updates.subjectId !== undefined) {
      tasks[index].subjectId = updates.subjectId || undefined;
    }

    if (updates.subjectName !== undefined) {
      tasks[index].subjectName = updates.subjectName || undefined;
    }

    if (updates.topicId !== undefined) {
      tasks[index].topicId = updates.topicId || undefined;
    }

    if (updates.topicName !== undefined) {
      tasks[index].topicName = updates.topicName || undefined;
    }

    if (updates.dueAt !== undefined) {
      tasks[index].dueAt = updates.dueAt || undefined;
    }

    if (updates.status !== undefined) {
      tasks[index].status = updates.status;
      if (updates.status === 'COMPLETED') {
        tasks[index].completedAt = new Date().toISOString();
      } else {
        delete tasks[index].completedAt;
      }
    }

    tasks[index].updatedAt = new Date().toISOString();
    this.storage.setItem(ACADEMIC_TASKS_STORAGE_KEY, tasks);
    return tasks[index];
  }

  delete(id: string): boolean {
    const tasks = this.getAll();
    const initialLen = tasks.length;
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length === initialLen) {
      return false;
    }
    this.storage.setItem(ACADEMIC_TASKS_STORAGE_KEY, filtered);
    return true;
  }

  markCompleted(id: string): AcademicTask | null {
    return this.update(id, { status: 'COMPLETED' });
  }

  markPending(id: string): AcademicTask | null {
    return this.update(id, { status: 'PENDING' });
  }

  clear(): void {
    this.storage.removeItem(ACADEMIC_TASKS_STORAGE_KEY);
  }
}

export const academicTaskRepository = new LocalAcademicTaskRepository();
