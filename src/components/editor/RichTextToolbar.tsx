import { type Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading1, Heading2, Heading3, Quote, Code, Minus, Link, Undo2, Redo2,
  ImagePlus,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SnippetPicker from './SnippetPicker';

interface Props {
  editor: Editor | null;
}

export default function RichTextToolbar({ editor }: Props) {
  if (!editor) return null;

  const ToolBtn = ({ onClick, active, icon: Icon, label }: {
    onClick: () => void; active?: boolean; icon: React.ElementType; label: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={active ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          onClick={onClick}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );

  const setLink = () => {
    const url = window.prompt('URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const insertImage = () => {
    if ((editor as any)._insertImage) {
      (editor as any)._insertImage();
    }
  };

  const handleSnippetInsert = (html: string) => {
    editor.chain().focus().insertContent(html).run();
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 bg-muted/30 px-2 py-1.5">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={Bold} label="Bold" />
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={Italic} label="Italic" />
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} icon={Underline} label="Underline" />
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} icon={Strikethrough} label="Strikethrough" />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} icon={Heading1} label="Heading 1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} icon={Heading2} label="Heading 2" />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} icon={Heading3} label="Heading 3" />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={List} label="Bullet List" />
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} icon={ListOrdered} label="Numbered List" />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} icon={AlignLeft} label="Align Left" />
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} icon={AlignCenter} label="Align Center" />
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} icon={AlignRight} label="Align Right" />
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} icon={AlignJustify} label="Justify" />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} icon={Quote} label="Quote" />
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} icon={Code} label="Code Block" />
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={Minus} label="Horizontal Rule" />
        <ToolBtn onClick={setLink} active={editor.isActive('link')} icon={Link} label="Link" />
        <ToolBtn onClick={insertImage} icon={ImagePlus} label="Sisipkan Gambar" />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <SnippetPicker onInsert={handleSnippetInsert} />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolBtn onClick={() => editor.chain().focus().undo().run()} icon={Undo2} label="Undo" />
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} icon={Redo2} label="Redo" />
      </div>
    </TooltipProvider>
  );
}
