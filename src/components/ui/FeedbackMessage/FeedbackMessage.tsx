import React from 'react';
import styles from './FeedbackMessage.module.css';

export type FeedbackType = 'success' | 'warning' | 'error' | 'info';
export type FeedbackVariant = 'inline' | 'banner' | 'toast';

export interface FeedbackMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: FeedbackType;
  variant?: FeedbackVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  action?: React.ReactNode;
}

const DEFAULT_ICONS: Record<FeedbackType, string> = {
  success: '✓',
  warning: '⚠️',
  error: '✕',
  info: 'ℹ️'
};

export const FeedbackMessage: React.FC<FeedbackMessageProps> = ({
  type = 'info',
  variant = 'banner',
  title,
  children,
  icon,
  onClose,
  action,
  className = '',
  ...props
}) => {
  const role = type === 'error' ? 'alert' : 'status';
  const displayIcon = icon ?? DEFAULT_ICONS[type];

  const classNames = [
    styles.feedback,
    styles[`type-${type}`],
    styles[`variant-${variant}`],
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} role={role} aria-live={type === 'error' ? 'assertive' : 'polite'} {...props}>
      {displayIcon && (
        <span className={styles.iconWrapper} aria-hidden="true">
          {displayIcon}
        </span>
      )}
      <div className={styles.contentWrapper}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.description}>{children}</div>
        {action && <div className={styles.actions}>{action}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Cerrar notificación"
        >
          ✕
        </button>
      )}
    </div>
  );
};
