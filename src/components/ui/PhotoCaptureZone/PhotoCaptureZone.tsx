import React, { useRef, useState } from 'react';
import styles from './PhotoCaptureZone.module.css';
import { Button } from '../Button/Button';
import { LoadingSkeleton } from '../LoadingSkeleton/LoadingSkeleton';
import { FeedbackMessage } from '../FeedbackMessage/FeedbackMessage';

export type CaptureStatus = 'idle' | 'selected' | 'processing' | 'error';

export interface SelectedImageData {
  url: string;
  name?: string;
  sizeFormatted?: string;
}

export interface PhotoCaptureZoneProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: CaptureStatus;
  selectedImage?: SelectedImageData | null;
  errorMessage?: string;
  onSelectFile?: (file: File) => void;
  onClear?: () => void;
  onConfirm?: () => void;
  onRetry?: () => void;
  title?: string;
  subtitle?: string;
}

export const PhotoCaptureZone: React.FC<PhotoCaptureZoneProps> = ({
  status = 'idle',
  selectedImage,
  errorMessage = 'No se pudo leer la imagen. Intenta con una foto más clara.',
  onSelectFile,
  onClear,
  onConfirm,
  onRetry,
  title = 'Fotografía tus apuntes',
  subtitle = 'Toma una foto de tu cuaderno o selecciona una imagen de tu dispositivo',
  className = '',
  ...props
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleTriggerInput = () => {
    if (status === 'idle') {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSelectFile) {
      onSelectFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (status === 'idle') {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (status === 'idle') {
      const file = e.dataTransfer.files?.[0];
      if (file && onSelectFile) {
        onSelectFile(file);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTriggerInput();
    }
  };

  return (
    <div className={`${styles.container} ${className}`} {...props}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className={styles.hiddenInput}
        onChange={handleFileChange}
        aria-label="Seleccionar o capturar fotografía de apuntes"
      />

      <div
        className={`${styles.dropzone} ${isDragActive ? styles.isDragActive : ''}`}
        onClick={status === 'idle' ? handleTriggerInput : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={status === 'idle' ? handleKeyDown : undefined}
        tabIndex={status === 'idle' ? 0 : undefined}
        role={status === 'idle' ? 'button' : 'region'}
        aria-label={status === 'idle' ? `${title}. ${subtitle}` : undefined}
      >
        {/* ESTADO IDLE */}
        {status === 'idle' && (
          <>
            <div className={styles.iconCircle} aria-hidden="true">
              📸
            </div>
            <div className={styles.title}>{title}</div>
            <div className={styles.subtitle}>{subtitle}</div>
            <div className={styles.actionButtonWrapper}>
              <Button variant="primary" size="sm" type="button">
                Tomar o elegir foto
              </Button>
            </div>
          </>
        )}

        {/* ESTADO SELECTED */}
        {status === 'selected' && selectedImage && (
          <div className={styles.previewContainer}>
            <div className={styles.imageWrapper}>
              <img
                src={selectedImage.url}
                alt={selectedImage.name || 'Vista previa del apunte'}
                className={styles.previewImage}
              />
            </div>
            <div className={styles.fileMeta}>
              <span className={styles.fileName}>{selectedImage.name || 'Apunte seleccionado'}</span>
              {selectedImage.sizeFormatted && (
                <span className={styles.fileSize}>{selectedImage.sizeFormatted}</span>
              )}
            </div>
            <div className={styles.previewActions}>
              {onConfirm && (
                <Button variant="primary" size="sm" onClick={onConfirm} type="button">
                  Estudiar foto 🌸
                </Button>
              )}
              {onClear && (
                <Button variant="secondary" size="sm" onClick={onClear} type="button">
                  Cambiar
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ESTADO PROCESSING */}
        {status === 'processing' && (
          <div className={styles.processingContainer} aria-busy="true" aria-live="polite">
            <LoadingSkeleton variant="thumbnail" style={{ maxWidth: 280, marginBottom: 'var(--mar-space-2)' }} />
            <span className={styles.processingText}>Preparando vista previa del apunte...</span>
          </div>
        )}

        {/* ESTADO ERROR */}
        {status === 'error' && (
          <div className={styles.errorContainer}>
            <FeedbackMessage
              type="error"
              title="Imagen no disponible"
              action={
                onRetry ? (
                  <Button variant="secondary" size="sm" onClick={onRetry} type="button">
                    Intentar de nuevo
                  </Button>
                ) : undefined
              }
            >
              {errorMessage}
            </FeedbackMessage>
          </div>
        )}
      </div>
    </div>
  );
};
