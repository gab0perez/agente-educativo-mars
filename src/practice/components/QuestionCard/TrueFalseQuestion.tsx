import React from 'react';
import styles from './QuestionCard.module.css';
import { PracticeActivity } from '../../../learning/domain/types';
import { ProvenanceBadge } from '../../../components/ui/ProvenanceBadge/ProvenanceBadge';

export interface TrueFalseQuestionProps {
  activity: PracticeActivity;
  selectedAnswer: string;
  onSelectAnswer: (answer: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export const TrueFalseQuestion: React.FC<TrueFalseQuestionProps> = ({
  activity,
  selectedAnswer,
  onSelectAnswer,
  onSubmit,
  disabled = false
}) => {
  const options = activity.options && activity.options.length > 0
    ? activity.options
    : [
        { id: 'true', text: 'Verdadero', isCorrect: true },
        { id: 'false', text: 'Falso', isCorrect: false }
      ];

  return (
    <div className={styles.container} role="region" aria-label="Pregunta de verdadero o falso">
      <div className={styles.typeBadgeRow}>
        <span className={styles.typeBadge}>Verdadero / Falso</span>
        <ProvenanceBadge origin={activity.provenance || 'AI_COMPLEMENTARY'} size="sm" />
      </div>

      <h3 className={styles.prompt}>{activity.prompt}</h3>

      <div className={styles.tfGrid} role="radiogroup" aria-label="Selecciona verdadero o falso">
        {options.map((opt) => {
          const isSelected = selectedAnswer === opt.id || selectedAnswer === opt.text;
          const isTrue = opt.id === 'true' || opt.text.toLowerCase().includes('verdadero');

          return (
            <button
              key={opt.id}
              type="button"
              className={`${styles.tfCard} ${isSelected ? styles.tfSelected : ''} ${
                disabled ? styles.optionDisabled : ''
              }`}
              onClick={() => !disabled && onSelectAnswer(opt.id)}
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
            >
              <span aria-hidden="true">{isTrue ? '✅' : '❌'}</span>
              <span>{opt.text}</span>
            </button>
          );
        })}
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
