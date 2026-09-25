import { describe, it, expect, beforeEach } from 'vitest';
import { LocalMARTutorClient } from '../LocalMARTutorClient';
import { MARTutorService } from '../../../ai/tutor/MARTutorService';
import { MockTutorProvider } from '../../../ai/providers/MockTutorProvider';
import { Subject, Topic } from '../../../types/academic';

describe('TG15 — LocalMARTutorClient Unit Tests', () => {
  let mockProvider: MockTutorProvider;
  let tutorService: MARTutorService;
  let client: LocalMARTutorClient;

  const sampleSubject: Subject = {
    id: 'ciencias-3',
    code: 'CN3',
    name: 'Ciencias Naturales III',
    shortName: 'Ciencias III',
    description: 'Ciencias',
    icon: '🌱',
    topics: []
  };

  const sampleTopic: Topic = {
    id: 'tema-sinergia',
    subjectId: 'ciencias-3',
    name: 'Sinergia',
    description: 'Cooperación',
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

  it('Test 1: Envía un mensaje y devuelve una respuesta estructurada tipada para la UI', async () => {
    const response = await client.sendMessage('¿Qué es la sinergia?', { mode: 'EXPLAIN' });

    expect(response).toBeDefined();
    expect(response.sender).toBe('tutor');
    expect(response.text).toContain('Explicación');
    expect(response.mode).toBe('EXPLAIN');
    expect(response.provenance).toBe('AI_COMPLEMENTARY');
    expect(response.suggestedActions?.length).toBeGreaterThan(0);
  });

  it('Test 2: Mantiene y acumula el historial de conversación en memoria para el ContextBuilder', async () => {
    await client.sendMessage('Hola Mar', { mode: 'EXPLAIN' });
    await client.sendMessage('Dame un ejemplo', { mode: 'EXAMPLE' });

    const history = client.getConversationHistory();
    expect(history.length).toBe(4); // 2 del estudiante, 2 del tutor
    expect(history[0].role).toBe('student');
    expect(history[1].role).toBe('tutor');
    expect(history[2].role).toBe('student');
    expect(history[3].role).toBe('tutor');
  });

  it('Test 3: Permite reiniciar la sesión y limpia el historial en memoria', () => {
    const initialSessionId = client.getSessionId();
    client.resetSession();

    expect(client.getSessionId()).not.toBe(initialSessionId);
    expect(client.getConversationHistory().length).toBe(0);
  });

  it('Test 4: Permite actualizar y consultar el contexto académico activo', () => {
    expect(client.getAcademicContext().topic?.name).toBe('Sinergia');

    client.setAcademicContext({
      topic: {
        id: 'tema-ecosistemas',
        subjectId: 'ciencias-3',
        name: 'Ecosistemas',
        description: 'Redes tróficas',
        status: 'en_estudio',
        provenance: 'CLASS_ORIGIN'
      }
    });

    expect(client.getAcademicContext().topic?.name).toBe('Ecosistemas');
  });

  it('Test 5: Valida que no se envíen mensajes vacíos', async () => {
    await expect(client.sendMessage('   ')).rejects.toThrow('El mensaje no puede estar vacío');
  });

  it('Test 6: Maneja respuestas de error o fallos sin filtrar secretos en el texto del mensaje', async () => {
    mockProvider.setConfig({
      shouldFail: true,
      failureError: new Error('Error interno con clave AIzaSySecretKey999 en servidor')
    });

    // Con useFallbackOnError: false en el servicio para forzar un throw
    const strictService = new MARTutorService({
      provider: mockProvider,
      useFallbackOnError: false
    });
    const strictClient = new LocalMARTutorClient({ tutorService: strictService });

    const response = await strictClient.sendMessage('Prueba error');

    expect(response.isError).toBe(true);
    expect(response.text).not.toContain('AIzaSySecretKey999');
  });
});
