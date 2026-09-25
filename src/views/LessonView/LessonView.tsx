import React, { useState, useEffect } from 'react';
import { Lesson, LessonBlock } from '../../types/lesson';
import { Button, Textarea, LilyBloom } from '../../components/ui';
import { reflectionRepository } from '../../repositories/reflectionRepository';
import { LearningReflection } from '../../tutor/components/LearningReflection';
import styles from './LessonView.module.css';

export interface LessonViewProps {
  lesson: Lesson;
  onBack: () => void;
  onGoHome?: () => void;
  onConsultTutor?: (lesson: Lesson, reflectionText?: string) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({
  lesson,
  onBack,
  onGoHome,
  onConsultTutor
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isReflectionOpen, setIsReflectionOpen] = useState<boolean>(false);
  const [reflectionResponses, setReflectionResponses] = useState<Record<string, string>>(() => {
    // Carga inicial de reflexiones existentes desde el repositorio local
    const saved = reflectionRepository.getByLessonId(lesson.id);
    const initialMap: Record<string, string> = {};
    saved.forEach((r) => {
      if (r.blockId) {
        initialMap[r.blockId] = r.answer;
      }
    });
    return initialMap;
  });
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Sincronizar reflexiones si cambia la lección
  useEffect(() => {
    const saved = reflectionRepository.getByLessonId(lesson.id);
    const map: Record<string, string> = {};
    saved.forEach((r) => {
      if (r.blockId) {
        map[r.blockId] = r.answer;
      }
    });
    setReflectionResponses(map);
  }, [lesson.id]);

  const totalSteps = lesson.sections.length;
  const currentSection = lesson.sections[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsCompleted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReflectionChange = (blockId: string, promptText: string, value: string) => {
    // 1. Actualizar estado reactivo local
    setReflectionResponses((prev) => ({
      ...prev,
      [blockId]: value
    }));

    // 2. Persistir inmediatamente en ReflectionRepository / LocalStorage
    reflectionRepository.saveReflection({
      lessonId: lesson.id,
      blockId,
      prompt: promptText,
      answer: value
    });
  };

  // Renderizado de bloques de contenido
  const renderBlock = (block: LessonBlock) => {
    switch (block.type) {
      case 'heading':
        return (
          <h3 key={block.id} className={styles.blockHeading}>
            {block.content}
          </h3>
        );

      case 'paragraph':
        return (
          <p key={block.id} className={styles.blockParagraph}>
            {block.content}
          </p>
        );

      case 'keyPoint':
        return (
          <div key={block.id} className={styles.keyPointBlock}>
            <div className={styles.keyPointTitle}>
              <span aria-hidden="true">💡</span>
              {block.title || 'Idea Clave'}
            </div>
            <p className={styles.keyPointText}>{block.content}</p>
          </div>
        );

      case 'example':
        return (
          <div key={block.id} className={styles.exampleBlock}>
            <div className={styles.exampleTitle}>
              <span aria-hidden="true">🌿</span>
              {block.title || 'Ejemplo'}
            </div>
            <p className={styles.exampleText}>{block.content}</p>
          </div>
        );

      case 'reflection': {
        const prompt = block.reflectionPrompt;
        const promptQuestion = prompt?.question || block.content;
        const responseValue = reflectionResponses[block.id] || '';

        return (
          <div key={block.id} className={styles.reflectionBlock}>
            <div className={styles.reflectionQuestion}>
              <span aria-hidden="true">💭</span>
              <span>{promptQuestion}</span>
            </div>
            <Textarea
              label="Tu reflexión personal"
              placeholder={prompt?.placeholder || 'Escribe tu respuesta aquí...'}
              helperText={prompt?.helperText}
              value={responseValue}
              onChange={(e) => handleReflectionChange(block.id, promptQuestion, e.target.value)}
              rows={4}
            />
          </div>
        );
      }

      default:
        return (
          <p key={block.id} className={styles.blockParagraph}>
            {block.content}
          </p>
        );
    }
  };

  // Pantalla de reflexión modal/dedicada
  if (isReflectionOpen) {
    return (
      <div className={styles.container}>
        <LearningReflection
          lesson={lesson}
          onClose={() => setIsReflectionOpen(false)}
          onSuccess={(saved) => {
            // Sincronizar estado local de la lección
            if (saved.blockId) {
              setReflectionResponses((prev) => ({
                ...prev,
                [saved.blockId!]: saved.answer
              }));
            }
          }}
          onContinueStudying={() => setIsReflectionOpen(false)}
          onOpenTutor={(reflectionText) => {
            setIsReflectionOpen(false);
            onConsultTutor?.(lesson, reflectionText);
          }}
        />
      </div>
    );
  }

  // Pantalla de cierre al completar la lección
  if (isCompleted) {
    const reflections = Object.values(reflectionResponses).filter(Boolean);
    const lastReflection = reflections.length > 0 ? reflections[reflections.length - 1] : null;

    return (
      <div className={styles.container}>
        <div className={styles.completedCard}>
          <LilyBloom
            title="¡Terminaste esta lección!"
            subtitle={`Hoy exploraste el tema: ${lesson.topicName}`}
          />

          <p className={styles.completedDesc}>
            Completaste todos los pasos de <strong>{lesson.title}</strong>. Puedes volver al tema para seguir explorando o registrar qué aprendiste hoy.
          </p>

          {lastReflection && (
            <div className={styles.savedReflectionSnippet}>
              <div className={styles.snippetLabel}>💭 Tu nota de reflexión de la sesión:</div>
              <div className={styles.snippetText}>"{lastReflection}"</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--mar-space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="primary"
              onClick={() => setIsReflectionOpen(true)}
              aria-label="Escribir qué aprendiste hoy"
            >
              🌸 ¿Qué aprendiste hoy?
            </Button>
            <Button variant="secondary" onClick={onBack}>
              Volver al tema
            </Button>
            {onConsultTutor && (
              <Button
                variant="ghost"
                onClick={() => onConsultTutor(lesson, lastReflection || undefined)}
              >
                💬 Repasar con Mar IA
              </Button>
            )}
            {onGoHome && (
              <Button variant="ghost" onClick={onGoHome}>
                Ir al Inicio
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vista activa de la lección
  const currentReflections = Object.values(reflectionResponses).filter(Boolean);
  const activeReflection = currentReflections.length > 0 ? currentReflections[currentReflections.length - 1] : undefined;

  return (
    <div className={styles.container}>
      {/* Header de lección */}
      <header className={styles.headerCard}>
        <div className={styles.topRow}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            aria-label={`Volver a ${lesson.topicName}`}
          >
            ← Volver
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mar-space-2)', flexWrap: 'wrap' }}>
            <span className={styles.breadcrumb}>
              {lesson.subjectName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReflectionOpen(true)}
              aria-label="Abrir reflexión ¿Qué aprendiste hoy?"
            >
              🌸 ¿Qué aprendiste?
            </Button>
            {onConsultTutor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onConsultTutor(lesson, activeReflection)}
                aria-label="Preguntar a Mar IA sobre esta lección"
              >
                💬 Mar IA
              </Button>
            )}
          </div>
        </div>

        <h1 className={styles.lessonTitle}>{lesson.title}</h1>

        <div className={styles.stepIndicatorRow}>
          <span className={styles.stepBadge}>
            Paso {currentStepIndex + 1} de {totalSteps}
          </span>
          <span className={styles.sectionTitle}>
            {currentSection.title}
          </span>
        </div>
      </header>

      {/* Cuerpo de la lección */}
      <main className={styles.contentCard}>
        {currentSection.blocks.map(renderBlock)}

        {/* Barra de navegación de pasos */}
        <nav className={styles.navigationRow} aria-label="Navegación de pasos de la lección">
          <Button
            variant="secondary"
            size="md"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            aria-label="Paso anterior"
          >
            ← Anterior
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleNext}
            aria-label={currentStepIndex === totalSteps - 1 ? 'Finalizar lección' : 'Siguiente paso'}
          >
            {currentStepIndex === totalSteps - 1 ? 'Completar lección 🌸' : 'Continuar →'}
          </Button>
        </nav>
      </main>
    </div>
  );
};
