import React from 'react';
import { LearningActivitySummary } from '../../domain/dashboardTypes';
import styles from './RecentActivityFeed.module.css';

export interface RecentActivityFeedProps {
  activities: LearningActivitySummary[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities
}) => {
  return (
    <article className={styles.card} aria-labelledby="recent-activity-title">
      <h3 id="recent-activity-title" className={styles.title}>
        <span>🕒</span>
        <span>Actividad Reciente ({activities.length})</span>
      </h3>

      {activities.length === 0 ? (
        <p className={styles.emptyText}>
          Todavía no hay actividad reciente. Realiza una práctica o examen para registrar tu avance 🌸
        </p>
      ) : (
        <div className={styles.feedList} role="list">
          {activities.map((act) => {
            let icon = '🎯';
            if (act.type === 'EXAM') icon = '📝';
            else if (act.type === 'REFLECTION') icon = '🌸';
            else if (act.type === 'TUTOR') icon = '🤖';

            let badgeClass = styles.badgeUnclear;
            let badgeLabel = 'Registrado';

            if (act.result === 'CORRECT') {
              badgeClass = styles.badgeCorrect;
              badgeLabel = '✓ Correcta';
            } else if (act.result === 'UNDERSTOOD') {
              badgeClass = styles.badgeUnderstood;
              badgeLabel = '✨ Comprendido';
            } else if (act.result === 'PARTIAL') {
              badgeClass = styles.badgePartial;
              badgeLabel = '◐ Parcial';
            } else if (act.result === 'NEEDS_REVIEW') {
              badgeClass = styles.badgeNeedsReview;
              badgeLabel = '💡 Por repasar';
            } else if (act.result === 'INCORRECT') {
              badgeClass = styles.badgeIncorrect;
              badgeLabel = '✕ Por revisar';
            } else if (act.result === 'UNANSWERED') {
              badgeClass = styles.badgeUnanswered;
              badgeLabel = '— Sin responder';
            } else if (act.result === 'UNCLEAR') {
              badgeClass = styles.badgeUnclear;
              badgeLabel = '◇ Respuesta abierta';
            }

            return (
              <div key={act.id} className={styles.feedItem} role="listitem">
                <div className={styles.itemLeft}>
                  <span className={styles.typeIcon} aria-hidden="true">{icon}</span>
                  <div className={styles.itemContent}>
                    <h4 className={styles.itemTitle}>{act.title}</h4>
                    <span className={styles.itemMeta}>
                      {act.subjectName ? `${act.subjectName} • ` : ''}
                      {act.formattedDate}
                    </span>
                  </div>
                </div>

                <span className={`${styles.resultBadge} ${badgeClass}`}>
                  {badgeLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
};
