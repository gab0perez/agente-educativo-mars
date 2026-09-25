import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultMasteryEvaluator } from '../mastery/MasteryEvaluator';
import { LocalMasteryRepository } from '../repositories/MasteryRepository';
import { LearningEvidence } from '../domain/types';
import { StorageAdapter } from '../../storage';

describe('TG19 — Mastery State Contract & Evaluation Tests', () => {
  let mockStorageData: Record<string, any>;
  let mockStorage: StorageAdapter;
  let masteryRepo: LocalMasteryRepository;
  let evaluator: DefaultMasteryEvaluator;

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

    masteryRepo = new LocalMasteryRepository(mockStorage);
    evaluator = new DefaultMasteryEvaluator();
  });

  it('Sin evidencias devuelve nivel UNKNOWN y evidenceCount = 0', () => {
    const result = evaluator.evaluate('tema-sinergia', []);

    expect(result.level).toBe('UNKNOWN');
    expect(result.evidenceCount).toBe(0);
    expect(result.topicId).toBe('tema-sinergia');
    expect(result.qualitativeSummary).toContain('Sin evidencias');
  });

  it('Principio clave: Una única evidencia positiva NO declara maestría plena (STRONG o UNDERSTOOD), asigna DEVELOPING', () => {
    const singlePositive: LearningEvidence = {
      id: 'ev-1',
      topicId: 'tema-sinergia',
      source: 'QUIZ',
      result: 'CORRECT',
      provenance: 'USER_PROVIDED',
      createdAt: new Date().toISOString()
    };

    const result = evaluator.evaluate('tema-sinergia', [singlePositive]);

    expect(result.level).toBe('DEVELOPING');
    expect(result.evidenceCount).toBe(1);
    expect(result.level).not.toBe('STRONG');
    expect(result.level).not.toBe('UNDERSTOOD');
  });

  it('Una única evidencia negativa señala dificultad inicial (NEEDS_REVIEW)', () => {
    const singleNegative: LearningEvidence = {
      id: 'ev-1',
      topicId: 'tema-sinergia',
      source: 'EXERCISE',
      result: 'INCORRECT',
      provenance: 'USER_PROVIDED',
      createdAt: new Date().toISOString()
    };

    const result = evaluator.evaluate('tema-sinergia', [singleNegative]);

    expect(result.level).toBe('NEEDS_REVIEW');
    expect(result.evidenceCount).toBe(1);
  });

  it('Múltiples evidencias positivas consecutivas consolidan el nivel a UNDERSTOOD y STRONG', () => {
    const evidences: LearningEvidence[] = [
      {
        id: 'ev-1',
        topicId: 'tema-sinergia',
        source: 'REFLECTION',
        result: 'UNDERSTOOD',
        provenance: 'USER_PROVIDED',
        createdAt: '2026-09-24T10:00:00Z'
      },
      {
        id: 'ev-2',
        topicId: 'tema-sinergia',
        source: 'QUIZ',
        result: 'CORRECT',
        provenance: 'USER_PROVIDED',
        createdAt: '2026-09-24T11:00:00Z'
      }
    ];

    const understoodResult = evaluator.evaluate('tema-sinergia', evidences);
    expect(understoodResult.level).toBe('UNDERSTOOD');
    expect(understoodResult.evidenceCount).toBe(2);

    // Agregar 2 evidencias positivas adicionales para alcanzar STRONG
    evidences.push(
      {
        id: 'ev-3',
        topicId: 'tema-sinergia',
        source: 'EXERCISE',
        result: 'CORRECT',
        provenance: 'USER_PROVIDED',
        createdAt: '2026-09-25T09:00:00Z'
      },
      {
        id: 'ev-4',
        topicId: 'tema-sinergia',
        source: 'QUIZ',
        result: 'CORRECT',
        provenance: 'USER_PROVIDED',
        createdAt: '2026-09-25T10:00:00Z'
      }
    );

    const strongResult = evaluator.evaluate('tema-sinergia', evidences);
    expect(strongResult.level).toBe('STRONG');
    expect(strongResult.evidenceCount).toBe(4);
  });

  it('Errores recientes en un historial previo ajustan el estado a NEEDS_REVIEW', () => {
    const evidences: LearningEvidence[] = [
      {
        id: 'ev-1',
        topicId: 'tema-sinergia',
        source: 'QUIZ',
        result: 'CORRECT',
        provenance: 'USER_PROVIDED',
        createdAt: '2026-09-20T10:00:00Z'
      },
      {
        id: 'ev-2',
        topicId: 'tema-sinergia',
        source: 'EXERCISE',
        result: 'INCORRECT',
        provenance: 'USER_PROVIDED',
        createdAt: '2026-09-25T08:00:00Z'
      },
      {
        id: 'ev-3',
        topicId: 'tema-sinergia',
        source: 'QUIZ',
        result: 'INCORRECT',
        provenance: 'USER_PROVIDED',
        createdAt: '2026-09-25T09:00:00Z'
      }
    ];

    const result = evaluator.evaluate('tema-sinergia', evidences);
    expect(result.level).toBe('NEEDS_REVIEW');
  });

  it('Permite evaluar y persistir estados separados por concepto dentro del mismo tema', () => {
    masteryRepo.save({
      topicId: 'tema-sinergia',
      level: 'UNDERSTOOD',
      evidenceCount: 3,
      updatedAt: new Date().toISOString()
    });

    masteryRepo.save({
      topicId: 'tema-sinergia',
      conceptId: 'cooperacion-interdepartamental',
      level: 'DEVELOPING',
      evidenceCount: 1,
      updatedAt: new Date().toISOString()
    });

    expect(masteryRepo.getByTopicId('tema-sinergia').length).toBe(2);
    expect(masteryRepo.getByTopicAndConcept('tema-sinergia')?.level).toBe('UNDERSTOOD');
    expect(masteryRepo.getByTopicAndConcept('tema-sinergia', 'cooperacion-interdepartamental')?.level).toBe('DEVELOPING');
  });
});
