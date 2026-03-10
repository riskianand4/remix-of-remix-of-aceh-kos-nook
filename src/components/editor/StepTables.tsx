import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentData, TableData, CalcType } from '@/types/document';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, PlusCircle, X, Copy, ClipboardPaste, FileUp, FileDown, Calculator } from 'lucide-react';
import DraggableList, { DragHandle } from '@/components/editor/DraggableList';
import ConfirmDialog from '@/components/editor/ConfirmDialog';
import { duplicateTable, getClipboard } from '@/lib/clipboard-storage';
import { useClipboard } from '@/hooks/useClipboard';
import { toast } from '@/hooks/use-toast';
import { exportTableCsv, importCsvFile } from '@/lib/csv-utils';
import { calculateColumn } from '@/lib/table-calculations';

interface Props {
  doc: DocumentData;
  updateDoc: (updates: Partial<DocumentData>) => void;
}

export default function StepTables({ doc, updateDoc }: Props) {
  const { t } = useTranslation();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { clipboard, copy } = useClipboard();
  const importRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const addTable = () => {
    const table: TableData = {
      id: crypto.randomUUID(),
      title: `${t('tables.title')} ${doc.tables.length + 1}`,
      columns: ['No', 'Item', 'Keterangan'],
      rows: [['1', '', '']],
    };
    updateDoc({ tables: [...doc.tables, table] });
  };

  const updateTable = (tableId: string, updates: Partial<TableData>) => {
    updateDoc({
      tables: doc.tables.map((t) => (t.id === tableId ? { ...t, ...updates } : t)),
    });
  };

  const removeTable = (tableId: string) => {
    updateDoc({ tables: doc.tables.filter((t) => t.id !== tableId) });
    setDeleteTarget(null);
  };

  const handleDuplicateTable = (table: TableData) => {
    const dup = duplicateTable(table);
    updateDoc({ tables: [...doc.tables, dup] });
    toast({ title: `✓ ${t('tables.tableDuplicated')}`, duration: 1500 });
  };

  const handlePaste = () => {
    const cb = getClipboard();
    if (!cb || cb.type !== 'table') return;
    const tbl = { ...cb.data, id: crypto.randomUUID() } as TableData;
    tbl.rows = tbl.rows?.map(row => [...row]) || [];
    updateDoc({ tables: [...doc.tables, tbl] });
    toast({ title: `📋 ${t('tables.tablePasted')}`, duration: 1500 });
  };

  const addColumn = (tableId: string) => {
    const table = doc.tables.find((t) => t.id === tableId);
    if (!table) return;
    updateTable(tableId, {
      columns: [...table.columns, `${t('tables.column')} ${table.columns.length + 1}`],
      rows: table.rows.map((row) => [...row, '']),
    });
  };

  const removeColumn = (tableId: string, colIdx: number) => {
    const table = doc.tables.find((t) => t.id === tableId);
    if (!table || table.columns.length <= 1) return;
    const newCalcs = { ...table.columnCalcs };
    delete newCalcs[colIdx];
    updateTable(tableId, {
      columns: table.columns.filter((_, i) => i !== colIdx),
      rows: table.rows.map((row) => row.filter((_, i) => i !== colIdx)),
      columnCalcs: newCalcs,
    });
  };

  const addRow = (tableId: string) => {
    const table = doc.tables.find((t) => t.id === tableId);
    if (!table) return;
    const newRow = table.columns.map((_, i) => (i === 0 ? String(table.rows.length + 1) : ''));
    updateTable(tableId, { rows: [...table.rows, newRow] });
  };

  const removeRow = (tableId: string, rowIdx: number) => {
    const table = doc.tables.find((t) => t.id === tableId);
    if (!table || table.rows.length <= 1) return;
    updateTable(tableId, { rows: table.rows.filter((_, i) => i !== rowIdx) });
  };

  const updateCell = (tableId: string, rowIdx: number, colIdx: number, value: string) => {
    const table = doc.tables.find((t) => t.id === tableId);
    if (!table) return;
    const rows = table.rows.map((row, ri) =>
      ri === rowIdx ? row.map((cell, ci) => (ci === colIdx ? value : cell)) : row
    );
    updateTable(tableId, { rows });
  };

  const updateColumnName = (tableId: string, colIdx: number, value: string) => {
    const table = doc.tables.find((t) => t.id === tableId);
    if (!table) return;
    updateTable(tableId, {
      columns: table.columns.map((col, i) => (i === colIdx ? value : col)),
    });
  };

  const handleImportCsv = async (tableId: string, file: File) => {
    try {
      const { columns, rows } = await importCsvFile(file);
      updateTable(tableId, { columns, rows });
      toast({ title: `✓ CSV imported (${rows.length} rows)`, duration: 2000 });
    } catch (err: any) {
      toast({ title: 'CSV import failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleExportCsv = (table: TableData) => {
    exportTableCsv(table);
    toast({ title: `✓ ${t('tables.exportCsv')}`, duration: 1500 });
  };

  const setColumnCalc = (tableId: string, colIdx: number, calc: CalcType) => {
    const table = doc.tables.find((t) => t.id === tableId);
    if (!table) return;
    const calcs = { ...(table.columnCalcs || {}), [colIdx]: calc };
    updateTable(tableId, { columnCalcs: calcs });
  };

  const canPaste = clipboard?.type === 'table';
  const hasAnyCalcs = (table: TableData) => {
    if (!table.columnCalcs) return false;
    return Object.values(table.columnCalcs).some(c => c !== 'NONE');
  };

  return (
    <div className="space-y-6" data-tour="step-tables">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('tables.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('tables.description')}</p>
        </div>
        <div className="flex gap-2">
          {canPaste && (
            <Button variant="outline" onClick={handlePaste} className="gap-2">
              <ClipboardPaste className="h-4 w-4" /> {t('tables.pasteTable')}
            </Button>
          )}
          <Button onClick={addTable} className="gap-2">
            <Plus className="h-4 w-4" /> {t('tables.addTable')}
          </Button>
        </div>
      </div>

      {doc.tables.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">{t('tables.noTables')}</p>
          </CardContent>
        </Card>
      )}

      <DraggableList
        items={doc.tables}
        onReorder={(items) => updateDoc({ tables: items })}
        className="space-y-4"
        renderItem={(table, _idx, dragProps) => (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2 flex-1">
                <DragHandle {...dragProps} />
                <Input
                  value={table.title}
                  onChange={(e) => updateTable(table.id, { title: e.target.value })}
                  className="max-w-sm text-base font-semibold"
                  placeholder={t('tables.tableTitle')}
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {/* CSV Buttons */}
                <input
                  ref={el => { importRefs.current[table.id] = el; }}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportCsv(table.id, file);
                    e.target.value = '';
                  }}
                />
                <Button variant="outline" size="sm" onClick={() => importRefs.current[table.id]?.click()} className="gap-1 text-xs">
                  <FileUp className="h-3 w-3" /> {t('tables.importCsv')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportCsv(table)} className="gap-1 text-xs">
                  <FileDown className="h-3 w-3" /> {t('tables.exportCsv')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => addColumn(table.id)} className="gap-1 text-xs">
                  <PlusCircle className="h-3 w-3" /> {t('tables.column')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => addRow(table.id)} className="gap-1 text-xs">
                  <PlusCircle className="h-3 w-3" /> {t('tables.row')}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => copy('table', table)} title={t('common.copy')}>
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDuplicateTable(table)} title={t('common.duplicate')}>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(table.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      {table.columns.map((col, ci) => (
                        <th key={ci} className="border-b px-3 py-2">
                          <div className="flex items-center gap-1">
                            <Input
                              value={col}
                              onChange={(e) => updateColumnName(table.id, ci, e.target.value)}
                              className="h-7 border-0 bg-transparent p-0 text-xs font-bold"
                            />
                            {table.columns.length > 1 && (
                              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => removeColumn(table.id, ci)}>
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="w-10 border-b px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, ri) => (
                      <tr key={ri} className={ri % 2 === 1 ? 'bg-muted/30' : 'hover:bg-muted/50'}>
                        {row.map((cell, ci) => (
                          <td key={ci} className="border-b px-3 py-1">
                            <Input
                              value={cell}
                              onChange={(e) => updateCell(table.id, ri, ci, e.target.value)}
                              className="h-7 border-0 bg-transparent p-0 text-xs"
                            />
                          </td>
                        ))}
                        <td className="border-b px-2 py-1">
                          {table.rows.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeRow(table.id, ri)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Calculation Footer */}
                  <tfoot>
                    <tr className="bg-muted/60 border-t-2">
                      {table.columns.map((_, ci) => {
                        const calc = table.columnCalcs?.[ci] || 'NONE';
                        const result = calc !== 'NONE' ? calculateColumn(table.rows, ci, calc) : '';
                        return (
                          <td key={ci} className="px-2 py-1.5">
                            <div className="flex items-center gap-1">
                              <Select
                                value={calc}
                                onValueChange={(v) => setColumnCalc(table.id, ci, v as CalcType)}
                              >
                                <SelectTrigger className="h-6 w-[72px] text-[10px] border-dashed">
                                  <Calculator className="h-2.5 w-2.5 mr-0.5" />
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NONE">—</SelectItem>
                                  <SelectItem value="SUM">SUM</SelectItem>
                                  <SelectItem value="AVG">AVG</SelectItem>
                                  <SelectItem value="COUNT">COUNT</SelectItem>
                                </SelectContent>
                              </Select>
                              {result && (
                                <span className="text-xs font-bold text-primary ml-1">{result}</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={t('tables.deleteTable')}
        description={t('tables.deleteTableDesc')}
        onConfirm={() => deleteTarget && removeTable(deleteTarget)}
      />
    </div>
  );
}
