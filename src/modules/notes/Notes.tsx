import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import DOMPurify from "dompurify";
import { db } from "../../db/db";
import { uid } from "../../lib/id";
import { relative } from "../../lib/date";
import { cn } from "../../lib/cn";
import { RichEditor } from "../../components/editor/RichEditor";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Field, Input } from "../../components/ui/Field";
import { EmptyState } from "../../components/ui/misc";
import { Select } from "../../components/ui/Controls";
import { Icon } from "../../components/icons";
import { ACCENT_PRESETS } from "../../lib/color";
import type { Folder, Note } from "../../types";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function Notes() {
  const [params, setParams] = useSearchParams();
  const allNotes = useLiveQuery(() => db.notes.toArray(), [], []);
  const notes = useMemo(() => allNotes.filter((n) => !n.archived), [allNotes]);
  const archivedNotes = useMemo(() => allNotes.filter((n) => n.archived), [allNotes]);
  const folders = useLiveQuery(() => db.folders.toArray(), [], []);

  const [query, setQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState<string>("all");
  const [view, setView] = useState<"edit" | "read">("edit");
  const [folderModal, setFolderModal] = useState(false);
  const [listOpen, setListOpen] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [deletedNote, setDeletedNote] = useState<Note | null>(null);
  const deleteTimer = useRef<number | null>(null);
  const creatingNote = useRef(false);

  const selectedId = params.get("id");

  const select = (id?: string) => {
    const p = new URLSearchParams(params);
    if (id) p.set("id", id);
    else p.delete("id");
    p.delete("new");
    setParams(p, { replace: true });
  };

  const newNote = () => {
    setShowArchived(false);
    const p = new URLSearchParams(params);
    p.set("new", "1");
    p.delete("id");
    setParams(p, { replace: true });
  };

  const creating = params.get("new") === "1";
  useEffect(() => {
    if (!creating) {
      creatingNote.current = false;
      return;
    }
    // React StrictMode replays mount effects in development. Guard creation so
    // one ?new=1 navigation can never generate duplicate blank notes.
    if (creatingNote.current) return;
    creatingNote.current = true;
    const now = Date.now();
    const id = uid("note");
    void db.notes
      .add({
        id,
        title: "",
        content: "",
        folderId: folderFilter !== "all" ? folderFilter : null,
        tags: [],
        pinned: false,
        favorite: false,
        archived: false,
        createdAt: now,
        updatedAt: now,
      })
      .then(() => select(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creating]);

  const sourceNotes = showArchived ? archivedNotes : notes;
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return [...sourceNotes]
      .filter((n) => (folderFilter === "all" ? true : n.folderId === folderFilter))
      .filter((n) =>
        !q
          ? true
          : n.title.toLocaleLowerCase("tr").includes(q) || stripHtml(n.content).toLocaleLowerCase("tr").includes(q),
      )
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [sourceNotes, query, folderFilter]);

  const selected = useMemo(() => sourceNotes.find((n) => n.id === selectedId) ?? null, [sourceNotes, selectedId]);

  useEffect(() => () => {
    if (deleteTimer.current) window.clearTimeout(deleteTimer.current);
  }, []);

  const deleteNote = (note: Note) => {
    if (deleteTimer.current) window.clearTimeout(deleteTimer.current);
    setDeletedNote(note);
    void db.notes.delete(note.id);
    deleteTimer.current = window.setTimeout(() => setDeletedNote(null), 8000);
    select(undefined);
  };

  const undoDelete = async () => {
    if (!deletedNote) return;
    if (deleteTimer.current) window.clearTimeout(deleteTimer.current);
    // A restore is a new change. Reusing the old timestamp makes the cloud
    // reject it as older than the deletion tombstone.
    await db.notes.put({ ...deletedNote, updatedAt: Date.now() });
    setDeletedNote(null);
    select(deletedNote.id);
  };

  const folderCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const n of sourceNotes) if (n.folderId) map[n.folderId] = (map[n.folderId] ?? 0) + 1;
    return map;
  }, [sourceNotes]);

  return (
    <div className="flex h-[calc(100vh-9.5rem)] min-h-[420px] gap-4 md:h-[calc(100vh-8.5rem)]">
      {/* SOL: liste */}
      <div
        className={cn(
          "shrink-0 flex-col rounded-2xl border border-line bg-surface shadow-[var(--shadow)]",
          selected ? "hidden" : "flex w-full",
          listOpen ? "md:flex md:w-[324px]" : "md:hidden",
        )}
      >
        <div className="flex items-center gap-2 border-b border-line p-3">
          <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-line bg-bg2/50 px-3">
            <Icon name="search" size={16} className="text-muted shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Notlarda ara…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70"
            />
          </div>
          <Button size="icon" onClick={newNote} aria-label="Yeni not" className="shrink-0">
            <Icon name="plus" size={18} />
          </Button>
        </div>

        {/* klasör filtreleri */}
        <div className="grid grid-cols-2 gap-1.5 border-b border-line p-2">
          <button
            onClick={() => { setShowArchived(false); setFolderFilter("all"); }}
            className={cn("rounded-lg px-3 py-2 text-xs font-semibold transition-colors", !showArchived ? "bg-accentsoft text-accent" : "text-muted hover:bg-line/40 hover:text-content")}
          >
            Notlar <span className="ml-1 opacity-70">{notes.length}</span>
          </button>
          <button
            onClick={() => { setShowArchived(true); setFolderFilter("all"); }}
            className={cn("rounded-lg px-3 py-2 text-xs font-semibold transition-colors", showArchived ? "bg-accentsoft text-accent" : "text-muted hover:bg-line/40 hover:text-content")}
          >
            {"Ar\u015fiv"} <span className="ml-1 opacity-70">{archivedNotes.length}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-line px-3 py-2">
          <FolderChip active={folderFilter === "all"} onClick={() => setFolderFilter("all")}>
            Tümü
          </FolderChip>
          {folders.map((f) => (
            <FolderChip
              key={f.id}
              active={folderFilter === f.id}
              onClick={() => setFolderFilter(f.id)}
              dot={f.color}
            >
              {f.name}
              {folderCounts[f.id] ? <span className="text-muted/70">{folderCounts[f.id]}</span> : null}
            </FolderChip>
          ))}
          <button
            onClick={() => setFolderModal(true)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-line px-2.5 h-7 text-[12px] font-medium text-muted transition-colors hover:border-accent hover:text-accent"
            title="Klasörleri yönet"
          >
            <Icon name="folder" size={13} /> Klasör
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted">Not bulunamadı.</p>
          ) : (
            filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => select(n.id)}
                className={cn(
                  "mb-1 flex w-full flex-col gap-1 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors",
                  n.id === selectedId ? "border-line bg-accentsoft" : "hover:bg-line/40",
                )}
              >
                <div className="flex items-center gap-2">
                  {n.pinned && <Icon name="pin" size={13} className="text-accent shrink-0" />}
                  {n.favorite && <Icon name="star" size={13} className="text-warning shrink-0" />}
                  <span className={cn("truncate text-sm font-medium", n.title ? "text-content" : "text-muted italic")}>
                    {n.title || "Başlıksız not"}
                  </span>
                </div>
                <span className="truncate text-[11px] text-muted">
                  {stripHtml(n.content).slice(0, 70) || "Boş not"}
                </span>
                <span className="text-[10px] text-muted/70">{relative(n.updatedAt)}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* SAĞ: editör */}
      <div
        className={cn(
          "min-w-0 flex-1 rounded-2xl border border-line bg-surface shadow-[var(--shadow)]",
          !selected && "hidden md:flex",
        )}
      >
        {selected ? (
          <NoteEditor
            key={selected.id}
            note={selected}
            folders={folders}
            view={view}
            setView={setView}
            archivedView={showArchived}
            onBack={() => select(undefined)}
            onDelete={deleteNote}
            onManageFolders={() => setFolderModal(true)}
            listOpen={listOpen}
            onToggleList={() => setListOpen((v) => !v)}
          />
        ) : (
          <div className="grid h-full place-items-center p-6">
            <EmptyState icon="note" title="Bir not seç" hint="Soldan bir not aç veya yeni bir not oluştur." />
          </div>
        )}
      </div>

      {folderModal && <FolderModal folders={folders} onClose={() => setFolderModal(false)} />}
      {deletedNote && (
        <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-line bg-elevated px-4 py-3 shadow-[var(--shadow)]">
          <span className="max-w-[55vw] truncate text-sm text-content">Not silindi</span>
          <button onClick={() => void undoDelete()} className="shrink-0 text-sm font-semibold text-accent hover:underline">Geri al</button>
        </div>
      )}
    </div>
  );
}

