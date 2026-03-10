import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import UnderlineExt from '@tiptap/extension-underline';
import LinkExt from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import ImageExt from '@tiptap/extension-image';
import RichTextToolbar from './RichTextToolbar';
import { useEffect, useCallback } from 'react';
import { compressImage } from '@/lib/image-utils';

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

async function fileToBase64(file: File): Promise<string> {
  if (file.type.startsWith('image/')) {
    return compressImage(file, 800, 800, 0.75);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function RichTextEditor({ content, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      UnderlineExt,
      LinkExt.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing...' }),
      ImageExt.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'inline-editor-image',
        },
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-4 py-3',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved || !event.dataTransfer?.files?.length) return false;
        const file = event.dataTransfer.files[0];
        if (!file.type.startsWith('image/')) return false;
        event.preventDefault();
        fileToBase64(file).then((src) => {
          const { schema } = view.state;
          const node = schema.nodes.image.create({ src });
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (pos) {
            const tr = view.state.tr.insert(pos.pos, node);
            view.dispatch(tr);
          }
        });
        return true;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items) as DataTransferItem[]) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) continue;
            fileToBase64(file).then((src) => {
              const { schema } = view.state;
              const node = schema.nodes.image.create({ src });
              const tr = view.state.tr.replaceSelectionWith(node);
              view.dispatch(tr);
            });
            return true;
          }
        }
        return false;
      },
    },
  });

  const insertImage = useCallback(() => {
    if (!editor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const src = await fileToBase64(file);
      editor.chain().focus().setImage({ src }).run();
    };
    input.click();
  }, [editor]);

  // Expose insertImage on editor for toolbar
  useEffect(() => {
    if (editor) {
      (editor as any)._insertImage = insertImage;
    }
  }, [editor, insertImage]);

  // Sync external content changes
  useEffect(() => {
    if (editor && !editor.isDestroyed && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', { emitUpdate: false });
    }
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.destroy();
      }
    };
  }, [editor]);

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <RichTextToolbar editor={editor} />
      <div className="relative">
        <EditorContent editor={editor} />
        <style>{`
          .inline-editor-image {
            max-width: 100%;
            max-height: 300px;
            border-radius: 4px;
            margin: 4px 2px;
            cursor: pointer;
            display: inline-block;
          }
          .inline-editor-image.ProseMirror-selectednode {
            outline: 2px solid hsl(var(--primary));
            outline-offset: 2px;
          }
        `}</style>
      </div>
    </div>
  );
}
