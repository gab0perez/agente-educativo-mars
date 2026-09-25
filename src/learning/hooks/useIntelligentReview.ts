import { useState, useEffect, useCallback } from 'react';
import { ReviewItem, RecommendedActivity } from '../domain/types';
import { ReviewRecommendationOptions } from '../review/ReviewScheduler';
import { ILearningEngine, learningEngine as defaultLearningEngine } from '../service/LearningEngine';

export interface UseIntelligentReviewOptions {
  topicId?: string;
  subjectId?: string;
  autoSchedule?: boolean;
  learningEngine?: ILearningEngine;
}

export function useIntelligentReview(options: UseIntelligentReviewOptions = {}) {
  const {
    topicId,
    subjectId,
    autoSchedule = false,
    learningEngine = defaultLearningEngine
  } = options;

  const [pendingReviews, setPendingReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);

      // Si autoSchedule está activo y se proporcionó un topicId, intentar generar recomendación si no existe
      if (autoSchedule && topicId) {
        const existing = learningEngine.getPendingReviews(topicId);
        if (existing.length === 0) {
          learningEngine.scheduleReview(topicId);
        }
      }

      let reviews = learningEngine.getPendingReviews(topicId);

      if (subjectId) {
        reviews = reviews.filter((r) => r.subjectId === subjectId);
      }

      setPendingReviews(reviews);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No fue posible cargar las recomendaciones de repaso.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [topicId, subjectId, autoSchedule, learningEngine]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const completeReview = useCallback(
    (reviewId: string): ReviewItem | null => {
      try {
        const completed = learningEngine.completeReview(reviewId);
        fetchReviews();
        return completed;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al completar el repaso.';
        setError(msg);
        return null;
      }
    },
    [learningEngine, fetchReviews]
  );

  const requestReview = useCallback(
    (targetTopicId: string, preferredActivity?: RecommendedActivity): ReviewItem | null => {
      try {
        const item = learningEngine.requestUserReview(targetTopicId, preferredActivity);
        fetchReviews();
        return item;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al solicitar el repaso.';
        setError(msg);
        return null;
      }
    },
    [learningEngine, fetchReviews]
  );

  const scheduleReview = useCallback(
    (targetTopicId: string, schedOptions?: ReviewRecommendationOptions): ReviewItem | null => {
      try {
        const item = learningEngine.scheduleReview(targetTopicId, schedOptions);
        fetchReviews();
        return item;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al programar el repaso.';
        setError(msg);
        return null;
      }
    },
    [learningEngine, fetchReviews]
  );

  return {
    pendingReviews,
    reviews: pendingReviews,
    isLoading,
    error,
    refreshReviews: fetchReviews,
    completeReview,
    requestReview,
    scheduleReview
  };
}
