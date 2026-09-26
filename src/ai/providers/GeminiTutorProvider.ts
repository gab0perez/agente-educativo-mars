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
  apiEndpoint?: string;
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
  private readonly apiEndpoint?: string;

  constructor(config: GeminiProviderConfig = {}) {
    this.apiKey = config.apiKey;
    this.modelName = config.modelName || 'gemini-3.8-flash';
    this.apiEndpoint = config.apiEndpoint || '/api/tutor';

    if (this.apiKey && this.apiKey.trim() !== '') {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  /**
   * Verifica la salud y configuración del proveedor
   */
  async checkHealth(): Promise<boolean> {
    if (this.client && this.apiKey) {
      return true;
    }
    const isBrowser = typeof window !== 'undefined' && typeof window.location !== 'undefined';
    if (isBrowser && this.apiEndpoint) {
      try {
        const res = await fetch(this.apiEndpoint, { method: 'HEAD' });
        return res.status !== 503 && res.status !== 404;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Construye las instrucciones de sistema generalistas y el contexto serializado para Gemini
   */
  private buildSystemInstruction(payload: AIContextPayload): string {
    return [
      'Eres MAR, un tutor pedagógico socrático, empático, cálido y riguroso para Mar, estudiante de 3er semestre de preparatoria técnica (CETis 164 - Especialidad en Gestión de Recursos Humanos).',
      'Tu misión es acompañar y guiar el aprendizaje de Mar tanto en sus materias del semestre (Química/Ciencias, Matemáticas, Recursos Humanos, Lengua y Comunicación, Inglés, Filosofía, Formación Socioemocional) como en cualquier otra área académica o pregunta general.',
      '',
      'DIRECTRICES PEDAGÓGICAS Y DE GENERALIZACIÓN:',
      '1. CONTEXTO ACADÉMICO COMO REFERENCIA (NO COMO RESTRICCIÓN): Si se provee información en academicContext o notesContext (apuntes o lección activa), utilízala como punto de anclaje preferente cuando la duda de Mar se relacione con dicho tema.',
      '2. LIBERTAD TEMÁTICA TOTAL: Si Mar formula una pregunta sobre otra materia, sobre un problema no cubierto en los apuntes, o sobre conocimiento general (e.g. ciencias, historia, arte, vida cotidiana), responde con total claridad, calidez y profundidad educativa, clasificando la procedencia como "AI_COMPLEMENTARY". El tema activo NUNCA debe limitar las dudas que Mar puede consultar.',
      '3. POLÍTICA DE NO INVENCIÓN: No inventes apuntes, fechas de entrega, tareas específicas de la escuela ni calificaciones escolares que no consten en el contexto provisto.',
      '4. ENFOQUE SOCRÁTICO Y GUÍA PASO A PASO: Si el modo pedagógico es SOCRATIC, no des la solución directa de inmediato a ejercicios o preguntas de tarea; formula una pregunta guía estimulante y sugiere una pista sutil en el objeto socraticStep. Para dudas conceptuales directas o explicaciones (EXPLAIN, SIMPLIFY, EXAMPLE), explica con claridad y analogías cotidianas.',
      '5. PROCEDENCIA DE CONOCIMIENTO (provenance): Asigna con rigor "CLASS_ORIGIN", "USER_PROVIDED", "AI_INFERENCE", o "AI_COMPLEMENTARY".',
      '6. FORMATO JSON OBLIGATORIO: Devuelve SIEMPRE y ÚNICAMENTE un objeto JSON con la clave principal "message" que contenga todo el texto explicativo enriquecido:',
      '{',
      '  "message": "Aquí va el texto completo de tu respuesta pedagógica en markdown cálido y claro",',
      `  "mode": "${payload.pedagogicalMode}",`,
      '  "provenance": "AI_COMPLEMENTARY",',
      '  "socraticStep": {',
      `    "currentLevel": "${payload.socraticHintLevel || 'HINT_1'}",`,
      '    "guidingQuestion": "Pregunta estimulante para el alumno",',
      '    "clue": "Pista sutil opcional",',
      '    "expectedConceptFocus": "Concepto central"',
      '  },',
      '  "suggestedActions": [',
      '    { "id": "action-1", "label": "Pregunta de seguimiento", "mode": "EXPLAIN" }',
      '  ]',
      '}',
      `7. Modo pedagógico activo: ${payload.pedagogicalMode}. Nivel socrático: ${payload.socraticHintLevel || 'HINT_1'}.`,
      '8. FORMATO DE MATEMÁTICAS Y TEXTO (SIN SINTAXIS LATEX): NO uses caracteres o delimitadores de LaTeX ($$, $, \\frac, \\sqrt, \\pm, \\rightarrow). Escribe todas las fórmulas, pasos y símbolos en texto plano y Unicode limpio (e.g. x = (-b ± √(b² - 4ac)) / (2a), x², x₁, ➔, ≠, ÷) para que se lean de forma natural, estética y clara.'
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

    // Caso 1: Ejecución directa mediante SDK con API Key configurada
    if (this.client && this.apiKey) {
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

    const isBrowser = typeof window !== 'undefined' && typeof window.location !== 'undefined';
    const isAbsoluteUrl = this.apiEndpoint?.startsWith('http://') || this.apiEndpoint?.startsWith('https://');

    // Caso 2: Ejecución a través del endpoint de backend seguro (/api/tutor) en navegador o URL absoluta
    if (typeof fetch !== 'undefined' && (isBrowser || isAbsoluteUrl) && this.apiEndpoint) {
      try {
        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            payload,
            options,
            modelName: this.modelName
          }),
          signal: options?.abortSignal
        });

        if (!response.ok) {
          let errorBody: { error?: string; message?: string } = {};
          try {
            errorBody = await response.json();
          } catch {
            // No es JSON
          }

          if (response.status === 503 || errorBody.error === 'GEMINI_API_KEY_NOT_CONFIGURED') {
            throw new AIConfigurationError(
              errorBody.message || 'El servicio Google Gemini no está configurado en el backend del servidor.'
            );
          }

          if (response.status === 401 || response.status === 403) {
            throw new AIAuthenticationError('Credenciales inválidas en el servicio de Google Gemini.');
          }

          if (response.status === 429) {
            throw new AIRateLimitError('Límite de cuota alcanzado en el servicio de Google Gemini.');
          }

          throw new AIProviderUnavailableError(
            errorBody.message || `Error en el servicio de Gemini (HTTP ${response.status}).`
          );
        }

        const resultJson = await response.json();
        const rawText = typeof resultJson === 'string' ? resultJson : JSON.stringify(resultJson.structuredData || resultJson);
        const validatedData = ResponseValidator.validate(resultJson.structuredData || resultJson);

        const durationMs = Date.now() - startTime;
        const metadata = {
          providerName: this.providerId,
          modelIdentifier: this.modelName,
          executionDurationMs: durationMs,
          timestamp: new Date().toISOString(),
          ...resultJson.metadata
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
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          throw new AINetworkError('No se pudo conectar con el endpoint de IA de MAR.', error);
        }

        throw new AIProviderUnavailableError(`Error de comunicación con el servicio de IA: ${errorMessage}`, error);
      }
    }

    // Caso 3: Sin API Key y sin endpoint accesible
    throw new AIConfigurationError(
      'El proveedor Google Gemini requiere una API key configurada en un entorno de backend seguro (/api/tutor).'
    );
  }
}


