import { Subject, Topic } from '../../types/academic';
import { Lesson } from '../../types/lesson';
import { Note } from '../../types/notes';
import { Reflection } from '../../types/reflection';

/**
 * Selección referencial de contexto académico desde la interfaz o disparador de navegación
 */
export interface AcademicContextSelection {
  subjectId?: string;
  topicId?: string;
  lessonId?: string;
  selectedNoteIds?: string[];
  activeNoteId?: string;
  studentReflectionText?: string;
}

/**
 * Contexto académico resuelto a partir de los repositorios locales
 */
export interface ResolvedAcademicContext {
  subject?: Subject;
  topic?: Topic;
  lesson?: Lesson;
  selectedNotes: Note[];
  activeNote?: Note;
  relevantReflections: Reflection[];
  studentReflectionText?: string;
  keyConcepts: string[];
}
