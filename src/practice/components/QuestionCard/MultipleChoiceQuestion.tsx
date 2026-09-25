import React from 'react';
import styles from './QuestionCard.module.css';
import { PracticeActivity } from '../../../learning/domain/types';
import { ProvenanceBadge } from '../../../components/ui/ProvenanceBadge/ProvenanceBadge';

export interface MultipleChoiceQuestionProps {
  activity: PracticeActivity;
  selectedAnswer: string;
  onSelectAnswer: (answer: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  activity,
  selectedAnswer,
  onSelectAnswer,
  onSubmit,
  disabled = false
}) => {
  const options = activity.options || [];

  return (
    <div className={styles.container} role="region" aria-label="Pregunta de opción múltiple">
      <div className={styles.typeBadgeRow}>
        <span className={styles.typeBadge}>Opción Múltiple</span>
        <ProvenanceBadge origin={activity.provenance || 'AI_COMPLEMENTARY'} size="sm" />
      </div>

      <h3 className={styles.prompt}>{activity.prompt}</h3>

      <ul className={styles.optionsList} role="radiogroup" aria-label="Opciones de respuesta">
        {options.map((opt) => {
          const isSelected = selectedAnswer === opt.id || selectedAnswer === opt.text;

          return (
            <li
              key={opt.id}
              className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ''} ${
                disabled ? styles.optionDisabled : ''
              }`}
              onClick={() => !disabled && onSelectAnswer(opt.id)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={disabled ? -1 : 0}
              onKeyDown={(e) => {
                if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
                  e.preventDefault();
                  onSelectAnswer(opt.id);
                }
              }}
            >
              <div className={styles.radioCircle} aria-hidden="true">
                {isSelected && <div className={styles.radioDot} />}
              </div>
              <span className={styles.optionText}>{opt.text}</span>
            </li>
          );
        })}
      </ul>

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
