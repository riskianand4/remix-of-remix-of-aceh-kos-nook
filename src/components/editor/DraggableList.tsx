import { useState, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, dragHandleProps: DragHandleProps) => React.ReactNode;
  className?: string;
}

export interface DragHandleProps {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export default function DraggableList<T extends { id: string }>({ items, onReorder, renderItem, className }: Props<T>) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    dragRef.current = idx;
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
    dragRef.current = null;
  };

  const handleDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIdx(idx);
  };

  const handleDrop = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragRef.current;
    if (from === null || from === idx) { handleDragEnd(); return; }
    const reordered = [...items];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(idx, 0, moved);
    onReorder(reordered);
    handleDragEnd();
  };

  return (
    <div className={className}>
      {items.map((item, idx) => (
        <div
          key={item.id}
          onDragOver={handleDragOver(idx)}
          onDrop={handleDrop(idx)}
          className={cn(
            'transition-all duration-200',
            dragIdx === idx && 'opacity-40 scale-[0.98]',
            overIdx === idx && dragIdx !== idx && 'border-t-2 border-primary',
          )}
        >
          {renderItem(item, idx, {
            draggable: true,
            onDragStart: handleDragStart(idx),
            onDragEnd: handleDragEnd,
          })}
        </div>
      ))}
    </div>
  );
}

export function DragHandle(props: DragHandleProps) {
  return (
    <button
      type="button"
      className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors"
      {...props}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}
