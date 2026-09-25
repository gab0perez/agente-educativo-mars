import React from 'react';
import styles from './ProvenanceBadge.module.css';

export type ProvenanceOrigin = 'CLASS_ORIGIN' | 'USER_PROVIDED' | 'AI_INFERENCE' | 'AI_COMPLEMENTARY';

export interface ProvenanceBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  origin: ProvenanceOrigin;
  size?: 'sm' | 'md';
  customLabel?: string;
  showIcon?: boolean;
}

const DEFAULT_METADATA: Record<ProvenanceOrigin, { icon: string; label: string; ariaDescription: string }> = {
  CLASS_ORIGIN: {
    icon: '📌',
    label: 'Apunte de clase',
    ariaDescription: 'Material confirmado como apunte de clase de CETis 164'
  },
  USER_PROVIDED: {
    icon: '✍️',
    label: 'Tu nota',
    ariaDescription: 'Nota o respuesta aportada por Mar'
  },
  AI_INFERENCE: {
    icon: '🔍',
    label: 'Sugerencia MAR (Por confirmar)',
    ariaDescription: 'Interpretación preliminar generada por MAR pendiente de confirmación'
  },
  AI_COMPLEMENTARY: {
    icon: '✨',
    label: 'Explicación complementaria',
    ariaDescription: 'Contenido complementario generado por la IA para apoyo de estudio'
  }
};

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  origin,
  size = 'sm',
  customLabel,
  showIcon = true,
  className = '',
  ...props
}) => {
  const metadata = DEFAULT_METADATA[origin];
  const displayLabel = customLabel || metadata.label;

  const classNames = [
    styles.badge,
    styles[`variant-${origin}`],
    styles[`size-${size}`],
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classNames}
      role="status"
      aria-label={`${metadata.label}: ${metadata.ariaDescription}`}
      {...props}
    >
      {showIcon && <span className={styles.icon} aria-hidden="true">{metadata.icon}</span>}
      <span className={styles.label}>{displayLabel}</span>
    </span>
  );
};
