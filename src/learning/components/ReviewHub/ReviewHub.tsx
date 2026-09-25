import React from 'react';
import { RecommendedActivity } from '../../domain/types';
import { useIntelligentReview } from '../../hooks/useIntelligentReview';
import { ReviewRecommendation } from '../ReviewRecommendation/ReviewRecommendation';
import styles from './ReviewHub.module.css';

export interface ReviewHubProps {
  topicId?: string;
  subjectId?: string;
  title?: string;
  subtitle?: string;
  onPractice?: (topicId: string, activityType: RecommendedActivity) => void;
  onAskTutor?: (topicId: string) => void;
  onViewLesson?: (topicId: string) => void;
  className?: string;
}

export const ReviewHub: React.FC<ReviewHubProps> = ({
  topicId,
  subjectId,
  title = '¿Qué podríamos repasar?',
  subtitle = 'Recomendaciones personalizadas basadas en tus actividades y comprensión',
  onPractice,
  onAskTutor,
  onViewLesson,
  className = ''
}) => {
  const { pendingReviews, isLoading, completeReview } = useIntelligentReview({
    topicId,
    subjectId
  });

  if (isLoading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.loadingWrapper} role="status" aria-live="polite">
          <span>🌸 Consultando oportunidades de repaso...</span>
        </div>
      </div>
    );
  }

  return (
    <section
      className={`${styles.container} ${className}`}
      aria-label="Sección de Repaso Inteligente"
    >
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            <span>🌸</span>
            <span>{title}</span>
          </h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>

      {pendingReviews.length === 0 ? (
        <div className={styles.emptyStateWrapper} role="region" aria-label="Sin repasos pendientes">
          <span className={styles.emptyIcon} aria-hidden="true">✨</span>
          <h3 className={styles.emptyTitle}>Todo tranquilo por aquí</h3>
          <p className={styles.emptyDescription}>
            Por ahora no hay ningún tema que MAR considere necesario repasar.
            Puedes seguir aprendiendo a tu ritmo o practicar cuando quieras.
          </p>
        </div>
      ) : (
        <div className={styles.reviewsList}>
          {pendingReviews.map((review) => (
            <ReviewRecommendation
              key={review.id}
              review={review}
              onPractice={onPractice}
              onAskTutor={onAskTutor}
              onViewLesson={onViewLesson}
              onComplete={completeReview}
            />
          ))}
        </div>
      )}
    </section>
  );
};
