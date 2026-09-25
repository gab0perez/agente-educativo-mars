import React, { useState } from 'react';
import { ProvenanceOrigin } from '../../types/provenance';
import { Subject, Topic } from '../../types/academic';
import { Note } from '../../types/notes';
import { Input, Button, FeedbackMessage } from '../../components/ui';
import { subjectRepository } from '../../repositories/subjectRepository';
import { topicRepository } from '../../repositories/topicRepository';
import { noteRepository } from '../../repositories/noteRepository';
import { imageStorageAdapter } from '../../storage';
import styles from './NoteCreateModal.module.css';

export interface NoteCreateModalProps {
  imageFile: File;
  previewUrl: string;
  onClose: () => void;
  onSuccess: (note: Note) => void;
}

export const NoteCreateModal: React.FC<NoteCreateModalProps> = ({
  imageFile,
  previewUrl,
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState(
    imageFile.name.replace(/\.[^/.]+$/, '').trim() || 'Nuevo Apunte'
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [provenance, setProvenance] = useState<ProvenanceOrigin>('CLASS_ORIGIN');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const subjects: Subject[] = subjectRepository.getAll();
  const availableTopics: Topic[] = selectedSubjectId
    ? topicRepository.getBySubjectId(selectedSubjectId)
    : [];

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedTopicId('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Por favor escribe un título para este apunte.');
      return;
    }

    // Validar tipo MIME
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type) && imageFile.type !== '') {
      setErrorMessage('Formato no permitido. Utiliza imágenes JPG, PNG o WebP.');
      return;
    }

    // Validar tamaño (10 MB)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (imageFile.size > MAX_SIZE_BYTES) {
      setErrorMessage('La imagen supera el límite permitido de 10 MB.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const imageId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const noteId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // 1. Guardar archivo binario en IndexedDB
      await imageStorageAdapter.saveImage(imageId, imageFile);

      const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
      const selectedTopic = availableTopics.find((t) => t.id === selectedTopicId);

      const sizeInKb = (imageFile.size / 1024).toFixed(1);

      // 2. Guardar metadata en NoteRepository / LocalStorage
      const newNote = noteRepository.create({
        id: noteId,
        title: title.trim(),
        content: '',
        subjectId: selectedSubjectId || undefined,
        subjectName: selectedSubject?.name || selectedSubject?.shortName || undefined,
        topicId: selectedTopicId || undefined,
        topicName: selectedTopic?.name || undefined,
        provenance,
        images: [
          {
            id: imageId,
            noteId,
            storageKey: imageId,
            mimeType: imageFile.type || 'image/jpeg',
            size: imageFile.size,
            sizeFormatted: `${sizeInKb} KB`,
            createdAt: new Date().toISOString(),
            status: 'ready',
            localUri: previewUrl
          }
        ]
      });

      onSuccess(newNote);
    } catch (err) {
      console.error('[NoteCreateModal] Error al persistir apunte:', err);
      setErrorMessage('Ocurrió un error al guardar el apunte en el dispositivo.');
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2 className={styles.title}>Guardar Apunte</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar">
            ✕
          </Button>
        </header>

        {errorMessage && (
          <FeedbackMessage type="error" title="Error de archivo">
            {errorMessage}
          </FeedbackMessage>
        )}

        <div className={styles.imagePreviewBox}>
          <img
            src={previewUrl}
            alt="Vista previa del apunte"
            className={styles.previewThumb}
          />
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mar-space-4)' }}>
          <Input
            label="Título del apunte *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Apuntes de Sinergia y Enzimas"
            required
            autoFocus
          />

          <div className={styles.formGroup}>
            <label htmlFor="subject-select" className={styles.label}>
              Materia (Opcional)
            </label>
            <select
              id="subject-select"
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
            <label htmlFor="topic-select" className={styles.label}>
              Tema (Opcional)
            </label>
            <select
              id="topic-select"
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
                name="provenance"
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
                name="provenance"
                checked={provenance === 'USER_PROVIDED'}
                onChange={() => setProvenance('USER_PROVIDED')}
              />
              <span>
                <strong>Contenido propio</strong> (resumen personal, notas adicionales)
              </span>
            </label>
          </div>

          <footer className={styles.actions}>
            <Button variant="secondary" size="md" onClick={onClose} type="button" disabled={isSaving}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando en dispositivo...' : 'Guardar Apunte 🌸'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
};
