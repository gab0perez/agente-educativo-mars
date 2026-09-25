import { LearningEvidence, MasteryLevel, MasteryState } from '../domain/types';

export interface IMasteryEvaluator {
  evaluate(
    topicId: string,
    evidences: LearningEvidence[],
    conceptId?: string,
    existingState?: MasteryState | null
  ): MasteryState;
}

export class DefaultMasteryEvaluator implements IMasteryEvaluator {
  evaluate(
    topicId: string,
    evidences: LearningEvidence[],
    conceptId?: string,
    existingState?: MasteryState | null
  ): MasteryState {
    const now = new Date().toISOString();

    // Filtrar evidencias relevantes al tema y concepto
    const relevant = evidences.filter((e) => {
      if (e.topicId !== topicId) return false;
      if (conceptId) {
        return e.conceptIds?.includes(conceptId);
      }
      return true;
    });

    if (relevant.length === 0) {
      return {
        id: existingState?.id || `mastery-${topicId}${conceptId ? `-${conceptId}` : ''}`,
        subjectId: existingState?.subjectId,
        topicId,
        conceptId,
        level: 'UNKNOWN',
        evidenceCount: 0,
        qualitativeSummary: 'Sin evidencias de aprendizaje registradas.',
        updatedAt: now
      };
    }

    // Ordenar de más antigua a más reciente
    const sorted = [...relevant].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const latest = sorted[sorted.length - 1];
    const subjectId = latest.subjectId || existingState?.subjectId;

    let positiveCount = 0;
    let negativeCount = 0;
    let partialCount = 0;

    for (const e of sorted) {
      if (e.result === 'CORRECT' || e.result === 'UNDERSTOOD') {
        positiveCount++;
      } else if (e.result === 'INCORRECT' || e.result === 'NEEDS_REVIEW') {
        negativeCount++;
      } else {
        partialCount++;
      }
    }

    const total = sorted.length;
    let level: MasteryLevel = 'UNKNOWN';
    let summary = '';

    // Principio: Una sola evidencia no determina maestría plena
    if (total === 1) {
      const first = sorted[0];
      if (first.result === 'CORRECT' || first.result === 'UNDERSTOOD') {
        level = 'DEVELOPING';
        summary = 'Primera evidencia positiva. Se requiere más práctica para consolidar.';
      } else if (first.result === 'INCORRECT' || first.result === 'NEEDS_REVIEW') {
        level = 'NEEDS_REVIEW';
        summary = 'Primera evidencia con dificultad. Conviene reforzar conceptos.';
      } else {
        level = 'DEVELOPING';
        summary = 'Comprensión inicial en desarrollo.';
      }
    } else {
      // Múltiples evidencias
      const recentEvidences = sorted.slice(-3);
      const recentNegative = recentEvidences.filter(
        (e) => e.result === 'INCORRECT' || e.result === 'NEEDS_REVIEW'
      ).length;

      const positiveRatio = positiveCount / total;

      if (recentNegative >= 2 || (negativeCount / total) > 0.5) {
        level = 'NEEDS_REVIEW';
        summary = 'Dificultades recientes detectadas. Se recomienda repaso guiado.';
      } else if (total >= 4 && positiveRatio >= 0.85 && recentNegative === 0) {
        level = 'STRONG';
        summary = 'Comprensión sólida y consistente demostrada en múltiples actividades.';
      } else if (positiveRatio >= 0.65 && recentNegative === 0) {
        level = 'UNDERSTOOD';
        summary = 'Concepto comprendido y aplicado adecuadamente.';
      } else {
        level = 'DEVELOPING';
        summary = 'Comprensión en progreso con áreas de oportunidad.';
      }
    }

    return {
      id: existingState?.id || `mastery-${topicId}${conceptId ? `-${conceptId}` : ''}`,
      subjectId,
      topicId,
      conceptId,
      level,
      evidenceCount: total,
      lastEvidenceAt: latest.createdAt,
      lastReviewedAt: existingState?.lastReviewedAt,
      qualitativeSummary: summary,
      updatedAt: now
    };
  }
}

export const defaultMasteryEvaluator = new DefaultMasteryEvaluator();
