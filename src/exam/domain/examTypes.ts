/**
 * Tipos y contratos fundamentales para el Modo Examen de MAR (TG24)
 * Desacoplado de la UI, orquesta la sesión evaluativa sin feedback inmediato.
 */

export type ExamSessionStatus =
  | 'READY'
  | 'IN_PROGRESS'
  | 'REVIEWING'
  | 'COMPLETED'
  | 'ABANDONED';

export interface ExamConfig {
  id: string;
  title: string;
  description?: string;

  subjectId?: string;
  subjectName?: string;

  topicId?: string;
  topicName?: string;

  activityIds: string[];

  timeLimitMinutes?: number;
  shuffleQuestions?: boolean;

  createdAt: string;
}

export interface ExamAnswer {
  activityId: string;
  answer?: string;
  answeredAt?: string;
  isAnswered: boolean;
}

export interface ExamSession {
  id: string;
  examId: string;
  status: ExamSessionStatus;
  currentQuestionIndex: number;
  answers: ExamAnswer[];
  startedAt?: string;
  completedAt?: string;
  configSnapshot: ExamConfig;
}

export interface ExamQuestionEvaluation {
  activityId: string;
  prompt: string;
  studentAnswer?: string;
  isCorrect: boolean;
  result: 'CORRECT' | 'PARTIAL' | 'INCORRECT' | 'UNCLEAR';
  feedback?: string;
  explanation?: string;
}

export interface ExamSummary {
  sessionId: string;
  examTitle: string;
  subjectName?: string;
  topicName?: string;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  correctCount: number;
  reviewCount: number; // Respuestas que requieren revisión (incorrectas, parciales o sin responder)
  qualitativeFeedback: string;
  conceptsToReview: string[];
  evaluations: ExamQuestionEvaluation[];
}
