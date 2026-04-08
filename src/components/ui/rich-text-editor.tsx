"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered } from 'lucide-react';
import { Toggle } from "@/components/ui/toggle";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base max-w-none focus:outline-none w-full min-h-[250px] p-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden flex flex-col bg-white dark:bg-gray-800">
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Toggle bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Toggle italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('strike')}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Toggle strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>

        <div className="w-[1px] h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria-label="Toggle Header 1"
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="Toggle Header 2"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        
        <div className="w-[1px] h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Toggle bullet list"
        >
          <List className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Toggle ordered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
      </div>

      <div className="flex-1 cursor-text overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
