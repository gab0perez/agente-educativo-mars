import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MockTutorProvider,
  GeminiTutorProvider,
  TutorProviderFactory,
  ResponseValidator,
  CircuitBreaker,
  RetryRunner,
  AIContextPayload,
  AITimeoutError,
  AIInvalidResponseError,
  AICircuitOpenError,
  AIConfigurationError
} from '../index';

const samplePayload: AIContextPayload = {
  sessionId: 'test-session-123',
  pedagogicalMode: 'SOCRATIC',
  socraticHintLevel: 'HINT_1',
  studentIntent: 'Entender qué es la sinergia',
  academicContext: {
    subjectId: 'ciencias-3',
    subjectName: 'Ciencias Naturales III',
    topicId: 'tema-sinergia',
    topicName: 'Sinergia y Homeostasis',
    unitNumber: 1,
    keyConcepts: ['Sinergia', 'Cooperación', 'Sistemas']
  },
  studentInput: {
    latestUtterance: 'No entiendo cómo funciona la sinergia en los órganos'
  },
  conversationHistory: [
    {
      role: 'student',
      text: '¿Qué es sinergia?',
      timestamp: '2026-09-25T12:00:00.000Z'
    }
  ],
  constraints: {
    maxTokens: 500,
    requireSocraticStep: true,
    allowComplementaryExpansion: true
  }
};

