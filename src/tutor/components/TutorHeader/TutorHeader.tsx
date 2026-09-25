import React from 'react';
import styles from './TutorHeader.module.css';
import { Button } from '../../../components/ui';
import { TutorAcademicContext } from '../../types/tutorClientTypes';

export interface TutorHeaderProps {
  academicContext?: TutorAcademicContext;
  onResetSession: () => void;
  onBack?: () => void;
  hasMessages?: boolean;
}

export const TutorHeader: React.FC<TutorHeaderProps> = ({
  academicContext,
  onResetSession,
  onBack,
  hasMessages = false
}) => {
  const subjectName = academicContext?.subject?.name || academicContext?.subject?.shortName;
  const topicName = academicContext?.topic?.name;

  return (
    <header className={styles.header} role="banner">
      <div className={styles.leftContainer}>
        {onBack && (
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
            aria-label="Volver a la pantalla anterior"
          >
            <span aria-hidden="true">‹</span>
          </button>
        )}
        <div className={styles.avatarWrapper} aria-hidden="true">
          <span className={styles.avatarIcon}>🌸</span>
        </div>
        <div className={styles.titles}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Mar IA</h1>
            <span className={styles.statusBadge} aria-label="Tutor activo">
              <span className={styles.statusDot} aria-hidden="true" />
              Tutor activo
            </span>
          </div>
          <p className={styles.subtitle}>Tu espacio personal para aprender</p>
        </div>
      </div>

      <div className={styles.rightContainer}>
        {subjectName && (
          <div className={styles.contextPill} title={`Estudiando: ${subjectName}${topicName ? ` - ${topicName}` : ''}`}>
            <span className={styles.contextIcon} aria-hidden="true">📚</span>
            <span className={styles.contextText}>
              {topicName ? `${topicName}` : subjectName}
            </span>
          </div>
        )}

        {hasMessages && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetSession}
            aria-label="Reiniciar conversación con Mar IA"
            title="Reiniciar conversación"
            className={styles.resetButton}
          >
            <span aria-hidden="true">🔄</span>
            <span className={styles.resetLabel}>Nueva charla</span>
          </Button>
        )}
      </div>
    </header>
  );
};
