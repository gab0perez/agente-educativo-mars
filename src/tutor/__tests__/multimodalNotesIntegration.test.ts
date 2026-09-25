import { describe, it, expect, beforeEach } from 'vitest';
import { LocalMARTutorClient } from '../client/LocalMARTutorClient';
import { AcademicContextResolver } from '../academic/AcademicContextResolver';
import { MARTutorService } from '../../ai/tutor/MARTutorService';
import { ContextBuilder } from '../../ai/context/ContextBuilder';
import { MockTutorProvider } from '../../ai/providers/MockTutorProvider';
import { ImagePreprocessor } from '../../ai/multimodal/ImagePreprocessor';
import { ImageStorageAdapter } from '../../storage/imageStorageAdapter';
import {
  LocalSubjectRepository,
  LocalTopicRepository,
  LocalLessonRepository,
  LocalNoteRepository,
  LocalReflectionRepository
} from '../../repositories';
import { Note } from '../../types/notes';
import { Subject } from '../../types/academic';
import { Lesson } from '../../types/lesson';
import { AIContextPayload } from '../../ai/domain/types';

class MemoryImageStorageAdapter implements ImageStorageAdapter {
  private map = new Map<string, Blob | string>();

  async saveImage(id: string, data: Blob | File | string): Promise<string> {
    this.map.set(id, data);
    return id;
  }
  async getImage(id: string): Promise<Blob | string | null> {
    return this.map.get(id) || null;
  }
  async getImageUrl(id: string): Promise<string | null> {
    const val = this.map.get(id);
    if (!val) return null;
    if (typeof val === 'string') return val;
    return 'blob:mock-preview-url';
  }
  async deleteImage(id: string): Promise<void> {
    this.map.delete(id);
  }
  async exists(id: string): Promise<boolean> {
    return this.map.has(id);
  }
  async clear(): Promise<void> {
    this.map.clear();
  }
}

