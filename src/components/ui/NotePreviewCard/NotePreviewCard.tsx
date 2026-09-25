import React, { useState, useEffect } from 'react';
import styles from './NotePreviewCard.module.css';
import { ProvenanceBadge, ProvenanceOrigin } from '../ProvenanceBadge/ProvenanceBadge';
import { Button } from '../Button/Button';
import { imageStorageAdapter } from '../../../storage';

export interface NotePreviewCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl?: string;
  storageKey?: string;
  imageAlt?: string;
  title: string;
  subjectName?: string;
  dateFormatted?: string;
  snippet?: string;
  provenanceOrigin?: ProvenanceOrigin;
  provenanceLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const NotePreviewCard: React.FC<NotePreviewCardProps> = ({
  imageUrl,
  storageKey,
  imageAlt,
  title,
  subjectName,
  dateFormatted,
  snippet,
  provenanceOrigin = 'CLASS_ORIGIN',
  provenanceLabel,
  actionLabel = 'Estudiar apunte',
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
  ...props
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>(imageUrl || '');

  useEffect(() => {
    let active = true;
    let revokeUrl: string | null = null;

    // Si ya tiene una URL válida que no sea un blob temporal expirado
    if (imageUrl && !imageUrl.startsWith('blob:')) {
      setResolvedUrl(imageUrl);
      return;
    }

    if (storageKey) {
      imageStorageAdapter
        .getImageUrl(storageKey)
        .then((url: string | null) => {
          if (active && url) {
            if (url.startsWith('blob:')) {
              revokeUrl = url;
            }
            setResolvedUrl(url);
          } else if (active && imageUrl) {
            setResolvedUrl(imageUrl);
          }
        })
        .catch(() => {
          if (active && imageUrl) setResolvedUrl(imageUrl);
        });
    } else if (imageUrl) {
      setResolvedUrl(imageUrl);
    }

    return () => {
      active = false;
      if (revokeUrl) {
        URL.revokeObjectURL(revokeUrl);
      }
    };
  }, [imageUrl, storageKey]);

  return (
    <article className={`${styles.card} ${className}`} {...props}>
      <div className={styles.thumbnailWrapper}>
        <img
          src={resolvedUrl}
          alt={imageAlt || `Fotografía del apunte: ${title}`}
          className={styles.thumbnail}
          loading="lazy"
        />
        <div className={styles.badgeOverlay}>
          <ProvenanceBadge
            origin={provenanceOrigin}
            customLabel={provenanceLabel}
            size="sm"
          />
        </div>
      </div>

      <div className={styles.content}>
        {(subjectName || dateFormatted) && (
          <div className={styles.metaRow}>
            {subjectName && <span className={styles.subjectName}>{subjectName}</span>}
            {dateFormatted && <span className={styles.dateText}>{dateFormatted}</span>}
          </div>
        )}

        <h3 className={styles.title}>{title}</h3>

        {snippet && <p className={styles.description}>{snippet}</p>}

        <div className={styles.actions}>
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSecondaryAction}
              type="button"
            >
              {secondaryActionLabel}
            </Button>
          )}
          {onAction && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAction}
              type="button"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};
