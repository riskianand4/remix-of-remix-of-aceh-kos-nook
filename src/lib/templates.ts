import { DocumentData, createNewDocument, DEFAULT_SURAT_RESMI } from '@/types/document';

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'bisnis' | 'teknis' | 'legal' | 'keuangan';
  create: () => DocumentData;
}

export const TEMPLATES: DocumentTemplate[] = [
  {
    id: 'photo-report',
    name: 'Laporan Foto Proyek',
    description: 'Dokumentasi visual progress proyek lengkap dengan cover, KOP, data proyek, tabel temuan, dan tanda tangan',
    icon: '',
    category: 'teknis',
    create: () => ({
      ...createNewDocument(),
      title: 'Laporan Dokumentasi Foto Proyek',
      subtitle: '[Nama Proyek]',
      docNumber: 'LFP-001/[DEPT]/[BULAN]/2026',
      includeCover: true,
      includeToc: true,
      includeImageList: true,
      includeTableList: true,
      kopText: 'PT. [NAMA PERUSAHAAN]\nJl. [Alamat Lengkap Perusahaan]\nTelp: (021) xxx-xxxx | Email: info@perusahaan.com',
      kopDividerEnabled: true,
      kopPosition: 'top' as const,
      kopSpacing: 10,
      footerEnabled: true,
      footerText: 'Laporan ini bersifat rahasia dan hanya untuk kalangan internal.',
      watermarkEnabled: false,
      watermarkText: 'DRAFT',
      watermarkOpacity: 0.08,
      contentBlocks: [
        {
          type: 'fields' as const,
          id: crypto.randomUUID(),
          title: 'Data Proyek',
          newPageBefore: false,
          fields: [
            { key: 'Nama Proyek', value: '' },
            { key: 'Lokasi', value: '' },
            { key: 'Nomor Kontrak', value: '' },
            { key: 'Kontraktor', value: '' },
            { key: 'Konsultan Pengawas', value: '' },
            { key: 'Periode Pelaporan', value: '' },
            { key: 'Tanggal Laporan', value: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) },
            { key: 'Progress Fisik', value: '0%' },
          ],
        },
        {
          type: 'text' as const,
          id: crypto.randomUUID(),
          title: 'Pendahuluan',
          newPageBefore: false,
          body: 'Laporan dokumentasi foto ini dibuat sebagai bukti visual perkembangan pekerjaan di lapangan. Laporan mencakup kondisi eksisting, progress pekerjaan, dan temuan-temuan yang perlu mendapat perhatian.',
        },
      ],
      sections: [
        { id: crypto.randomUUID(), title: 'Kondisi Existing / Before', gridLayout: '2x2' as const, images: [] },
        { id: crypto.randomUUID(), title: 'Progress Pekerjaan', gridLayout: '2x2' as const, images: [] },
        { id: crypto.randomUUID(), title: 'Detail Pekerjaan', gridLayout: '2x3' as const, images: [] },
        { id: crypto.randomUUID(), title: 'Kondisi After', gridLayout: '2x2' as const, images: [] },
      ],
      tables: [
        {
          id: crypto.randomUUID(),
          title: 'Daftar Temuan & Rekomendasi',
          columns: ['No', 'Lokasi', 'Uraian Temuan', 'Kondisi', 'Rekomendasi', 'Status'],
          rows: [
            ['1', '', '', 'Baik', '', 'Open'],
            ['2', '', '', 'Perlu Perbaikan', '', 'Open'],
          ],
        },
        {
          id: crypto.randomUUID(),
          title: 'Rencana Tindak Lanjut',
          columns: ['No', 'Kegiatan', 'Target Tanggal', 'Penanggung Jawab', 'Status'],
          rows: [['1', '', '', '', 'Belum Mulai']],
        },
      ],
      signees: [
        { id: crypto.randomUUID(), name: '', role: 'Pelaksana Lapangan' },
        { id: crypto.randomUUID(), name: '', role: 'Konsultan Pengawas' },
        { id: crypto.randomUUID(), name: '', role: 'Project Manager' },
      ],
    }),
  },
  {
    id: 'official-letter',
    name: 'Surat Resmi',
    description: 'Surat resmi perusahaan dengan KOP, nomor surat, dan format standar administratif',
    icon: '',
    category: 'bisnis',
    create: () => ({
      ...createNewDocument('surat-resmi'),
      title: 'Surat Resmi',
      subtitle: '',
      docNumber: 'SR-001/[DEPT]/[BULAN]/2026',
      includeCover: false,
      includeToc: false,
      includeImageList: false,
      includeTableList: false,
      kopText: 'PT. [NAMA PERUSAHAAN]\nJl. [Alamat Lengkap Perusahaan]\nTelp: (021) xxx-xxxx | Fax: (021) xxx-xxxx\nEmail: info@perusahaan.com | Website: www.perusahaan.com',
      kopDividerEnabled: true,
      kopPosition: 'top' as const,
      kopSpacing: 8,
      footerEnabled: true,
      footerText: 'Dokumen ini merupakan surat resmi yang sah.',
      margins: { top: 20, bottom: 25, left: 25, right: 20 },
      suratResmi: {
        ...DEFAULT_SURAT_RESMI,
        suratNomor: '001/DIR/III/2026',
        suratLampiran: '-',
        suratPerihal: '',
        suratTempat: '',
        signaturePosition: 'right' as const,
      },
      contentBlocks: [
        {
          type: 'text' as const,
          id: crypto.randomUUID(),
          title: '',
          newPageBefore: false,
          body: 'Dengan hormat,\n\nBersama surat ini kami sampaikan bahwa...\n\n[Isi surat di sini]\n\nDemikian surat ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.\n\nWassalam,',
        },
      ],
      tables: [],
      sections: [],
      signees: [
        { id: crypto.randomUUID(), name: '', role: 'Direktur Utama' },
      ],
    }),
  },
  {
    id: 'surat-rekomendasi',
    name: 'Surat Rekomendasi',
    description: 'Surat rekomendasi resmi dengan format standar untuk keperluan profesional',
    icon: '',
    category: 'bisnis',
    create: () => ({
      ...createNewDocument('surat-resmi'),
      title: 'Surat Rekomendasi',
      subtitle: '',
      docNumber: 'SREK-001/[DEPT]/[BULAN]/2026',
      includeCover: false,
      includeToc: false,
      includeImageList: false,
      includeTableList: false,
      kopText: 'PT. [NAMA PERUSAHAAN]\nJl. [Alamat Lengkap Perusahaan]\nTelp: (021) xxx-xxxx\nEmail: info@perusahaan.com',
      kopDividerEnabled: true,
      kopPosition: 'top' as const,
      kopSpacing: 8,
      footerEnabled: true,
      footerText: '',
      margins: { top: 20, bottom: 25, left: 25, right: 20 },
      suratResmi: {
        ...DEFAULT_SURAT_RESMI,
        suratNomor: 'SREK-001/DIR/III/2026',
        suratLampiran: '-',
        suratPerihal: 'Surat Rekomendasi',
        suratTempat: '',
        signaturePosition: 'right' as const,
      },
      contentBlocks: [
        {
          type: 'text' as const,
          id: crypto.randomUUID(),
          title: '',
          newPageBefore: false,
          body: 'Dengan hormat,\n\nYang bertanda tangan di bawah ini:\n\nNama: [Nama Pemberi Rekomendasi]\nJabatan: [Jabatan]\nInstansi: [Nama Instansi]\n\nDengan ini memberikan rekomendasi kepada:\n\nNama: [Nama yang Direkomendasikan]\nJabatan: [Jabatan]\n\n[Isi rekomendasi]\n\nDemikian surat rekomendasi ini dibuat untuk dapat dipergunakan sebagaimana mestinya.',
        },
      ],
      tables: [],
      sections: [],
      signees: [
        { id: crypto.randomUUID(), name: '', role: 'Pemberi Rekomendasi' },
      ],
    }),
  },
];
