import { describe, it, expect, beforeEach } from 'vitest';
import { ExamService } from '../service/ExamService';
import { ExamConfig } from '../domain/examTypes';
import { PracticeActivity } from '../../learning/domain/types';
import { LearningEngine } from '../../learning/service/LearningEngine';
import { StorageAdapter } from '../../storage';
import { LocalPracticeRepository } from '../../learning/repositories/PracticeRepository';
import { LocalLearningEvidenceRepository } from '../../learning/repositories/LearningEvidenceRepository';
import { LocalMasteryRepository } from '../../learning/repositories/MasteryRepository';
import { LocalReviewRepository } from '../../learning/repositories/ReviewRepository';
import { LocalAcademicTaskRepository } from '../../repositories/academicTaskRepository';
import { LocalReflectionRepository } from '../../repositories/reflectionRepository';

describe('TG24 — Exam Mode Test Suite', () => {
  let mockStorageData: Record<string, any>;
  let mockStorage: StorageAdapter;
  let practiceRepo: LocalPracticeRepository;
  let evidenceRepo: LocalLearningEvidenceRepository;
  let masteryRepo: LocalMasteryRepository;
  let reviewRepo: LocalReviewRepository;
  let reflectionRepo: LocalReflectionRepository;
  let taskRepo: LocalAcademicTaskRepository;
  let learningEngine: LearningEngine;
  let examService: ExamService;

  const mockActivities: PracticeActivity[] = [
    {
      id: 'act-1',
      type: 'MULTIPLE_CHOICE',
      topicId: 'sinergia',
      subjectId: 'ciencias-3',
      prompt: '¿Qué es la sinergia?',
      options: [
        { id: 'opt-a', text: 'Suma de partes', isCorrect: false },
        { id: 'opt-b', text: 'Efecto superior a la suma', isCorrect: true }
      ],
      explanation: 'La sinergia multiplica el impacto.',
      provenance: 'AI_COMPLEMENTARY',
      createdAt: '2026-09-25T08:00:00.000Z'
    },
    {
      id: 'act-2',
      type: 'TRUE_FALSE',
      topicId: 'sinergia',
      subjectId: 'ciencias-3',
      prompt: 'La sinergia es aplicable a equipos de trabajo.',
      options: [
        { id: 'true', text: 'Verdadero', isCorrect: true },
        { id: 'false', text: 'Falso', isCorrect: false }
      ],
      explanation: 'En equipos la coordinación crea sinergia.',
      provenance: 'AI_COMPLEMENTARY',
      createdAt: '2026-09-25T08:00:00.000Z'
    },
    {
      id: 'act-3',
      type: 'SHORT_ANSWER',
      topicId: 'sinergia',
      subjectId: 'ciencias-3',
      prompt: 'Escribe el concepto principal.',
      options: [
        { id: 'opt-sa', text: 'Sinergia', isCorrect: true }
      ],
      explanation: 'El concepto es Sinergia.',
      provenance: 'AI_COMPLEMENTARY',
      createdAt: '2026-09-25T08:00:00.000Z'
    },
    {
      id: 'act-4',
      type: 'OPEN_RESPONSE',
      topicId: 'sinergia',
      subjectId: 'ciencias-3',
      prompt: 'Explica una experiencia de sinergia en tu vida.',
      explanation: 'Expresar ideas propias consolida el aprendizaje.',
      provenance: 'AI_COMPLEMENTARY',
      createdAt: '2026-09-25T08:00:00.000Z'
    }
  ];

  const mockConfig: ExamConfig = {
    id: 'test-exam-01',
    title: 'Examen de Sinergia',
    description: 'Evaluación de prueba para modo examen',
    subjectId: 'ciencias-3',
    subjectName: 'Ciencias Naturales III',
    topicId: 'sinergia',
    topicName: 'Sinergia',
    activityIds: ['act-1', 'act-2', 'act-3', 'act-4'],
    timeLimitMinutes: 15,
    shuffleQuestions: false,
    createdAt: '2026-09-25T08:00:00.000Z'
  };

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
    reflectionRepo = new LocalReflectionRepository(mockStorage);
    taskRepo = new LocalAcademicTaskRepository(mockStorage);

    learningEngine = new LearningEngine({
      practiceRepo,
      evidenceRepo,
      masteryRepo,
      reviewRepo
    });

    examService = new ExamService(learningEngine);
  });

  describe('1. Ciclo de Vida del Dominio y Sesión', () => {
    it('debe crear una sesión en estado READY con respuestas inicializadas', () => {
      const session = examService.createSession(mockConfig);

      expect(session.id).toBeDefined();
      expect(session.examId).toBe(mockConfig.id);
      expect(session.status).toBe('READY');
      expect(session.currentQuestionIndex).toBe(0);
      expect(session.answers).toHaveLength(4);
      expect(session.answers[0].isAnswered).toBe(false);
      expect(session.answers[0].answer).toBeUndefined();
    });

    it('debe iniciar la sesión cambiando el estado a IN_PROGRESS y registrando startedAt', () => {
      const initial = examService.createSession(mockConfig);
      const started = examService.startSession(initial);

      expect(started.status).toBe('IN_PROGRESS');
      expect(started.startedAt).toBeDefined();
    });

    it('debe responder una pregunta y registrar isAnswered como true', () => {
      const initial = examService.createSession(mockConfig);
      const started = examService.startSession(initial);

      const answered = examService.answerQuestion(started, 'act-1', 'opt-b');
      expect(answered.answers[0].isAnswered).toBe(true);
      expect(answered.answers[0].answer).toBe('opt-b');
      expect(answered.answers[0].answeredAt).toBeDefined();
    });

    it('debe permitir cambiar de respuesta sin perder el estado', () => {
      const initial = examService.createSession(mockConfig);
      const started = examService.startSession(initial);

      let updated = examService.answerQuestion(started, 'act-1', 'opt-a');
      expect(updated.answers[0].answer).toBe('opt-a');

      updated = examService.answerQuestion(updated, 'act-1', 'opt-b');
      expect(updated.answers[0].answer).toBe('opt-b');
    });

    it('debe navegar libremente entre preguntas conservando respuestas', () => {
      const initial = examService.createSession(mockConfig);
      let session = examService.startSession(initial);

      // Responder pregunta 0
      session = examService.answerQuestion(session, 'act-1', 'opt-b');
      // Ir a pregunta 2
      session = examService.goToQuestion(session, 2);
      expect(session.currentQuestionIndex).toBe(2);

      // Responder pregunta 2
      session = examService.answerQuestion(session, 'act-3', 'Sinergia');
      expect(session.answers[2].answer).toBe('Sinergia');

      // Volver a pregunta 0
      session = examService.goToQuestion(session, 0);
      expect(session.currentQuestionIndex).toBe(0);
      expect(session.answers[0].answer).toBe('opt-b');
      expect(session.answers[0].isAnswered).toBe(true);
    });

    it('debe pasar al estado REVIEWING y permitir volver a responder', () => {
      const initial = examService.createSession(mockConfig);
      let session = examService.startSession(initial);

      session = examService.goToReview(session);
      expect(session.status).toBe('REVIEWING');

      session = examService.resumeExam(session);
      expect(session.status).toBe('IN_PROGRESS');
    });

    it('debe pasar al estado ABANDONED al abandonar el examen', () => {
      const initial = examService.createSession(mockConfig);
      let session = examService.startSession(initial);
      session = examService.abandonSession(session);

      expect(session.status).toBe('ABANDONED');
    });
  });

  describe('2. Evaluación y Orquestación', () => {
    it('NO debe evaluar ni crear evidencia durante el examen antes de finalizar', () => {
      const initial = examService.createSession(mockConfig);
      let session = examService.startSession(initial);

      session = examService.answerQuestion(session, 'act-1', 'opt-b');
      session = examService.answerQuestion(session, 'act-2', 'Verdadero');

      // Durante el examen, no debe haber evidencia ni intentos en el engine
      const evidence = evidenceRepo.getAll();
      const attempts = practiceRepo.getAttempts();

      expect(evidence).toHaveLength(0);
      expect(attempts).toHaveLength(0);
    });

    it('debe evaluar con PracticeEvaluator al finalizar y registrar intentos en LearningEngine', () => {
      const initial = examService.createSession(mockConfig);
      let session = examService.startSession(initial);

      session = examService.answerQuestion(session, 'act-1', 'opt-b'); // CORRECT
      session = examService.answerQuestion(session, 'act-2', 'Falso'); // INCORRECT
      session = examService.answerQuestion(session, 'act-3', 'Sinergia'); // CORRECT
      session = examService.answerQuestion(session, 'act-4', 'corta'); // UNCLEAR (< 10 caracteres)

      const result = examService.finalizeExam(session, mockActivities);

      expect(result.session.status).toBe('COMPLETED');
      expect(result.session.completedAt).toBeDefined();

      const summary = result.summary;
      expect(summary.totalQuestions).toBe(4);
      expect(summary.answeredCount).toBe(4);
      expect(summary.unansweredCount).toBe(0);
      expect(summary.correctCount).toBe(2); // act-1 and act-3
      expect(summary.reviewCount).toBe(2); // act-2 (incorrect) and act-4 (unclear)

      // Verificación en repositories del LearningEngine
      const attempts = practiceRepo.getAttempts();
      expect(attempts).toHaveLength(4);

      const evidence = evidenceRepo.getAll();
      expect(evidence.length).toBeGreaterThan(0);
      expect(['QUIZ', 'EXERCISE']).toContain(evidence[0].source);
    });

    it('debe manejar preguntas no respondidas como INCORRECT al finalizar', () => {
      const initial = examService.createSession(mockConfig);
      let session = examService.startSession(initial);

      // Solo respondemos la 1
      session = examService.answerQuestion(session, 'act-1', 'opt-b');

      const result = examService.finalizeExam(session, mockActivities);
      const summary = result.summary;

      expect(summary.answeredCount).toBe(1);
      expect(summary.unansweredCount).toBe(3);
      expect(summary.correctCount).toBe(1);
      expect(summary.reviewCount).toBe(3);
    });

    it('debe evaluar respuestas abiertas demasiado breves de forma cualitativa (UNCLEAR) sin inventar IA', () => {
      const initial = examService.createSession(mockConfig);
      let session = examService.startSession(initial);

      session = examService.answerQuestion(session, 'act-4', 'breve');
      const result = examService.finalizeExam(session, mockActivities);

      const openEval = result.summary.evaluations.find((e) => e.activityId === 'act-4');
      expect(openEval).toBeDefined();
      expect(openEval?.result).toBe('UNCLEAR');
      expect(openEval?.isCorrect).toBe(false);
    });
  });

  describe('3. Integración con Mastery y Aislamiento', () => {
    it('al completar el examen debe actualizar el MasteryState a través de LearningEngine', () => {
      const initialMastery = learningEngine.getMastery('sinergia');
      expect(initialMastery.evidenceCount).toBe(0);

      const initial = examService.createSession(mockConfig);
      let session = examService.startSession(initial);

      session = examService.answerQuestion(session, 'act-1', 'opt-b');
      session = examService.answerQuestion(session, 'act-2', 'Verdadero');
      session = examService.answerQuestion(session, 'act-3', 'Sinergia');

      examService.finalizeExam(session, mockActivities);

      const updatedMastery = learningEngine.getMastery('sinergia');
      expect(updatedMastery.evidenceCount).toBeGreaterThan(0);
    });

    it('al ABANDONAR el examen NO debe generar LearningEvidence ni modificar MasteryState', () => {
      const initialMastery = learningEngine.getMastery('sinergia');

      const initial = examService.createSession(mockConfig);
      let session = examService.startSession(initial);

      session = examService.answerQuestion(session, 'act-1', 'opt-b');
      session = examService.answerQuestion(session, 'act-2', 'Verdadero');

      // Abandonar
      examService.abandonSession(session);

      const evidence = evidenceRepo.getAll();
      expect(evidence).toHaveLength(0);

      const attempts = practiceRepo.getAttempts();
      expect(attempts).toHaveLength(0);

      const postMastery = learningEngine.getMastery('sinergia');
      expect(postMastery.evidenceCount).toBe(initialMastery.evidenceCount);
      expect(postMastery.level).toBe(initialMastery.level);
    });

    it('Exam Mode NO debe crear AcademicTasks directamente', () => {
      const initialTasks = taskRepo.getAll();
      expect(initialTasks).toHaveLength(0);

      const initial = examService.createSession(mockConfig);
      let session = examService.startSession(initial);
      session = examService.answerQuestion(session, 'act-1', 'opt-b');
      examService.finalizeExam(session, mockActivities);

      const postTasks = taskRepo.getAll();
      expect(postTasks).toHaveLength(0);
    });

    it('Exam Mode NO debe crear Reflections ni modificar ReflectionRepository', () => {
      const initialReflections = reflectionRepo.getAll();
      expect(initialReflections).toHaveLength(0);

      const initial = examService.createSession(mockConfig);
      let session = examService.startSession(initial);
      session = examService.answerQuestion(session, 'act-1', 'opt-b');
      examService.finalizeExam(session, mockActivities);

      const postReflections = reflectionRepo.getAll();
      expect(postReflections).toHaveLength(0);
    });
  });

  describe('4. Resultados Cualitativos', () => {
    it('el resumen cualitativo NO debe contener porcentajes como calificación escolar ni notas numéricas de reprobado/aprobado', () => {
      const initial = examService.createSession(mockConfig);
      let session = examService.startSession(initial);

      session = examService.answerQuestion(session, 'act-1', 'opt-b');
      const result = examService.finalizeExam(session, mockActivities);

      const summary = result.summary;
      expect(summary.qualitativeFeedback).toBeDefined();
      expect(summary.qualitativeFeedback.length).toBeGreaterThan(10);

      // Confirmar que no hay "Nota: 5/10", "Reprobaste", "Calificación: 50%"
      expect(summary.qualitativeFeedback).not.toMatch(/calificación/i);
      expect(summary.qualitativeFeedback).not.toMatch(/reprob/i);
      expect(summary.qualitativeFeedback).not.toMatch(/gpa/i);
    });
  });
});
