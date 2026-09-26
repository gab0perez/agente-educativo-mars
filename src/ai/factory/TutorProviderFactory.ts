import { IAITutorProvider } from '../providers/IAITutorProvider';
import { MockTutorProvider } from '../providers/MockTutorProvider';
import { GeminiTutorProvider } from '../providers/GeminiTutorProvider';
import { DEFAULT_AI_CONFIG } from '../infrastructure/config';

export type ProviderType = 'mock' | 'gemini';

export interface ProviderFactoryOptions {
  apiKey?: string;
  modelName?: string;
  apiEndpoint?: string;
}

export type CustomProviderCreator = (options?: ProviderFactoryOptions) => IAITutorProvider;

/**
 * Factory y Registry centralizado para instanciar proveedores de tutoría desacoplados
 */
export class TutorProviderFactory {
  private static registry = new Map<string, CustomProviderCreator>();

  /**
   * Registra un nuevo creador de proveedor personalizado
   */
  static registerProvider(type: string, creator: CustomProviderCreator): void {
    this.registry.set(type.toLowerCase(), creator);
  }

  /**
   * Cambia dinámicamente el proveedor predeterminado del sistema
   */
  static setDefaultProvider(provider: ProviderType): void {
    DEFAULT_AI_CONFIG.defaultProvider = provider;
  }

  /**
   * Crea una instancia del proveedor especificado
   */
  static create(type: ProviderType | string = DEFAULT_AI_CONFIG.defaultProvider, options?: ProviderFactoryOptions): IAITutorProvider {
    const normalizedType = type.toLowerCase();

    // 1. Revisar si existe un creador registrado
    if (this.registry.has(normalizedType)) {
      const creator = this.registry.get(normalizedType)!;
      return creator(options);
    }

    // 2. Proveedores integrados
    switch (normalizedType) {
      case 'mock':
        return new MockTutorProvider();
      case 'gemini':
        return new GeminiTutorProvider({
          apiKey: options?.apiKey,
          modelName: options?.modelName || DEFAULT_AI_CONFIG.modelName,
          apiEndpoint: options?.apiEndpoint || DEFAULT_AI_CONFIG.apiEndpoint
        });
      default:
        console.warn(`[TutorProviderFactory] Proveedor '${type}' desconocido. Usando 'mock' como fallback seguro.`);
        return new MockTutorProvider();
    }
  }

  /**
   * Obtiene el proveedor predeterminado según la configuración del sistema
   */
  static getDefault(options?: ProviderFactoryOptions): IAITutorProvider {
    return this.create(DEFAULT_AI_CONFIG.defaultProvider, options);
  }
}

