export * from '../types/tutorClientTypes';
export * from './LocalMARTutorClient';

import { LocalMARTutorClient } from './LocalMARTutorClient';
import { IMARTutorClient } from '../types/tutorClientTypes';

let defaultClient: IMARTutorClient | null = null;

/**
 * Obtiene o instancia el cliente predeterminado de MAR Tutor para la UI
 */
export function getDefaultTutorClient(): IMARTutorClient {
  if (!defaultClient) {
    defaultClient = new LocalMARTutorClient();
  }
  return defaultClient;
}

/**
 * Permite inyectar un cliente personalizado (útil para pruebas)
 */
export function setDefaultTutorClient(client: IMARTutorClient | null): void {
  defaultClient = client;
}
