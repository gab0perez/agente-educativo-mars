import React, { useEffect, useRef } from 'react';
import styles from './TutorMessageList.module.css';
import { TutorClientMessage, TutorSessionStatus } from '../../types/tutorClientTypes';
import { TutorMessageBubble } from '../TutorMessageBubble/TutorMessageBubble';
import { SuggestedAction } from '../../../ai/domain/types';

export interface TutorMessageListProps {
  messages: TutorClientMessage[];
  status: TutorSessionStatus;
  onSelectSuggestedAction?: (action: SuggestedAction) => void;
  onSelectComprehensionOption?: (option: string) => void;
  onRetry?: () => void;
}

export const TutorMessageList: React.FC<TutorMessageListProps> = ({
  messages,
  status,
  onSelectSuggestedAction,
  onSelectComprehensionOption,
  onRetry
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  return (
    <div
      className={styles.messageListContainer}
      role="log"
      aria-live="polite"
      aria-label="Historial de mensajes con Mar IA"
    >
      <div className={styles.innerList}>
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          return (
            <TutorMessageBubble
              key={message.id || index}
              message={message}
              isLast={isLast}
              disabled={status === 'sending'}
              onSelectSuggestedAction={onSelectSuggestedAction}
              onSelectComprehensionOption={onSelectComprehensionOption}
              onRetry={onRetry}
            />
          );
        })}

        {status === 'sending' && (
          <div className={styles.typingIndicator} aria-label="Mar IA está pensando...">
            <div className={styles.typingAvatar} aria-hidden="true">🌸</div>
            <div className={styles.typingBubble}>
              <span className={styles.typingText}>MAR está pensando</span>
              <div className={styles.dots} aria-hidden="true">
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} style={{ height: 1 }} aria-hidden="true" />
      </div>
    </div>
  );
};
