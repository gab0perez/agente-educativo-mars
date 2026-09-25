import {
  LearningDashboardSnapshot,
  OverallLearningProgress,
  SubjectLearningSummary,
  MasteryHighlight,
  DashboardTaskSummary,
  LearningActivitySummary,
  NextStepRecommendation
} from '../domain/dashboardTypes';
import { ILearningEngine, learningEngine as defaultLearningEngine } from '../../learning/service/LearningEngine';
import { SubjectRepository, subjectRepository as defaultSubjectRepo } from '../../repositories/subjectRepository';
import { IAcademicTaskRepository, academicTaskRepository as defaultTaskRepo } from '../../repositories/academicTaskRepository';
import { ILearningEvidenceRepository, learningEvidenceRepository as defaultEvidenceRepo } from '../../learning/repositories/LearningEvidenceRepository';
import { IMasteryRepository } from '../../learning/repositories/MasteryRepository';
import { IPracticeRepository, practiceRepository as defaultPracticeRepo } from '../../learning/repositories/PracticeRepository';
import { IReviewRepository } from '../../learning/repositories/ReviewRepository';
import { getTaskUrgency, formatTaskDueDate } from '../../types/task';
import { MasteryLevel, MasteryState } from '../../learning/domain/types';
import { Subject } from '../../types/academic';

export interface DashboardServiceDependencies {
  learningEngine?: ILearningEngine;
  subjectRepo?: SubjectRepository;
  taskRepo?: IAcademicTaskRepository;
  evidenceRepo?: ILearningEvidenceRepository;
  masteryRepo?: IMasteryRepository;
  practiceRepo?: IPracticeRepository;
  reviewRepo?: IReviewRepository;
}

export class DashboardService {
  private learningEngine: ILearningEngine;
  private subjectRepo: SubjectRepository;
  private taskRepo: IAcademicTaskRepository;
  private evidenceRepo: ILearningEvidenceRepository;
  private practiceRepo: IPracticeRepository;

  constructor(dependencies: DashboardServiceDependencies = {}) {
    this.learningEngine = dependencies.learningEngine || defaultLearningEngine;
    this.subjectRepo = dependencies.subjectRepo || defaultSubjectRepo;
    this.taskRepo = dependencies.taskRepo || defaultTaskRepo;
    this.evidenceRepo = dependencies.evidenceRepo || defaultEvidenceRepo;
    this.practiceRepo = dependencies.practiceRepo || defaultPracticeRepo;
  }

