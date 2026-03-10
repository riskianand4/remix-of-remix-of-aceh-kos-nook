const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

export async function generateQrDataUrl(text: string, size = 200): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, size }),
    });
    if (!res.ok) throw new Error('QR generation failed');
    const { dataUrl } = await res.json();
    return dataUrl;
  } catch {
    console.error('Failed to generate QR code');
    return '';
  }
}
