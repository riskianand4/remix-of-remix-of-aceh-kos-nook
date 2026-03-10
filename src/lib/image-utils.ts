const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const QUALITY = 0.8;

function getOutputFormat(file: File): { mime: string; ext: string } {
  const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
  return isPng ? { mime: 'image/png', ext: 'png' } : { mime: 'image/jpeg', ext: 'jpg' };
}

export function compressImage(file: File, maxWidth = MAX_WIDTH, maxHeight = MAX_HEIGHT, quality = QUALITY): Promise<string> {
  return new Promise((resolve, reject) => {
    const { mime } = getOutputFormat(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context failed')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(mime, mime === 'image/png' ? undefined : quality));
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function normalizeImage(file: File, targetWidth: number, quality = QUALITY): Promise<string> {
  return new Promise((resolve, reject) => {
    const { mime } = getOutputFormat(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const actualWidth = Math.min(targetWidth, img.width);
        const ratio = actualWidth / img.width;
        const width = actualWidth;
        const height = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context failed')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(mime, mime === 'image/png' ? undefined : quality));
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function estimateBase64Size(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.round((base64.length * 3) / 4);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