  /**
   * Genera una fotografía completa e inmutable del estado educativo actual.
   * Método de SOLO LECTURA. No muta ni escribe en ninguna entidad.
   */
  getSnapshot(): LearningDashboardSnapshot {
    const subjects = this.subjectRepo.getAll();
    const allEvidences = this.evidenceRepo.getAll();
    const allAttempts = this.practiceRepo.getAttempts();
    const allTasks = this.taskRepo.getAll();
    const pendingReviews = this.learningEngine.getPendingReviews();

    // 1. Recopilación de temas y estados de dominio
    const allTopicsWithSubject: Array<{
      topicId: string;
      topicName: string;
      subjectId?: string;
      subjectName?: string;
      mastery: MasteryState;
    }> = [];

    for (const subj of subjects) {
      for (const topic of subj.topics) {
        const mastery = this.learningEngine.getMastery(topic.id);
        allTopicsWithSubject.push({
          topicId: topic.id,
          topicName: topic.name,
          subjectId: subj.id,
          subjectName: subj.name,
          mastery
        });
      }
    }

    // 2. Progreso Global (Overall Progress)
    let strongCount = 0;
    let understoodCount = 0;
    let developingCount = 0;
    let needsReviewCount = 0;
    let unknownCount = 0;
    let topicsWithEvidence = 0;

    for (const item of allTopicsWithSubject) {
      if (item.mastery.evidenceCount > 0) {
        topicsWithEvidence++;
      }
      switch (item.mastery.level) {
        case 'STRONG':
          strongCount++;
          break;
        case 'UNDERSTOOD':
          understoodCount++;
          break;
        case 'DEVELOPING':
          developingCount++;
          break;
        case 'NEEDS_REVIEW':
          needsReviewCount++;
          break;
        case 'UNKNOWN':
        default:
          unknownCount++;
          break;
      }
    }

    let qualitativeStatus = 'Comenzando tu camino de estudio 🌸';
    if (strongCount > 0 && strongCount >= allTopicsWithSubject.length * 0.5) {
      qualitativeStatus = '¡Excelente comprensión general! Varios temas están plenamente consolidados ✨';
    } else if (strongCount + understoodCount > 0) {
      qualitativeStatus = 'Avanzando con claridad y bases firmes 🌿';
    } else if (developingCount > 0 || topicsWithEvidence > 0) {
      qualitativeStatus = 'Explorando y practicando conceptos activamente 📖';
    }

    const overallProgress: OverallLearningProgress = {
      totalTopics: allTopicsWithSubject.length,
      topicsWithEvidence,
      strongCount,
      understoodCount,
      developingCount,
      needsReviewCount,
      unknownCount,
      totalEvidencesCount: allEvidences.length,
      totalPracticeAttempts: allAttempts.length,
      qualitativeStatus
    };

    // 3. Resúmenes por Materia (Subject Summaries)
    const subjectSummaries: SubjectLearningSummary[] = subjects.map((subj: Subject) => {
      const subjTasks = allTasks.filter(
        (t) => t.subjectId === subj.id && t.status === 'PENDING'
      );
      const subjTopics = subj.topics || [];
      const distribution: Record<MasteryLevel, number> = {
        STRONG: 0,
        UNDERSTOOD: 0,
        DEVELOPING: 0,
        NEEDS_REVIEW: 0,
        UNKNOWN: 0
      };

      let studiedTopicsCount = 0;
      let inPracticeTopicsCount = 0;
      let needsReviewTopicsCount = 0;
      let strongTopicsCount = 0;

      for (const t of subjTopics) {
        const mastery = this.learningEngine.getMastery(t.id);
        distribution[mastery.level] = (distribution[mastery.level] || 0) + 1;

        if (mastery.evidenceCount > 0 || mastery.level !== 'UNKNOWN') {
          studiedTopicsCount++;
        }
        if (mastery.level === 'DEVELOPING' || mastery.level === 'UNDERSTOOD') {
          inPracticeTopicsCount++;
        }
        if (mastery.level === 'NEEDS_REVIEW') {
          needsReviewTopicsCount++;
        }
        if (mastery.level === 'STRONG') {
          strongTopicsCount++;
        }
      }

      return {
        subjectId: subj.id,
        subjectName: subj.name,
        subjectCode: subj.code,
        subjectIcon: subj.icon,
        totalTopics: subjTopics.length,
        studiedTopicsCount,
        inPracticeTopicsCount,
        needsReviewTopicsCount,
        strongTopicsCount,
        pendingTasksCount: subjTasks.length,
        masteryDistribution: distribution
      };
    });

    // 4. Puntos Destacados de Dominio (Mastery Highlights)
    const strengths: MasteryHighlight[] = allTopicsWithSubject
      .filter((item) => item.mastery.level === 'STRONG' || item.mastery.level === 'UNDERSTOOD')
      .map((item) => ({
        topicId: item.topicId,
        topicName: item.topicName,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        level: item.mastery.level,
        evidenceCount: item.mastery.evidenceCount,
        qualitativeSummary: item.mastery.qualitativeSummary,
        lastEvidenceAt: item.mastery.lastEvidenceAt
      }));

    const needsReview: MasteryHighlight[] = allTopicsWithSubject
      .filter(
        (item) =>
          item.mastery.level === 'NEEDS_REVIEW' ||
          (item.mastery.level === 'DEVELOPING' && item.mastery.evidenceCount > 0)
      )
      .map((item) => ({
        topicId: item.topicId,
        topicName: item.topicName,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        level: item.mastery.level,
        evidenceCount: item.mastery.evidenceCount,
        qualitativeSummary: item.mastery.qualitativeSummary,
        lastEvidenceAt: item.mastery.lastEvidenceAt
      }));

    // 5. Tareas Pendientes Ordenadas por Urgencia
    const pendingTasksList: DashboardTaskSummary[] = allTasks
      .filter((t) => t.status === 'PENDING')
      .map((task) => ({
        task,
        urgency: getTaskUrgency(task),
        formattedDueDate: formatTaskDueDate(task.dueAt)
      }))
      .sort((a, b) => {
        const orderWeight: Record<string, number> = {
          OVERDUE: 1,
          DUE_TODAY: 2,
          UPCOMING: 3,
          NO_DUE_DATE: 4,
          COMPLETED: 5
        };
        return (orderWeight[a.urgency] || 99) - (orderWeight[b.urgency] || 99);
      });

    // 6. Actividad Reciente (Recent Activity Feed)
    const recentActivity: LearningActivitySummary[] = allEvidences
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)
      .map((ev) => {
        let actType: 'PRACTICE' | 'EXAM' | 'REFLECTION' | 'TUTOR' = 'PRACTICE';
        if (ev.source === 'QUIZ') {
          actType = ev.sourceReferenceId?.includes('exam') ? 'EXAM' : 'PRACTICE';
        } else if (ev.source === 'REFLECTION') {
          actType = 'REFLECTION';
        } else if (ev.source === 'TUTOR_INTERACTION') {
          actType = 'TUTOR';
        }

        const dateObj = new Date(ev.createdAt);
        const formattedDate = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
          : 'Reciente';

        return {
          id: ev.id,
          type: actType,
          title: ev.summary || `Actividad de ${ev.topicName || 'estudio'}`,
          subjectName: ev.subjectName,
          topicName: ev.topicName,
          result: ev.result,
          summary: ev.summary,
          createdAt: ev.createdAt,
          formattedDate
        };
      });

