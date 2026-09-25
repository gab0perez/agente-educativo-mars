import { ProvenanceOrigin } from '../../types/provenance';

/**
 * Origen de la evidencia de aprendizaje
 */
export type EvidenceSource =
  | 'QUIZ'
  | 'EXERCISE'
  | 'REFLECTION'
  | 'TUTOR_INTERACTION';

/**
 * Resultado cualitativo / formativo de la evidencia
 */
export type EvidenceResult =
  | 'CORRECT'
  | 'PARTIAL'
  | 'INCORRECT'
  | 'UNDERSTOOD'
  | 'NEEDS_REVIEW'
  | 'UNCLEAR';

/**
 * Contrato formal para representar una unidad atómica de evidencia de aprendizaje
 */
export interface LearningEvidence {
  id: string;
  studentId?: string;

  // Contexto académico
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
  lessonId?: string;
  conceptIds?: string[];

  // Metadatos de la observación
  source: EvidenceSource;
  result: EvidenceResult;
  confidence?: number; // 0.0 a 1.0 autoreporte opcional

  // Referencia cruzada (sin duplicar el contenido original)
  sourceReferenceId?: string; // id de Reflection, PracticeAttempt, etc.
  summary?: string; // Breve descripción textual sanitizada

  provenance: ProvenanceOrigin;
  createdAt: string;
}

/**
 * Niveles cualitativos del estado de dominio / comprensión
 */
export type MasteryLevel =
  | 'UNKNOWN'
  | 'NEEDS_REVIEW'
  | 'DEVELOPING'
  | 'UNDERSTOOD'
  | 'STRONG';

/**
 * Contrato de estado de comprensión de un tema o concepto
 */
export interface MasteryState {
  id: string;
  subjectId?: string;
  topicId: string;
  conceptId?: string;

  level: MasteryLevel;
  evidenceCount: number;

  lastEvidenceAt?: string;
  lastReviewedAt?: string;
  qualitativeSummary?: string;

  updatedAt: string;
}

/**
 * Motivo para recomendar una sesión de repaso
 */
export type ReviewReason =
  | 'LOW_MASTERY'
  | 'RECENT_ERROR'
  | 'PARTIAL_UNDERSTANDING'
  | 'TIME_ELAPSED'
  | 'USER_REQUESTED';

/**
 * Nivel de prioridad para la recomendación de repaso
 */
export type ReviewPriority = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Tipo de actividad formativa sugerida para el repaso
 */
export type RecommendedActivity =
  | 'QUIZ'
  | 'EXERCISE'
  | 'REFLECTION'
  | 'TUTOR';

/**
 * Contrato que representa una recomendación o ítem de repaso
 */
export interface ReviewItem {
  id: string;
  subjectId?: string;
  topicId: string;
  conceptId?: string;

  reason: ReviewReason;
  priority: ReviewPriority;
  recommendedActivity: RecommendedActivity;

  dueAt?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Tipos de actividades de práctica soportadas
 */
export type PracticeType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'OPEN_RESPONSE';

/**
 * Opción individual para actividades de opción múltiple
 */
export interface PracticeOption {
  id: string;
  text: string;
  isCorrect?: boolean;
  explanation?: string;
}

/**
 * Contrato que define una actividad de práctica
 */
export interface PracticeActivity {
  id: string;
  type: PracticeType;

  subjectId?: string;
  topicId?: string;
  lessonId?: string;

  prompt: string;
  options?: PracticeOption[];
  explanation?: string;

  provenance: ProvenanceOrigin;
  createdAt: string;
}

/**
 * Resultado evaluativo de un intento de práctica
 */
export type PracticeAttemptResult =
  | 'CORRECT'
  | 'PARTIAL'
  | 'INCORRECT'
  | 'UNCLEAR';

/**
 * Contrato que representa el intento de resolución de una práctica
 */
export interface PracticeAttempt {
  id: string;
  activityId: string;

  answer: string;
  result: PracticeAttemptResult;
  feedback?: string;

  evidenceId?: string;
  createdAt: string;
}
