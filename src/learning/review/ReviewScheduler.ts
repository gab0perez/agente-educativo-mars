import {
  LearningEvidence,
  MasteryState,
  RecommendedActivity,
  ReviewItem,
  ReviewPriority,
  ReviewReason
} from '../domain/types';

export interface ReviewRecommendationOptions {
  preferredActivity?: RecommendedActivity;
  priorityOverride?: ReviewPriority;
  reasonOverride?: ReviewReason;
  dueInHours?: number;
}

export interface IReviewScheduler {
  generateReviewItem(
    mastery: MasteryState,
    recentEvidences?: LearningEvidence[],
    options?: ReviewRecommendationOptions
  ): ReviewItem | null;
}

export class DefaultReviewScheduler implements IReviewScheduler {
  /**
   * Genera un ReviewItem determinista basado en el estado de dominio y evidencia reciente.
   * Regla de tiempo transcurrido (TIME_ELAPSED):
   * - Para UNDERSTOOD: si han pasado más de 72 horas desde la última evidencia / repaso.
   * - Para STRONG: si han pasado más de 7 días (168 horas) desde la última evidencia / repaso.
   * - Si es reciente (< 72h para UNDERSTOOD o < 7d para STRONG), no se genera ítem innecesario.
   */
  generateReviewItem(
    mastery: MasteryState,
    recentEvidences: LearningEvidence[] = [],
    options: ReviewRecommendationOptions = {}
  ): ReviewItem | null {
    const now = new Date();

    let reason: ReviewReason = options.reasonOverride || 'LOW_MASTERY';
    let priority: ReviewPriority = options.priorityOverride || 'MEDIUM';
    let recommendedActivity: RecommendedActivity =
      options.preferredActivity || 'EXERCISE';

    // 1. Si hay anulación explícita de motivo (ej. USER_REQUESTED)
    if (options.reasonOverride) {
      reason = options.reasonOverride;
      priority = options.priorityOverride || (reason === 'USER_REQUESTED' ? 'MEDIUM' : 'LOW');
      recommendedActivity = options.preferredActivity || (reason === 'USER_REQUESTED' ? 'EXERCISE' : 'QUIZ');
    } else {
      // 2. Determinar razón y prioridad basada en el estado cualitativo de dominio y evidencias
      const hasRecentError = recentEvidences.some(
        (e) => e.result === 'INCORRECT' || e.result === 'NEEDS_REVIEW'
      );

      if (hasRecentError) {
        reason = 'RECENT_ERROR';
        priority = 'HIGH';
        recommendedActivity = 'TUTOR';
      } else if (mastery.level === 'NEEDS_REVIEW') {
        reason = 'LOW_MASTERY';
        priority = 'HIGH';
        recommendedActivity = 'TUTOR';
      } else if (mastery.level === 'DEVELOPING') {
        reason = 'PARTIAL_UNDERSTANDING';
        priority = 'MEDIUM';
        recommendedActivity = 'EXERCISE';
      } else if (mastery.level === 'UNDERSTOOD') {
        // Regla de tiempo transcurrido simple (72 horas)
        const lastActivityTime = mastery.lastReviewedAt || mastery.lastEvidenceAt;
        const hoursElapsed = lastActivityTime
          ? (now.getTime() - new Date(lastActivityTime).getTime()) / (1000 * 60 * 60)
          : Infinity;

        if (hoursElapsed < 72 && !options.priorityOverride) {
          // Aún está fresco el conocimiento, no sobrecargar
          return null;
        }

        reason = 'TIME_ELAPSED';
        priority = 'LOW';
        recommendedActivity = 'QUIZ';
      } else if (mastery.level === 'STRONG') {
        // Regla de tiempo transcurrido simple (7 días = 168 horas)
        const lastActivityTime = mastery.lastReviewedAt || mastery.lastEvidenceAt;
        const hoursElapsed = lastActivityTime
          ? (now.getTime() - new Date(lastActivityTime).getTime()) / (1000 * 60 * 60)
          : Infinity;

        if (hoursElapsed < 168 && !options.priorityOverride) {
          // Consolidado recientemente, no requiere repaso
          return null;
        }

        reason = 'TIME_ELAPSED';
        priority = 'LOW';
        recommendedActivity = 'QUIZ';
      } else {
        // UNKNOWN sin evidencia suficiente: no crear problemas ficticios a menos que se solicite
        if (recentEvidences.length === 0) {
          return null;
        }
        reason = 'PARTIAL_UNDERSTANDING';
        priority = 'MEDIUM';
        recommendedActivity = 'REFLECTION';
      }
    }

    if (options.priorityOverride) {
      priority = options.priorityOverride;
    }
    if (options.preferredActivity) {
      recommendedActivity = options.preferredActivity;
    }

    const hours = options.dueInHours ?? (priority === 'HIGH' ? 4 : priority === 'MEDIUM' ? 24 : 72);
    const dueDate = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return {
      id: `review-${mastery.topicId}-${reason.toLowerCase()}-${recommendedActivity.toLowerCase()}`,
      subjectId: mastery.subjectId,
      topicId: mastery.topicId,
      conceptId: mastery.conceptId,
      reason,
      priority,
      recommendedActivity,
      dueAt: dueDate.toISOString(),
      createdAt: now.toISOString()
    };
  }
}

export const defaultReviewScheduler = new DefaultReviewScheduler();
