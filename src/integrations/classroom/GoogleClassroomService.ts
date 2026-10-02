/**
 * Servicio Cliente de Google Classroom (Frontend)
 * MAR - Agente Educativo (Solo Lectura y Sincronización Real con Backend)
 * 
 * Invoca las rutas seguras del backend (/api/classroom/*) sin almacenar tokens en el navegador.
 */

import {
  ClassroomCourse,
  ClassroomCourseWork,
  ClassroomConnectionStatus,
  ClassroomSyncSummary
} from '../../types/classroom';
import { Subject } from '../../types/academic';
import { IAcademicTaskRepository, academicTaskRepository as defaultTaskRepo } from '../../repositories/academicTaskRepository';
import { SubjectRepository, subjectRepository as defaultSubjectRepo } from '../../repositories/subjectRepository';

export interface ClassroomServiceConfig {
  taskRepository?: IAcademicTaskRepository;
  subjectRepository?: SubjectRepository;
}

export class GoogleClassroomService {
  private taskRepo: IAcademicTaskRepository;
  private subjectRepo: SubjectRepository;

  constructor(config: ClassroomServiceConfig = {}) {
    this.taskRepo = config.taskRepository || defaultTaskRepo;
    this.subjectRepo = config.subjectRepository || defaultSubjectRepo;
  }

  /**
   * Obtiene la URL oficial de Google OAuth para redirigir a la estudiante
   */
  async getAuthUrl(): Promise<string> {
    let res = await fetch('/api/classroom?action=auth');
    if (!res.ok) {
      res = await fetch('/api/auth/google-classroom');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'No se pudo iniciar la autenticación con Google.');
    }
    const data = await res.json();
    return data.url;
  }

  /**
   * Consulta el estado de conexión actual desde el backend (sin tokens)
   */
  async getStatus(): Promise<ClassroomConnectionStatus> {
    try {
      let res = await fetch('/api/classroom?action=status');
      if (!res.ok) {
        res = await fetch('/api/classroom/status');
      }
      if (!res.ok) {
        return { isConnected: false };
      }
      return await res.json();
    } catch {
      return { isConnected: false };
    }
  }

  /**
   * Ejecuta la sincronización real con Google Classroom API
   */
  async syncNow(): Promise<ClassroomSyncSummary> {
    let res = await fetch('/api/classroom?action=sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      res = await fetch('/api/classroom/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al sincronizar con Google Classroom.');
    }

    const data: {
      courses: ClassroomCourse[];
      allCourseWork: Array<{ courseId: string; courseWork: ClassroomCourseWork[] }>;
      syncedAt: string;
    } = await res.json();

    let tasksCreated = 0;
    let tasksUpdated = 0;

    // 1. Mapear y guardar cursos reales como Subjects
    for (const course of data.courses) {
      const subject: Subject = {
        id: `gc-${course.id}`,
        code: course.section || `GC-${course.id.slice(-4)}`,
        name: course.name,
        shortName: course.name,
        description: course.descriptionHeading || `Curso sincronizado de Google Classroom`,
        icon: '📚',
        topics: [],
        origin: 'GOOGLE_CLASSROOM',
        externalId: course.id
      };
      this.subjectRepo.upsertClassroomSubject(subject);
    }

    // 2. Mapear y guardar tareas reales de cada curso
    for (const group of data.allCourseWork) {
      const course = data.courses.find((c) => c.id === group.courseId);
      const courseName = course ? course.name : 'Google Classroom';
      const subjectId = course ? `gc-${course.id}` : undefined;

      for (const work of group.courseWork) {
        const dueAt = this.formatDueDateTime(work.dueDate, work.dueTime);

        const result = this.taskRepo.upsertClassroomTask({
          title: work.title,
          description: work.description || undefined,
          subjectId,
          subjectName: courseName,
          dueAt,
          origin: 'GOOGLE_CLASSROOM',
          classroomMetadata: {
            courseId: group.courseId,
            courseWorkId: work.id,
            alternateLink: work.alternateLink,
            maxPoints: work.maxPoints,
            lastSyncedAt: data.syncedAt
          }
        });

        if (result.isNew) {
          tasksCreated++;
        } else {
          tasksUpdated++;
        }
      }
    }

    return {
      coursesSynced: data.courses.length,
      tasksCreated,
      tasksUpdated,
      syncedAt: data.syncedAt
    };
  }

  /**
   * Desconecta la cuenta y limpia la sesión en el backend
   */
  async disconnect(): Promise<boolean> {
    let res = await fetch('/api/classroom?action=disconnect', { method: 'POST' });
    if (!res.ok) {
      res = await fetch('/api/classroom/disconnect', { method: 'POST' });
    }
    if (!res.ok) {
      throw new Error('Error al desconectar la cuenta de Google Classroom.');
    }
    const data = await res.json();
    return data.success;
  }

  /**
   * Formatea la fecha y hora devuelta por la API de Classroom a formato ISO
   */
  private formatDueDateTime(
    dueDate?: { year?: number; month?: number; day?: number },
    dueTime?: { hours?: number; minutes?: number; seconds?: number }
  ): string | undefined {
    if (!dueDate || !dueDate.year || !dueDate.month || !dueDate.day) {
      return undefined;
    }

    const year = dueDate.year;
    const month = String(dueDate.month).padStart(2, '0');
    const day = String(dueDate.day).padStart(2, '0');

    const hours = dueTime && dueTime.hours !== undefined ? String(dueTime.hours).padStart(2, '0') : '23';
    const minutes = dueTime && dueTime.minutes !== undefined ? String(dueTime.minutes).padStart(2, '0') : '59';
    const seconds = dueTime && dueTime.seconds !== undefined ? String(dueTime.seconds).padStart(2, '0') : '59';

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
  }
}

export const googleClassroomService = new GoogleClassroomService();
