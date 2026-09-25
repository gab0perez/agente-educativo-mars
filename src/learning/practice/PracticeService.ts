import {
  PracticeActivity,
  PracticeAttempt,
  PracticeAttemptResult,
  PracticeOption,
  PracticeType
} from '../domain/types';
import {
  IPracticeRepository,
  practiceRepository as defaultPracticeRepo
} from '../repositories/PracticeRepository';
import { ProvenanceOrigin } from '../../types/provenance';

export interface CreatePracticeActivityInput {
  type: PracticeType;
  subjectId?: string;
  topicId?: string;
  lessonId?: string;
  prompt: string;
  options?: PracticeOption[];
  explanation?: string;
  provenance?: ProvenanceOrigin;
}

export interface RecordAttemptInput {
  activityId: string;
  answer: string;
  result?: PracticeAttemptResult;
  feedback?: string;
}

export class PracticeService {
  private practiceRepo: IPracticeRepository;

  constructor(practiceRepo: IPracticeRepository = defaultPracticeRepo) {
    this.practiceRepo = practiceRepo;
  }

  createActivity(input: CreatePracticeActivityInput): PracticeActivity {
    return this.practiceRepo.saveActivity({
      type: input.type,
      subjectId: input.subjectId,
      topicId: input.topicId,
      lessonId: input.lessonId,
      prompt: input.prompt,
      options: input.options,
      explanation: input.explanation,
      provenance: input.provenance || 'CLASS_ORIGIN'
    });
  }

  evaluateAttempt(
    activity: PracticeActivity,
    studentAnswer: string
  ): { result: PracticeAttemptResult; feedback?: string } {
    if (!activity.options || activity.options.length === 0) {
      // Pregunta abierta o de respuesta corta sin opciones
      return {
        result: studentAnswer.trim() ? 'PARTIAL' : 'UNCLEAR',
        feedback: 'Respuesta registrada para revisión formativa.'
      };
    }

    const selectedOption = activity.options.find(
      (opt) => opt.id === studentAnswer || opt.text.trim().toLowerCase() === studentAnswer.trim().toLowerCase()
    );

    if (!selectedOption) {
      return {
        result: 'UNCLEAR',
        feedback: 'Opción no reconocida.'
      };
    }

    if (selectedOption.isCorrect) {
      return {
        result: 'CORRECT',
        feedback: selectedOption.explanation || activity.explanation || '¡Respuesta correcta!'
      };
    }

    return {
      result: 'INCORRECT',
      feedback: selectedOption.explanation || activity.explanation || 'Respuesta incorrecta. Revisa el concepto clave.'
    };
  }

  recordAttempt(input: RecordAttemptInput): PracticeAttempt {
    const activity = this.practiceRepo.getActivityById(input.activityId);
    let result = input.result;
    let feedback = input.feedback;

    if (!result && activity) {
      const evaluation = this.evaluateAttempt(activity, input.answer);
      result = evaluation.result;
      feedback = feedback || evaluation.feedback;
    }

    return this.practiceRepo.saveAttempt({
      activityId: input.activityId,
      answer: input.answer,
      result: result || 'UNCLEAR',
      feedback
    });
  }
}

export const practiceService = new PracticeService();