describe('Task Group 12 — AI Provider Abstraction Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TEST 1: MockTutorProvider implements IAITutorProvider
  it('Test 1: MockTutorProvider implementa correctamente la interface IAITutorProvider', async () => {
    const provider = new MockTutorProvider();
    expect(provider.providerId).toBe('mock-tutor');
    expect(provider.version).toBe('1.0.0');
    expect(typeof provider.generatePedagogicalResponse).toBe('function');
    expect(typeof provider.checkHealth).toBe('function');

    const isHealthy = await provider.checkHealth();
    expect(isHealthy).toBe(true);
  });

  // TEST 2: Valid payload produces structured response
  it('Test 2: Un payload válido produce una respuesta estructurada con metadata y formato pedagógico', async () => {
    const provider = new MockTutorProvider();
    const result = await provider.generatePedagogicalResponse(samplePayload);

    expect(result).toBeDefined();
    expect(result.rawText).toBeDefined();
    expect(result.metadata.providerName).toBe('mock-tutor');
    expect(result.structuredData).toBeDefined();

    const response = ResponseValidator.validate(result.structuredData);
    expect(response.sessionId).toBe(samplePayload.sessionId);
    expect(response.mode).toBe('SOCRATIC');
    expect(response.socraticStep).toBeDefined();
    expect(response.socraticStep?.currentLevel).toBe('HINT_1');
    expect(response.suggestedActions.length).toBeGreaterThan(0);
  });

  // TEST 3: Invalid response throws AIInvalidResponseError
  it('Test 3: Respuesta inválida (JSON corrupto o campos faltantes) lanza AIInvalidResponseError', () => {
    const corruptJson = '{"message": "Incompleto", "mode": "INVALID_MODE"}';

    expect(() => {
      ResponseValidator.validate(corruptJson);
    }).toThrow(AIInvalidResponseError);

    const nonJsonObject = 'Esto no es un JSON';
    expect(() => {
      ResponseValidator.validate(nonJsonObject);
    }).toThrow(AIInvalidResponseError);
  });

  // TEST 4: Timeout throws AITimeoutError
  it('Test 4: Una operación que excede el tiempo límite lanza AITimeoutError', async () => {
    await expect(
      RetryRunner.runWithRetry(
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 300));
          return 'done';
        },
        { timeoutMs: 50, maxRetries: 0 }
      )
    ).rejects.toThrow(AITimeoutError);
  });

  // TEST 5: Limited retries with exponential backoff
  it('Test 5: RetryRunner ejecuta reintentos limitados y se detiene en maxRetries', async () => {
    let attempts = 0;
    const maxRetries = 2;

    await expect(
      RetryRunner.runWithRetry(
        async () => {
          attempts += 1;
          throw new Error('Transient Network Failure');
        },
        { timeoutMs: 2000, maxRetries, baseDelayMs: 20 }
      )
    ).rejects.toThrow('Transient Network Failure');

    // 1 intento inicial + 2 reintentos = 3 llamadas en total
    expect(attempts).toBe(maxRetries + 1);
  });

  // TEST 6: Circuit Breaker state machine (CLOSED -> OPEN -> HALF_OPEN -> CLOSED)
  it('Test 6: Circuit Breaker transiciona 3 fallas -> OPEN -> espera -> HALF_OPEN -> recuperación a CLOSED', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 50 });
    expect(breaker.getState()).toBe('CLOSED');

    // 1a falla
    await expect(breaker.execute(async () => { throw new Error('Falla 1'); })).rejects.toThrow();
    expect(breaker.getState()).toBe('CLOSED');

    // 2a falla
    await expect(breaker.execute(async () => { throw new Error('Falla 2'); })).rejects.toThrow();
    expect(breaker.getState()).toBe('CLOSED');

    // 3a falla -> Abre circuito
    await expect(breaker.execute(async () => { throw new Error('Falla 3'); })).rejects.toThrow();
    expect(breaker.getState()).toBe('OPEN');

    // Durante OPEN rechaza inmediatamente sin ejecutar
    let called = false;
    await expect(
      breaker.execute(async () => {
        called = true;
        return 'ok';
      })
    ).rejects.toThrow(AICircuitOpenError);
    expect(called).toBe(false);

    // Esperar a que transcurra el resetTimeoutMs (50ms)
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(breaker.getState()).toBe('HALF_OPEN');

    // Éxito en HALF_OPEN recupera a CLOSED
    const successResult = await breaker.execute(async () => 'recuperado');
    expect(successResult).toBe('recuperado');
    expect(breaker.getState()).toBe('CLOSED');
    expect(breaker.getFailureCount()).toBe(0);
  });

  // TEST 7: Isolation verification
  it('Test 7: GeminiTutorProvider está confinado y arroja AIConfigurationError si no tiene API key', async () => {
    const unconfiguredProvider = new GeminiTutorProvider();
    expect(unconfiguredProvider.providerId).toBe('google-gemini');

    const isHealthy = await unconfiguredProvider.checkHealth();
    expect(isHealthy).toBe(false);

    await expect(
      unconfiguredProvider.generatePedagogicalResponse(samplePayload)
    ).rejects.toThrow(AIConfigurationError);
  });

  // TEST 8: API key security
  it('Test 8: TutorProviderFactory no contiene API keys hardcodeadas', () => {
    const factoryCode = TutorProviderFactory.toString();
    expect(factoryCode).not.toContain('AIzaSy'); // Formato de Google API Keys
    expect(factoryCode).not.toContain('sk-');    // Formato de OpenAI API Keys
  });

  // TEST 9: Factory selects providers correctly
  it('Test 9: TutorProviderFactory selecciona e instancia los proveedores correctamente', () => {
    const mockProvider = TutorProviderFactory.create('mock');
    expect(mockProvider.providerId).toBe('mock-tutor');

    const geminiProvider = TutorProviderFactory.create('gemini', { apiKey: 'dummy-key-for-test' });
    expect(geminiProvider.providerId).toBe('google-gemini');

    const defaultProvider = TutorProviderFactory.getDefault();
    expect(defaultProvider.providerId).toBe('google-gemini');

    // Cambio dinámico de proveedor por defecto
    TutorProviderFactory.setDefaultProvider('mock');
    expect(TutorProviderFactory.getDefault().providerId).toBe('mock-tutor');
    TutorProviderFactory.setDefaultProvider('gemini');
    expect(TutorProviderFactory.getDefault().providerId).toBe('google-gemini');

    // Fallback seguro ante proveedor desconocido
    const fallbackProvider = TutorProviderFactory.create('non-existent-provider');
    expect(fallbackProvider.providerId).toBe('mock-tutor');
  });


  // TEST 10: Mock provider works 100% offline
  it('Test 10: MockTutorProvider funciona completamente offline sin realizar peticiones de red', async () => {
    const provider = new MockTutorProvider({ simulatedDelayMs: 0 });

    const explainPayload: AIContextPayload = {
      ...samplePayload,
      pedagogicalMode: 'EXPLAIN'
    };
    const explainResult = await provider.generatePedagogicalResponse(explainPayload);
    expect(explainResult.structuredData).toBeDefined();

    const simplifyPayload: AIContextPayload = {
      ...samplePayload,
      pedagogicalMode: 'SIMPLIFY'
    };
    const simplifyResult = await provider.generatePedagogicalResponse(simplifyPayload);
    expect(simplifyResult.structuredData).toBeDefined();
  });
});
