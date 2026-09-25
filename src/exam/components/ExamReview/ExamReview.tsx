import React from 'react';
import { ExamAnswer } from '../../domain/examTypes';
import { PracticeActivity } from '../../../learning/domain/types';
import { Button } from '../../../components/ui/Button/Button';
import styles from './ExamReview.module.css';

export interface ExamReviewProps {
  answers: ExamAnswer[];
  activities: PracticeActivity[];
  onResumeExam: () => void;
  onGoToQuestion: (index: number) => void;
  onFinalizeExam: () => void;
}

export const ExamReview: React.FC<ExamReviewProps> = ({
  answers,
  activities,
  onResumeExam,
  onGoToQuestion,
  onFinalizeExam
}) => {
  const total = answers.length;
  const answeredCount = answers.filter((a) => a.isAnswered).length;
  const unansweredCount = total - answeredCount;

  return (
    <article className={styles.container} aria-labelledby="exam-review-title">
      <header className={styles.header}>
        <h2 id="exam-review-title" className={styles.title}>
          Revisión antes de finalizar
        </h2>
        <p className={styles.subtitle}>
          Verifica tus respuestas o regresa a cualquier pregunta pendiente antes de enviar tu examen.
        </p>
      </header>

      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{total}</span>
          <span className={styles.statLabel}>Preguntas</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber} style={{ color: '#166534' }}>
            {answeredCount}
          </span>
          <span className={styles.statLabel}>Respondidas</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber} style={{ color: unansweredCount > 0 ? '#b45309' : '#6b7280' }}>
            {unansweredCount}
          </span>
          <span className={styles.statLabel}>Pendientes</span>
        </div>
      </div>

      {unansweredCount > 0 && (
        <div className={styles.warningBox} role="alert">
          🌸 Aún tienes <strong>{unansweredCount} {unansweredCount === 1 ? 'pregunta' : 'preguntas'}</strong> sin responder. Puedes hacer clic en cualquiera para completarla o finalizar si así lo prefieres.
        </div>
      )}

      <div className={styles.questionList} role="list" aria-label="Lista de preguntas a revisar">
        {answers.map((ans, idx) => {
          const act = activities.find((a) => a.id === ans.activityId);
          const preview = act?.prompt || `Pregunta ${idx + 1}`;

          return (
            <button
              key={ans.activityId || idx}
              type="button"
              role="listitem"
              className={styles.questionItem}
              onClick={() => onGoToQuestion(idx)}
              aria-label={`Pregunta ${idx + 1}: ${preview}. Estado: ${
                ans.isAnswered ? 'Respondida' : 'Pendiente'
              }. Haz clic para editar.`}
            >
              <div className={styles.questionInfo}>
                <span className={styles.questionIndex}>#{idx + 1}</span>
                <span className={styles.questionPromptPreview}>{preview}</span>
              </div>
              <span
                className={`${styles.statusBadge} ${
                  ans.isAnswered ? styles.answeredBadge : styles.pendingBadge
                }`}
              >
                {ans.isAnswered ? '✓ Respondida' : '○ Pendiente'}
              </span>
            </button>
          );
        })}
      </div>

      <footer className={styles.actionsRow}>
        <Button
          variant="ghost"
          size="md"
          onClick={onResumeExam}
          aria-label="Volver al examen"
        >
          ← Volver a las preguntas
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={onFinalizeExam}
          aria-label="Finalizar examen y ver resultados"
        >
          Finalizar examen ✨
        </Button>
      </footer>
    </article>
  );
};
