import { AITutorResponseSchema } from '../domain/schemas';
import { AITutorResponse } from '../domain/types';
import { AIInvalidResponseError } from '../domain/errors';

export class ResponseValidator {
  /**
   * Normaliza y valida la respuesta emitida por cualquier proveedor de IA
   */
  static validate(rawInput: unknown): AITutorResponse {
    let candidateData: unknown = rawInput;

    // Si el proveedor devolvió una cadena de texto, intentar parsear JSON
    if (typeof rawInput === 'string') {
      try {
        let cleaned = rawInput.trim();
        // Remover bloques de código markdown ```json ... ``` si están presentes
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        }
        candidateData = JSON.parse(cleaned);
      } catch (err) {
        throw new AIInvalidResponseError(
          'El proveedor devolvió una respuesta que no es un JSON válido.',
          [(err as Error).message],
          err
        );
      }
    }

    if (!candidateData || typeof candidateData !== 'object') {
      throw new AIInvalidResponseError('La respuesta del proveedor no es un objeto válido.', [
        'Tipo recibido: ' + typeof candidateData
      ]);
    }

    const rawObj = candidateData as Record<string, any>;

    // Extraer mensaje con soporte para múltiples formatos y anidamientos
    const extractedMessage = extractMessage(rawObj);

    // Mapear modo pedagógico
    const mode =
      rawObj.mode !== undefined
        ? rawObj.mode
        : rawObj.pedagogicalMode !== undefined
        ? rawObj.pedagogicalMode
        : rawObj.pedagogicalState?.modeUsed !== undefined
        ? rawObj.pedagogicalState.modeUsed
        : rawObj.pedagogicalState?.currentMode !== undefined
        ? rawObj.pedagogicalState.currentMode
        : undefined;

    // Mapear followUpSuggestions -> suggestedActions si no está presente
    let suggestedActions = rawObj.suggestedActions;
    if (suggestedActions === undefined && Array.isArray(rawObj.followUpSuggestions)) {
      suggestedActions = rawObj.followUpSuggestions.map((s: any, idx: number) => ({
        id: `action-${idx + 1}`,
        label: typeof s === 'string' ? s : String(s?.label || s),
        mode: 'EXPLAIN'
      }));
    } else if (suggestedActions === undefined) {
      suggestedActions = [];
    }

    // Normalizar socraticStep
    const rawSocratic = rawObj.socraticStep || rawObj.pedagogicalState?.socraticStep;
    let socraticStep: any = undefined;
    if (rawSocratic && typeof rawSocratic === 'object') {
      const guidingQuestion = String(
        rawSocratic.guidingQuestion || rawSocratic.question || rawSocratic.guide || ''
      ).trim();

      if (guidingQuestion) {
        socraticStep = {
          currentLevel: rawSocratic.currentLevel || 'HINT_1',
          guidingQuestion,
          clue: rawSocratic.clue !== undefined ? rawSocratic.clue : rawSocratic.hint,
          expectedConceptFocus:
            rawSocratic.expectedConceptFocus ||
            rawSocratic.conceptFocus ||
            rawSocratic.concept ||
            'Comprensión general'
        };
      }
    }

    const provenance = rawObj.provenance || rawObj.pedagogicalState?.provenance || 'AI_COMPLEMENTARY';

    const normalized: Record<string, any> = {
      id: rawObj.id || `ai-resp-${Date.now()}`,
      sessionId: rawObj.sessionId || `session-${Date.now()}`,
      timestamp: rawObj.timestamp || new Date().toISOString(),
      message: extractedMessage,
      mode,
      provenance,
      suggestedActions,
      executionMetadata: rawObj.executionMetadata || {
        providerName: 'google-gemini',
        modelIdentifier: 'gemini-3.8-flash',
        executionDurationMs: 0,
        timestamp: new Date().toISOString()
      }
    };

    if (socraticStep) normalized.socraticStep = socraticStep;
    if (rawObj.comprehensionCheck) normalized.comprehensionCheck = rawObj.comprehensionCheck;
    if (rawObj.exercise) normalized.exercise = rawObj.exercise;
    if (rawObj.requiresConfirmation !== undefined) normalized.requiresConfirmation = rawObj.requiresConfirmation;
    if (rawObj.confirmationPrompt !== undefined) normalized.confirmationPrompt = rawObj.confirmationPrompt;

    const parseResult = AITutorResponseSchema.safeParse(normalized);

    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(
        (issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`
      );
      throw new AIInvalidResponseError(
        'La respuesta del proveedor no cumple con el esquema pedagógico AITutorResponse.',
        issues,
        parseResult.error
      );
    }

    return parseResult.data as AITutorResponse;
  }
}

function extractMessage(obj: Record<string, any>): string {
  if (typeof obj.message === 'string' && obj.message.trim()) return obj.message.trim();
  if (typeof obj.marResponse === 'string' && obj.marResponse.trim()) return obj.marResponse.trim();
  if (typeof obj.response === 'string' && obj.response.trim()) return obj.response.trim();
  if (typeof obj.text === 'string' && obj.text.trim()) return obj.text.trim();
  if (typeof obj.explanation === 'string' && obj.explanation.trim()) return obj.explanation.trim();

  // If content is an object with subfields
  if (obj.content && typeof obj.content === 'object') {
    const parts = [
      obj.content.greeting,
      obj.content.explanation || obj.content.text || obj.content.body,
      obj.content.encouragement || obj.content.closing
    ].filter((p) => typeof p === 'string' && p.trim().length > 0);

    if (parts.length > 0) {
      return parts.join('\n\n').trim();
    }
  }

  // If content itself is a string
  if (typeof obj.content === 'string' && obj.content.trim()) {
    return obj.content.trim();
  }

  // If nested under pedagogicalState
  if (obj.pedagogicalState && typeof obj.pedagogicalState === 'object') {
    if (typeof obj.pedagogicalState.message === 'string' && obj.pedagogicalState.message.trim()) {
      return obj.pedagogicalState.message.trim();
    }
  }

  return '';
}
