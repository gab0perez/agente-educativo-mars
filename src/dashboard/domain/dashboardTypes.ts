import { MasteryLevel, ReviewItem, EvidenceResult } from '../../learning/domain/types';
import { AcademicTask, TaskUrgency } from '../../types/task';

/**
 * Progreso cualitativo global derivado del estado de dominio (MasteryState)
 */
export interface OverallLearningProgress {
  totalTopics: number;
  topicsWithEvidence: number;
  strongCount: number;
  understoodCount: number;
  developingCount: number;
  needsReviewCount: number;
  unknownCount: number;
  totalEvidencesCount: number;
  totalPracticeAttempts: number;
  qualitativeStatus: string;
}

/**
 * Resumen de aprendizaje por materia específica
 */
export interface SubjectLearningSummary {
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  subjectIcon?: string;
  totalTopics: number;
  studiedTopicsCount: number; // Temas con al menos una evidencia o estado distinto a UNKNOWN
  inPracticeTopicsCount: number; // DEVELOPING o UNDERSTOOD
  needsReviewTopicsCount: number; // NEEDS_REVIEW
  strongTopicsCount: number; // STRONG
  pendingTasksCount: number;
  masteryDistribution: Record<MasteryLevel, number>;
}

/**
 * Foco o punto destacado de comprensión conceptual
 */
export interface MasteryHighlight {
  topicId: string;
  topicName: string;
  subjectId?: string;
  subjectName?: string;
  level: MasteryLevel;
  evidenceCount: number;
  qualitativeSummary?: string;
  lastEvidenceAt?: string;
}

/**
 * Resumen de tarea escolar pendiente para el dashboard
 */
export interface DashboardTaskSummary {
  task: AcademicTask;
  urgency: TaskUrgency;
  formattedDueDate: string;
}

/**
 * Actividad formativa reciente registrada (prácticas, exámenes, reflexiones)
 */
export interface LearningActivitySummary {
  id: string;
  type: 'PRACTICE' | 'EXAM' | 'REFLECTION' | 'TUTOR';
  title: string;
  subjectName?: string;
  topicName?: string;
  result?: EvidenceResult | 'UNANSWERED';
  summary?: string;
  createdAt: string;
  formattedDate: string;
}

/**
 * Orientación / Recomendación sobre el siguiente paso de estudio
 */
export interface NextStepRecommendation {
  type: 'REVIEW' | 'TASK' | 'PRACTICE' | 'EXPLORE';
  title: string;
  description: string;
  subjectId?: string;
  topicId?: string;
  actionLabel: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  relatedEntityId?: string;
}

/**
 * Snapshot completo e inmutable del Dashboard de Aprendizaje Unificado
 */
export interface LearningDashboardSnapshot {
  generatedAt: string;
  overallProgress: OverallLearningProgress;
  subjectSummaries: SubjectLearningSummary[];
  masteryHighlights: {
    strengths: MasteryHighlight[];
    needsReview: MasteryHighlight[];
  };
  pendingTasks: DashboardTaskSummary[];
  recentActivity: LearningActivitySummary[];
  pendingReviews: ReviewItem[];
  nextStep: NextStepRecommendation;
}
