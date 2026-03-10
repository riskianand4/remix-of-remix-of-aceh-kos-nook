import { CustomTheme } from '@/types/document';

export interface PdfTheme {
  fontFamily: string;
  headingFont: string;
  accentColor: string;
  headerBg: string;
  tableBorderColor: string;
  tableHeaderBg: string;
  tableHeaderColor: string;
  titleColor: string;
  bodyColor: string;
  subtitleColor: string;
  dividerColor: string;
  altRowColor: string;
  fontSize: number;
}

export function buildTheme(custom?: CustomTheme): PdfTheme {
  const c = custom || {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: 11,
    fontColor: '#000000',
    dividerColor: '#000000',
    tableHeaderBg: '#e5e7eb',
    tableHeaderColor: '#000000',
    altRowColor: '#f9f9f9',
  };

  return {
    fontFamily: c.fontFamily,
    headingFont: c.fontFamily,
    accentColor: c.dividerColor,
    headerBg: c.altRowColor,
    tableBorderColor: c.dividerColor,
    tableHeaderBg: c.tableHeaderBg,
    tableHeaderColor: c.tableHeaderColor,
    titleColor: c.fontColor,
    bodyColor: c.fontColor,
    subtitleColor: c.fontColor === '#000000' ? '#333333' : c.fontColor,
    dividerColor: c.dividerColor,
    altRowColor: c.altRowColor,
    fontSize: c.fontSize,
  };
}
