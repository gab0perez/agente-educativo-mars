import { ExamConfig } from '../domain/examTypes';
import { PracticeActivity } from '../../learning/domain/types';
import { MOCK_PRACTICE_ACTIVITIES, getPracticeActivitiesForTopic } from '../../practice/data/mockPracticeActivities';
import { Topic, Subject } from '../../types/academic';

export const MOCK_EXAM_CONFIGS: ExamConfig[] = [
  {
    id: 'exam-sinergia',
    title: 'Examen de Sinergia y Sistemas',
    description: 'Evaluación formativa de 5 preguntas sobre principios de sinergia, factores combinados y trabajo en equipo.',
    subjectId: 'ciencias-3',
    subjectName: 'Ciencias Naturales III',
    topicId: 'sinergia',
    topicName: 'Sinergia',
    activityIds: [
      'act-sinergia-01',
      'act-sinergia-02',
      'act-sinergia-03',
      'act-sinergia-04',
      'act-sinergia-05'
    ],
    timeLimitMinutes: 15,
    shuffleQuestions: false,
    createdAt: '2026-09-25T08:00:00.000Z'
  }
];

export function getExamConfigForTopic(topicId: string): ExamConfig | null {
  return MOCK_EXAM_CONFIGS.find((c) => c.topicId === topicId) || null;
}

export function getExamConfigForSubject(subjectId: string): ExamConfig | null {
  return MOCK_EXAM_CONFIGS.find((c) => c.subjectId === subjectId) || null;
}

export function getActivitiesForExam(config: ExamConfig): PracticeActivity[] {
  return config.activityIds
    .map((id) => MOCK_PRACTICE_ACTIVITIES.find((a) => a.id === id))
    .filter((a): a is PracticeActivity => Boolean(a));
}

export function createOrGetExamForTopic(topic: Topic, subject?: Subject): { config: ExamConfig; activities: PracticeActivity[] } {
  const existing = getExamConfigForTopic(topic.id);
  if (existing) {
    const acts = getActivitiesForExam(existing);
    if (acts.length > 0) {
      return { config: existing, activities: acts };
    }
  }

  // Si no hay configuración predefinida o actividades registradas, buscar por topicId o fallback
  let acts = getPracticeActivitiesForTopic(topic.id);
  if (acts.length === 0) {
    acts = MOCK_PRACTICE_ACTIVITIES;
  }

  const generatedConfig: ExamConfig = {
    id: `exam-${topic.id}-${Date.now()}`,
    title: `Examen de ${topic.name}`,
    description: `Evaluación formativa sobre los conceptos clave de ${topic.name}.`,
    subjectId: subject?.id || topic.subjectId,
    subjectName: subject?.name,
    topicId: topic.id,
    topicName: topic.name,
    activityIds: acts.map((a) => a.id),
    timeLimitMinutes: 15,
    shuffleQuestions: false,
    createdAt: new Date().toISOString()
  };

  return { config: generatedConfig, activities: acts };
}
