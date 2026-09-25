import React from 'react';
import styles from './TutorWelcome.module.css';
import { PedagogicalMode } from '../../../ai/domain/types';
import { TutorAcademicContext } from '../../types/tutorClientTypes';

export interface TutorWelcomeProps {
  academicContext?: TutorAcademicContext;
  onSelectPrompt: (promptText: string, mode: PedagogicalMode) => void;
  onOpenReflection?: () => void;
}

interface QuickPrompt {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  mode: PedagogicalMode;
  promptText: string;
  isReflection?: boolean;
}

export const TutorWelcome: React.FC<TutorWelcomeProps> = ({
  academicContext,
  onSelectPrompt,
  onOpenReflection
}) => {
  const topicName = academicContext?.topic?.name;
  const subjectName = academicContext?.subject?.name || academicContext?.subject?.shortName;

  const quickPrompts: QuickPrompt[] = [
    {
      id: 'reflection',
      icon: '🌸',
      title: '¿Qué aprendiste hoy?',
      subtitle: 'Guarda tu reflexión y recibe feedback',
      mode: 'REVIEW',
      promptText: topicName
        ? `Quiero reflexionar sobre lo que aprendí de ${topicName}.`
        : 'Quiero registrar lo que aprendí hoy.',
      isReflection: true
    },
    {
      id: 'explain',
      icon: '💡',
      title: 'Explicar concepto',
      subtitle: topicName ? `Qué es ${topicName}` : 'Explicación clara y paso a paso',
      mode: 'EXPLAIN',
      promptText: topicName
        ? `¿Me puedes explicar qué es ${topicName}?`
        : '¿Me puedes explicar este concepto de forma clara?'
    },
    {
      id: 'question',
      icon: '🔍',
      title: 'Comprobar comprensión',
      subtitle: 'Hazme una pregunta guiada',
      mode: 'QUESTION',
      promptText: topicName
        ? `Hazme una pregunta para comprobar si comprendí ${topicName}.`
        : 'Hazme una pregunta para ver si estoy entendiendo bien.'
    },
    {
      id: 'exercise',
      icon: '✍️',
      title: 'Poner a prueba',
      subtitle: 'Un ejercicio o caso de aplicación',
      mode: 'EXERCISE',
      promptText: topicName
        ? `Ponme un ejercicio o reto práctico sobre ${topicName}.`
        : 'Ponme un ejercicio o reto para practicar.'
    },
    {
      id: 'review',
      icon: '📖',
      title: 'Repaso general',
      subtitle: 'Resumen de puntos clave',
      mode: 'REVIEW',
      promptText: topicName
        ? `Hagamos un repaso con los puntos más importantes de ${topicName}.`
        : 'Hagamos un resumen de lo que estamos estudiando hoy.'
    }
  ];

  return (
    <section className={styles.container} aria-label="Bienvenida a Mar IA">
      <div className={styles.lilyBadge} aria-hidden="true">
        🌸
      </div>

      <h2 className={styles.greetingTitle}>¡Hola, Mar! 🌷</h2>

      <p className={styles.greetingBody}>
        Soy tu compañera de estudio. Podemos explorar un concepto con calma, resolver dudas de tus apuntes, practicar con pistas socráticas o repasar para tus clases.
      </p>

      {subjectName && (
        <div className={styles.contextBanner}>
          <span className={styles.contextIcon} aria-hidden="true">📌</span>
          <span className={styles.contextInfo}>
            Estudiando <strong>{subjectName}</strong>
            {topicName && <> · Tema: <strong>{topicName}</strong></>}
          </span>
        </div>
      )}

      <div className={styles.promptsSection}>
        <span className={styles.promptsHeader}>¿Por dónde te gustaría empezar?</span>
        <div className={styles.promptsGrid} role="group" aria-label="Sugerencias iniciales">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt.id}
              type="button"
              className={styles.promptCard}
              onClick={() => {
                if (prompt.isReflection && onOpenReflection) {
                  onOpenReflection();
                } else {
                  onSelectPrompt(prompt.promptText, prompt.mode);
                }
              }}
            >
              <span className={styles.promptIcon} aria-hidden="true">
                {prompt.icon}
              </span>
              <div className={styles.promptTexts}>
                <span className={styles.promptTitle}>{prompt.title}</span>
                <span className={styles.promptSubtitle}>{prompt.subtitle}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
