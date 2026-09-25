import React from 'react';
import { OverallLearningProgress } from '../../domain/dashboardTypes';
import styles from './OverallProgressCard.module.css';

export interface OverallProgressCardProps {
  progress: OverallLearningProgress;
}

export const OverallProgressCard: React.FC<OverallProgressCardProps> = ({
  progress
}) => {
  return (
    <article className={styles.card} aria-labelledby="overall-progress-title">
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <span className={styles.subtitle}>Tu camino de aprendizaje</span>
          <h2 id="overall-progress-title" className={styles.title}>
            Estado General
          </h2>
        </div>
        <span style={{ fontSize: '1.75rem' }} aria-hidden="true">🌸</span>
      </header>

      <p className={styles.statusMessage} role="status">
        {progress.qualitativeStatus}
      </p>

      <div className={styles.statsGrid}>
        <div className={styles.statPill}>
          <span className={styles.statNumber}>{progress.totalTopics}</span>
          <span className={styles.statLabel}>Temas del Semestre</span>
        </div>
        <div className={styles.statPill}>
          <span className={styles.statNumber} style={{ color: '#be123c' }}>
            {progress.topicsWithEvidence}
          </span>
          <span className={styles.statLabel}>Temas Estudiados</span>
        </div>
        <div className={styles.statPill}>
          <span className={styles.statNumber} style={{ color: '#166534' }}>
            {progress.totalEvidencesCount}
          </span>
          <span className={styles.statLabel}>Evidencias</span>
        </div>
        <div className={styles.statPill}>
          <span className={styles.statNumber} style={{ color: '#1e40af' }}>
            {progress.totalPracticeAttempts}
          </span>
          <span className={styles.statLabel}>Prácticas Realizadas</span>
        </div>
      </div>

      {progress.topicsWithEvidence > 0 && (
        <div className={styles.levelsRow} aria-label="Distribución cualitativa de comprensión">
          {progress.strongCount > 0 && (
            <span className={`${styles.levelBadge} ${styles.levelStrong}`}>
              🌟 {progress.strongCount} {progress.strongCount === 1 ? 'Dominado' : 'Dominados'}
            </span>
          )}
          {progress.understoodCount > 0 && (
            <span className={`${styles.levelBadge} ${styles.levelUnderstood}`}>
              ✨ {progress.understoodCount} {progress.understoodCount === 1 ? 'Comprendido' : 'Comprendidos'}
            </span>
          )}
          {progress.developingCount > 0 && (
            <span className={`${styles.levelBadge} ${styles.levelDeveloping}`}>
              🌱 {progress.developingCount} En desarrollo
            </span>
          )}
          {progress.needsReviewCount > 0 && (
            <span className={`${styles.levelBadge} ${styles.levelNeedsReview}`}>
              💡 {progress.needsReviewCount} Por reforzar
            </span>
          )}
        </div>
      )}
    </article>
  );
};
