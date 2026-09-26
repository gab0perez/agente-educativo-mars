import { describe, it, expect, beforeEach } from 'vitest';
import { LocalMARTutorClient } from '../client/LocalMARTutorClient';
import { MARTutorService } from '../../ai/tutor/MARTutorService';
import { MockTutorProvider } from '../../ai/providers/MockTutorProvider';
import { GeminiTutorProvider } from '../../ai/providers/GeminiTutorProvider';
import { TutorProviderFactory } from '../../ai/factory/TutorProviderFactory';
import { AIContextPayload, AITutorResponse } from '../../ai/domain/types';
import { initializeLocalStorage } from '../../repositories';

describe('TG28 — General Tutor & Cross-Subject Integration Tests', () => {
  let mockProvider: MockTutorProvider;
  let tutorService: MARTutorService;
  let client: LocalMARTutorClient;

  beforeEach(() => {
    initializeLocalStorage();
    mockProvider = new MockTutorProvider({ simulatedDelayMs: 0 });
    tutorService = new MARTutorService({ provider: mockProvider });
    client = new LocalMARTutorClient({ tutorService });
  });


  // TEST 1: General Tutor without forced default topic
  it('Test 1: Al iniciar Tutor General sin selección previa, no se inyecta artificialmente Ciencias/Sinergia', () => {
    const generalClient = new LocalMARTutorClient({ tutorService });
    const context = generalClient.getAcademicContext();

    expect(context.subject).toBeUndefined();
    expect(context.topic).toBeUndefined();
    expect(context.lesson).toBeUndefined();
    expect(context.activeNoteId).toBeUndefined();
  });

  // TEST 2: Preserves real user academic selection when provided
  it('Test 2: Preserva fielmente la selección académica real cuando el usuario la selecciona explícitamente', () => {
    const contextualClient = new LocalMARTutorClient({
      tutorService,
      initialSelection: {
        subjectId: 'matematicas-3',
        topicId: 'linea-recta'
      }
    });

    const context = contextualClient.getAcademicContext();
    expect(context.subject?.id).toBe('matematicas-3');
    expect(context.topic?.id).toBe('linea-recta');
    expect(context.topic?.name).toBe('Ecuación de la Recta y Pendiente');
  });

  // TEST 3: General Question - Context does not restrict query
  it('Test 3: Pregunta general ("¿Por qué el cielo es azul?") con contexto de Química recibe respuesta sin error ni bloqueo', async () => {
    const chemistryClient = new LocalMARTutorClient({
      tutorService,
      initialSelection: {
        subjectId: 'ciencias-3',
        topicId: 'sinergia'
      }
    });

    const response = await chemistryClient.sendMessage('¿Por qué el cielo es azul?');
    expect(response).toBeDefined();
    expect(response.isError).toBeFalsy();
    expect(response.text).toBeDefined();
    expect(response.provenance).toBeDefined();

    // El historial debe contener el turno del estudiante con el texto exacto
    const history = chemistryClient.getConversationHistory();
    expect(history.length).toBe(2);
    expect(history[0].text).toBe('¿Por qué el cielo es azul?');
    expect(history[0].role).toBe('student');
    expect(history[1].role).toBe('tutor');
  });

  // TEST 4: Cross-subject Question - Math question inside Chemistry context
  it('Test 4: Pregunta de Matemáticas ("¿Qué es una función cuadrática?") dentro de contexto de Química', async () => {
    const customResponse: Partial<AITutorResponse> = {
      message: 'Una función cuadrática es una función polinómica de segundo grado con la forma f(x) = ax² + bx + c.',
      mode: 'EXPLAIN',
      provenance: 'AI_COMPLEMENTARY'
    };

    const flexibleProvider = new MockTutorProvider({
      simulatedDelayMs: 0,
      customResponse
    });

    const flexibleService = new MARTutorService({ provider: flexibleProvider });
    const flexibleClient = new LocalMARTutorClient({
      tutorService: flexibleService,
      initialSelection: {
        subjectId: 'ciencias-3',
        topicId: 'sinergia'
      }
    });

    const response = await flexibleClient.sendMessage('¿Qué es una función cuadrática?');
    expect(response.text).toContain('función cuadrática');
    expect(response.text).not.toContain('La sinergia...');
    expect(response.provenance).toBe('AI_COMPLEMENTARY');
  });

  // TEST 5: Conversation History & Follow-ups
  it('Test 5: Pregunta de seguimiento conserva el historial conversacional y adapta el modo', async () => {
    // Turno 1
    await client.sendMessage('¿Qué es la fotosíntesis?');
    expect(client.getConversationHistory().length).toBe(2);

    // Turno 2: Pregunta de seguimiento
    const response2 = await client.sendMessage('No entendí, ¿me lo explicas más fácil?', {
      mode: 'SIMPLIFY'
    });

    expect(response2.mode).toBe('SIMPLIFY');
    const history = client.getConversationHistory();
    expect(history.length).toBe(4);
    expect(history[2].text).toBe('No entendí, ¿me lo explicas más fácil?');
    expect(history[2].pedagogicalMode).toBe('SIMPLIFY');
  });

  // TEST 6: Topic Switch within same session
  it('Test 6: Cambio dinámico de tema actualiza el contexto académico sin corromper la sesión', async () => {
    client.setAcademicSelection({
      subjectId: 'rh-induccion',
      topicId: 'socializacion-organizacional'
    });

    let ctx = client.getAcademicContext();
    expect(ctx.subject?.id).toBe('rh-induccion');
    expect(ctx.topic?.id).toBe('socializacion-organizacional');

    await client.sendMessage('¿Cuáles son las fases de la socialización laboral?');

    // Cambiar a otra materia
    client.setAcademicSelection({
      subjectId: 'ingles-3',
      topicId: 'past-continuous'
    });

    ctx = client.getAcademicContext();
    expect(ctx.subject?.id).toBe('ingles-3');
    expect(ctx.topic?.id).toBe('past-continuous');

    const resp = await client.sendMessage('How do I use past continuous?');
    expect(resp.isError).toBeFalsy();
  });

  // TEST 7: Gemini Provider Generalist Prompt Builder
  it('Test 7: GeminiTutorProvider genera system instructions generalistas con directrices de no restricción', async () => {
    const gemini = new GeminiTutorProvider({
      apiKey: 'dummy-key-for-test-prompt-builder'
    });

    const payload: AIContextPayload = {
      sessionId: 'test-session',
      pedagogicalMode: 'SOCRATIC',
      socraticHintLevel: 'HINT_1',
      studentIntent: 'Aprender sobre ecuaciones',
      academicContext: {
        subjectName: 'Ciencias Naturales III',
        topicName: 'Concepto de Sinergia'
      },
      studentInput: {
        latestUtterance: '¿Cómo resuelvo una ecuación cuadrática?'
      },
      conversationHistory: [],
      constraints: {
        maxTokens: 1024,
        requireSocraticStep: true,
        allowComplementaryExpansion: true
      }
    };

    // Acceder al método privado mediante cast para verificar el contenido de las instrucciones
    const systemPrompt = (gemini as any).buildSystemInstruction(payload);

    expect(systemPrompt).toContain('LIBERTAD TEMÁTICA TOTAL');
    expect(systemPrompt).toContain('CONTEXTO ACADÉMICO COMO REFERENCIA');
    expect(systemPrompt).toContain('AI_COMPLEMENTARY');
    expect(systemPrompt).toContain('El tema activo NUNCA debe limitar las dudas');
  });

  // TEST 8: Explicit Fallback Transparency (No faking Gemini as Mock)
  it('Test 8: Cuando Gemini está configurado pero no tiene API Key, MARTutorService devuelve fallback explícito sin fingir éxito', async () => {
    const unconfiguredGemini = new GeminiTutorProvider({});
    const serviceWithGemini = new MARTutorService({
      provider: unconfiguredGemini,
      useFallbackOnError: true
    });

    const clientWithGemini = new LocalMARTutorClient({ tutorService: serviceWithGemini });
    const response = await clientWithGemini.sendMessage('¿Qué es un átomo?');

    // Debe ser una respuesta de fallback segura y transparente
    expect(response.isFallback).toBe(true);
    expect(response.rawResponse?.executionMetadata.providerName).toBe('local-fallback');
    expect(response.text).toContain('El tutor no está configurado adecuadamente');
  });




  // TEST 9: Provider Factory selection
  it('Test 9: TutorProviderFactory permite seleccionar gemini o mock explícitamente', () => {
    const geminiInst = TutorProviderFactory.create('gemini', { apiKey: 'dummy-key' });
    expect(geminiInst.providerId).toBe('google-gemini');

    const mockInst = TutorProviderFactory.create('mock');
    expect(mockInst.providerId).toBe('mock-tutor');
  });
});
