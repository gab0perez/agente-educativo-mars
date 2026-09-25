import React from 'react';
import { PracticeActivity } from '../../../learning/domain/types';
import { Button } from '../../../components/ui/Button/Button';
import styles from './ExamQuestion.module.css';

export interface ExamQuestionProps {
  activity: PracticeActivity;
  currentAnswer: string;
  questionIndex: number;
  totalQuestions: number;
  isFirst: boolean;
  isLast: boolean;
  onAnswer: (answer: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenReview: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: 'Opción múltiple',
  TRUE_FALSE: 'Verdadero o Falso',
  SHORT_ANSWER: 'Respuesta breve',
  OPEN_RESPONSE: 'Respuesta abierta'
};

export const ExamQuestion: React.FC<ExamQuestionProps> = ({
  activity,
  currentAnswer,
  questionIndex,
  totalQuestions,
  isFirst,
  isLast,
  onAnswer,
  onPrev,
  onNext,
  onOpenReview
}) => {
  const typeLabel = TYPE_LABELS[activity.type] || 'Pregunta';

  return (
    <article className={styles.container} aria-labelledby="exam-question-prompt">
      <div className={styles.typeBadge}>
        {typeLabel} • Pregunta {questionIndex + 1} de {totalQuestions}
      </div>

      <h2 id="exam-question-prompt" className={styles.prompt}>
        {activity.prompt}
      </h2>

      {/* MULTIPLE CHOICE */}
      {activity.type === 'MULTIPLE_CHOICE' && activity.options && (
        <div className={styles.optionsList} role="radiogroup" aria-label="Opciones de respuesta">
          {activity.options.map((opt, idx) => {
            const isSelected = currentAnswer === opt.id || currentAnswer === opt.text;
            return (
              <button
                key={opt.id || idx}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`${styles.optionCard} ${isSelected ? styles.selectedOption : ''}`}
                onClick={() => onAnswer(opt.id || opt.text)}
              >
                <span className={`${styles.optionIndicator} ${isSelected ? styles.selectedIndicator : ''}`}>
                  {isSelected ? '✓' : String.fromCharCode(65 + idx)}
                </span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* TRUE / FALSE */}
      {activity.type === 'TRUE_FALSE' && (
        <div className={styles.trueFalseRow} role="radiogroup" aria-label="Opciones verdadero o falso">
          {['Verdadero', 'Falso'].map((choice) => {
            const isSelected = currentAnswer.toLowerCase() === choice.toLowerCase();
            return (
              <button
                key={choice}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`${styles.tfButton} ${isSelected ? styles.selectedTf : ''}`}
                onClick={() => onAnswer(choice)}
              >
                {choice}
              </button>
            );
          })}
        </div>
      )}

      {/* SHORT ANSWER */}
      {activity.type === 'SHORT_ANSWER' && (
        <div>
          <label htmlFor="short-answer-input" className="sr-only">
            Tu respuesta
          </label>
          <input
            id="short-answer-input"
            type="text"
            className={styles.textInput}
            value={currentAnswer}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
            autoComplete="off"
          />
        </div>
      )}

      {/* OPEN RESPONSE */}
      {activity.type === 'OPEN_RESPONSE' && (
        <div>
          <label htmlFor="open-response-input" className="sr-only">
            Tu desarrollo o explicación
          </label>
          <textarea
            id="open-response-input"
            className={styles.textareaInput}
            value={currentAnswer}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Desarrolla tu explicación con tus propias palabras..."
            rows={4}
          />
        </div>
      )}

      {/* Navigation Footer */}
      <div className={styles.navRow}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={isFirst}
          aria-label="Pregunta anterior"
        >
          ← Anterior
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenReview}
          aria-label="Revisar todas las preguntas"
        >
          📋 Revisar
        </Button>

        {isLast ? (
          <Button
            variant="primary"
            size="sm"
            onClick={onNext}
            aria-label="Ir a la revisión final"
          >
            Revisar examen →
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={onNext}
            aria-label="Siguiente pregunta"
          >
            Siguiente →
          </Button>
        )}
      </div>
    </article>
  );
};
