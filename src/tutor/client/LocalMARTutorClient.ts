import { IMARTutorService, MARTutorService, TutorRequest } from '../../ai/tutor';
import { RelevantConversationTurn, VisualStudyContext } from '../../ai/domain/types';
import { ImagePreprocessor, imagePreprocessor as defaultImagePreprocessor } from '../../ai/multimodal/ImagePreprocessor';
import { ImageStorageAdapter, imageStorageAdapter as defaultImageStorage } from '../../storage/imageStorageAdapter';
import {
  AcademicContextSelection,
  IMARTutorClient,
  SendMessageOptions,
  TutorAcademicContext,
  TutorClientMessage
} from '../types/tutorClientTypes';
import { AcademicContextResolver, academicContextResolver } from '../academic/AcademicContextResolver';

export interface LocalMARTutorClientOptions {
  tutorService?: IMARTutorService;
  academicResolver?: AcademicContextResolver;
  imageStorage?: ImageStorageAdapter;
  imagePreprocessor?: ImagePreprocessor;
  initialAcademicContext?: TutorAcademicContext;
  initialSelection?: AcademicContextSelection;
}

/**
 * Implementación local en memoria del cliente de tutoría de MAR
 * Desacopla la interfaz de React de la infraestructura de IA y orquestación
 */
export class LocalMARTutorClient implements IMARTutorClient {
  private tutorService: IMARTutorService;
  private academicResolver: AcademicContextResolver;
  private imageStorage: ImageStorageAdapter;
  private imagePreprocessor: ImagePreprocessor;
  private sessionId: string;
  private academicContext: TutorAcademicContext;
  private conversationHistory: RelevantConversationTurn[] = [];

