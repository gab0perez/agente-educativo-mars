import { AIContextPayload, AIGenerationOptions, AIProviderResult } from '../domain/types';

/**
 * Interface desacoplada para cualquier proveedor de Tutoría por IA
 */
export interface IAITutorProvider {
  /**
   * Identificador único del proveedor (ej: 'mock-tutor', 'google-gemini')
   */
  readonly providerId: string;

  /**
   * Versión del adaptador
   */
  readonly version: string;

  /**
   * Genera una respuesta pedagógica estructurada para el contexto académico dado
   */
  generatePedagogicalResponse(
    payload: AIContextPayload,
    options?: AIGenerationOptions
  ): Promise<AIProviderResult>;

  /**
   * Verifica la salud y disponibilidad del proveedor
   */
  checkHealth(): Promise<boolean>;
}
