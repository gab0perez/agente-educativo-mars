import React, { useState, useEffect } from 'react';
import { Note } from '../../types/notes';
import { Subject } from '../../types/academic';
import {
  Button,
  EmptyState,
  NotePreviewCard,
  PhotoCaptureZone,
  CaptureStatus
} from '../../components/ui';
import { noteRepository } from '../../repositories/noteRepository';
import { subjectRepository } from '../../repositories/subjectRepository';
import { NoteImageViewer } from './NoteImageViewer';
import { NoteCreateModal } from './NoteCreateModal';
import { NoteEditModal } from './NoteEditModal';
import styles from './NotesView.module.css';

export interface NotesViewProps {
  initialOpenCapture?: boolean;
  onAskTutor?: (note: Note) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  initialOpenCapture = false,
  onAskTutor
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(initialOpenCapture);
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('idle');
  const [captureError, setCaptureError] = useState<string | null>(null);

  // Estados de modales
  const [pendingCreateFile, setPendingCreateFile] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [viewerNote, setViewerNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);

  const subjects: Subject[] = subjectRepository.getAll();

  const loadNotes = () => {
    const allNotes = noteRepository.getAll();
    setNotes(allNotes);
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleSelectFile = (file: File) => {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type) && file.type !== '') {
      setCaptureError('Formato de archivo no válido. Solo se admiten fotos JPG, PNG o WebP.');
      setCaptureStatus('error');
      return;
    }

    // Validar tamaño máximo (10 MB)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setCaptureError('La fotografía supera los 10 MB. Por favor elige una imagen más ligera.');
      setCaptureStatus('error');
      return;
    }

    setCaptureError(null);
    const previewUrl = URL.createObjectURL(file);
    setPendingCreateFile({ file, previewUrl });
    setCaptureStatus('idle');
    setIsCapturing(false);
  };

  const handleCreateSuccess = (_newNote: Note) => {
    setPendingCreateFile(null);
    loadNotes();
  };

  const handleEditSuccess = (updatedNote: Note) => {
    setEditingNote(null);
    if (viewerNote && viewerNote.id === updatedNote.id) {
      setViewerNote(updatedNote);
    }
    loadNotes();
  };

  const handleDeleteConfirm = () => {
    if (deletingNote) {
      noteRepository.delete(deletingNote.id);
      if (viewerNote && viewerNote.id === deletingNote.id) {
        setViewerNote(null);
      }
      setDeletingNote(null);
      loadNotes();
    }
  };

  // Filtrado de notas
  const filteredNotes = selectedSubjectFilter
    ? notes.filter((n) => n.subjectId === selectedSubjectFilter)
    : notes;

  return (
    <div className={styles.container}>
      {/* Encabezado de la vista */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Mis Apuntes</h1>
          <p className={styles.subtitle}>
            Fotografías y apuntes guardados en este dispositivo ({notes.length})
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCapturing(!isCapturing)}
          aria-expanded={isCapturing}
        >
          {isCapturing ? 'Ocultar cámara' : '📸 Capturar apunte'}
        </Button>
      </header>

      {/* Zona de captura / subida expandida */}
      {isCapturing && (
        <section className={styles.captureSection} aria-label="Área de captura de apuntes">
          <PhotoCaptureZone
            status={captureStatus}
            errorMessage={captureError || undefined}
            onSelectFile={handleSelectFile}
            onRetry={() => {
              setCaptureStatus('idle');
              setCaptureError(null);
            }}
            title="Fotografía o sube tu apunte"
            subtitle="Guarda las notas de tu cuaderno para consultarlas y repasarlas cuando quieras"
          />
        </section>
      )}

      {/* Filtros por Materia */}
      {notes.length > 0 && subjects.length > 0 && (
        <nav className={styles.filtersRow} aria-label="Filtrar apuntes por materia">
          <button
            type="button"
            className={`${styles.filterPill} ${selectedSubjectFilter === null ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedSubjectFilter(null)}
          >
            Todas ({notes.length})
          </button>
          {subjects.map((sub) => {
            const count = notes.filter((n) => n.subjectId === sub.id).length;
            if (count === 0) return null;

            return (
              <button
                key={sub.id}
                type="button"
                className={`${styles.filterPill} ${selectedSubjectFilter === sub.id ? styles.filterPillActive : ''}`}
                onClick={() => setSelectedSubjectFilter(sub.id)}
              >
                <span>{sub.icon}</span>
                <span>{sub.shortName || sub.name} ({count})</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Lista de Apuntes */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon="📸"
          title={
            selectedSubjectFilter
              ? 'No hay apuntes para esta materia'
              : 'Todavía no tienes apuntes guardados'
          }
          description={
            selectedSubjectFilter
              ? 'Puedes tomar una foto y asociarla a esta materia o ver todas las notas.'
              : 'Guarda una foto de tus apuntes de clase para volver a estudiarlos cuando quieras.'
          }
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCapturing(true)}
            >
              Fotografiar primer apunte
            </Button>
          }
        />
      ) : (
        <section className={styles.notesGrid} aria-label="Colección de apuntes">
          {filteredNotes.map((note) => {
            const primaryImg = note.images?.[0];
            const dateStr = new Date(note.createdAt).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <NotePreviewCard
                key={note.id}
                imageUrl={primaryImg?.localUri || ''}
                storageKey={primaryImg?.storageKey}
                title={note.title}
                subjectName={note.subjectName}
                dateFormatted={dateStr}
                snippet={note.topicName ? `Tema: ${note.topicName}` : undefined}
                provenanceOrigin={note.provenance}
                actionLabel="Ver apunte"
                onAction={() => setViewerNote(note)}
                secondaryActionLabel="Editar"
                onSecondaryAction={() => setEditingNote(note)}
              />
            );
          })}
        </section>
      )}

      {/* Modal: Creación de Apunte */}
      {pendingCreateFile && (
        <NoteCreateModal
          imageFile={pendingCreateFile.file}
          previewUrl={pendingCreateFile.previewUrl}
          onClose={() => setPendingCreateFile(null)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Modal: Visor de Imagen Completa */}
      {viewerNote && (
        <NoteImageViewer
          note={viewerNote}
          onClose={() => setViewerNote(null)}
          onAskTutor={onAskTutor}
          onEdit={() => {
            setEditingNote(viewerNote);
            setViewerNote(null);
          }}
          onDelete={() => setDeletingNote(viewerNote)}
        />
      )}

      {/* Modal: Edición de Metadata de Apunte */}
      {editingNote && (
        <NoteEditModal
          note={editingNote}
          onClose={() => setEditingNote(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Diálogo de Confirmación de Eliminación */}
      {deletingNote && (
        <div
          className={styles.deleteConfirmOverlay}
          onClick={() => setDeletingNote(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.deleteConfirmCard}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.deleteTitle}>¿Eliminar este apunte?</h3>
            <p className={styles.deleteDesc}>
              Se eliminará <strong>"{deletingNote.title}"</strong> y su imagen asociada de este dispositivo. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--mar-space-2)' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeletingNote(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteConfirm}
                style={{ backgroundColor: 'var(--mar-rose-600)' }}
              >
                Sí, eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
