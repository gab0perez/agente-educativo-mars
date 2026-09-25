import { describe, it, expect, beforeEach } from 'vitest';
import { LearningEngine } from '../service/LearningEngine';
import { LocalLearningEvidenceRepository } from '../repositories/LearningEvidenceRepository';
import { LocalMasteryRepository } from '../repositories/MasteryRepository';
import { LocalReviewRepository } from '../repositories/ReviewRepository';
import { LocalPracticeRepository } from '../repositories/PracticeRepository';
import { PracticeService } from '../practice/PracticeService';
import { Reflection } from '../../types/reflection';
import { StorageAdapter } from '../../storage';

describe('TG19 — Practice, Isolation & End-to-End Learning Engine Integration', () => {
  let mockStorageData: Record<string, any>;
  let mockStorage: StorageAdapter;
  let evidenceRepo: LocalLearningEvidenceRepository;
  let masteryRepo: LocalMasteryRepository;
  let reviewRepo: LocalReviewRepository;
  let practiceRepo: LocalPracticeRepository;
  let practiceService: PracticeService;
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

    engine = new LearningEngine({
      evidenceRepo,
      masteryRepo,
      reviewRepo,
      practiceRepo,
      practiceService
    });
  });

  describe('1. Flujo End-to-End: Reflection -> Evidence -> Mastery', () => {
    it('Convierte una Reflection de TG18 en LearningEvidence y actualiza el estado de Mastery', () => {
      const sampleReflection: Reflection = {
        id: 'refl-tg18-101',
        subjectId: 'rh-101',
        subjectName: 'Recursos Humanos',
        topicId: 'tema-sinergia',
        topicName: 'Sinergia Organizacional',
        prompt: '¿Qué aprendiste hoy?',
        answer: 'Hoy aprendí que la sinergia organizacional multiplica el impacto de los equipos.',
        provenance: 'USER_PROVIDED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const evidence = engine.recordReflectionEvidence(sampleReflection, 'UNDERSTOOD');

      expect(evidence).toBeDefined();
      expect(evidence.source).toBe('REFLECTION');
      expect(evidence.sourceReferenceId).toBe('refl-tg18-101');
      expect(evidence.topicId).toBe('tema-sinergia');
      expect(evidence.provenance).toBe('USER_PROVIDED');

      // Comprobar que mastery se recalculó
      const mastery = engine.getMastery('tema-sinergia');
      expect(mastery.evidenceCount).toBe(1);
      expect(mastery.level).toBe('DEVELOPING'); // 1 sola evidencia positiva inicia en DEVELOPING
    });
  });

  describe('2. Flujo End-to-End: PracticeActivity -> PracticeAttempt -> Evidence -> Mastery -> Review', () => {
    it('Ejecuta el ciclo completo de práctica, registro de evidencia, cómputo de mastery y propuesta de repaso', () => {
      // A. Crear actividad de práctica
      const activity = practiceService.createActivity({
        type: 'MULTIPLE_CHOICE',
        subjectId: 'rh-101',
        topicId: 'tema-sinergia',
        prompt: '¿Cuál es el beneficio principal de la sinergia en RH?',
        options: [
          { id: 'opt-1', text: 'Trabajar de forma aislada', isCorrect: false },
          { id: 'opt-2', text: 'Multiplicar resultados mediante cooperación coordinada', isCorrect: true }
        ],
        provenance: 'CLASS_ORIGIN'
      });

      expect(activity.id).toBeDefined();

      // B. Registrar intento fallido
      const attempt1 = engine.recordPracticeAttempt({
        activityId: activity.id,
        answer: 'opt-1'
      });

      expect(attempt1.attempt.result).toBe('INCORRECT');
      expect(attempt1.evidence?.result).toBe('INCORRECT');

      let mastery = engine.getMastery('tema-sinergia');
      expect(mastery.level).toBe('NEEDS_REVIEW');

      // C. Ante estado NEEDS_REVIEW, el motor programa una recomendación de repaso
      const reviewItem = engine.scheduleReview('tema-sinergia');
      expect(reviewItem).toBeDefined();
      expect(reviewItem?.reason).toBe('RECENT_ERROR');
      expect(reviewItem?.priority).toBe('HIGH');
      expect(reviewItem?.recommendedActivity).toBe('TUTOR');

      // D. La estudiante realiza dos intentos correctos posteriores
      engine.recordPracticeAttempt({
        activityId: activity.id,
        answer: 'opt-2'
      });
      engine.recordPracticeAttempt({
        activityId: activity.id,
        answer: 'opt-2'
      });
      engine.recordEvidence({
        topicId: 'tema-sinergia',
        source: 'QUIZ',
        result: 'CORRECT',
        provenance: 'USER_PROVIDED'
      });

      mastery = engine.getMastery('tema-sinergia');
      expect(mastery.evidenceCount).toBe(4);
      expect(mastery.level).toBe('UNDERSTOOD');
    });
  });

  describe('3. Aislamiento Arquitectónico y Límites de Responsabilidad', () => {
    it('PracticeService NO calcula ni muta directamente MasteryRepository', () => {
      practiceService.createActivity({
        type: 'SHORT_ANSWER',
        topicId: 'tema-sinergia',
        prompt: 'Define sinergia',
        provenance: 'CLASS_ORIGIN'
      });

      expect(masteryRepo.getAll().length).toBe(0);
    });

    it('ReviewRepository NO muta ni elimina evidencias históricas', () => {
      const evidence = engine.recordEvidence({
        topicId: 'tema-sinergia',
        source: 'EXERCISE',
        result: 'INCORRECT',
        provenance: 'USER_PROVIDED'
      });

      const review = engine.scheduleReview('tema-sinergia');
      expect(review).toBeDefined();

      engine.completeReview(review!.id);

      // Verificar que la evidencia original permanece intacta e inmutable
      const storedEvidence = evidenceRepo.getById(evidence.id);
      expect(storedEvidence).not.toBeNull();
      expect(storedEvidence?.result).toBe('INCORRECT');
    });

    it('Garantías de privacidad: Ningún registro del Learning Engine almacena Base64, contraseñas ni secretos', () => {
      const evidence = engine.recordEvidence({
        topicId: 'tema-sinergia',
        source: 'REFLECTION',
        result: 'UNDERSTOOD',
        summary: 'Reflexión conceptual pura',
        provenance: 'USER_PROVIDED'
      });

      const serializedEvidence = JSON.stringify(evidence);
      expect(serializedEvidence).not.toContain('data:image');
      expect(serializedEvidence).not.toContain('base64');
      expect(serializedEvidence).not.toContain('AIzaSy');
    });
  });
});
