import React from 'react';
import { ExamAnswer } from '../../domain/examTypes';
import styles from './ExamQuestionNavigator.module.css';

export interface ExamQuestionNavigatorProps {
  answers: ExamAnswer[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
}

export const ExamQuestionNavigator: React.FC<ExamQuestionNavigatorProps> = ({
  answers,
  currentIndex,
  onSelectIndex
}) => {
  const answeredCount = answers.filter((a) => a.isAnswered).length;

  return (
    <nav className={styles.container} aria-label="Navegador de preguntas del examen">
      <div className={styles.headerRow}>
        <span className={styles.title}>Navegador</span>
        <span className={styles.counter} aria-live="polite">
          {answeredCount} de {answers.length} respondidas
        </span>
      </div>

      <div className={styles.grid} role="tablist" aria-label="Lista de preguntas">
        {answers.map((ans, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = ans.isAnswered;

          return (
            <button
              key={ans.activityId || idx}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Pregunta ${idx + 1}: ${isAnswered ? 'Respondida' : 'Pendiente'}`}
              className={`${styles.navButton} ${isCurrent ? styles.currentButton : ''} ${
                isAnswered ? styles.answered : ''
              }`}
              onClick={() => onSelectIndex(idx)}
            >
              <span>{idx + 1}</span>
              <span
                className={`${styles.statusIcon} ${
                  isAnswered ? styles.answeredIcon : styles.pendingIcon
                }`}
                aria-hidden="true"
              >
                {isAnswered ? '✓' : '—'}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
