import { useEffect, type ReactNode } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import * as Popover from "@radix-ui/react-popover";
import { Icon } from "../icons";
import { cn } from "../../lib/cn";

const TEXT_COLORS = [
  "#eceff8",
  "#9aa1b5",
  "#8ea0ff",
  "#b48cff",
  "#54a9ff",
  "#4fd1c5",
  "#3dd68c",
  "#ffb224",
  "#ff7aa2",
  "#ff6369",
];

const HIGHLIGHTS = [
  "#ffe066",
  "#ffd8a8",
  "#ffc9c9",
  "#ffa8a8",
  "#d0bfff",
  "#b2f2bb",
  "#a5d8ff",
  "#99e9f2",
  "#e9ecef",
  "#f783ac",
];

export interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  /** Araç çubuğunu gizle (sade okuma/yazma) */
  hideToolbar?: boolean;
}

export function RichEditor({ value, onChange, placeholder, className, hideToolbar }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener", target: "_blank" } },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "Yazmaya başla…" }),
      Image.configure({ inline: false, HTMLAttributes: { class: "rounded-xl" } }),
    ],
    content: value || "",
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "markdown rich-content focus:outline-none" },
    },
  });

  // Dış değer değişince (başka not açılınca) yükle
  useEffect(() => {
    if (!editor) return;
    const next = value || "";
    if (next !== editor.getHTML()) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return <div className="p-4 text-sm text-muted">Editör yükleniyor…</div>;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {!hideToolbar && <Toolbar editor={editor} />}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}

/* ---------------- Araç çubuğu ---------------- */

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-1.5 bg-bg2/30">
      {/* Geri al / Yinele */}
      <TBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Geri al">
        <Svg><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 6 6v1" /></Svg>
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Yinele">
        <Svg><path d="m15 14 5-5-5-5" /><path d="M20 9H10a6 6 0 0 0-6 6v1" /></Svg>
      </TBtn>

      <Divider />

      {/* Blok tipi */}
      <TBtn active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()} title="Normal">
        <span className="text-[12px] font-semibold">P</span>
      </TBtn>
      {([1, 2, 3] as const).map((level) => (
        <TBtn
          key={level}
          active={editor.isActive("heading", { level })}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          title={`Başlık ${level}`}
        >
          <span className="text-[12px] font-bold">H{level}</span>
        </TBtn>
      ))}

      <Divider />

      {/* Metin biçimi */}
      <TBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Kalın">
        <Svg><path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z" /><path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z" /></Svg>
      </TBtn>
      <TBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="İtalik">
        <Svg><path d="M14 5h-4M13 5 9 19M14 19H6" /><path d="M11 5h4M7 19h5" opacity="0" /></Svg>
      </TBtn>
      <TBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Altı çizili">
        <Svg><path d="M7 5v6a5 5 0 0 0 10 0V5M6 20h12" /></Svg>
      </TBtn>
      <TBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Üstü çizili">
        <Svg><path d="M6 12h12M8 8a4 3 0 0 1 8 0M8 16a4 3 0 0 0 8 0" /></Svg>
      </TBtn>

      <Divider />

      {/* Listeler */}
      <TBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Madde listesi">
        <Icon name="bullet-list" size={17} />
      </TBtn>
      <TBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numaralı liste">
        <Svg><path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 18h2M4 15.5a1 1 0 0 1 2 .5" /></Svg>
      </TBtn>
      <TBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Alıntı">
        <Icon name="book-open" size={17} />
      </TBtn>
      <TBtn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Kod bloğu">
        <Icon name="code" size={17} />
      </TBtn>
      <TBtn active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="Satır içi kod">
        <span className="font-mono text-[12px]">{"<>"}</span>
      </TBtn>

      <Divider />

      {/* Hizalama */}
      <TBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Sola hizala">
        <Svg><path d="M4 6h16M4 10h10M4 14h16M4 18h10" /></Svg>
      </TBtn>
      <TBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Ortala">
        <Svg><path d="M4 6h16M7 10h10M4 14h16M7 18h10" /></Svg>
      </TBtn>
      <TBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Sağa hizala">
        <Svg><path d="M4 6h16M10 10h10M4 14h16M10 18h10" /></Svg>
      </TBtn>

      <Divider />

      {/* Renkler */}
      <ColorPopover
        title="Yazı rengi"
        colors={TEXT_COLORS}
        onPick={(c) => editor.chain().focus().setColor(c).run()}
        onClear={() => editor.chain().focus().unsetColor().run()}
        swatch={
          <span
            className="text-[13px] font-bold"
            style={{ color: editor.getAttributes("textStyle").color || "currentColor" }}
          >
            A
          </span>
        }
      />
      <ColorPopover
        title="Vurgu"
        colors={HIGHLIGHTS}
        onPick={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
        onClear={() => editor.chain().focus().unsetHighlight().run()}
        swatch={<Icon name="highlight" size={16} />}
      />

      <Divider />

      {/* Bağlantı & görsel */}
      <TBtn
        active={editor.isActive("link")}
        onClick={() => {
          const prev = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("Bağlantı adresi", prev ?? "https://");
          if (url === null) return;
          if (url === "") editor.chain().focus().unsetLink().run();
          else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}
        title="Bağlantı"
      >
        <Icon name="link" size={16} />
      </TBtn>
      <TBtn
        onClick={() => {
          const url = window.prompt("Görsel adresi (URL)", "https://");
          if (url && url !== "https://") editor.chain().focus().setImage({ src: url }).run();
        }}
        title="Görsel"
      >
        <Icon name="photo" size={16} />
      </TBtn>

      <Divider />

      <TBtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Biçimi temizle">
        <Icon name="close" size={15} />
      </TBtn>
    </div>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-line" />;
}

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={17}
      height={17}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function TBtn({
  children,
  onClick,
  active,
  disabled,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid h-8 min-w-8 place-items-center rounded-lg px-1.5 transition-colors",
        active ? "bg-accentsoft text-accent" : "text-muted hover:text-content hover:bg-line/60",
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      {children}
    </button>
  );
}

function ColorPopover({
  title,
  colors,
  onPick,
  onClear,
  swatch,
}: {
  title: string;
  colors: string[];
  onPick: (c: string) => void;
  onClear: () => void;
  swatch: ReactNode;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          title={title}
          className="grid h-8 min-w-8 place-items-center rounded-lg px-1.5 text-muted transition-colors hover:text-content hover:bg-line/60 data-[state=open]:bg-accentsoft data-[state=open]:text-accent"
        >
          {swatch}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="z-50 rounded-xl border border-line bg-elevated p-2.5 shadow-[var(--shadow)] outline-none data-[state=open]:animate-pop"
        >
          <div className="grid grid-cols-5 gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPick(c)}
                className="h-7 w-7 rounded-md ring-1 ring-line/60 transition-transform hover:scale-110"
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClear}
            className="mt-2 w-full rounded-lg px-2 py-1.5 text-[12px] font-medium text-muted transition-colors hover:bg-line/50 hover:text-content"
          >
            Rengi kaldır
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
