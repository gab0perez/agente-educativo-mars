import React from 'react';
import styles from './SubjectCard.module.css';
import { Subject } from '../../types/academic';

export interface SubjectCardProps {
  subject: Subject;
  onClick: () => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick }) => {
  const topicCountText = `${subject.topics.length} ${subject.topics.length === 1 ? 'tema' : 'temas'}`;

  return (
    <div
      className={styles.card}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`Materia: ${subject.name}. ${topicCountText}. Presiona para ver los temas.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.headerRow}>
        <span className={styles.iconContainer} aria-hidden="true">
          {subject.icon}
        </span>
        <span className={styles.topicCountBadge}>{topicCountText}</span>
      </div>

      <h3 className={styles.title}>{subject.name}</h3>
      <p className={styles.description}>{subject.description}</p>

      <div className={styles.footerRow}>
        <span>Explorar temas</span>
        <span className={styles.arrowIcon} aria-hidden="true">→</span>
      </div>
    </div>
  );
};
