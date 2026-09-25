import { describe, it, expect } from 'vitest';
import { MASTERY_METADATA } from '../MasteryStatus/MasteryStatus';
import { MasteryLevel } from '../../domain/types';

describe('TG21 — Learning Components Presentation & Consistency', () => {
  it('Todos los niveles de dominio tienen correspondencia con iconos amigables y accesibles', () => {
    const levels: MasteryLevel[] = ['UNKNOWN', 'NEEDS_REVIEW', 'DEVELOPING', 'UNDERSTOOD', 'STRONG'];
    levels.forEach((lvl) => {
      const meta = MASTERY_METADATA[lvl];
      expect(meta.icon).toBeTruthy();
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.description.length).toBeGreaterThan(0);
    });
  });

  it('No existe ningún estado con calificaciones numéricas tradicionales', () => {
    Object.values(MASTERY_METADATA).forEach((meta) => {
      expect(meta.label).not.toMatch(/[0-9]+/);
      expect(meta.description).not.toMatch(/[0-9]+/);
    });
  });
});
