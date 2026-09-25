import React from 'react';
import styles from './TopicCard.module.css';
import { Topic, TopicStatus } from '../../types/academic';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge/ProvenanceBadge';
import { Button } from '../../components/ui/Button/Button';
import { MasteryLevel } from '../../learning/domain/types';
import { MasteryStatus } from '../../learning/components/MasteryStatus/MasteryStatus';

export interface TopicCardProps {
  topic: Topic;
  masteryLevel?: MasteryLevel;
  onStudy: () => void;
  onAskTutor?: (topic: Topic) => void;
  onPractice?: (topic: Topic) => void;
  onExam?: (topic: Topic) => void;
}

const STATUS_METADATA: Record<TopicStatus, { label: string; icon: string }> = {
  nuevo: { label: 'Nuevo tema', icon: '🌱' },
  en_estudio: { label: 'En estudio', icon: '📖' },
  revisado: { label: 'Revisado', icon: '🌸' }
};

export const TopicCard: React.FC<TopicCardProps> = ({ topic, masteryLevel, onStudy, onAskTutor, onPractice, onExam }) => {
  const statusInfo = STATUS_METADATA[topic.status];

  return (
    <article className={styles.card}>
      <div className={styles.topRow}>
        <span
          className={`${styles.statusBadge} ${styles[`status-${topic.status}`]}`}
          role="status"
          aria-label={`Estado del tema: ${statusInfo.label}`}
        >
          <span aria-hidden="true">{statusInfo.icon}</span>
          <span>{statusInfo.label}</span>
        </span>

        {masteryLevel && (
          <MasteryStatus level={masteryLevel} size="sm" />
        )}

        {topic.isClassOrigin && (
          <ProvenanceBadge origin="CLASS_ORIGIN" size="sm" />
        )}
      </div>

      <h4 className={styles.title}>{topic.name}</h4>
      <p className={styles.description}>{topic.description}</p>

      <div className={styles.actionRow}>
        <Button
          variant={topic.status === 'en_estudio' ? 'primary' : 'secondary'}
          size="sm"
          onClick={onStudy}
          type="button"
        >
          {topic.status === 'en_estudio' ? 'Estudiar lección' : 'Ver lección'}
        </Button>

        {onPractice && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPractice(topic)}
            type="button"
            aria-label={`Practicar actividades sobre ${topic.name}`}
          >
            🎯 Practicar
          </Button>
        )}

        {onExam && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onExam(topic)}
            type="button"
            aria-label={`Hacer examen sobre ${topic.name}`}
          >
            📝 Examen
          </Button>
        )}

        {onAskTutor && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAskTutor(topic)}
            type="button"
            aria-label={`Preguntar a Mar IA sobre ${topic.name}`}
          >
            🌸 Preguntar a MAR
          </Button>
        )}
      </div>
    </article>
  );
};
