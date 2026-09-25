import { AIContextPayload } from '../domain/types';
import { AIContextPayloadSchema } from '../domain/schemas';
import {
  ContextBuilderInput,
  ContextBuilderOptions,
  IContextBuilder
} from './contextTypes';
import {
  consolidateKeyConcepts,
  extractStudentReflection,
  sanitizeText,
  selectNotesContext,
  sliceConversationHistory
} from './contextPolicy';

export const DEFAULT_CONTEXT_BUILDER_OPTIONS: Required<ContextBuilderOptions> = {
  maxCharacters: 4000,
  maxConversationTurns: 4,
  maxRelevantNotes: 3,
  maxNoteExtractChars: 500,
  maxHistoryTurnChars: 300
};

/**
 * Constructor de Contexto de MAR IA
 * Transforma datos académicos y aportaciones de Mar en un AIContextPayload mínimo,
 * sanitizado, determinista y seguro.
 */
export class ContextBuilder implements IContextBuilder {
  private defaultOptions: Required<ContextBuilderOptions>;

  constructor(customDefaults?: Partial<ContextBuilderOptions>) {
    this.defaultOptions = {
      ...DEFAULT_CONTEXT_BUILDER_OPTIONS,
      ...customDefaults
    };
  }

  /**
   * Construye un AIContextPayload validado a partir de los datos de entrada
   */
  build(input: ContextBuilderInput, options?: ContextBuilderOptions): AIContextPayload {
    const opts: Required<ContextBuilderOptions> = {
      ...this.defaultOptions,
      ...options
    };

    // 1. Identificación y Modo
    const sessionId = sanitizeText(input.sessionId || 'session-academic-active', 64);
    const pedagogicalMode = input.pedagogicalMode;
    const socraticHintLevel =
      pedagogicalMode === 'SOCRATIC' ? input.socraticHintLevel || 'HINT_1' : input.socraticHintLevel;

    const studentIntent =
      sanitizeText(input.studentIntent, 150) ||
      `Estudiar tema en modo ${pedagogicalMode.toLowerCase()}`;

    // 2. Contexto Académico Curricular (CETis 164)
    const academicCtx = input.academicContext;
    const subject = academicCtx?.subject;
    const topic = academicCtx?.topic;
    const lesson = academicCtx?.currentLesson;
    const section = academicCtx?.currentLessonSection;

    const academicContext = {
      subjectId: subject && 'id' in subject ? sanitizeText(subject.id, 64) : undefined,
      subjectName: subject && 'name' in subject ? sanitizeText(subject.name, 100) : undefined,
      topicId: topic && 'id' in topic ? sanitizeText(topic.id, 64) : undefined,
      topicName: topic && 'name' in topic ? sanitizeText(topic.name, 100) : undefined,
      unitNumber: academicCtx?.unitNumber,
      currentLessonStepTitle: section && 'title' in section
        ? sanitizeText(section.title, 120)
        : lesson && 'title' in lesson
        ? sanitizeText(lesson.title, 120)
        : undefined,
      keyConcepts: consolidateKeyConcepts(academicCtx, 6)
    };

    // 3. Material de Clase y Apuntes Seleccionados (Prioridad a activeNote, desduplicado)
    const notesContext = selectNotesContext(
      input.notesContext,
      opts.maxRelevantNotes,
      opts.maxNoteExtractChars
    );

    // 4. Contexto Visual Multimodal (Apunte seleccionado)
    let visualContext = undefined;
    if (input.visualContext) {
      visualContext = {
        sourceNoteId: sanitizeText(input.visualContext.sourceNoteId, 64),
        imageId: sanitizeText(input.visualContext.imageId, 64),
        mimeType: input.visualContext.mimeType,
        base64Data: input.visualContext.base64Data,
        provenance: input.visualContext.provenance,
        title: input.visualContext.title ? sanitizeText(input.visualContext.title, 100) : undefined,
        width: input.visualContext.width,
        height: input.visualContext.height,
        isUnreadable: input.visualContext.isUnreadable
      };
    }

    // 5. Aportaciones y Reflexiones de la Estudiante (USER_PROVIDED)
    const rawUtterance = input.studentInput?.latestUtterance || '';
    const latestUtterance = sanitizeText(rawUtterance, 1000) || 'Pregunta de estudio';

    const studentReflection = extractStudentReflection(
      input.studentInput?.studentReflection,
      600
    );

    const studentInput = {
      latestUtterance,
      studentReflection,
      confidenceSelfReport: input.studentInput?.confidenceSelfReport
    };

    // 6. Historial Conversacional Reciente (Ventana Deslizante de 3 a 5 turnos)
    const conversationHistory = sliceConversationHistory(
      input.conversationHistory,
      opts.maxConversationTurns,
      opts.maxHistoryTurnChars
    );

    // 7. Restricciones Epistemológicas de la Sesión
    const constraints = {
      maxTokens: input.constraints?.maxTokens ?? 1024,
      requireSocraticStep: input.constraints?.requireSocraticStep ?? (pedagogicalMode === 'SOCRATIC'),
      allowComplementaryExpansion: input.constraints?.allowComplementaryExpansion ?? true
    };

    // 8. Ensamble inicial del Payload
    const candidatePayload: AIContextPayload = {
      sessionId,
      pedagogicalMode,
      socraticHintLevel,
      studentIntent,
      academicContext,
      notesContext,
      visualContext,
      studentInput,
      conversationHistory,
      constraints
    };

    // 9. Validación formal contra el esquema Zod de TG11/TG12/TG17
    const validated = AIContextPayloadSchema.parse(candidatePayload);
    return validated as AIContextPayload;
  }

  /**
   * Método estático de conveniencia
   */
  static build(input: ContextBuilderInput, options?: ContextBuilderOptions): AIContextPayload {
    const builder = new ContextBuilder();
    return builder.build(input, options);
  }
}
