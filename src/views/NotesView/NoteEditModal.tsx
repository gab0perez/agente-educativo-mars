import React, { useState } from 'react';
import { Note } from '../../types/notes';
import { Subject, Topic } from '../../types/academic';
import { ProvenanceOrigin } from '../../types/provenance';
import { Input, Button } from '../../components/ui';
import { subjectRepository } from '../../repositories/subjectRepository';
import { topicRepository } from '../../repositories/topicRepository';
import { noteRepository } from '../../repositories/noteRepository';
import styles from './NoteCreateModal.module.css';

export interface NoteEditModalProps {
  note: Note;
  onClose: () => void;
  onSuccess: (updatedNote: Note) => void;
}

export const NoteEditModal: React.FC<NoteEditModalProps> = ({
  note,
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState(note.title);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(note.subjectId || '');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(note.topicId || '');
  const [provenance, setProvenance] = useState<ProvenanceOrigin>(note.provenance || 'CLASS_ORIGIN');

  const subjects: Subject[] = subjectRepository.getAll();
  const availableTopics: Topic[] = selectedSubjectId
    ? topicRepository.getBySubjectId(selectedSubjectId)
    : [];

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedTopicId('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
    const selectedTopic = availableTopics.find((t) => t.id === selectedTopicId);

    const updatedNote: Note = {
      ...note,
      title: title.trim(),
      subjectId: selectedSubjectId || undefined,
      subjectName: selectedSubject?.name || selectedSubject?.shortName || undefined,
      topicId: selectedTopicId || undefined,
      topicName: selectedTopic?.name || undefined,
      provenance,
      updatedAt: new Date().toISOString()
    };

    noteRepository.update(updatedNote);
    onSuccess(updatedNote);
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2 className={styles.title}>Editar Apunte</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar">
            ✕
          </Button>
        </header>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mar-space-4)' }}>
          <Input
            label="Título del apunte *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <div className={styles.formGroup}>
            <label htmlFor="edit-subject-select" className={styles.label}>
              Materia
            </label>
            <select
              id="edit-subject-select"
              className={styles.select}
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
            >
              <option value="">-- Sin materia asignada --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.shortName || sub.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="edit-topic-select" className={styles.label}>
              Tema
            </label>
            <select
              id="edit-topic-select"
              className={styles.select}
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              disabled={!selectedSubjectId || availableTopics.length === 0}
            >
              <option value="">-- Sin tema asignado --</option>
              {availableTopics.map((top) => (
                <option key={top.id} value={top.id}>
                  {top.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.provenanceRow}>
            <span className={styles.label}>Tipo de procedencia</span>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="edit-provenance"
                checked={provenance === 'CLASS_ORIGIN'}
                onChange={() => setProvenance('CLASS_ORIGIN')}
              />
              <span>
                <strong>Apunte de clase</strong> (cuaderno, pizarrón, material del maestro)
              </span>
            </label>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="edit-provenance"
                checked={provenance === 'USER_PROVIDED'}
                onChange={() => setProvenance('USER_PROVIDED')}
              />
              <span>
                <strong>Contenido propio</strong> (resumen personal, notas adicionales)
              </span>
            </label>
          </div>

          <footer className={styles.actions}>
            <Button variant="secondary" size="md" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit">
              Guardar cambios
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
};
