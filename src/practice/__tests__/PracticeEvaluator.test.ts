import { describe, it, expect } from 'vitest';
import { practiceEvaluator } from '../evaluator/PracticeEvaluator';
import { PracticeActivity } from '../../learning/domain/types';

describe('PracticeEvaluator (TG20)', () => {
  describe('MULTIPLE_CHOICE evaluation', () => {
    const mcActivity: PracticeActivity & { correctAnswer?: string } = {
      id: 'act-mc-1',
      topicId: 'sinergia',
      type: 'MULTIPLE_CHOICE',
      prompt: '¿Qué ocurre cuando existe sinergia positiva en un equipo?',
      options: [
        { id: 'opt-a', text: 'El resultado conjunto es superior a la suma individual.', isCorrect: true },
        { id: 'opt-b', text: 'Cada integrante trabaja de forma aislada.', isCorrect: false },
        { id: 'opt-c', text: 'Se duplica el tiempo de entrega.', isCorrect: false }
      ],
      correctAnswer: 'opt-a',
      explanation: 'La sinergia positiva logra que 1 + 1 sea mayor que 2.',
      provenance: 'AI_COMPLEMENTARY',
      createdAt: '2026-09-25T08:00:00.000Z'
    };

    it('evaluates correct option as CORRECT with positive feedback', () => {
      const evaluation = practiceEvaluator.evaluate(mcActivity, 'opt-a');
      expect(evaluation.result).toBe('CORRECT');
      expect(evaluation.isCorrect).toBe(true);
      expect(evaluation.feedback).toContain('¡Muy bien!');
      expect(evaluation.feedback).toContain('1 + 1 sea mayor que 2');
    });

    it('evaluates incorrect option as INCORRECT with explanation feedback', () => {
      const evaluation = practiceEvaluator.evaluate(mcActivity, 'opt-b');
      expect(evaluation.result).toBe('INCORRECT');
      expect(evaluation.isCorrect).toBe(false);
      expect(evaluation.feedback).toContain('No pasa nada');
      expect(evaluation.feedback).toContain('1 + 1 sea mayor que 2');
    });

    it('handles option ID matching case-insensitively and trimmed', () => {
      const evaluation = practiceEvaluator.evaluate(mcActivity, '  OPT-A  ');
      expect(evaluation.result).toBe('CORRECT');
    });
  });

  describe('TRUE_FALSE evaluation', () => {
    const tfActivity: PracticeActivity & { correctAnswer?: string } = {
      id: 'act-tf-1',
      topicId: 'sinergia',
      type: 'TRUE_FALSE',
      prompt: 'La sinergia implica que las partes de un sistema son totalmente independientes.',
      options: [
        { id: 'true', text: 'Verdadero', isCorrect: false },
        { id: 'false', text: 'Falso', isCorrect: true }
      ],
      correctAnswer: 'false',
      explanation: 'La sinergia requiere interdependencia y coordinación mutua.',
      provenance: 'AI_COMPLEMENTARY',
      createdAt: '2026-09-25T08:00:00.000Z'
    };

    it('evaluates correct false answer as CORRECT', () => {
      const evaluation = practiceEvaluator.evaluate(tfActivity, 'false');
      expect(evaluation.result).toBe('CORRECT');
      expect(evaluation.isCorrect).toBe(true);
      expect(evaluation.feedback).toContain('interdependencia');
    });

    it('evaluates incorrect true answer as INCORRECT', () => {
      const evaluation = practiceEvaluator.evaluate(tfActivity, 'true');
      expect(evaluation.result).toBe('INCORRECT');
      expect(evaluation.isCorrect).toBe(false);
    });

    it('handles localized strings "verdadero" and "falso"', () => {
      const evalFalso = practiceEvaluator.evaluate(tfActivity, 'falso');
      expect(evalFalso.result).toBe('CORRECT');

      const evalVerdadero = practiceEvaluator.evaluate(tfActivity, 'verdadero');
      expect(evalVerdadero.result).toBe('INCORRECT');
    });
  });

  describe('SHORT_ANSWER evaluation', () => {
    const shortActivity: PracticeActivity & { correctAnswer?: string } = {
      id: 'act-sa-1',
      topicId: 'sinergia',
      type: 'SHORT_ANSWER',
      prompt: '¿Cómo se llama la propiedad donde el todo es mayor que la suma de sus partes?',
      options: [
        { id: 'opt-1', text: 'sinergia', isCorrect: true }
      ],
      correctAnswer: 'sinergia',
      explanation: 'El concepto central es la sinergia.',
      provenance: 'AI_COMPLEMENTARY',
      createdAt: '2026-09-25T08:00:00.000Z'
    };

    it('evaluates exact match as CORRECT', () => {
      const evaluation = practiceEvaluator.evaluate(shortActivity, 'sinergia');
      expect(evaluation.result).toBe('CORRECT');
      expect(evaluation.isCorrect).toBe(true);
    });

    it('normalizes accents, casing and surrounding spaces', () => {
      const evaluation = practiceEvaluator.evaluate(shortActivity, '  Sinergía  ');
      expect(evaluation.result).toBe('CORRECT');
    });

    it('detects partial matches containing the concept', () => {
      const evaluation = practiceEvaluator.evaluate(shortActivity, 'es el principio de sinergia grupal');
      expect(evaluation.result).toBe('PARTIAL');
      expect(evaluation.feedback).toContain('Vas por buen camino');
    });

    it('evaluates incorrect term as INCORRECT', () => {
      const evaluation = practiceEvaluator.evaluate(shortActivity, 'entropia');
      expect(evaluation.result).toBe('INCORRECT');
      expect(evaluation.isCorrect).toBe(false);
    });

    it('returns UNCLEAR for very short or empty strings without inventing certainty', () => {
      const evaluation = practiceEvaluator.evaluate(shortActivity, 'a');
      expect(evaluation.result).toBe('UNCLEAR');
    });
  });

  describe('OPEN_RESPONSE evaluation', () => {
    const openActivity: PracticeActivity = {
      id: 'act-op-1',
      topicId: 'sinergia',
      type: 'OPEN_RESPONSE',
      prompt: 'Explica con tus palabras un ejemplo de sinergia en Recursos Humanos.',
      explanation: 'Un ejemplo típico es cuando dos reclutadores colaboran y reducen los tiempos de contratación a la mitad.',
      provenance: 'AI_COMPLEMENTARY',
      createdAt: '2026-09-25T08:00:00.000Z'
    };

    it('evaluates meaningful open response as UNDERSTOOD / CORRECT with qualitative feedback', () => {
      const evaluation = practiceEvaluator.evaluate(
        openActivity,
        'Cuando el departamento de selección y el de capacitación trabajan juntos para que el nuevo personal se adapte más rápido.'
      );
      expect(evaluation.result).toBe('CORRECT');
      expect(evaluation.feedback).toContain('Excelente aportación');
      expect(evaluation.feedback).toContain('reclutadores');
    });

    it('evaluates too short open response as UNCLEAR asking for elaboration', () => {
      const evaluation = practiceEvaluator.evaluate(openActivity, 'trabajar');
      expect(evaluation.result).toBe('UNCLEAR');
      expect(evaluation.feedback).toContain('Tu respuesta es un poco breve');
    });
  });
});
