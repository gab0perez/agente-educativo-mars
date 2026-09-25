import React from 'react';
import styles from './ComprehensionCheckView.module.css';

export interface ComprehensionCheckViewProps {
  check: {
    questionText: string;
    suggestedOptions?: string[];
  };
  onSelectOption: (option: string) => void;
  disabled?: boolean;
}

export const ComprehensionCheckView: React.FC<ComprehensionCheckViewProps> = ({
  check,
  onSelectOption,
  disabled = false
}) => {
  const options = check.suggestedOptions || [
    '👍 Sí, me quedó claro',
    '🤔 Explícamelo de otra forma',
    '💡 Dame un ejemplo'
  ];

  return (
    <div className={styles.container} role="region" aria-label="Comprobación de comprensión">
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">✨</span>
        <p className={styles.questionText}>{check.questionText}</p>
      </div>

      <div className={styles.optionsGrid} role="group" aria-label="Opciones de respuesta">
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            className={styles.optionButton}
            onClick={() => onSelectOption(option)}
            disabled={disabled}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};
