import { describe, it, expect, beforeEach } from 'vitest';
import { LocalAcademicTaskRepository } from '../../repositories/academicTaskRepository';
import { AcademicTaskService } from '../service/AcademicTaskService';
import { LocalSubjectRepository } from '../../repositories/subjectRepository';
import { StorageAdapter } from '../../storage';
import { getTaskUrgency, formatTaskDueDate, AcademicTask } from '../../types/task';
import { LearningEngine } from '../../learning/service/LearningEngine';
import { LocalLearningEvidenceRepository } from '../../learning/repositories/LearningEvidenceRepository';
import { LocalMasteryRepository } from '../../learning/repositories/MasteryRepository';
import { LocalReviewRepository } from '../../learning/repositories/ReviewRepository';

describe('TG23 — Academic Tasks Unit, Domain & Isolation Tests', () => {
  let mockStorageData: Record<string, any>;
  let mockStorage: StorageAdapter;
  let taskRepo: LocalAcademicTaskRepository;
  let subjectRepo: LocalSubjectRepository;
  let taskService: AcademicTaskService;

  // Learning Engine para pruebas de aislamiento
  let evidenceRepo: LocalLearningEvidenceRepository;
  let masteryRepo: LocalMasteryRepository;
  let reviewRepo: LocalReviewRepository;
  let learningEngine: LearningEngine;

  const sampleSubjects = [
    {
      id: 'ciencias-3',
      code: 'CN-3',
      name: 'Ciencias Naturales III',
      shortName: 'Ciencias III',
      description: 'Química y medio ambiente',
      icon: '🧪',
      topics: [
        {
          id: 'sinergia',
          subjectId: 'ciencias-3',
          name: 'Sinergia',
          description: 'Efectos combinados',
          status: 'en_estudio' as const,
          provenance: 'CLASS_ORIGIN' as const
        }
      ]
    },
    {
      id: 'rh-1',
      code: 'RH-101',
      name: 'Gestión de Recursos Humanos',
      shortName: 'Recursos Humanos',
      description: 'Procesos de talento humano',
      icon: '👥',
      topics: [
        {
          id: 'induccion',
          subjectId: 'rh-1',
          name: 'Inducción de Personal',
          description: 'Integración',
          status: 'nuevo' as const,
          provenance: 'CLASS_ORIGIN' as const
        }
      ]
    }
  ];

  beforeEach(() => {
    mockStorageData = {};
    mockStorage = {
      getItem: <T>(key: string): T | null =>
        mockStorageData[key] !== undefined ? mockStorageData[key] : null,
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

    taskRepo = new LocalAcademicTaskRepository(mockStorage);
    subjectRepo = new LocalSubjectRepository(mockStorage);
    subjectRepo.saveAll(sampleSubjects);

    taskService = new AcademicTaskService({
      taskRepo,
      subjectRepo
    });

    evidenceRepo = new LocalLearningEvidenceRepository(mockStorage);
    masteryRepo = new LocalMasteryRepository(mockStorage);
    reviewRepo = new LocalReviewRepository(mockStorage);
    learningEngine = new LearningEngine({
      evidenceRepo,
      masteryRepo,
      reviewRepo
    });
  });

  describe('1. Creación y Validación de Tareas', () => {
    it('Crea una tarea válida con estado PENDING y timestamps adecuados', () => {
      const task = taskService.createTask({
        title: 'Investigación de química',
        description: 'Buscar ejemplos de sinergia'
      });

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Investigación de química');
      expect(task.description).toBe('Buscar ejemplos de sinergia');
      expect(task.status).toBe('PENDING');
      expect(task.createdAt).toBeDefined();
      expect(task.updatedAt).toBeDefined();
      expect(task.completedAt).toBeUndefined();
    });

    it('Rechaza crear tareas con título vacío o solo espacios', () => {
      expect(() => {
        taskService.createTask({ title: '   ' });
      }).toThrow('El título de la tarea académica es obligatorio.');
    });

    it('Permite crear tareas sin materia ni tema (ej. "Comprar libreta")', () => {
      const task = taskService.createTask({
        title: 'Comprar libreta de cuadros'
      });

      expect(task.subjectId).toBeUndefined();
      expect(task.topicId).toBeUndefined();
      expect(task.title).toBe('Comprar libreta de cuadros');
    });

    it('Resuelve automáticamente nombres de materia y tema cuando son válidos', () => {
      const task = taskService.createTask({
        title: 'Ejercicios de sinergia',
        subjectId: 'ciencias-3',
        topicId: 'sinergia'
      });

      expect(task.subjectName).toBe('Ciencias III');
      expect(task.topicName).toBe('Sinergia');
    });

    it('Rechaza materias inexistentes', () => {
      expect(() => {
        taskService.createTask({
          title: 'Tarea inválida',
          subjectId: 'materia-no-existe'
        });
      }).toThrow('La materia con ID "materia-no-existe" no existe.');
    });

    it('Rechaza temas que no pertenecen a la materia indicada', () => {
      expect(() => {
        taskService.createTask({
          title: 'Tarea inconsistente',
          subjectId: 'ciencias-3',
          topicId: 'induccion' // pertenece a rh-1, no a ciencias-3
        });
      }).toThrow('El tema con ID "induccion" no pertenece a la materia "Ciencias Naturales III".');
    });
  });

  describe('2. Ciclo de Vida: Completar, Reabrir, Actualizar y Eliminar', () => {
    it('Completar una tarea establece status COMPLETED y completedAt', () => {
      const task = taskService.createTask({ title: 'Tarea de prueba' });
      expect(task.status).toBe('PENDING');

      const completed = taskService.completeTask(task.id);
      expect(completed?.status).toBe('COMPLETED');
      expect(completed?.completedAt).toBeDefined();

      const retrieved = taskService.getTaskById(task.id);
      expect(retrieved?.status).toBe('COMPLETED');
      expect(retrieved?.completedAt).toBeDefined();
    });

    it('Reabrir una tarea completada la devuelve a PENDING y elimina completedAt', () => {
      const task = taskService.createTask({ title: 'Tarea a reabrir' });
      taskService.completeTask(task.id);

      const reopened = taskService.reopenTask(task.id);
      expect(reopened?.status).toBe('PENDING');
      expect(reopened?.completedAt).toBeUndefined();
    });

    it('Actualiza campos de una tarea existente preservando integridad', () => {
      const task = taskService.createTask({ title: 'Título original' });

      const updated = taskService.updateTask(task.id, {
        title: 'Título corregido',
        description: 'Nueva descripción',
        subjectId: 'rh-1',
        topicId: 'induccion'
      });

      expect(updated?.title).toBe('Título corregido');
      expect(updated?.description).toBe('Nueva descripción');
      expect(updated?.subjectName).toBe('Recursos Humanos');
      expect(updated?.topicName).toBe('Inducción de Personal');
    });

    it('Elimina una tarea correctamente', () => {
      const task = taskService.createTask({ title: 'Tarea a eliminar' });
      expect(taskService.getTaskById(task.id)).toBeDefined();

      const deleted = taskService.deleteTask(task.id);
      expect(deleted).toBe(true);
      expect(taskService.getTaskById(task.id)).toBeNull();
    });
  });

  describe('3. Reglas de Fechas y Urgencia', () => {
    const today = new Date(2026, 8, 25, 12, 0, 0); // 25 Sep 2026

    it('Tarea sin dueAt se clasifica como NO_DUE_DATE', () => {
      const task: AcademicTask = {
        id: 't-1',
        title: 'Sin fecha',
        status: 'PENDING',
        createdAt: today.toISOString(),
        updatedAt: today.toISOString()
      };

      expect(getTaskUrgency(task, today)).toBe('NO_DUE_DATE');
      expect(formatTaskDueDate(task.dueAt, today)).toBe('Sin fecha de entrega');
    });

    it('Tarea para hoy se clasifica como DUE_TODAY ("Entrega: hoy")', () => {
      const task: AcademicTask = {
        id: 't-2',
        title: 'Para hoy',
        dueAt: '2026-09-25T23:59:59.000Z',
        status: 'PENDING',
        createdAt: today.toISOString(),
        updatedAt: today.toISOString()
      };

      expect(getTaskUrgency(task, today)).toBe('DUE_TODAY');
      expect(formatTaskDueDate(task.dueAt, today)).toBe('Entrega: hoy');
    });

    it('Tarea para mañana se clasifica como UPCOMING ("Entrega: mañana")', () => {
      const task: AcademicTask = {
        id: 't-3',
        title: 'Para mañana',
        dueAt: '2026-09-26T23:59:59.000Z',
        status: 'PENDING',
        createdAt: today.toISOString(),
        updatedAt: today.toISOString()
      };

      expect(getTaskUrgency(task, today)).toBe('UPCOMING');
      expect(formatTaskDueDate(task.dueAt, today)).toBe('Entrega: mañana');
    });

    it('Tarea con fecha pasada pendiente se clasifica como OVERDUE ("Vencida")', () => {
      const task: AcademicTask = {
        id: 't-4',
        title: 'Atrasada',
        dueAt: '2026-09-20T23:59:59.000Z',
        status: 'PENDING',
        createdAt: today.toISOString(),
        updatedAt: today.toISOString()
      };

      expect(getTaskUrgency(task, today)).toBe('OVERDUE');
      expect(formatTaskDueDate(task.dueAt, today)).toContain('Vencida');
    });

    it('Tarea COMPLETADA con fecha pasada NUNCA se muestra como vencida (COMPLETED)', () => {
      const task: AcademicTask = {
        id: 't-5',
        title: 'Completada a tiempo',
        dueAt: '2026-09-20T23:59:59.000Z',
        status: 'COMPLETED',
        completedAt: '2026-09-20T18:00:00.000Z',
        createdAt: today.toISOString(),
        updatedAt: today.toISOString()
      };

      expect(getTaskUrgency(task, today)).toBe('COMPLETED');
    });
  });

  describe('4. Ordenamiento Determinista de Tareas', () => {
    const today = new Date(2026, 8, 25, 12, 0, 0);

    it('Ordena tareas pendientes priorizando: Vencidas -> Hoy -> Próximas -> Sin fecha', () => {
      taskService.createTask({ title: 'Sin fecha 1' });
      taskService.createTask({
        title: 'Para mañana',
        dueAt: '2026-09-26T23:59:59.000Z'
      });
      taskService.createTask({
        title: 'Vencida',
        dueAt: '2026-09-22T23:59:59.000Z'
      });
      taskService.createTask({
        title: 'Para hoy',
        dueAt: '2026-09-25T23:59:59.000Z'
      });

      const sorted = taskService.getSortedTasks('PENDING', { referenceDate: today });
      expect(sorted[0].title).toBe('Vencida');
      expect(sorted[1].title).toBe('Para hoy');
      expect(sorted[2].title).toBe('Para mañana');
      expect(sorted[3].title).toBe('Sin fecha 1');
    });
  });

  describe('5. Persistencia y Recarga', () => {
    it('Persiste tareas en el storage y las recupera tras instanciar un nuevo repositorio', () => {
      taskService.createTask({
        title: 'Tarea persistente',
        subjectId: 'ciencias-3',
        topicId: 'sinergia',
        dueAt: '2026-09-30T23:59:59.000Z'
      });

      const newRepo = new LocalAcademicTaskRepository(mockStorage);
      const tasks = newRepo.getAll();

      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Tarea persistente');
      expect(tasks[0].subjectName).toBe('Ciencias III');
      expect(tasks[0].topicName).toBe('Sinergia');
    });
  });

  describe('6. Aislamiento Estricto: AcademicTask ≠ LearningEvidence / MasteryState / ReviewItem', () => {
    it('Crear una tarea NO genera LearningEvidence ni modifica MasteryState ni ReviewItem', () => {
      // Estado inicial
      expect(evidenceRepo.getAll().length).toBe(0);
      expect(reviewRepo.getAll().length).toBe(0);

      // Crear tarea académica
      taskService.createTask({
        title: 'Investigación de química',
        subjectId: 'ciencias-3',
        topicId: 'sinergia',
        dueAt: '2026-09-28T23:59:59.000Z'
      });

      // Se verifica que la capa de aprendizaje permanezca intacta
      expect(evidenceRepo.getAll().length).toBe(0);
      expect(evidenceRepo.getByTopicId('sinergia').length).toBe(0);
      expect(reviewRepo.getPending().length).toBe(0);
    });

    it('Completar una tarea académica NO genera LearningEvidence ni altera MasteryState', () => {
      const task = taskService.createTask({
        title: 'Estudiar sinergia para examen',
        subjectId: 'ciencias-3',
        topicId: 'sinergia'
      });

      taskService.completeTask(task.id);

      // Sigue sin existir evidencia generada artificialmente
      expect(evidenceRepo.getAll().length).toBe(0);
      const mastery = learningEngine.getMastery('sinergia');
      expect(mastery.evidenceCount).toBe(0);
      expect(mastery.level).toBe('UNKNOWN');
    });

    it('Eliminar una tarea no altera materias, temas ni evidencias', () => {
      const task = taskService.createTask({
        title: 'Tarea desechable',
        subjectId: 'ciencias-3',
        topicId: 'sinergia'
      });

      taskService.deleteTask(task.id);

      // Las entidades académicas permanecen intactas
      expect(subjectRepo.getAll().length).toBe(2);
      expect(subjectRepo.getById('ciencias-3')?.topics.length).toBe(1);
    });
  });
});
