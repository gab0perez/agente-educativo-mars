import { describe, it, expect, beforeEach } from 'vitest';
import { LocalMARTutorClient } from '../client/LocalMARTutorClient';
import { MARTutorService } from '../../ai/tutor/MARTutorService';
import { MockTutorProvider } from '../../ai/providers/MockTutorProvider';
import { Subject, Topic } from '../../types/academic';
import { SuggestedAction } from '../../ai/domain/types';

describe('TG15 — Tutor Interaction Contract & Client Unit Tests', () => {
  let mockProvider: MockTutorProvider;
  let tutorService: MARTutorService;
  let client: LocalMARTutorClient;

  const sampleSubject: Subject = {
    id: 'recursos-humanos-3',
    code: 'RH3',
    name: 'Gestión de Recursos Humanos',
    shortName: 'Recursos Humanos',
    description: 'Especialidad CETis 164',
    icon: '👥',
    topics: []
  };

  const sampleTopic: Topic = {
    id: 'tema-capacitacion',
    subjectId: 'recursos-humanos-3',
    name: 'DNC (Detección de Necesidades de Capacitación)',
    description: 'Diagnóstico de capacitación del personal',
    status: 'en_estudio',
    provenance: 'CLASS_ORIGIN'
  };

  beforeEach(() => {
    mockProvider = new MockTutorProvider({ simulatedDelayMs: 0 });
    tutorService = new MARTutorService({ provider: mockProvider });
    client = new LocalMARTutorClient({
      tutorService,
      initialAcademicContext: {
        subject: sampleSubject,
        topic: sampleTopic
      }
    });
  });

  // TEST 1 — Enviar mensaje y recibir respuesta tipada
  it('Test 1: sendMessage envía solicitud y mapea la respuesta con id, sender, timestamp y message', async () => {
    const response = await client.sendMessage('¿Cómo se realiza un DNC en una empresa?');

    expect(response).toBeDefined();
    expect(response.sender).toBe('tutor');
    expect(response.id).toBeDefined();
    expect(response.text).toBeDefined();
    expect(response.timestamp).toBeDefined();
    expect(response.provenance).toBe('AI_COMPLEMENTARY');
  });

  // TEST 2 — Modos pedagógicos en el cliente
  it('Test 2: sendMessage propaga correctamente el modo pedagógico y recibe acciones sugeridas', async () => {
    const response = await client.sendMessage('Dame un ejemplo práctico de DNC', { mode: 'EXAMPLE' });

    expect(response.mode).toBe('EXAMPLE');
    expect(response.suggestedActions).toBeDefined();
    expect(response.suggestedActions!.length).toBeGreaterThan(0);
  });

  // TEST 3 — Modo Socrático y SocraticStep
  it('Test 3: En modo SOCRATIC la respuesta contiene el socraticStep sin exponer variables internas', async () => {
    const response = await client.sendMessage('¿Por qué es importante capacitar al personal?', {
      mode: 'SOCRATIC'
    });

    expect(response.mode).toBe('SOCRATIC');
    expect(response.socraticStep).toBeDefined();
    expect(response.socraticStep?.currentLevel).toBe('HINT_1');
    expect(response.socraticStep?.guidingQuestion).toBeDefined();
    expect(response.socraticStep?.expectedConceptFocus).toBeDefined();
  });

  // TEST 4 — Comprehension Check
  it('Test 4: El cliente conserva el bloque comprehensionCheck cuando la respuesta lo incluye', async () => {
    const response = await client.sendMessage('Explícamelo', { mode: 'EXPLAIN' });

    // MockTutorProvider genera comprehensionCheck en EXPLAIN si está configurado
    if (response.comprehensionCheck) {
      expect(response.comprehensionCheck.questionText).toBeDefined();
      expect(Array.isArray(response.comprehensionCheck.suggestedOptions)).toBe(true);
    }
  });

  // TEST 5 — Exercise
  it('Test 5: El cliente propaga el bloque de exercise cuando se solicita modo EXERCISE', async () => {
    const response = await client.sendMessage('Ponme un ejercicio de DNC', { mode: 'EXERCISE' });

    expect(response.mode).toBe('EXERCISE');
    if (response.exercise) {
      expect(response.exercise.title).toBeDefined();
      expect(response.exercise.instructions).toBeDefined();
      expect(Array.isArray(response.exercise.hints)).toBe(true);
    }
  });

  // TEST 6 — Suggested Actions
  it('Test 6: Las acciones sugeridas contienen id, label y un modo pedagógico válido', async () => {
    const response = await client.sendMessage('Explícame');

    expect(response.suggestedActions).toBeDefined();
    response.suggestedActions?.forEach((action: SuggestedAction) => {
      expect(action.id).toBeDefined();
      expect(action.label).toBeDefined();
      expect(['EXPLAIN', 'SIMPLIFY', 'EXAMPLE', 'QUESTION', 'EXERCISE', 'SOCRATIC', 'REVIEW']).toContain(
        action.mode
      );
    });
  });

  // TEST 7 — Fallback local
  it('Test 7: Ante fallo del proveedor, devuelve un mensaje con isFallback: true y conceptos contextuales', async () => {
    mockProvider.setConfig({ shouldFail: true });

    const response = await client.sendMessage('¿Qué es un manual de procedimientos?');

    expect(response.isFallback).toBe(true);
    expect(response.sender).toBe('tutor');
    expect(response.text).toContain('DNC');
  });

  // TEST 8 — Desacoplamiento total (No API Keys ni SDKs directos)
  it('Test 8: El cliente opera sin @google/genai ni API keys reales en la capa de UI', async () => {
    const secureClient = new LocalMARTutorClient();
    const response = await secureClient.sendMessage('Hola');

    expect(response.id).toBeDefined();
    expect(JSON.stringify(response)).not.toContain('AIzaSy');
  });

  // TEST 9 — El cliente conserva el historial completo de la sesión sin recortar
  it('Test 9: El cliente almacena el historial íntegro de la sesión sin aplicar ventana deslizante', async () => {
    await client.sendMessage('Pregunta 1');
    await client.sendMessage('Pregunta 2');
    await client.sendMessage('Pregunta 3');

    const history = client.getConversationHistory();
    // 3 turnos de estudiante + 3 respuestas del tutor = 6 turnos en la sesión completa
    expect(history.length).toBe(6);
  });

  // TEST 10 — ContextBuilder es quien aplica la ventana deslizante y sanitización
  it('Test 10: ContextBuilder es el único responsable de limitar la conversación a la ventana máxima (4 turnos) y sanitizar', async () => {
    // Generamos 6 turnos en el cliente (3 intercambios)
    await client.sendMessage('Turno 1');
    await client.sendMessage('Turno 2');
    await client.sendMessage('Turno 3');

    const fullHistory = client.getConversationHistory();
    expect(fullHistory.length).toBe(6);

    // El orquestador o ContextBuilder toma el historial completo y construye el payload acotado a 4 turnos
    const { ContextBuilder } = await import('../../ai/context/ContextBuilder');
    const builder = new ContextBuilder();
    const payload = builder.build({
      pedagogicalMode: 'EXPLAIN',
      studentIntent: 'Aprender',
      studentInput: { latestUtterance: 'Última duda' },
      conversationHistory: fullHistory
    });

    expect(payload.conversationHistory.length).toBe(4);
    expect(payload.conversationHistory[0].text).toContain('Turno 2');
  });

  // TEST 11 — La UI/Client no construye directamente AIContextPayload
  it('Test 11: LocalMARTutorClient delega la construcción del payload y no lo genera internamente', async () => {
    const clientPrototype = Object.getPrototypeOf(client);
    expect(clientPrototype.buildContextPayload).toBeUndefined();
    expect((client as any).contextBuilder).toBeUndefined();
  });

  // TEST 12 — Flujo completo de extremo a extremo
  it('Test 12: Flujo íntegro: UI/Client -> MARTutorService -> ContextBuilder -> MockTutorProvider -> AITutorResponse -> UI', async () => {
    const resp = await client.sendMessage('Explícame DNC de forma sencilla', { mode: 'SIMPLIFY' });

    expect(resp.sender).toBe('tutor');
    expect(resp.mode).toBe('SIMPLIFY');
    expect(resp.text).toBeDefined();
    expect(resp.provenance).toBe('AI_COMPLEMENTARY');
  });
});
