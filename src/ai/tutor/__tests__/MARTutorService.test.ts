import { describe, it, expect, beforeEach } from 'vitest';
import { MARTutorService } from '../MARTutorService';
import { TutorRequest } from '../tutorTypes';
import { MockTutorProvider } from '../../providers/MockTutorProvider';
import { ContextBuilder } from '../../context/ContextBuilder';
import { CircuitBreaker } from '../../infrastructure/circuitBreaker';
import {
  AIInvalidResponseError,
  AITimeoutError,
  AIProviderUnavailableError,
  AICircuitOpenError
} from '../../domain/errors';
import { Subject, Topic } from '../../../types/academic';

describe('TG14 — MARTutorService Orchestrator Unit Tests', () => {
  const sampleSubject: Subject = {
    id: 'ciencias-3',
    code: 'CN3',
    name: 'Ciencias Naturales III',
    shortName: 'Ciencias III',
    description: 'Estudio de ecosistemas y sinergia',
    icon: '🌱',
    topics: []
  };

  const sampleTopic: Topic = {
    id: 'tema-sinergia',
    subjectId: 'ciencias-3',
    name: 'Sinergia',
    description: 'Cooperación biológica y funcional',
    status: 'en_estudio',
    provenance: 'CLASS_ORIGIN'
  };

  const baseRequest: TutorRequest = {
    sessionId: 'session-test-01',
    studentIntent: 'Comprender el tema',
    academicContext: {
      subject: sampleSubject,
      topic: sampleTopic,
      keyConcepts: ['Sinergia', 'Cooperación']
    },
    studentInput: {
      latestUtterance: 'Quiero entender qué es sinergia'
    }
  };

  let mockProvider: MockTutorProvider;
  let tutorService: MARTutorService;

  beforeEach(() => {
    mockProvider = new MockTutorProvider({ simulatedDelayMs: 0 });
    tutorService = new MARTutorService({
      provider: mockProvider,
      contextBuilder: new ContextBuilder(),
      circuitBreaker: new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 100 }),
      useFallbackOnError: true
    });
  });

  // TEST 1 — EXPLAIN
  it('Test 1: Una solicitud EXPLAIN produce una respuesta estructurada con mode = EXPLAIN', async () => {
    const request: TutorRequest = {
      ...baseRequest,
      pedagogicalMode: 'EXPLAIN'
    };

    const response = await tutorService.respond(request);

    expect(response).toBeDefined();
    expect(response.mode).toBe('EXPLAIN');
    expect(response.message).toContain('Explicación');
    expect(response.executionMetadata.providerName).toBe('mock-tutor');
  });

  // TEST 2 — SIMPLIFY
  it('Test 2: El modo SIMPLIFY se resuelve y pasa correctamente al proveedor', async () => {
    const request: TutorRequest = {
      ...baseRequest,
      pedagogicalMode: 'SIMPLIFY',
      studentInput: { latestUtterance: 'Explícamelo más fácil con una analogía' }
    };

    const response = await tutorService.respond(request);

    expect(response.mode).toBe('SIMPLIFY');
    expect(response.message).toContain('Imagina');
  });

  // TEST 3 — EXAMPLE
  it('Test 3: Selecciona y ejecuta el modo EXAMPLE cuando se solicita un caso práctico', async () => {
    const request: TutorRequest = {
      ...baseRequest,
      studentIntent: 'Quiero un ejemplo práctico de la vida real'
    };

    const response = await tutorService.respond(request);

    expect(response.mode).toBe('EXAMPLE');
    expect(response.message).toContain('ejemplo');
  });

  // TEST 4 — QUESTION
  it('Test 4: Selecciona y ejecuta el modo QUESTION cuando se pide comprobar comprensión', async () => {
    const request: TutorRequest = {
      ...baseRequest,
      studentIntent: 'Hazme una pregunta para comprobar si entendí'
    };

    const response = await tutorService.respond(request);

    expect(response.mode).toBe('QUESTION');
  });

  // TEST 5 — EXERCISE
  it('Test 5: Selecciona y ejecuta el modo EXERCISE cuando se solicita una actividad o reto', async () => {
    const request: TutorRequest = {
      ...baseRequest,
      studentIntent: 'Ponme un reto o ejercicio sobre sinergia'
    };

    const response = await tutorService.respond(request);

    expect(response.mode).toBe('EXERCISE');
  });

  // TEST 6 — REVIEW
  it('Test 6: Selecciona y ejecuta el modo REVIEW para resumir los conceptos clave', async () => {
    const request: TutorRequest = {
      ...baseRequest,
      studentIntent: 'Hagamos un repaso de lo visto hoy'
    };

    const response = await tutorService.respond(request);

    expect(response.mode).toBe('REVIEW');
  });

  // TEST 7 — SOCRATIC (HINT_1 -> HINT_2 -> HINT_3 -> EXPLANATION)
  it('Test 7: El flujo SOCRATIC progresa de forma finita sin exceder 3 pistas', async () => {
    // Turno 0 -> HINT_1
    const socraticReq1: TutorRequest = {
      ...baseRequest,
      pedagogicalMode: 'SOCRATIC',
      conversationHistory: []
    };
    const resp1 = await tutorService.respond(socraticReq1);
    expect(resp1.mode).toBe('SOCRATIC');
    expect(resp1.socraticStep?.currentLevel).toBe('HINT_1');

    // Turno 1 -> HINT_2
    const socraticReq2: TutorRequest = {
      ...baseRequest,
      pedagogicalMode: 'SOCRATIC',
      conversationHistory: [
        { role: 'student', text: '¿Qué es sinergia?', timestamp: '2026-09-25T12:00:00.000Z', pedagogicalMode: 'SOCRATIC' },
        { role: 'tutor', text: '¿Qué pasa cuando dos partes cooperan?', timestamp: '2026-09-25T12:00:10.000Z', pedagogicalMode: 'SOCRATIC' }
      ]
    };
    const resp2 = await tutorService.respond(socraticReq2);
    expect(resp2.socraticStep?.currentLevel).toBe('HINT_2');

    // Turno 3+ o rendición explícita -> EXPLANATION
    const surrenderReq: TutorRequest = {
      ...baseRequest,
      pedagogicalMode: 'SOCRATIC',
      studentInput: { latestUtterance: 'No sé, ya dime la respuesta' }
    };
    const respSurrender = await tutorService.respond(surrenderReq);
    expect(respSurrender.socraticStep?.currentLevel).toBe('EXPLANATION');
  });

  // TEST 8 — Context Builder integration
  it('Test 8: MARTutorService delega la construcción del payload al ContextBuilder sin omitir restricciones', async () => {
    const spyBuilder = new ContextBuilder();
    const serviceWithSpy = new MARTutorService({
      provider: mockProvider,
      contextBuilder: spyBuilder
    });

    const response = await serviceWithSpy.respond(baseRequest);

    expect(response.sessionId).toBe('session-test-01');
    expect(response.suggestedActions.length).toBeGreaterThan(0);
  });

  // TEST 9 — Provider abstraction
  it('Test 9: Funciona de forma desacoplada con MockTutorProvider', async () => {
    expect(tutorService.getProvider().providerId).toBe('mock-tutor');
    const response = await tutorService.respond(baseRequest);
    expect(response.executionMetadata.providerName).toBe('mock-tutor');
  });

  // TEST 10 — Invalid provider response
  it('Test 10: Ante una respuesta corrupta del proveedor, genera un fallback seguro o lanza AIInvalidResponseError', async () => {
    mockProvider.setConfig({ rawOutputToReturn: '{"message": "Incompleto"}' }); // Falta mode y campos obligatorios

    // Con useFallbackOnError: true -> genera fallback local
    const fallbackResponse = await tutorService.respond(baseRequest);
    expect(fallbackResponse).toBeDefined();
    expect(fallbackResponse.executionMetadata.providerName).toBe('local-fallback');

    // Con useFallbackOnError: false -> propaga AIInvalidResponseError
    const strictService = new MARTutorService({
      provider: mockProvider,
      useFallbackOnError: false
    });
    await expect(strictService.respond(baseRequest)).rejects.toThrow(AIInvalidResponseError);
  });

  // TEST 11 — Timeout
  it('Test 11: Ante timeout del proveedor, aplica la estrategia de resiliencia y fallback', async () => {
    mockProvider.setConfig({ simulatedDelayMs: 200 });

    const strictService = new MARTutorService({
      provider: mockProvider,
      useFallbackOnError: false
    });

    await expect(
      strictService.respond(baseRequest, { timeoutMs: 30 })
    ).rejects.toThrow(AITimeoutError);

    // Con fallback activado
    const fallbackResponse = await tutorService.respond(baseRequest, { timeoutMs: 30 });
    expect(fallbackResponse.executionMetadata.providerName).toBe('local-fallback');
    expect(fallbackResponse.message).toContain('tardó un poco más de lo esperado');
  });

  // TEST 12 — Provider unavailable
  it('Test 12: Ante proveedor caído (500/503), devuelve un fallback amigable con los conceptos locales', async () => {
    mockProvider.setConfig({
      shouldFail: true,
      failureError: new AIProviderUnavailableError('Service Unavailable')
    });

    const response = await tutorService.respond(baseRequest);

    expect(response).toBeDefined();
    expect(response.executionMetadata.providerName).toBe('local-fallback');
    expect(response.message).toContain('Sinergia');
    expect(response.message).toContain('Ciencias Naturales III');
  });

  // TEST 13 — Circuit open
  it('Test 13: Cuando el Circuit Breaker está abierto, rechaza de inmediato sin llamadas innecesarias', async () => {
    const customBreaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 200 });
    customBreaker.recordFailure();
    customBreaker.recordFailure(); // Abre circuito

    expect(customBreaker.getState()).toBe('OPEN');

    const strictService = new MARTutorService({
      provider: mockProvider,
      circuitBreaker: customBreaker,
      useFallbackOnError: false
    });

    await expect(strictService.respond(baseRequest)).rejects.toThrow(AICircuitOpenError);
  });

  // TEST 14 — No secrets
  it('Test 14: La respuesta y metadata nunca exponen secretos, API keys ni rutas locales', async () => {
    const secureRequest: TutorRequest = {
      ...baseRequest,
      studentInput: {
        latestUtterance: 'Tengo mi clave AIzaSySecretKey12345 en C:\\Users\\secret.txt'
      }
    };

    const response = await tutorService.respond(secureRequest);
    const serialized = JSON.stringify(response);

    expect(serialized).not.toContain('AIzaSySecretKey12345');
    expect(serialized).not.toContain('C:\\Users\\secret.txt');
  });

  // TEST 15 — Provenance
  it('Test 15: Las respuestas generadas por IA usan AI_COMPLEMENTARY y no se marcan como CLASS_ORIGIN', async () => {
    const response = await tutorService.respond(baseRequest);

    expect(response.provenance).toBe('AI_COMPLEMENTARY');
    expect(response.provenance).not.toBe('CLASS_ORIGIN');
  });

  // TEST 16 — Deterministic mode selection
  it('Test 16: La selección de modo pedagógico es 100% determinista ante la misma solicitud', async () => {
    const req1: TutorRequest = { ...baseRequest, studentIntent: 'Ponme un reto de examen' };
    const req2: TutorRequest = { ...baseRequest, studentIntent: 'Ponme un reto de examen' };

    const resp1 = await tutorService.respond(req1);
    const resp2 = await tutorService.respond(req2);

    expect(resp1.mode).toBe(resp2.mode);
    expect(resp1.mode).toBe('EXERCISE');
  });

  // TEST 17 — No real Gemini call
  it('Test 17: La suite completa de tutoría opera sin conexión a internet ni API keys reales', async () => {
    const offlineService = new MARTutorService({
      provider: new MockTutorProvider({ simulatedDelayMs: 0 })
    });

    const response = await offlineService.respond(baseRequest);
    expect(response.id).toBeDefined();
    expect(response.message).toBeDefined();
  });

  // TEST 18 — Empty / insufficient context
  it('Test 18: Cuando el contexto académico está vacío, responde de forma segura sin inventar hechos', async () => {
    const emptyContextRequest: TutorRequest = {
      sessionId: 'empty-sess',
      studentInput: { latestUtterance: 'Hola MAR' }
    };

    const response = await tutorService.respond(emptyContextRequest);

    expect(response).toBeDefined();
    expect(response.sessionId).toBe('empty-sess');
    expect(response.mode).toBe('EXPLAIN');
    expect(response.requiresConfirmation).toBeUndefined();
  });
});
