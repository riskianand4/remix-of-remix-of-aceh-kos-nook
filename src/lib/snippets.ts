export interface Snippet {
  id: string;
  label: string;
  category: string;
  html: string;
  isCustom?: boolean;
}

const BUILTIN_SNIPPETS: Snippet[] = [
  {
    id: 'pembuka-hormat',
    label: 'Dengan hormat',
    category: 'Pembuka',
    html: '<p>Dengan hormat,</p>',
  },
  {
    id: 'pembuka-resmi',
    label: 'Yang bertanda tangan di bawah ini',
    category: 'Pembuka',
    html: '<p>Yang bertanda tangan di bawah ini:</p>',
  },
  {
    id: 'pembuka-menindaklanjuti',
    label: 'Menindaklanjuti surat...',
    category: 'Pembuka',
    html: '<p>Menindaklanjuti surat Saudara Nomor: ............ tanggal ............, perihal ............, dengan ini kami sampaikan bahwa:</p>',
  },
  {
    id: 'penutup-demikian',
    label: 'Demikian surat ini...',
    category: 'Penutup',
    html: '<p>Demikian surat ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.</p>',
  },
  {
    id: 'penutup-perhatian',
    label: 'Atas perhatian Bapak/Ibu...',
    category: 'Penutup',
    html: '<p>Atas perhatian Bapak/Ibu, kami mengucapkan terima kasih.</p>',
  },
  {
    id: 'penutup-konfirmasi',
    label: 'Demikian untuk menjadi perhatian...',
    category: 'Penutup',
    html: '<p>Demikian untuk menjadi perhatian dan dapat dilaksanakan sebagaimana mestinya.</p>',
  },
  {
    id: 'dasar-menimbang',
    label: 'Menimbang',
    category: 'Dasar Hukum',
    html: '<p><strong>Menimbang:</strong></p><ol><li>bahwa ............;</li><li>bahwa ............;</li></ol>',
  },
  {
    id: 'dasar-mengingat',
    label: 'Mengingat',
    category: 'Dasar Hukum',
    html: '<p><strong>Mengingat:</strong></p><ol><li>Undang-Undang Nomor ............ tentang ............;</li><li>Peraturan Pemerintah Nomor ............ tentang ............;</li></ol>',
  },
  {
    id: 'dasar-memutuskan',
    label: 'Memutuskan / Menetapkan',
    category: 'Dasar Hukum',
    html: '<p style="text-align: center"><strong>MEMUTUSKAN:</strong></p><p><strong>Menetapkan:</strong> ............</p>',
  },
  {
    id: 'hormat-kami',
    label: 'Hormat kami',
    category: 'Penutup',
    html: '<p>Hormat kami,</p>',
  },
];

const LS_KEY = 'custom_snippets';

function getCustomSnippets(): Snippet[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

function setCustomSnippets(snippets: Snippet[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(snippets));
  } catch {}
}

export function getAllSnippets(): Snippet[] {
  return [...BUILTIN_SNIPPETS, ...getCustomSnippets()];
}

export function getSnippetCategories(): string[] {
  const all = getAllSnippets();
  return [...new Set(all.map(s => s.category))];
}

export function addCustomSnippet(label: string, html: string): Snippet {
  const snippet: Snippet = {
    id: `custom-${Date.now()}`,
    label,
    category: 'Kustom',
    html,
    isCustom: true,
  };
  const customs = getCustomSnippets();
  customs.push(snippet);
  setCustomSnippets(customs);
  return snippet;
}

export function deleteCustomSnippet(id: string) {
  setCustomSnippets(getCustomSnippets().filter(s => s.id !== id));
}
