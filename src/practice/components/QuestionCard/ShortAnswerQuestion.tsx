import React, { useId } from 'react';
import styles from './QuestionCard.module.css';
import { PracticeActivity } from '../../../learning/domain/types';
import { ProvenanceBadge } from '../../../components/ui/ProvenanceBadge/ProvenanceBadge';

export interface ShortAnswerQuestionProps {
  activity: PracticeActivity;
  selectedAnswer: string;
  onSelectAnswer: (answer: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export const ShortAnswerQuestion: React.FC<ShortAnswerQuestionProps> = ({
  activity,
  selectedAnswer,
  onSelectAnswer,
  onSubmit,
  disabled = false
}) => {
  const inputId = useId();

  return (
    <div className={styles.container} role="region" aria-label="Pregunta de respuesta corta">
      <div className={styles.typeBadgeRow}>
        <span className={styles.typeBadge}>Respuesta Corta</span>
        <ProvenanceBadge origin={activity.provenance || 'AI_COMPLEMENTARY'} size="sm" />
      </div>

      <h3 className={styles.prompt}>{activity.prompt}</h3>

      <form
        className={styles.inputWrapper}
        onSubmit={(e) => {
          e.preventDefault();
          if (!disabled && selectedAnswer.trim()) {
            onSubmit();
          }
        }}
      >
        <label htmlFor={inputId} className={styles.inputLabel}>
          Escribe tu respuesta:
        </label>
        <input
          id={inputId}
          type="text"
          className={styles.textInput}
          value={selectedAnswer}
          onChange={(e) => onSelectAnswer(e.target.value)}
          placeholder="Escribe el concepto o término clave..."
          disabled={disabled}
          autoComplete="off"
        />

        {!disabled && (
          <div className={styles.actionsRow}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!selectedAnswer.trim()}
            >
              <span>🌸</span>
              <span>Confirmar respuesta</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
