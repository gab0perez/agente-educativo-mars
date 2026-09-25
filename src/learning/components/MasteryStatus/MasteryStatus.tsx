import React from 'react';
import { MasteryLevel } from '../../domain/types';
import styles from './MasteryStatus.module.css';

export interface MasteryStatusMetadata {
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

export const MASTERY_METADATA: Record<MasteryLevel, MasteryStatusMetadata> = {
  UNKNOWN: {
    label: 'Por explorar',
    shortLabel: 'Por explorar',
    icon: '🌱',
    description: 'Aún estamos conociendo este tema.'
  },
  DEVELOPING: {
    label: 'En desarrollo',
    shortLabel: 'En desarrollo',
    icon: '🌿',
    description: 'Lo estás construyendo paso a paso.'
  },
  NEEDS_REVIEW: {
    label: 'Conviene repasar',
    shortLabel: 'Conviene repasar',
    icon: '💡',
    description: 'Hay puntos que convendría volver a revisar con calma.'
  },
  UNDERSTOOD: {
    label: 'Entendido',
    shortLabel: 'Entendido',
    icon: '🌸',
    description: 'Muestras una comprensión clara de las ideas principales.'
  },
  STRONG: {
    label: 'Consolidado',
    shortLabel: 'Consolidado',
    icon: '✨',
    description: 'Este tema se muestra bastante sólido en tus prácticas.'
  }
};

export interface MasteryStatusProps {
  level?: MasteryLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showDescription?: boolean;
  className?: string;
}

export const MasteryStatus: React.FC<MasteryStatusProps> = ({
  level = 'UNKNOWN',
  size = 'md',
  showLabel = true,
  showDescription = false,
  className = ''
}) => {
  const meta = MASTERY_METADATA[level] || MASTERY_METADATA.UNKNOWN;

  return (
    <div
      className={`${styles.container} ${styles[`size-${size}`]} ${styles[`level-${level}`]} ${className}`}
      role="status"
      aria-label={`Estado de aprendizaje: ${meta.label}. ${meta.description}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {meta.icon}
      </span>

      {showDescription ? (
        <div className={styles.descriptionWrapper}>
          {showLabel && <span className={styles.label}>{meta.label}</span>}
          <span className={styles.descriptionText}>{meta.description}</span>
        </div>
      ) : (
        showLabel && <span className={styles.label}>{meta.label}</span>
      )}
    </div>
  );
};
