import React from 'react';
import { MasteryHighlight } from '../../domain/dashboardTypes';
import { MasteryStatus } from '../../../learning/components/MasteryStatus/MasteryStatus';
import { Button } from '../../../components/ui/Button/Button';
import styles from './MasteryHighlights.module.css';

export interface MasteryHighlightsProps {
  strengths: MasteryHighlight[];
  needsReview: MasteryHighlight[];
  onPracticeTopic?: (topicId: string) => void;
  onStudyTopic?: (topicId: string) => void;
}

export const MasteryHighlights: React.FC<MasteryHighlightsProps> = ({
  strengths,
  needsReview,
  onPracticeTopic,
  onStudyTopic
}) => {
  return (
    <section className={styles.container} aria-labelledby="mastery-highlights-title">
      <h3 id="mastery-highlights-title" className="sr-only">
        Puntos Destacados de Comprensión
      </h3>

      <div className={styles.columnsGrid}>
        {/* Columna: Fortalezas */}
        <div className={styles.columnCard} aria-labelledby="strengths-title">
          <div className={styles.columnHeader}>
            <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>🌟</span>
            <h4 id="strengths-title" className={styles.columnTitle}>
              Fortalezas ({strengths.length})
            </h4>
          </div>

          {strengths.length === 0 ? (
            <p className={styles.emptyText}>
              Continúa practicando temas para consolidar tus primeras fortalezas aquí 🌸
            </p>
          ) : (
            <div className={styles.itemsList}>
              {strengths.slice(0, 3).map((item) => (
                <div key={item.topicId} className={styles.itemCard}>
                  <div className={styles.itemTop}>
                    <div>
                      <h5 className={styles.itemTitle}>{item.topicName}</h5>
                      {item.subjectName && (
                        <span className={styles.itemSubject}>{item.subjectName}</span>
                      )}
                    </div>
                    <MasteryStatus level={item.level} size="sm" />
                  </div>

                  {item.qualitativeSummary && (
                    <p className={styles.itemSummary}>
                      🌸 {item.qualitativeSummary}
                    </p>
                  )}

                  <div className={styles.itemFooter}>
                    {onStudyTopic && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onStudyTopic(item.topicId)}
                        aria-label={`Ver lección de ${item.topicName}`}
                      >
                        Ver lección
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna: Para reforzar */}
        <div className={styles.columnCard} aria-labelledby="needs-review-title">
          <div className={styles.columnHeader}>
            <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>💡</span>
            <h4 id="needs-review-title" className={styles.columnTitle}>
              Para Reforzar ({needsReview.length})
            </h4>
          </div>

          {needsReview.length === 0 ? (
            <p className={styles.emptyText}>
              ¡Excelente! No tienes temas con necesidades urgentes de refuerzo ✨
            </p>
          ) : (
            <div className={styles.itemsList}>
              {needsReview.slice(0, 3).map((item) => (
                <div key={item.topicId} className={styles.itemCard}>
                  <div className={styles.itemTop}>
                    <div>
                      <h5 className={styles.itemTitle}>{item.topicName}</h5>
                      {item.subjectName && (
                        <span className={styles.itemSubject}>{item.subjectName}</span>
                      )}
                    </div>
                    <MasteryStatus level={item.level} size="sm" />
                  </div>

                  {item.qualitativeSummary && (
                    <p className={styles.itemSummary}>
                      💡 {item.qualitativeSummary}
                    </p>
                  )}

                  <div className={styles.itemFooter}>
                    {onPracticeTopic && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onPracticeTopic(item.topicId)}
                        aria-label={`Practicar actividades de ${item.topicName}`}
                      >
                        🎯 Practicar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
