import { ContextualNoteSnippet, RelevantConversationTurn } from '../domain/types';
import { Note } from '../../types/notes';
import { Reflection } from '../../types/reflection';
import { AcademicContextInput, NotesContextInput } from './contextTypes';

/**
 * Patrones y claves estrictamente prohibidas por la política de privacidad de MAR
 */
const SENSITIVE_KEY_PATTERNS = [
  /api[_-]?key/i,
  /auth(?:orization)?/i,
  /bearer\s+[a-z0-9_\-\.]+/i,
  /password/i,
  /secret/i,
  /token/i,
  /cookie/i,
  /private[_-]?key/i,
  /env(?:ironment)?/i
];

const LOCAL_PATH_PATTERNS = [
  /[a-zA-Z]:\\[a-zA-Z0-9_\-\\]+/g, // Rutas Windows (C:\...)
  /(?:\/Users|\/home|\/etc|\/var)\/[a-zA-Z0-9_\-\/]+/g // Rutas Unix (/Users/...)
];

const API_KEY_PREFIX_PATTERNS = [
  /AIza[0-9A-Za-z\-_]{35}/g, // Google API Key
  /sk-[a-zA-Z0-9]{32,}/g     // OpenAI API Key
];

/**
 * Limpia y sanitiza texto eliminando posibles secretos, credenciales o rutas locales
 */
export function sanitizeText(text: string | undefined | null, maxChars?: number): string {
  if (!text) return '';

  let sanitized = String(text);

  // 1. Remover rutas locales de archivos
  for (const pattern of LOCAL_PATH_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[ruta_local_oculta]');
  }

  // 2. Remover posibles API Keys detectadas
  for (const pattern of API_KEY_PREFIX_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[api_key_oculta]');
  }

  // 3. Remover cabeceras de autorización o tokens
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9_\-\.]+/gi, '[token_oculto]');

  // 4. Normalizar espacios
  sanitized = sanitized.replace(/\r\n/g, '\n').trim();

  // 5. Truncar si excede el presupuesto
  if (maxChars && maxChars > 0 && sanitized.length > maxChars) {
    return sanitized.substring(0, maxChars).trim() + '... [truncado]';
  }

  return sanitized;
}

/**
 * Verifica si un nombre de propiedad contiene términos prohibidos
 */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Convierte un objeto Note o ContextualNoteSnippet a la estructura estándar ContextualNoteSnippet
 */
export function formatNoteSnippet(
  rawNote: Note | ContextualNoteSnippet,
  maxExtractChars = 500
): ContextualNoteSnippet {
  const isDomainNote = 'images' in rawNote;

  if (isDomainNote) {
    const note = rawNote as Note;
    const hasImages = Array.isArray(note.images) && note.images.length > 0;
    const firstImg = hasImages ? note.images[0] : undefined;

    return {
      noteId: note.id,
      title: sanitizeText(note.title, 100),
      subjectName: sanitizeText(note.subjectName, 60) || undefined,
      topicName: sanitizeText(note.topicName, 60) || undefined,
      textExtract: note.content ? sanitizeText(note.content, maxExtractChars) : undefined,
      provenance: note.provenance || 'CLASS_ORIGIN',
      hasImage: hasImages,
      imageMimeType: firstImg?.mimeType
    };
  }

  const snippet = rawNote as ContextualNoteSnippet;
  return {
    noteId: snippet.noteId,
    title: sanitizeText(snippet.title, 100),
    subjectName: snippet.subjectName ? sanitizeText(snippet.subjectName, 60) : undefined,
    topicName: snippet.topicName ? sanitizeText(snippet.topicName, 60) : undefined,
    textExtract: snippet.textExtract ? sanitizeText(snippet.textExtract, maxExtractChars) : undefined,
    provenance: snippet.provenance || 'CLASS_ORIGIN',
    hasImage: Boolean(snippet.hasImage),
    imageMimeType: snippet.imageMimeType
  };
}

/**
 * Selecciona, prioriza y desduplica notas relevantes respetando límites y procedencia
 */
