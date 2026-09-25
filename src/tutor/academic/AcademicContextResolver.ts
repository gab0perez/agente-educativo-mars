import { AcademicContextSelection, ResolvedAcademicContext } from './academicContextTypes';
import {
  SubjectRepository,
  subjectRepository,
  TopicRepository,
  topicRepository,
  LessonRepository,
  lessonRepository,
  NoteRepository,
  noteRepository,
  ReflectionRepository,
  reflectionRepository
} from '../../repositories';
import { Subject, Topic } from '../../types/academic';
import { Lesson } from '../../types/lesson';
import { Note } from '../../types/notes';
import { Reflection } from '../../types/reflection';

export interface AcademicContextResolverDependencies {
  subjectRepo?: SubjectRepository;
  topicRepo?: TopicRepository;
  lessonRepo?: LessonRepository;
  noteRepo?: NoteRepository;
  reflectionRepo?: ReflectionRepository;
}

/**
 * Capa de resolución de contexto académico
 * Transforma referencias y selecciones (IDs) en entidades tipadas de dominio local
 */
export class AcademicContextResolver {
  private subjectRepo: SubjectRepository;
  private topicRepo: TopicRepository;
  private lessonRepo: LessonRepository;
  private noteRepo: NoteRepository;
  private reflectionRepo: ReflectionRepository;

  constructor(dependencies: AcademicContextResolverDependencies = {}) {
    this.subjectRepo = dependencies.subjectRepo || subjectRepository;
    this.topicRepo = dependencies.topicRepo || topicRepository;
    this.lessonRepo = dependencies.lessonRepo || lessonRepository;
    this.noteRepo = dependencies.noteRepo || noteRepository;
    this.reflectionRepo = dependencies.reflectionRepo || reflectionRepository;
  }

  /**
   * Resuelve una selección académica en entidades completas
   */
  resolve(selection: AcademicContextSelection = {}): ResolvedAcademicContext {
    let subject: Subject | undefined;
    let topic: Topic | undefined;
    let lesson: Lesson | undefined;

    // 1. Resolver Topic
    if (selection.topicId) {
      topic = this.topicRepo.getById(selection.topicId) || undefined;
    }

    // 2. Resolver Lesson
    if (selection.lessonId) {
      lesson = this.lessonRepo.getById(selection.lessonId) || undefined;
      if (!topic && lesson?.topicId) {
        topic = this.topicRepo.getById(lesson.topicId) || undefined;
      }
    } else if (topic) {
      lesson = this.lessonRepo.getByTopicId(topic.id) || undefined;
    }

    // 3. Resolver Subject
    if (selection.subjectId) {
      subject = this.subjectRepo.getById(selection.subjectId) || undefined;
    } else if (topic?.subjectId) {
      subject = this.subjectRepo.getById(topic.subjectId) || undefined;
    } else if (lesson?.subjectId) {
      subject = this.subjectRepo.getById(lesson.subjectId) || undefined;
    }

    // Si hay subject pero no topic, buscar el tema activo o el primero
    if (subject && !topic && subject.topics && subject.topics.length > 0) {
      topic = subject.topics.find((t) => t.status === 'en_estudio') || subject.topics[0];
      if (topic && !lesson) {
        lesson = this.lessonRepo.getByTopicId(topic.id) || undefined;
      }
    }

    // 4. Resolver Notas seleccionadas
    const selectedNotes: Note[] = [];
    if (selection.selectedNoteIds && selection.selectedNoteIds.length > 0) {
      for (const noteId of selection.selectedNoteIds) {
        const note = this.noteRepo.getById(noteId);
        if (note) {
          selectedNotes.push(note);
        }
      }
    } else if (topic) {
      // Si no se especificaron IDs particulares pero hay tema activo, recuperar notas del tema
      const topicNotes = this.noteRepo.getByTopicId(topic.id);
      selectedNotes.push(...topicNotes);
    }

    // 5. Resolver Nota Activa (Solo si fue explícitamente seleccionada)
    let activeNote: Note | undefined;
    if (selection.activeNoteId) {
      activeNote = this.noteRepo.getById(selection.activeNoteId) || undefined;
    } else if (selection.selectedNoteIds && selection.selectedNoteIds.length > 0 && selectedNotes.length > 0) {
      activeNote = selectedNotes[0];
    }

    // 6. Resolver Reflexiones relevantes
    const relevantReflections: Reflection[] = [];
    if (lesson) {
      const lessonReflections = this.reflectionRepo.getByLessonId(lesson.id);
      relevantReflections.push(...lessonReflections);
    } else if (topic) {
      const topicReflections = this.reflectionRepo.getByTopicId(topic.id);
      relevantReflections.push(...topicReflections);
    } else if (subject) {
      const subjectReflections = this.reflectionRepo.getBySubjectId(subject.id);
      relevantReflections.push(...subjectReflections);
    }

    // 7. Extraer y deduplicar Conceptos Clave
    const keyConceptsSet = new Set<string>();
    if (topic?.name) {
      keyConceptsSet.add(topic.name);
    }
    if (lesson?.sections) {
      lesson.sections.forEach((section) => {
        if (section.title) {
          keyConceptsSet.add(section.title);
        }
        if (section.blocks) {
          section.blocks.forEach((block) => {
            if (block.type === 'keyPoint' && block.title) {
              keyConceptsSet.add(block.title);
            }
          });
        }
      });
    }

    return {
      subject,
      topic,
      lesson,
      selectedNotes,
      activeNote,
      relevantReflections,
      studentReflectionText: selection.studentReflectionText,
      keyConcepts: Array.from(keyConceptsSet)
    };
  }
}

export const academicContextResolver = new AcademicContextResolver();
