import React, { useState } from 'react';
import styles from './ExerciseCardView.module.css';

export interface ExerciseCardViewProps {
  exercise: {
    title: string;
    instructions: string;
    hints: string[];
  };
}

export const ExerciseCardView: React.FC<ExerciseCardViewProps> = ({ exercise }) => {
  const [showHints, setShowHints] = useState(false);

  return (
    <div className={styles.container} role="region" aria-label={`Ejercicio: ${exercise.title}`}>
      <div className={styles.badgeHeader}>
        <span className={styles.badge}>
          <span aria-hidden="true">✍️</span> Reto de práctica
        </span>
      </div>

      <h4 className={styles.title}>{exercise.title}</h4>

      <p className={styles.instructions}>{exercise.instructions}</p>

      {exercise.hints && exercise.hints.length > 0 && (
        <div className={styles.hintsContainer}>
          <button
            type="button"
            className={styles.hintsToggle}
            onClick={() => setShowHints(!showHints)}
            aria-expanded={showHints}
          >
            <span aria-hidden="true">{showHints ? '▼' : '▶'}</span>{' '}
            {showHints ? 'Ocultar pistas' : `Ver pistas (${exercise.hints.length})`}
          </button>

          {showHints && (
            <ul className={styles.hintsList} aria-live="polite">
              {exercise.hints.map((hint, idx) => (
                <li key={idx} className={styles.hintItem}>
                  <span className={styles.hintBullet} aria-hidden="true">💡</span>
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
