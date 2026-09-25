import React from 'react';
import { Subject, Topic } from '../../../types/academic';
import { useTopicMastery } from '../../hooks/useTopicMastery';
import { MasteryStatus } from '../MasteryStatus/MasteryStatus';
import { Button } from '../../../components/ui/Button/Button';
import styles from './TopicLearningStatus.module.css';

export interface TopicLearningStatusProps {
  subject?: Subject;
  topic: Topic;
  onPractice?: (topic: Topic) => void;
  onAskTutor?: (topic: Topic) => void;
  onViewLesson?: (topic: Topic) => void;
  onRequestReview?: (topic: Topic) => void;
  className?: string;
}

export const TopicLearningStatus: React.FC<TopicLearningStatusProps> = ({
  subject,
  topic,
  onPractice,
  onAskTutor,
  onViewLesson,
  onRequestReview,
  className = ''
}) => {
  const { mastery, evidenceCount, isLoading } = useTopicMastery({
    topicId: topic.id
  });

  const level = mastery?.level || 'UNKNOWN';

  const explanation =
    evidenceCount === 0
      ? 'Todavía no tenemos suficiente información sobre este tema. Cuando practiques o reflexiones sobre él, MAR irá conociendo mejor cómo lo estás aprendiendo.'
      : mastery?.qualitativeSummary
      ? mastery.qualitativeSummary
      : level === 'NEEDS_REVIEW'
      ? 'Detectamos algunas dificultades recientes. Un repaso breve te ayudará a afianzar los conceptos.'
      : level === 'DEVELOPING'
      ? 'Vas por buen camino. Continuar practicando te ayudará a afianzar este tema.'
      : level === 'UNDERSTOOD'
      ? 'Muestras una comprensión sólida en las actividades realizadas.'
      : 'Has consolidado este tema con éxito en tus repasos.';

  return (
    <div
      className={`${styles.container} ${className}`}
      role="region"
      aria-label={`Progreso de aprendizaje en ${topic.name}`}
    >
      <div className={styles.headerRow}>
        <div className={styles.title}>
          <span>🌸</span>
          <span>¿Cómo va tu aprendizaje?</span>
        </div>
        {subject && (
          <span style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--text-muted, #78716C)' }}>
            {subject.shortName || subject.name}
          </span>
        )}
      </div>

      <h3 className={styles.topicTitle}>{topic.name}</h3>

      <div className={styles.statusWrapper}>
        <MasteryStatus
          level={level}
          size="lg"
          showDescription={true}
        />
      </div>

      <p className={styles.explanationText}>
        {isLoading ? 'Consultando tu trayectoria...' : explanation}
      </p>

      <div className={styles.actionsRow}>
        {onPractice && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onPractice(topic)}
            type="button"
            aria-label={`Practicar ${topic.name}`}
          >
            🎯 Practicar
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

        {onRequestReview && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRequestReview(topic)}
            type="button"
            aria-label={`Solicitar repaso para ${topic.name}`}
          >
            💡 Repasar este tema
          </Button>
        )}

        {onViewLesson && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewLesson(topic)}
            type="button"
            aria-label={`Ver lección de ${topic.name}`}
          >
            📖 Ver lección
          </Button>
        )}
      </div>
    </div>
  );
};
