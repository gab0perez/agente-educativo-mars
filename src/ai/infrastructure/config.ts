/**
 * Configuración centralizada para la capa de Tutoría por IA de MAR
 */
export interface AITutorConfig {
  /**
   * Proveedor seleccionado por defecto ('mock' | 'gemini')
   */
  defaultProvider: 'mock' | 'gemini';

  /**
   * Identificador del modelo (ej: 'gemini-2.5-flash')
   */
  modelName: string;

  /**
   * Endpoint de API proxy seguro para llamadas desde frontend
   */
  apiEndpoint?: string;

  /**
   * Timeout global en milisegundos (TG11 define 12 segundos)
   */
  timeoutMs: number;

  /**
   * Número máximo de reintentos automáticos para errores transitorios
   */
  maxRetries: number;

  /**
   * Configuración de resiliencia mediante Circuit Breaker
   */
  circuitBreaker: {
    failureThreshold: number;   // Número de fallas consecutivas para abrir el circuito (3)
    resetTimeoutMs: number;     // Tiempo en ms antes de pasar a HALF_OPEN (30,000 ms = 30s)
  };
}

/**
 * Valores de configuración por defecto de MAR IA
 */
export const DEFAULT_AI_CONFIG: AITutorConfig = {
  defaultProvider: 'gemini',
  modelName: 'gemini-3.8-flash',
  apiEndpoint: '/api/tutor',
  timeoutMs: 12000,             // 12 segundos según TG11
  maxRetries: 2,                // 2 reintentos con exponential backoff
  circuitBreaker: {
    failureThreshold: 3,        // 3 fallas consecutivas activan el bloqueo
    resetTimeoutMs: 30000       // 30 segundos de enfriamiento
  }
};