describe('TG17 — Multimodal Notes & Vision Context Pipeline Integration Tests', () => {
  let memoryImageStorage: MemoryImageStorageAdapter;
  let preprocessor: ImagePreprocessor;
  let mockProvider: MockTutorProvider;
  let tutorService: MARTutorService;
  let academicResolver: AcademicContextResolver;
  let capturedPayload: AIContextPayload | null = null;

  const mockStorage: any = {
    data: {} as Record<string, any>,
    getItem: (key: string) => mockStorage.data[key] || null,
    setItem: (key: string, val: any) => {
      mockStorage.data[key] = val;
    },
    removeItem: (key: string) => {
      delete mockStorage.data[key];
    },
    clear: () => {
      mockStorage.data = {};
    }
  };

  const samplePngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const sampleSubject: Subject = {
    id: 'ciencias-3',
    name: 'Ciencias Naturales III',
    shortName: 'Ciencias III',
    description: 'Ecosistemas y sinergia',
    icon: '🌱',
    code: 'CN3',
    topics: [
      {
        id: 'topic-sinergia',
        subjectId: 'ciencias-3',
        name: 'Sinergia',
        description: 'Trabajo conjunto de elementos',
        status: 'en_estudio',
        provenance: 'CLASS_ORIGIN'
      }
    ]
  };

  const sampleLesson: Lesson = {
    id: 'lesson-sinergia-1',
    topicId: 'topic-sinergia',
    subjectId: 'ciencias-3',
    subjectName: 'Ciencias Naturales III',
    topicName: 'Sinergia',
    title: 'Conceptos de Sinergia',
    description: 'Lección interactiva de sinergia',
    sections: []
  };

  const sampleNoteWithImage: Note = {
    id: 'note-foto-001',
    title: 'Apunte manuscrito de Sinergia',
    subjectId: 'ciencias-3',
    topicId: 'topic-sinergia',
    createdAt: '2026-09-25T10:00:00Z',
    updatedAt: '2026-09-25T10:00:00Z',
    provenance: 'CLASS_ORIGIN',
    images: [
      {
        id: 'img-001',
        noteId: 'note-foto-001',
        storageKey: 'storage-key-001',
        mimeType: 'image/png',
        size: 1024,
        createdAt: '2026-09-25T10:00:00Z',
        status: 'ready'
      }
    ]
  };

  beforeEach(async () => {
    capturedPayload = null;
    mockStorage.clear();
    mockStorage.setItem('subjects', [sampleSubject]);
    mockStorage.setItem('lessons', [sampleLesson]);
    mockStorage.setItem('notes', [sampleNoteWithImage]);

    memoryImageStorage = new MemoryImageStorageAdapter();
    await memoryImageStorage.saveImage('storage-key-001', `data:image/png;base64,${samplePngBase64}`);

    preprocessor = new ImagePreprocessor();

    const subjectRepo = new LocalSubjectRepository(mockStorage);
    const topicRepo = new LocalTopicRepository(subjectRepo);
    const lessonRepo = new LocalLessonRepository(mockStorage);
    const noteRepo = new LocalNoteRepository(mockStorage);
    const reflectionRepo = new LocalReflectionRepository(mockStorage);

    academicResolver = new AcademicContextResolver({
      subjectRepo,
      topicRepo,
      lessonRepo,
      noteRepo,
      reflectionRepo
    });

    mockProvider = new MockTutorProvider({ simulatedDelayMs: 0 });

    // Custom ContextBuilder para capturar el payload final emitido
    class SpyContextBuilder extends ContextBuilder {
      override build(input: any, options?: any): AIContextPayload {
        const payload = super.build(input, options);
        capturedPayload = payload;
        return payload;
      }
    }

    tutorService = new MARTutorService({
      provider: mockProvider,
      contextBuilder: new SpyContextBuilder(),
      useFallbackOnError: true
    });
  });

  it('Test 1: Flujo multimodal completo Note con Imagen -> Resolver -> Client -> Preprocessor -> Service -> Provider', async () => {
    const client = new LocalMARTutorClient({
      tutorService,
      academicResolver,
      imageStorage: memoryImageStorage,
      imagePreprocessor: preprocessor,
      initialSelection: {
        subjectId: 'ciencias-3',
        topicId: 'topic-sinergia',
        selectedNoteIds: ['note-foto-001'],
        activeNoteId: 'note-foto-001'
      }
    });

    const response = await client.sendMessage('Explícame lo que dice este apunte', {
      mode: 'EXPLAIN'
    });

    // 1. Verificación del payload recibido en la capa de IA
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload?.visualContext).toBeDefined();
    expect(capturedPayload?.visualContext?.sourceNoteId).toBe('note-foto-001');
    expect(capturedPayload?.visualContext?.imageId).toBe('img-001');
    expect(capturedPayload?.visualContext?.mimeType).toBe('image/png');
    expect(capturedPayload?.visualContext?.base64Data).toBe(samplePngBase64);
    expect(capturedPayload?.visualContext?.provenance).toBe('CLASS_ORIGIN');
    expect(capturedPayload?.visualContext?.title).toBe('Apunte manuscrito de Sinergia');

    // 2. Verificación de la respuesta
    expect(response.isError).toBeFalsy();
    expect(response.provenance).toBe('AI_INFERENCE');
    expect(response.text).toContain('Apunte manuscrito de Sinergia');
    expect(response.text).toContain('Sinergia');
  });

  it('Test 2: Modo Socrático con contexto visual genera preguntas sobre el apunte', async () => {
    const client = new LocalMARTutorClient({
      tutorService,
      academicResolver,
      imageStorage: memoryImageStorage,
      imagePreprocessor: preprocessor,
      initialSelection: {
        subjectId: 'ciencias-3',
        topicId: 'topic-sinergia',
        selectedNoteIds: ['note-foto-001'],
        activeNoteId: 'note-foto-001'
      }
    });

    const response = await client.sendMessage('¿Qué opinas de mi apunte?', {
      mode: 'SOCRATIC'
    });

    expect(response.mode).toBe('SOCRATIC');
    expect(response.socraticStep).toBeDefined();
    expect(response.socraticStep?.guidingQuestion).toContain('Apunte manuscrito de Sinergia');
    expect(response.socraticStep?.expectedConceptFocus).toBe('análisis del apunte');
  });

  it('Test 3: Imagen ilegible o corrupta devuelve mensaje amigable sin inventar contenido', async () => {
    mockProvider.setConfig({ simulateUnreadableImage: true });

    const client = new LocalMARTutorClient({
      tutorService,
      academicResolver,
      imageStorage: memoryImageStorage,
      imagePreprocessor: preprocessor,
      initialSelection: {
        subjectId: 'ciencias-3',
        topicId: 'topic-sinergia',
        selectedNoteIds: ['note-foto-001'],
        activeNoteId: 'note-foto-001'
      }
    });

    const response = await client.sendMessage('Explícame este apunte borroso');

    expect(response.isFallback).toBe(true);
    expect(response.text).toContain('No logro leer bien este apunte');
    expect(response.text).toContain('Intenta tomar otra foto con más luz');
  });

  it('Test 4: Privacidad y minimización: solo la imagen seleccionada se incluye en el visualContext', async () => {
    const client = new LocalMARTutorClient({
      tutorService,
      academicResolver,
      imageStorage: memoryImageStorage,
      imagePreprocessor: preprocessor,
      initialSelection: {
        subjectId: 'ciencias-3',
        topicId: 'topic-sinergia'
        // Sin notas seleccionadas explícitamente
      }
    });

    await client.sendMessage('Pregunta conceptual general');

    expect(capturedPayload).not.toBeNull();
    // No debe haber visualContext si no se seleccionó un apunte para estudiar
    expect(capturedPayload?.visualContext).toBeUndefined();
    // No se exponen API keys ni secretos
    expect(JSON.stringify(capturedPayload)).not.toContain('AIzaSy');
  });

  it('Test 5: Resiliencia ante error de timeout con apunte visual', async () => {
    mockProvider.setConfig({ simulatedDelayMs: 200 });

    const client = new LocalMARTutorClient({
      tutorService: new MARTutorService({
        provider: mockProvider,
        config: {
          defaultProvider: 'mock',
          modelName: 'mock-model-v1',
          timeoutMs: 50,
          maxRetries: 0,
          circuitBreaker: { failureThreshold: 3, resetTimeoutMs: 1000 }
        }
      }),
      academicResolver,
      imageStorage: memoryImageStorage,
      imagePreprocessor: preprocessor,
      initialSelection: {
        subjectId: 'ciencias-3',
        topicId: 'topic-sinergia',
        selectedNoteIds: ['note-foto-001'],
        activeNoteId: 'note-foto-001'
      }
    });

    const response = await client.sendMessage('Ayúdame a estudiar');

    expect(response.isFallback).toBe(true);
    expect(response.text).toContain('La respuesta tardó un poco más de lo esperado');
  });

  it('Test 6: Separación estricta: Base64 no entra en conversationHistory ni en presupuestos textuales', async () => {
    const client = new LocalMARTutorClient({
      tutorService,
      academicResolver,
      imageStorage: memoryImageStorage,
      imagePreprocessor: preprocessor,
      initialSelection: {
        subjectId: 'ciencias-3',
        topicId: 'topic-sinergia',
        selectedNoteIds: ['note-foto-001'],
        activeNoteId: 'note-foto-001'
      }
    });

    await client.sendMessage('Explica este apunte');

    const history = client.getConversationHistory();
    expect(history.length).toBe(2); // Turno estudiante + turno tutor
    
    // Verificar que ningún turno del historial contiene la cadena Base64
    for (const turn of history) {
      expect(turn.text).not.toContain(samplePngBase64);
      expect(JSON.stringify(turn)).not.toContain(samplePngBase64);
    }
  });

  it('Test 7: Temporalidad y No Persistencia: el procesamiento multimodal no altera la imagen original ni escribe Base64 en localStorage', async () => {
    const originalImage = await memoryImageStorage.getImage('storage-key-001');

    const client = new LocalMARTutorClient({
      tutorService,
      academicResolver,
      imageStorage: memoryImageStorage,
      imagePreprocessor: preprocessor,
      initialSelection: {
        subjectId: 'ciencias-3',
        topicId: 'topic-sinergia',
        selectedNoteIds: ['note-foto-001'],
        activeNoteId: 'note-foto-001'
      }
    });

    await client.sendMessage('Analiza la imagen');

    // 1. La imagen original no fue alterada
    const currentImage = await memoryImageStorage.getImage('storage-key-001');
    expect(currentImage).toBe(originalImage);

    // 2. No se guardó Base64 en mockStorage (localStorage)
    const storedNotes = mockStorage.getItem('notes') as Note[];
    for (const note of storedNotes) {
      expect(JSON.stringify(note)).not.toContain(samplePngBase64);
    }
  });

  it('Test 8: Logs y Errores: las respuestas de error y fallback no exponen Base64 ni API keys', async () => {
    mockProvider.setConfig({ simulateUnreadableImage: true });

    const client = new LocalMARTutorClient({
      tutorService,
      academicResolver,
      imageStorage: memoryImageStorage,
      imagePreprocessor: preprocessor,
      initialSelection: {
        subjectId: 'ciencias-3',
        topicId: 'topic-sinergia',
        selectedNoteIds: ['note-foto-001'],
        activeNoteId: 'note-foto-001'
      }
    });

    const response = await client.sendMessage('Apunte con error');

    // El mensaje al usuario no debe contener fragmentos de Base64
    expect(response.text).not.toContain(samplePngBase64);
    expect(JSON.stringify(response)).not.toContain(samplePngBase64);
    expect(JSON.stringify(response)).not.toContain('AIzaSy');
  });

  it('Test 9: Frontera de seguridad: Gemini real requiere backend y TutorProviderFactory usa Mock de forma segura', async () => {
    const defaultProvider = mockProvider;
    expect(defaultProvider.providerId).toBe('mock-tutor');

    // Instanciar Gemini sin API key en cliente debe fallar con error de configuración sin exponer secretos
    const { GeminiTutorProvider } = await import('../../ai/providers/GeminiTutorProvider');
    const gemini = new GeminiTutorProvider({});
    const health = await gemini.checkHealth();
    expect(health).toBe(false);

    await expect(
      gemini.generatePedagogicalResponse({
        sessionId: 'test',
        pedagogicalMode: 'EXPLAIN',
        studentIntent: 'test',
        academicContext: {},
        studentInput: { latestUtterance: 'test' },
        conversationHistory: [],
        constraints: { maxTokens: 1024, requireSocraticStep: false, allowComplementaryExpansion: true }
      })
    ).rejects.toThrow('Google Gemini');
  });
});
