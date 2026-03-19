import { TableData } from '@/types/document';

/**
 * Export a table to CSV
 */
export function exportTableCsv(table: TableData): void {
  const rows = [table.columns, ...table.rows];
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${table.title || 'table'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import CSV and return columns + rows
 */
export async function importCsvFile(file: File): Promise<{ columns: string[]; rows: string[][] }> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) throw new Error('CSV is empty');

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const columns = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);

  // Normalize row lengths
  const maxLen = columns.length;
  const normalizedRows = rows.map((row) => {
    while (row.length < maxLen) row.push('');
    return row.slice(0, maxLen);
  });

  return { columns, rows: normalizedRows };
}
