import { PracticeActivity } from '../../learning/domain/types';
import { PracticeEvaluation } from '../domain/practiceSessionTypes';

/**
 * Normaliza cadenas de texto para comparaciones de respuestas cortas
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos diacríticos
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '') // Remover puntuación
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normaliza respuestas booleanas a 'true' o 'false'
 */
function normalizeBoolean(str: string): string | null {
  const norm = normalizeString(str);
  if (norm === 'true' || norm === 'verdadero' || norm === 'v') return 'true';
  if (norm === 'false' || norm === 'falso' || norm === 'f') return 'false';
  return null;
}

export class PracticeEvaluator {
  evaluate(
    activity: PracticeActivity & { question?: string; correctAnswer?: string },
    studentAnswer: string
  ): PracticeEvaluation {
    const trimmed = studentAnswer.trim();

    if (!trimmed) {
      return {
        result: 'UNCLEAR',
        feedback: 'No se ingresó una respuesta. Por favor escribe o selecciona una opción antes de continuar.',
        isCorrect: false
      };
    }

    switch (activity.type) {
      case 'MULTIPLE_CHOICE': {
        const options = activity.options || [];
        const normTrimmed = normalizeString(trimmed);

        const selectedOption = options.find(
          (opt) =>
            opt.id.toLowerCase() === trimmed.toLowerCase() ||
            normalizeString(opt.text) === normTrimmed
        );

        if (selectedOption) {
          const isCorrect =
            Boolean(selectedOption.isCorrect) ||
            (activity.correctAnswer
              ? normalizeString(activity.correctAnswer) === normalizeString(selectedOption.id) ||
                normalizeString(activity.correctAnswer) === normalizeString(selectedOption.text)
              : false);

          const explanation = selectedOption.explanation || activity.explanation;

          if (isCorrect) {
            return {
              result: 'CORRECT',
              feedback: explanation
                ? `¡Muy bien! 🌸 ${explanation}`
                : '¡Muy bien! Tu respuesta muestra que identificaste la idea principal.',
              isCorrect: true,
              explanation
            };
          }

          return {
            result: 'INCORRECT',
            feedback: explanation
              ? `No pasa nada. 🌸 ${explanation}`
              : 'No pasa nada. Volvamos a la idea clave y revisémosla antes de intentar otra vez.',
            isCorrect: false,
            explanation
          };
        }

        // Si se indicó correctAnswer a nivel de actividad y no coincide con un ID de opción
        if (activity.correctAnswer) {
          const isCorrect =
            normalizeString(activity.correctAnswer) === normTrimmed ||
            activity.correctAnswer.toLowerCase() === trimmed.toLowerCase();

          return {
            result: isCorrect ? 'CORRECT' : 'INCORRECT',
            feedback: isCorrect
              ? (activity.explanation ? `¡Muy bien! 🌸 ${activity.explanation}` : '¡Muy bien! Tu respuesta muestra que identificaste la idea principal.')
              : (activity.explanation ? `No pasa nada. 🌸 ${activity.explanation}` : 'No pasa nada. Volvamos a la idea clave y revisémosla antes de intentar otra vez.'),
            isCorrect,
            explanation: activity.explanation
          };
        }

        return {
          result: 'UNCLEAR',
          feedback: 'Opción no reconocida. Por favor selecciona una de las opciones sugeridas.',
          isCorrect: false
        };
      }

      case 'TRUE_FALSE': {
        const boolVal = normalizeBoolean(trimmed);
        const expectedBool = activity.correctAnswer
          ? normalizeBoolean(activity.correctAnswer)
          : null;

        // 1. Si tiene options
        if (activity.options && activity.options.length > 0) {
          const matchedOpt = activity.options.find(
            (opt) =>
              opt.id.toLowerCase() === trimmed.toLowerCase() ||
              normalizeString(opt.text) === normalizeString(trimmed) ||
              (boolVal !== null && normalizeBoolean(opt.id) === boolVal) ||
              (boolVal !== null && normalizeBoolean(opt.text) === boolVal)
          );

          if (matchedOpt) {
            const isCorrect =
              Boolean(matchedOpt.isCorrect) ||
              (expectedBool !== null && boolVal !== null && boolVal === expectedBool);

            const explanation = matchedOpt.explanation || activity.explanation;
            return {
              result: isCorrect ? 'CORRECT' : 'INCORRECT',
              feedback: isCorrect
                ? (explanation ? `¡Muy bien! 🌸 ${explanation}` : '¡Muy bien! Tu respuesta es correcta.')
                : (explanation ? `No pasa nada. 🌸 ${explanation}` : 'No pasa nada. Volvamos a la idea clave para reforzarla.'),
              isCorrect,
              explanation
            };
          }
        }

        // 2. Si no tiene options pero tiene correctAnswer
        if (boolVal !== null && expectedBool !== null) {
          const isCorrect = boolVal === expectedBool;
          const explanation = activity.explanation;
          return {
            result: isCorrect ? 'CORRECT' : 'INCORRECT',
            feedback: isCorrect
              ? (explanation ? `¡Muy bien! 🌸 ${explanation}` : '¡Muy bien! Tu respuesta es correcta.')
              : (explanation ? `No pasa nada. 🌸 ${explanation}` : 'No pasa nada. Volvamos a la idea clave para reforzarla.'),
            isCorrect,
            explanation
          };
        }

        return {
          result: 'UNCLEAR',
          feedback: 'Por favor responde Verdadero o Falso.',
          isCorrect: false
        };
      }

      case 'SHORT_ANSWER': {
        const normalizedStudent = normalizeString(trimmed);

        if (normalizedStudent.length < 2) {
          return {
            result: 'UNCLEAR',
            feedback: 'Tu respuesta es demasiado breve. Escribe la palabra o concepto completo.',
            isCorrect: false
          };
        }

        // Obtener respuestas válidas desde options o correctAnswer
        const correctAnswers: string[] = [];
        if (activity.options && activity.options.length > 0) {
          activity.options
            .filter((opt) => opt.isCorrect !== false)
            .forEach((opt) => correctAnswers.push(opt.text));
        }
        if (activity.correctAnswer) {
          correctAnswers.push(activity.correctAnswer);
        }

        if (correctAnswers.length === 0) {
          return {
            result: 'PARTIAL',
            feedback: 'Vas por buen camino. Tu respuesta fue registrada para revisión formativa.',
            isCorrect: false,
            explanation: activity.explanation
          };
        }

        // 1. Coincidencia exacta
        const exactMatch = correctAnswers.some(
          (ans) => normalizeString(ans) === normalizedStudent
        );

        if (exactMatch) {
          return {
            result: 'CORRECT',
            feedback: activity.explanation
              ? `¡Muy bien! 🌸 ${activity.explanation}`
              : '¡Muy bien! Tu respuesta es precisa y correcta.',
            isCorrect: true,
            explanation: activity.explanation
          };
        }

        // 2. Coincidencia parcial
        const partialMatch = correctAnswers.some((ans) => {
          const normAns = normalizeString(ans);
          return (
            normAns.length >= 3 &&
            (normalizedStudent.includes(normAns) || normAns.includes(normalizedStudent))
          );
        });

        if (partialMatch) {
          return {
            result: 'PARTIAL',
            feedback: 'Vas por buen camino. Hay una parte importante del concepto que podemos afinar.',
            isCorrect: false,
            explanation: activity.explanation
          };
        }

        // 3. Incorrecto
        return {
          result: 'INCORRECT',
          feedback: activity.explanation
            ? `No pasa nada. 🌸 ${activity.explanation}`
            : 'No pasa nada. Volvamos a la idea clave y repasémosla con calma.',
          isCorrect: false,
          explanation: activity.explanation
        };
      }

      case 'OPEN_RESPONSE': {
        if (trimmed.length < 10) {
          return {
            result: 'UNCLEAR',
            feedback: 'Tu respuesta es un poco breve. Intenta explicar tu idea con un poco más de detalle.',
            isCorrect: false
          };
        }

        return {
          result: 'CORRECT',
          feedback: activity.explanation
            ? `🌸 ¡Excelente aportación! ${activity.explanation}`
            : '🌸 ¡Excelente aportación! Expresar lo aprendido con tus propias palabras fortalece tu comprensión.',
          isCorrect: true,
          explanation: activity.explanation
        };
      }

      default:
        return {
          result: 'UNCLEAR',
          feedback: 'Tipo de actividad no reconocido.',
          isCorrect: false
        };
    }
  }
}

export const practiceEvaluator = new PracticeEvaluator();
