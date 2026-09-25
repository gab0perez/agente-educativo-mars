import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultReviewScheduler } from '../review/ReviewScheduler';
import { LocalReviewRepository } from '../repositories/ReviewRepository';
import { LearningEvidence, MasteryState } from '../domain/types';
import { StorageAdapter } from '../../storage';

describe('TG19 — Review Model & Scheduling Contract Tests', () => {
  let mockStorageData: Record<string, any>;
  let mockStorage: StorageAdapter;
  let reviewRepo: LocalReviewRepository;
  let scheduler: DefaultReviewScheduler;

  beforeEach(() => {
    mockStorageData = {};
    mockStorage = {
      getItem: <T>(key: string): T | null => (mockStorageData[key] !== undefined ? mockStorageData[key] : null),
      setItem: <T>(key: string, val: T): void => {
        mockStorageData[key] = val;
      },
      removeItem: (key: string): void => {
        delete mockStorageData[key];
      },
      hasKey: (key: string): boolean => mockStorageData[key] !== undefined,
      clear: (): void => {
        mockStorageData = {};
      }
    };

    reviewRepo = new LocalReviewRepository(mockStorage);
    scheduler = new DefaultReviewScheduler();
  });

  it('Genera recomendación de repaso de alta prioridad con actividad TUTOR ante estado NEEDS_REVIEW', () => {
    const lowMastery: MasteryState = {
      id: 'mastery-1',
      subjectId: 'rh-101',
      topicId: 'tema-sinergia',
      level: 'NEEDS_REVIEW',
      evidenceCount: 2,
      updatedAt: new Date().toISOString()
    };

    const review = scheduler.generateReviewItem(lowMastery, []);

    expect(review).toBeDefined();
    expect(review?.topicId).toBe('tema-sinergia');
    expect(review?.reason).toBe('LOW_MASTERY');
    expect(review?.priority).toBe('HIGH');
    expect(review?.recommendedActivity).toBe('TUTOR');
    expect(review?.dueAt).toBeDefined();
  });

  it('Genera recomendación por RECENT_ERROR cuando existen fallos recientes en las evidencias', () => {
    const developingMastery: MasteryState = {
      id: 'mastery-2',
      topicId: 'tema-sinergia',
      level: 'DEVELOPING',
      evidenceCount: 3,
      updatedAt: new Date().toISOString()
    };

    const recentErrors: LearningEvidence[] = [
      {
        id: 'ev-1',
        topicId: 'tema-sinergia',
        source: 'EXERCISE',
        result: 'INCORRECT',
        provenance: 'USER_PROVIDED',
        createdAt: new Date().toISOString()
      }
    ];

    const review = scheduler.generateReviewItem(developingMastery, recentErrors);

    expect(review?.reason).toBe('RECENT_ERROR');
    expect(review?.priority).toBe('HIGH');
  });

  it('Genera recomendación moderada para conceptos en DEVELOPING', () => {
    const developingMastery: MasteryState = {
      id: 'mastery-3',
      topicId: 'tema-sinergia',
      level: 'DEVELOPING',
      evidenceCount: 2,
      updatedAt: new Date().toISOString()
    };

    const review = scheduler.generateReviewItem(developingMastery, []);

    expect(review?.reason).toBe('PARTIAL_UNDERSTANDING');
    expect(review?.priority).toBe('MEDIUM');
    expect(review?.recommendedActivity).toBe('EXERCISE');
  });

  it('Guarda ítems de repaso en ReviewRepository y gestiona su estado completado', () => {
    const item = reviewRepo.save({
      topicId: 'tema-sinergia',
      subjectId: 'rh-101',
      reason: 'LOW_MASTERY',
      priority: 'HIGH',
      recommendedActivity: 'TUTOR'
    });

    expect(reviewRepo.getPending().length).toBe(1);

    const completed = reviewRepo.markCompleted(item.id);
    expect(completed?.completedAt).toBeDefined();
    expect(reviewRepo.getPending().length).toBe(0);
    expect(reviewRepo.getAll().length).toBe(1);
  });
});