function FolderChip({
  children,
  active,
  onClick,
  dot,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 h-7 text-[12px] font-medium transition-colors",
        active ? "border-accent bg-accentsoft text-accent" : "border-line text-muted hover:text-content",
      )}
    >
      {dot && <span className="h-2 w-2 rounded-full" style={{ background: dot }} />}
      {children}
    </button>
  );
}

/* ---------------- Not editörü ---------------- */

function NoteEditor({
  note,
  folders,
  view,
  setView,
  archivedView,
  onBack,
  onDelete,
  onManageFolders,
  listOpen,
  onToggleList,
}: {
  note: Note;
  folders: Folder[];
  view: "edit" | "read";
  setView: (v: "edit" | "read") => void;
  archivedView: boolean;
  onBack: () => void;
  onDelete: (note: Note) => void;
  onManageFolders: () => void;
  listOpen: boolean;
  onToggleList: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [confirmDel, setConfirmDel] = useState(false);
  const [saved, setSaved] = useState(true);
  const timer = useRef<number | null>(null);
  const latestContent = useRef({ title, content });

  useEffect(() => {
    latestContent.current = { title, content };
  }, [title, content]);

  useEffect(() => {
    return () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
        timer.current = null;
        void db.notes.update(note.id, { ...latestContent.current, updatedAt: Date.now() });
      }
    };
  }, [note.id]);

  const persist = (patch: Partial<Note>) => {
    setSaved(false);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      timer.current = null;
      await db.notes.update(note.id, { ...latestContent.current, ...patch, updatedAt: Date.now() });
      setSaved(true);
    }, 450);
  };

  const toggle = (patch: Partial<Note>) => void db.notes.update(note.id, { ...patch, updatedAt: Date.now() });

  const words = stripHtml(content) ? stripHtml(content).split(/\s+/).length : 0;

  return (
    <div className="flex h-full flex-col">
      {/* Üst çubuk */}
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2.5">
        <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={onBack} aria-label="Geri">
          <Icon name="chevron-left" size={18} />
        </Button>

        <button
          onClick={onToggleList}
          className="hidden md:grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:text-content hover:bg-line/50"
          title={listOpen ? "Not listesini gizle" : "Not listesini göster"}
          aria-label={listOpen ? "Not listesini gizle" : "Not listesini göster"}
        >
          <Icon name={listOpen ? "chevron-left" : "chevron-right"} size={18} />
        </button>

        <Select
          className="h-9 w-[158px] text-[13px]"
          value={note.folderId ?? "_none"}
          onValueChange={(v) => toggle({ folderId: v === "_none" ? null : v })}
          options={[{ value: "_none", label: "Klasörsüz" }, ...folders.map((f) => ({ value: f.id, label: f.name }))]}
        />
        <button
          onClick={onManageFolders}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:text-content hover:bg-line/50 transition-colors"
          title="Klasörleri yönet"
          aria-label="Klasörleri yönet"
        >
          <Icon name="folder" size={18} />
        </button>

        <div className="ml-auto flex items-center gap-0.5">
          <IconBtn active={note.pinned} onClick={() => toggle({ pinned: !note.pinned })} icon="pin" label="Sabitle" />
          <IconBtn
            active={note.favorite}
            onClick={() => toggle({ favorite: !note.favorite })}
            icon="star"
            label="Favori"
          />
          <IconBtn onClick={() => {
            if (timer.current) window.clearTimeout(timer.current);
            timer.current = null;
            void db.notes.update(note.id, { title, content, archived: !archivedView, updatedAt: Date.now() });
            onBack();
          }} icon="archive" label={archivedView ? "Ar\u015fivden \u00e7\u0131kar" : "Ar\u015fivle"} />
          <IconBtn onClick={() => setConfirmDel(true)} icon="trash" label="Sil" danger />
        </div>
      </div>

      {/* Başlık */}
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          persist({ title: e.target.value });
        }}
        placeholder="Başlıksız not"
        className="w-full bg-transparent px-4 pt-4 pb-2 text-xl font-bold text-content outline-none placeholder:text-muted/50"
      />

      {/* Durum çubuğu */}
      <div className="flex items-center gap-2 border-b border-line px-3 py-1.5">
        <span className="text-[11px] text-muted tabular-nums">
          {words} kelime · {saved ? "kaydedildi" : "kaydediliyor…"}
        </span>
        <div className="ml-auto inline-flex items-center gap-0.5 rounded-lg border border-line bg-bg2/60 p-0.5">
          <ViewBtn active={view === "edit"} onClick={() => setView("edit")} icon="edit" label="Düzenle" />
          <ViewBtn active={view === "read"} onClick={() => setView("read")} icon="eye" label="Oku" />
        </div>
      </div>

      {/* Gövde */}
      {view === "edit" ? (
        <RichEditor
          value={content}
          onChange={(html) => {
            setContent(html);
            persist({ content: html });
          }}
          placeholder="Notunu yaz… Araç çubuğundan biçimlendir, renklendir, liste oluştur."
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {content.trim() ? (
            <div
              className="markdown"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
            />
          ) : (
            <p className="text-sm text-muted italic">Bu not boş.</p>
          )}
        </div>
      )}

      <Modal
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title="Notu sil"
        description="Sildikten sonra kısa süre içinde geri alabilirsin."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDel(false)}>
              Vazgeç
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (timer.current) window.clearTimeout(timer.current);
                timer.current = null;
                onDelete({ ...note, title, content, updatedAt: Date.now() });
                setConfirmDel(false);
              }}
            >
              Sil
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          <span className="font-medium text-content">{note.title || "Başlıksız not"}</span> kalıcı olarak silinecek.
        </p>
      </Modal>
    </div>
  );
}

