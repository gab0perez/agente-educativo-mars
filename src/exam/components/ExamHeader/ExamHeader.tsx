import React from 'react';
import { Button } from '../../../components/ui/Button/Button';
import styles from './ExamHeader.module.css';

export interface ExamHeaderProps {
  title: string;
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  onOpenReview: () => void;
  onAbandon: () => void;
  className?: string;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  title,
  currentIndex,
  totalQuestions,
  answeredCount,
  onOpenReview,
  onAbandon,
  className = ''
}) => {
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  return (
    <header className={`${styles.container} ${className}`} role="banner" aria-label="Cabecera del examen">
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <span className={styles.questionIndicator}>
            Pregunta {currentIndex + 1} de {totalQuestions} ({answeredCount} respondidas)
          </span>
          <h2 className={styles.examTitle}>{title}</h2>
        </div>

        <div className={styles.actionButtons}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAbandon}
            type="button"
            aria-label="Salir del examen"
          >
            Salir
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenReview}
            type="button"
            aria-label="Revisar preguntas del examen"
          >
            📋 Revisar
          </Button>
        </div>
      </div>

      <div
        className={styles.progressBarTrack}
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={totalQuestions}
        aria-label={`Progreso: pregunta ${currentIndex + 1} de ${totalQuestions}`}
      >
        <div
          className={styles.progressBarFill}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};
