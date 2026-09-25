import {
  EvidenceResult,
  EvidenceSource,
  LearningEvidence,
  MasteryState,
  PracticeAttempt,
  PracticeAttemptResult,
  ReviewItem
} from '../domain/types';
import {
  ILearningEvidenceRepository,
  learningEvidenceRepository as defaultEvidenceRepo
} from '../repositories/LearningEvidenceRepository';
import {
  IMasteryRepository,
  masteryRepository as defaultMasteryRepo
} from '../repositories/MasteryRepository';
import {
  IReviewRepository,
  reviewRepository as defaultReviewRepo
} from '../repositories/ReviewRepository';
import {
  IPracticeRepository,
  practiceRepository as defaultPracticeRepo
} from '../repositories/PracticeRepository';
import {
  IMasteryEvaluator,
  defaultMasteryEvaluator
} from '../mastery/MasteryEvaluator';
import {
  IReviewScheduler,
  ReviewRecommendationOptions,
  defaultReviewScheduler
} from '../review/ReviewScheduler';
import { PracticeService, practiceService as defaultPracticeService } from '../practice/PracticeService';
import { Reflection } from '../../types/reflection';
import { ProvenanceOrigin } from '../../types/provenance';

export interface CreateEvidenceInput {
  studentId?: string;
  subjectId?: string;
  subjectName?: string;
  topicId: string;
  topicName?: string;
  lessonId?: string;
  conceptIds?: string[];
  source: EvidenceSource;
  result: EvidenceResult;
  confidence?: number;
  sourceReferenceId?: string;
  summary?: string;
  provenance: ProvenanceOrigin;
}

export interface LearningEngineDependencies {
  evidenceRepo?: ILearningEvidenceRepository;
  masteryRepo?: IMasteryRepository;
  reviewRepo?: IReviewRepository;
  practiceRepo?: IPracticeRepository;
  masteryEvaluator?: IMasteryEvaluator;
  reviewScheduler?: IReviewScheduler;
  practiceService?: PracticeService;
}

export interface ILearningEngine {
  // Evidence
  recordEvidence(input: CreateEvidenceInput): LearningEvidence;
  recordReflectionEvidence(reflection: Reflection, result?: EvidenceResult): LearningEvidence;
  getEvidenceForTopic(topicId: string): LearningEvidence[];
  getEvidenceForSubject(subjectId: string): LearningEvidence[];

  // Practice
  recordPracticeAttempt(input: {
    activityId: string;
    answer: string;
    result?: PracticeAttemptResult;
    feedback?: string;
  }): { attempt: PracticeAttempt; evidence?: LearningEvidence };

  // Mastery
  getMastery(topicId: string, conceptId?: string): MasteryState;
  getMasteryForTopic(topicId: string): MasteryState[];
  getMasteryForSubject(subjectId: string): MasteryState[];
  recalculateMastery(topicId: string, conceptId?: string): MasteryState;

  // Review
  getPendingReviews(topicId?: string): ReviewItem[];
  scheduleReview(topicId: string, options?: ReviewRecommendationOptions): ReviewItem | null;
  requestUserReview(topicId: string, preferredActivity?: import('../domain/types').RecommendedActivity): ReviewItem | null;
  completeReview(reviewId: string): ReviewItem | null;
}

/**
 * Servicio coordinador del Learning Engine de MAR
 * Desacoplado del Tutor, coordina Practice, Evidence, Mastery y Review.
 */
export class LearningEngine implements ILearningEngine {
  private evidenceRepo: ILearningEvidenceRepository;
  private masteryRepo: IMasteryRepository;
  private reviewRepo: IReviewRepository;
  private practiceRepo: IPracticeRepository;
  private masteryEvaluator: IMasteryEvaluator;
  private reviewScheduler: IReviewScheduler;
  private practiceService: PracticeService;

  constructor(dependencies: LearningEngineDependencies = {}) {
    this.evidenceRepo = dependencies.evidenceRepo || defaultEvidenceRepo;
    this.masteryRepo = dependencies.masteryRepo || defaultMasteryRepo;
    this.reviewRepo = dependencies.reviewRepo || defaultReviewRepo;
    this.practiceRepo = dependencies.practiceRepo || defaultPracticeRepo;
    this.masteryEvaluator = dependencies.masteryEvaluator || defaultMasteryEvaluator;
    this.reviewScheduler = dependencies.reviewScheduler || defaultReviewScheduler;
    this.practiceService = dependencies.practiceService || (dependencies.practiceRepo ? new PracticeService(dependencies.practiceRepo) : defaultPracticeService);
  }

  // ==========================================
  // 1. Evidence Management
  // ==========================================

  recordEvidence(input: CreateEvidenceInput): LearningEvidence {
    const evidence = this.evidenceRepo.save({
      studentId: input.studentId,
      subjectId: input.subjectId,
      subjectName: input.subjectName,
      topicId: input.topicId,
      topicName: input.topicName,
      lessonId: input.lessonId,
      conceptIds: input.conceptIds,
      source: input.source,
      result: input.result,
      confidence: input.confidence,
      sourceReferenceId: input.sourceReferenceId,
      summary: input.summary,
      provenance: input.provenance
    });

    // Actualizar automáticamente el estado de dominio del tema
    this.recalculateMastery(input.topicId);

    return evidence;
  }

