import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultReviewScheduler } from '../review/ReviewScheduler';
import { LocalReviewRepository } from '../repositories/ReviewRepository';
import { LearningEngine } from '../service/LearningEngine';
import { LocalLearningEvidenceRepository } from '../repositories/LearningEvidenceRepository';
import { LocalMasteryRepository } from '../repositories/MasteryRepository';
import { LocalPracticeRepository } from '../repositories/PracticeRepository';
import { PracticeService } from '../practice/PracticeService';
import { DefaultMasteryEvaluator } from '../mastery/MasteryEvaluator';
import { LearningEvidence, MasteryState } from '../domain/types';
import { StorageAdapter } from '../../storage';

describe('TG22 — Intelligent Review Unit & Architecture Tests', () => {
  let mockStorageData: Record<string, any>;
  let mockStorage: StorageAdapter;
  let evidenceRepo: LocalLearningEvidenceRepository;
  let masteryRepo: LocalMasteryRepository;
  let reviewRepo: LocalReviewRepository;
  let practiceRepo: LocalPracticeRepository;
  let practiceService: PracticeService;
  let scheduler: DefaultReviewScheduler;
  let engine: LearningEngine;

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

    evidenceRepo = new LocalLearningEvidenceRepository(mockStorage);
    masteryRepo = new LocalMasteryRepository(mockStorage);
    reviewRepo = new LocalReviewRepository(mockStorage);
    practiceRepo = new LocalPracticeRepository(mockStorage);
    practiceService = new PracticeService(practiceRepo);
    scheduler = new DefaultReviewScheduler();

    engine = new LearningEngine({
      evidenceRepo,
      masteryRepo,
      reviewRepo,
      practiceRepo,
      masteryEvaluator: new DefaultMasteryEvaluator(),
      reviewScheduler: scheduler,
      practiceService
    });
  });

  describe('ReviewScheduler — Reglas Deterministas y Cualitativas', () => {
    it('Genera recomendación de alta prioridad (HIGH) con actividad TUTOR para temas con NEEDS_REVIEW', () => {
      const mastery: MasteryState = {
        id: 'm-1',
        topicId: 'tema-sinergia',
        level: 'NEEDS_REVIEW',
        evidenceCount: 3,
        updatedAt: new Date().toISOString()
      };

      const item = scheduler.generateReviewItem(mastery, []);
      expect(item).toBeDefined();
      expect(item?.reason).toBe('LOW_MASTERY');
      expect(item?.priority).toBe('HIGH');
      expect(item?.recommendedActivity).toBe('TUTOR');
    });

    it('Prioriza RECENT_ERROR cuando existen fallos recientes aunque el nivel no sea crítico', () => {
      const mastery: MasteryState = {
        id: 'm-2',
        topicId: 'tema-sinergia',
        level: 'DEVELOPING',
        evidenceCount: 4,
        updatedAt: new Date().toISOString()
      };

      const recentErrors: LearningEvidence[] = [
        {
          id: 'ev-err',
          topicId: 'tema-sinergia',
          source: 'QUIZ',
          result: 'INCORRECT',
          provenance: 'AI_COMPLEMENTARY',
          createdAt: new Date().toISOString()
        }
      ];

      const item = scheduler.generateReviewItem(mastery, recentErrors);
      expect(item?.reason).toBe('RECENT_ERROR');
      expect(item?.priority).toBe('HIGH');
      expect(item?.recommendedActivity).toBe('TUTOR');
    });

    it('Genera recomendación de prioridad media (MEDIUM) y actividad EXERCISE para DEVELOPING', () => {
      const mastery: MasteryState = {
        id: 'm-3',
        topicId: 'tema-sinergia',
        level: 'DEVELOPING',
        evidenceCount: 2,
        updatedAt: new Date().toISOString()
      };

      const item = scheduler.generateReviewItem(mastery, []);
      expect(item?.reason).toBe('PARTIAL_UNDERSTANDING');
      expect(item?.priority).toBe('MEDIUM');
      expect(item?.recommendedActivity).toBe('EXERCISE');
    });

    it('No genera revisión innecesaria para temas UNDERSTOOD recién practicados (< 72h)', () => {
      const mastery: MasteryState = {
        id: 'm-4',
        topicId: 'tema-sinergia',
        level: 'UNDERSTOOD',
        evidenceCount: 4,
        lastReviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const item = scheduler.generateReviewItem(mastery, []);
      expect(item).toBeNull();
    });

    it('Genera revisión TIME_ELAPSED de baja prioridad (LOW) para UNDERSTOOD cuando han pasado más de 72 horas', () => {
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
      const mastery: MasteryState = {
        id: 'm-5',
        topicId: 'tema-sinergia',
        level: 'UNDERSTOOD',
        evidenceCount: 4,
        lastEvidenceAt: fourDaysAgo,
        updatedAt: fourDaysAgo
      };

      const item = scheduler.generateReviewItem(mastery, []);
      expect(item).toBeDefined();
      expect(item?.reason).toBe('TIME_ELAPSED');
      expect(item?.priority).toBe('LOW');
      expect(item?.recommendedActivity).toBe('QUIZ');
    });

    it('No genera revisión para temas STRONG consolidados recientemente (< 7 días)', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const mastery: MasteryState = {
        id: 'm-strong-fresh',
        topicId: 'tema-sinergia',
        level: 'STRONG',
        evidenceCount: 6,
        lastReviewedAt: threeDaysAgo,
        updatedAt: threeDaysAgo
      };

      const item = scheduler.generateReviewItem(mastery, []);
      expect(item).toBeNull();
    });

    it('Genera revisión TIME_ELAPSED para temas STRONG cuando han pasado más de 7 días', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const mastery: MasteryState = {
        id: 'm-strong-old',
        topicId: 'tema-sinergia',
        level: 'STRONG',
        evidenceCount: 6,
        lastEvidenceAt: tenDaysAgo,
        updatedAt: tenDaysAgo
      };

      const item = scheduler.generateReviewItem(mastery, []);
      expect(item).toBeDefined();
      expect(item?.reason).toBe('TIME_ELAPSED');
      expect(item?.priority).toBe('LOW');
      expect(item?.recommendedActivity).toBe('QUIZ');
    });

    it('Permite solicitud explícita del usuario con USER_REQUESTED y actividad configurada', () => {
      const mastery: MasteryState = {
        id: 'm-6',
        topicId: 'tema-sinergia',
        level: 'UNDERSTOOD',
        evidenceCount: 5,
        updatedAt: new Date().toISOString()
      };

      const item = scheduler.generateReviewItem(mastery, [], {
        reasonOverride: 'USER_REQUESTED',
        preferredActivity: 'EXERCISE'
      });

      expect(item).toBeDefined();
      expect(item?.reason).toBe('USER_REQUESTED');
      expect(item?.priority).toBe('MEDIUM');
      expect(item?.recommendedActivity).toBe('EXERCISE');
    });

    it('No convierte automáticamente temas UNKNOWN sin evidencias en problemas', () => {
      const unknownMastery: MasteryState = {
        id: 'm-7',
        topicId: 'tema-desconocido',
        level: 'UNKNOWN',
        evidenceCount: 0,
        updatedAt: new Date().toISOString()
      };

      const item = scheduler.generateReviewItem(unknownMastery, []);
      expect(item).toBeNull();
    });
  });

  describe('ReviewRepository — Idempotencia y Deduplicación', () => {
    it('Evita duplicar ReviewItems pendientes para el mismo tema, motivo y actividad', () => {
      const first = reviewRepo.save({
        topicId: 'tema-sinergia',
        reason: 'LOW_MASTERY',
        priority: 'HIGH',
        recommendedActivity: 'TUTOR'
      });

      const second = reviewRepo.save({
        topicId: 'tema-sinergia',
        reason: 'LOW_MASTERY',
        priority: 'HIGH',
        recommendedActivity: 'TUTOR'
      });

      expect(first.id).toBe(second.id);
      expect(reviewRepo.getPending().length).toBe(1);
    });

    it('Permite un nuevo ReviewItem si el anterior ya fue completado', () => {
      const first = reviewRepo.save({
        topicId: 'tema-sinergia',
        reason: 'LOW_MASTERY',
        priority: 'HIGH',
        recommendedActivity: 'TUTOR'
      });

      reviewRepo.markCompleted(first.id);
      expect(reviewRepo.getPending().length).toBe(0);

      const second = reviewRepo.save({
        topicId: 'tema-sinergia',
        reason: 'LOW_MASTERY',
        priority: 'HIGH',
        recommendedActivity: 'TUTOR'
      });

      expect(second.completedAt).toBeUndefined();
      expect(reviewRepo.getPending().length).toBe(1);
      expect(reviewRepo.getAll().length).toBe(2);
    });
  });

  describe('LearningEngine — Integración de Flujo Completo (TG18 + TG20 + TG21 + TG22)', () => {
    it('Flujo TG18: Reflexión con comprensión parcial -> Mastery DEVELOPING -> ReviewItem sugerido', () => {
      // 1. Mar registra una reflexión sobre Sinergia
      engine.recordReflectionEvidence(
        {
          id: 'refl-1',
          subjectId: 'ciencias-3',
          topicId: 'sinergia',
          prompt: '¿Qué entendiste sobre sinergia?',
          answer: 'Entendí que es trabajar juntos, pero me cuesta diferenciarlo de la cooperación simple.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          provenance: 'USER_PROVIDED'
        },
        'PARTIAL'
      );

      // 2. MasteryState se actualiza a DEVELOPING
      const mastery = engine.getMastery('sinergia');
      expect(mastery.level).toBe('DEVELOPING');

      // 3. LearningEngine programa repaso
      const reviewItem = engine.scheduleReview('sinergia');
      expect(reviewItem).toBeDefined();
      expect(reviewItem?.topicId).toBe('sinergia');
      expect(reviewItem?.reason).toBe('PARTIAL_UNDERSTANDING');
      expect(reviewItem?.priority).toBe('MEDIUM');

      // 4. Se verifica que está en pendientes
      const pending = engine.getPendingReviews('sinergia');
      expect(pending.length).toBe(1);

      // 5. Completar el repaso
      const completed = engine.completeReview(reviewItem!.id);
      expect(completed?.completedAt).toBeDefined();
      expect(engine.getPendingReviews('sinergia').length).toBe(0);
    });

    it('Flujo TG20: Práctica fallida -> Mastery NEEDS_REVIEW -> ReviewItem HIGH TUTOR', () => {
      // Registrar actividad de práctica
      const act = practiceRepo.saveActivity({
        type: 'MULTIPLE_CHOICE',
        subjectId: 'ciencias-3',
        topicId: 'sinergia',
        prompt: '¿Qué es sinergia?',
        options: [
          { id: '1', text: 'Suma de partes', isCorrect: false },
          { id: '2', text: 'El todo es mayor que la suma de sus partes', isCorrect: true }
        ],
        provenance: 'CLASS_ORIGIN'
      });

      // Intento incorrecto
      engine.recordPracticeAttempt({
        activityId: act.id,
        answer: '1',
        result: 'INCORRECT',
        feedback: 'Respuesta incorrecta. Recuerda que la sinergia produce un resultado superior.'
      });

      // Segundo intento incorrecto para asegurar NEEDS_REVIEW
      engine.recordPracticeAttempt({
        activityId: act.id,
        answer: '1',
        result: 'INCORRECT'
      });

      const mastery = engine.getMastery('sinergia');
      expect(mastery.level).toBe('NEEDS_REVIEW');

      // Se programa automáticamente o bajo demanda
      const review = engine.scheduleReview('sinergia');
      expect(review).toBeDefined();
      expect(review?.priority).toBe('HIGH');
      expect(review?.recommendedActivity).toBe('TUTOR');
    });

    it('Flujo USER_REQUESTED: Solicitud voluntaria de repaso crea ítem correctamente', () => {
      const userReview = engine.requestUserReview('sinergia', 'EXERCISE');
      expect(userReview).toBeDefined();
      expect(userReview?.reason).toBe('USER_REQUESTED');
      expect(userReview?.recommendedActivity).toBe('EXERCISE');

      const pending = engine.getPendingReviews('sinergia');
      expect(pending.length).toBe(1);
    });

    it('Auditoría completeReview: Abrir actividad mantiene el ítem pendiente; solo se completa al finalizar', () => {
      // 1. Review pendiente generado
      const review = engine.scheduleReview('sinergia', { reasonOverride: 'LOW_MASTERY' });
      expect(review).toBeDefined();

      // 2. Simulación de abrir la actividad en UI (el ítem debe seguir pendiente)
      const pendingBeforeActivity = engine.getPendingReviews('sinergia');
      expect(pendingBeforeActivity.length).toBe(1);
      expect(pendingBeforeActivity[0].id).toBe(review!.id);

      // 3. Simulación de finalización real de la actividad y registro de evidencia
      engine.recordPracticeAttempt({
        activityId: 'act-1',
        answer: 'Respuesta completada',
        result: 'CORRECT'
      });

      // 4. Se marca completado
      const completed = engine.completeReview(review!.id);
      expect(completed?.completedAt).toBeDefined();
      expect(engine.getPendingReviews('sinergia').length).toBe(0);

      // 5. Se verifica que MasteryState registró la fecha del repaso
      const mastery = engine.getMastery('sinergia');
      expect(mastery.lastReviewedAt).toBeDefined();
    });

    it('Auditoría TIME_ELAPSED: Después de completar el repaso, no vuelve a reaparecer inmediatamente', () => {
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
      masteryRepo.save({
        id: 'm-elapsed',
        topicId: 'sinergia',
        level: 'UNDERSTOOD',
        evidenceCount: 4,
        lastEvidenceAt: fourDaysAgo,
        updatedAt: fourDaysAgo
      });

      // 1. Primera evaluación: genera ReviewItem por TIME_ELAPSED (>72h)
      const review = engine.scheduleReview('sinergia');
      expect(review).toBeDefined();
      expect(review?.reason).toBe('TIME_ELAPSED');

      // 2. Re-evaluación con review pendiente: no duplica el ReviewItem
      const evalAgain = engine.scheduleReview('sinergia');
      expect(evalAgain?.id).toBe(review?.id);
      expect(engine.getPendingReviews('sinergia').length).toBe(1);

      // 3. Usuario completa el repaso
      engine.completeReview(review!.id);
      expect(engine.getPendingReviews('sinergia').length).toBe(0);

      // 4. Nueva evaluación posterior al repaso completado:
      // Como lastReviewedAt fue actualizado a la fecha actual, hoursElapsed < 72h y devuelve null (no reaparece de inmediato)
      const nextEval = engine.scheduleReview('sinergia');
      expect(nextEval).toBeNull();
      expect(engine.getPendingReviews('sinergia').length).toBe(0);
    });
  });
});
