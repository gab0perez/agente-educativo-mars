import { useState, useCallback, useMemo } from 'react';
import { ExamConfig, ExamSession, ExamSummary } from '../domain/examTypes';
import { PracticeActivity } from '../../learning/domain/types';
import { ExamService, examService as defaultExamService } from '../service/ExamService';

export interface UseExamSessionOptions {
  examService?: ExamService;
}

export function useExamSession(
  config: ExamConfig,
  activities: PracticeActivity[],
  options: UseExamSessionOptions = {}
) {
  const service = options.examService || defaultExamService;

  const [session, setSession] = useState<ExamSession>(() =>
    service.createSession(config)
  );
  const [summary, setSummary] = useState<ExamSummary | null>(null);

  const currentActivityId = session.answers[session.currentQuestionIndex]?.activityId;
  const currentActivity = useMemo(() => {
    return activities.find((a) => a.id === currentActivityId) || null;
  }, [activities, currentActivityId]);

  const currentAnswer = useMemo(() => {
    const ansObj = session.answers[session.currentQuestionIndex];
    return ansObj?.answer || '';
  }, [session.answers, session.currentQuestionIndex]);

  const isFirstQuestion = session.currentQuestionIndex === 0;
  const isLastQuestion = session.currentQuestionIndex === session.answers.length - 1;

  const startExam = useCallback(() => {
    setSession((prev) => service.startSession(prev));
  }, [service]);

  const answerCurrentQuestion = useCallback(
    (answer: string) => {
      if (!currentActivityId) return;
      setSession((prev) =>
        service.answerQuestion(prev, currentActivityId, answer)
      );
    },
    [service, currentActivityId]
  );

  const nextQuestion = useCallback(() => {
    setSession((prev) => {
      if (prev.currentQuestionIndex < prev.answers.length - 1) {
        return service.goToQuestion(prev, prev.currentQuestionIndex + 1);
      }
      return service.goToReview(prev);
    });
  }, [service]);

  const prevQuestion = useCallback(() => {
    setSession((prev) => {
      if (prev.currentQuestionIndex > 0) {
        return service.goToQuestion(prev, prev.currentQuestionIndex - 1);
      }
      return prev;
    });
  }, [service]);

  const goToQuestion = useCallback(
    (index: number) => {
      setSession((prev) => service.goToQuestion(prev, index));
    },
    [service]
  );

  const openReview = useCallback(() => {
    setSession((prev) => service.goToReview(prev));
  }, [service]);

  const resumeExam = useCallback(() => {
    setSession((prev) => service.resumeExam(prev));
  }, [service]);

  const abandonExam = useCallback(() => {
    setSession((prev) => service.abandonSession(prev));
  }, [service]);

  const finalizeExam = useCallback(() => {
    const result = service.finalizeExam(session, activities);
    setSession(result.session);
    setSummary(result.summary);
  }, [service, session, activities]);

  return {
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
  };
}
