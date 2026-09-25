import { useState, useEffect, useCallback } from 'react';
import { MasteryState, MasteryLevel } from '../domain/types';
import { Subject, Topic } from '../../types/academic';
import { ILearningEngine, learningEngine as defaultLearningEngine } from '../service/LearningEngine';
import { subjectRepository } from '../../repositories/subjectRepository';

export interface TopicWithMastery {
  topic: Topic;
  subject?: Subject;
  mastery: MasteryState;
}

export interface UseLearningSummaryOptions {
  subjectId?: string;
  learningEngine?: ILearningEngine;
}

export function useLearningSummary(options: UseLearningSummaryOptions = {}) {
  const { subjectId, learningEngine = defaultLearningEngine } = options;

  const [topicsWithMastery, setTopicsWithMastery] = useState<TopicWithMastery[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);

      const subjects = subjectId
        ? [subjectRepository.getById(subjectId)].filter(Boolean) as Subject[]
        : subjectRepository.getAll();

      const items: TopicWithMastery[] = [];

      for (const subj of subjects) {
        for (const topic of subj.topics) {
          const mastery = learningEngine.getMastery(topic.id);
          items.push({
            topic,
            subject: subj,
            mastery
          });
        }
      }

      setTopicsWithMastery(items);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No fue posible cargar el resumen de aprendizaje.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [subjectId, learningEngine]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Agrupaciones cualitativas útiles
  const topicsByLevel: Record<MasteryLevel, TopicWithMastery[]> = {
    UNKNOWN: topicsWithMastery.filter((t) => t.mastery.level === 'UNKNOWN'),
    DEVELOPING: topicsWithMastery.filter((t) => t.mastery.level === 'DEVELOPING'),
    NEEDS_REVIEW: topicsWithMastery.filter((t) => t.mastery.level === 'NEEDS_REVIEW'),
    UNDERSTOOD: topicsWithMastery.filter((t) => t.mastery.level === 'UNDERSTOOD'),
    STRONG: topicsWithMastery.filter((t) => t.mastery.level === 'STRONG')
  };

  const activeTopics = topicsWithMastery.filter(
    (t) => t.mastery.level !== 'UNKNOWN'
  );

  const needsAttentionTopics = topicsWithMastery.filter(
    (t) => t.mastery.level === 'NEEDS_REVIEW'
  );

  const totalEvidences = topicsWithMastery.reduce(
    (acc, t) => acc + (t.mastery.evidenceCount || 0),
    0
  );

  return {
    topicsWithMastery,
    topicsByLevel,
    activeTopics,
    needsAttentionTopics,
    totalEvidences,
    isLoading,
    error,
    refreshSummary: loadSummary
  };
}
