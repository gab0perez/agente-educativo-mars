import React from 'react';
import { NextStepRecommendation } from '../../domain/dashboardTypes';
import { Button } from '../../../components/ui/Button/Button';
import styles from './NextStepCard.module.css';

export interface NextStepCardProps {
  recommendation: NextStepRecommendation;
  onExecuteAction: (recommendation: NextStepRecommendation) => void;
}

export const NextStepCard: React.FC<NextStepCardProps> = ({
  recommendation,
  onExecuteAction
}) => {
  let priorityClass = styles.priorityLow;
  let priorityLabel = 'Sugerencia';

  if (recommendation.priority === 'HIGH') {
    priorityClass = styles.priorityHigh;
    priorityLabel = 'Prioritario';
  } else if (recommendation.priority === 'MEDIUM') {
    priorityClass = styles.priorityMedium;
    priorityLabel = 'Recomendado';
  }

  return (
    <article className={styles.card} aria-labelledby="next-step-title">
      <div className={styles.topRow}>
        <span className={styles.badge}>
          ✨ Siguiente paso
        </span>
        <span className={`${styles.priorityBadge} ${priorityClass}`}>
          {priorityLabel}
        </span>
      </div>

      <h3 id="next-step-title" className={styles.title}>
        {recommendation.title}
      </h3>

      <p className={styles.description}>
        {recommendation.description}
      </p>

      <div className={styles.actionRow}>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onExecuteAction(recommendation)}
          aria-label={recommendation.actionLabel}
        >
          {recommendation.actionLabel}
        </Button>
      </div>
    </article>
  );
};
