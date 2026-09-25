import React from 'react';
import { ExamConfig } from '../../domain/examTypes';
import { Button } from '../../../components/ui/Button/Button';
import styles from './ExamIntro.module.css';

export interface ExamIntroProps {
  config: ExamConfig;
  onStart: () => void;
  onCancel: () => void;
  className?: string;
}

export const ExamIntro: React.FC<ExamIntroProps> = ({
  config,
  onStart,
  onCancel,
  className = ''
}) => {
  return (
    <article
      className={`${styles.container} ${className}`}
      role="region"
      aria-label={`Introducción al examen: ${config.title}`}
    >
      <div className={styles.header}>
        <div className={styles.badgeRow}>
          {config.subjectName && (
            <span className={styles.badge}>📚 {config.subjectName}</span>
          )}
          {config.topicName && (
            <span className={styles.badge}>💡 {config.topicName}</span>
          )}
          <span className={styles.badge}>
            📝 {config.activityIds.length} preguntas formativas
          </span>
        </div>

        <h2 className={styles.title}>{config.title}</h2>
        {config.description && (
          <p className={styles.description}>{config.description}</p>
        )}
      </div>

      <div className={styles.guidelinesBox}>
        <p className={styles.guidelineItem}>
          <span>💡</span>
          <span><strong>Sin prisa ni presión:</strong> Responde a tu propio ritmo para evaluar lo que has aprendido.</span>
        </p>
        <p className={styles.guidelineItem}>
          <span>📝</span>
          <span><strong>Navegación libre:</strong> Puedes avanzar, retroceder y cambiar tus respuestas antes de finalizar.</span>
        </p>
        <p className={styles.guidelineItem}>
          <span>🌸</span>
          <span><strong>Resultados al terminar:</strong> Las retroalimentaciones y explicaciones completas se mostrarán al entregar el examen.</span>
        </p>
      </div>

      <div className={styles.actionsRow}>
        <Button
          variant="ghost"
          size="md"
          onClick={onCancel}
          type="button"
          aria-label="Cancelar y volver"
        >
          Volver
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={onStart}
          type="button"
          aria-label="Comenzar examen"
        >
          🌸 Comenzar Examen
        </Button>
      </div>
    </article>
  );
};
