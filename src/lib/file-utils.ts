import { compressImage } from '@/lib/image-utils';

export async function fileToDataUrl(file: File): Promise<string> {
  // Compress images, pass through non-images
  if (file.type.startsWith('image/')) {
    return compressImage(file);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
