import React from 'react';
import { PracticeAttempt } from '../../../learning/domain/types';
import { LilyBloom } from '../../../components/ui/LilyBloom/LilyBloom';
import { Button } from '../../../components/ui/Button/Button';
import styles from './PracticeCompletion.module.css';

export interface PracticeCompletionProps {
  topicTitle?: string;
  subjectTitle?: string;
  attempts: PracticeAttempt[];
  onRestart: () => void;
  onBackToTopic?: () => void;
}

export const PracticeCompletion: React.FC<PracticeCompletionProps> = ({
  topicTitle = 'Tema de Estudio',
  subjectTitle,
  attempts,
  onRestart,
  onBackToTopic
}) => {
  const hasErrors = attempts.some((a) => a.result === 'INCORRECT' || a.result === 'PARTIAL');
  const allCorrect = attempts.length > 0 && attempts.every((a) => a.result === 'CORRECT');

  return (
    <div className={styles.container} role="region" aria-label="Resumen de sesión de práctica">
      <LilyBloom
        title="¡Práctica completada!"
        subtitle="Has terminado tus actividades de estudio 🌸"
      />

      <div className={styles.summaryCard}>
        <div className={styles.topicTag}>
          <span>{subjectTitle ? `${subjectTitle} · ` : ''}{topicTitle}</span>
        </div>

        <h2 className={styles.heading}>Buen trabajo repasando hoy</h2>

        <p className={styles.message}>
          {allCorrect
            ? 'Demostraste un entendimiento muy claro de los conceptos practicados.'
            : hasErrors
            ? 'Completaste la sesión. Cada intento te ayuda a identificar qué puntos podemos seguir reforzando juntas.'
            : 'Has respondido todas las actividades con dedicación y serenidad.'}
        </p>

        <div className={styles.recapBox}>
          <div className={styles.recapTitle}>Observación pedagógica</div>
          <p className={styles.recapText}>
            {allCorrect
              ? 'Tus respuestas reflejan una comprensión sólida de los puntos clave.'
              : hasErrors
              ? 'Algunas ideas ya están claras. Hay otras que MAR puede ayudarte a repasar cuando lo desees.'
              : 'Tus respuestas quedaron registradas de forma cualitativa en tu trayectoria.'}
          </p>
        </div>

        <div className={styles.note}>
          <span>🌸</span>
          <span>Esta práctica quedó registrada para tu seguimiento personal.</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          variant="primary"
          onClick={onRestart}
          size="lg"
        >
          Practicar de nuevo
        </Button>
        {onBackToTopic && (
          <Button
            variant="ghost"
            onClick={onBackToTopic}
            size="lg"
          >
            Volver al tema
          </Button>
        )}
      </div>
    </div>
  );
};
