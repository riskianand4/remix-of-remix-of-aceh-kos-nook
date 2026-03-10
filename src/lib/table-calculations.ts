/**
 * Table auto-calculation formulas
 */

export type CalcType = 'SUM' | 'AVG' | 'COUNT' | 'NONE';

function parseNumbers(values: string[]): number[] {
  return values
    .map((v) => parseFloat(v.replace(/[^0-9.\-]/g, '')))
    .filter((n) => !isNaN(n));
}

export function calculateColumn(rows: string[][], colIndex: number, calcType: CalcType): string {
  if (calcType === 'NONE') return '';
  const values = rows.map((row) => row[colIndex] || '');
  const numbers = parseNumbers(values);

  if (numbers.length === 0) return '0';

  switch (calcType) {
    case 'SUM':
      return numbers.reduce((a, b) => a + b, 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });
    case 'AVG':
      return (numbers.reduce((a, b) => a + b, 0) / numbers.length).toLocaleString('id-ID', { maximumFractionDigits: 2 });
    case 'COUNT':
      return String(numbers.length);
    default:
      return '';
  }
}
