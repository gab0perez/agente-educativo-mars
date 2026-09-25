import React from 'react';
import styles from './PracticeFeedback.module.css';
import { PracticeEvaluation } from '../../domain/practiceSessionTypes';

export interface PracticeFeedbackProps {
  evaluation: PracticeEvaluation;
  onNext: () => void;
  isLast: boolean;
}

export const PracticeFeedback: React.FC<PracticeFeedbackProps> = ({
  evaluation,
  onNext,
  isLast
}) => {
  const resultClass =
    evaluation.result === 'CORRECT'
      ? styles.resultCorrect
      : evaluation.result === 'PARTIAL'
      ? styles.resultPartial
      : evaluation.result === 'INCORRECT'
      ? styles.resultIncorrect
      : styles.resultUnclear;

  const badgeClass =
    evaluation.result === 'CORRECT'
      ? styles.statusBadgeCorrect
      : evaluation.result === 'PARTIAL'
      ? styles.statusBadgePartial
      : evaluation.result === 'INCORRECT'
      ? styles.statusBadgeIncorrect
      : styles.statusBadgeUnclear;

  const badgeLabel =
    evaluation.result === 'CORRECT'
      ? '¡Correcto!'
      : evaluation.result === 'PARTIAL'
      ? 'Buen camino'
      : evaluation.result === 'INCORRECT'
      ? 'A revisar'
      : 'Por aclarar';

  const badgeIcon =
    evaluation.result === 'CORRECT'
      ? '🌸'
      : evaluation.result === 'PARTIAL'
      ? '🌿'
      : evaluation.result === 'INCORRECT'
      ? '💡'
      : '🔍';

  return (
    <section
      className={`${styles.container} ${resultClass}`}
      role="region"
      aria-live="polite"
      aria-label="Retroalimentación de la respuesta"
    >
      <div className={styles.headerRow}>
        <span className={`${styles.statusBadge} ${badgeClass}`}>
          <span aria-hidden="true">{badgeIcon}</span>
          <span>{badgeLabel}</span>
        </span>
      </div>

      <p className={styles.feedbackText}>{evaluation.feedback}</p>

      {evaluation.explanation && evaluation.result !== 'CORRECT' && (
        <div className={styles.explanationBox}>
          <strong>Nota clave:</strong> {evaluation.explanation}
        </div>
      )}

      <div className={styles.actionsRow}>
        <button
          type="button"
          className={styles.nextButton}
          onClick={onNext}
          aria-label={isLast ? 'Ver resumen de la práctica' : 'Siguiente actividad'}
        >
          <span>{isLast ? 'Ver resultados 🌸' : 'Siguiente actividad →'}</span>
        </button>
      </div>
    </section>
  );
};