    // 7. Determinación de Siguiente Paso Orientativo (Next Step Recommendation)
    let nextStep: NextStepRecommendation;

    if (pendingReviews.length > 0) {
      const topReview = pendingReviews[0];
      const matchedTopic = allTopicsWithSubject.find((t) => t.topicId === topReview.topicId);
      nextStep = {
        type: 'REVIEW',
        title: `Repasar ${matchedTopic?.topicName || 'concepto clave'}`,
        description:
          topReview.priority === 'HIGH'
            ? 'Tienes una recomendación prioritaria para reforzar este tema con apoyo formativo.'
            : 'Un breve repaso afianzará lo que has estudiado recientemente.',
        subjectId: topReview.subjectId || matchedTopic?.subjectId,
        topicId: topReview.topicId,
        actionLabel: 'Comenzar repaso 🌸',
        priority: topReview.priority,
        relatedEntityId: topReview.id
      };
    } else {
      const urgentTask = pendingTasksList.find(
        (t) => t.urgency === 'OVERDUE' || t.urgency === 'DUE_TODAY'
      );

      if (urgentTask) {
        nextStep = {
          type: 'TASK',
          title: `Entregar tarea: ${urgentTask.task.title}`,
          description: `Tienes una tarea escolar ${
            urgentTask.urgency === 'OVERDUE' ? 'pendiente con fecha próxima' : 'para entregar hoy'
          }.`,
          subjectId: urgentTask.task.subjectId,
          topicId: urgentTask.task.topicId,
          actionLabel: 'Ver tarea 📝',
          priority: 'HIGH',
          relatedEntityId: urgentTask.task.id
        };
      } else if (needsReview.length > 0) {
        const topNeeds = needsReview[0];
        nextStep = {
          type: 'PRACTICE',
          title: `Practicar ${topNeeds.topicName}`,
          description: 'Reforzar este tema con algunas preguntas te ayudará a consolidar su comprensión.',
          subjectId: topNeeds.subjectId,
          topicId: topNeeds.topicId,
          actionLabel: 'Practicar ahora 🎯',
          priority: 'MEDIUM'
        };
      } else {
        const unstudied = allTopicsWithSubject.find(
          (t) => t.mastery.level === 'UNKNOWN' || t.mastery.evidenceCount === 0
        );

        if (unstudied) {
          nextStep = {
            type: 'EXPLORE',
            title: `Explorar ${unstudied.topicName}`,
            description: `Aprende los conceptos fundamentales de ${unstudied.topicName} en ${unstudied.subjectName || 'tu materia'}.`,
            subjectId: unstudied.subjectId,
            topicId: unstudied.topicId,
            actionLabel: 'Ver lección 📖',
            priority: 'LOW'
          };
        } else {
          nextStep = {
            type: 'EXPLORE',
            title: 'Sigue explorando tus temas',
            description: 'Cuando MAR tenga más información sobre tu aprendizaje, aparecerán recomendaciones aquí.',
            actionLabel: 'Ver materias 📚',
            priority: 'LOW'
          };
        }
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      overallProgress,
      subjectSummaries,
      masteryHighlights: {
        strengths,
        needsReview
      },
      pendingTasks: pendingTasksList,
      recentActivity,
      pendingReviews,
      nextStep
    };
  }
}

export const dashboardService = new DashboardService();
