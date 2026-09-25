import { IAITutorProvider } from './IAITutorProvider';
import {
  AIContextPayload,
  AIGenerationOptions,
  AIProviderResult,
  AITutorResponse
} from '../domain/types';
import { AIUnreadableImageError } from '../domain/errors';

export interface MockTutorProviderConfig {
  simulatedDelayMs?: number;
  shouldFail?: boolean;
  failureError?: Error;
  simulateUnreadableImage?: boolean;
  customResponse?: Partial<AITutorResponse>;
  rawOutputToReturn?: string; // Para probar errores de validación de JSON
}

/**
 * Proveedor de pruebas determinista y 100% offline para MAR IA
 */
export class MockTutorProvider implements IAITutorProvider {
  readonly providerId = 'mock-tutor';
  readonly version = '1.0.0';

  private config: MockTutorProviderConfig;

  constructor(config: MockTutorProviderConfig = {}) {
    this.config = config;
  }

  setConfig(newConfig: Partial<MockTutorProviderConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  async checkHealth(): Promise<boolean> {
    if (this.config.shouldFail) {
      return false;
    }
    return true;
  }

  async generatePedagogicalResponse(
    payload: AIContextPayload,
    options?: AIGenerationOptions
  ): Promise<AIProviderResult> {
    const startTime = Date.now();

    const delay = options?.timeoutMs
      ? Math.min(this.config.simulatedDelayMs ?? 50, options.timeoutMs)
      : this.config.simulatedDelayMs ?? 50;

    if (delay > 0) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, delay);
        if (options?.abortSignal) {
          options.abortSignal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new Error('AbortError: La petición fue cancelada.'));
          });
        }
      });
    }

    if (this.config.shouldFail) {
      throw this.config.failureError || new Error('Simulated Mock Provider Failure');
    }

    if (this.config.simulateUnreadableImage || payload.visualContext?.isUnreadable) {
      throw new AIUnreadableImageError();
    }

    // Si se especificó una salida cruda específica (por ejemplo para pruebas de validación)
    if (this.config.rawOutputToReturn !== undefined) {
      return {
        rawText: this.config.rawOutputToReturn,
        metadata: {
          providerName: this.providerId,
          modelIdentifier: 'mock-model-v1',
          executionDurationMs: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };
    }

    const topicName = payload.academicContext.topicName || 'el tema actual';
    const subjectName = payload.academicContext.subjectName || 'la materia';
    const mode = payload.pedagogicalMode;
    const hasVisual = !!payload.visualContext;
    const noteTitle = payload.visualContext?.title || 'tu apunte';

    let message = hasVisual
      ? `¡Hola, Mar! 🌸 He recibido la fotografía de tu apunte **${noteTitle}** (${topicName}).`
      : `¡Hola, Mar! 🌸 Estudiemos juntos **${topicName}** (${subjectName}).`;
    let socraticStep = undefined;

    if (mode === 'SOCRATIC') {
      const level = payload.socraticHintLevel || 'HINT_1';
      socraticStep = {
        currentLevel: level,
        guidingQuestion: hasVisual
          ? `Observando tu apunte "${noteTitle}", ¿cuál es el concepto central que anotaste sobre ${topicName}?`
          : `¿Qué sucede cuando dos elementos cooperan para lograr un resultado mayor en ${topicName}?`,
        clue: hasVisual
          ? 'Revisa los términos destacados en la parte superior de tu fotografía.'
          : 'Piensa en cómo el trabajo en equipo supera el esfuerzo individual.',
        expectedConceptFocus: hasVisual ? 'análisis del apunte' : 'cooperación sinérgica'
      };
      message = hasVisual
        ? `He revisado tu apunte **${noteTitle}**. Vamos a razonarlo paso a paso, Mar: ${socraticStep.guidingQuestion}`
        : `Vamos a razonarlo paso a paso, Mar: ${socraticStep.guidingQuestion}`;
    } else if (mode === 'EXPLAIN') {
      message = hasVisual
        ? `**Análisis de tu apunte (${noteTitle}):**\nEn la fotografía de tus notas se identifican los conceptos clave de **${topicName}**. En ${subjectName}, esto representa un proceso estructurado para coordinar recursos de manera efectiva.`
        : `**Explicación de ${topicName}:**\nEs un proceso fundamental donde los componentes interactúan de manera coordinada para potenciar su efectividad en ${subjectName}.`;
    } else if (mode === 'SIMPLIFY') {
      message = hasVisual
        ? `En tu apunte **${noteTitle}** tienes anotada la idea principal de **${topicName}**. Imagínalo como organizar una tarea en equipo donde 1 + 1 da mucho más que 2.`
        : `Imagina que estás organizando un evento: si cada persona trabaja sola toma 10 horas, pero coordinadas lo logran en 3 horas con mejor resultado. ¡Eso es **${topicName}**!`;
    } else if (mode === 'EXAMPLE') {
      message = hasVisual
        ? `Tomando como base lo que anotaste en **${noteTitle}**, un ejemplo práctico en Recursos Humanos es cuando dos departamentos se integran para optimizar un proceso de reclutamiento.`
        : `Un ejemplo clásico de **${topicName}** en Recursos Humanos es cuando un equipo multidisciplinario resuelve una contingencia laboral combinando habilidades legales y psicológicas.`;
    } else if (mode === 'REVIEW' || payload.studentInput?.studentReflection) {
      const reflectionText = (
        payload.studentInput?.studentReflection ||
        payload.studentInput?.latestUtterance ||
        ''
      ).toLowerCase();

      if (
        reflectionText.includes('duda') ||
        reflectionText.includes('no entend') ||
        reflectionText.includes('confuso') ||
        reflectionText.includes('difícil') ||
        reflectionText.includes('dificil') ||
        reflectionText.includes('no sé') ||
        reflectionText.includes('no se') ||
        reflectionText.includes('cuesta')
      ) {
        // Caso 3: Reflexión que expresa duda
        message = `🌸 Es completamente normal tener dudas al principio, Mar. Identificar qué parte se te dificulta es un gran paso. En **${topicName}**, lo más importante es recordar la idea central. ¿Te gustaría que lo repasemos juntos con calma?`;
      } else if (
        reflectionText.includes('parte') ||
        reflectionText.includes('mas o menos') ||
        reflectionText.includes('más o menos') ||
        reflectionText.includes('un poco') ||
        reflectionText.includes('casi') ||
        reflectionText.includes('creo que')
      ) {
        // Caso 2: Reflexión parcialmente clara
        message = `🌸 Vas por una muy buena idea, Mar. Explicaste parte del concepto con tus propias palabras. Hay un detalle importante sobre **${topicName}** que podemos profundizar cuando gustes. ¿Te gustaría ver un ejemplo cotidiano para aterrizarlo?`;
      } else {
        // Caso 1: Reflexión clara
        message = `🌸 ¡Excelente reflexión, Mar! Explicaste la idea principal de **${topicName}** con tus propias palabras. Conectar lo que aprendiste fortalece tu comprensión. Ahora intenta pensar en cómo aplicarías esto en una situación real.`;
      }
    }

    const structuredData: AITutorResponse = {
      id: `mock-resp-${Date.now()}`,
      sessionId: payload.sessionId,
      timestamp: new Date().toISOString(),
      message,
      mode,
      provenance: hasVisual ? 'AI_INFERENCE' : 'AI_COMPLEMENTARY',
      socraticStep,
      suggestedActions: [
        {
          id: 'action-example',
          label: '💡 Dame un ejemplo',
          mode: 'EXAMPLE'
        },
        {
          id: 'action-simplify',
          label: '🌱 Explícamelo más fácil',
          mode: 'SIMPLIFY'
        },
        {
          id: 'action-exercise',
          label: '✍️ Ponme un ejercicio',
          mode: 'EXERCISE'
        }
      ],
      executionMetadata: {
        providerName: this.providerId,
        modelIdentifier: 'mock-model-v1',
        promptTokens: hasVisual ? 180 : 120,
        completionTokens: 85,
        totalTokens: hasVisual ? 265 : 205,
        executionDurationMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      },
      ...this.config.customResponse
    };

    return {
      rawText: JSON.stringify(structuredData),
      structuredData,
      metadata: structuredData.executionMetadata
    };
  }
}
