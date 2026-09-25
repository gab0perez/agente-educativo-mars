import { ProvenanceOrigin } from '../../types/provenance';

/**
 * Modos pedagógicos disponibles en MAR
 */
export type PedagogicalMode =
  | 'EXPLAIN'     // Explicación conceptual estructurada
  | 'SIMPLIFY'    // Explicación sencilla con analogías cotidianas
  | 'EXAMPLE'     // Ejemplos prácticos contextualizados
  | 'QUESTION'    // Pregunta de comprobación de comprensión
  | 'EXERCISE'    // Ejercicio práctico guiado
  | 'SOCRATIC'    // Diálogo mayéutico / socrático paso a paso
  | 'REVIEW';     // Repaso de conceptos clave previos

/**
 * Nivel de ayuda en interacción socrática
 */
export type SocraticHintLevel = 'HINT_1' | 'HINT_2' | 'HINT_3' | 'EXPLANATION';

/**
 * Opciones de ejecución para la llamada al proveedor de IA
 */
export interface AIGenerationOptions {
  timeoutMs?: number;
  temperature?: number;
  maxOutputTokens?: number;
  abortSignal?: AbortSignal;
}

/**
 * Metadata devuelta por el proveedor de IA para trazabilidad y métricas
 */
export interface AIExecutionMetadata {
  providerName: string;         // 'mock-tutor' | 'google-gemini' | 'openai' | etc.
  modelIdentifier: string;      // 'gemini-2.5-flash' | 'mock-model' | etc.
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  executionDurationMs: number;
  timestamp: string;
}

/**
 * Resultado crudo normalizado del proveedor de IA
 */
export interface AIProviderResult {
  rawText: string;
  structuredData?: unknown;     // Objeto estructurado parseado
  metadata: AIExecutionMetadata;
}

/**
 * Contexto de estudio visual de un apunte seleccionado explícitamente
 */
export interface VisualStudyContext {
  sourceNoteId: string;
  imageId: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  base64Data?: string;          // Datos binarios en Base64 limpios (sin prefijo data:...)
  provenance: ProvenanceOrigin; // Procedencia original (CLASS_ORIGIN / USER_PROVIDED)
  title?: string;
  width?: number;
  height?: number;
  isUnreadable?: boolean;
}

/**
 * Referencia contextual de un apunte físico
 */
export interface ContextualNoteSnippet {
  noteId: string;
  title: string;
  subjectName?: string;
  topicName?: string;
  textExtract?: string;        // Transcripción o notas de texto
  provenance: ProvenanceOrigin;
  hasImage: boolean;
  imageMimeType?: string;
}

/**
 * Mensaje individual del historial de conversación relevante
 */
export interface RelevantConversationTurn {
  role: 'student' | 'tutor';
  text: string;
  timestamp: string;
  pedagogicalMode?: PedagogicalMode;
}

/**
 * Contrato formal de carga de contexto para MAR IA
 */
export interface AIContextPayload {
  // 1. Identificación y Modo
  sessionId: string;
  pedagogicalMode: PedagogicalMode;
  socraticHintLevel?: SocraticHintLevel;
  studentIntent: string;

  // 2. Contexto Académico Curricular (CETis 164)
  academicContext: {
    subjectId?: string;
    subjectName?: string;
    topicId?: string;
    topicName?: string;
    unitNumber?: number;
    currentLessonStepTitle?: string;
    keyConcepts?: string[];
  };

  // 3. Material de Clase y Apuntes Seleccionados (CLASS_ORIGIN / USER_PROVIDED)
  notesContext?: {
    relevantNotes: ContextualNoteSnippet[];
    activeNoteId?: string;
  };

  // 4. Contexto Visual Multimodal (Apunte fotográfico activo)
  visualContext?: VisualStudyContext;

  // 5. Aportaciones y Reflexiones de la Estudiante (USER_PROVIDED)
  studentInput: {
    latestUtterance: string;
    studentReflection?: string;
    confidenceSelfReport?: 'high' | 'medium' | 'low';
  };

  // 6. Historial Conversacional Reciente (Ventana Deslizante)
  conversationHistory: RelevantConversationTurn[];

  // 7. Restricciones Epistemológicas de la Sesión
  constraints: {
    maxTokens: number;
    requireSocraticStep: boolean;
    allowComplementaryExpansion: boolean;
  };
}

/**
 * Sugerencia interactiva de acción rápida para la estudiante
 */
export interface SuggestedAction {
  id: string;
  label: string;               // Ej: "Explícamelo con un ejemplo", "Ponme un ejercicio"
  mode: PedagogicalMode;
  payload?: string;
}

/**
 * Componente socrático de la respuesta
 */
export interface SocraticStep {
  currentLevel: SocraticHintLevel;
  guidingQuestion: string;     // Pregunta orientadora para hacer pensar a Mar
  clue?: string;               // Pista sutil sin revelar la solución
  expectedConceptFocus: string;// Qué concepto busca que Mar identifique
}

/**
 * Respuesta estructurada final de MAR IA
 */
export interface AITutorResponse {
  id: string;
  sessionId: string;
  timestamp: string;
  
  // Mensaje principal pedagógico formateado en Markdown accesible
  message: string;

  // Modo pedagógico ejecutado
  mode: PedagogicalMode;

  // Metadata de procedencia del conocimiento emitido
  provenance: ProvenanceOrigin;

  // Paso socrático si el modo es SOCRATIC
  socraticStep?: SocraticStep;

  // Pregunta de comprobación de comprensión (opcional)
  comprehensionCheck?: {
    questionText: string;
    suggestedOptions?: string[];
  };

  // Ejercicio práctico (opcional)
  exercise?: {
    title: string;
    instructions: string;
    hints: string[];
  };

  // Acciones rápidas sugeridas para continuar la sesión
  suggestedActions: SuggestedAction[];

  // Indicador de incertidumbre (si la IA requiere que Mar confirme algo)
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;

  // Trazabilidad
  executionMetadata: AIExecutionMetadata;
}
