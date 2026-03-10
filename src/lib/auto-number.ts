const LS_KEY = 'auto_number_counters';
const LS_FORMAT = 'auto_number_format';

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

interface Counters {
  [key: string]: number; // key = "YYYY" or "YYYY-MM"
}

function getCounters(): Counters {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

function setCounters(c: Counters) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(c));
  } catch {}
}

export function getNumberFormat(): string {
  return localStorage.getItem(LS_FORMAT) || '{NO}/{DEPT}/{BULAN}/{TAHUN}';
}

export function setNumberFormat(fmt: string) {
  try {
    localStorage.setItem(LS_FORMAT, fmt);
  } catch {}
}

export function generateNextNumber(dept: string = 'UM'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const counterKey = `${year}-${month}`;

  const counters = getCounters();
  const current = (counters[counterKey] || 0) + 1;
  counters[counterKey] = current;
  setCounters(counters);

  const format = getNumberFormat();
  return format
    .replace('{NO}', current.toString().padStart(3, '0'))
    .replace('{DEPT}', dept)
    .replace('{BULAN}', ROMAN_MONTHS[month])
    .replace('{TAHUN}', year.toString());
}
