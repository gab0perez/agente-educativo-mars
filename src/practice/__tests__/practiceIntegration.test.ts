import { describe, it, expect, beforeEach } from 'vitest';
import { StorageAdapter } from '../../storage';
import { LocalPracticeRepository } from '../../learning/repositories/PracticeRepository';
import { LocalLearningEvidenceRepository } from '../../learning/repositories/LearningEvidenceRepository';
import { LocalMasteryRepository } from '../../learning/repositories/MasteryRepository';
import { LocalReviewRepository } from '../../learning/repositories/ReviewRepository';
import { DefaultMasteryEvaluator } from '../../learning/mastery/MasteryEvaluator';
import { DefaultReviewScheduler } from '../../learning/review/ReviewScheduler';
import { PracticeService } from '../../learning/practice/PracticeService';
import { LearningEngine } from '../../learning/service/LearningEngine';
import { practiceEvaluator } from '../evaluator/PracticeEvaluator';
import { MOCK_PRACTICE_ACTIVITIES } from '../data/mockPracticeActivities';

describe('TG20 — Practice & Learning Engine Integration Tests', () => {
  let mockStorageData: Record<string, any>;
  let mockStorage: StorageAdapter;
  let practiceRepo: LocalPracticeRepository;
  let evidenceRepo: LocalLearningEvidenceRepository;
  let masteryRepo: LocalMasteryRepository;
  let reviewRepo: LocalReviewRepository;
  let masteryEvaluator: DefaultMasteryEvaluator;
  let reviewScheduler: DefaultReviewScheduler;
  let practiceService: PracticeService;
  let learningEngine: LearningEngine;

  beforeEach(() => {
    mockStorageData = {};
    mockStorage = {
      getItem: <T>(key: string): T | null => (mockStorageData[key] !== undefined ? mockStorageData[key] : null),
      setItem: <T>(key: string, val: T): void => {
        mockStorageData[key] = val;
      },
      removeItem: (key: string): void => {
        delete mockStorageData[key];
      },
      hasKey: (key: string): boolean => mockStorageData[key] !== undefined,
      clear: (): void => {
        mockStorageData = {};
      }
    };

    practiceRepo = new LocalPracticeRepository(mockStorage);
    evidenceRepo = new LocalLearningEvidenceRepository(mockStorage);
    masteryRepo = new LocalMasteryRepository(mockStorage);
    reviewRepo = new LocalReviewRepository(mockStorage);

    masteryEvaluator = new DefaultMasteryEvaluator();
    reviewScheduler = new DefaultReviewScheduler();

    // Guardar actividades en el repositorio
    MOCK_PRACTICE_ACTIVITIES.forEach((act) => practiceRepo.saveActivity(act));

    practiceService = new PracticeService(practiceRepo);

    learningEngine = new LearningEngine({
      evidenceRepo,
      masteryRepo,
      reviewRepo,
      practiceRepo,
      practiceService,
      masteryEvaluator,
      reviewScheduler
    });
  });

  it('Flujo completo: Evalúa actividad, registra PracticeAttempt y genera LearningEvidence en LearningEngine', () => {
    const activity = MOCK_PRACTICE_ACTIVITIES[0]; // Multiple choice: 'opt-2' is correct
    const studentAnswer = 'opt-2';

    // 1. Evaluación pedagógica determinista
    const evaluation = practiceEvaluator.evaluate(activity, studentAnswer);
    expect(evaluation.result).toBe('CORRECT');
    expect(evaluation.feedback).toBeDefined();

    // 2. Registro a través de LearningEngine
    const { attempt, evidence } = learningEngine.recordPracticeAttempt({
      activityId: activity.id,
      answer: studentAnswer,
      result: evaluation.result,
      feedback: evaluation.feedback
    });

    // 3. Verificación de PracticeAttempt en el repositorio
    expect(attempt.id).toBeDefined();
    expect(attempt.activityId).toBe(activity.id);
    expect(attempt.result).toBe('CORRECT');
    expect(practiceRepo.getAttemptById(attempt.id)).toEqual(attempt);

    // 4. Verificación de LearningEvidence
    expect(evidence).toBeDefined();
    expect(evidence?.source).toBe('QUIZ');
    expect(evidence?.topicId).toBe(activity.topicId);
    expect(evidence?.result).toBe('CORRECT');
    expect(evidence?.provenance).toBe('AI_COMPLEMENTARY');
    expect(evidence?.sourceReferenceId).toBe(attempt.id);

    // 5. Verificación de actualización en MasteryState
    const topicMastery = learningEngine.getMastery(activity.topicId!);
    expect(topicMastery).toBeDefined();
    expect(topicMastery.topicId).toBe(activity.topicId);
    expect(['UNDERSTOOD', 'DEVELOPING']).toContain(topicMastery.level);
  });

  it('Registra intento incorrecto y actualiza el estado de mastery acordemente', () => {
    const activity = MOCK_PRACTICE_ACTIVITIES[1]; // True/False: 'true' is correct, 'false' is incorrect
    const studentAnswer = 'false'; // Incorrecto

    const evaluation = practiceEvaluator.evaluate(activity, studentAnswer);
    expect(evaluation.result).toBe('INCORRECT');

    const { attempt, evidence } = learningEngine.recordPracticeAttempt({
      activityId: activity.id,
      answer: studentAnswer,
      result: evaluation.result,
      feedback: evaluation.feedback
    });

    expect(attempt.result).toBe('INCORRECT');
    expect(evidence).toBeDefined();
    expect(evidence?.result).toBe('INCORRECT');
    expect(evidence?.source).toBe('QUIZ');

    const topicEvidences = evidenceRepo.getByTopicId('sinergia');
    expect(topicEvidences.some((e) => e.id === evidence?.id)).toBe(true);
  });

  it('No registra intento ni genera evidencia si la respuesta no se confirma/envía', () => {
    const initialAttempts = practiceRepo.getAttempts();
    const initialEvidences = evidenceRepo.getAll();

    expect(initialAttempts.length).toBe(0);
    expect(initialEvidences.length).toBe(0);

    // No se llama a learningEngine.recordPracticeAttempt
    expect(practiceRepo.getAttempts().length).toBe(0);
    expect(evidenceRepo.getAll().length).toBe(0);
  });

  it('Conserva la procedencia (provenance) durante todo el ciclo PracticeActivity -> PracticeAttempt -> LearningEvidence', () => {
    const classActivity = {
      ...MOCK_PRACTICE_ACTIVITIES[0],
      id: 'act-class-custom',
      provenance: 'CLASS_ORIGIN' as const
    };
    practiceRepo.saveActivity(classActivity);

    const evaluation = practiceEvaluator.evaluate(classActivity, 'opt-2');
    const { attempt, evidence } = learningEngine.recordPracticeAttempt({
      activityId: classActivity.id,
      answer: 'opt-2',
      result: evaluation.result,
      feedback: evaluation.feedback
    });

    expect(evidence?.provenance).toBe('CLASS_ORIGIN');
    expect(attempt.id).toBeDefined();
  });

  it('Múltiples actividades completadas en una sesión alimentan progresivamente el historial de evidencias', () => {
    for (let i = 0; i < 3; i++) {
      const act = MOCK_PRACTICE_ACTIVITIES[i];
      const correctOpt = act.options?.find((o) => o.isCorrect)?.id || 'Sinergia';
      const evaluation = practiceEvaluator.evaluate(act, correctOpt);

      learningEngine.recordPracticeAttempt({
        activityId: act.id,
        answer: correctOpt,
        result: evaluation.result,
        feedback: evaluation.feedback
      });
    }

    const attempts = practiceRepo.getAttempts();
    const evidences = evidenceRepo.getByTopicId('sinergia');

    expect(attempts.length).toBe(3);
    expect(evidences.length).toBe(3);
    expect(evidences.every((e) => e.source === 'QUIZ')).toBe(true);
  });
});
