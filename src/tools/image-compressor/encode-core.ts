import { MAX_DIMENSION, targetSize, type InputMime } from './logic';

/*
 * Shared decode → resize → encode step, used by the worker (OffscreenCanvas) and by the
 * main-thread fallback (HTMLCanvasElement). Re-encoding through a canvas also strips metadata
 * such as EXIF and GPS location.
 */

export interface EncodeJob {
  file: Blob;
  type: InputMime;
  quality: number;
  maxWidth: number | null;
}

export interface EncodeOutput {
  blob: Blob;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
}

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;

export async function encodeWith(
  createCanvas: (w: number, h: number) => AnyCanvas,
  job: EncodeJob,
): Promise<EncodeOutput> {
  // imageOrientation applies the EXIF rotation, so phone photos stay upright.
  const bitmap = await createImageBitmap(job.file, { imageOrientation: 'from-image' });
  try {
    if (bitmap.width > MAX_DIMENSION || bitmap.height > MAX_DIMENSION) {
      throw new Error(`Images larger than ${MAX_DIMENSION} pixels on a side are not supported.`);
    }
    const size = targetSize(bitmap.width, bitmap.height, job.maxWidth);
    const canvas = createCanvas(size.width, size.height);
    const ctx = canvas.getContext('2d') as
      CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!ctx) throw new Error('Your browser could not process this image.');
    if (job.type === 'image/jpeg') {
      // JPG has no transparency: fill with white instead of the default black.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size.width, size.height);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);

    const quality = job.type === 'image/png' ? undefined : job.quality;
    const blob =
      'convertToBlob' in canvas
        ? await canvas.convertToBlob({ type: job.type, quality })
        : await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Encoding failed.'))), job.type, quality),
          );
    return {
      blob,
      width: size.width,
      height: size.height,
      sourceWidth: bitmap.width,
      sourceHeight: bitmap.height,
    };
  } finally {
    bitmap.close();
  }
}
