import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DatasetItem } from '@/types/sentiment';

interface ExportButtonProps {
  data: DatasetItem[];
  filename?: string;
}

export function ExportButton({ data, filename = 'dataset-sentimen' }: ExportButtonProps) {
  const handleExport = () => {
    if (data.length === 0) return;

    // Create CSV content
    const headers = ['ID', 'Teks', 'Sentimen', 'Sumber'];
    const csvContent = [
      headers.join(','),
      ...data.map((item) => 
        [
          item.id,
          `"${item.text.replace(/"/g, '""')}"`, // Escape quotes
          item.sentiment,
          item.source || ''
        ].join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExport}
      disabled={data.length === 0}
    >
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}
