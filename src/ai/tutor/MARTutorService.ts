import { AITutorResponse, AIGenerationOptions } from '../domain/types';
import { IContextBuilder } from '../context/contextTypes';
import { ContextBuilder } from '../context/ContextBuilder';
import { IAITutorProvider } from '../providers/IAITutorProvider';
import { TutorProviderFactory } from '../factory/TutorProviderFactory';
import { CircuitBreaker } from '../infrastructure/circuitBreaker';
import { RetryRunner } from '../infrastructure/retryRunner';
import { ResponseValidator } from '../infrastructure/responseValidator';
import { AITutorConfig, DEFAULT_AI_CONFIG } from '../infrastructure/config';
import { IMARTutorService, MARTutorServiceDependencies, TutorRequest } from './tutorTypes';
import { PedagogicalModeEngine } from './pedagogicalModeEngine';
import { FallbackStrategy } from './fallbackStrategy';

/**
 * Servicio Orquestador Pedagógico de MAR IA
 * Coordina ContextBuilder, Motor de Modos, IAITutorProvider, ResponseValidator y CircuitBreaker
 */
export class MARTutorService implements IMARTutorService {
  private contextBuilder: IContextBuilder;
  private provider: IAITutorProvider;
  private circuitBreaker: CircuitBreaker;
  private config: AITutorConfig;
  private useFallbackOnError: boolean;

  constructor(dependencies: MARTutorServiceDependencies = {}) {
    this.config = dependencies.config || DEFAULT_AI_CONFIG;
    this.contextBuilder = dependencies.contextBuilder || new ContextBuilder();
    this.provider = dependencies.provider || TutorProviderFactory.getDefault();
    this.circuitBreaker =
      dependencies.circuitBreaker ||
      new CircuitBreaker({
        failureThreshold: this.config.circuitBreaker.failureThreshold,
        resetTimeoutMs: this.config.circuitBreaker.resetTimeoutMs
      });
    this.useFallbackOnError = dependencies.useFallbackOnError ?? true;
  }

  getProvider(): IAITutorProvider {
    return this.provider;
  }

  setProvider(provider: IAITutorProvider): void {
    this.provider = provider;
  }

  getCircuitBreaker(): CircuitBreaker {
    return this.circuitBreaker;
  }

  /**
   * Procesa una solicitud de tutoría y devuelve una respuesta estructurada y validada
   */
  async respond(request: TutorRequest, options?: AIGenerationOptions): Promise<AITutorResponse> {
    const startTime = Date.now();

    // 1. Resolver el modo pedagógico y nivel socrático de forma determinista
    const resolvedMode = PedagogicalModeEngine.resolveMode(request);
    const resolvedSocraticLevel = PedagogicalModeEngine.resolveSocraticLevel(request, resolvedMode);

    // 2. Construir el payload de contexto mínimo, sanitizado y acotado
    const payload = this.contextBuilder.build({
      ...request,
      pedagogicalMode: resolvedMode,
      socraticHintLevel: resolvedSocraticLevel
    });

    const timeoutMs = options?.timeoutMs ?? this.config.timeoutMs;
    const maxRetries = this.config.maxRetries;

    try {
      // 3. Ejecutar la llamada protegida por CircuitBreaker y RetryRunner
      const providerResult = await this.circuitBreaker.execute(() =>
        RetryRunner.runWithRetry(
          (abortSignal) =>
            this.provider.generatePedagogicalResponse(payload, {
              ...options,
              timeoutMs,
              abortSignal
            }),
          {
            timeoutMs,
            maxRetries
          }
        )
      );

      // 4. Validar estructuralmente la respuesta del proveedor con Zod
      const validatedResponse = ResponseValidator.validate(
        providerResult.structuredData || providerResult.rawText
      );

      // 5. Enriquecer metadata de ejecución
      validatedResponse.executionMetadata = {
        ...validatedResponse.executionMetadata,
        providerName: this.provider.providerId,
        executionDurationMs: Date.now() - startTime
      };

      return validatedResponse;
    } catch (error) {
      // 6. Si falla y se permite fallback, generar respuesta local estructurada y segura
      if (this.useFallbackOnError) {
        return FallbackStrategy.createFallbackResponse(
          error,
          payload,
          Date.now() - startTime
        );
      }

      // Si no se usa fallback, propagar el error tipado
      throw error;
    }
  }
}
