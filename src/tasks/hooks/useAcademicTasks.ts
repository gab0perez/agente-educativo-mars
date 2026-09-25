import { useState, useEffect, useCallback } from 'react';
import {
  AcademicTask,
  CreateTaskInput,
  UpdateTaskInput,
  getTaskUrgency
} from '../../types/task';
import {
  AcademicTaskService,
  academicTaskService as defaultTaskService
} from '../service/AcademicTaskService';

export interface UseAcademicTasksOptions {
  subjectId?: string;
  topicId?: string;
  filter?: 'ALL' | 'PENDING' | 'COMPLETED';
  taskService?: AcademicTaskService;
}

export function useAcademicTasks(options: UseAcademicTasksOptions = {}) {
  const {
    subjectId,
    topicId,
    filter = 'ALL',
    taskService = defaultTaskService
  } = options;

  const [tasks, setTasks] = useState<AcademicTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      const sorted = taskService.getSortedTasks(filter, { subjectId, topicId });
      setTasks(sorted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar las tareas académicas.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [filter, subjectId, topicId, taskService]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(
    (input: CreateTaskInput): AcademicTask => {
      try {
        const created = taskService.createTask(input);
        fetchTasks();
        return created;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al crear la tarea.';
        setError(msg);
        throw err;
      }
    },
    [taskService, fetchTasks]
  );

  const updateTask = useCallback(
    (id: string, updates: UpdateTaskInput): AcademicTask | null => {
      try {
        const updated = taskService.updateTask(id, updates);
        fetchTasks();
        return updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al actualizar la tarea.';
        setError(msg);
        throw err;
      }
    },
    [taskService, fetchTasks]
  );

  const completeTask = useCallback(
    (id: string): AcademicTask | null => {
      try {
        const completed = taskService.completeTask(id);
        fetchTasks();
        return completed;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al completar la tarea.';
        setError(msg);
        return null;
      }
    },
    [taskService, fetchTasks]
  );

  const reopenTask = useCallback(
    (id: string): AcademicTask | null => {
      try {
        const reopened = taskService.reopenTask(id);
        fetchTasks();
        return reopened;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al reabrir la tarea.';
        setError(msg);
        return null;
      }
    },
    [taskService, fetchTasks]
  );

  const deleteTask = useCallback(
    (id: string): boolean => {
      try {
        const deleted = taskService.deleteTask(id);
        fetchTasks();
        return deleted;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al eliminar la tarea.';
        setError(msg);
        return false;
      }
    },
    [taskService, fetchTasks]
  );

  const pendingTasks = tasks.filter((t) => t.status === 'PENDING');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const overdueTasks = pendingTasks.filter((t) => getTaskUrgency(t) === 'OVERDUE');
  const upcomingTasks = pendingTasks.filter(
    (t) => getTaskUrgency(t) === 'UPCOMING' || getTaskUrgency(t) === 'DUE_TODAY'
  );

  return {
    tasks,
    pendingTasks,
    completedTasks,
    overdueTasks,
    upcomingTasks,
    isLoading,
    error,
    createTask,
    updateTask,
    completeTask,
    reopenTask,
    deleteTask,
    refreshTasks: fetchTasks
  };
}
