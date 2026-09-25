import React from 'react';
import styles from './SuggestedActionsView.module.css';
import { SuggestedAction } from '../../../ai/domain/types';

export interface SuggestedActionsViewProps {
  actions: SuggestedAction[];
  onSelectAction: (action: SuggestedAction) => void;
  disabled?: boolean;
}

export const SuggestedActionsView: React.FC<SuggestedActionsViewProps> = ({
  actions,
  onSelectAction,
  disabled = false
}) => {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className={styles.container} role="group" aria-label="Sugerencias de seguimiento">
      <span className={styles.label}>Sugerencias para continuar:</span>
      <div className={styles.chipsRow}>
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={styles.chipButton}
            onClick={() => onSelectAction(action)}
            disabled={disabled}
            aria-label={`Acción sugerida: ${action.label}`}
          >
            <span className={styles.chipIcon} aria-hidden="true">
              {action.mode === 'EXAMPLE' ? '💡' : action.mode === 'QUESTION' ? '🔍' : action.mode === 'SIMPLIFY' ? '🌱' : '✨'}
            </span>
            <span className={styles.chipText}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
