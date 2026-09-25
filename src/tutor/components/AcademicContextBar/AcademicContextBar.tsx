import React from 'react';
import styles from './AcademicContextBar.module.css';
import { TutorAcademicContext } from '../../types/tutorClientTypes';

export interface AcademicContextBarProps {
  academicContext: TutorAcademicContext;
  onClearContext?: () => void;
  onSelectTopic?: () => void;
}

export const AcademicContextBar: React.FC<AcademicContextBarProps> = ({
  academicContext,
  onClearContext
}) => {
  const subject = academicContext.subject;
  const topic = academicContext.topic;
  const lesson = academicContext.lesson;
  const notes = academicContext.selectedNotes || [];
  const activeNote = notes.find((n) => n.id === academicContext.activeNoteId) || (notes.length === 1 ? notes[0] : null);
  const notesCount = notes.length;

  if (!subject && !topic && !lesson && !activeNote && notesCount === 0) {
    return null;
  }

  return (
    <div className={styles.contextBar} role="region" aria-label="Contexto académico activo">
      <div className={styles.pillsContainer}>
        {subject && (
          <span className={styles.pill} title={`Materia: ${subject.name}`}>
            <span aria-hidden="true">{subject.icon || '📚'}</span>
            <span className={styles.pillText}>{subject.shortName || subject.name}</span>
          </span>
        )}

        {topic && (
          <span className={`${styles.pill} ${styles.topicPill}`} title={`Tema: ${topic.name}`}>
            <span aria-hidden="true">📖</span>
            <span className={styles.pillText}>Tema: {topic.name}</span>
          </span>
        )}

        {lesson && (
          <span className={`${styles.pill} ${styles.lessonPill}`} title={`Lección: ${lesson.title}`}>
            <span aria-hidden="true">✨</span>
            <span className={styles.pillText}>{lesson.title}</span>
          </span>
        )}

        {activeNote ? (
          <span className={`${styles.pill} ${styles.activeNotePill}`} title={`Apunte seleccionado: ${activeNote.title}`}>
            <span aria-hidden="true">📷</span>
            <span className={styles.pillText}>Apunte: {activeNote.title}</span>
          </span>
        ) : notesCount > 0 ? (
          <span className={`${styles.pill} ${styles.notesPill}`} title={`${notesCount} apuntes vinculados`}>
            <span aria-hidden="true">📸</span>
            <span className={styles.pillText}>{notesCount} apunte{notesCount > 1 ? 's' : ''}</span>
          </span>
        ) : null}
      </div>

      {onClearContext && (
        <button
          type="button"
          onClick={onClearContext}
          className={styles.clearButton}
          aria-label="Quitar contexto académico actual"
          title="Estudiar sin tema fijo"
        >
          ✕
        </button>
      )}
    </div>
  );
};