  constructor(options: LocalMARTutorClientOptions = {}) {
    this.tutorService = options.tutorService || new MARTutorService();
    this.academicResolver = options.academicResolver || academicContextResolver;
    this.imageStorage = options.imageStorage || defaultImageStorage;
    this.imagePreprocessor = options.imagePreprocessor || defaultImagePreprocessor;
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (options.initialSelection) {
      const resolved = this.academicResolver.resolve(options.initialSelection);
      this.academicContext = {
        subject: resolved.subject,
        topic: resolved.topic,
        lesson: resolved.lesson,
        selectedNotes: resolved.selectedNotes,
        activeNoteId: resolved.activeNote?.id,
        relevantReflections: resolved.relevantReflections,
        studentReflectionText: resolved.studentReflectionText,
        keyConcepts: resolved.keyConcepts
      };
    } else {
      this.academicContext = options.initialAcademicContext || {};
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  setAcademicContext(context: TutorAcademicContext): void {
    // Si cambia el tema o materia principal, actualizar explícitamente el contexto
    this.academicContext = {
      ...this.academicContext,
      ...context
    };
  }

  setAcademicSelection(selection: AcademicContextSelection): void {
    const resolved = this.academicResolver.resolve(selection);
    this.academicContext = {
      subject: resolved.subject,
      topic: resolved.topic,
      lesson: resolved.lesson,
      selectedNotes: resolved.selectedNotes,
      activeNoteId: resolved.activeNote?.id,
      relevantReflections: resolved.relevantReflections,
      studentReflectionText: resolved.studentReflectionText,
      keyConcepts: resolved.keyConcepts
    };
  }

  getAcademicContext(): TutorAcademicContext {
    return this.academicContext;
  }

  getConversationHistory(): RelevantConversationTurn[] {
    return [...this.conversationHistory];
  }

  resetSession(): void {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.conversationHistory = [];
  }

  /**
   * Resuelve el contexto visual temporal a partir del apunte activo explícitamente seleccionado
   */
  private async resolveVisualContext(): Promise<VisualStudyContext | undefined> {
    const activeNoteId = this.academicContext.activeNoteId;
    if (!activeNoteId) {
      return undefined;
    }

    const notes = this.academicContext.selectedNotes || [];
    const activeNote = notes.find((n) => n.id === activeNoteId);

    if (!activeNote || !activeNote.images || activeNote.images.length === 0) {
      return undefined;
    }

    const primaryImage = activeNote.images[0];
    try {
      let rawData: Blob | string | null = null;
      if (primaryImage.storageKey) {
        rawData = await this.imageStorage.getImage(primaryImage.storageKey);
      } else if (primaryImage.localUri) {
        rawData = primaryImage.localUri;
      }

      if (!rawData) {
        return {
          sourceNoteId: activeNote.id,
          imageId: primaryImage.id,
          mimeType: 'image/jpeg',
          provenance: activeNote.provenance,
          title: activeNote.title,
          isUnreadable: true
        };
      }

      const preprocessed = await this.imagePreprocessor.preprocess(rawData);
      return {
        sourceNoteId: activeNote.id,
        imageId: primaryImage.id,
        mimeType: preprocessed.mimeType,
        base64Data: preprocessed.base64Data,
        provenance: activeNote.provenance,
        title: activeNote.title,
        width: preprocessed.width,
        height: preprocessed.height
      };
    } catch {
      return {
        sourceNoteId: activeNote.id,
        imageId: primaryImage.id,
        mimeType: 'image/jpeg',
        provenance: activeNote.provenance,
        title: activeNote.title,
        isUnreadable: true
      };
    }
  }

  async sendMessage(text: string, options?: SendMessageOptions): Promise<TutorClientMessage> {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('El mensaje no puede estar vacío');
    }

    const timestamp = new Date().toISOString();

    // 1. Registrar el turno del estudiante en el historial en memoria
    const studentTurn: RelevantConversationTurn = {
      role: 'student',
      text: trimmed,
      timestamp,
      pedagogicalMode: options?.mode
    };

    // 2. Extraer reflexiones o notas de contexto si existen
    const studentReflection =
      this.academicContext.studentReflectionText ||
      this.academicContext.relevantReflections?.[0]?.answer;

    const relevantNotes = this.academicContext.selectedNotes;

    // 3. Resolver contexto visual si hay un apunte seleccionado y está habilitado
    let visualContext: VisualStudyContext | undefined;
    if (options?.includeVisualContext !== false) {
      visualContext = await this.resolveVisualContext();
    }

    // 4. Construir la solicitud hacia el orquestador MARTutorService
    const request: TutorRequest = {
      sessionId: this.sessionId,
      pedagogicalMode: options?.mode,
      socraticHintLevel: options?.socraticHintLevel,
      studentIntent: options?.studentIntent,
      academicContext: {
        subject: this.academicContext.subject,
        topic: this.academicContext.topic,
        currentLesson: this.academicContext.lesson,
        keyConcepts:
          this.academicContext.keyConcepts && this.academicContext.keyConcepts.length > 0
            ? this.academicContext.keyConcepts
            : this.academicContext.topic?.name
            ? [this.academicContext.topic.name]
            : undefined
      },
      notesContext:
        relevantNotes && relevantNotes.length > 0
          ? {
              relevantNotes,
              activeNoteId: this.academicContext.activeNoteId || relevantNotes[0]?.id
            }
          : undefined,
      visualContext,
      studentInput: {
        latestUtterance: trimmed,
        studentReflection
      },
      conversationHistory: this.conversationHistory
    };

    try {
      // 5. Solicitar respuesta estructurada al orquestador pedagógico
      const response = await this.tutorService.respond(request);

      // 5. Actualizar historial con los dos turnos
      this.conversationHistory.push(studentTurn);
      this.conversationHistory.push({
        role: 'tutor',
        text: response.message,
        timestamp: response.timestamp,
        pedagogicalMode: response.mode
      });

      // 6. Mapear AITutorResponse a TutorClientMessage para la UI
      const clientMessage: TutorClientMessage = {
        id: response.id,
        sender: 'tutor',
        timestamp: response.timestamp,
        text: response.message,
        mode: response.mode,
        provenance: response.provenance,
        socraticStep: response.socraticStep,
        comprehensionCheck: response.comprehensionCheck,
        exercise: response.exercise,
        suggestedActions: response.suggestedActions,
        isFallback: response.executionMetadata?.providerName === 'local-fallback',
        rawResponse: response
      };

      return clientMessage;
    } catch (error) {
      // Manejo seguro de errores sin exponer secretos ni stack traces técnicos
      const errorMessage =
        error instanceof Error && !error.message.includes('AIzaSy')
          ? error.message
          : 'Ocurrió un error al conectar con MAR IA. Por favor intenta de nuevo.';

      return {
        id: `err-${Date.now()}`,
        sender: 'tutor',
        timestamp: new Date().toISOString(),
        text: `Lo siento, no pude responder a tu duda en este momento. ${errorMessage}`,
        isError: true,
        isFallback: true
      };
    }
  }
}
