import {
  ExamConfig,
  ExamSession,
  ExamSummary,
  ExamQuestionEvaluation
} from '../domain/examTypes';
import { PracticeActivity } from '../../learning/domain/types';
import { PracticeEvaluator, practiceEvaluator as defaultEvaluator } from '../../practice/evaluator/PracticeEvaluator';
import { ILearningEngine, learningEngine as defaultLearningEngine } from '../../learning/service/LearningEngine';
import { IPracticeRepository, practiceRepository as defaultPracticeRepo } from '../../learning/repositories/PracticeRepository';

export interface ExamServiceDependencies {
  evaluator?: PracticeEvaluator;
  learningEngine?: ILearningEngine;
  practiceRepo?: IPracticeRepository;
}

export class ExamService {
  private evaluator: PracticeEvaluator;
  private learningEngine: ILearningEngine;
  private practiceRepo: IPracticeRepository;

  constructor(dependenciesOrEngine?: ExamServiceDependencies | ILearningEngine) {
    if (dependenciesOrEngine && 'recordPracticeAttempt' in dependenciesOrEngine) {
      this.evaluator = defaultEvaluator;
      this.learningEngine = dependenciesOrEngine;
      this.practiceRepo = (dependenciesOrEngine as any).practiceRepo || defaultPracticeRepo;
    } else {
      const deps = dependenciesOrEngine || {};
      this.evaluator = deps.evaluator || defaultEvaluator;
      this.learningEngine = deps.learningEngine || defaultLearningEngine;
      this.practiceRepo = deps.practiceRepo || (deps.learningEngine as any)?.practiceRepo || defaultPracticeRepo;
    }
  }

  createSession(config: ExamConfig): ExamSession {
    let activityIds = [...config.activityIds];

    if (config.shuffleQuestions) {
      activityIds = activityIds.sort(() => Math.random() - 0.5);
    }

    return {
      id: `exam-session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      examId: config.id,
      status: 'READY',
      currentQuestionIndex: 0,
      answers: activityIds.map((id) => ({
        activityId: id,
        answer: undefined,
        isAnswered: false
      })),
      configSnapshot: config
    };
  }

  startSession(session: ExamSession): ExamSession {
    return {
      ...session,
      status: 'IN_PROGRESS',
      startedAt: session.startedAt || new Date().toISOString()
    };
  }

  answerQuestion(
    session: ExamSession,
    activityId: string,
    answer: string
  ): ExamSession {
    const trimmed = answer.trim();
    const isAnswered = trimmed.length > 0;
    const now = new Date().toISOString();

    const updatedAnswers = session.answers.map((ans) => {
      if (ans.activityId === activityId) {
        return {
          ...ans,
          answer: isAnswered ? answer : undefined,
          isAnswered,
          answeredAt: isAnswered ? now : undefined
        };
      }
      return ans;
    });

    return {
      ...session,
      answers: updatedAnswers
    };
  }

  goToQuestion(session: ExamSession, index: number): ExamSession {
    const safeIndex = Math.max(0, Math.min(index, session.answers.length - 1));
    return {
      ...session,
      status: 'IN_PROGRESS',
      currentQuestionIndex: safeIndex
    };
  }

  goToReview(session: ExamSession): ExamSession {
    return {
      ...session,
      status: 'REVIEWING'
    };
  }

  resumeExam(session: ExamSession): ExamSession {
    return {
      ...session,
      status: 'IN_PROGRESS'
    };
  }

  abandonSession(session: ExamSession): ExamSession {
    // Al abandonar NO se crea evidencia de aprendizaje ni se modifica MasteryState
    return {
      ...session,
      status: 'ABANDONED',
      completedAt: new Date().toISOString()
    };
  }

  finalizeExam(
    session: ExamSession,
    activities: PracticeActivity[] = []
  ): { session: ExamSession; summary: ExamSummary } {
    const now = new Date().toISOString();
    const evaluations: ExamQuestionEvaluation[] = [];
    const conceptsToReviewSet = new Set<string>();

    for (const ans of session.answers) {
      const activity =
        activities.find((a) => a.id === ans.activityId) ||
        this.practiceRepo.getActivityById(ans.activityId);

      const studentAnswer = ans.answer || '';

      if (activity) {
        if (!this.practiceRepo.getActivityById(activity.id)) {
          this.practiceRepo.saveActivity(activity);
        }

        // 1. Evaluación mediante PracticeEvaluator
        const evaluation = this.evaluator.evaluate(activity, studentAnswer);

        evaluations.push({
          activityId: activity.id,
          prompt: activity.prompt,
          studentAnswer: ans.answer,
          isCorrect: evaluation.isCorrect,
          result: evaluation.result,
          feedback: evaluation.feedback,
          explanation: evaluation.explanation || activity.explanation
        });

        if (!evaluation.isCorrect && activity.topicId) {
          conceptsToReviewSet.add(activity.prompt.length > 50 ? `${activity.prompt.substring(0, 47)}...` : activity.prompt);
        }

        // 2. Registro oficial de intento y evidencia en LearningEngine
        this.learningEngine.recordPracticeAttempt({
          activityId: activity.id,
          answer: studentAnswer,
          result: evaluation.result,
          feedback: evaluation.feedback
        });
      }
    }

    const totalQuestions = session.answers.length;
    const answeredCount = session.answers.filter((a) => a.isAnswered).length;
    const unansweredCount = totalQuestions - answeredCount;
    const correctCount = evaluations.filter((e) => e.isCorrect).length;
    const reviewCount = totalQuestions - correctCount;

    // Resumen cualitativo y empático
    let qualitativeFeedback: string;
    if (correctCount === totalQuestions && totalQuestions > 0) {
      qualitativeFeedback = '🌸 ¡Excelente trabajo! Demostraste una comprensión sólida y clara en todas las preguntas del examen.';
    } else if (correctCount >= Math.ceil(totalQuestions * 0.7)) {
      qualitativeFeedback = '✨ ¡Muy buen desempeño! La mayoría de los conceptos están claros y bien asimilados.';
    } else if (correctCount >= Math.ceil(totalQuestions * 0.4)) {
      qualitativeFeedback = '🌿 Vas por buen camino. Hay algunos conceptos clave que se beneficiarán de una sesión de repaso o práctica.';
    } else {
      qualitativeFeedback = '💡 Buen intento de simulación. Con una breve revisión de tus apuntes y práctica guiada afianzaremos estos temas.';
    }

    const summary: ExamSummary = {
      sessionId: session.id,
      examTitle: session.configSnapshot.title,
      subjectName: session.configSnapshot.subjectName,
      topicName: session.configSnapshot.topicName,
      totalQuestions,
      answeredCount,
      unansweredCount,
      correctCount,
      reviewCount,
      qualitativeFeedback,
      conceptsToReview: Array.from(conceptsToReviewSet),
      evaluations
    };

    const completedSession: ExamSession = {
      ...session,
      status: 'COMPLETED',
      completedAt: now
    };

    return {
      session: completedSession,
      summary
    };
  }
}

export const examService = new ExamService();
