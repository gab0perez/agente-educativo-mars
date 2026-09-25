import React, { useState } from 'react';
import { AcademicTask, CreateTaskInput, UpdateTaskInput } from '../../types/task';
import { useAcademicTasks } from '../../tasks/hooks/useAcademicTasks';
import { AcademicTaskList } from '../../tasks/components/AcademicTaskList/AcademicTaskList';
import { AcademicTaskModal } from '../../tasks/components/AcademicTaskModal/AcademicTaskModal';
import { Button } from '../../components/ui/Button/Button';
import styles from './TasksView.module.css';

export interface TasksViewProps {
  onOpenPractice?: (topicId: string) => void;
  onAskTutor?: (subjectId?: string, topicId?: string) => void;
  onOpenLesson?: (topicId: string) => void;
  className?: string;
}

export const TasksView: React.FC<TasksViewProps> = ({
  onOpenPractice,
  onAskTutor,
  onOpenLesson,
  className = ''
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AcademicTask | null>(null);

  const {
    tasks,
    pendingTasks,
    completedTasks,
    isLoading,
    createTask,
    updateTask,
    completeTask,
    reopenTask,
    deleteTask
  } = useAcademicTasks({ filter });

  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: AcademicTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSaveModal = (data: CreateTaskInput | UpdateTaskInput) => {
    if (editingTask) {
      updateTask(editingTask.id, data as UpdateTaskInput);
    } else {
      createTask(data as CreateTaskInput);
    }
  };

  const handleToggleComplete = (task: AcademicTask) => {
    if (task.status === 'COMPLETED') {
      reopenTask(task.id);
    } else {
      completeTask(task.id);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const confirmed = window.confirm('¿Deseas eliminar esta tarea académica?');
    if (confirmed) {
      deleteTask(taskId);
    }
  };

  return (
    <div className={`${styles.container} ${className}`} role="main" aria-label="Gestión de Tareas Académicas">
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>
            <span>📝</span>
            <span>Mis Tareas</span>
          </h1>
          <p className={styles.subtitle}>
            Organiza tus entregas y deberes escolares del CETis 164
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          type="button"
          aria-label="Crear nueva tarea académica"
        >
          ＋ Nueva Tarea
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterGroup} role="tablist" aria-label="Filtros de tareas">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'PENDING'}
            className={`${styles.filterBtn} ${filter === 'PENDING' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('PENDING')}
          >
            Pendientes ({pendingTasks.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'COMPLETED'}
            className={`${styles.filterBtn} ${filter === 'COMPLETED' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('COMPLETED')}
          >
            Completadas ({completedTasks.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'ALL'}
            className={`${styles.filterBtn} ${filter === 'ALL' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('ALL')}
          >
            Todas ({tasks.length})
          </button>
        </div>
      </div>

      <AcademicTaskList
        tasks={tasks}
        isLoading={isLoading}
        onToggleComplete={handleToggleComplete}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteTask}
        onOpenPractice={onOpenPractice}
        onAskTutor={onAskTutor}
        onOpenLesson={onOpenLesson}
        emptyTitle={
          filter === 'COMPLETED'
            ? 'Aún no hay tareas completadas'
            : 'Todo despejado ✨'
        }
        emptyDescription={
          filter === 'COMPLETED'
            ? 'Cuando marques tus tareas como hechas, se guardarán aquí para tu referencia.'
            : 'Por ahora no tienes tareas pendientes. Puedes agregar una cuando te dejen deberes en clase.'
        }
        emptyIcon={filter === 'COMPLETED' ? '🌸' : '✨'}
        onAddNew={filter !== 'COMPLETED' ? handleOpenCreate : undefined}
      />

      {isModalOpen && (
        <AcademicTaskModal
          isOpen={isModalOpen}
          initialTask={editingTask}
          onClose={handleCloseModal}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
};
