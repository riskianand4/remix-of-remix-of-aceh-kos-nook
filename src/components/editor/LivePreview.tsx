import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { DocumentData } from '@/types/document';
import { Loader2 } from 'lucide-react';

interface Props {
  doc: DocumentData;
  currentStepId?: string;
}

const PAPER_SIZES: Record<string, [number, number]> = {
  A4: [794, 1123],
  Letter: [816, 1056],
  Legal: [816, 1344],
  F4: [813, 1249],
};

const STEP_SECTION_MAP: Record<string, string[]> = {
  cover: ['cover'],
  letterhead: [],
  content: ['content'],
  surat: ['content'],
  tables: ['tables'],
  signatures: ['signatures'],
  preview: [],
};

export default function LivePreview({ doc, currentStepId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [fullHtml, setFullHtml] = useState('');
  const [scale, setScale] = useState(1);
  const timerRef = useRef<NodeJS.Timeout>();

  const orientation = (doc as any).pageOrientation || 'portrait';
  const sizeKey = (doc as any).paperSize || 'A4';
  const [baseW, baseH] = PAPER_SIZES[sizeKey] || PAPER_SIZES.A4;
  const paperW = orientation === 'landscape' ? baseH : baseW;
  const paperH = orientation === 'landscape' ? baseW : baseH;

  const recalcScale = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const availW = el.clientWidth - 48;
    setScale(availW < paperW ? availW / paperW : 1);
  }, [paperW]);

  useEffect(() => {
    recalcScale();
    const obs = new ResizeObserver(recalcScale);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [recalcScale]);

  useEffect(() => {
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const { generatePdfHtml } = await import('@/lib/pdf-builder');
        setFullHtml(await generatePdfHtml(doc));
      } catch (err) {
        console.error('Preview error:', err);
      } finally {
        setLoading(false);
      }
    }, 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [doc]);

  const { filteredPages, styles } = useMemo(() => {
    if (!fullHtml) return { filteredPages: [], styles: '' };

    const parser = new DOMParser();
    const parsed = parser.parseFromString(fullHtml, 'text/html');
    const allPages = Array.from(parsed.querySelectorAll('.page'));

    const styleMatch = fullHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const extractedStyles = styleMatch ? styleMatch[1] : '';

    let pages: string[];
    if (!currentStepId || currentStepId === 'preview') {
      pages = allPages.map(p => p.outerHTML);
    } else {
      const allowedSections = STEP_SECTION_MAP[currentStepId] || [];
      if (allowedSections.length === 0) {
        pages = allPages.map(p => p.outerHTML);
      } else {
        const matched = allPages.filter(p => {
          const section = p.getAttribute('data-section');
          return section && allowedSections.includes(section);
        });
        pages = matched.map(p => p.outerHTML);
      }
    }

    return { filteredPages: pages, styles: extractedStyles };
  }, [fullHtml, currentStepId]);

  // Build a full srcDoc for each page iframe to isolate styles
  const buildSrcDoc = useCallback((pageHtml: string) => {
    return `<!DOCTYPE html><html><head><style>${styles}</style><style>html,body{margin:0;padding:0;overflow:hidden;}</style></head><body>${pageHtml}</body></html>`;
  }, [styles]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-auto rounded-lg"
      style={{ background: '#e5e7eb' }}
    >
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && filteredPages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Belum ada konten untuk bagian ini</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-6 py-6 px-6">
        {filteredPages.map((pageHtml, i) => (
          <div
            key={`${currentStepId}-${i}`}
            style={{
              width: paperW,
              height: paperH,
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
              border: '1px solid #d1d5db',
              marginBottom: scale < 1 ? `${-(paperH * (1 - scale))}px` : 0,
            }}
          >
            <iframe
              srcDoc={buildSrcDoc(pageHtml)}
              style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none', display: 'block', background: 'white' }}
              title={`Page ${i + 1}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
