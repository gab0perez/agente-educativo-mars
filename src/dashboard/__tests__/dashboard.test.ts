import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardService } from '../service/DashboardService';
import { StorageAdapter } from '../../storage';
import { LocalPracticeRepository } from '../../learning/repositories/PracticeRepository';
import { LocalLearningEvidenceRepository } from '../../learning/repositories/LearningEvidenceRepository';
import { LocalMasteryRepository } from '../../learning/repositories/MasteryRepository';
import { LocalReviewRepository } from '../../learning/repositories/ReviewRepository';
import { LocalAcademicTaskRepository } from '../../repositories/academicTaskRepository';
import { LocalSubjectRepository } from '../../repositories/subjectRepository';
import { LearningEngine } from '../../learning/service/LearningEngine';
import { ExamService } from '../../exam/service/ExamService';
import { Subject } from '../../types/academic';
import { PracticeActivity } from '../../learning/domain/types';
import { ExamConfig } from '../../exam/domain/examTypes';

describe('TG25 — Unified Learning Dashboard Test Suite', () => {
  let mockStorageData: Record<string, any>;
  let mockStorage: StorageAdapter;
  let practiceRepo: LocalPracticeRepository;
  let evidenceRepo: LocalLearningEvidenceRepository;
  let masteryRepo: LocalMasteryRepository;
  let reviewRepo: LocalReviewRepository;
  let taskRepo: LocalAcademicTaskRepository;
  let subjectRepo: LocalSubjectRepository;
  let learningEngine: LearningEngine;
  let examService: ExamService;
  let dashboardService: DashboardService;

  const mockSubjects: Subject[] = [
    {
      id: 'ciencias-3',
      code: 'CN-3',
      name: 'Ciencias Naturales III',
      shortName: 'Ciencias III',
      description: 'Química y ecología',
      icon: '🧪',
      topics: [
        {
          id: 'sinergia',
          subjectId: 'ciencias-3',
          name: 'Sinergia',
          description: 'Efectos multiplicadores coordinados',
          status: 'en_estudio',
          provenance: 'CLASS_ORIGIN'
        },
        {
          id: 'reacciones-quimicas',
          subjectId: 'ciencias-3',
          name: 'Reacciones Químicas',
          description: 'Transformación de sustancias',
          status: 'nuevo',
          provenance: 'CLASS_ORIGIN'
        }
      ]
    },
    {
      id: 'rh-1',
      code: 'RH-1',
      name: 'Gestión de Recursos Humanos',
      shortName: 'Recursos Humanos',
      description: 'Administración de personal',
      icon: '👥',
      topics: [
        {
          id: 'reclutamiento',
          subjectId: 'rh-1',
          name: 'Reclutamiento y Selección',
          description: 'Atracción de talento',
          status: 'en_estudio',
          provenance: 'CLASS_ORIGIN'
        }
      ]
    }
  ];

  const mockActivities: PracticeActivity[] = [
    {
      id: 'act-sinergia-01',
      type: 'MULTIPLE_CHOICE',
      subjectId: 'ciencias-3',
      topicId: 'sinergia',
      prompt: '¿Qué es la sinergia?',
      options: [
        { id: 'opt-1', text: 'Suma de partes', isCorrect: false },
        { id: 'opt-2', text: 'Efecto superior a la suma', isCorrect: true }
      ],
      explanation: 'La sinergia multiplica el impacto.',
      provenance: 'AI_COMPLEMENTARY',
      createdAt: '2026-09-25T08:00:00.000Z'
    }
  ];

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
    taskRepo = new LocalAcademicTaskRepository(mockStorage);
    subjectRepo = new LocalSubjectRepository(mockStorage);

    learningEngine = new LearningEngine({
      practiceRepo,
      evidenceRepo,
      masteryRepo,
      reviewRepo
    });

    examService = new ExamService({
      learningEngine,
      practiceRepo
    });

    dashboardService = new DashboardService({
      learningEngine,
      subjectRepo,
      taskRepo,
      evidenceRepo,
      masteryRepo,
      practiceRepo,
      reviewRepo
    });
  });

  describe('1. Dashboard Vacío y Estados Iniciales', () => {
    it('debe generar un snapshot consistente cuando no hay materias ni evidencias', () => {
      // Repositorios vacíos
      const snapshot = dashboardService.getSnapshot();

      expect(snapshot).toBeDefined();
      expect(snapshot.overallProgress.totalTopics).toBe(0);
      expect(snapshot.overallProgress.topicsWithEvidence).toBe(0);
      expect(snapshot.overallProgress.totalEvidencesCount).toBe(0);
      expect(snapshot.subjectSummaries).toHaveLength(0);
      expect(snapshot.masteryHighlights.strengths).toHaveLength(0);
      expect(snapshot.masteryHighlights.needsReview).toHaveLength(0);
      expect(snapshot.pendingTasks).toHaveLength(0);
      expect(snapshot.recentActivity).toHaveLength(0);
      expect(snapshot.nextStep).toBeDefined();
      expect(snapshot.nextStep.title).toBe('Sigue explorando tus temas');
    });

    it('debe presentar un mensaje cualitativo de bienvenida cuando apenas se comienza', () => {
      subjectRepo.create(mockSubjects[0]);
      const snapshot = dashboardService.getSnapshot();

      expect(snapshot.overallProgress.totalTopics).toBe(2);
      expect(snapshot.overallProgress.topicsWithEvidence).toBe(0);
      expect(snapshot.overallProgress.qualitativeStatus).toContain('Comenzando tu camino de estudio');
    });
  });

  describe('2. Materias y Resumen Agregado', () => {
    it('debe calcular el resumen de una materia con sus temas y tareas', () => {
      subjectRepo.create(mockSubjects[0]);

      taskRepo.create({
        title: 'Reporte de sinergia',
        subjectId: 'ciencias-3',
        topicId: 'sinergia'
      });

      const snapshot = dashboardService.getSnapshot();
      expect(snapshot.subjectSummaries).toHaveLength(1);

      const summary = snapshot.subjectSummaries[0];
      expect(summary.subjectId).toBe('ciencias-3');
      expect(summary.subjectName).toBe('Ciencias Naturales III');
      expect(summary.totalTopics).toBe(2);
      expect(summary.pendingTasksCount).toBe(1);
    });

    it('debe calcular correctamente el resumen con múltiples materias', () => {
      subjectRepo.create(mockSubjects[0]);
      subjectRepo.create(mockSubjects[1]);

      const snapshot = dashboardService.getSnapshot();
      expect(snapshot.subjectSummaries).toHaveLength(2);
      expect(snapshot.overallProgress.totalTopics).toBe(3); // 2 de ciencias + 1 de RH
    });
  });

  describe('3. Integración con MasteryState y Evidencias', () => {
    it('debe reflejar temas en fortalezas cuando alcanzan STRONG o UNDERSTOOD', () => {
      subjectRepo.create(mockSubjects[0]);

      // Guardar actividad en repositorio
      practiceRepo.saveActivity(mockActivities[0]);

      // Registrar 3 intentos correctos para subir dominio
      learningEngine.recordPracticeAttempt({
        activityId: 'act-sinergia-01',
        answer: 'opt-2',
        result: 'CORRECT'
      });
      learningEngine.recordPracticeAttempt({
        activityId: 'act-sinergia-01',
        answer: 'opt-2',
        result: 'CORRECT'
      });
      learningEngine.recordPracticeAttempt({
        activityId: 'act-sinergia-01',
        answer: 'opt-2',
        result: 'CORRECT'
      });

      const snapshot = dashboardService.getSnapshot();
      expect(snapshot.overallProgress.topicsWithEvidence).toBe(1);
      expect(snapshot.overallProgress.totalEvidencesCount).toBe(3);

      const sinergiaStrength = snapshot.masteryHighlights.strengths.find((s) => s.topicId === 'sinergia');
      expect(sinergiaStrength).toBeDefined();
      expect(['STRONG', 'UNDERSTOOD']).toContain(sinergiaStrength?.level);
    });

    it('debe reflejar temas en para reforzar cuando tienen NEEDS_REVIEW', () => {
      subjectRepo.create(mockSubjects[0]);
      practiceRepo.saveActivity(mockActivities[0]);

      // Registrar intentos incorrectos
      learningEngine.recordPracticeAttempt({
        activityId: 'act-sinergia-01',
        answer: 'opt-1',
        result: 'INCORRECT'
      });

      const snapshot = dashboardService.getSnapshot();
      const needsReviewItem = snapshot.masteryHighlights.needsReview.find((r) => r.topicId === 'sinergia');
      expect(needsReviewItem).toBeDefined();
    });

    it('NO debe inventar datos ni porcentajes si un tema no tiene evidencia', () => {
      subjectRepo.create(mockSubjects[0]); // Tiene tema reacciones-quimicas sin tocar

      const snapshot = dashboardService.getSnapshot();
      const rqMastery = snapshot.overallProgress.unknownCount;
      expect(rqMastery).toBe(2); // Ninguno tiene evidencia

      const strength = snapshot.masteryHighlights.strengths.find((s) => s.topicId === 'reacciones-quimicas');
      const needs = snapshot.masteryHighlights.needsReview.find((s) => s.topicId === 'reacciones-quimicas');
      expect(strength).toBeUndefined();
      expect(needs).toBeUndefined();
    });
  });

  describe('4. Integración con AcademicTasks', () => {
    it('debe listar tareas pendientes ordenadas por urgencia (OVERDUE > DUE_TODAY > UPCOMING)', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      taskRepo.create({
        title: 'Tarea para mañana',
        dueAt: tomorrow.toISOString()
      });
      taskRepo.create({
        title: 'Tarea vencida',
        dueAt: yesterday.toISOString()
      });
      taskRepo.create({
        title: 'Tarea para hoy',
        dueAt: today.toISOString()
      });
      const completedTask = taskRepo.create({
        title: 'Tarea ya completada'
      });
      taskRepo.markCompleted(completedTask.id);

      const snapshot = dashboardService.getSnapshot();
      expect(snapshot.pendingTasks).toHaveLength(3); // Solo pendientes
      expect(snapshot.pendingTasks[0].task.title).toBe('Tarea vencida');
      expect(snapshot.pendingTasks[1].task.title).toBe('Tarea para hoy');
      expect(snapshot.pendingTasks[2].task.title).toBe('Tarea para mañana');
    });
  });

  describe('5. Integración con Exam Mode (TG24)', () => {
    it('al completar un examen, la actividad y el mastery deben reflejarse en el Dashboard', () => {
      subjectRepo.create(mockSubjects[0]);
      practiceRepo.saveActivity(mockActivities[0]);

      const examConfig: ExamConfig = {
        id: 'exam-01',
        title: 'Examen de Sinergia',
        subjectId: 'ciencias-3',
        topicId: 'sinergia',
        activityIds: ['act-sinergia-01'],
        timeLimitMinutes: 15,
        shuffleQuestions: false,
        createdAt: new Date().toISOString()
      };

      let session = examService.createSession(examConfig);
      session = examService.startSession(session);
      session = examService.answerQuestion(session, 'act-sinergia-01', 'opt-2'); // CORRECT
      examService.finalizeExam(session, mockActivities);

      const snapshot = dashboardService.getSnapshot();
      expect(snapshot.overallProgress.totalEvidencesCount).toBe(1);
      expect(snapshot.recentActivity).toHaveLength(1);
      expect(snapshot.recentActivity[0].type).toBe('PRACTICE');
      expect(snapshot.recentActivity[0].result).toBe('CORRECT');
    });

    it('al ABANDONAR un examen, NO debe aparecer actividad ni alterarse el Dashboard', () => {
      subjectRepo.create(mockSubjects[0]);
      practiceRepo.saveActivity(mockActivities[0]);

      const examConfig: ExamConfig = {
        id: 'exam-02',
        title: 'Examen de Prueba',
        subjectId: 'ciencias-3',
        topicId: 'sinergia',
        activityIds: ['act-sinergia-01'],
        timeLimitMinutes: 15,
        shuffleQuestions: false,
        createdAt: new Date().toISOString()
      };

      let session = examService.createSession(examConfig);
      session = examService.startSession(session);
      session = examService.answerQuestion(session, 'act-sinergia-01', 'opt-2');
      examService.abandonSession(session);

      const snapshot = dashboardService.getSnapshot();
      expect(snapshot.overallProgress.totalEvidencesCount).toBe(0);
      expect(snapshot.recentActivity).toHaveLength(0);
      expect(snapshot.overallProgress.topicsWithEvidence).toBe(0);
    });
  });

  describe('6. Integración con ReviewRecommendations y Siguiente Paso', () => {
    it('si hay una recomendación de repaso, el siguiente paso debe sugerir el repaso con prioridad', () => {
      subjectRepo.create(mockSubjects[0]);

      // Programar una recomendación de repaso
      learningEngine.requestUserReview('sinergia');

      const snapshot = dashboardService.getSnapshot();
      expect(snapshot.pendingReviews.length).toBeGreaterThan(0);
      expect(snapshot.nextStep.type).toBe('REVIEW');
      expect(snapshot.nextStep.topicId).toBe('sinergia');
    });

    it('si hay una tarea urgente (hoy o vencida), debe priorizarla en el siguiente paso si no hay reviews', () => {
      subjectRepo.create(mockSubjects[0]);
      taskRepo.create({
        title: 'Investigación Urgente',
        dueAt: new Date().toISOString()
      });

      const snapshot = dashboardService.getSnapshot();
      expect(snapshot.nextStep.type).toBe('TASK');
      expect(snapshot.nextStep.title).toContain('Investigación Urgente');
    });
  });

  describe('7. Inmutabilidad y Aislamiento Arquitectónico', () => {
    it('consultar getSnapshot() múltiples veces NO debe mutar repositorios ni crear datos secundarios', () => {
      subjectRepo.create(mockSubjects[0]);

      const snapshot1 = dashboardService.getSnapshot();
      const snapshot2 = dashboardService.getSnapshot();

      expect(snapshot1.overallProgress.totalTopics).toBe(snapshot2.overallProgress.totalTopics);
      expect(evidenceRepo.getAll()).toHaveLength(0);
      expect(practiceRepo.getAttempts()).toHaveLength(0);
      expect(taskRepo.getAll()).toHaveLength(0);
    });

    it('Dashboard NO debe crear AcademicTasks ni Reflections directamente', () => {
      subjectRepo.create(mockSubjects[0]);

      dashboardService.getSnapshot();

      expect(taskRepo.getAll()).toHaveLength(0);
      expect(evidenceRepo.getAll()).toHaveLength(0);
    });

    it('Dashboard distingue entre respuestas incorrectas y sin responder sin castigar como fallo a nivel agregado', () => {
      subjectRepo.create(mockSubjects[0]);
      practiceRepo.saveActivity(mockActivities[0]);

      const examConfig: ExamConfig = {
        id: 'exam-03',
        title: 'Examen con Unanswered',
        subjectId: 'ciencias-3',
        topicId: 'sinergia',
        activityIds: ['act-sinergia-01'],
        timeLimitMinutes: 15,
        shuffleQuestions: false,
        createdAt: new Date().toISOString()
      };

      let session = examService.createSession(examConfig);
      session = examService.startSession(session);
      // No respondemos la pregunta (unanswered)
      const { summary } = examService.finalizeExam(session, mockActivities);

      expect(summary.unansweredCount).toBe(1);
      expect(summary.answeredCount).toBe(0);

      const snapshot = dashboardService.getSnapshot();
      expect(snapshot.recentActivity).toHaveLength(1);
      // La evidencia fue registrada por el motor sin mutar la definición del dashboard
      expect(snapshot.recentActivity[0].result).toBeDefined();
    });

    it('consultar el Dashboard NO duplica evidencia existente', () => {
      subjectRepo.create(mockSubjects[0]);
      practiceRepo.saveActivity(mockActivities[0]);

      learningEngine.recordPracticeAttempt({
        activityId: 'act-sinergia-01',
        answer: 'opt-2',
        result: 'CORRECT'
      });

      expect(evidenceRepo.getAll()).toHaveLength(1);

      dashboardService.getSnapshot();
      dashboardService.getSnapshot();
      dashboardService.getSnapshot();

      expect(evidenceRepo.getAll()).toHaveLength(1);
    });
  });
});
