import React from 'react';
import { Topic } from '../../../types/academic';
import { useLearningSummary } from '../../hooks/useLearningSummary';
import { MasteryStatus } from '../MasteryStatus/MasteryStatus';
import { Button } from '../../../components/ui/Button/Button';
import styles from './LearningSummary.module.css';

export interface LearningSummaryProps {
  subjectId?: string;
  onSelectTopic?: (topic: Topic) => void;
  onPracticeTopic?: (topic: Topic) => void;
  onAskTutor?: (topic: Topic) => void;
  className?: string;
}

export const LearningSummary: React.FC<LearningSummaryProps> = ({
  subjectId,
  onSelectTopic,
  onPracticeTopic,
  onAskTutor,
  className = ''
}) => {
  const {
    topicsWithMastery,
    activeTopics,
    needsAttentionTopics,
    isLoading
  } = useLearningSummary({ subjectId });

  if (isLoading) {
    return (
      <div className={`${styles.container} ${className}`} role="status">
        <p className={styles.subtitle}>Consultando tu trayectoria de aprendizaje...</p>
      </div>
    );
  }

  const understoodOrStrong = topicsWithMastery.filter(
    (t) => t.mastery.level === 'UNDERSTOOD' || t.mastery.level === 'STRONG'
  );
  const developing = topicsWithMastery.filter(
    (t) => t.mastery.level === 'DEVELOPING'
  );

  return (
    <section
      className={`${styles.container} ${className}`}
      aria-label="Resumen de aprendizaje"
    >
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span>🌸</span>
          <span>Tu trayectoria de aprendizaje</span>
        </h2>
      </div>

      <p className={styles.subtitle}>
        {activeTopics.length === 0
          ? 'Conforme realices prácticas y reflexiones, MAR organizará aquí tus temas para que sepas dónde concentrar tu atención.'
          : 'Panorama cualitativo de los temas que has estudiado recientemente:'}
      </p>

      {activeTopics.length === 0 ? (
        <div className={styles.groupCard}>
          <div className={styles.groupHeader}>
            <span>🌱 Por comenzar</span>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--text-secondary, #57534E)' }}>
            Empieza explorando una lección o realizando una práctica interactiva para activar tu seguimiento personal.
          </p>
        </div>
      ) : (
        <div className={styles.groupsWrapper}>
          {needsAttentionTopics.length > 0 && (
            <div className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <span>💡 Conviene repasar ({needsAttentionTopics.length})</span>
              </div>
              <ul className={styles.topicsList}>
                {needsAttentionTopics.map(({ topic, mastery }) => (
                  <li key={topic.id} className={styles.topicItem}>
                    <div>
                      <div className={styles.topicName}>{topic.name}</div>
                      <div className={styles.topicMeta}>
                        {mastery.qualitativeSummary || 'Dificultades recientes'}
                      </div>
                    </div>
                    <div className={styles.topicActions}>
                      <MasteryStatus level={mastery.level} size="sm" />
                      {onPracticeTopic && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onPracticeTopic(topic)}
                          type="button"
                          aria-label={`Practicar ${topic.name}`}
                        >
                          Practicar
                        </Button>
                      )}
                      {onAskTutor && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAskTutor(topic)}
                          type="button"
                          aria-label={`Preguntar a MAR sobre ${topic.name}`}
                        >
                          Preguntar
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {developing.length > 0 && (
            <div className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <span>🌿 En desarrollo ({developing.length})</span>
              </div>
              <ul className={styles.topicsList}>
                {developing.map(({ topic, mastery }) => (
                  <li key={topic.id} className={styles.topicItem}>
                    <div>
                      <div className={styles.topicName}>{topic.name}</div>
                      <div className={styles.topicMeta}>
                        {mastery.qualitativeSummary || 'Construyendo conceptos'}
                      </div>
                    </div>
                    <div className={styles.topicActions}>
                      <MasteryStatus level={mastery.level} size="sm" />
                      {onPracticeTopic && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPracticeTopic(topic)}
                          type="button"
                          aria-label={`Practicar ${topic.name}`}
                        >
                          Practicar
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {understoodOrStrong.length > 0 && (
            <div className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <span>🌸 Comprensión sólida ({understoodOrStrong.length})</span>
              </div>
              <ul className={styles.topicsList}>
                {understoodOrStrong.map(({ topic, mastery }) => (
                  <li key={topic.id} className={styles.topicItem}>
                    <div>
                      <div className={styles.topicName}>{topic.name}</div>
                      <div className={styles.topicMeta}>
                        {mastery.qualitativeSummary || 'Conceptos afianzados'}
                      </div>
                    </div>
                    <div className={styles.topicActions}>
                      <MasteryStatus level={mastery.level} size="sm" />
                      {onSelectTopic && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectTopic(topic)}
                          type="button"
                          aria-label={`Ver ${topic.name}`}
                        >
                          Ver
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
