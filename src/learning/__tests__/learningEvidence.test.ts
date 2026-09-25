import { describe, it, expect, beforeEach } from 'vitest';
import {
  LocalLearningEvidenceRepository
} from '../repositories/LearningEvidenceRepository';
import { EvidenceSource, EvidenceResult } from '../domain/types';
import { StorageAdapter } from '../../storage';

describe('TG19 — Learning Evidence Contract & Repository Tests', () => {
  let mockStorageData: Record<string, any>;
  let mockStorage: StorageAdapter;
  let evidenceRepo: LocalLearningEvidenceRepository;

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

    evidenceRepo = new LocalLearningEvidenceRepository(mockStorage);
  });

  it('Crea y persiste una evidencia de aprendizaje con procedencia y metadatos completos', () => {
    const saved = evidenceRepo.save({
      subjectId: 'rh-101',
      subjectName: 'Recursos Humanos',
      topicId: 'tema-sinergia',
      topicName: 'Sinergia Organizacional',
      lessonId: 'leccion-01',
      conceptIds: ['cooperacion', 'equipos'],
      source: 'EXERCISE',
      result: 'CORRECT',
      confidence: 0.9,
      sourceReferenceId: 'attempt-123',
      summary: 'Resolución correcta de caso práctico de sinergia',
      provenance: 'USER_PROVIDED'
    });

    expect(saved.id).toBeDefined();
    expect(saved.createdAt).toBeDefined();
    expect(saved.source).toBe('EXERCISE');
    expect(saved.result).toBe('CORRECT');
    expect(saved.provenance).toBe('USER_PROVIDED');
    expect(saved.conceptIds).toContain('cooperacion');
    expect(saved.sourceReferenceId).toBe('attempt-123');
  });

  it('Soporta todas las fuentes de evidencia requeridas', () => {
    const sources: EvidenceSource[] = ['QUIZ', 'EXERCISE', 'REFLECTION', 'TUTOR_INTERACTION'];

    sources.forEach((source, index) => {
      evidenceRepo.save({
        topicId: 'tema-sinergia',
        source,
        result: 'UNDERSTOOD',
        provenance: 'USER_PROVIDED',
        sourceReferenceId: `ref-${index}`
      });
    });

    expect(evidenceRepo.getAll().length).toBe(4);
    expect(evidenceRepo.getBySource('QUIZ').length).toBe(1);
    expect(evidenceRepo.getBySource('REFLECTION').length).toBe(1);
    expect(evidenceRepo.getBySource('TUTOR_INTERACTION').length).toBe(1);
  });

  it('Soporta todos los resultados formativos requeridos', () => {
    const results: EvidenceResult[] = [
      'CORRECT',
      'PARTIAL',
      'INCORRECT',
      'UNDERSTOOD',
      'NEEDS_REVIEW',
      'UNCLEAR'
    ];

    results.forEach((result) => {
      evidenceRepo.save({
        topicId: 'tema-sinergia',
        source: 'EXERCISE',
        result,
        provenance: 'USER_PROVIDED'
      });
    });

    const all = evidenceRepo.getAll();
    expect(all.length).toBe(6);
    expect(all.some((e) => e.result === 'NEEDS_REVIEW')).toBe(true);
    expect(all.some((e) => e.result === 'UNDERSTOOD')).toBe(true);
  });

  it('Filtra evidencias por topicId, subjectId y sourceReferenceId', () => {
    evidenceRepo.save({
      subjectId: 'rh-101',
      topicId: 'tema-sinergia',
      source: 'REFLECTION',
      result: 'UNDERSTOOD',
      sourceReferenceId: 'reflection-456',
      provenance: 'USER_PROVIDED'
    });

    evidenceRepo.save({
      subjectId: 'rh-101',
      topicId: 'tema-capacitacion',
      source: 'QUIZ',
      result: 'CORRECT',
      sourceReferenceId: 'quiz-789',
      provenance: 'USER_PROVIDED'
    });

    expect(evidenceRepo.getByTopicId('tema-sinergia').length).toBe(1);
    expect(evidenceRepo.getBySubjectId('rh-101').length).toBe(2);
    expect(evidenceRepo.getByReferenceId('reflection-456').length).toBe(1);
  });

  it('Mantiene la persistencia después de re-instanciar el repositorio sobre el mismo storageAdapter', () => {
    evidenceRepo.save({
      topicId: 'tema-sinergia',
      source: 'REFLECTION',
      result: 'UNDERSTOOD',
      provenance: 'USER_PROVIDED'
    });

    const newRepo = new LocalLearningEvidenceRepository(mockStorage);
    const retrieved = newRepo.getByTopicId('tema-sinergia');

    expect(retrieved.length).toBe(1);
    expect(retrieved[0].result).toBe('UNDERSTOOD');
  });
});
