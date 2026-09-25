import React, { useState, useEffect } from 'react';
import styles from './HomeView.module.css';
import {
  Button,
  PhotoCaptureZone,
  NotePreviewCard,
  EmptyState,
  CaptureStatus
} from '../../components/ui';
import { NavTabId } from '../../components/layout/BottomNav/BottomNav';
import { Note } from '../../types/notes';
import { noteRepository } from '../../repositories/noteRepository';
import { NoteCreateModal } from '../NotesView/NoteCreateModal';
import { NoteImageViewer } from '../NotesView/NoteImageViewer';
import { DashboardView } from '../../dashboard/views/DashboardView';

export interface HomeViewProps {
  onNavigate: (tabId: NavTabId) => void;
  onOpenLesson?: (lessonId: string) => void;
  onOpenPractice?: (topicId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenLesson, onOpenPractice }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('idle');
  const [captureError, setCaptureError] = useState<string | null>(null);

  // Modales
  const [pendingCreateFile, setPendingCreateFile] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [viewerNote, setViewerNote] = useState<Note | null>(null);

  const loadNotes = () => {
    const all = noteRepository.getAll();
    setNotes(all);
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleSelectFile = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type) && file.type !== '') {
      setCaptureError('Formato no permitido. Solo imágenes JPG, PNG o WebP.');
      setCaptureStatus('error');
      return;
    }

    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setCaptureError('La fotografía supera el límite de 10 MB.');
      setCaptureStatus('error');
      return;
    }

    setCaptureError(null);
    const previewUrl = URL.createObjectURL(file);
    setPendingCreateFile({ file, previewUrl });
    setCaptureStatus('idle');
  };

  const handleCreateSuccess = (_newNote: Note) => {
    setPendingCreateFile(null);
    loadNotes();
  };

  return (
    <div className={styles.container}>
      {/* Saludo & Bienvenida */}
      <section className={styles.heroSection}>
        <h1 className={styles.greeting}>Hola, Mar 🌸</h1>
        <p className={styles.subGreeting}>Tu espacio de estudio y progreso educativo (CETis 164)</p>
      </section>

      {/* Accesos Rápidos de Estudio */}
      <section>
        <div className={styles.quickActionsGrid}>
          <button
            type="button"
            className={styles.quickActionCard}
            onClick={() => onNavigate('notes')}
          >
            <span className={styles.actionIcon} aria-hidden="true">📸</span>
            <span className={styles.actionTitle}>Fotografiar</span>
            <span className={styles.actionSubtitle}>Tus apuntes de hoy</span>
          </button>

          <button
            type="button"
            className={styles.quickActionCard}
            onClick={() => onNavigate('subjects')}
          >
            <span className={styles.actionIcon} aria-hidden="true">📚</span>
            <span className={styles.actionTitle}>Materias</span>
            <span className={styles.actionSubtitle}>CETis 164 — 3er Sem</span>
          </button>

          <button
            type="button"
            className={styles.quickActionCard}
            onClick={() => onNavigate('tasks')}
          >
            <span className={styles.actionIcon} aria-hidden="true">📝</span>
            <span className={styles.actionTitle}>Tareas</span>
            <span className={styles.actionSubtitle}>Pendientes de clase</span>
          </button>

          <button
            type="button"
            className={styles.quickActionCard}
            onClick={() => onNavigate('tutor')}
          >
            <span className={styles.actionIcon} aria-hidden="true">🤖</span>
            <span className={styles.actionTitle}>Mar IA</span>
            <span className={styles.actionSubtitle}>Tutor personal</span>
          </button>
        </div>
      </section>

      {/* Panel de Aprendizaje Unificado — delegado a DashboardView */}
      <section aria-label="Panel de aprendizaje unificado">
        <DashboardView
          onOpenLesson={onOpenLesson}
          onOpenPractice={onOpenPractice}
          onNavigateToTasks={() => onNavigate('tasks')}
          onNavigateToSubjects={(subjId) => {
            void subjId;
            onNavigate('subjects');
          }}
        />
      </section>

      {/* Captura Rápida de Apuntes */}
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Capturar Nuevo Apunte</h2>
        </div>
        <PhotoCaptureZone
          status={captureStatus}
          errorMessage={captureError || undefined}
          onSelectFile={handleSelectFile}
          onRetry={() => {
            setCaptureStatus('idle');
            setCaptureError(null);
          }}
          title="Fotografía o sube tu apunte"
          subtitle="Toma una foto de tu cuaderno o selecciona una imagen de tu dispositivo"
        />
      </section>

      {/* Apuntes Recientes */}
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Tus Apuntes Recientes</h2>
          {notes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('notes')}
            >
              Ver todos ({notes.length})
            </Button>
          )}
        </div>

        {notes.length === 0 ? (
          <EmptyState
            icon="📸"
            title="Aún no tienes apuntes guardados"
            description="Toma una foto de tu cuaderno para que MAR te ayude a estudiarla y tenerla siempre disponible."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
              >
                Fotografiar primer apunte
              </Button>
            }
          />
        ) : (
          <div className={styles.notesGrid}>
            {notes.slice(0, 4).map((note) => {
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
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Modal: Creación de Apunte desde Home */}
      {pendingCreateFile && (
        <NoteCreateModal
          imageFile={pendingCreateFile.file}
          previewUrl={pendingCreateFile.previewUrl}
          onClose={() => setPendingCreateFile(null)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Modal: Visor de Imagen Completa desde Home */}
      {viewerNote && (
        <NoteImageViewer
          note={viewerNote}
          onClose={() => setViewerNote(null)}
        />
      )}
    </div>
  );
};
