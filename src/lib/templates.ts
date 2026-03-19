import { DocumentData, createNewDocument, DEFAULT_SURAT_RESMI } from '@/types/document';
import { getCompanyProfile, buildKopFromProfile } from '@/lib/company-profile';

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'bisnis' | 'teknis' | 'legal' | 'keuangan';
  create: () => DocumentData;
}

/** Apply company profile data to a document (KOP, logo, signees) */
function applyCompanyProfile(doc: DocumentData): DocumentData {
  const profile = getCompanyProfile();
  if (!profile) return doc;

  // Auto-fill KOP text if it contains placeholders or is default
  if (doc.kopText.includes('[NAMA PERUSAHAAN]') || doc.kopText.includes('[Alamat')) {
    doc.kopText = buildKopFromProfile(profile);
  }

  // Auto-fill logo
  if (profile.logoDataUrl && !doc.kopLogoDataUrl) {
    doc.kopLogoDataUrl = profile.logoDataUrl;
  }

  // Auto-fill signees from defaults if signees have empty names
  if (profile.defaultSignees?.length) {
    const allEmpty = doc.signees.every(s => !s.name.trim());
    if (allEmpty && doc.signees.length > 0) {
      // Map profile signees to doc signees (fill as many as available)
      doc.signees = doc.signees.map((s, i) => {
        const def = profile.defaultSignees![i];
        if (def) return { ...s, name: def.name, role: def.role || s.role };
        return s;
      });
    }
  }

  return doc;
}

