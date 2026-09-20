import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

// Tailwind can't see dynamically built class names (`line-clamp-${n}`) at build time, so the
// handful of clamp sizes callers actually use are spelled out here instead.
const CLAMP_CLASSES: Record<number, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
};

interface RichTextViewProps {
  html: string;
  className?: string;
  clamp?: 1 | 2 | 3;
}

// Descriptions are stored as HTML produced by RichTextEditor (Tiptap), but anyone with a
// valid token can create/edit any task, so treat the HTML as untrusted on the way back out.
export function RichTextView({ html, className, clamp }: RichTextViewProps) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "s", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
  });

  return (
    <div
      className={cn(
        "max-w-none text-sm text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5",
        clamp && `${CLAMP_CLASSES[clamp]} **:inline`,
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
