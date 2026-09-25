import { Note } from '../types/notes';
import { StorageAdapter, defaultStorageAdapter, imageStorageAdapter } from '../storage';

export interface NoteRepository {
  getAll(): Note[];
  getById(id: string): Note | null;
  getByTopicId(topicId: string): Note[];
  getBySubjectId(subjectId: string): Note[];
  create(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Note;
  update(note: Note): void;
  delete(id: string): void;
  saveAll(notes: Note[]): void;
}

const NOTES_STORAGE_KEY = 'notes';

export class LocalNoteRepository implements NoteRepository {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter = defaultStorageAdapter) {
    this.storage = storage;
  }

  getAll(): Note[] {
    return this.storage.getItem<Note[]>(NOTES_STORAGE_KEY) || [];
  }

  getById(id: string): Note | null {
    const notes = this.getAll();
    return notes.find((n) => n.id === id) || null;
  }

  getByTopicId(topicId: string): Note[] {
    const notes = this.getAll();
    return notes.filter((n) => n.topicId === topicId);
  }

  getBySubjectId(subjectId: string): Note[] {
    const notes = this.getAll();
    return notes.filter((n) => n.subjectId === subjectId);
  }

  create(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Note {
    const notes = this.getAll();
    const now = new Date().toISOString();

    const newNote: Note = {
      ...data,
      id: data.id || `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
      images: data.images || []
    };

    notes.unshift(newNote);
    this.storage.setItem(NOTES_STORAGE_KEY, notes);
    return newNote;
  }

  update(note: Note): void {
    const notes = this.getAll();
    const index = notes.findIndex((n) => n.id === note.id);

    if (index !== -1) {
      notes[index] = {
        ...note,
        updatedAt: new Date().toISOString()
      };
      this.storage.setItem(NOTES_STORAGE_KEY, notes);
    }
  }

  delete(id: string): void {
    const notes = this.getAll();
    const noteToDelete = notes.find((n) => n.id === id);

    // Limpieza de imágenes binarias asociadas en IndexedDB
    if (noteToDelete && noteToDelete.images) {
      noteToDelete.images.forEach((img) => {
        if (img.storageKey) {
          imageStorageAdapter.deleteImage(img.storageKey).catch((err) => {
            console.warn(`[NoteRepository] Error al limpiar imagen ${img.storageKey}:`, err);
          });
        }
      });
    }

    const filtered = notes.filter((n) => n.id !== id);
    this.storage.setItem(NOTES_STORAGE_KEY, filtered);
  }

  saveAll(notes: Note[]): void {
    this.storage.setItem(NOTES_STORAGE_KEY, notes);
  }
}

export const noteRepository = new LocalNoteRepository();
