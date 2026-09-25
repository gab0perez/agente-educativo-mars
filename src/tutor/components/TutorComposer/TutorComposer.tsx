import React, { useState, useRef } from 'react';
import styles from './TutorComposer.module.css';

export interface TutorComposerProps {
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const TutorComposer: React.FC<TutorComposerProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = 'Pregunta a Mar o pide una pista... 🌸'
}) => {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) {
      return;
    }
    onSendMessage(trimmed);
    setInputText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Auto-crecimiento suave del textarea hasta 120px
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  const canSubmit = inputText.trim().length > 0 && !isLoading;

  return (
    <div className={styles.composerWrapper}>
      <form
        className={styles.composerForm}
        onSubmit={handleSubmit}
        aria-label="Formulario para enviar mensaje a Mar IA"
      >
        <div className={styles.inputContainer}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className={styles.textarea}
            aria-label="Escribe tu mensaje o pregunta para Mar IA"
          />

          <button
            type="submit"
            disabled={!canSubmit}
            className={`${styles.sendButton} ${canSubmit ? styles.canSubmit : ''}`}
            aria-label="Enviar mensaje a Mar IA"
            title="Enviar mensaje"
          >
            {isLoading ? (
              <span className={styles.spinner} aria-hidden="true" />
            ) : (
              <span className={styles.sendIcon} aria-hidden="true">
                ➤
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
