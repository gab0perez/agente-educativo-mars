import React from 'react';
import { DashboardTaskSummary } from '../../domain/dashboardTypes';
import { Button } from '../../../components/ui/Button/Button';
import styles from './PendingTasksCard.module.css';

export interface PendingTasksCardProps {
  tasks: DashboardTaskSummary[];
  onToggleComplete?: (taskId: string) => void;
  onViewAllTasks?: () => void;
}

export const PendingTasksCard: React.FC<PendingTasksCardProps> = ({
  tasks,
  onToggleComplete,
  onViewAllTasks
}) => {
  return (
    <article className={styles.card} aria-labelledby="pending-tasks-title">
      <div className={styles.header}>
        <h3 id="pending-tasks-title" className={styles.title}>
          <span>📝</span>
          <span>Tareas Escolares Pendientes ({tasks.length})</span>
        </h3>
        {onViewAllTasks && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAllTasks}
            aria-label="Ver todas las tareas escolares"
          >
            Ver todas →
          </Button>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className={styles.emptyText}>
          No tienes tareas pendientes por ahora. ¡Todo al día! ✨
        </p>
      ) : (
        <div className={styles.tasksList} role="list">
          {tasks.slice(0, 3).map(({ task, urgency, formattedDueDate }) => {
            let urgencyClass = styles.urgencyNoDate;
            if (urgency === 'OVERDUE') urgencyClass = styles.urgencyOverdue;
            else if (urgency === 'DUE_TODAY') urgencyClass = styles.urgencyToday;
            else if (urgency === 'UPCOMING') urgencyClass = styles.urgencyUpcoming;

            return (
              <div key={task.id} className={styles.taskItem} role="listitem">
                <div className={styles.taskMain}>
                  <button
                    type="button"
                    className={styles.checkbox}
                    onClick={() => onToggleComplete?.(task.id)}
                    aria-label={`Marcar como completada: ${task.title}`}
                    title="Marcar como completada"
                  />
                  <div className={styles.taskInfo}>
                    <h4 className={styles.taskTitle}>{task.title}</h4>
                    <span className={styles.taskMeta}>
                      {task.subjectName ? `${task.subjectName} • ` : ''}
                      {task.topicName || ''}
                    </span>
                  </div>
                </div>

                <span className={`${styles.urgencyBadge} ${urgencyClass}`}>
                  {formattedDueDate}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
};