export function selectNotesContext(
  notesInput?: NotesContextInput,
  maxNotes = 3,
  maxExtractChars = 500
): { relevantNotes: ContextualNoteSnippet[]; activeNoteId?: string } | undefined {
  if (!notesInput) return undefined;

  const relevantNotes: ContextualNoteSnippet[] = [];
  const seenNoteIds = new Set<string>();

  // 1. Priorizar la nota activa si está presente
  let activeId = notesInput.activeNoteId;

  if (notesInput.activeNote) {
    const activeSnippet = formatNoteSnippet(notesInput.activeNote, maxExtractChars);
    relevantNotes.push(activeSnippet);
    seenNoteIds.add(activeSnippet.noteId);
    if (!activeId) {
      activeId = activeSnippet.noteId;
    }
  }

  // 2. Incorporar notas relevantes adicionales hasta maxNotes, evitando duplicar activeNote
  if (Array.isArray(notesInput.relevantNotes)) {
    for (const rawNote of notesInput.relevantNotes) {
      if (relevantNotes.length >= maxNotes) break;

      const snippet = formatNoteSnippet(rawNote, maxExtractChars);
      if (!seenNoteIds.has(snippet.noteId)) {
        seenNoteIds.add(snippet.noteId);
        relevantNotes.push(snippet);
      }
    }
  }

  if (relevantNotes.length === 0 && !activeId) {
    return undefined;
  }

  return {
    relevantNotes,
    activeNoteId: activeId
  };
}

/**
 * Limita el historial conversacional a la ventana deslizante reciente (3 a 5 turnos)
 */
export function sliceConversationHistory(
  history?: RelevantConversationTurn[],
  maxTurns = 4,
  maxTurnChars = 300
): RelevantConversationTurn[] {
  if (!history || !Array.isArray(history) || history.length === 0) {
    return [];
  }

  // Tomar los últimos maxTurns de manera determinista y en orden cronológico
  const recentTurns = history.slice(-maxTurns);

  return recentTurns.map((turn) => ({
    role: turn.role,
    text: sanitizeText(turn.text, maxTurnChars),
    timestamp: turn.timestamp,
    pedagogicalMode: turn.pedagogicalMode
  }));
}

/**
 * Consolida los conceptos clave de la lección y tema activo sin duplicados
 */
export function consolidateKeyConcepts(
  academicInput?: AcademicContextInput,
  maxConcepts = 8
): string[] | undefined {
  if (!academicInput) return undefined;

  const conceptsSet = new Set<string>();

  if (Array.isArray(academicInput.keyConcepts)) {
    for (const c of academicInput.keyConcepts) {
      if (c && c.trim()) conceptsSet.add(sanitizeText(c.trim(), 50));
    }
  }

  if (academicInput.currentLesson && 'keyConcepts' in academicInput.currentLesson && Array.isArray(academicInput.currentLesson.keyConcepts)) {
    for (const c of academicInput.currentLesson.keyConcepts) {
      if (c && c.trim()) conceptsSet.add(sanitizeText(c.trim(), 50));
    }
  }

  if (academicInput.currentLessonSection && 'keyConcepts' in academicInput.currentLessonSection && Array.isArray(academicInput.currentLessonSection.keyConcepts)) {
    for (const c of academicInput.currentLessonSection.keyConcepts) {
      if (c && c.trim()) conceptsSet.add(sanitizeText(c.trim(), 50));
    }
  }

  const result = Array.from(conceptsSet).slice(0, maxConcepts);
  return result.length > 0 ? result : undefined;
}

/**
 * Extrae y sanitiza el texto de reflexión de la estudiante
 */
export function extractStudentReflection(
  reflectionInput?: string | Reflection,
  maxChars = 600
): string | undefined {
  if (!reflectionInput) return undefined;

  if (typeof reflectionInput === 'string') {
    const sanitized = sanitizeText(reflectionInput, maxChars);
    return sanitized.length > 0 ? sanitized : undefined;
  }

  if (typeof reflectionInput === 'object') {
    if ('answer' in reflectionInput && reflectionInput.answer) {
      const sanitized = sanitizeText(reflectionInput.answer, maxChars);
      return sanitized.length > 0 ? sanitized : undefined;
    }
    if ('content' in reflectionInput && typeof (reflectionInput as Record<string, unknown>).content === 'string') {
      const sanitized = sanitizeText((reflectionInput as Record<string, unknown>).content as string, maxChars);
      return sanitized.length > 0 ? sanitized : undefined;
    }
  }

  return undefined;
}
