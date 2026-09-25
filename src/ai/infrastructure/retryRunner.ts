import { AITimeoutError, AITutorError } from '../domain/errors';

export interface RetryRunnerOptions {
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

/**
 * Ejecuta una operación asíncrona con control estricto de timeout y reintentos con exponential backoff
 */
export class RetryRunner {
  static async runWithRetry<T>(
    action: (signal: AbortSignal) => Promise<T>,
    options: RetryRunnerOptions = {}
  ): Promise<T> {
    const timeoutMs = options.timeoutMs ?? 12000;
    const maxRetries = options.maxRetries ?? 2;
    const baseDelayMs = options.baseDelayMs ?? 400;

    let attempt = 0;
    let lastError: unknown;

    while (attempt <= maxRetries) {
      const abortController = new AbortController();
      let timerId: ReturnType<typeof setTimeout> | null = null;

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timerId = setTimeout(() => {
            abortController.abort();
            reject(
              new AITimeoutError(
                `La operación excedió el tiempo límite de ${timeoutMs}ms (intento ${attempt + 1}/${maxRetries + 1}).`
              )
            );
          }, timeoutMs);
        });

        const actionPromise = action(abortController.signal);

        // Carrera entre la acción y el timeout
        const result = await Promise.race([actionPromise, timeoutPromise]);
        if (timerId) clearTimeout(timerId);
        return result;
      } catch (error) {
        if (timerId) clearTimeout(timerId);
        lastError = error;

        // Determinar si el error es reintentable
        const isRetryable =
          error instanceof AITutorError
            ? error.isRetryable
            : true; // Por defecto intentar reintentar errores desconocidos de red

        if (!isRetryable || attempt >= maxRetries) {
          throw error;
        }

        attempt += 1;
        if (options.onRetry) {
          options.onRetry(attempt, error);
        }

        // Exponential backoff
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}
