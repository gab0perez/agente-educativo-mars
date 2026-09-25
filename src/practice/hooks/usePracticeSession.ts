import { useState, useCallback, useEffect } from 'react';
import { PracticeActivity, PracticeAttempt } from '../../learning/domain/types';
import { PracticeEvaluation, PracticeSessionStatus } from '../domain/practiceSessionTypes';
import { Subject, Topic } from '../../types/academic';
import { ILearningEngine, learningEngine as defaultLearningEngine } from '../../learning/service/LearningEngine';
import { practiceEvaluator } from '../evaluator/PracticeEvaluator';
import { getPracticeActivitiesForTopic, MOCK_PRACTICE_ACTIVITIES } from '../data/mockPracticeActivities';

export interface UsePracticeSessionOptions {
  subject?: Subject;
  topic?: Topic;
  initialActivities?: PracticeActivity[];
  learningEngine?: ILearningEngine;
}

export function usePracticeSession(options: UsePracticeSessionOptions = {}) {
  const {
    subject,
    topic,
    initialActivities,
    learningEngine = defaultLearningEngine
  } = options;

  const [activities, setActivities] = useState<PracticeActivity[]>(() => {
    if (initialActivities && initialActivities.length > 0) {
      return initialActivities;
    }
    if (topic?.id) {
      const topicActs = getPracticeActivitiesForTopic(topic.id);
      return topicActs.length > 0 ? topicActs : MOCK_PRACTICE_ACTIVITIES;
    }
    return MOCK_PRACTICE_ACTIVITIES;
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [status, setStatus] = useState<PracticeSessionStatus>('IDLE');
  const [currentEvaluation, setCurrentEvaluation] = useState<PracticeEvaluation | null>(null);
  const [lastAttempt, setLastAttempt] = useState<PracticeAttempt | null>(null);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sincronizar actividades si cambia el tema
  useEffect(() => {
    if (topic?.id && (!initialActivities || initialActivities.length === 0)) {
      const topicActs = getPracticeActivitiesForTopic(topic.id);
      setActivities(topicActs.length > 0 ? topicActs : MOCK_PRACTICE_ACTIVITIES);
    }
  }, [topic?.id, initialActivities]);

  const currentActivity = activities[currentIndex] || null;

  const startSession = useCallback(() => {
    setCurrentIndex(0);
    setCurrentAnswer('');
    setCurrentEvaluation(null);
    setLastAttempt(null);
    setAttempts([]);
    setErrorMessage(null);
    setStatus('ANSWERING');
  }, []);

  const handleSelectAnswer = useCallback((answer: string) => {
    setCurrentAnswer(answer);
    if (errorMessage) {
      setErrorMessage(null);
    }
  }, [errorMessage]);

  const submitAnswer = useCallback(async () => {
    if (!currentActivity) return;
    const trimmed = currentAnswer.trim();
    if (!trimmed) {
      setErrorMessage('Por favor selecciona o escribe tu respuesta antes de continuar.');
      return;
    }

    setStatus('SUBMITTING');
    setErrorMessage(null);

    try {
      // 1. Evaluación pedagógica determinista
      const evaluation = practiceEvaluator.evaluate(currentActivity, trimmed);

      // 2. Registro a través del Learning Engine
      const { attempt } = learningEngine.recordPracticeAttempt({
        activityId: currentActivity.id,
        answer: trimmed,
        result: evaluation.result,
        feedback: evaluation.feedback
      });

      setCurrentEvaluation(evaluation);
      setLastAttempt(attempt);
      setAttempts((prev) => [...prev, attempt]);
      setStatus('FEEDBACK');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No fue posible registrar tu intento. Intenta de nuevo.';
      setErrorMessage(msg);
      setStatus('ERROR');
    }
  }, [currentActivity, currentAnswer, learningEngine]);

  const nextActivity = useCallback(() => {
    setErrorMessage(null);
    setCurrentEvaluation(null);
    setLastAttempt(null);
    setCurrentAnswer('');

    if (currentIndex < activities.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setStatus('ANSWERING');
    } else {
      setStatus('COMPLETED');
    }
  }, [currentIndex, activities.length]);

  const restartSession = useCallback(() => {
    startSession();
  }, [startSession]);

  return {
    subject,
    topic,
    activities,
    currentActivity,
    currentIndex,
    totalActivities: activities.length,
    currentAnswer,
    status,
    currentEvaluation,
    lastAttempt,
    attempts,
    errorMessage,
    startSession,
    handleSelectAnswer,
    submitAnswer,
    nextActivity,
    restartSession
  };
}
