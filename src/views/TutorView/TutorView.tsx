import React from 'react';
import styles from './TutorView.module.css';
import { Subject, Topic } from '../../types/academic';
import { Lesson } from '../../types/lesson';
import {
  TutorHeader,
  TutorWelcome,
  TutorMessageList,
  TutorComposer,
  AcademicContextBar,
  LearningReflection
} from '../../tutor/components';
import { useMARTutor } from '../../tutor/hooks/useMARTutor';
import { AcademicContextSelection, IMARTutorClient } from '../../tutor/types/tutorClientTypes';

export interface TutorViewProps {
  initialSubject?: Subject;
  initialTopic?: Topic;
  initialLesson?: Lesson;
  initialSelection?: AcademicContextSelection;
  onBack?: () => void;
  client?: IMARTutorClient;
}

export const TutorView: React.FC<TutorViewProps> = ({
  initialSubject,
  initialTopic,
  initialLesson,
  initialSelection,
  onBack,
  client
}) => {
  const [isReflectionOpen, setIsReflectionOpen] = React.useState<boolean>(false);
  const {
    messages,
    status,
    academicContext,
    sendMessage,
    retryLast,
    selectSuggestedAction,
    respondToComprehensionCheck,
    setAcademicContext,
    resetSession
  } = useMARTutor({
    client,
    initialSelection,
    initialAcademicContext: initialSelection
      ? undefined
      : {
          subject: initialSubject,
          topic: initialTopic,
          lesson: initialLesson
        }
  });

  const handleClearContext = () => {
    setAcademicContext({});
  };

  return (
    <div className={styles.container} role="main" aria-label="Pantalla de tutoría con Mar IA">
      <TutorHeader
        academicContext={academicContext}
        onResetSession={resetSession}
        onBack={onBack}
        hasMessages={messages.length > 0}
      />

      <AcademicContextBar
        academicContext={academicContext}
        onClearContext={handleClearContext}
      />

      <div className={styles.scrollArea}>
        {isReflectionOpen ? (
          <div style={{ padding: 'var(--mar-space-3, 0.75rem)' }}>
            <LearningReflection
              subject={academicContext.subject}
              topic={academicContext.topic}
              lesson={academicContext.lesson}
              client={client}
              onClose={() => setIsReflectionOpen(false)}
              onContinueStudying={() => setIsReflectionOpen(false)}
              onOpenTutor={(text) => {
                setIsReflectionOpen(false);
                sendMessage(`Sobre lo que aprendí hoy ("${text}"), ¿qué me recomiendas repasar?`, {
                  mode: 'EXPLAIN'
                });
              }}
            />
          </div>
        ) : messages.length === 0 ? (
          <TutorWelcome
            academicContext={academicContext}
            onSelectPrompt={(text, mode) => sendMessage(text, { mode, studentIntent: text })}
            onOpenReflection={() => setIsReflectionOpen(true)}
          />
        ) : (
          <TutorMessageList
            messages={messages}
            status={status}
            onSelectSuggestedAction={(action) => {
              if (action.id === 'action-reflection' || action.label.toLowerCase().includes('aprendiste')) {
                setIsReflectionOpen(true);
              } else {
                selectSuggestedAction(action);
              }
            }}
            onSelectComprehensionOption={respondToComprehensionCheck}
            onRetry={retryLast}
          />
        )}
      </div>

      <TutorComposer
        onSendMessage={(text) => sendMessage(text)}
        isLoading={status === 'sending'}
        placeholder={
          academicContext.topic
            ? `Pregunta sobre ${academicContext.topic.name}... 🌸`
            : 'Pregunta a Mar o pide una pista... 🌸'
        }
      />
    </div>
  );
};
