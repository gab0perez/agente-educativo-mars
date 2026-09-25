import {
  AIImageProcessingError,
  AIInvalidImageFormatError,
  AIUnreadableImageError
} from '../domain/errors';

export type SupportedImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ImagePreprocessOptions {
  maxDimension?: number;
  maxSizeBytes?: number;
  targetMimeType?: SupportedImageMimeType;
}

export interface PreprocessedImageResult {
  base64Data: string;
  mimeType: SupportedImageMimeType;
  width?: number;
  height?: number;
  sizeBytes: number;
}

const ALLOWED_MIME_TYPES: SupportedImageMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

const DEFAULT_MAX_DIMENSION = 2048;
const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Preprocesador de imágenes para la capa multimodal de MAR
 * Normaliza, valida y optimiza fotografías de apuntes antes de enviarlas a la IA
 */
export class ImagePreprocessor {
  private maxDimension: number;
  private maxSizeBytes: number;

  constructor(options: { maxDimension?: number; maxSizeBytes?: number } = {}) {
    this.maxDimension = options.maxDimension || DEFAULT_MAX_DIMENSION;
    this.maxSizeBytes = options.maxSizeBytes || DEFAULT_MAX_SIZE_BYTES;
  }

  /**
   * Valida el formato MIME de la imagen
   */
  static isSupportedMimeType(mimeType: string): mimeType is SupportedImageMimeType {
    return ALLOWED_MIME_TYPES.includes(mimeType as SupportedImageMimeType);
  }

  /**
   * Extrae el MIME y los datos base64 limpios a partir de un string (Data URL o base64 puro)
   */
  static parseStringData(
    input: string,
    fallbackMimeType: SupportedImageMimeType = 'image/jpeg'
  ): { base64: string; mimeType: SupportedImageMimeType } {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new AIUnreadableImageError('La imagen está vacía o no contiene datos.');
    }

    // Caso: data URL (e.g. data:image/png;base64,iVBORw...)
    if (trimmed.startsWith('data:')) {
      const match = trimmed.match(/^data:([^;]+);base64,(.+)$/s);
      if (!match) {
        throw new AIInvalidImageFormatError('El formato de la URL de datos de la imagen es inválido.');
      }
      const rawMime = match[1].toLowerCase();
      if (!ImagePreprocessor.isSupportedMimeType(rawMime)) {
        throw new AIInvalidImageFormatError(`Formato no compatible: ${rawMime}. Use JPG, PNG o WebP.`);
      }
      const rawBase64 = match[2].trim();
      if (!rawBase64) {
        throw new AIUnreadableImageError('Los datos de la imagen están vacíos.');
      }
      return { base64: rawBase64, mimeType: rawMime };
    }

