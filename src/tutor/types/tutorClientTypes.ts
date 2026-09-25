import {
  AITutorResponse,
  PedagogicalMode,
  RelevantConversationTurn,
  SocraticHintLevel,
  SocraticStep,
  SuggestedAction,
  VisualStudyContext
} from '../../ai/domain/types';
import { ProvenanceOrigin } from '../../types/provenance';
import { Subject, Topic } from '../../types/academic';
import { Lesson } from '../../types/lesson';
import { Note } from '../../types/notes';
import { Reflection } from '../../types/reflection';
import { AcademicContextSelection } from '../academic/academicContextTypes';

export * from '../academic/academicContextTypes';

/**
 * Representación de un mensaje individual en la sesión de interfaz del tutor
 */
export interface TutorClientMessage {
  id: string;
  sender: 'student' | 'tutor';
  timestamp: string;
  text: string;
  mode?: PedagogicalMode;
  provenance?: ProvenanceOrigin;
  socraticStep?: SocraticStep;
  comprehensionCheck?: {
    questionText: string;
    suggestedOptions?: string[];
  };
  exercise?: {
    title: string;
    instructions: string;
    hints: string[];
  };
  suggestedActions?: SuggestedAction[];
  isFallback?: boolean;
  isError?: boolean;
  rawResponse?: AITutorResponse;
}

/**
 * Contexto académico activo para la sesión de tutoría
 */
export interface TutorAcademicContext {
  subject?: Subject;
  topic?: Topic;
  lesson?: Lesson;
  activeNoteId?: string;
  selectedNotes?: Note[];
  visualContext?: VisualStudyContext;
  relevantReflections?: Reflection[];
  keyConcepts?: string[];
  studentReflectionText?: string;
}

/**
 * Opciones para el envío de un mensaje desde la UI
 */
export interface SendMessageOptions {
  mode?: PedagogicalMode;
  socraticHintLevel?: SocraticHintLevel;
  studentIntent?: string;
  includeVisualContext?: boolean; // Por defecto true si hay un apunte activo seleccionado
}

/**
 * Estado general de la sesión de tutoría en la capa de interfaz
 */
export type TutorSessionStatus =
  | 'idle'
  | 'loading_image'
  | 'processing_image'
  | 'analyzing_note'
  | 'sending'
  | 'success'
  | 'unreadable_image'
  | 'error';

export interface TutorClientSessionState {
  sessionId: string;
  status: TutorSessionStatus;
  messages: TutorClientMessage[];
  academicContext: TutorAcademicContext;
  lastError: string | null;
}

/**
 * Contrato de la capa de aplicación del Tutor (Boundary entre UI y Dominio de IA)
 */
export interface IMARTutorClient {
  /**
   * Envía un mensaje desde la interfaz y devuelve la respuesta formateada para la UI
   */
  sendMessage(text: string, options?: SendMessageOptions): Promise<TutorClientMessage>;

  /**
   * Obtiene el identificador de la sesión actual
   */
  getSessionId(): string;

  /**
   * Actualiza el contexto académico activo
   */
  setAcademicContext(context: TutorAcademicContext): void;

  /**
   * Actualiza el contexto académico a partir de una selección referencial (IDs)
   */
  setAcademicSelection(selection: AcademicContextSelection): void;

  /**
   * Obtiene el contexto académico activo
   */
  getAcademicContext(): TutorAcademicContext;

  /**
   * Obtiene el historial de conversación en formato del dominio
   */
  getConversationHistory(): RelevantConversationTurn[];

  /**
   * Reinicia la sesión en memoria
   */
  resetSession(): void;
}
