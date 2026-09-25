import { AITutorResponseSchema } from '../domain/schemas';
import { AITutorResponse } from '../domain/types';
import { AIInvalidResponseError } from '../domain/errors';

export class ResponseValidator {
  /**
   * Normaliza y valida la respuesta emitida por cualquier proveedor de IA
   */
  static validate(rawInput: unknown): AITutorResponse {
    let candidateData: unknown = rawInput;

    // Si el proveedor devolvió una cadena de texto, intentar parsear JSON
    if (typeof rawInput === 'string') {
      try {
        let cleaned = rawInput.trim();
        // Remover bloques de código markdown ```json ... ``` si están presentes
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        }
        candidateData = JSON.parse(cleaned);
      } catch (err) {
        throw new AIInvalidResponseError(
          'El proveedor devolvió una respuesta que no es un JSON válido.',
          [(err as Error).message],
          err
        );
      }
    }

    if (!candidateData || typeof candidateData !== 'object') {
      throw new AIInvalidResponseError('La respuesta del proveedor no es un objeto válido.', [
        'Tipo recibido: ' + typeof candidateData
      ]);
    }

    const parseResult = AITutorResponseSchema.safeParse(candidateData);

    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(
        (issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`
      );
      throw new AIInvalidResponseError(
        'La respuesta del proveedor no cumple con el esquema pedagógico AITutorResponse.',
        issues,
        parseResult.error
      );
    }

    return parseResult.data as AITutorResponse;
  }
}
