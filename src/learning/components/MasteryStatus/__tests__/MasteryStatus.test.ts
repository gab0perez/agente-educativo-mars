import { describe, it, expect } from 'vitest';
import { MASTERY_METADATA } from '../MasteryStatus';
import { MasteryLevel } from '../../../domain/types';

describe('TG21 — MasteryStatus Component & Metadata Tests', () => {
  const allLevels: MasteryLevel[] = [
    'UNKNOWN',
    'NEEDS_REVIEW',
    'DEVELOPING',
    'UNDERSTOOD',
    'STRONG'
  ];

  it('Define metadatos cualitativos válidos y no punitivos para los 5 niveles de maestría', () => {
    allLevels.forEach((level) => {
      const meta = MASTERY_METADATA[level];
      expect(meta).toBeDefined();
      expect(meta.label).toBeDefined();
      expect(meta.shortLabel).toBeDefined();
      expect(meta.icon).toBeDefined();
      expect(meta.description).toBeDefined();

      // Ningún texto debe contener porcentajes ni notas punitivas
      expect(meta.label).not.toMatch(/%|\b(reprobado|fracaso|mal|calificación)\b/i);
      expect(meta.description).not.toMatch(/%|\b(reprobaste|cero|fallaste)\b/i);
    });
  });

  it('UNKNOWN representa exploración inicial sin penalización', () => {
    const meta = MASTERY_METADATA.UNKNOWN;
    expect(meta.icon).toBe('🌱');
    expect(meta.label).toBe('Por explorar');
    expect(meta.description).toContain('Aún estamos conociendo');
  });

  it('NEEDS_REVIEW orienta al repaso constructivo', () => {
    const meta = MASTERY_METADATA.NEEDS_REVIEW;
    expect(meta.icon).toBe('💡');
    expect(meta.label).toBe('Conviene repasar');
    expect(meta.description).toContain('volver a revisar');
  });

  it('DEVELOPING destaca construcción activa', () => {
    const meta = MASTERY_METADATA.DEVELOPING;
    expect(meta.icon).toBe('🌿');
    expect(meta.label).toBe('En desarrollo');
    expect(meta.description).toContain('construyendo paso a paso');
  });

  it('UNDERSTOOD refleja comprensión clara de conceptos', () => {
    const meta = MASTERY_METADATA.UNDERSTOOD;
    expect(meta.icon).toBe('🌸');
    expect(meta.label).toBe('Entendido');
    expect(meta.description).toContain('comprensión clara');
  });

  it('STRONG indica solidez en el tema sin absolutismos', () => {
    const meta = MASTERY_METADATA.STRONG;
    expect(meta.icon).toBe('✨');
    expect(meta.label).toBe('Consolidado');
    expect(meta.description).toContain('bastante sólido');
  });
});
