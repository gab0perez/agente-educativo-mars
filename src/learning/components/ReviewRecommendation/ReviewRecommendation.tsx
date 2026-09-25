import React from 'react';
import { ReviewItem, RecommendedActivity } from '../../domain/types';
import { useTopicMastery } from '../../hooks/useTopicMastery';
import { MasteryStatus } from '../MasteryStatus/MasteryStatus';
import { Button } from '../../../components/ui/Button/Button';
import { subjectRepository } from '../../../repositories/subjectRepository';
import styles from './ReviewRecommendation.module.css';

export interface ReviewRecommendationProps {
  review: ReviewItem;
  onPractice?: (topicId: string, activityType: RecommendedActivity) => void;
  onAskTutor?: (topicId: string) => void;
  onViewLesson?: (topicId: string) => void;
  onComplete?: (reviewId: string) => void;
  className?: string;
}

export const ReviewRecommendation: React.FC<ReviewRecommendationProps> = ({
  review,
  onPractice,
  onAskTutor,
  onViewLesson,
  onComplete,
  className = ''
}) => {
  const { mastery } = useTopicMastery({ topicId: review.topicId });

  // Resolver metadatos académicos del tema y materia
  const allSubjects = subjectRepository.getAll();
  const subject =
    (review.subjectId && subjectRepository.getById(review.subjectId)) ||
    allSubjects.find((s) => s.topics.some((t) => t.id === review.topicId));
  const topic = subject?.topics.find((t) => t.id === review.topicId);
  const topicName = topic?.name || review.topicId;
  const subjectName = subject?.shortName || subject?.name || 'Materia';

  // Configuración cualitativa de prioridad
  const priorityConfig = {
    HIGH: {
      label: '💡 Conviene repasar',
      className: styles.priorityHigh
    },
    MEDIUM: {
      label: '🌿 Buen momento para reforzar',
      className: styles.priorityMedium
    },
    LOW: {
      label: '✨ Para continuar',
      className: styles.priorityLow
    }
  }[review.priority] || {
    label: '✨ Recomendación de repaso',
    className: styles.priorityMedium
  };

  // Explicación cualitativa según la razón de recomendación
  const getReasonExplanation = () => {
    switch (review.reason) {
      case 'LOW_MASTERY':
        return 'MAR ha identificado que este tema se beneficiará de una revisión para afianzar los conceptos clave.';
      case 'RECENT_ERROR':
        return 'Tuviste algunas dudas en tus prácticas recientes. Un breve momento de estudio te ayudará a aclararlas.';
      case 'PARTIAL_UNDERSTANDING':
        return 'Vas por buen camino. Una actividad práctica adicional te permitirá consolidar lo aprendido.';
      case 'TIME_ELAPSED':
        return 'Hace unos días que no repasas este tema. Un quiz rápido mantendrá frescos los conceptos.';
      case 'USER_REQUESTED':
        return 'Sesión de repaso solicitada para reforzar tu aprendizaje en este tema.';
      default:
        return 'Una breve sesión de estudio te ayudará a seguir afianzando este contenido.';
    }
  };

  // Etiqueta para la acción principal recomendada
  const getPrimaryActionLabel = () => {
    switch (review.recommendedActivity) {
      case 'QUIZ':
        return '🎯 Resolver Quiz';
      case 'EXERCISE':
        return '🎯 Practicar Ejercicio';
      case 'TUTOR':
        return '🌸 Preguntar a MAR';
      case 'REFLECTION':
        return '✨ Reflexionar';
      default:
        return '🎯 Practicar';
    }
  };

  const handlePrimaryAction = () => {
    if (review.recommendedActivity === 'TUTOR' && onAskTutor) {
      onAskTutor(review.topicId);
    } else if (onPractice) {
      onPractice(review.topicId, review.recommendedActivity);
    } else if (onAskTutor) {
      onAskTutor(review.topicId);
    }
  };

  return (
    <article
      className={`${styles.container} ${className}`}
      role="region"
      aria-label={`Recomendación de repaso para ${topicName}`}
    >
      <div className={styles.headerRow}>
        <span className={`${styles.priorityBadge} ${priorityConfig.className}`}>
          {priorityConfig.label}
        </span>
        <span className={styles.subjectBadge}>
          {subjectName}
        </span>
      </div>

      <div className={styles.titleArea}>
        <h3 className={styles.topicTitle}>{topicName}</h3>
        {mastery && (
          <div className={styles.masteryRow}>
            <MasteryStatus level={mastery.level} size="sm" showDescription={false} />
          </div>
        )}
      </div>

      <div className={styles.reasonCard}>
        <p className={styles.reasonText}>{getReasonExplanation()}</p>
      </div>

      <div className={styles.actionsRow}>
        <div className={styles.mainActions}>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrimaryAction}
            type="button"
            aria-label={`${getPrimaryActionLabel()} sobre ${topicName}`}
          >
            {getPrimaryActionLabel()}
          </Button>

          {review.recommendedActivity !== 'TUTOR' && onAskTutor && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAskTutor(review.topicId)}
              type="button"
              aria-label={`Preguntar a Mar IA sobre ${topicName}`}
            >
              🌸 Mar IA
            </Button>
          )}

          {onViewLesson && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewLesson(review.topicId)}
              type="button"
              aria-label={`Ver lección de ${topicName}`}
            >
              📖 Lección
            </Button>
          )}
        </div>

        {onComplete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onComplete(review.id)}
            type="button"
            aria-label={`Marcar repaso de ${topicName} como completado`}
            className={styles.completeAction}
          >
            ✓ Listo
          </Button>
        )}
      </div>
    </article>
  );
};
