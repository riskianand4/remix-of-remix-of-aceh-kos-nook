import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  FileText, Plus, Sun, Moon, Undo2, Redo2, Eye, Keyboard,
  Search, Home, Settings, Layout,
} from 'lucide-react';

interface CommandPaletteProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onPreview?: () => void;
  onStepChange?: (step: number) => void;
  steps?: { id: string; label: string; step: number }[];
  isEditor?: boolean;
}

export function CommandPalette({
  onUndo, onRedo, onPreview, onStepChange, steps, isEditor,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runAction = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Ketik perintah atau cari..." />
      <CommandList>
        <CommandEmpty>Tidak ada hasil.</CommandEmpty>

        <CommandGroup heading="Navigasi">
          <CommandItem onSelect={() => runAction(() => navigate('/'))}>
            <Home className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          {isEditor && steps?.map((step, idx) => (
            <CommandItem key={step.id} onSelect={() => runAction(() => onStepChange?.(idx))}>
              <Layout className="mr-2 h-4 w-4" /> {step.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Aksi">
          <CommandItem onSelect={() => runAction(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}>
            {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            Toggle Dark Mode
          </CommandItem>
          {isEditor && (
            <>
              <CommandItem onSelect={() => runAction(() => onUndo?.())}>
                <Undo2 className="mr-2 h-4 w-4" /> Undo
              </CommandItem>
              <CommandItem onSelect={() => runAction(() => onRedo?.())}>
                <Redo2 className="mr-2 h-4 w-4" /> Redo
              </CommandItem>
              <CommandItem onSelect={() => runAction(() => onPreview?.())}>
                <Eye className="mr-2 h-4 w-4" /> Preview PDF
              </CommandItem>
            </>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Pintasan">
          <CommandItem disabled>
            <Keyboard className="mr-2 h-4 w-4" /> Ctrl+K — Command Palette
          </CommandItem>
          <CommandItem disabled>
            <Keyboard className="mr-2 h-4 w-4" /> Ctrl+S — Simpan
          </CommandItem>
          <CommandItem disabled>
            <Keyboard className="mr-2 h-4 w-4" /> Ctrl+Z — Undo
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
