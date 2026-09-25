import React from 'react';
import { Subject, Topic } from '../../types/academic';
import { PracticeActivity } from '../../learning/domain/types';
import { usePracticeSession } from '../hooks/usePracticeSession';
import { PracticeIntro } from '../components/PracticeIntro/PracticeIntro';
import { PracticeHeader } from '../components/PracticeHeader/PracticeHeader';
import { MultipleChoiceQuestion } from '../components/QuestionCard/MultipleChoiceQuestion';
import { TrueFalseQuestion } from '../components/QuestionCard/TrueFalseQuestion';
import { ShortAnswerQuestion } from '../components/QuestionCard/ShortAnswerQuestion';
import { OpenResponseQuestion } from '../components/QuestionCard/OpenResponseQuestion';
import { PracticeFeedback } from '../components/PracticeFeedback/PracticeFeedback';
import { PracticeCompletion } from '../components/PracticeCompletion/PracticeCompletion';
import styles from './PracticeView.module.css';

export interface PracticeViewProps {
  subject?: Subject;
  topic?: Topic;
  initialActivities?: PracticeActivity[];
  onBack?: () => void;
  onComplete?: () => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  subject,
  topic,
  initialActivities,
  onBack,
  onComplete
}) => {
  const {
    currentActivity,
    currentIndex,
    totalActivities,
    currentAnswer,
    status,
    currentEvaluation,
    attempts,
    errorMessage,
    startSession,
    handleSelectAnswer,
    submitAnswer,
    nextActivity,
    restartSession
  } = usePracticeSession({
    subject,
    topic,
    initialActivities
  });

  const subjectTitle = subject?.name || subject?.shortName || 'Materia';
  const topicTitle = topic?.name || 'Tema de Estudio';

  // 1. Pantalla de Introducción (IDLE)
  if (status === 'IDLE') {
    return (
      <div className={styles.practiceViewContainer}>
        <PracticeIntro
          subject={subject}
          topic={topic}
          totalActivities={totalActivities}
          onStart={startSession}
          onBack={onBack}
        />
      </div>
    );
  }

  // 2. Pantalla de Finalización (COMPLETED)
  if (status === 'COMPLETED') {
    return (
      <div className={styles.practiceViewContainer}>
        <PracticeCompletion
          subjectTitle={subjectTitle}
          topicTitle={topicTitle}
          attempts={attempts}
          onRestart={restartSession}
          onBackToTopic={() => {
            if (onComplete) {
              onComplete();
            } else if (onBack) {
              onBack();
            }
          }}
        />
      </div>
    );
  }

  const isSubmitting = status === 'SUBMITTING';
  const isFeedback = status === 'FEEDBACK';

  return (
    <div className={styles.practiceViewContainer} role="main" aria-label="Sesión de práctica interactiva">
      <PracticeHeader
        topicName={topicTitle}
        currentIndex={currentIndex}
        totalActivities={totalActivities}
        onBack={onBack}
      />

      {errorMessage && (
        <div className={styles.errorBanner} role="alert">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className={styles.contentWrapper}>
        {currentActivity?.type === 'MULTIPLE_CHOICE' && (
          <MultipleChoiceQuestion
            activity={currentActivity}
            selectedAnswer={currentAnswer}
            onSelectAnswer={handleSelectAnswer}
            onSubmit={submitAnswer}
            disabled={isSubmitting || isFeedback}
          />
        )}

        {currentActivity?.type === 'TRUE_FALSE' && (
          <TrueFalseQuestion
            activity={currentActivity}
            selectedAnswer={currentAnswer}
            onSelectAnswer={handleSelectAnswer}
            onSubmit={submitAnswer}
            disabled={isSubmitting || isFeedback}
          />
        )}

        {currentActivity?.type === 'SHORT_ANSWER' && (
          <ShortAnswerQuestion
            activity={currentActivity}
            selectedAnswer={currentAnswer}
            onSelectAnswer={handleSelectAnswer}
            onSubmit={submitAnswer}
            disabled={isSubmitting || isFeedback}
          />
        )}

        {currentActivity?.type === 'OPEN_RESPONSE' && (
          <OpenResponseQuestion
            activity={currentActivity}
            selectedAnswer={currentAnswer}
            onSelectAnswer={handleSelectAnswer}
            onSubmit={submitAnswer}
            disabled={isSubmitting || isFeedback}
          />
        )}

        {isFeedback && currentEvaluation && (
          <PracticeFeedback
            evaluation={currentEvaluation}
            onNext={nextActivity}
            isLast={currentIndex === totalActivities - 1}
          />
        )}
      </div>
    </div>
  );
};
