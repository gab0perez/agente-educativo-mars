/**
 * Códigos de error tipados para la capa de IA de MAR
 */
export type AITutorErrorCode =
  | 'TIMEOUT'
  | 'PROVIDER_UNAVAILABLE'
  | 'RATE_LIMIT'
  | 'INVALID_RESPONSE'
  | 'CONFIGURATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'NETWORK_ERROR'
  | 'CIRCUIT_OPEN'
  | 'UNREADABLE_IMAGE'
  | 'INVALID_IMAGE_FORMAT'
  | 'IMAGE_PROCESSING_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Clase base para todos los errores originados en la capa de tutoría por IA
 */
export class AITutorError extends Error {
  readonly code: AITutorErrorCode;
  readonly isRetryable: boolean;
  readonly originalError?: unknown;

  constructor(
    message: string,
    code: AITutorErrorCode = 'UNKNOWN_ERROR',
    isRetryable: boolean = false,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'AITutorError';
    this.code = code;
    this.isRetryable = isRetryable;
    this.originalError = originalError;

    // Mantener prototipo correcto al extender Error en ES5/ES6
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Genera un mensaje seguro y amigable para el estudiante sin exponer detalles técnicos
   */
  getUserFriendlyMessage(): string {
    switch (this.code) {
      case 'TIMEOUT':
        return 'La respuesta tardó un poco más de lo esperado. ¿Quieres intentarlo de nuevo?';
      case 'PROVIDER_UNAVAILABLE':
      case 'CIRCUIT_OPEN':
        return 'El servicio de tutoría no está disponible en este momento. Puedes repasar los conceptos clave mientras vuelve.';
      case 'RATE_LIMIT':
        return 'Hemos alcanzado el límite de consultas por minuto. Esperemos unos instantes.';
      case 'INVALID_RESPONSE':
        return 'Ocurrió un error al procesar la respuesta pedagógica. Intentemos con otra pregunta.';
      case 'AUTHENTICATION_ERROR':
      case 'CONFIGURATION_ERROR':
        return 'El tutor no está configurado adecuadamente para conectarse al servicio.';
      case 'NETWORK_ERROR':
        return 'Hubo un problema de conexión con internet. Revisa tu red e intenta de nuevo.';
      case 'UNREADABLE_IMAGE':
        return 'No logro leer bien este apunte. Intenta tomar otra foto con más luz y enfocando mejor el texto.';
      case 'INVALID_IMAGE_FORMAT':
        return 'Formato de imagen no compatible. Por favor utiliza una fotografía en formato JPG, PNG o WebP.';
      case 'IMAGE_PROCESSING_ERROR':
        return 'No pudimos procesar la imagen de tu apunte. Intenta seleccionarlo o fotografiarlo de nuevo.';
      default:
        return 'Ocurrió un detalle imprevisto al consultar al tutor. Intenta de nuevo.';
    }
  }
}

export class AITimeoutError extends AITutorError {
  constructor(message = 'La petición al proveedor de IA excedió el tiempo límite (timeout).', originalError?: unknown) {
    super(message, 'TIMEOUT', true, originalError);
    this.name = 'AITimeoutError';
  }
}

export class AIProviderUnavailableError extends AITutorError {
  constructor(message = 'El proveedor de IA no está disponible o devolvió un error de servidor.', originalError?: unknown) {
    super(message, 'PROVIDER_UNAVAILABLE', true, originalError);
    this.name = 'AIProviderUnavailableError';
  }
}

export class AIRateLimitError extends AITutorError {
  constructor(message = 'Se excedió la cuota de peticiones permitidas por el proveedor de IA.', originalError?: unknown) {
    super(message, 'RATE_LIMIT', true, originalError);
    this.name = 'AIRateLimitError';
  }
}

export class AIInvalidResponseError extends AITutorError {
  readonly validationIssues?: string[];

  constructor(message = 'La respuesta del proveedor de IA no cumple con la estructura esperada.', validationIssues?: string[], originalError?: unknown) {
    super(message, 'INVALID_RESPONSE', false, originalError);
    this.name = 'AIInvalidResponseError';
    this.validationIssues = validationIssues;
  }
}

export class AIConfigurationError extends AITutorError {
  constructor(message = 'Error de configuración en el proveedor de IA o credenciales faltantes.', originalError?: unknown) {
    super(message, 'CONFIGURATION_ERROR', false, originalError);
    this.name = 'AIConfigurationError';
  }
}

export class AIAuthenticationError extends AITutorError {
  constructor(message = 'Fallo de autenticación con el proveedor de IA (API key inválida o revocada).', originalError?: unknown) {
    super(message, 'AUTHENTICATION_ERROR', false, originalError);
    this.name = 'AIAuthenticationError';
  }
}

export class AINetworkError extends AITutorError {
  constructor(message = 'Error de conexión de red al comunicarse con el proveedor de IA.', originalError?: unknown) {
    super(message, 'NETWORK_ERROR', true, originalError);
    this.name = 'AINetworkError';
  }
}

export class AICircuitOpenError extends AITutorError {
  constructor(message = 'El Circuit Breaker está ABIERTO debido a múltiples fallas consecutivas del proveedor.', originalError?: unknown) {
    super(message, 'CIRCUIT_OPEN', false, originalError);
    this.name = 'AICircuitOpenError';
  }
}

export class AIUnreadableImageError extends AITutorError {
  constructor(message = 'No logro leer bien este apunte. Intenta tomar otra foto con más luz y enfocando mejor el texto.', originalError?: unknown) {
    super(message, 'UNREADABLE_IMAGE', false, originalError);
    this.name = 'AIUnreadableImageError';
  }
}

export class AIInvalidImageFormatError extends AITutorError {
  constructor(message = 'Formato de imagen no compatible. Por favor utiliza una fotografía en formato JPG, PNG o WebP.', originalError?: unknown) {
    super(message, 'INVALID_IMAGE_FORMAT', false, originalError);
    this.name = 'AIInvalidImageFormatError';
  }
}

export class AIImageProcessingError extends AITutorError {
  constructor(message = 'Error al procesar la imagen del apunte.', originalError?: unknown) {
    super(message, 'IMAGE_PROCESSING_ERROR', false, originalError);
    this.name = 'AIImageProcessingError';
  }
}
