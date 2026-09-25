import { PracticeActivity, PracticeAttempt, PracticeAttemptResult } from '../../learning/domain/types';
import { Subject, Topic } from '../../types/academic';

export type PracticeSessionStatus =
  | 'IDLE'        // Pantalla de introducción
  | 'ANSWERING'   // Respondiendo la actividad activa
  | 'SUBMITTING'  // Procesando y registrando la respuesta en el Learning Engine
  | 'FEEDBACK'    // Retroalimentación pedagógica visible
  | 'COMPLETED'   // Resumen final de la práctica
  | 'ERROR';      // Error controlado

export interface PracticeSessionState {
  sessionId: string;
  subject?: Subject;
  topic?: Topic;
  activities: PracticeActivity[];
  currentIndex: number;
  currentAnswer: string;
  lastAttempt: PracticeAttempt | null;
  attempts: PracticeAttempt[];
  status: PracticeSessionStatus;
  errorMessage: string | null;
  startedAt: string;
  completedAt?: string;
}

export interface PracticeEvaluation {
  result: PracticeAttemptResult;
  feedback: string;
  isCorrect: boolean;
  explanation?: string;
}
