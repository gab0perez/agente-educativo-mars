import React, { useId } from 'react';
import styles from './QuestionCard.module.css';
import { PracticeActivity } from '../../../learning/domain/types';
import { ProvenanceBadge } from '../../../components/ui/ProvenanceBadge/ProvenanceBadge';

export interface OpenResponseQuestionProps {
  activity: PracticeActivity;
  selectedAnswer: string;
  onSelectAnswer: (answer: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export const OpenResponseQuestion: React.FC<OpenResponseQuestionProps> = ({
  activity,
  selectedAnswer,
  onSelectAnswer,
  onSubmit,
  disabled = false
}) => {
  const textareaId = useId();

  return (
    <div className={styles.container} role="region" aria-label="Pregunta de respuesta abierta">
      <div className={styles.typeBadgeRow}>
        <span className={styles.typeBadge}>Respuesta Abierta</span>
        <ProvenanceBadge origin={activity.provenance || 'AI_COMPLEMENTARY'} size="sm" />
      </div>

      <h3 className={styles.prompt}>{activity.prompt}</h3>

      <div className={styles.inputWrapper}>
        <label htmlFor={textareaId} className={styles.inputLabel}>
          Tu explicación personal:
        </label>
        <textarea
          id={textareaId}
          className={styles.textarea}
          value={selectedAnswer}
          onChange={(e) => onSelectAnswer(e.target.value)}
          placeholder="Explica tu idea con tus propias palabras..."
          rows={4}
          disabled={disabled}
        />
      </div>

      {!disabled && (
        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.submitButton}
            onClick={onSubmit}
            disabled={!selectedAnswer.trim()}
          >
            <span>🌸</span>
            <span>Confirmar respuesta</span>
          </button>
        </div>
      )}
    </div>
  );
};
