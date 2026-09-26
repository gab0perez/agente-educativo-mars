import React from 'react';
import styles from './TutorMessageBubble.module.css';
import { TutorClientMessage } from '../../types/tutorClientTypes';
import { ProvenanceBadge } from '../../../components/ui/ProvenanceBadge/ProvenanceBadge';
import { SocraticStepView } from '../SocraticStep/SocraticStepView';
import { ComprehensionCheckView } from '../ComprehensionCheck/ComprehensionCheckView';
import { ExerciseCardView } from '../ExerciseCard/ExerciseCardView';
import { SuggestedActionsView } from '../SuggestedActions/SuggestedActionsView';
import { SuggestedAction } from '../../../ai/domain/types';
import { MarkdownRenderer } from '../../../components/ui/MarkdownRenderer/MarkdownRenderer';

export interface TutorMessageBubbleProps {
  message: TutorClientMessage;
  onSelectSuggestedAction?: (action: SuggestedAction) => void;
  onSelectComprehensionOption?: (option: string) => void;
  onRetry?: () => void;
  isLast?: boolean;
  disabled?: boolean;
}

const MODE_LABELS: Record<string, string> = {
  EXPLAIN: 'Explicación',
  SIMPLIFY: 'Simplificado',
  EXAMPLE: 'Ejemplo práctico',
  QUESTION: 'Pregunta guiada',
  EXERCISE: 'Ejercicio',
  SOCRATIC: 'Guía socrática',
  REVIEW: 'Repaso de clase'
};

export const TutorMessageBubble: React.FC<TutorMessageBubbleProps> = ({
  message,
  onSelectSuggestedAction,
  onSelectComprehensionOption,
  onRetry,
  isLast = false,
  disabled = false
}) => {
  const isStudent = message.sender === 'student';

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (isStudent) {
    return (
      <div className={`${styles.bubbleWrapper} ${styles.studentWrapper}`}>
        <div className={styles.studentBubble}>
          <p className={styles.messageText}>{message.text}</p>
          <span className={styles.timestamp}>{formatTime(message.timestamp)}</span>
        </div>
      </div>
    );
  }

  // Burbuja de MAR IA
  const provenance = message.provenance || 'AI_COMPLEMENTARY';
  const modeLabel = message.mode ? MODE_LABELS[message.mode] : undefined;

  return (
    <div
      className={`${styles.bubbleWrapper} ${styles.tutorWrapper} ${message.isError ? styles.errorBubble : ''}`}
      role="article"
      aria-label={`Respuesta de Mar IA: ${message.text}`}
    >
      <div className={styles.tutorBubble}>
        <div className={styles.tutorHeader}>
          <div className={styles.senderInfo}>
            <div className={styles.tutorAvatar} aria-hidden="true">🌸</div>
            <span className={styles.senderName}>Mar IA</span>
            {modeLabel && <span className={styles.modeTag}>{modeLabel}</span>}
            {message.isFallback && !message.isError && (
              <span className={styles.fallbackTag} title="Respuesta generada con tus notas y lecciones guardadas">
                Modo local
              </span>
            )}
          </div>

          <div className={styles.badgeContainer}>
            <ProvenanceBadge origin={provenance} size="sm" />
          </div>
        </div>

        <div className={styles.messageContent}>
          <MarkdownRenderer content={message.text} />
        </div>

        {/* Paso Socrático */}
        {message.socraticStep && (
          <SocraticStepView step={message.socraticStep} />
        )}

        {/* Comprobación de Comprensión */}
        {message.comprehensionCheck && onSelectComprehensionOption && (
          <ComprehensionCheckView
            check={message.comprehensionCheck}
            onSelectOption={onSelectComprehensionOption}
            disabled={disabled || !isLast}
          />
        )}

        {/* Tarjeta de Ejercicio */}
        {message.exercise && (
          <ExerciseCardView exercise={message.exercise} />
        )}

        {/* Acciones Sugeridas */}
        {message.suggestedActions && message.suggestedActions.length > 0 && onSelectSuggestedAction && (
          <SuggestedActionsView
            actions={message.suggestedActions}
            onSelectAction={onSelectSuggestedAction}
            disabled={disabled || !isLast}
          />
        )}

        {/* Botón de reintento en caso de error */}
        {message.isError && onRetry && (
          <div className={styles.errorActions}>
            <button
              type="button"
              className={styles.retryButton}
              onClick={onRetry}
              disabled={disabled}
            >
              🔄 Intentar de nuevo
            </button>
          </div>
        )}

        <div className={styles.tutorFooter}>
          <span className={styles.timestamp}>{formatTime(message.timestamp)}</span>
        </div>
      </div>
    </div>
  );
};
