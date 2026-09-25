import React, { useState } from 'react';
import styles from './SocraticStepView.module.css';
import { SocraticStep } from '../../../ai/domain/types';

export interface SocraticStepViewProps {
  step: SocraticStep;
  onAskForClue?: () => void;
}

const LEVEL_LABELS: Record<string, { label: string; icon: string }> = {
  HINT_1: { label: 'Pista de inicio', icon: '🌱' },
  HINT_2: { label: 'Pista intermedia', icon: '🌿' },
  HINT_3: { label: 'Pista avanzada', icon: '🌸' },
  EXPLANATION: { label: 'Explicación guiada', icon: '✨' }
};

export const SocraticStepView: React.FC<SocraticStepViewProps> = ({ step }) => {
  const [showClue, setShowClue] = useState(false);
  const levelInfo = LEVEL_LABELS[step.currentLevel] || {
    label: 'Guía de razonamiento',
    icon: '💡'
  };

  return (
    <div className={styles.container} role="region" aria-label="Paso socrático guiado">
      <div className={styles.header}>
        <span className={styles.badge}>
          <span aria-hidden="true">{levelInfo.icon}</span> {levelInfo.label}
        </span>
        <span className={styles.focus}>
          Enfoque: <strong>{step.expectedConceptFocus}</strong>
        </span>
      </div>

      <div className={styles.questionBox}>
        <span className={styles.questionIcon} aria-hidden="true">💭</span>
        <p className={styles.questionText}>{step.guidingQuestion}</p>
      </div>

      {step.clue && (
        <div className={styles.clueSection}>
          {!showClue ? (
            <button
              type="button"
              className={styles.clueToggle}
              onClick={() => setShowClue(true)}
              aria-expanded={false}
            >
              <span aria-hidden="true">🔍</span> Ver una pista adicional
            </button>
          ) : (
            <div className={styles.clueBox} aria-live="polite">
              <span className={styles.clueTitle}>
                <span aria-hidden="true">💡</span> Pista:
              </span>
              <p className={styles.clueText}>{step.clue}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
