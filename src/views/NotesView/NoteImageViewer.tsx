import React, { useEffect, useState } from 'react';
import { Note } from '../../types/notes';
import { ProvenanceBadge } from '../../components/ui/ProvenanceBadge/ProvenanceBadge';
import { Button } from '../../components/ui/Button/Button';
import { imageStorageAdapter } from '../../storage';
import styles from './NoteImageViewer.module.css';

export interface NoteImageViewerProps {
  note: Note;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAskTutor?: (note: Note) => void;
}

export const NoteImageViewer: React.FC<NoteImageViewerProps> = ({
  note,
  onClose,
  onEdit,
  onDelete,
  onAskTutor
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const primaryImage = note.images && note.images.length > 0 ? note.images[0] : null;

  useEffect(() => {
    let active = true;
    let objectUrlToRevoke: string | null = null;

    const loadImage = async () => {
      if (!primaryImage) {
        setIsLoading(false);
        return;
      }

      // Si ya tiene localUri (data URL o preview directa)
      if (primaryImage.localUri && primaryImage.localUri.startsWith('data:')) {
        if (active) {
          setImageUrl(primaryImage.localUri);
          setIsLoading(false);
        }
        return;
      }

      // Carga desde IndexedDB
      if (primaryImage.storageKey) {
        try {
          const url = await imageStorageAdapter.getImageUrl(primaryImage.storageKey);
          if (active && url) {
            if (url.startsWith('blob:')) {
              objectUrlToRevoke = url;
            }
            setImageUrl(url);
          } else if (active && primaryImage.localUri) {
            setImageUrl(primaryImage.localUri);
          }
        } catch {
          if (active && primaryImage.localUri) {
            setImageUrl(primaryImage.localUri);
          }
        } finally {
          if (active) setIsLoading(false);
        }
      } else if (primaryImage.localUri) {
        if (active) {
          setImageUrl(primaryImage.localUri);
          setIsLoading(false);
        }
      } else {
        if (active) setIsLoading(false);
      }
    };

    loadImage();

    return () => {
      active = false;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [primaryImage]);

  // Cierre accesible mediante teclado (Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Visor de apunte: ${note.title}`}
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Encabezado del visor */}
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <h2 className={styles.title}>{note.title}</h2>
            <div className={styles.metaRow}>
              {note.subjectName && <span>📚 {note.subjectName}</span>}
              {note.topicName && <span>• 📖 {note.topicName}</span>}
              <span>• 📅 {new Date(note.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className={styles.badgeWrapper}>
            <ProvenanceBadge origin={note.provenance} size="sm" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Cerrar visor"
            >
              ✕ Cerrar
            </Button>
          </div>
        </header>

        {/* Visor de imagen sin recorte (object-fit: contain) */}
        <div className={styles.imageViewport}>
          {isLoading ? (
            <div style={{ color: 'var(--mar-text-secondary)', padding: 'var(--mar-space-6)' }}>
              Cargando apunte en alta resolución...
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={`Fotografía completa del apunte: ${note.title}`}
              className={styles.fullImage}
            />
          ) : (
            <div style={{ color: 'var(--mar-text-muted)', padding: 'var(--mar-space-6)' }}>
              No hay imagen disponible para este apunte.
            </div>
          )}
        </div>

        {/* Pie de acciones del visor */}
        <footer className={styles.footer}>
          <span>💡 Tus fotografías se conservan de forma privada en tu dispositivo</span>
          <div style={{ display: 'flex', gap: 'var(--mar-space-2)' }}>
            {onAskTutor && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onAskTutor(note);
                }}
              >
                🌸 Estudiar con MAR
              </Button>
            )}
            {onEdit && (
              <Button variant="secondary" size="sm" onClick={onEdit}>
                Editar datos
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={onDelete} style={{ color: 'var(--mar-rose-600)' }}>
                Eliminar
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};
