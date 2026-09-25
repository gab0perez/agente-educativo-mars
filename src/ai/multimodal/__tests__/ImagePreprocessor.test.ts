import { describe, it, expect } from 'vitest';
import { ImagePreprocessor } from '../ImagePreprocessor';
import {
  AIInvalidImageFormatError,
  AIImageProcessingError,
  AIUnreadableImageError
} from '../../domain/errors';

describe('TG17 — ImagePreprocessor Unit Tests', () => {
  const preprocessor = new ImagePreprocessor({
    maxDimension: 2048,
    maxSizeBytes: 2 * 1024 * 1024 // 2 MB para pruebas
  });

  // Sample valid PNG base64 1x1 pixel
  const sampleValidPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const sampleDataUrl = `data:image/png;base64,${sampleValidPngBase64}`;

  it('Test 1: Preprocesa correctamente una imagen Data URL en formato PNG', async () => {
    const result = await preprocessor.preprocess(sampleDataUrl);

    expect(result.mimeType).toBe('image/png');
    expect(result.base64Data).toBe(sampleValidPngBase64);
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it('Test 2: Preprocesa correctamente una imagen Blob', async () => {
    const blob = new Blob(['sample-image-bytes-pretend'], { type: 'image/jpeg' });
    const result = await preprocessor.preprocess(blob);

    expect(result.mimeType).toBe('image/jpeg');
    expect(result.base64Data).toBeDefined();
    expect(result.sizeBytes).toBe(blob.size);
  });

  it('Test 3: Rechaza formatos MIME no soportados (ej: image/gif, application/pdf)', async () => {
    const invalidDataUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    await expect(preprocessor.preprocess(invalidDataUrl)).rejects.toThrow(
      AIInvalidImageFormatError
    );

    const pdfBlob = new Blob(['dummy pdf'], { type: 'application/pdf' });
    await expect(preprocessor.preprocess(pdfBlob)).rejects.toThrow(
      AIInvalidImageFormatError
    );
  });

  it('Test 4: Rechaza imágenes que exceden el tamaño máximo configurado', async () => {
    // Crear un blob de 3 MB cuando el límite configurado es 2 MB
    const largeBuffer = new Uint8Array(3 * 1024 * 1024);
    const largeBlob = new Blob([largeBuffer], { type: 'image/jpeg' });

    await expect(preprocessor.preprocess(largeBlob)).rejects.toThrow(
      AIImageProcessingError
    );
  });

  it('Test 5: Detecta imágenes vacías o corruptas lanzando AIUnreadableImageError', async () => {
    const emptyBlob = new Blob([], { type: 'image/jpeg' });
    await expect(preprocessor.preprocess(emptyBlob)).rejects.toThrow(
      AIUnreadableImageError
    );

    const emptyString = '   ';
    await expect(preprocessor.preprocess(emptyString)).rejects.toThrow(
      AIUnreadableImageError
    );
  });

  it('Test 6: Normaliza correctamente la entrada de base64 puro sin prefijo', async () => {
    const result = await preprocessor.preprocess(sampleValidPngBase64, {
      targetMimeType: 'image/webp'
    });

    expect(result.base64Data).toBe(sampleValidPngBase64);
    expect(result.mimeType).toBe('image/webp');
  });
});
