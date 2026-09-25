import React from 'react';
import styles from './PracticeIntro.module.css';
import { Subject, Topic } from '../../../types/academic';
import { ProvenanceBadge } from '../../../components/ui/ProvenanceBadge/ProvenanceBadge';

export interface PracticeIntroProps {
  subject?: Subject;
  topic?: Topic;
  totalActivities: number;
  onStart: () => void;
  onBack?: () => void;
}

export const PracticeIntro: React.FC<PracticeIntroProps> = ({
  subject,
  topic,
  totalActivities,
  onStart,
  onBack
}) => {
  const effectiveSubjectName = subject?.name || subject?.shortName || 'Materia activa';
  const effectiveTopicName = topic?.name || 'Tema de estudio';

  return (
    <div className={styles.container} role="region" aria-label="Introducción a la práctica interactiva">
      <div className={styles.topRow}>
        {onBack && (
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
            aria-label="Volver al tema"
          >
            ← Volver
          </button>
        )}
        <ProvenanceBadge origin="AI_COMPLEMENTARY" size="sm" />
      </div>

      <div className={styles.lilyBadge} aria-hidden="true">
        🌸
      </div>

      <h2 className={styles.title}>Práctica Interactiva</h2>
      <p className={styles.subtitle}>
        Pon a prueba lo que has aprendido paso a paso. Recuerda que equivocarse es parte natural de aprender.
      </p>

      <div className={styles.contextCard}>
        <span className={styles.contextSubject}>{effectiveSubjectName}</span>
        <h3 className={styles.contextTopic}>{effectiveTopicName}</h3>
        {topic?.description && (
          <p className={styles.contextDesc}>{topic.description}</p>
        )}
      </div>

      <div className={styles.metaRow}>
        <span className={styles.metaItem}>
          <span aria-hidden="true">📝</span>
          <span>{totalActivities} actividades interactivas</span>
        </span>
        <span className={styles.metaItem}>
          <span aria-hidden="true">⏱️</span>
          <span>A tu propio ritmo</span>
        </span>
      </div>

      <button
        type="button"
        className={styles.startButton}
        onClick={onStart}
        aria-label={`Comenzar práctica sobre ${effectiveTopicName}`}
      >
        <span>🌸</span>
        <span>Comenzar práctica</span>
      </button>
    </div>
  );
};
