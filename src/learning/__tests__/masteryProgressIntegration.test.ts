import { describe, it, expect, beforeEach } from 'vitest';
import { StorageAdapter } from '../../storage';
import { LocalPracticeRepository } from '../repositories/PracticeRepository';
import { LocalLearningEvidenceRepository } from '../repositories/LearningEvidenceRepository';
import { LocalMasteryRepository } from '../repositories/MasteryRepository';
import { LocalReviewRepository } from '../repositories/ReviewRepository';
import { DefaultMasteryEvaluator } from '../mastery/MasteryEvaluator';
import { DefaultReviewScheduler } from '../review/ReviewScheduler';
import { PracticeService } from '../practice/PracticeService';
import { LearningEngine } from '../service/LearningEngine';
import { Reflection } from '../../types/reflection';
import { MOCK_PRACTICE_ACTIVITIES } from '../../practice/data/mockPracticeActivities';

describe('TG21 — Mastery & Learning Progress Integration Tests', () => {
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

  it('Tema sin evidencias inicializa en estado UNKNOWN con mensaje formativo amigable', () => {
    const topicId = 'tema-nuevo-sin-evidencias';
    const mastery = learningEngine.getMastery(topicId);

    expect(mastery.level).toBe('UNKNOWN');
    expect(mastery.evidenceCount).toBe(0);
    expect(mastery.qualitativeSummary).toContain('Sin evidencias');
  });

  it('Reflexión de aprendizaje (TG18) genera evidencia y eleva el tema a DEVELOPING', () => {
    const topicId = 'sinergia';
    const sampleReflection: Reflection = {
      id: 'ref-01',
      subjectId: 'ciencias-3',
      subjectName: 'Ciencias Naturales III',
      topicId: 'sinergia',
      topicName: 'Sinergia',
      lessonId: 'leccion-sinergia',
      prompt: '¿Qué aprendiste hoy sobre sinergia?',
      answer: 'Hoy comprendí que la cooperación en equipo multiplica el impacto positivo.',
      provenance: 'USER_PROVIDED',
      createdAt: '2026-09-25T08:30:00.000Z',
      updatedAt: '2026-09-25T08:30:00.000Z'
    };

    learningEngine.recordReflectionEvidence(sampleReflection, 'UNDERSTOOD');

    const mastery = learningEngine.getMastery(topicId);
    expect(mastery.level).toBe('DEVELOPING');
    expect(mastery.evidenceCount).toBe(1);
    expect(mastery.qualitativeSummary).toContain('Primera evidencia positiva');
  });

  it('Prácticas interactivas (TG20) sumadas a reflexiones consolidan el tema a UNDERSTOOD y STRONG', () => {
    const topicId = 'sinergia';

    // 1. Reflexión previa
    learningEngine.recordEvidence({
      subjectId: 'ciencias-3',
      topicId,
      source: 'REFLECTION',
      result: 'UNDERSTOOD',
      provenance: 'USER_PROVIDED',
      summary: 'Reflexión de clase'
    });

    // 2. Práctica correcta 1
    learningEngine.recordPracticeAttempt({
      activityId: 'act-sinergia-01',
      answer: 'opt-2',
      result: 'CORRECT'
    });

    // 3. Práctica correcta 2
    learningEngine.recordPracticeAttempt({
      activityId: 'act-sinergia-02',
      answer: 'true',
      result: 'CORRECT'
    });

    const intermediateMastery = learningEngine.getMastery(topicId);
    expect(intermediateMastery.level).toBe('UNDERSTOOD');
    expect(intermediateMastery.evidenceCount).toBe(3);

    // 4. Práctica correcta 3
    learningEngine.recordPracticeAttempt({
      activityId: 'act-sinergia-03',
      answer: 'Sinergia',
      result: 'CORRECT'
    });

    const finalMastery = learningEngine.getMastery(topicId);
    expect(finalMastery.level).toBe('STRONG');
    expect(finalMastery.evidenceCount).toBe(4);
    expect(finalMastery.qualitativeSummary).toContain('sólida y consistente');
  });

  it('Dificultades o errores recientes orientan el estado a NEEDS_REVIEW sin castigar con porcentajes', () => {
    const topicId = 'sinergia';

    // 2 errores consecutivos en prácticas
    learningEngine.recordPracticeAttempt({
      activityId: 'act-sinergia-01',
      answer: 'opt-1',
      result: 'INCORRECT'
    });

    learningEngine.recordPracticeAttempt({
      activityId: 'act-sinergia-02',
      answer: 'false',
      result: 'INCORRECT'
    });

    const mastery = learningEngine.getMastery(topicId);
    expect(mastery.level).toBe('NEEDS_REVIEW');
    expect(mastery.qualitativeSummary).toContain('Dificultades recientes detectadas');
  });

  it('No altera evidencias al consultar múltiples veces (idempotente y determinista)', () => {
    const topicId = 'sinergia';

    learningEngine.recordPracticeAttempt({
      activityId: 'act-sinergia-01',
      answer: 'opt-2',
      result: 'CORRECT'
    });

    const m1 = learningEngine.getMastery(topicId);
    const m2 = learningEngine.getMastery(topicId);

    expect(m1.level).toBe(m2.level);
    expect(m1.evidenceCount).toBe(m2.evidenceCount);
    expect(evidenceRepo.getByTopicId(topicId).length).toBe(1);
  });
});
