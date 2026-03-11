export interface DocumentImage {
  id: string;
  dataUrl: string;
  caption: string;
  order: number;
}

export interface ImageSection {
  id: string;
  title: string;
  gridLayout: '1x1' | '1x2' | '2x2' | '2x3';
  images: DocumentImage[];
}

export interface TextBlock {
  type: 'text';
  id: string;
  title: string;
  body: string;
  htmlContent?: string;
  indent?: number; // 0 | 10 | 20 mm first-line indent (text-indent, NOT padding)
  attachedImages?: DocumentImage[];
  /** If false, block flows inline after the previous block (no forced page break). Default: true (new page) */
  newPageBefore?: boolean;
  /** Spacing after block in pt (0-40). Default: 0 */
  spacingAfter?: number;
  /** Font size override in pt. If undefined, uses theme default */
  fontSize?: number;
}

export interface FieldsBlock {
  type: 'fields';
  id: string;
  title: string;
  fields: { key: string; value: string }[];
  /** If false, block flows inline after the previous block. Default: true (new page) */
  newPageBefore?: boolean;
  /** Spacing after block in pt (0-40). Default: 0 */
  spacingAfter?: number;
  /** Font size override in pt. If undefined, uses theme default */
  fontSize?: number;
}

export type ContentBlock = TextBlock | FieldsBlock;

export type CalcType = 'SUM' | 'AVG' | 'COUNT' | 'NONE';

export interface TableData {
  id: string;
  title: string;
  columns: string[];
  rows: string[][];
  columnCalcs?: Record<number, CalcType>;
}

export interface Signee {
  id: string;
  name: string;
  role: string;
  titleAbove?: string; // Text above signature (e.g. "Wakil Direktur\nBidang Kemahasiswaan")
  nip?: string; // NIP/ID number below name
  signatureDataUrl?: string;
  stampDataUrl?: string;
  signatureSize?: number; // 40-150, default 80
  stampSize?: number; // 40-150, default 100
}

export type PageOrientation = 'portrait' | 'landscape';
export type PaperSize = 'A4' | 'Letter' | 'Legal' | 'F4';

export interface CustomTheme {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  dividerColor: string;
  tableHeaderBg: string;
  tableHeaderColor: string;
  altRowColor: string;
}

export interface CoverElementPos {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface CoverTextElement {
  id: string;
  text: string;
  fontSize: number; // pt
  bold: boolean;
  color?: string; // hex color, default '#000000'
  pos: CoverElementPos;
  width: number; // percentage 10-100, default 80
}

export interface CoverImageElement {
  id: string;
  dataUrl: string;
  pos: CoverElementPos;
  width: number; // percentage 5-100
}

export interface CoverTableRow {
  key: string;
  value: string;
}

export interface CoverTableElement {
  id: string;
  rows: CoverTableRow[];
  pos: CoverElementPos;
  width: number; // percentage 10-100, default 60
  fontSize: number; // pt, default 12
  bold: boolean;
  keyWidth: number; // percentage of table width for key column, default 35
}

export interface CoverLayout {
  logos: CoverElementPos;
  logoGap: number; // px gap between logos
  logoWidth: number; // percentage width for logo group, default 30
  logoAlignment: 'horizontal' | 'vertical'; // default 'horizontal'
  textElements: CoverTextElement[];
  imageElements: CoverImageElement[];
  tableElements: CoverTableElement[];
}

export const DEFAULT_COVER_LAYOUT: CoverLayout = {
  logos: { x: 50, y: 12 },
  logoGap: 40,
  logoWidth: 30,
  logoAlignment: 'horizontal',
  textElements: [],
  imageElements: [],
  tableElements: [],
};

export type DocumentType = 'dokumentasi' | 'surat-resmi';

export interface SuratResmiData {
  suratNomor: string;
  suratLampiran: string;
  suratPerihal: string;
  suratTujuan: { nama: string; jabatan: string; alamat: string };
  suratTempat: string;
  suratTembusan: string[];
  signaturePosition: 'left' | 'center' | 'right';
  suratFormat: 'dengan-tujuan' | 'judul-tengah';
  suratJudul: string; // e.g. "SURAT REKOMENDASI"
}

export const DEFAULT_SURAT_RESMI: SuratResmiData = {
  suratNomor: '',
  suratLampiran: '-',
  suratPerihal: '',
  suratTujuan: { nama: '', jabatan: '', alamat: 'Tempat' },
  suratTempat: '',
  suratTembusan: [],
  signaturePosition: 'right',
  suratFormat: 'dengan-tujuan',
  suratJudul: '',
};

export interface DocumentData {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  companyDetails: string;
  logo1DataUrl?: string;
  logo2DataUrl?: string;
  coverLogoSize: number;
  includeCover: boolean;

