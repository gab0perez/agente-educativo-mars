/**
 * Tipos de dominio fundamentales para Tareas Académicas (TG23)
 * Mantiene estricta separación con LearningEvidence, MasteryState y ReviewItem.
 */

export type TaskStatus = 'PENDING' | 'COMPLETED';

export type TaskUrgency = 'NO_DUE_DATE' | 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE' | 'COMPLETED';

export interface AcademicTask {
  id: string;
  title: string;
  description?: string;

  // Contexto académico opcional
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;

  // Fecha de entrega en formato ISO (ej. 2026-09-26 o 2026-09-26T23:59:59.000Z)
  dueAt?: string;

  // Estado explícito
  status: TaskStatus;

  // Auditoría y persistencia
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
  dueAt?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  subjectId?: string | null;
  subjectName?: string | null;
  topicId?: string | null;
  topicName?: string | null;
  dueAt?: string | null;
  status?: TaskStatus;
}

/**
 * Determina la urgencia derivada de la tarea según su fecha y estado
 */
export function getTaskUrgency(task: AcademicTask, referenceDate: Date = new Date()): TaskUrgency {
  if (task.status === 'COMPLETED') {
    return 'COMPLETED';
  }
  if (!task.dueAt) {
    return 'NO_DUE_DATE';
  }

  const dueDate = new Date(task.dueAt);
  if (isNaN(dueDate.getTime())) {
    return 'NO_DUE_DATE';
  }

  const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffDays = Math.round((due.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'OVERDUE';
  }
  if (diffDays === 0) {
    return 'DUE_TODAY';
  }
  return 'UPCOMING';
}

/**
 * Formatea de manera comprensible y accesible la fecha de entrega
 */
export function formatTaskDueDate(dueAt?: string, referenceDate: Date = new Date()): string {
  if (!dueAt) return 'Sin fecha de entrega';
  const dueDate = new Date(dueAt);
  if (isNaN(dueDate.getTime())) return 'Sin fecha de entrega';

  const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const diffDays = Math.round((due.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return daysAgo === 1 ? 'Vencida ayer' : `Vencida hace ${daysAgo} días`;
  }
  if (diffDays === 0) {
    return 'Entrega: hoy';
  }
  if (diffDays === 1) {
    return 'Entrega: mañana';
  }
  if (diffDays <= 6) {
    const dayName = dueDate.toLocaleDateString('es-MX', { weekday: 'long' });
    return `Entrega: ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`;
  }
  return `Entrega: ${dueDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`;
}
