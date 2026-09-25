import React from 'react';
import { SubjectLearningSummary } from '../../domain/dashboardTypes';
import styles from './SubjectSummariesGrid.module.css';

export interface SubjectSummariesGridProps {
  summaries: SubjectLearningSummary[];
  onSelectSubject?: (subjectId: string) => void;
}

export const SubjectSummariesGrid: React.FC<SubjectSummariesGridProps> = ({
  summaries,
  onSelectSubject
}) => {
  return (
    <section className={styles.section} aria-labelledby="subjects-summary-title">
      <h3 id="subjects-summary-title" className={styles.sectionTitle}>
        Progreso por Materia ({summaries.length})
      </h3>

      <div className={styles.grid}>
        {summaries.map((s) => (
          <button
            key={s.subjectId}
            type="button"
            className={styles.subjectCard}
            onClick={() => onSelectSubject?.(s.subjectId)}
            aria-label={`Materia: ${s.subjectName}. ${s.studiedTopicsCount} de ${s.totalTopics} temas estudiados. Haz clic para ver detalles.`}
          >
            <div className={styles.subjectHeader}>
              <div className={styles.iconTitleRow}>
                <span className={styles.subjectIcon} aria-hidden="true">
                  {s.subjectIcon || '📚'}
                </span>
                <h4 className={styles.subjectName}>{s.subjectName}</h4>
              </div>
              {s.subjectCode && (
                <span className={styles.subjectCode}>{s.subjectCode}</span>
              )}
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{s.studiedTopicsCount}/{s.totalTopics}</span>
                <span className={styles.statLabel}>Estudiados</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber} style={{ color: '#166534' }}>
                  {s.strongTopicsCount}
                </span>
                <span className={styles.statLabel}>Dominados</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber} style={{ color: s.needsReviewTopicsCount > 0 ? '#c2410c' : '#78716C' }}>
                  {s.needsReviewTopicsCount}
                </span>
                <span className={styles.statLabel}>Por reforzar</span>
              </div>
            </div>

            {s.pendingTasksCount > 0 && (
              <span className={styles.tasksBadge}>
                📝 {s.pendingTasksCount} {s.pendingTasksCount === 1 ? 'tarea pendiente' : 'tareas pendientes'}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
};