    // Caso: base64 directo
    return { base64: trimmed, mimeType: fallbackMimeType };
  }

  /**
   * Convierte un Blob o File a base64 limpio
   */
  static async blobToBase64(blob: Blob): Promise<string> {
    if (typeof FileReader !== 'undefined') {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const match = result.match(/^data:[^;]+;base64,(.+)$/s);
          if (match) {
            resolve(match[1]);
          } else {
            resolve(result);
          }
        };
        reader.onerror = () => reject(new AIImageProcessingError('Error al leer el archivo de imagen.'));
        reader.readAsDataURL(blob);
      });
    }

    // Fallback para entornos Node/Vitest
    if (typeof blob.arrayBuffer === 'function') {
      const buffer = await blob.arrayBuffer();
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(buffer).toString('base64');
      }
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }

    throw new AIImageProcessingError('Entorno no compatible para la lectura de blobs de imagen.');
  }

  /**
   * Preprocesa una imagen (Blob, File o Data URL) para su uso en la capa de IA
   */
  async preprocess(
    input: Blob | File | string,
    options?: ImagePreprocessOptions
  ): Promise<PreprocessedImageResult> {
    const maxSizeBytes = options?.maxSizeBytes || this.maxSizeBytes;
    let mimeType: SupportedImageMimeType = options?.targetMimeType || 'image/jpeg';
    let base64Data: string;
    let sizeBytes = 0;

    // 1. Manejo y validación de entrada
    if (typeof input === 'string') {
      const parsed = ImagePreprocessor.parseStringData(input, mimeType);
      mimeType = parsed.mimeType;
      base64Data = parsed.base64;
      // Aproximación del tamaño en bytes a partir de base64 (3/4 de longitud)
      sizeBytes = Math.ceil((base64Data.length * 3) / 4);
    } else if (input instanceof Blob) {
      if (input.size === 0) {
        throw new AIUnreadableImageError('El archivo de imagen está vacío (0 bytes).');
      }
      const rawMime = input.type.toLowerCase();
      if (rawMime && !ImagePreprocessor.isSupportedMimeType(rawMime)) {
        throw new AIInvalidImageFormatError(
          `Formato de imagen no soportado (${rawMime}). Por favor sube una foto en formato JPG, PNG o WebP.`
        );
      }
      if (rawMime && ImagePreprocessor.isSupportedMimeType(rawMime)) {
        mimeType = rawMime;
      }
      sizeBytes = input.size;
      base64Data = await ImagePreprocessor.blobToBase64(input);
    } else {
      throw new AIImageProcessingError('Formato de entrada de imagen desconocido.');
    }

    // 2. Validación de tamaño máximo
    if (sizeBytes > maxSizeBytes) {
      throw new AIImageProcessingError(
        `La imagen supera el tamaño máximo permitido (${Math.round(maxSizeBytes / (1024 * 1024))} MB).`
      );
    }

    // 3. Normalización y verificación de dimensiones en entorno de navegador
    let width: number | undefined;
    let height: number | undefined;

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        const dimensions = await this.normalizeDimensionsInBrowser(
          base64Data,
          mimeType,
          options?.maxDimension || this.maxDimension
        );
        base64Data = dimensions.base64Data;
        width = dimensions.width;
        height = dimensions.height;
        mimeType = dimensions.mimeType;
      } catch (err) {
        // Si falla la carga de imagen por corrupción, lanzar error tipado
        if (err instanceof AIUnreadableImageError) {
          throw err;
        }
        console.warn('[ImagePreprocessor] Normalización de canvas no disponible o fallida, usando imagen directa.', err);
      }
    }

    return {
      base64Data,
      mimeType,
      width,
      height,
      sizeBytes
    };
  }

  /**
   * Carga la imagen en un Canvas de navegador para validar que sea legible y redimensionar si excede maxDimension
   */
  private normalizeDimensionsInBrowser(
    base64: string,
    mimeType: SupportedImageMimeType,
    maxDim: number
  ): Promise<{ base64Data: string; mimeType: SupportedImageMimeType; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const dataUrl = `data:${mimeType};base64,${base64}`;

      img.onload = () => {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;

        if (w === 0 || h === 0) {
          return reject(new AIUnreadableImageError('No se pudo determinar las dimensiones de la imagen.'));
        }

        // Si las dimensiones están dentro del límite, devolver directa
        if (w <= maxDim && h <= maxDim) {
          return resolve({
            base64Data: base64,
            mimeType,
            width: w,
            height: h
          });
        }

        // Redimensionar conservando proporción
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        try {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve({ base64Data: base64, mimeType, width: w, height: h });
          }

          ctx.drawImage(img, 0, 0, w, h);
          const resizedDataUrl = canvas.toDataURL(mimeType, 0.9);
          const parsed = ImagePreprocessor.parseStringData(resizedDataUrl, mimeType);

          resolve({
            base64Data: parsed.base64,
            mimeType: parsed.mimeType,
            width: w,
            height: h
          });
        } catch {
          resolve({ base64Data: base64, mimeType, width: w, height: h });
        }
      };

      img.onerror = () => {
        reject(new AIUnreadableImageError('La imagen parece estar dañada o no se puede decodificar.'));
      };

      img.src = dataUrl;
    });
  }
}

export const imagePreprocessor = new ImagePreprocessor();
