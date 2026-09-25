import React from 'react';
import { AcademicTask, getTaskUrgency, formatTaskDueDate } from '../../../types/task';
import { Button } from '../../../components/ui/Button/Button';
import styles from './AcademicTaskCard.module.css';

export interface AcademicTaskCardProps {
  task: AcademicTask;
  onToggleComplete?: (task: AcademicTask) => void;
  onEdit?: (task: AcademicTask) => void;
  onDelete?: (taskId: string) => void;
  onOpenPractice?: (topicId: string) => void;
  onAskTutor?: (subjectId?: string, topicId?: string) => void;
  onOpenLesson?: (topicId: string) => void;
  className?: string;
}

export const AcademicTaskCard: React.FC<AcademicTaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onOpenPractice,
  onAskTutor,
  onOpenLesson,
  className = ''
}) => {
  const isCompleted = task.status === 'COMPLETED';
  const urgency = getTaskUrgency(task);
  const formattedDate = formatTaskDueDate(task.dueAt);

  const urgencyConfig = {
    OVERDUE: {
      label: `⚠️ ${formattedDate}`,
      className: styles.urgencyOverdue
    },
    DUE_TODAY: {
      label: `⏰ ${formattedDate}`,
      className: styles.urgencyToday
    },
    UPCOMING: {
      label: `📅 ${formattedDate}`,
      className: styles.urgencyUpcoming
    },
    NO_DUE_DATE: {
      label: '📋 Sin fecha',
      className: styles.urgencyNoDate
    },
    COMPLETED: {
      label: '✓ Completada',
      className: styles.urgencyCompleted
    }
  }[urgency];

  return (
    <article
      className={`${styles.container} ${isCompleted ? styles.completedContainer : ''} ${className}`}
      aria-label={`Tarea: ${task.title}`}
    >
      <div className={styles.headerRow}>
        <div className={styles.titleWrapper}>
          <button
            type="button"
            className={`${styles.checkboxBtn} ${isCompleted ? styles.checkedBtn : ''}`}
            onClick={() => onToggleComplete && onToggleComplete(task)}
            aria-label={isCompleted ? `Reabrir tarea: ${task.title}` : `Completar tarea: ${task.title}`}
            title={isCompleted ? 'Marcar como pendiente' : 'Marcar como hecha'}
          >
            {isCompleted ? '✓' : ''}
          </button>

          <div className={styles.titleArea}>
            <h3 className={`${styles.title} ${isCompleted ? styles.completedTitle : ''}`}>
              {task.title}
            </h3>
            {task.description && (
              <p className={styles.description}>{task.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.badgesRow}>
        <span className={`${styles.badge} ${urgencyConfig.className}`}>
          {urgencyConfig.label}
        </span>

        {task.subjectName && (
          <span className={`${styles.badge} ${styles.subjectBadge}`}>
            📚 {task.subjectName}
          </span>
        )}

        {task.topicName && (
          <span className={`${styles.badge} ${styles.topicBadge}`}>
            💡 {task.topicName}
          </span>
        )}
      </div>

      {/* Acciones de estudio cuando existe topicId */}
      {task.topicId && !isCompleted && (
        <div className={styles.studyActionsRow}>
          <span className={styles.studyLabel}>Estudiar tema:</span>
          {onOpenPractice && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenPractice(task.topicId!)}
              type="button"
              aria-label={`Practicar tema ${task.topicName || task.title}`}
            >
              🎯 Practicar
            </Button>
          )}

          {onAskTutor && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAskTutor(task.subjectId, task.topicId)}
              type="button"
              aria-label={`Preguntar a Mar IA sobre ${task.topicName || task.title}`}
            >
              🌸 Mar IA
            </Button>
          )}

          {onOpenLesson && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenLesson(task.topicId!)}
              type="button"
              aria-label={`Ver lección de ${task.topicName || task.title}`}
            >
              📖 Lección
            </Button>
          )}
        </div>
      )}

      <div className={styles.footerRow}>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(task)}
            type="button"
            aria-label={`Editar tarea ${task.title}`}
          >
            ✏️ Editar
          </Button>
        )}

        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(task.id)}
            type="button"
            aria-label={`Eliminar tarea ${task.title}`}
          >
            🗑️ Eliminar
          </Button>
        )}
      </div>
    </article>
  );
};
