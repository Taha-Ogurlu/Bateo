import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { uid } from "../../lib/id";
import { GRADES, dueLabel, isDue, scheduleCard, type Grade } from "../../lib/sm2";
import { relative } from "../../lib/date";
import { ACCENT_PRESETS } from "../../lib/color";
import { cn } from "../../lib/cn";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Field, Input, Textarea } from "../../components/ui/Field";
import { Select } from "../../components/ui/Controls";
import { EmptyState, Progress } from "../../components/ui/misc";
import { Icon } from "../../components/icons";
import type { Course, Deck, Flashcard } from "../../types";

export function Cards() {
  const decks = useLiveQuery(() => db.decks.toArray(), [], []);
  const cards = useLiveQuery(() => db.flashcards.toArray(), [], []);
  const courses = useLiveQuery(() => db.courses.toArray(), [], []);

  const [deckId, setDeckId] = useState<string | null>(null);
  const [studying, setStudying] = useState(false);
  const [deckModal, setDeckModal] = useState<Deck | "new" | null>(null);

  const courseMap = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses]);
  const current = decks.find((d) => d.id === deckId) ?? null;

  const statsFor = (id: string) => {
    const list = cards.filter((c) => c.deckId === id);
    return { total: list.length, due: list.filter((c) => isDue(c)).length };
  };

  const deckCards = useMemo(
    () => (current ? cards.filter((c) => c.deckId === current.id) : []),
    [cards, current],
  );

  /* ---- Çalışma seansı ---- */
  if (studying && current) {
    return <StudySession deck={current} cards={deckCards} onExit={() => setStudying(false)} />;
  }

  /* ---- Deste detayı ---- */
  if (current) {
    return (
      <DeckDetail
        deck={current}
        cards={deckCards}
        courseMap={courseMap}
        onBack={() => setDeckId(null)}
        onStudy={() => setStudying(true)}
        onEditDeck={() => setDeckModal(current)}
      />
    );
  }

  /* ---- Deste listesi ---- */
  const totalDue = cards.filter((c) => isDue(c)).length;
  const totalCards = cards.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold text-content">Sınav kartları</h2>
        <div className="flex items-center gap-2">
          <Badge tone="muted">{decks.length} deste</Badge>
          <Badge tone="accent">{totalCards} kart</Badge>
          <Badge tone={totalDue > 0 ? "warning" : "success"}>
            {totalDue > 0 ? `${totalDue} tekrar bekliyor` : "Tekrar yok"}
          </Badge>
        </div>
        <Button onClick={() => setDeckModal("new")} className="ml-auto gap-2">
          <Icon name="plus" size={17} /> Yeni deste
        </Button>
      </div>

      {decks.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="Henüz deste yok"
          hint="Soru-cevap kartlarını desteler hâlinde oluştur; sistem aralıklı tekrar ile sana ne zaman çalışacağını söyler."
          action={
            <Button onClick={() => setDeckModal("new")} className="gap-2">
              <Icon name="plus" size={16} /> İlk desteni oluştur
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((d) => {
            const s = statsFor(d.id);
            const c = d.courseId ? courseMap[d.courseId] : undefined;
            return (
              <button
                key={d.id}
                onClick={() => setDeckId(d.id)}
                className="flex flex-col rounded-2xl border border-line bg-surface p-4 text-left shadow-[var(--shadow)] transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                    style={{ background: `${d.color}22`, color: d.color }}
                  >
                    <Icon name="bookmark" size={21} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-content">{d.name}</p>
                    <p className="truncate text-[11px] text-muted">{c?.name ?? "Ders atanmamış"}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone="muted">{s.total} kart</Badge>
                  {s.due > 0 ? (
                    <Badge tone="warning">{s.due} tekrar</Badge>
                  ) : (
                    <Badge tone="success">Güncel</Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {deckModal && (
        <DeckModal deck={deckModal === "new" ? null : deckModal} courses={courses} onClose={() => setDeckModal(null)} />
      )}
    </div>
  );
}

/* ---------------- Deste detayı ---------------- */

function DeckDetail({
  deck,
  cards,
  courseMap,
  onBack,
  onStudy,
  onEditDeck,
}: {
  deck: Deck;
  cards: Flashcard[];
  courseMap: Record<string, Course | undefined>;
  onBack: () => void;
  onStudy: () => void;
  onEditDeck: () => void;
}) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [editing, setEditing] = useState<Flashcard | null>(null);

  const due = cards.filter((c) => isDue(c));
  const c = deck.courseId ? courseMap[deck.courseId] : undefined;

  const add = async () => {
    const f = front.trim();
    const b = back.trim();
    if (!f || !b) return;
    const now = Date.now();
    await db.flashcards.add({
      id: uid("card"),
      deckId: deck.id,
      front: f,
      back: b,
      ease: 2.5,
      interval: 0,
      repetitions: 0,
      due: now,
      lapses: 0,
      reviews: 0,
      createdAt: now,
      updatedAt: now,
    });
    setFront("");
    setBack("");
  };

  const removeCard = async (id: string) => {
    await db.flashcards.delete(id);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-1.5">
          <Icon name="chevron-left" size={17} /> Desteler
        </Button>
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-10 w-10 place-items-center rounded-xl"
            style={{ background: `${deck.color}22`, color: deck.color }}
          >
            <Icon name="bookmark" size={20} />
          </span>
          <div>
            <h2 className="text-base font-bold text-content">{deck.name}</h2>
            <p className="text-[11px] text-muted">
              {c?.name ?? "Ders atanmamış"} · {cards.length} kart · {due.length} tekrar bekliyor
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" onClick={onEditDeck} className="gap-1.5">
            <Icon name="edit" size={16} /> Deste
          </Button>
          <Button onClick={onStudy} disabled={cards.length === 0} className="gap-2">
            <Icon name="pomodoro" size={17} /> {due.length > 0 ? `Çalış (${due.length})` : "Pratik yap"}
          </Button>
        </div>
      </div>

      {/* Kart ekle */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)]">
        <p className="mb-3 text-sm font-semibold text-content">Yeni kart ekle</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Ön yüz (soru)">
            <Textarea value={front} onChange={(e) => setFront(e.target.value)} placeholder="Örn. Klasik koşullanmayı kim buldu?" className="min-h-16" />
          </Field>
          <Field label="Arka yüz (cevap)">
            <Textarea value={back} onChange={(e) => setBack(e.target.value)} placeholder="Örn. Pavlov (1900'ler)" className="min-h-16" />
          </Field>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={add} className="gap-2" disabled={!front.trim() || !back.trim()}>
            <Icon name="plus" size={16} /> Kart ekle
          </Button>
        </div>
      </div>

      {/* Kart listesi */}
      {cards.length === 0 ? (
        <EmptyState icon="sticky" title="Bu destede kart yok" hint="Yukarıdan ilk kartını ekle." />
      ) : (
        <div className="flex flex-col gap-2">
          {cards.map((card) => (
            <div key={card.id} className="group flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-[var(--shadow)]">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-content">{card.front}</p>
                <p className="mt-1 text-[13px] text-muted">{card.back}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone={isDue(card) ? "warning" : "success"}>
                    {isDue(card) ? "Tekrar zamanı" : dueLabel(card.due)}
                  </Badge>
                  <span className="text-[11px] text-muted">
                    {card.reviews} tekrar · kolaylık {card.ease.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => setEditing(card)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-line/50 hover:text-content"
                  title="Düzenle"
                >
                  <Icon name="edit" size={16} />
                </button>
                <button
                  onClick={() => void removeCard(card.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                  title="Sil"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <CardEditModal card={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

/* ---------------- Çalışma seansı ---------------- */

function StudySession({ deck, cards, onExit }: { deck: Deck; cards: Flashcard[]; onExit: () => void }) {
  const [queue] = useState<string[]>(() => {
    const dueList = cards.filter((c) => isDue(c));
    const source = dueList.length > 0 ? dueList : cards; // tekrar yoksa hepsini pratik et
    return source.map((c) => c.id);
  });
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  const card = cards.find((c) => c.id === queue[pos]) ?? null;
  const done = pos >= queue.length;

  const grade = async (g: Grade) => {
    if (!card) return;
    const now = Date.now();
    const res = scheduleCard(card, g, now);
    await db.flashcards.update(card.id, {
      ...res,
      reviews: card.reviews + 1,
      lastReviewedAt: now,
      updatedAt: now,
    });
    setTally((t) => ({
      again: t.again + (g === 0 ? 1 : 0),
      hard: t.hard + (g === 1 ? 1 : 0),
      good: t.good + (g === 2 ? 1 : 0),
      easy: t.easy + (g === 3 ? 1 : 0),
    }));
    setRevealed(false);
    setPos((p) => p + 1);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onExit} className="gap-1.5">
          <Icon name="chevron-left" size={17} /> Çık
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-content">{deck.name}</p>
          <p className="text-[11px] text-muted">
            {done ? "Tamamlandı" : `${pos + 1} / ${queue.length}`}
          </p>
        </div>
        <div className="ml-auto w-40">
          <Progress value={queue.length ? (pos / queue.length) * 100 : 0} />
        </div>
      </div>

      {done ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-surface p-10 text-center shadow-[var(--shadow)]">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accentsoft text-accent">
            <Icon name="trophy" size={30} />
          </div>
          <div>
            <p className="text-lg font-bold text-content">Tur tamamlandı 🎉</p>
            <p className="mt-1 text-sm text-muted">
              {queue.length} kart çalıştın · Tekrar {tally.again} · Zor {tally.hard} · İyi {tally.good} · Kolay {tally.easy}
            </p>
          </div>
          <Button onClick={onExit} className="gap-2">
            <Icon name="check" size={16} /> Bitir
          </Button>
        </div>
      ) : card ? (
        <>
          <button
            onClick={() => setRevealed((r) => !r)}
            className="relative flex min-h-[280px] flex-col items-center justify-center gap-6 rounded-3xl border border-line bg-surface p-8 text-center shadow-[var(--shadow)] transition-colors"
          >
            <span className="absolute left-4 top-4 text-[11px] uppercase tracking-wider text-muted">Soru</span>
            <p className="text-xl font-semibold text-content">{card.front}</p>
            {revealed ? (
              <>
                <div className="h-px w-24 bg-line" />
                <p className="text-lg text-accent">{card.back}</p>
              </>
            ) : (
              <span className="text-[12px] text-muted">Cevabı görmek için tıkla</span>
            )}
          </button>

          {revealed ? (
            <div className="grid grid-cols-4 gap-2.5">
              {GRADES.map((g) => (
                <button
                  key={g.grade}
                  onClick={() => void grade(g.grade)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface py-3.5 transition-transform hover:-translate-y-0.5",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      g.tone === "danger"
                        ? "text-danger"
                        : g.tone === "warning"
                          ? "text-warning"
                          : g.tone === "success"
                            ? "text-success"
                            : "text-accent",
                    )}
                  >
                    {g.label}
                  </span>
                  <span className="text-[10px] text-muted">{g.hint}</span>
                </button>
              ))}
            </div>
          ) : (
            <Button size="lg" onClick={() => setRevealed(true)} className="gap-2">
              <Icon name="eye" size={19} /> Cevabı göster
            </Button>
          )}
        </>
      ) : (
        <EmptyState icon="bookmark" title="Kart yok" />
      )}
    </div>
  );
}

/* ---------------- Modallar ---------------- */

function DeckModal({ deck, courses, onClose }: { deck: Deck | null; courses: Course[]; onClose: () => void }) {
  const isNew = !deck;
  const [name, setName] = useState(deck?.name ?? "");
  const [color, setColor] = useState(deck?.color ?? ACCENT_PRESETS[0].value);
  const [courseId, setCourseId] = useState(deck?.courseId ?? "");

  const save = async () => {
    const v = name.trim();
    if (!v) return;
    const now = Date.now();
    const data = { name: v, color, courseId: courseId || null, updatedAt: now };
    if (isNew) await db.decks.add({ id: uid("deck"), createdAt: now, ...data });
    else await db.decks.update(deck!.id, data);
    onClose();
  };

  const remove = async () => {
    if (!deck) return;
    await db.transaction("rw", [db.decks, db.flashcards], async () => {
      await db.flashcards.where("deckId").equals(deck.id).delete();
      await db.decks.delete(deck.id);
    });
    onClose();
  };

  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title={isNew ? "Yeni deste" : "Desteyi düzenle"}
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
        <Field label="Deste adı">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Öğrenme Kuramları" />
        </Field>
        <Field label="Ders (isteğe bağlı)">
          <Select
            value={courseId || undefined}
            onValueChange={setCourseId}
            placeholder="Ders seç"
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Field>
        <Field label="Renk">
          <div className="flex flex-wrap gap-2">
            {ACCENT_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setColor(p.value)}
                className={cn(
                  "h-8 w-8 rounded-lg border-2 transition-transform",
                  color === p.value ? "border-content scale-110" : "border-transparent",
                )}
                style={{ background: p.value }}
                title={p.name}
                aria-label={p.name}
              />
            ))}
          </div>
        </Field>
        {!isNew && (
          <p className="text-[11px] text-muted">Deste silinince içindeki kartlar da silinir.</p>
        )}
      </div>
    </Modal>
  );
}

function CardEditModal({ card, onClose }: { card: Flashcard; onClose: () => void }) {
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);

  const save = async () => {
    const f = front.trim();
    const b = back.trim();
    if (!f || !b) return;
    await db.flashcards.update(card.id, { front: f, back: b, updatedAt: Date.now() });
    onClose();
  };

  const reset = async () => {
    await db.flashcards.update(card.id, {
      ease: 2.5,
      interval: 0,
      repetitions: 0,
      due: Date.now(),
      lapses: 0,
      reviews: 0,
      updatedAt: Date.now(),
    });
    onClose();
  };

  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title="Kartı düzenle"
      footer={
        <>
          <Button variant="ghost" onClick={reset} className="mr-auto gap-1.5">
            <Icon name="repeat" size={16} /> İlerlemeyi sıfırla
          </Button>
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
        <Field label="Ön yüz">
          <Textarea value={front} onChange={(e) => setFront(e.target.value)} />
        </Field>
        <Field label="Arka yüz">
          <Textarea value={back} onChange={(e) => setBack(e.target.value)} />
        </Field>
        <p className="text-[11px] text-muted">
          İlerleme: {card.reviews} tekrar · kolaylık {card.ease.toFixed(2)} · sıradaki {relative(card.due)}
        </p>
      </div>
    </Modal>
  );
}
