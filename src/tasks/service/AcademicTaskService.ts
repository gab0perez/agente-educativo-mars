import {
  AcademicTask,
  CreateTaskInput,
  UpdateTaskInput,
  getTaskUrgency
} from '../../types/task';
import {
  IAcademicTaskRepository,
  academicTaskRepository as defaultTaskRepo
} from '../../repositories/academicTaskRepository';
import {
  SubjectRepository,
  subjectRepository as defaultSubjectRepo
} from '../../repositories/subjectRepository';

export interface AcademicTaskServiceDependencies {
  taskRepo?: IAcademicTaskRepository;
  subjectRepo?: SubjectRepository;
}

export class AcademicTaskService {
  private taskRepo: IAcademicTaskRepository;
  private subjectRepo: SubjectRepository;

  constructor(dependencies: AcademicTaskServiceDependencies = {}) {
    this.taskRepo = dependencies.taskRepo || defaultTaskRepo;
    this.subjectRepo = dependencies.subjectRepo || defaultSubjectRepo;
  }

  /**
   * Valida y resuelve los nombres de materia y tema a partir del contexto académico local
   */
  private resolveAcademicContext(
    subjectId?: string,
    topicId?: string
  ): { subjectName?: string; topicName?: string } {
    let subjectName: string | undefined;
    let topicName: string | undefined;

    if (subjectId) {
      const subject = this.subjectRepo.getById(subjectId);
      if (!subject) {
        throw new Error(`La materia con ID "${subjectId}" no existe.`);
      }
      subjectName = subject.shortName || subject.name;

      if (topicId) {
        const topic = subject.topics.find((t) => t.id === topicId);
        if (!topic) {
          throw new Error(
            `El tema con ID "${topicId}" no pertenece a la materia "${subject.name}".`
          );
        }
        topicName = topic.name;
      }
    } else if (topicId) {
      // Si se pasa un topicId sin subjectId, buscar en todas las materias
      const allSubjects = this.subjectRepo.getAll();
      const subject = allSubjects.find((s) =>
        s.topics.some((t) => t.id === topicId)
      );
      if (!subject) {
        throw new Error(`El tema con ID "${topicId}" no fue encontrado.`);
      }
      subjectName = subject.shortName || subject.name;
      const topic = subject.topics.find((t) => t.id === topicId);
      topicName = topic?.name;
    }

    return { subjectName, topicName };
  }

  createTask(input: CreateTaskInput): AcademicTask {
    const { subjectName, topicName } = this.resolveAcademicContext(
      input.subjectId,
      input.topicId
    );

    return this.taskRepo.create({
      ...input,
      subjectName: subjectName || input.subjectName,
      topicName: topicName || input.topicName
    });
  }

  updateTask(id: string, updates: UpdateTaskInput): AcademicTask | null {
    let subjectName = updates.subjectName;
    let topicName = updates.topicName;

    if (updates.subjectId !== undefined || updates.topicId !== undefined) {
      const current = this.taskRepo.getById(id);
      const targetSubjectId =
        updates.subjectId !== undefined ? updates.subjectId : current?.subjectId;
      const targetTopicId =
        updates.topicId !== undefined ? updates.topicId : current?.topicId;

      if (targetSubjectId || targetTopicId) {
        const resolved = this.resolveAcademicContext(
          targetSubjectId || undefined,
          targetTopicId || undefined
        );
        subjectName = resolved.subjectName;
        topicName = resolved.topicName;
      }
    }

    return this.taskRepo.update(id, {
      ...updates,
      subjectName,
      topicName
    });
  }

  completeTask(id: string): AcademicTask | null {
    return this.taskRepo.markCompleted(id);
  }

  reopenTask(id: string): AcademicTask | null {
    return this.taskRepo.markPending(id);
  }

  deleteTask(id: string): boolean {
    return this.taskRepo.delete(id);
  }

  getTaskById(id: string): AcademicTask | null {
    return this.taskRepo.getById(id);
  }

  /**
   * Obtiene las tareas ordenadas determinísticamente por urgencia y fecha
   */
  getSortedTasks(
    filter: 'ALL' | 'PENDING' | 'COMPLETED' = 'ALL',
    options: { subjectId?: string; topicId?: string; referenceDate?: Date } = {}
  ): AcademicTask[] {
    let list = this.taskRepo.getAll();

    if (filter === 'PENDING') {
      list = list.filter((t) => t.status === 'PENDING');
    } else if (filter === 'COMPLETED') {
      list = list.filter((t) => t.status === 'COMPLETED');
    }

    if (options.subjectId) {
      list = list.filter((t) => t.subjectId === options.subjectId);
    }
    if (options.topicId) {
      list = list.filter((t) => t.topicId === options.topicId);
    }

    const refDate = options.referenceDate || new Date();

    return list.sort((a, b) => {
      // 1. Completadas al final en orden descendente de completado
      if (a.status === 'COMPLETED' && b.status === 'COMPLETED') {
        const timeA = new Date(a.completedAt || a.updatedAt).getTime();
        const timeB = new Date(b.completedAt || b.updatedAt).getTime();
        return timeB - timeA;
      }
      if (a.status === 'COMPLETED') return 1;
      if (b.status === 'COMPLETED') return -1;

      // 2. Para tareas PENDING: comparar urgencias
      const urgencyA = getTaskUrgency(a, refDate);
      const urgencyB = getTaskUrgency(b, refDate);

      const urgencyWeight: Record<string, number> = {
        OVERDUE: 1,
        DUE_TODAY: 2,
        UPCOMING: 3,
        NO_DUE_DATE: 4
      };

      const weightA = urgencyWeight[urgencyA] || 5;
      const weightB = urgencyWeight[urgencyB] || 5;

      if (weightA !== weightB) {
        return weightA - weightB;
      }

      // Si tienen fecha, ordenar por dueAt ascendente
      if (a.dueAt && b.dueAt) {
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }

      // Si no tienen fecha, ordenar por createdAt descendente
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
}

export const academicTaskService = new AcademicTaskService();
