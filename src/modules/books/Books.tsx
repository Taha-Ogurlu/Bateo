import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { uid } from "../../lib/id";
import { fmt } from "../../lib/date";
import { cn } from "../../lib/cn";
import { RichEditor } from "../../components/editor/RichEditor";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Field, Input } from "../../components/ui/Field";
import { Select } from "../../components/ui/Controls";
import { EmptyState } from "../../components/ui/misc";
import { Icon } from "../../components/icons";
import type { Book, BookQuote, BookStatus } from "../../types";

const STATUS: Record<BookStatus, { label: string; tone: "muted" | "accent" | "success" }> = {
  "to-read": { label: "Okunacak", tone: "muted" },
  reading: { label: "Okunuyor", tone: "accent" },
  read: { label: "Okundu", tone: "success" },
};

export function Books() {
  const books = useLiveQuery(() => db.books.toArray(), [], []);
  const quotes = useLiveQuery(() => db.bookQuotes.toArray(), [], []);

  const [bookId, setBookId] = useState<string | null>(null);
  const [modal, setModal] = useState<Book | "new" | null>(null);
  const [filter, setFilter] = useState<"all" | BookStatus>("all");

  const current = books.find((b) => b.id === bookId) ?? null;
  const quoteCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const q of quotes) m[q.bookId] = (m[q.bookId] ?? 0) + 1;
    return m;
  }, [quotes]);

  if (current) {
    return (
      <BookDetail
        book={current}
        quotes={quotes.filter((q) => q.bookId === current.id)}
        onBack={() => setBookId(null)}
        onEdit={() => setModal(current)}
        onDelete={() => {
          if (!confirm(`“${current.title}” ve içindeki alıntılar silinsin mi?`)) return;
          void db.transaction("rw", [db.books, db.bookQuotes], async () => {
            await db.bookQuotes.where("bookId").equals(current.id).delete();
            await db.books.delete(current.id);
          }).then(() => setBookId(null));
        }}
      />
    );
  }

  const list = [...books]
    .filter((b) => filter === "all" || b.status === filter)
    .sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt));

  const readCount = books.filter((b) => b.status === "read").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold text-content">Kitap okuma listesi</h2>
        <div className="flex items-center gap-2">
          <Badge tone="muted">{books.length} kitap</Badge>
          <Badge tone="success">{readCount} okundu</Badge>
          <Badge tone="accent">{quotes.length} alıntı</Badge>
        </div>
        <Button onClick={() => setModal("new")} className="ml-auto gap-2">
          <Icon name="plus" size={17} /> Kitap ekle
        </Button>
      </div>

      {books.length > 0 && (
        <div className="inline-flex items-center gap-0.5 self-start rounded-lg border border-line bg-bg2/60 p-0.5">
          {(["all", "to-read", "reading", "read"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "h-7 rounded-md px-3 text-[11.5px] font-medium transition-colors",
                filter === f ? "bg-surface text-content shadow-sm" : "text-muted hover:text-content",
              )}
            >
              {f === "all" ? "Tümü" : STATUS[f].label}
            </button>
          ))}
        </div>
      )}

      {books.length === 0 ? (
        <EmptyState
          icon="book"
          title="Kitap listen boş"
          hint="Kitaplarını ekle; beğendiğin sözleri kaydet, bitirince düşüncelerini yaz."
          action={
            <Button onClick={() => setModal("new")} className="gap-2">
              <Icon name="plus" size={16} /> İlk kitabı ekle
            </Button>
          }
        />
      ) : list.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Bu filtrede kitap yok.</p>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <button
              key={b.id}
              onClick={() => setBookId(b.id)}
              className="flex flex-col rounded-2xl border border-line bg-surface p-4 text-left shadow-[var(--shadow)] transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accentsoft text-accent">
                  <Icon name="book" size={21} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-content">{b.title}</p>
                  <p className="truncate text-[11px] text-muted">{b.author || "Yazar belirtilmedi"}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone={STATUS[b.status].tone}>{STATUS[b.status].label}</Badge>
                {b.rating ? <Stars value={b.rating} size={13} /> : null}
                {quoteCount[b.id] ? <Badge tone="muted">{quoteCount[b.id]} alıntı</Badge> : null}
              </div>
            </button>
          ))}
        </div>
      )}

      {modal && <BookModal book={modal === "new" ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}

/* ---------------- Kitap detayı ---------------- */

function BookDetail({
  book,
  quotes,
  onBack,
  onEdit,
  onDelete,
}: {
  book: Book;
  quotes: BookQuote[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [summary, setSummary] = useState(book.summary ?? "");
  const [saved, setSaved] = useState(true);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const persistSummary = (html: string) => {
    setSaved(false);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      await db.books.update(book.id, { summary: html, updatedAt: Date.now() });
      setSaved(true);
    }, 500);
  };

  const setStatus = (status: BookStatus) => {
    const now = Date.now();
    void db.books.update(book.id, {
      status,
      startedAt: status === "reading" && !book.startedAt ? now : book.startedAt,
      finishedAt: status === "read" ? now : null,
      updatedAt: now,
    });
  };

  const setRating = (rating: number) => {
    void db.books.update(book.id, { rating, updatedAt: Date.now() });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Üst */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-1.5">
          <Icon name="chevron-left" size={17} /> Kitaplar
        </Button>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accentsoft text-accent">
            <Icon name="book" size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-content">{book.title}</h2>
            <p className="truncate text-[11px] text-muted">{book.author || "Yazar belirtilmedi"}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" onClick={onEdit} className="gap-1.5">
            <Icon name="edit" size={16} /> Düzenle
          </Button>
          <Button variant="ghost" onClick={onDelete} className="gap-1.5 text-danger hover:text-danger">
            <Icon name="trash" size={16} /> Sil
          </Button>
        </div>
      </div>

      {/* Durum & puan */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)]">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted">Durum</span>
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-bg2/60 p-0.5">
            {(["to-read", "reading", "read"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "h-7 rounded-md px-3 text-[11.5px] font-medium transition-colors",
                  book.status === s ? "bg-surface text-content shadow-sm" : "text-muted hover:text-content",
                )}
              >
                {STATUS[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted">Puanım</span>
          <Stars value={book.rating ?? 0} size={18} interactive onChange={setRating} />
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-3 text-[11px] text-muted">
          {book.startedAt && <span>Başladım: {fmt(book.startedAt, "d MMM yyyy")}</span>}
          {book.finishedAt && <span>Bitti: {fmt(book.finishedAt, "d MMM yyyy")}</span>}
          <span>{quotes.length} alıntı</span>
        </div>
      </div>

      {/* Alıntılar */}
      <QuotesSection bookId={book.id} quotes={quotes} />

      {/* Kitap sonu düşüncem */}
      <div className="rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Icon name="edit" size={17} className="text-accent" />
          <p className="text-sm font-semibold text-content">Kitap sonu düşüncem</p>
          <span className="ml-auto text-[11px] text-muted">{saved ? "kaydedildi" : "kaydediliyor…"}</span>
        </div>
        <div className="h-[42vh] min-h-[240px] overflow-hidden">
          <RichEditor
            value={summary}
            onChange={(html) => {
              setSummary(html);
              persistSummary(html);
            }}
            placeholder="Kitabı bitirdiğinde: ne hissettim, ne öğrendim, aklımda ne kaldı…"
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Alıntılar ---------------- */

function QuotesSection({ bookId, quotes }: { bookId: string; quotes: BookQuote[] }) {
  const [text, setText] = useState("");
  const [page, setPage] = useState("");
  const [editing, setEditing] = useState<BookQuote | null>(null);

  const add = async () => {
    const t = text.trim();
    if (!t) return;
    const now = Date.now();
    await db.bookQuotes.add({
      id: uid("quote"),
      bookId,
      text: t,
      page: page.trim(),
      createdAt: now,
      updatedAt: now,
    });
    setText("");
    setPage("");
  };

  const remove = async (id: string) => {
    await db.bookQuotes.delete(id);
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)]">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="highlight" size={17} className="text-accent" />
        <p className="text-sm font-semibold text-content">Beğendiğim sözler</p>
        <Badge tone="muted" className="ml-auto">
          {quotes.length}
        </Badge>
      </div>

      {/* Ekle */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void add())}
          placeholder="Altını çizdiğin sözü yaz…"
        />
        <div className="flex gap-2">
          <Input
            value={page}
            onChange={(e) => setPage(e.target.value)}
            placeholder="Sayfa"
            className="w-24 shrink-0"
          />
          <Button onClick={add} className="shrink-0 gap-1.5" disabled={!text.trim()}>
            <Icon name="plus" size={16} /> Ekle
          </Button>
        </div>
      </div>

      {/* Liste */}
      {quotes.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">
          Henüz alıntı yok. Kitapta hoşuna giden sözleri buraya ekle.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {[...quotes]
            .sort((a, b) => (a.page || "").localeCompare(b.page || "", "tr", { numeric: true }) || b.createdAt - a.createdAt)
            .map((q) => (
              <div key={q.id} className="group flex items-start gap-3 rounded-xl border border-line bg-bg2/40 px-3.5 py-3">
                <span className="mt-0.5 text-accent">
                  <Icon name="highlight" size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] italic text-content">“{q.text}”</p>
                  {q.note && <p className="mt-1 text-[12px] text-muted">{q.note}</p>}
                  {q.page && <p className="mt-1 text-[11px] text-muted/80">s. {q.page}</p>}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => setEditing(q)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-line/50 hover:text-content"
                    title="Düzenle"
                  >
                    <Icon name="edit" size={15} />
                  </button>
                  <button
                    onClick={() => void remove(q.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                    title="Sil"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {editing && <QuoteModal quote={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function QuoteModal({ quote, onClose }: { quote: BookQuote; onClose: () => void }) {
  const [text, setText] = useState(quote.text);
  const [page, setPage] = useState(quote.page ?? "");
  const [note, setNote] = useState(quote.note ?? "");

  const save = async () => {
    if (!text.trim()) return;
    await db.bookQuotes.update(quote.id, {
      text: text.trim(),
      page: page.trim(),
      note: note.trim(),
      updatedAt: Date.now(),
    });
    onClose();
  };

  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title="Alıntıyı düzenle"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={save} className="gap-2">
            <Icon name="check" size={16} /> Kaydet
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <Field label="Söz">
          <Input autoFocus value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Sayfa">
            <Input value={page} onChange={(e) => setPage(e.target.value)} />
          </Field>
          <Field label="Notun" className="col-span-2">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Neden hoşuma gitti?" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Kitap modalı ---------------- */

function BookModal({ book, onClose }: { book: Book | null; onClose: () => void }) {
  const isNew = !book;
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [status, setStatus] = useState<BookStatus>(book?.status ?? "to-read");
  const [rating, setRating] = useState(book?.rating ?? 0);

  const save = async () => {
    if (!title.trim()) return;
    const now = Date.now();
    const data = {
      title: title.trim(),
      author: author.trim(),
      status,
      rating: rating || undefined,
      updatedAt: now,
    };
    if (isNew) {
      await db.books.add({
        id: uid("book"),
        createdAt: now,
        startedAt: status === "reading" ? now : null,
        finishedAt: status === "read" ? now : null,
        summary: "",
        ...data,
      });
    } else {
      await db.books.update(book!.id, data);
    }
    onClose();
  };

  const remove = async () => {
    if (!book) return;
    await db.transaction("rw", [db.books, db.bookQuotes], async () => {
      await db.bookQuotes.where("bookId").equals(book.id).delete();
      await db.books.delete(book.id);
    });
    onClose();
  };

  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title={isNew ? "Kitap ekle" : "Kitabı düzenle"}
      footer={
        <>
          {!isNew && (
            <Button variant="ghost" onClick={remove} className="mr-auto gap-1.5 text-danger hover:text-danger">
              <Icon name="trash" size={16} /> Sil
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={save} className="gap-2">
            <Icon name="check" size={16} /> Kaydet
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <Field label="Kitap adı">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Suç ve Ceza" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Yazar">
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Dostoyevski" />
          </Field>
          <Field label="Durum">
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as BookStatus)}
              options={[
                { value: "to-read", label: "Okunacak" },
                { value: "reading", label: "Okunuyor" },
                { value: "read", label: "Okundu" },
              ]}
            />
          </Field>
        </div>
        <Field label="Puanın">
          <Stars value={rating} size={22} interactive onChange={setRating} />
        </Field>
        {!isNew && <p className="text-[11px] text-muted">Kitap silinince alıntıları da silinir.</p>}
      </div>
    </Modal>
  );
}

/* ---------------- Yıldızlar ---------------- */

function Stars({
  value,
  size = 16,
  interactive,
  onChange,
}: {
  value: number;
  size?: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange?.(i === value ? 0 : i)}
          className={cn(
            "transition-colors",
            interactive && "cursor-pointer",
            i <= shown ? "text-warning" : "text-line",
          )}
          aria-label={`${i} yıldız`}
        >
          <Icon name="star" size={size} strokeWidth={1.5} fill={i <= shown ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}
