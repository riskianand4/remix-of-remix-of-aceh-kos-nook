import { useState } from 'react';
import { getAllSnippets, getSnippetCategories, addCustomSnippet, deleteCustomSnippet, Snippet } from '@/lib/snippets';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Props {
  onInsert: (html: string) => void;
}

export default function SnippetPicker({ onInsert }: Props) {
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newHtml, setNewHtml] = useState('');
  const [, forceUpdate] = useState(0);

  const snippets = getAllSnippets();
  const categories = getSnippetCategories();

  const handleInsert = (snippet: Snippet) => {
    onInsert(snippet.html);
    setOpen(false);
    toast({ title: `✓ "${snippet.label}" disisipkan`, duration: 1500 });
  };

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    const html = newHtml.trim() || `<p>${newLabel}</p>`;
    addCustomSnippet(newLabel.trim(), html);
    setNewLabel('');
    setNewHtml('');
    setShowAdd(false);
    forceUpdate(n => n + 1);
    toast({ title: '✓ Snippet disimpan', duration: 1500 });
  };

  const handleDelete = (id: string) => {
    deleteCustomSnippet(id);
    forceUpdate(n => n + 1);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Sisipkan Cepat">
          <Zap className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" side="bottom">
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Sisipkan Cepat</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {showAdd && (
          <div className="px-3 py-2 border-b space-y-2">
            <Input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Nama snippet..."
              className="h-7 text-xs"
            />
            <Input
              value={newHtml}
              onChange={e => setNewHtml(e.target.value)}
              placeholder="Teks (opsional, bisa HTML)..."
              className="h-7 text-xs"
            />
            <Button size="sm" className="w-full h-7 text-xs" onClick={handleAdd} disabled={!newLabel.trim()}>
              Simpan Snippet
            </Button>
          </div>
        )}

        <ScrollArea className="max-h-64">
          <div className="p-1">
            {categories.map(cat => (
              <div key={cat} className="mb-1">
                <p className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{cat}</p>
                {snippets.filter(s => s.category === cat).map(snippet => (
                  <div key={snippet.id} className="flex items-center group/snippet">
                    <button
                      className="flex-1 text-left px-2 py-1.5 text-xs rounded hover:bg-muted transition-colors text-foreground"
                      onClick={() => handleInsert(snippet)}
                    >
                      {snippet.label}
                    </button>
                    {snippet.isCustom && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover/snippet:opacity-100 text-destructive shrink-0"
                        onClick={() => handleDelete(snippet.id)}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
