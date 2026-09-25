import { AIContextPayload, AITutorResponse, PedagogicalMode } from '../domain/types';
import { AITutorError } from '../domain/errors';

export class FallbackStrategy {
  /**
   * Genera una respuesta pedagógica de fallback local segura, no alucinatoria y accesible
   */
  static createFallbackResponse(
    error: unknown,
    payload: AIContextPayload,
    durationMs = 0
  ): AITutorResponse {
    let friendlyMessage: string;

    if (error instanceof AITutorError) {
      friendlyMessage = error.getUserFriendlyMessage();
    } else if (error instanceof Error && error.message.includes('timeout')) {
      friendlyMessage = 'La respuesta tardó un poco más de lo esperado. ¿Quieres intentarlo de nuevo?';
    } else {
      friendlyMessage =
        'En este momento no pudimos conectar con el servicio de tutoría. Puedes repasar los conceptos clave guardados en tus lecciones mientras se restablece.';
    }

    const topicName = payload.academicContext?.topicName;
    const subjectName = payload.academicContext?.subjectName;
    const keyConcepts = payload.academicContext?.keyConcepts || [];

    let contextualTip = '';
    if (topicName && subjectName) {
      contextualTip = `\n\n📌 **Tema activo:** ${topicName} (${subjectName})`;
      if (keyConcepts.length > 0) {
        contextualTip += `\n*Conceptos clave disponibles para repasar:* ${keyConcepts.join(', ')}.`;
      }
    }

    const suggestedActions = [
      {
        id: 'action-retry',
        label: '🔄 Intentar de nuevo',
        mode: payload.pedagogicalMode
      },
      {
        id: 'action-explain',
        label: '📖 Ver concepto',
        mode: 'EXPLAIN' as PedagogicalMode
      }
    ];

    return {
      id: `fallback-${Date.now()}`,
      sessionId: payload.sessionId,
      timestamp: new Date().toISOString(),
      message: `${friendlyMessage}${contextualTip}`,
      mode: payload.pedagogicalMode,
      provenance: 'AI_COMPLEMENTARY',
      suggestedActions,
      requiresConfirmation: false,
      executionMetadata: {
        providerName: 'local-fallback',
        modelIdentifier: 'offline-fallback-v1',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        executionDurationMs: durationMs,
        timestamp: new Date().toISOString()
      }
    };
  }
}