function IconBtn({
  icon,
  onClick,
  active,
  danger,
  label,
}: {
  icon: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-lg transition-colors",
        danger
          ? "text-muted hover:text-danger hover:bg-danger/10"
          : active
            ? "text-accent bg-accentsoft"
            : "text-muted hover:text-content hover:bg-line/50",
      )}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

function ViewBtn({
  icon,
  onClick,
  active,
  label,
}: {
  icon: string;
  onClick: () => void;
  active: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-medium transition-colors",
        active ? "bg-surface text-content shadow-sm" : "text-muted hover:text-content",
      )}
    >
      <Icon name={icon} size={14} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/* ---------------- Klasör yönetimi ---------------- */

function FolderModal({ folders, onClose }: { folders: Folder[]; onClose: () => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(ACCENT_PRESETS[0].value);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const addFolder = async () => {
    const v = name.trim();
    if (!v) return;
    await db.folders.add({ id: uid("fld"), name: v, color, createdAt: Date.now() });
    setName("");
    setColor(ACCENT_PRESETS[0].value);
  };

  const rename = async (f: Folder) => {
    const v = editName.trim();
    if (v) await db.folders.update(f.id, { name: v });
    setEditing(null);
  };

  const remove = async (f: Folder) => {
    await db.transaction("rw", [db.folders, db.notes], async () => {
      await db.notes.where("folderId").equals(f.id).modify({ folderId: null });
      await db.folders.delete(f.id);
    });
    setConfirmId(null);
  };

  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title="Klasörler"
      description="Notlarını klasörlere ayır, renklendir."
      size="md"
    >
      <div className="flex flex-col gap-4">
        {/* Yeni klasör */}
        <div className="rounded-2xl border border-line bg-bg2/40 p-3.5">
          <Field label="Yeni klasör">
            <div className="flex items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void addFolder())}
                placeholder="Örn. Ders Notları"
              />
              <Button onClick={addFolder} className="gap-1.5 shrink-0">
                <Icon name="plus" size={16} /> Ekle
              </Button>
            </div>
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={cn(
                  "h-7 w-7 rounded-lg border-2 transition-transform",
                  color === c.value ? "border-content scale-110" : "border-transparent",
                )}
                style={{ background: c.value }}
                title={c.name}
                aria-label={c.name}
              />
            ))}
          </div>
        </div>

        {/* Liste */}
        <div className="flex flex-col gap-1.5 max-h-[46vh] overflow-y-auto">
          {folders.length === 0 && <p className="py-3 text-center text-sm text-muted">Henüz klasör yok.</p>}
          {folders.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
              <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: f.color }} />
              {editing === f.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => void rename(f)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void rename(f);
                    if (e.key === "Escape") setEditing(null);
                  }}
                  className="flex-1 bg-transparent text-sm text-content outline-none"
                />
              ) : (
                <span className="flex-1 truncate text-sm text-content">{f.name}</span>
              )}
              {confirmId === f.id ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => void remove(f)}
                    className="rounded-lg bg-danger/90 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-danger"
                  >
                    Sil
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="rounded-lg px-2 py-1 text-[12px] text-muted hover:text-content"
                  >
                    Vazgeç
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditing(f.id);
                      setEditName(f.name);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-content hover:bg-line/50"
                    title="Yeniden adlandır"
                  >
                    <Icon name="edit" size={16} />
                  </button>
                  <button
                    onClick={() => setConfirmId(f.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-danger hover:bg-danger/10"
                    title="Sil"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted">Bir klasörü silersen, içindeki notlar silinmez; "Klasörsüz" olurlar.</p>
      </div>
    </Modal>
  );
}
