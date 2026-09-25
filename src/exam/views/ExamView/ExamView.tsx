import React, { useState } from 'react';
import { ExamConfig } from '../../domain/examTypes';
import { PracticeActivity } from '../../../learning/domain/types';
import { useExamSession } from '../../hooks/useExamSession';
import {
  ExamIntro,
  ExamHeader,
  ExamQuestion,
  ExamQuestionNavigator,
  ExamReview,
  ExamResults
} from '../../components';
import { Button } from '../../../components/ui/Button/Button';
import styles from './ExamView.module.css';

export interface ExamViewProps {
  config: ExamConfig;
  activities: PracticeActivity[];
  onExit: () => void;
  onGoToPractice?: () => void;
  onGoToTopics?: () => void;
  onGoHome?: () => void;
}

export const ExamView: React.FC<ExamViewProps> = ({
  config,
  activities,
  onExit,
  onGoToPractice,
  onGoToTopics,
  onGoHome
}) => {
  const {
    session,
    summary,
    currentActivity,
    currentAnswer,
    isFirstQuestion,
    isLastQuestion,
    startExam,
    answerCurrentQuestion,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    openReview,
    resumeExam,
    abandonExam,
    finalizeExam
  } = useExamSession(config, activities);

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleRequestExit = () => {
    if (session.status === 'IN_PROGRESS' || session.status === 'REVIEWING') {
      setShowExitConfirm(true);
    } else {
      onExit();
    }
  };

  const handleConfirmAbandon = () => {
    setShowExitConfirm(false);
    abandonExam();
    onExit();
  };

  const handleCancelAbandon = () => {
    setShowExitConfirm(false);
  };

  const answeredCount = session.answers.filter((a) => a.isAnswered).length;

  return (
    <main className={styles.viewContainer} aria-label="Modo Examen">
      {/* 1. READY: Screen to introduce the exam */}
      {session.status === 'READY' && (
        <ExamIntro
          config={config}
          onStart={startExam}
          onCancel={onExit}
        />
      )}

      {/* 2. IN_PROGRESS: Active question screen */}
      {session.status === 'IN_PROGRESS' && currentActivity && (
        <>
          <ExamHeader
            title={config.title}
            currentIndex={session.currentQuestionIndex}
            totalQuestions={session.answers.length}
            answeredCount={answeredCount}
            onOpenReview={openReview}
            onAbandon={handleRequestExit}
          />

          <ExamQuestion
            activity={currentActivity}
            currentAnswer={currentAnswer}
            questionIndex={session.currentQuestionIndex}
            totalQuestions={session.answers.length}
            isFirst={isFirstQuestion}
            isLast={isLastQuestion}
            onAnswer={answerCurrentQuestion}
            onPrev={prevQuestion}
            onNext={nextQuestion}
            onOpenReview={openReview}
          />

          <ExamQuestionNavigator
            answers={session.answers}
            currentIndex={session.currentQuestionIndex}
            onSelectIndex={goToQuestion}
          />
        </>
      )}

      {/* 3. REVIEWING: Pre-submission verification */}
      {session.status === 'REVIEWING' && (
        <>
          <ExamHeader
            title={config.title}
            currentIndex={session.currentQuestionIndex}
            totalQuestions={session.answers.length}
            answeredCount={answeredCount}
            onOpenReview={openReview}
            onAbandon={handleRequestExit}
          />

          <ExamReview
            answers={session.answers}
            activities={activities}
            onResumeExam={resumeExam}
            onGoToQuestion={goToQuestion}
            onFinalizeExam={finalizeExam}
          />
        </>
      )}

      {/* 4. COMPLETED: Qualitative Results summary */}
      {session.status === 'COMPLETED' && summary && (
        <ExamResults
          summary={summary}
          onGoHome={onGoHome || onExit}
          onGoToPractice={onGoToPractice}
          onGoToTopics={onGoToTopics || onExit}
        />
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="abandon-modal-title"
        >
          <div className={styles.modalCard}>
            <h3 id="abandon-modal-title" className={styles.modalTitle}>
              ¿Salir del examen?
            </h3>
            <p className={styles.modalText}>
              Si sales ahora, este examen no se registrará como completado y tus respuestas temporales no generarán evidencia ni afectarán tu progreso de aprendizaje.
            </p>
            <div className={styles.modalActions}>
              <Button
                variant="ghost"
                size="md"
                onClick={handleCancelAbandon}
              >
                Continuar examen
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleConfirmAbandon}
              >
                Salir del examen
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