  recordReflectionEvidence(reflection: Reflection, result: EvidenceResult = 'UNDERSTOOD'): LearningEvidence {
    if (!reflection.topicId) {
      throw new Error('No se puede registrar evidencia de reflexión sin un topicId válido');
    }

    return this.recordEvidence({
      subjectId: reflection.subjectId,
      subjectName: reflection.subjectName,
      topicId: reflection.topicId,
      topicName: reflection.topicName,
      lessonId: reflection.lessonId,
      source: 'REFLECTION',
      result,
      sourceReferenceId: reflection.id,
      summary: reflection.answer.length > 100
        ? `${reflection.answer.substring(0, 97)}...`
        : reflection.answer,
      provenance: reflection.provenance || 'USER_PROVIDED'
    });
  }

  getEvidenceForTopic(topicId: string): LearningEvidence[] {
    return this.evidenceRepo.getByTopicId(topicId);
  }

  getEvidenceForSubject(subjectId: string): LearningEvidence[] {
    return this.evidenceRepo.getBySubjectId(subjectId);
  }

  // ==========================================
  // 2. Practice & Attempt Management
  // ==========================================

  recordPracticeAttempt(input: {
    activityId: string;
    answer: string;
    result?: PracticeAttemptResult;
    feedback?: string;
  }): { attempt: PracticeAttempt; evidence?: LearningEvidence } {
    const activity = this.practiceRepo.getActivityById(input.activityId);
    const attempt = this.practiceService.recordAttempt(input);

    let evidence: LearningEvidence | undefined;

    if (activity && activity.topicId) {
      // Mapear resultado del intento a EvidenceResult
      let evidenceResult: EvidenceResult = 'UNCLEAR';
      if (attempt.result === 'CORRECT') evidenceResult = 'CORRECT';
      else if (attempt.result === 'PARTIAL') evidenceResult = 'PARTIAL';
      else if (attempt.result === 'INCORRECT') evidenceResult = 'INCORRECT';

      const source: EvidenceSource = activity.type === 'OPEN_RESPONSE' ? 'EXERCISE' : 'QUIZ';

      evidence = this.recordEvidence({
        subjectId: activity.subjectId,
        topicId: activity.topicId,
        lessonId: activity.lessonId,
        source,
        result: evidenceResult,
        sourceReferenceId: attempt.id,
        summary: `Práctica: ${activity.prompt}`,
        provenance: activity.provenance || 'AI_COMPLEMENTARY'
      });
    }

    return { attempt, evidence };
  }

  // ==========================================
  // 3. Mastery Evaluation
  // ==========================================

  getMastery(topicId: string, conceptId?: string): MasteryState {
    const existing = this.masteryRepo.getByTopicAndConcept(topicId, conceptId);
    if (existing) {
      return existing;
    }
    return this.recalculateMastery(topicId, conceptId);
  }

  getMasteryForTopic(topicId: string): MasteryState[] {
    return this.masteryRepo.getByTopicId(topicId);
  }

  getMasteryForSubject(subjectId: string): MasteryState[] {
    return this.masteryRepo.getBySubjectId(subjectId);
  }

  recalculateMastery(topicId: string, conceptId?: string): MasteryState {
    const evidences = this.evidenceRepo.getByTopicId(topicId);
    const existing = this.masteryRepo.getByTopicAndConcept(topicId, conceptId);

    const calculated = this.masteryEvaluator.evaluate(
      topicId,
      evidences,
      conceptId,
      existing
    );

    return this.masteryRepo.save(calculated);
  }

  // ==========================================
  // 4. Review Scheduling
  // ==========================================

  getPendingReviews(topicId?: string): ReviewItem[] {
    const pending = this.reviewRepo.getPending();
    if (topicId) {
      return pending.filter((r) => r.topicId === topicId);
    }
    return pending;
  }

  scheduleReview(topicId: string, options: ReviewRecommendationOptions = {}): ReviewItem | null {
    const mastery = this.getMastery(topicId);
    const recentEvidences = this.evidenceRepo.getByTopicId(topicId).slice(-5);

    const item = this.reviewScheduler.generateReviewItem(mastery, recentEvidences, options);
    if (!item) {
      return null;
    }

    return this.reviewRepo.save(item);
  }

  requestUserReview(topicId: string, preferredActivity?: import('../domain/types').RecommendedActivity): ReviewItem | null {
    return this.scheduleReview(topicId, {
      reasonOverride: 'USER_REQUESTED',
      priorityOverride: 'MEDIUM',
      preferredActivity: preferredActivity || 'EXERCISE'
    });
  }

  completeReview(reviewId: string): ReviewItem | null {
    const completed = this.reviewRepo.markCompleted(reviewId);
    if (completed) {
      const mastery = this.masteryRepo.getByTopicAndConcept(completed.topicId, completed.conceptId);
      if (mastery) {
        this.masteryRepo.save({
          ...mastery,
          lastReviewedAt: completed.completedAt || new Date().toISOString()
        });
      }
    }
    return completed;
  }
}

export const learningEngine = new LearningEngine();