  // Document type
  documentType: DocumentType;

  // Document verification code
  docCode: string;
  qrEnabled: boolean;

  // TOC toggles
  includeToc: boolean;
  includeImageList: boolean;
  includeTableList: boolean;

  // Cover Layout
  coverLayout: CoverLayout;

  // KOP / Letterhead
  kopText: string;
  kopLogoDataUrl?: string;
  kopLogoRightDataUrl?: string;
  kopLogoPosition: 'left' | 'center';
  kopPosition: 'top' | 'bottom' | 'both';
  kopDividerEnabled: boolean;
  kopSpacing: number;
  footerEnabled: boolean;
  footerText: string;

  // Document Number & Revision
  docNumber: string;
  revision: number;

  // Watermark
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkOpacity: number;

  // Page Layout
  pageOrientation: PageOrientation;
  paperSize: PaperSize;

  // Content sections (images)
  sections: ImageSection[];

  // Content blocks (text paragraphs)
  contentBlocks: ContentBlock[];

  // Tables & appendices
  tables: TableData[];

  // Signatures
  signees: Signee[];

  // Custom Theme
  customTheme: CustomTheme;

  // Line Spacing
  coverLineSpacing: number;
  contentLineSpacing: number;

  // Margins (mm)
  margins: { top: number; bottom: number; left: number; right: number };

  // Surat Resmi specific
  suratResmi: SuratResmiData;

  // Meta
  status: 'draft' | 'finished';
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CUSTOM_THEME: CustomTheme = {
  fontFamily: "'Times New Roman', Times, serif",
  fontSize: 11,
  fontColor: '#000000',
  dividerColor: '#000000',
  tableHeaderBg: '#e5e7eb',
  tableHeaderColor: '#000000',
  altRowColor: '#f9f9f9',
};

export function generateDocCode(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `DOC-${year}-${code}`;
}

export const createNewDocument = (type: DocumentType = 'dokumentasi'): DocumentData => {
  // Auto-fill from company profile if available
  let kopText = '';
  let kopLogoDataUrl: string | undefined;
  let companyDetails = '';
  try {
    const raw = localStorage.getItem('company_profile');
    if (raw) {
      const profile = JSON.parse(raw);
      const lines = [profile.name || ''];
      if (profile.address) lines.push(profile.address);
      const contact: string[] = [];
      if (profile.phone) contact.push(`Telp: ${profile.phone}`);
      if (profile.email) contact.push(`Email: ${profile.email}`);
      if (profile.website) contact.push(profile.website);
      if (contact.length) lines.push(contact.join(' | '));
      kopText = lines.filter(Boolean).join('\n');
      kopLogoDataUrl = profile.logoDataUrl;
      companyDetails = profile.name || '';
    }
  } catch {}

  return {
    id: crypto.randomUUID(),
    title: '',
    subtitle: '',
    date: new Date().toISOString().split('T')[0],
    companyDetails,
    coverLogoSize: 80,
    includeCover: type === 'dokumentasi',
    documentType: type,
    docCode: generateDocCode(),
    qrEnabled: true,
    includeToc: type === 'dokumentasi',
    includeImageList: type === 'dokumentasi',
    includeTableList: type === 'dokumentasi',
    coverLayout: { ...DEFAULT_COVER_LAYOUT, textElements: [], imageElements: [], tableElements: [] },
    kopText,
    kopLogoDataUrl,
    kopLogoPosition: 'left',
    kopPosition: 'top',
    kopDividerEnabled: false,
    kopSpacing: 8,
    footerEnabled: true,
    footerText: '',
    docNumber: '',
    revision: 1,
    watermarkEnabled: false,
    watermarkText: 'DRAFT',
    watermarkOpacity: 0.1,
    pageOrientation: 'portrait',
    paperSize: 'A4',
    customTheme: { ...DEFAULT_CUSTOM_THEME },
    coverLineSpacing: 1.5,
    contentLineSpacing: 1.5,
    margins: { top: 20, bottom: 25, left: 15, right: 15 },
    sections: [],
    contentBlocks: [],
    tables: [],
    signees: [],
    suratResmi: { ...DEFAULT_SURAT_RESMI },
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};
