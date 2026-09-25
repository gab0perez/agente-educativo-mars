import React, { useState } from 'react';
import styles from './SubjectsView.module.css';
import { Topic, Subject } from '../../types/academic';
import { subjectRepository } from '../../repositories/subjectRepository';
import { SubjectCard } from './SubjectCard';
import { TopicCard } from './TopicCard';
import { Button } from '../../components/ui/Button/Button';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { learningEngine } from '../../learning/service/LearningEngine';
import { TopicLearningStatus } from '../../learning/components/TopicLearningStatus/TopicLearningStatus';

export interface SubjectsViewProps {
  initialSelectedSubjectId?: string;
  onSelectTopic?: (topic: Topic) => void;
  onAskTutor?: (topic: Topic) => void;
  onPracticeTopic?: (topic: Topic) => void;
  onExamTopic?: (topic: Topic) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  initialSelectedSubjectId,
  onSelectTopic,
  onAskTutor,
  onPracticeTopic,
  onExamTopic
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    initialSelectedSubjectId || null
  );

  const subjects: Subject[] = subjectRepository.getAll();
  const selectedSubject = selectedSubjectId
    ? subjectRepository.getById(selectedSubjectId)
    : null;

  // VISTA 1: DETALLE DE MATERIA CON LISTA DE TEMAS
  if (selectedSubject) {
    return (
      <div className={styles.container}>
        <div className={styles.detailHeader}>
          <div className={styles.backButtonRow}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSubjectId(null)}
              type="button"
            >
              ← Volver a Materias
            </Button>
            <span className={styles.subjectCodeBadge}>{selectedSubject.code}</span>
          </div>

          <div className={styles.subjectTitleRow}>
            <span className={styles.subjectIconLarge} aria-hidden="true">
              {selectedSubject.icon}
            </span>
            <div>
              <h2 className={styles.subjectDetailTitle}>{selectedSubject.name}</h2>
            </div>
          </div>

          <p className={styles.subjectDetailDesc}>{selectedSubject.description}</p>
        </div>

        <section>
          <h3 className={styles.topicsSectionTitle}>
            Temas Disponibles ({selectedSubject.topics.length})
          </h3>

          {selectedSubject.topics.length === 0 ? (
            <EmptyState
              icon="📖"
              title="Aún no hay temas registrados"
              description="Los temas de esta materia se incorporarán en las siguientes fases o al capturar tus apuntes."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedSubjectId(null)}
                >
                  Ver otras materias
                </Button>
              }
            />
          ) : (
            <div className={styles.topicsList}>
              {selectedSubject.topics.map((topic) => {
                const topicMastery = learningEngine.getMastery(topic.id);
                return (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    masteryLevel={topicMastery.level}
                    onStudy={() => {
                      if (onSelectTopic) {
                        onSelectTopic(topic);
                      } else {
                        alert(`Tema seleccionado: ${topic.name} (${topic.status})`);
                      }
                    }}
                    onAskTutor={onAskTutor}
                    onPractice={onPracticeTopic}
                    onExam={onExamTopic}
                  />
                );
              })}
            </div>
          )}
        </section>

        {selectedSubject.topics.length > 0 && (
          <section style={{ marginTop: 'var(--space-6, 24px)' }}>
            <TopicLearningStatus
              subject={selectedSubject}
              topic={
                selectedSubject.topics.find((t) => t.status === 'en_estudio') ||
                selectedSubject.topics[0]
              }
              onPractice={onPracticeTopic}
              onAskTutor={onAskTutor}
              onViewLesson={onSelectTopic}
              onRequestReview={(topic) => {
                learningEngine.requestUserReview(topic.id);
                // Si existe onPracticeTopic, se puede iniciar práctica directa de repaso
                if (onPracticeTopic) {
                  onPracticeTopic(topic);
                }
              }}
            />
          </section>
        )}
      </div>
    );
  }

  // VISTA 2: CATÁLOGO GENERAL DE MATERIAS
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tus Materias</h1>
        <p className={styles.subtitle}>
          3er Semestre — Especialidad: Gestión de Recursos Humanos (CETis 164)
        </p>
      </header>

      {subjects.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No hay materias disponibles"
          description="Comprueba tu conexión o reinicia la aplicación."
        />
      ) : (
        <section className={styles.subjectsGrid}>
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onClick={() => setSelectedSubjectId(subject.id)}
            />
          ))}
        </section>
      )}
    </div>
  );
};
