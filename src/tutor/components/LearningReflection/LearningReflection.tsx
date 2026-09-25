import React, { useState, useEffect, useId } from 'react';
import styles from './LearningReflection.module.css';
import { Subject, Topic } from '../../../types/academic';
import { Lesson } from '../../../types/lesson';
import { Reflection } from '../../../types/reflection';
import {
  ReflectionRepository,
  reflectionRepository as defaultReflectionRepo
} from '../../../repositories/reflectionRepository';
import { IMARTutorClient, TutorClientMessage } from '../../types/tutorClientTypes';
import { getDefaultTutorClient } from '../../client';

export type ReflectionStatus =
  | 'IDLE'
  | 'WRITING'
  | 'SUBMITTING'
  | 'SAVED'
  | 'FEEDBACK'
  | 'ERROR';

export interface LearningReflectionProps {
  subject?: Subject;
  topic?: Topic;
  lesson?: Lesson;
  initialReflectionText?: string;
  onClose?: () => void;
  onSuccess?: (reflection: Reflection) => void;
  client?: IMARTutorClient;
  reflectionRepo?: ReflectionRepository;
  onContinueStudying?: () => void;
  onOpenTutor?: (reflectionText: string) => void;
}

export const LearningReflection: React.FC<LearningReflectionProps> = ({
  subject,
  topic,
  lesson,
  initialReflectionText = '',
  onClose,
  onSuccess,
  client,
  reflectionRepo = defaultReflectionRepo,
  onContinueStudying,
  onOpenTutor
}) => {
  const [reflectionText, setReflectionText] = useState<string>(initialReflectionText);
  const [status, setStatus] = useState<ReflectionStatus>(
    initialReflectionText.trim() ? 'WRITING' : 'IDLE'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tutorFeedback, setTutorFeedback] = useState<TutorClientMessage | null>(null);
  const [savedReflection, setSavedReflection] = useState<Reflection | null>(null);
  const [history, setHistory] = useState<Reflection[]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);

  const textareaId = useId();
  const helperId = useId();
  const errorId = useId();

  // Cargar historial previo de reflexiones para el contexto académico
  useEffect(() => {
    let relevant: Reflection[] = [];
    if (lesson?.id) {
      relevant = reflectionRepo.getByLessonId(lesson.id);
    } else if (topic?.id) {
      relevant = reflectionRepo.getByTopicId(topic.id);
    } else if (subject?.id) {
      relevant = reflectionRepo.getBySubjectId(subject.id);
    } else {
      relevant = reflectionRepo.getAll();
    }
    setHistory(relevant);
  }, [lesson?.id, topic?.id, subject?.id, reflectionRepo]);

  const effectiveSubjectName =
    subject?.name || subject?.shortName || lesson?.subjectName;
  const effectiveTopicName =
    topic?.name || lesson?.topicName;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setReflectionText(val);
    if (status === 'ERROR') {
      setErrorMessage(null);
    }
    setStatus(val.trim().length > 0 ? 'WRITING' : 'IDLE');
  };

  const handleSaveAndReflect = async () => {
    const trimmed = reflectionText.trim();
    if (!trimmed) return;

    setStatus('SUBMITTING');
    setErrorMessage(null);

    try {
      // 1. Guardar la reflexión en el repositorio local (USER_PROVIDED)
      const saved = reflectionRepo.saveReflection({
        lessonId: lesson?.id,
        subjectId: subject?.id || lesson?.subjectId,
        subjectName: effectiveSubjectName,
        topicId: topic?.id || lesson?.topicId,
        topicName: effectiveTopicName,
        prompt: '¿Qué aprendiste hoy?',
        answer: trimmed,
        provenance: 'USER_PROVIDED'
      });

      setSavedReflection(saved);

      // Actualizar historial local
      if (lesson?.id) {
        setHistory(reflectionRepo.getByLessonId(lesson.id));
      } else if (topic?.id) {
        setHistory(reflectionRepo.getByTopicId(topic.id));
      } else if (subject?.id) {
        setHistory(reflectionRepo.getBySubjectId(subject.id));
      } else {
        setHistory(reflectionRepo.getAll());
      }

      // 2. Obtener retroalimentación pedagógica del tutor
      const tutorClient = client || getDefaultTutorClient();

      // Configurar el contexto académico activo en el cliente si está disponible
      tutorClient.setAcademicContext({
        subject,
        topic,
        lesson,
        studentReflectionText: trimmed
      });

      const response = await tutorClient.sendMessage(trimmed, {
        mode: 'REVIEW',
        studentIntent: 'Reflexión de cierre de sesión: ¿Qué aprendiste hoy?'
      });

      if (response.isError) {
        // En caso de respuesta de error del tutor, la reflexión YA está guardada
        setStatus('SAVED');
        setErrorMessage(response.text);
      } else {
        setTutorFeedback(response);
        setStatus('FEEDBACK');
      }

      onSuccess?.(saved);
    } catch (err) {
      // Preservar el texto escrito y mostrar mensaje amigable
      const msg =
        err instanceof Error
          ? err.message
          : 'No pudimos procesar tu reflexión en este momento.';
      setErrorMessage(msg);
      setStatus('ERROR');
    }
  };

  const isSubmitDisabled =
    reflectionText.trim().length === 0 || status === 'SUBMITTING';

  return (
    <div
      className={styles.container}
      role="region"
      aria-label="¿Qué aprendiste hoy? - Reflexión de aprendizaje"
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.topRow}>
          <div className={styles.titleArea}>
            <span className={styles.lilyIcon} aria-hidden="true">
              🌸
            </span>
            <h2 className={styles.title}>¿Qué aprendiste hoy?</h2>
          </div>
          {onClose && (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Cerrar reflexión"
            >
              ✕
            </button>
          )}
        </div>

        <p id={helperId} className={styles.helperText}>
          Explícalo con tus propias palabras. No importa si todavía no está
          perfecto.
        </p>

        {(effectiveSubjectName || effectiveTopicName) && (
          <div className={styles.contextTag}>
            <span aria-hidden="true">📌</span>
            <span>
              {effectiveSubjectName}
              {effectiveTopicName && <> · {effectiveTopicName}</>}
            </span>
          </div>
        )}
      </div>

      {/* Formulario de Reflexión */}
      <form
        className={styles.formSection}
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveAndReflect();
        }}
      >
        <div className={styles.textareaWrapper}>
          <label htmlFor={textareaId} className={styles.label}>
            Tu reflexión personal:
          </label>
          <textarea
            id={textareaId}
            className={styles.textarea}
            value={reflectionText}
            onChange={handleTextChange}
            placeholder="Hoy aprendí que..."
            rows={4}
            disabled={status === 'SUBMITTING'}
            aria-describedby={`${helperId} ${errorMessage ? errorId : ''}`}
          />
        </div>

        {/* Estado cargando */}
        {status === 'SUBMITTING' && (
          <div className={styles.loadingState} role="status" aria-live="polite">
            <div className={styles.spinner} aria-hidden="true" />
            <span>Guardando tu reflexión y consultando a Mar IA...</span>
          </div>
        )}

        {/* Estado Error */}
        {status === 'ERROR' && errorMessage && (
          <div
            id={errorId}
            className={styles.errorBanner}
            role="alert"
            aria-live="assertive"
          >
            <span>{errorMessage}</span>
            <div className={styles.errorActions}>
              <button
                type="button"
                className={styles.retryButton}
                onClick={handleSaveAndReflect}
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Acciones principales */}
        {status !== 'FEEDBACK' && (
          <div className={styles.actionsRow}>
            {onClose && (
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onClose}
              >
                Volver
              </button>
            )}
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSubmitDisabled}
            >
              <span>🌸</span>
              <span>Guardar reflexión</span>
            </button>
          </div>
        )}
      </form>

      {/* Retroalimentación Pedagógica de Mar IA */}
      {status === 'FEEDBACK' && tutorFeedback && (
        <section
          className={styles.feedbackCard}
          aria-label="Retroalimentación de Mar IA"
        >
          <div className={styles.feedbackHeader}>
            <div className={styles.tutorIdentity}>
              <span aria-hidden="true">🌸</span>
              <span>Mar IA</span>
            </div>
            {tutorFeedback.provenance && (
              <span className={styles.provenanceBadge}>
                {tutorFeedback.provenance === 'AI_COMPLEMENTARY'
                  ? 'Guía Pedagógica'
                  : 'Inferencia IA'}
              </span>
            )}
          </div>

          {savedReflection && (
            <div className={styles.savedSnippet}>
              <span className={styles.savedSnippetLabel}>Tu reflexión:</span>
              <p className={styles.savedSnippetText}>"{savedReflection.answer}"</p>
            </div>
          )}

          <p className={styles.feedbackMessage}>{tutorFeedback.text}</p>

          <div className={styles.feedbackActions}>
            {onContinueStudying && (
              <button
                type="button"
                className={styles.followUpButton}
                onClick={onContinueStudying}
              >
                ✨ Seguir estudiando
              </button>
            )}
            {onOpenTutor && (
              <button
                type="button"
                className={styles.followUpButton}
                onClick={() => onOpenTutor(reflectionText)}
              >
                💬 Profundizar en el Tutor
              </button>
            )}
            {onClose && (
              <button
                type="button"
                className={styles.followUpButton}
                onClick={onClose}
              >
                Listo por hoy
              </button>
            )}
          </div>
        </section>
      )}

      {/* Historial de reflexiones asociadas */}
      {history.length > 0 && (
        <section className={styles.historySection} aria-label="Tus reflexiones">
          <button
            type="button"
            className={styles.historyHeader}
            onClick={() => setIsHistoryExpanded((prev) => !prev)}
            aria-expanded={isHistoryExpanded}
          >
            <span className={styles.historyTitle}>
              <span>💭</span>
              <span>Tus reflexiones ({history.length})</span>
            </span>
            <span className={styles.historyToggleIcon} aria-hidden="true">
              {isHistoryExpanded ? '▲' : '▼'}
            </span>
          </button>

          {isHistoryExpanded && (
            <ul className={styles.historyList}>
              {history.map((item) => {
                const dateStr = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  : 'Fecha guardada';

                return (
                  <li key={item.id} className={styles.historyItem}>
                    <div className={styles.historyMeta}>
                      <span className={styles.historyDate}>{dateStr}</span>
                      {item.topicName && (
                        <span className={styles.historyTopic}>
                          {item.topicName}
                        </span>
                      )}
                    </div>
                    <p className={styles.historyAnswer}>{item.answer}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};
