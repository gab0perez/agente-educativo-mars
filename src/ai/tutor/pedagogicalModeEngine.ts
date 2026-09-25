import { PedagogicalMode, SocraticHintLevel } from '../domain/types';
import { TutorRequest } from './tutorTypes';

/**
 * Motor determinista para resolver el modo pedagógico y la progresión socrática
 * No utiliza modelos de lenguaje para garantizar previsibilidad y reproducibilidad
 */
export class PedagogicalModeEngine {
  /**
   * Resuelve el modo pedagógico aplicable a la solicitud
   */
  static resolveMode(request: TutorRequest): PedagogicalMode {
    // 1. Si se especificó explícitamente un modo, respetarlo de inmediato
    if (request.pedagogicalMode) {
      return request.pedagogicalMode;
    }

    const intent = (request.studentIntent || '').toLowerCase();
    const utterance = (request.studentInput?.latestUtterance || '').toLowerCase();
    const combined = `${intent} ${utterance}`;

    // 2. Reglas deterministas basadas en intención y contenido
    if (
      combined.includes('ejemplo') ||
      combined.includes('caso práctico') ||
      combined.includes('caso real') ||
      combined.includes('en la vida real')
    ) {
      return 'EXAMPLE';
    }

    if (
      combined.includes('más fácil') ||
      combined.includes('sencillo') ||
      combined.includes('analogía') ||
      combined.includes('metáfora') ||
      combined.includes('no entendí nada') ||
      combined.includes('con manzanas')
    ) {
      return 'SIMPLIFY';
    }

    if (
      combined.includes('ejercicio') ||
      combined.includes('reto') ||
      combined.includes('problema') ||
      combined.includes('actividad') ||
      combined.includes('ponme a prueba')
    ) {
      return 'EXERCISE';
    }

    if (
      combined.includes('pregunta') ||
      combined.includes('evalúame') ||
      combined.includes('hazme una pregunta') ||
      combined.includes('comprueba')
    ) {
      return 'QUESTION';
    }

    if (
      combined.includes('repaso') ||
      combined.includes('resumen') ||
      combined.includes('recapitula') ||
      combined.includes('sintetiza') ||
      combined.includes('qué aprendimos')
    ) {
      return 'REVIEW';
    }

    // Si formula una duda conceptual profunda o preguntas orientadas al razonamiento
    if (
      combined.includes('¿por qué') ||
      combined.includes('¿cómo funciona') ||
      combined.includes('ayúdame a pensar') ||
      combined.includes('tengo duda') ||
      combined.includes('guiame')
    ) {
      return 'SOCRATIC';
    }

    // Modo por defecto
    return 'EXPLAIN';
  }

  /**
   * Resuelve el nivel socrático de ayuda garantizando un máximo estricto de 3 pistas antes de EXPLANATION
   */
  static resolveSocraticLevel(
    request: TutorRequest,
    resolvedMode: PedagogicalMode
  ): SocraticHintLevel | undefined {
    if (resolvedMode !== 'SOCRATIC') {
      return undefined;
    }

    // Si se especificó explícitamente un nivel socrático, respetarlo
    if (request.socraticHintLevel) {
      return request.socraticHintLevel;
    }

    const utterance = (request.studentInput?.latestUtterance || '').toLowerCase();

    // Si la estudiante expresa rendición explícita, saltar de inmediato a EXPLANATION con calidez
    if (
      utterance.includes('no sé') ||
      utterance.includes('no tengo idea') ||
      utterance.includes('dime la respuesta') ||
      utterance.includes('ya explícamelo') ||
      utterance.includes('me rindo')
    ) {
      return 'EXPLANATION';
    }

    // Contar las intervenciones previas del tutor en el historial reciente
    const history = request.conversationHistory || [];
    const tutorResponsesCount = history.filter((turn) => turn.role === 'tutor').length;

    if (tutorResponsesCount === 0) {
      return 'HINT_1';
    } else if (tutorResponsesCount === 1) {
      return 'HINT_2';
    } else if (tutorResponsesCount === 2) {
      return 'HINT_3';
    } else {
      // Tras 3 turnos / pistas, entregar la explicación completa
      return 'EXPLANATION';
    }
  }
}
