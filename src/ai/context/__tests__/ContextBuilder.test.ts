import { describe, it, expect } from 'vitest';
import { ContextBuilder } from '../ContextBuilder';
import { ContextBuilderInput } from '../contextTypes';
import { Note } from '../../../types/notes';
import { Subject, Topic } from '../../../types/academic';
import { AIContextPayloadSchema } from '../../domain/schemas';

describe('TG13 — ContextBuilder Unit Tests', () => {
  const activeSubject: Subject = {
    id: 'ciencias-3',
    code: 'CN3',
    name: 'Ciencias Naturales III',
    shortName: 'Ciencias III',
    description: 'Estudio de ecosistemas y sinergia',
    icon: '🌱',
    topics: []
  };

  const activeTopic: Topic = {
    id: 'tema-sinergia',
    subjectId: 'ciencias-3',
    name: 'Sinergia y Homeostasis',
    description: 'Cooperación biológica y funcional',
    status: 'en_estudio',
    provenance: 'CLASS_ORIGIN'
  };

  const sampleNote1: Note = {
    id: 'note-001',
    title: 'Apunte de Sinergia Celular',
    content: 'La sinergia celular ocurre cuando dos enzimas cooperan.',
    subjectId: 'ciencias-3',
    subjectName: 'Ciencias Naturales III',
    topicId: 'tema-sinergia',
    topicName: 'Sinergia y Homeostasis',
    createdAt: '2026-09-25T10:00:00.000Z',
    updatedAt: '2026-09-25T10:00:00.000Z',
    provenance: 'CLASS_ORIGIN',
    images: [
      {
        id: 'img-001',
        noteId: 'note-001',
        storageKey: 'img-key-001',
        mimeType: 'image/jpeg',
        size: 204800,
        createdAt: '2026-09-25T10:00:00.000Z',
        status: 'ready'
      }
    ]
  };

  const sampleNote2: Note = {
    id: 'note-002',
    title: 'Resumen propio de homeostasis',
    content: 'Equilibrio dinámico del medio interno.',
    subjectId: 'ciencias-3',
    subjectName: 'Ciencias Naturales III',
    topicId: 'tema-sinergia',
    topicName: 'Sinergia y Homeostasis',
    createdAt: '2026-09-25T10:30:00.000Z',
    updatedAt: '2026-09-25T10:30:00.000Z',
    provenance: 'USER_PROVIDED',
    images: []
  };

  // TEST 1 — Contexto académico activo
  it('Test 1: Incluye únicamente el contexto académico activo (materia, tema, conceptos clave)', () => {
    const input: ContextBuilderInput = {
      sessionId: 'sess-001',
      pedagogicalMode: 'EXPLAIN',
      studentIntent: 'Comprender el concepto',
      academicContext: {
        subject: activeSubject,
        topic: activeTopic,
        unitNumber: 1,
        currentLesson: { id: 'lec-1', title: 'Introducción a Sistemas', keyConcepts: ['Sistemas', 'Cooperación'] },
        keyConcepts: ['Sinergia']
      },
      studentInput: {
        latestUtterance: '¿Qué es sinergia?'
      }
    };

    const payload = ContextBuilder.build(input);

    expect(payload.academicContext.subjectId).toBe('ciencias-3');
    expect(payload.academicContext.subjectName).toBe('Ciencias Naturales III');
    expect(payload.academicContext.topicId).toBe('tema-sinergia');
    expect(payload.academicContext.topicName).toBe('Sinergia y Homeostasis');
    expect(payload.academicContext.unitNumber).toBe(1);
    expect(payload.academicContext.currentLessonStepTitle).toBe('Introducción a Sistemas');
    expect(payload.academicContext.keyConcepts).toEqual(['Sinergia', 'Sistemas', 'Cooperación']);
  });

  // TEST 2 — Exclusión de materias irrelevantes
  it('Test 2: Excluye cualquier información de otras materias no activas', () => {
    const input: ContextBuilderInput = {
      pedagogicalMode: 'SIMPLIFY',
      academicContext: {
        subject: activeSubject,
        topic: activeTopic
      },
      studentInput: {
        latestUtterance: 'Dame una analogía'
      }
    };

    const payload = ContextBuilder.build(input);
    const serialized = JSON.stringify(payload);

    expect(serialized).not.toContain('Matemáticas');
    expect(serialized).not.toContain('Historia');
    expect(serialized).not.toContain('Inglés');
    expect(serialized).not.toContain('Programación');
  });

  // TEST 3 — Active note
  it('Test 3: Incluye la nota explícitamente activa con su metadata', () => {
    const input: ContextBuilderInput = {
      pedagogicalMode: 'SOCRATIC',
      academicContext: { subject: activeSubject, topic: activeTopic },
      notesContext: {
        activeNote: sampleNote1
      },
      studentInput: {
        latestUtterance: 'Tengo duda con lo que anoté aquí'
      }
    };

    const payload = ContextBuilder.build(input);

    expect(payload.notesContext).toBeDefined();
    expect(payload.notesContext?.activeNoteId).toBe('note-001');
    expect(payload.notesContext?.relevantNotes.length).toBe(1);
    expect(payload.notesContext?.relevantNotes[0].noteId).toBe('note-001');
    expect(payload.notesContext?.relevantNotes[0].hasImage).toBe(true);
    expect(payload.notesContext?.relevantNotes[0].imageMimeType).toBe('image/jpeg');
  });

  // TEST 4 — Evitar duplicados
  it('Test 4: Evita duplicar notas cuando activeNote también se pasa en relevantNotes', () => {
    const input: ContextBuilderInput = {
      pedagogicalMode: 'SOCRATIC',
      academicContext: { subject: activeSubject, topic: activeTopic },
      notesContext: {
        activeNote: sampleNote1,
        relevantNotes: [sampleNote1, sampleNote2]
      },
      studentInput: {
        latestUtterance: 'Quiero repasar estas dos notas'
      }
    };

    const payload = ContextBuilder.build(input);

    expect(payload.notesContext?.relevantNotes.length).toBe(2);
    const ids = payload.notesContext?.relevantNotes.map((n) => n.noteId);
    expect(ids).toEqual(['note-001', 'note-002']);
  });

  // TEST 5 — Conversation window
  it('Test 5: Limita la conversación a la ventana reciente (últimos 3 a 5 turnos)', () => {
    const longHistory = Array.from({ length: 12 }, (_, i) => ({
      role: (i % 2 === 0 ? 'student' : 'tutor') as 'student' | 'tutor',
      text: `Mensaje de prueba número ${i + 1}`,
      timestamp: `2026-09-25T12:${String(i).padStart(2, '0')}:00.000Z`
    }));

    const input: ContextBuilderInput = {
      pedagogicalMode: 'SOCRATIC',
      studentInput: { latestUtterance: 'Mensaje actual 13' },
      conversationHistory: longHistory
    };

    // Por defecto maxConversationTurns = 4
    const payload = ContextBuilder.build(input, { maxConversationTurns: 4 });

    expect(payload.conversationHistory.length).toBe(4);
    expect(payload.conversationHistory[0].text).toBe('Mensaje de prueba número 9');
    expect(payload.conversationHistory[3].text).toBe('Mensaje de prueba número 12');
  });

  // TEST 6 — Student input & reflection
  it('Test 6: Integra correctamente latestUtterance y la reflexión de la estudiante', () => {
    const input: ContextBuilderInput = {
      pedagogicalMode: 'SOCRATIC',
      academicContext: { subject: activeSubject, topic: activeTopic },
      studentInput: {
        latestUtterance: 'Creo que sinergia es cuando 1+1 da más que 2',
        studentReflection: 'Me di cuenta en el experimento del laboratorio',
        confidenceSelfReport: 'medium'
      }
    };

    const payload = ContextBuilder.build(input);

    expect(payload.studentInput.latestUtterance).toBe('Creo que sinergia es cuando 1+1 da más que 2');
    expect(payload.studentInput.studentReflection).toBe('Me di cuenta en el experimento del laboratorio');
    expect(payload.studentInput.confidenceSelfReport).toBe('medium');
  });

  // TEST 7 — Provenance
  it('Test 7: Conserva estrictamente las procedencias de notas y contenido', () => {
    const input: ContextBuilderInput = {
      pedagogicalMode: 'EXPLAIN',
      notesContext: {
        relevantNotes: [
          sampleNote1, // CLASS_ORIGIN
          sampleNote2, // USER_PROVIDED
          {
            noteId: 'inf-001',
            title: 'Sugerencia detectada',
            provenance: 'AI_INFERENCE',
            hasImage: false
          }
        ]
      },
      studentInput: { latestUtterance: '¿Qué origen tienen estos apuntes?' }
    };

    const payload = ContextBuilder.build(input);
    const provenances = payload.notesContext?.relevantNotes.map((n) => n.provenance);

    expect(provenances).toEqual(['CLASS_ORIGIN', 'USER_PROVIDED', 'AI_INFERENCE']);
  });

  // TEST 8 — Privacy blacklist
  it('Test 8: Filtra y bloquea secretos, tokens, contraseñas y rutas locales de archivos', () => {
    const input: ContextBuilderInput = {
      sessionId: 'sess-secure',
      pedagogicalMode: 'QUESTION',
      studentInput: {
        latestUtterance: 'Mi token es Bearer eyJhbGciOi... y mi clave es AIzaSyB12345678901234567890123456789012 en C:\\Users\\escud\\secret_doc.txt'
      },
      notesContext: {
        relevantNotes: [
          {
            id: 'note-secret',
            title: 'Apunte con ruta /home/user/passwords.txt',
            content: 'Guardo mi sk-12345678901234567890123456789012 aquí',
            createdAt: '2026-09-25T10:00:00.000Z',
            updatedAt: '2026-09-25T10:00:00.000Z',
            provenance: 'CLASS_ORIGIN',
            images: []
          }
        ]
      }
    };

    const payload = ContextBuilder.build(input);
    const serialized = JSON.stringify(payload);

    // Verificación de que no existen patrones de credenciales ni rutas reales
    expect(serialized).not.toContain('C:\\Users\\escud');
    expect(serialized).not.toContain('/home/user/passwords.txt');
    expect(serialized).not.toContain('AIzaSyB12345678901234567890123456789012');
    expect(serialized).not.toContain('sk-12345678901234567890123456789012');
    expect(serialized).toContain('[ruta_local_oculta]');
    expect(serialized).toContain('[api_key_oculta]');
    expect(serialized).toContain('[token_oculto]');
  });

  // TEST 9 — Determinismo
  it('Test 9: Es 100% determinista: exactamente el mismo input produce el mismo payload', () => {
    const input: ContextBuilderInput = {
      sessionId: 'sess-deterministic-1',
      pedagogicalMode: 'SOCRATIC',
      academicContext: { subject: activeSubject, topic: activeTopic },
      notesContext: { relevantNotes: [sampleNote1, sampleNote2] },
      studentInput: { latestUtterance: '¿Cómo se evalúa la sinergia?' }
    };

    const result1 = ContextBuilder.build(input);
    const result2 = ContextBuilder.build(input);

    expect(result1).toEqual(result2);
  });

  // TEST 10 — Context budget
  it('Test 10: Trunca de forma controlada y determinista textos que excedan el límite por extracto', () => {
    const veryLongContent = 'A'.repeat(1200);
    const input: ContextBuilderInput = {
      pedagogicalMode: 'EXPLAIN',
      notesContext: {
        relevantNotes: [
          {
            ...sampleNote1,
            content: veryLongContent
          }
        ]
      },
      studentInput: {
        latestUtterance: 'B'.repeat(2000)
      }
    };

    const payload = ContextBuilder.build(input, { maxNoteExtractChars: 200 });

    const noteExtract = payload.notesContext?.relevantNotes[0].textExtract;
    expect(noteExtract).toBeDefined();
    expect(noteExtract?.length).toBeLessThanOrEqual(220); // 200 + '... [truncado]'
    expect(noteExtract).toContain('... [truncado]');
  });

  // TEST 11 — Empty context
  it('Test 11: Genera un AIContextPayload válido y con esquema Zod aprobado cuando no hay notas ni historial', () => {
    const input: ContextBuilderInput = {
      pedagogicalMode: 'SIMPLIFY',
      studentInput: {
        latestUtterance: 'Solo quiero una explicación simple'
      }
    };

    const payload = ContextBuilder.build(input);

    expect(payload).toBeDefined();
    expect(payload.sessionId).toBeDefined();
    expect(payload.pedagogicalMode).toBe('SIMPLIFY');
    expect(payload.studentInput.latestUtterance).toBe('Solo quiero una explicación simple');
    expect(payload.notesContext).toBeUndefined();
    expect(payload.conversationHistory).toEqual([]);

    // Validación formal contra el esquema Zod
    expect(() => AIContextPayloadSchema.parse(payload)).not.toThrow();
  });

  // TEST 12 — No provider calls
  it('Test 12: ContextBuilder opera en memoria pura sin dependencias de red ni SDKs de IA', () => {
    const builder = new ContextBuilder();
    const input: ContextBuilderInput = {
      pedagogicalMode: 'EXERCISE',
      studentInput: { latestUtterance: 'Ponme un reto de sinergia' }
    };

    const payload = builder.build(input);

    expect(payload.pedagogicalMode).toBe('EXERCISE');
    expect(payload.constraints.requireSocraticStep).toBe(false);
  });
});
