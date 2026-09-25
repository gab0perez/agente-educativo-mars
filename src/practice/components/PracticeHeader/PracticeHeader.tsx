import React from 'react';
import styles from './PracticeHeader.module.css';

export interface PracticeHeaderProps {
  topicName?: string;
  currentIndex: number;
  totalActivities: number;
  onBack?: () => void;
}

export const PracticeHeader: React.FC<PracticeHeaderProps> = ({
  topicName,
  currentIndex,
  totalActivities,
  onBack
}) => {
  const currentStep = currentIndex + 1;
  const progressPercent = Math.round((currentStep / totalActivities) * 100);

  return (
    <header className={styles.headerCard} aria-label="Encabezado de práctica">
      <div className={styles.topRow}>
        {onBack && (
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
            aria-label="Salir de la práctica"
          >
            ← Salir
          </button>
        )}

        {topicName && (
          <span className={styles.contextTag} title={topicName}>
            🌸 {topicName}
          </span>
        )}
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressLabels}>
          <span className={styles.stepBadge}>
            Actividad {currentStep} de {totalActivities}
          </span>
          <span className={styles.percentageLabel}>
            {progressPercent}%
          </span>
        </div>

        <div
          className={styles.progressBarTrack}
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalActivities}
          aria-label={`Progreso de actividades: ${currentStep} de ${totalActivities}`}
        >
          <div
            className={styles.progressBarFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </header>
  );
};
