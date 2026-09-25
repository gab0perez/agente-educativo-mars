import React from 'react';
import { ExamSummary } from '../../domain/examTypes';
import { Button } from '../../../components/ui/Button/Button';
import styles from './ExamResults.module.css';

export interface ExamResultsProps {
  summary: ExamSummary;
  onGoHome?: () => void;
  onGoToPractice?: () => void;
  onGoToTopics?: () => void;
}

export const ExamResults: React.FC<ExamResultsProps> = ({
  summary,
  onGoHome,
  onGoToPractice,
  onGoToTopics
}) => {
  return (
    <article className={styles.container} aria-labelledby="exam-results-title">
      <header className={styles.hero}>
        <div className={styles.iconWrapper} aria-hidden="true">🌸</div>
        <h2 id="exam-results-title" className={styles.title}>
          Examen terminado
        </h2>
        <p className={styles.subtitle}>
          Completaste {summary.examTitle}
          {summary.subjectName ? ` • ${summary.subjectName}` : ''}
        </p>
      </header>

      {/* Stats qualitative (No school grades, No GPA) */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.correctStat}`}>
          <span className={styles.statNumber}>✓ {summary.correctCount}</span>
          <span className={styles.statLabel}>Respuestas correctas</span>
        </div>
        <div className={`${styles.statCard} ${styles.reviewStat}`}>
          <span className={styles.statNumber}>○ {summary.reviewCount}</span>
          <span className={styles.statLabel}>Para revisar</span>
        </div>
      </div>

      {/* Qualitative Feedback */}
      <div className={styles.feedbackBox} role="status">
        <p className={styles.feedbackText}>{summary.qualitativeFeedback}</p>
      </div>

      {/* Concepts to review */}
      {summary.conceptsToReview.length > 0 && (
        <section className={styles.conceptsSection} aria-labelledby="concepts-to-review-title">
          <h3 id="concepts-to-review-title" className={styles.conceptsTitle}>
            Conceptos sugeridos para repasar
          </h3>
          <div className={styles.conceptsList}>
            {summary.conceptsToReview.map((concept, idx) => (
              <span key={idx} className={styles.conceptTag}>
                {concept}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Detailed questions overview */}
      <section className={styles.evaluationsSection} aria-labelledby="evaluations-title">
        <h3 id="evaluations-title" className={styles.evaluationsTitle}>
          Detalle de tus respuestas ({summary.evaluations.length})
        </h3>

        {summary.evaluations.map((ev, idx) => {
          let badgeClass = styles.evalReview;
          let badgeText = '○ Para revisar';

          if (ev.isCorrect) {
            badgeClass = styles.evalCorrect;
            badgeText = '✓ Correcta';
          } else if (ev.result === 'UNCLEAR') {
            badgeClass = styles.evalUnclear;
            badgeText = '◇ Respuesta abierta';
          }

          return (
            <div key={ev.activityId || idx} className={styles.evalCard}>
              <div className={styles.evalHeader}>
                <h4 className={styles.evalPrompt}>
                  #{idx + 1}. {ev.prompt}
                </h4>
                <span className={`${styles.evalBadge} ${badgeClass}`}>
                  {badgeText}
                </span>
              </div>

              {ev.studentAnswer ? (
                <p className={styles.evalAnswerText}>
                  <strong>Tu respuesta:</strong> {ev.studentAnswer}
                </p>
              ) : (
                <p className={styles.evalAnswerText} style={{ fontStyle: 'italic' }}>
                  Sin respuesta respondida
                </p>
              )}

              {ev.feedback && (
                <p className={styles.evalExplanation}>
                  💡 {ev.feedback}
                </p>
              )}

              {ev.explanation && (
                <p className={styles.evalExplanation}>
                  📖 {ev.explanation}
                </p>
              )}
            </div>
          );
        })}
      </section>

      {/* Navigation actions */}
      <footer className={styles.actionsRow}>
        {onGoToTopics && (
          <Button variant="ghost" size="md" onClick={onGoToTopics}>
            ← Volver a Temas
          </Button>
        )}
        {onGoToPractice && (
          <Button variant="secondary" size="md" onClick={onGoToPractice}>
            🎯 Ir a Práctica
          </Button>
        )}
        {onGoHome && (
          <Button variant="primary" size="md" onClick={onGoHome}>
            🌸 Ir al Inicio
          </Button>
        )}
      </footer>
    </article>
  );
};
