import { GoogleGenAI } from '@google/genai';
import { IAITutorProvider } from './IAITutorProvider';
import {
  AIContextPayload,
  AIGenerationOptions,
  AIProviderResult
} from '../domain/types';
import {
  AIAuthenticationError,
  AIConfigurationError,
  AINetworkError,
  AIProviderUnavailableError,
  AIRateLimitError,
  AITutorError
} from '../domain/errors';
import { ResponseValidator } from '../infrastructure/responseValidator';

export interface GeminiProviderConfig {
  apiKey?: string;
  modelName?: string;
}

/**
 * Adaptador oficial para Google Gemini utilizando @google/genai
 * Confinado exclusivamente dentro de este adaptador para mantener el desacoplamiento de la aplicación
 */
export class GeminiTutorProvider implements IAITutorProvider {
  readonly providerId = 'google-gemini';
  readonly version = '1.0.0';

  private client: GoogleGenAI | null = null;
  private readonly modelName: string;
  private readonly apiKey?: string;

  constructor(config: GeminiProviderConfig = {}) {
    this.apiKey = config.apiKey;
    this.modelName = config.modelName || 'gemini-2.5-flash';

    if (this.apiKey && this.apiKey.trim() !== '') {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  /**
   * Verifica la salud y configuración del proveedor
   */
  async checkHealth(): Promise<boolean> {
    if (!this.client || !this.apiKey) {
      return false;
    }
    return true;
  }

  /**
   * Construye las instrucciones de sistema y el contexto serializado para Gemini
   */
  private buildSystemInstruction(payload: AIContextPayload): string {
    return [
      'Eres MAR, un tutor pedagógico socrático, cálido y riguroso para Mar, estudiante de 3er semestre de preparatoria técnica (CETis 164 - Especialidad en Gestión de Recursos Humanos).',
      'Tu misión es guiar el aprendizaje de Mar utilizando el contexto de sus materias y sus apuntes de clase.',
      'REGLAS OBLIGATORIAS:',
      '1. No inventes contenido de apuntes, fechas, tareas ni calificaciones que no figuren en el contexto académico provisto.',
      '2. Si el modo es SOCRATIC, no entregues la respuesta directa de inmediato; haz una pregunta guía y sugiere una pista sutil en el objeto socraticStep.',
      '3. Devuelve SIEMPRE y ÚNICAMENTE una respuesta en formato JSON estrictamente válido que cumpla con el esquema AITutorResponse.',
      `4. Modo pedagógico activo: ${payload.pedagogicalMode}. Nivel socrático: ${payload.socraticHintLevel || 'HINT_1'}.`
    ].join('\n');
  }

  private buildUserPrompt(payload: AIContextPayload): string {
    return JSON.stringify({
      sessionId: payload.sessionId,
      studentIntent: payload.studentIntent,
      pedagogicalMode: payload.pedagogicalMode,
      socraticHintLevel: payload.socraticHintLevel,
      academicContext: payload.academicContext,
      notesContext: payload.notesContext,
      studentInput: payload.studentInput,
      conversationHistory: payload.conversationHistory
    }, null, 2);
  }

  async generatePedagogicalResponse(
    payload: AIContextPayload,
    options?: AIGenerationOptions
  ): Promise<AIProviderResult> {
    const startTime = Date.now();

    if (!this.client || !this.apiKey) {
      throw new AIConfigurationError(
        'El proveedor Google Gemini requiere una API key configurada en un entorno de backend seguro. Por seguridad, la ejecución directa desde frontend sin backend está deshabilitada.'
      );
    }

    try {
      const systemInstruction = this.buildSystemInstruction(payload);
      const userPrompt = this.buildUserPrompt(payload);

      // Ensamble de partes de contenido (texto + imagen si existe)
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: userPrompt }
      ];

      if (payload.visualContext?.base64Data) {
        parts.push({
          inlineData: {
            mimeType: payload.visualContext.mimeType,
            data: payload.visualContext.base64Data
          }
        });
      }

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: [
          {
            role: 'user',
            parts
          }
        ],
        config: {
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          responseMimeType: 'application/json',
          temperature: options?.temperature ?? 0.3,
          maxOutputTokens: options?.maxOutputTokens ?? 1024
        }
      });

      const rawText = response.text || '';
      if (!rawText.trim()) {
        throw new AIProviderUnavailableError('El modelo Gemini devolvió una respuesta vacía.');
      }

      // Validar que la respuesta cumpla con el esquema estructurado
      const validatedData = ResponseValidator.validate(rawText);

      const durationMs = Date.now() - startTime;
      const metadata = {
        providerName: this.providerId,
        modelIdentifier: this.modelName,
        promptTokens: response.usageMetadata?.promptTokenCount,
        completionTokens: response.usageMetadata?.candidatesTokenCount,
        totalTokens: response.usageMetadata?.totalTokenCount,
        executionDurationMs: durationMs,
        timestamp: new Date().toISOString()
      };

      validatedData.executionMetadata = metadata;

      return {
        rawText,
        structuredData: validatedData,
        metadata
      };
    } catch (error) {
      if (error instanceof AITutorError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      const lower = errorMessage.toLowerCase();

      if (lower.includes('api_key') || lower.includes('unauthenticated') || lower.includes('401') || lower.includes('403')) {
        throw new AIAuthenticationError('Error de autenticación con la API de Google Gemini.', error);
      }

      if (lower.includes('quota') || lower.includes('resource_exhausted') || lower.includes('429')) {
        throw new AIRateLimitError('Se ha alcanzado el límite de cuota en Google Gemini.', error);
      }

      if (lower.includes('network') || lower.includes('fetch') || lower.includes('econnrefused')) {
        throw new AINetworkError('Error de red al comunicarse con el endpoint de Google Gemini.', error);
      }

      throw new AIProviderUnavailableError(`Fallo en el servicio de Google Gemini: ${errorMessage}`, error);
    }
  }
}
