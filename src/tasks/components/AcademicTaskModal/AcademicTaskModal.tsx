import React, { useState, useEffect } from 'react';
import { AcademicTask, CreateTaskInput, UpdateTaskInput } from '../../../types/task';
import { subjectRepository } from '../../../repositories/subjectRepository';
import { Button } from '../../../components/ui/Button/Button';
import styles from './AcademicTaskModal.module.css';

export interface AcademicTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTaskInput | UpdateTaskInput) => void;
  initialTask?: AcademicTask | null;
}

export const AcademicTaskModal: React.FC<AcademicTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const subjects = subjectRepository.getAll();
  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const availableTopics = selectedSubject?.topics || [];

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setSubjectId(initialTask.subjectId || '');
      setTopicId(initialTask.topicId || '');
      // Extraer formato YYYY-MM-DD para input date
      if (initialTask.dueAt) {
        setDueAt(initialTask.dueAt.substring(0, 10));
      } else {
        setDueAt('');
      }
    } else {
      setTitle('');
      setDescription('');
      setSubjectId('');
      setTopicId('');
      setDueAt('');
    }
    setError(null);
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubjectChange = (newSubjectId: string) => {
    setSubjectId(newSubjectId);
    setTopicId(''); // Limpiar tema al cambiar materia
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Por favor ingresa un título para la tarea.');
      return;
    }

    const payload: CreateTaskInput = {
      title: trimmedTitle,
      description: description.trim() || undefined,
      subjectId: subjectId || undefined,
      topicId: topicId || undefined,
      dueAt: dueAt ? `${dueAt}T23:59:59.000Z` : undefined
    };

    onSave(payload);
    onClose();
  };

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 id="task-modal-title" className={styles.title}>
            {initialTask ? 'Editar Tarea Académica 📝' : 'Nueva Tarea Académica 📝'}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <p className={styles.errorMessage} role="alert">{error}</p>}

          <div className={styles.fieldGroup}>
            <label htmlFor="task-title" className={styles.label}>
              Título de la tarea <span className={styles.requiredMark}>*</span>
            </label>
            <input
              id="task-title"
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ej. Resumen de sinergia y factores químicos"
              autoFocus
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="task-description" className={styles.label}>
              Descripción o indicaciones (opcional)
            </label>
            <textarea
              id="task-description"
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Incluir cuadro comparativo con ejemplos del cuaderno."
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="task-subject" className={styles.label}>
              Materia (opcional)
            </label>
            <select
              id="task-subject"
              className={styles.select}
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
            >
              <option value="">-- Sin materia asignada --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shortName || s.name}
                </option>
              ))}
            </select>
          </div>

          {subjectId && availableTopics.length > 0 && (
            <div className={styles.fieldGroup}>
              <label htmlFor="task-topic" className={styles.label}>
                Tema de la materia (opcional)
              </label>
              <select
                id="task-topic"
                className={styles.select}
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
              >
                <option value="">-- Sin tema específico --</option>
                {availableTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label htmlFor="task-due-date" className={styles.label}>
              Fecha de entrega (opcional)
            </label>
            <input
              id="task-due-date"
              type="date"
              className={styles.input}
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>

          <div className={styles.actions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
            >
              {initialTask ? 'Guardar Cambios' : 'Crear Tarea'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
