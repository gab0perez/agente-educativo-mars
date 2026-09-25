import React from 'react';
import { AcademicTask } from '../../../types/task';
import { AcademicTaskCard } from '../AcademicTaskCard/AcademicTaskCard';
import { Button } from '../../../components/ui/Button/Button';
import styles from './AcademicTaskList.module.css';

export interface AcademicTaskListProps {
  tasks: AcademicTask[];
  isLoading?: boolean;
  onToggleComplete?: (task: AcademicTask) => void;
  onEdit?: (task: AcademicTask) => void;
  onDelete?: (taskId: string) => void;
  onOpenPractice?: (topicId: string) => void;
  onAskTutor?: (subjectId?: string, topicId?: string) => void;
  onOpenLesson?: (topicId: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: string;
  onAddNew?: () => void;
  className?: string;
}

export const AcademicTaskList: React.FC<AcademicTaskListProps> = ({
  tasks,
  isLoading = false,
  onToggleComplete,
  onEdit,
  onDelete,
  onOpenPractice,
  onAskTutor,
  onOpenLesson,
  emptyTitle = 'Todo despejado ✨',
  emptyDescription = 'Todavía no tienes tareas pendientes. Puedes agregar una cuando quieras.',
  emptyIcon = '📝',
  onAddNew,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.loadingWrapper} role="status" aria-live="polite">
          <span>🌸 Cargando tus tareas académicas...</span>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.emptyWrapper} role="region" aria-label="Lista de tareas vacía">
          <span className={styles.emptyIcon} aria-hidden="true">{emptyIcon}</span>
          <h3 className={styles.emptyTitle}>{emptyTitle}</h3>
          <p className={styles.emptyDescription}>{emptyDescription}</p>
          {onAddNew && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddNew}
              type="button"
              aria-label="Agregar nueva tarea"
            >
              ＋ Agregar tarea
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`} role="feed" aria-label="Lista de tareas académicas">
      {tasks.map((task) => (
        <AcademicTaskCard
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenPractice={onOpenPractice}
          onAskTutor={onAskTutor}
          onOpenLesson={onOpenLesson}
        />
      ))}
    </div>
  );
};