export const TEMPLATES: DocumentTemplate[] = [
  {
    id: 'photo-report',
    name: 'Laporan Foto Proyek',
    description: 'Dokumentasi visual progress proyek lengkap dengan cover, KOP, data proyek, tabel temuan, dan tanda tangan',
    icon: '📸',
    category: 'teknis',
    create: () => applyCompanyProfile({
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
    icon: '📨',
    category: 'bisnis',
    create: () => applyCompanyProfile({
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
    icon: '⭐',
    category: 'bisnis',
    create: () => applyCompanyProfile({
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
  // ─── New Templates ───
  {
    id: 'berita-acara',
    name: 'Berita Acara',
    description: 'Berita acara resmi dengan format standar untuk serah terima, rapat, atau kejadian',
    icon: '📋',
    category: 'bisnis',
    create: () => applyCompanyProfile({
      ...createNewDocument('surat-resmi'),
      title: 'Berita Acara',
      subtitle: '',
      docNumber: 'BA-001/[DEPT]/[BULAN]/2026',
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
        suratNomor: 'BA-001/DIR/III/2026',
        suratLampiran: '-',
        suratPerihal: 'Berita Acara',
        suratTempat: '',
        signaturePosition: 'center' as const,
        suratFormat: 'judul-tengah' as const,
        suratJudul: 'BERITA ACARA',
      },
      contentBlocks: [
        {
          type: 'text' as const,
          id: crypto.randomUUID(),
          title: '',
          newPageBefore: false,
          body: 'Pada hari ini, ______ tanggal ______ bulan ______ tahun ______, bertempat di ____________, kami yang bertanda tangan di bawah ini:\n\n1. Nama: ____________\n   Jabatan: ____________\n   Selanjutnya disebut PIHAK PERTAMA\n\n2. Nama: ____________\n   Jabatan: ____________\n   Selanjutnya disebut PIHAK KEDUA\n\nDengan ini menyatakan bahwa:\n\n[Isi berita acara]\n\nDemikian berita acara ini dibuat dengan sesungguhnya untuk dapat dipergunakan sebagaimana mestinya.',
        },
      ],
      tables: [],
      sections: [],
      signees: [
        { id: crypto.randomUUID(), name: '', role: 'Pihak Pertama' },
        { id: crypto.randomUUID(), name: '', role: 'Pihak Kedua' },
      ],
    }),
  },
  {
    id: 'surat-keterangan',
    name: 'Surat Keterangan',
    description: 'Surat keterangan kerja, domisili, atau keperluan administratif lainnya',
    icon: '📄',
    category: 'bisnis',
    create: () => applyCompanyProfile({
      ...createNewDocument('surat-resmi'),
      title: 'Surat Keterangan',
      subtitle: '',
      docNumber: 'SK-001/[DEPT]/[BULAN]/2026',
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
        suratNomor: 'SK-001/HRD/III/2026',
        suratLampiran: '-',
        suratPerihal: 'Surat Keterangan',
        suratTempat: '',
        signaturePosition: 'right' as const,
        suratFormat: 'judul-tengah' as const,
        suratJudul: 'SURAT KETERANGAN',
      },
      contentBlocks: [
        {
          type: 'text' as const,
          id: crypto.randomUUID(),
          title: '',
          newPageBefore: false,
          body: 'Yang bertanda tangan di bawah ini:\n\nNama: ____________\nJabatan: ____________\n\nDengan ini menerangkan bahwa:\n\nNama: ____________\nJabatan: ____________\nAlamat: ____________\n\nAdalah benar yang bersangkutan merupakan [karyawan/anggota/warga] kami.\n\nSurat keterangan ini dibuat untuk keperluan ____________.\n\nDemikian surat keterangan ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.',
        },
      ],
      tables: [],
      sections: [],
      signees: [
        { id: crypto.randomUUID(), name: '', role: 'Pimpinan' },
      ],
    }),
  },
  {
    id: 'notulen-rapat',
    name: 'Notulen Rapat',
    description: 'Notulen meeting lengkap dengan agenda, pembahasan, keputusan, dan daftar hadir',
    icon: '📝',
    category: 'bisnis',
    create: () => applyCompanyProfile({
      ...createNewDocument('dokumentasi'),
      title: 'Notulen Rapat',
      subtitle: '[Topik Rapat]',
      docNumber: 'NR-001/[DEPT]/[BULAN]/2026',
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
      contentBlocks: [
        {
          type: 'fields' as const,
          id: crypto.randomUUID(),
          title: 'Informasi Rapat',
          newPageBefore: false,
          fields: [
            { key: 'Hari/Tanggal', value: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
            { key: 'Waktu', value: '' },
            { key: 'Tempat', value: '' },
            { key: 'Pimpinan Rapat', value: '' },
            { key: 'Notulis', value: '' },
            { key: 'Jumlah Hadir', value: '' },
          ],
        },
        {
          type: 'text' as const,
          id: crypto.randomUUID(),
          title: 'Agenda',
          newPageBefore: false,
          body: '1. Pembukaan\n2. [Agenda 1]\n3. [Agenda 2]\n4. Lain-lain\n5. Penutup',
        },
        {
          type: 'text' as const,
          id: crypto.randomUUID(),
          title: 'Pembahasan',
          newPageBefore: false,
          body: '[Isi pembahasan rapat]',
        },
        {
          type: 'text' as const,
          id: crypto.randomUUID(),
          title: 'Keputusan',
          newPageBefore: false,
          body: '1. [Keputusan 1]\n2. [Keputusan 2]',
        },
      ],
      tables: [
        {
          id: crypto.randomUUID(),
          title: 'Daftar Hadir',
          columns: ['No', 'Nama', 'Jabatan', 'Tanda Tangan'],
          rows: [
            ['1', '', '', ''],
            ['2', '', '', ''],
            ['3', '', '', ''],
          ],
        },
      ],
      sections: [],
      signees: [
        { id: crypto.randomUUID(), name: '', role: 'Pimpinan Rapat' },
        { id: crypto.randomUUID(), name: '', role: 'Notulis' },
      ],
    }),
  },
  {
    id: 'laporan-kegiatan',
    name: 'Laporan Kegiatan',
    description: 'Laporan kegiatan/event dengan cover, data kegiatan, dokumentasi foto, dan evaluasi',
    icon: '📊',
    category: 'teknis',
    create: () => applyCompanyProfile({
      ...createNewDocument(),
      title: 'Laporan Kegiatan',
      subtitle: '[Nama Kegiatan]',
      docNumber: 'LK-001/[DEPT]/[BULAN]/2026',
      includeCover: true,
      includeToc: true,
      includeImageList: true,
      includeTableList: false,
      kopText: 'PT. [NAMA PERUSAHAAN]\nJl. [Alamat Lengkap Perusahaan]\nTelp: (021) xxx-xxxx | Email: info@perusahaan.com',
      kopDividerEnabled: true,
      kopPosition: 'top' as const,
      kopSpacing: 10,
      footerEnabled: true,
      footerText: '',
      contentBlocks: [
        {
          type: 'fields' as const,
          id: crypto.randomUUID(),
          title: 'Data Kegiatan',
          newPageBefore: false,
          fields: [
            { key: 'Nama Kegiatan', value: '' },
            { key: 'Tanggal Pelaksanaan', value: '' },
            { key: 'Tempat', value: '' },
            { key: 'Jumlah Peserta', value: '' },
            { key: 'Penanggung Jawab', value: '' },
          ],
        },
        {
          type: 'text' as const,
          id: crypto.randomUUID(),
          title: 'Latar Belakang',
          newPageBefore: false,
          body: '[Jelaskan latar belakang dan tujuan kegiatan]',
        },
        {
          type: 'text' as const,
          id: crypto.randomUUID(),
          title: 'Pelaksanaan',
          newPageBefore: false,
          body: '[Uraian pelaksanaan kegiatan]',
        },
        {
          type: 'text' as const,
          id: crypto.randomUUID(),
          title: 'Hasil & Evaluasi',
          newPageBefore: false,
          body: '[Uraian hasil dan evaluasi kegiatan]',
        },
        {
          type: 'text' as const,
          id: crypto.randomUUID(),
          title: 'Kesimpulan & Saran',
          newPageBefore: false,
          body: '[Kesimpulan dan saran untuk kegiatan berikutnya]',
        },
      ],
      sections: [
        { id: crypto.randomUUID(), title: 'Dokumentasi Kegiatan', gridLayout: '2x2' as const, images: [] },
      ],
      tables: [],
      signees: [
        { id: crypto.randomUUID(), name: '', role: 'Penanggung Jawab' },
        { id: crypto.randomUUID(), name: '', role: 'Mengetahui' },
      ],
    }),
  },
  {
    id: 'invoice',
    name: 'Invoice / Tagihan',
    description: 'Format tagihan profesional dengan tabel item, subtotal, pajak, dan total',
    icon: '💰',
    category: 'keuangan',
    create: () => applyCompanyProfile({
      ...createNewDocument('surat-resmi'),
      title: 'Invoice',
      subtitle: '',
      docNumber: 'INV-001/[BULAN]/2026',
      includeCover: false,
      includeToc: false,
      includeImageList: false,
      includeTableList: false,
      kopText: 'PT. [NAMA PERUSAHAAN]\nJl. [Alamat Lengkap Perusahaan]\nTelp: (021) xxx-xxxx\nEmail: info@perusahaan.com',
      kopDividerEnabled: true,
      kopPosition: 'top' as const,
      kopSpacing: 8,
      footerEnabled: true,
      footerText: 'Pembayaran dapat ditransfer ke rekening: [Bank] [No. Rekening] a.n. [Nama]',
      margins: { top: 20, bottom: 25, left: 25, right: 20 },
      suratResmi: {
        ...DEFAULT_SURAT_RESMI,
        suratNomor: 'INV-001/FIN/III/2026',
        suratLampiran: '-',
        suratPerihal: 'Invoice / Tagihan',
        suratTempat: '',
        signaturePosition: 'right' as const,
        suratFormat: 'judul-tengah' as const,
        suratJudul: 'INVOICE',
      },
      contentBlocks: [
        {
          type: 'fields' as const,
          id: crypto.randomUUID(),
          title: 'Kepada',
          newPageBefore: false,
          fields: [
            { key: 'Nama / Perusahaan', value: '' },
            { key: 'Alamat', value: '' },
            { key: 'Tanggal Invoice', value: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) },
            { key: 'Jatuh Tempo', value: '' },
          ],
        },
      ],
      tables: [
        {
          id: crypto.randomUUID(),
          title: 'Rincian Tagihan',
          columns: ['No', 'Uraian', 'Qty', 'Satuan', 'Harga Satuan (Rp)', 'Jumlah (Rp)'],
          rows: [
            ['1', '', '1', 'Unit', '', ''],
            ['2', '', '1', 'Unit', '', ''],
          ],
        },
      ],
      sections: [],
      signees: [
        { id: crypto.randomUUID(), name: '', role: 'Finance Manager' },
      ],
    }),
  },
];
