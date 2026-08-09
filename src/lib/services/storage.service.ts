import { request } from '../api';

export interface UploadedFile {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
  folder: string;
}

/** The backend's multer guard. Anything larger is refused outright. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ACCEPTED = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

export class UploadError extends Error {}

export async function uploadFile(
  file: File,
  folder: 'kyc' | 'products' | 'profile' | 'general' = 'general',
): Promise<UploadedFile> {
  if (!ACCEPTED.includes(file.type)) {
    throw new UploadError(
      'That file type is not supported. Use a photo (JPG or PNG) or a PDF.',
    );
  }

  const prepared = file.type.startsWith('image/')
    ? await shrinkImage(file)
    : file;

  // Checked after shrinking — a 12 MB photo usually comes back well under the limit,
  // and refusing it before trying would be refusing a file we can actually handle.
  if (prepared.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(
      'That file is too large, even after compressing. Try a smaller one.',
    );
  }

  const body = new FormData();
  body.append('file', prepared, prepared.name);

  return request<UploadedFile>(
    `/storage/upload?folder=${encodeURIComponent(folder)}`,
    { method: 'POST', body },
  );
}

export async function shrinkImage(file: File): Promise<File> {
  if (file.type === 'image/gif') return file;
  if (typeof createImageBitmap !== 'function') return file;

  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    });

    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    // Already small enough — re-encoding would only lose quality for nothing.
    if (scale === 1 && file.size <= 1_000_000) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], renameToJpg(file.name), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

function renameToJpg(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, '');
  return `${base || 'upload'}.jpg`;
}
