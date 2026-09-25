import { useState, useEffect, useCallback } from 'react';
import { MasteryState, LearningEvidence } from '../domain/types';
import { ILearningEngine, learningEngine as defaultLearningEngine } from '../service/LearningEngine';

export interface UseTopicMasteryOptions {
  topicId?: string;
  conceptId?: string;
  learningEngine?: ILearningEngine;
}

export function useTopicMastery(options: UseTopicMasteryOptions) {
  const {
    topicId,
    conceptId,
    learningEngine = defaultLearningEngine
  } = options;

  const [mastery, setMastery] = useState<MasteryState | null>(null);
  const [evidences, setEvidences] = useState<LearningEvidence[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMastery = useCallback(() => {
    if (!topicId) {
      setMastery(null);
      setEvidences([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const state = learningEngine.getMastery(topicId, conceptId);
      const evs = learningEngine.getEvidenceForTopic(topicId);

      setMastery(state);
      setEvidences(evs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No fue posible cargar el estado de aprendizaje.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [topicId, conceptId, learningEngine]);

  useEffect(() => {
    fetchMastery();
  }, [fetchMastery]);

  return {
    mastery,
    evidences,
    evidenceCount: evidences.length,
    isLoading,
    error,
    refreshMastery: fetchMastery
  };
}
