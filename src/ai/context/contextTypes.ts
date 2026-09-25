import {
  AIContextPayload,
  ContextualNoteSnippet,
  PedagogicalMode,
  RelevantConversationTurn,
  SocraticHintLevel,
  VisualStudyContext
} from '../domain/types';
import { Subject, Topic } from '../../types/academic';
import { Lesson, LessonSection } from '../../types/lesson';
import { Note } from '../../types/notes';
import { Reflection } from '../../types/reflection';

export interface ContextBuilderOptions {
  /**
   * Presupuesto máximo de caracteres para el contexto textual consolidado
   * @default 4000
   */
  maxCharacters?: number;

  /**
   * Cantidad máxima de turnos conversacionales recientes a incluir (ventana deslizante)
   * @default 4 (dentro del rango 3-5 establecido en TG11)
   */
  maxConversationTurns?: number;

  /**
   * Límite máximo de notas relevantes a incluir
   * @default 3
   */
  maxRelevantNotes?: number;

  /**
   * Máximo de caracteres por extracto de nota
   * @default 500
   */
  maxNoteExtractChars?: number;

  /**
   * Máximo de caracteres por mensaje de historial
   * @default 300
   */
  maxHistoryTurnChars?: number;
}

export interface AcademicContextInput {
  subject?: Subject | { id?: string; name?: string; code?: string };
  topic?: Topic | { id?: string; name?: string; description?: string };
  unitNumber?: number;
  currentLesson?: Lesson | { id?: string; title?: string; keyConcepts?: string[] };
  currentLessonSection?: LessonSection | { id?: string; title?: string; keyConcepts?: string[] };
  keyConcepts?: string[];
}

export interface NotesContextInput {
  activeNote?: Note | ContextualNoteSnippet;
  activeNoteId?: string;
  relevantNotes?: (Note | ContextualNoteSnippet)[];
}

export interface StudentInputData {
  latestUtterance: string;
  studentReflection?: string | Reflection;
  confidenceSelfReport?: 'high' | 'medium' | 'low';
}

export interface ContextBuilderInput {
  sessionId?: string;
  pedagogicalMode: PedagogicalMode;
  socraticHintLevel?: SocraticHintLevel;
  studentIntent?: string;

  academicContext?: AcademicContextInput;
  notesContext?: NotesContextInput;
  visualContext?: VisualStudyContext;
  studentInput: StudentInputData;
  conversationHistory?: RelevantConversationTurn[];
  constraints?: {
    maxTokens?: number;
    requireSocraticStep?: boolean;
    allowComplementaryExpansion?: boolean;
  };
}

export interface IContextBuilder {
  build(input: ContextBuilderInput, options?: ContextBuilderOptions): AIContextPayload;
}
