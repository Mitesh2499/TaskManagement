import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { BoldIcon, ItalicIcon, ListIcon, ListOrderedIcon, StrikethroughIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  id?: string;
}

export function RichTextEditor({ value, onChange, placeholder, id }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false })],
    content: value,
    editorProps: {
      attributes: {
        id: id ?? "",
        class: cn(
          "min-h-24 rounded-b-md px-3 py-2 text-sm text-foreground focus:outline-none",
          "[&_ol]:list-decimal [&_ol]:my-1 [&_ol]:pl-5 [&_p]:my-1 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:my-1 [&_ul]:pl-5",
        ),
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? "" : editor.getHTML();
      onChange(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    // Only push external `value` changes in (e.g. switching which task is being edited) —
    // comparing first avoids clobbering the user's cursor position while they're typing,
    // since onChange already keeps `value` in sync with every keystroke.
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync on external value changes, not on every editor identity change.
  }, [value]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-md border border-input bg-transparent dark:bg-input/30">
      <div className="flex items-center gap-1 border-b border-input px-1.5 py-1">
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <BoldIcon className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <ItalicIcon className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Strikethrough"
        >
          <StrikethroughIcon className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet list"
        >
          <ListIcon className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Numbered list"
        >
          <ListOrderedIcon className="size-3.5" />
        </Toggle>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
