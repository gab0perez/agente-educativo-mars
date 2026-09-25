import React from 'react';
import { useLearningDashboard } from '../../hooks/useLearningDashboard';
import {
  NextStepCard,
  OverallProgressCard,
  SubjectSummariesGrid,
  MasteryHighlights,
  PendingTasksCard,
  RecentActivityFeed
} from '../../components';
import { NextStepRecommendation } from '../../domain/dashboardTypes';
import { academicTaskService } from '../../../tasks/service/AcademicTaskService';
import styles from './DashboardView.module.css';

export interface DashboardViewProps {
  onOpenLesson?: (lessonId: string) => void;
  onOpenPractice?: (topicId: string) => void;
  onNavigateToTasks?: () => void;
  onNavigateToSubjects?: (subjectId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenLesson,
  onOpenPractice,
  onNavigateToTasks,
  onNavigateToSubjects
}) => {
  const { snapshot, refresh } = useLearningDashboard();

  const handleNextStepAction = (rec: NextStepRecommendation) => {
    switch (rec.type) {
      case 'REVIEW':
      case 'PRACTICE':
        if (rec.topicId && onOpenPractice) {
          onOpenPractice(rec.topicId);
        } else if (onNavigateToSubjects) {
          onNavigateToSubjects(rec.subjectId);
        }
        break;
      case 'TASK':
        if (onNavigateToTasks) {
          onNavigateToTasks();
        }
        break;
      case 'EXPLORE':
      default:
        if (onNavigateToSubjects) {
          onNavigateToSubjects(rec.subjectId);
        }
        break;
    }
  };

  const handleToggleTask = (taskId: string) => {
    academicTaskService.completeTask(taskId);
    refresh();
  };

  return (
    <main className={styles.container} aria-label="Panel de Aprendizaje Unificado">
      <header className={styles.header}>
        <h1 className={styles.greeting}>Tu Progreso Educativo 🌸</h1>
        <p className={styles.subtitle}>
          Visualización clara, serena y cualitativa de tu aprendizaje en CETis 164
        </p>
      </header>

      <div className={styles.sectionsWrapper}>
        {/* 1. Siguiente Paso Orientativo */}
        <NextStepCard
          recommendation={snapshot.nextStep}
          onExecuteAction={handleNextStepAction}
        />

        {/* 2. Estado General de Aprendizaje */}
        <OverallProgressCard
          progress={snapshot.overallProgress}
        />

        {/* 3. Resumen por Materia */}
        <SubjectSummariesGrid
          summaries={snapshot.subjectSummaries}
          onSelectSubject={(subjectId) => onNavigateToSubjects?.(subjectId)}
        />

        {/* 4. Puntos Destacados: Fortalezas y Para Reforzar */}
        <MasteryHighlights
          strengths={snapshot.masteryHighlights.strengths}
          needsReview={snapshot.masteryHighlights.needsReview}
          onPracticeTopic={(topicId) => onOpenPractice?.(topicId)}
          onStudyTopic={(_topicId) => {
            if (onOpenLesson) onOpenLesson('leccion-sinergia');
            else onNavigateToSubjects?.();
          }}
        />

        {/* 5. Tareas Escolares Pendientes */}
        <PendingTasksCard
          tasks={snapshot.pendingTasks}
          onToggleComplete={handleToggleTask}
          onViewAllTasks={onNavigateToTasks}
        />

        {/* 6. Actividad Reciente de Estudio */}
        <RecentActivityFeed
          activities={snapshot.recentActivity}
        />
      </div>
    </main>
  );
};
