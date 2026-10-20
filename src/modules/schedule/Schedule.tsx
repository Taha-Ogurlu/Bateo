import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { uid } from "../../lib/id";
import { fmt, fromDateInputValue, toDateInputValue, WEEKDAYS_SHORT_TR, WEEKDAYS_TR } from "../../lib/date";
import { startOfDay } from "../../lib/stats";
import { useNow } from "../../hooks/useNow";
import { ACCENT_PRESETS } from "../../lib/color";
import { cn } from "../../lib/cn";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Field, Input } from "../../components/ui/Field";
import { Select } from "../../components/ui/Controls";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs";
import { EmptyState } from "../../components/ui/misc";
import { Icon } from "../../components/icons";
import type { ClassSlot, Course, Exam } from "../../types";

export function Schedule() {
  const courses = useLiveQuery(() => db.courses.toArray(), [], []);
  const slots = useLiveQuery(() => db.classSlots.toArray(), [], []);
  const exams = useLiveQuery(() => db.exams.toArray(), [], []);

  const [tab, setTab] = useState("program");
  const [courseModal, setCourseModal] = useState<Course | "new" | null>(null);
  const [slotModal, setSlotModal] = useState<ClassSlot | "new" | null>(null);
  const [examModal, setExamModal] = useState<Exam | "new" | null>(null);
  const [examDefaultDate, setExamDefaultDate] = useState<number | null>(null);
  const now = useNow();

  const courseMap = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses]);

  const byDay = useMemo(() => {
    const days: ClassSlot[][] = Array.from({ length: 7 }, () => []);
    for (const s of slots) days[s.day]?.push(s);
    days.forEach((d) => d.sort((a, b) => a.start.localeCompare(b.start)));
    return days;
  }, [slots]);

  const upcoming = useMemo(
    () => [...exams].sort((a, b) => a.date - b.date),
    [exams],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="program">
              <Icon name="calendar-week" size={15} /> Haftalık
            </TabsTrigger>
            <TabsTrigger value="exams">
              <Icon name="exam" size={15} /> Sınavlar
            </TabsTrigger>
            <TabsTrigger value="courses">
              <Icon name="book" size={15} /> Dersler
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto flex items-center gap-2">
          {tab === "program" && (
            <Button onClick={() => setSlotModal("new")} className="gap-2">
              <Icon name="plus" size={17} /> Ders ekle
            </Button>
          )}
          {tab === "exams" && (
            <Button onClick={() => setExamModal("new")} className="gap-2">
              <Icon name="plus" size={17} /> Sınav ekle
            </Button>
          )}
          {tab === "courses" && (
            <Button onClick={() => setCourseModal("new")} className="gap-2">
              <Icon name="plus" size={17} /> Ders oluştur
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        {/* HAFTALIK */}
        <TabsContent value="program">
          {slots.length === 0 ? (
            <EmptyState
              icon="timetable"
              title="Ders programı boş"
              hint="Derslerini ekleyerek haftalık programını oluştur."
              action={
                <Button onClick={() => setSlotModal("new")} className="gap-2">
                  <Icon name="plus" size={16} /> İlk dersi ekle
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {byDay.map((daySlots, dayIdx) => (
                <div
                  key={dayIdx}
                  className="flex min-h-[120px] flex-col rounded-2xl border border-line bg-bg2/40 p-2.5"
                >
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      {WEEKDAYS_SHORT_TR[dayIdx]}
                    </span>
                    <button
                      onClick={() => setSlotModal("new")}
                      className="grid h-6 w-6 place-items-center rounded-md text-muted hover:text-accent hover:bg-line/50"
                      aria-label="Ders ekle"
                    >
                      <Icon name="plus" size={14} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {daySlots.map((s) => {
                      const c = courseMap[s.courseId];
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSlotModal(s)}
                          className="rounded-xl border border-line bg-surface p-2.5 text-left shadow-sm transition-transform hover:-translate-y-0.5"
                          style={{ borderLeft: `3px solid ${c?.color ?? "var(--accent)"}` }}
                        >
                          <p className="text-[12.5px] font-semibold text-content leading-tight truncate">
                            {c?.name ?? "Ders"}
                          </p>
                          <p className="mt-1 text-[11px] text-muted tabular-nums">
                            {s.start}–{s.end}
                          </p>
                          {s.room && <p className="text-[10px] text-muted/80">{s.room}</p>}
                        </button>
                      );
                    })}
                    {daySlots.length === 0 && (
                      <p className="px-1 py-3 text-center text-[10px] text-muted/60">boş</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SINAVLAR */}
        <TabsContent value="exams">
          {upcoming.length === 0 ? (
            <EmptyState
              icon="exam"
              title="Sınav eklenmemiş"
              hint="Sınavlarını ekle; geri sayım, takvim ve hatırlatıcılar devreye girsin."
              action={
                <Button onClick={() => setExamModal("new")} className="gap-2">
                  <Icon name="plus" size={16} /> Sınav ekle
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-5">
              <ExamCountdown exam={upcoming.find((e) => e.date >= now - 3600000) ?? null} courseMap={courseMap} now={now} />

              <ExamCalendar
                exams={upcoming}
                courseMap={courseMap}
                onOpen={(e) => setExamModal(e)}
                onAddOn={(day) => {
                  setExamDefaultDate(day);
                  setExamModal("new");
                }}
              />

              <div className="flex flex-col gap-2.5">
                {upcoming.map((e) => {
                  const days = Math.ceil((e.date - now) / 86400000);
                  const past = days < 0;
                  const c = e.courseId ? courseMap[e.courseId] : undefined;
                  return (
                    <button
                      key={e.id}
                      onClick={() => setExamModal(e)}
                      className="flex items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-3.5 text-left shadow-[var(--shadow)] transition-colors hover:border-accent/40"
                    >
                      <div
                        className={cn(
                          "grid h-14 w-14 shrink-0 place-items-center rounded-2xl",
                          past ? "bg-line/50 text-muted" : days <= 3 ? "bg-danger/12 text-danger" : "bg-accentsoft text-accent",
                        )}
                      >
                        <span className="text-lg font-bold leading-none">{Math.abs(days)}</span>
                        <span className="text-[9px] uppercase leading-none mt-0.5">{past ? "geçti" : "gün"}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-content truncate">{e.title}</p>
                        <p className="text-[11px] text-muted mt-0.5">{fmt(e.date, "d MMMM yyyy, EEEE")}</p>
                        {e.note && <p className="text-[11px] text-muted/80 mt-1 truncate">{e.note}</p>}
                      </div>
                      {c && (
                        <span
                          className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
                          style={{ background: `${c.color}22`, color: c.color }}
                        >
                          {c.name}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* DERSLER */}
        <TabsContent value="courses">
          {courses.length === 0 ? (
            <EmptyState
              icon="book"
              title="Ders yok"
              hint="Derslerini oluştur, sonra programa yerleştir."
              action={
                <Button onClick={() => setCourseModal("new")} className="gap-2">
                  <Icon name="plus" size={16} /> Ders oluştur
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => {
                const count = slots.filter((s) => s.courseId === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCourseModal(c)}
                    className="flex flex-col rounded-2xl border border-line bg-surface p-4 text-left shadow-[var(--shadow)] transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${c.color}22`, color: c.color }}>
                        <Icon name="book" size={20} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-content truncate">{c.name}</p>
                        <p className="text-[11px] text-muted truncate">{c.teacher || "—"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge tone="muted">{count} ders saati</Badge>
                      {c.room && <Badge tone="muted">{c.room}</Badge>}
                      {c.credits ? <Badge tone="accent">{c.credits} kredi</Badge> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {courseModal && (
        <CourseModal course={courseModal === "new" ? null : courseModal} onClose={() => setCourseModal(null)} />
      )}
      {slotModal && (
        <SlotModal
          slot={slotModal === "new" ? null : slotModal}
          courses={courses}
          defaultDay={0}
          onClose={() => setSlotModal(null)}
          onNeedCourse={() => {
            setSlotModal(null);
            setCourseModal("new");
          }}
        />
      )}
      {examModal && (
        <ExamModal
          exam={examModal === "new" ? null : examModal}
          courses={courses}
          defaultDate={examDefaultDate}
          onClose={() => {
            setExamModal(null);
            setExamDefaultDate(null);
          }}
        />
      )}
    </div>
  );
}

/* ----------------- Modallar ----------------- */

const COLOR_OPTIONS = ACCENT_PRESETS.map((p) => p.value);

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_OPTIONS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cn(
            "h-8 w-8 rounded-lg border-2 transition-transform",
            value === c ? "border-content scale-110" : "border-transparent",
          )}
          style={{ background: c }}
          aria-label={`Renk ${c}`}
        />
      ))}
    </div>
  );
}

function CourseModal({ course, onClose }: { course: Course | null; onClose: () => void }) {
  const isNew = !course;
  const [name, setName] = useState(course?.name ?? "");
  const [teacher, setTeacher] = useState(course?.teacher ?? "");
  const [room, setRoom] = useState(course?.room ?? "");
  const [credits, setCredits] = useState(String(course?.credits ?? ""));
  const [color, setColor] = useState(course?.color ?? COLOR_OPTIONS[0]);

  const save = async () => {
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      teacher: teacher.trim(),
      room: room.trim(),
      credits: credits ? Number(credits) : undefined,
      color,
    };
    if (isNew) await db.courses.add({ id: uid("crs"), createdAt: Date.now(), ...data });
    else await db.courses.update(course!.id, data);
    onClose();
  };

  const remove = async () => {
    if (!course) return;
    await db.transaction("rw", [db.courses, db.classSlots], async () => {
      await db.classSlots.where("courseId").equals(course.id).delete();
      await db.courses.delete(course.id);
    });
    onClose();
  };

  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title={isNew ? "Yeni ders" : "Dersi düzenle"}
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
        <Field label="Ders adı">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Sosyal Psikoloji" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Öğretim üyesi">
            <Input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Örn. Dr. Kaya" />
          </Field>
          <Field label="Derslik">
            <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Örn. A21" />
          </Field>
        </div>
        <Field label="Kredi (isteğe bağlı)">
          <Input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} placeholder="3" />
        </Field>
        <Field label="Renk">
          <ColorPicker value={color} onChange={setColor} />
        </Field>
        {!isNew && (
          <p className="text-[11px] text-muted">
            Bu dersi silmek, bağlı ders saatlerini de siler.
          </p>
        )}
      </div>
    </Modal>
  );
}

function SlotModal({
  slot,
  courses,
  defaultDay,
  onClose,
  onNeedCourse,
}: {
  slot: ClassSlot | null;
  courses: Course[];
  defaultDay: number;
  onClose: () => void;
  onNeedCourse: () => void;
}) {
  const isNew = !slot;
  const [courseId, setCourseId] = useState(slot?.courseId ?? courses[0]?.id ?? "");
  const [day, setDay] = useState(slot?.day ?? defaultDay);
  const [start, setStart] = useState(slot?.start ?? "09:00");
  const [end, setEnd] = useState(slot?.end ?? "10:30");
  const [room, setRoom] = useState(slot?.room ?? "");

  const save = async () => {
    if (!courseId) return;
    const data = { courseId, day, start, end, room: room.trim() };
    if (isNew) await db.classSlots.add({ id: uid("slot"), ...data });
    else await db.classSlots.update(slot!.id, data);
    onClose();
  };

  const remove = async () => {
    if (slot) await db.classSlots.delete(slot.id);
    onClose();
  };

  if (courses.length === 0) {
    return (
      <Modal
        open
        onOpenChange={(v) => !v && onClose()}
        title="Önce ders oluştur"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Kapat
            </Button>
            <Button onClick={onNeedCourse} className="gap-2">
              <Icon name="plus" size={16} /> Ders oluştur
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">Programa ders eklemek için önce bir ders oluşturmalısın.</p>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title={isNew ? "Ders saati ekle" : "Ders saatini düzenle"}
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
        <Field label="Ders">
          <Select
            value={courseId || undefined}
            onValueChange={setCourseId}
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Field>
        <Field label="Gün">
          <Select
            value={String(day)}
            onValueChange={(v) => setDay(Number(v))}
            options={WEEKDAYS_TR.map((d, i) => ({ value: String(i), label: d }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Başlangıç">
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="Bitiş">
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
        <Field label="Derslik (isteğe bağlı)">
          <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Örn. B12" />
        </Field>
      </div>
    </Modal>
  );
}

function ExamModal({
  exam,
  courses,
  defaultDate,
  onClose,
}: {
  exam: Exam | null;
  courses: Course[];
  defaultDate?: number | null;
  onClose: () => void;
}) {
  const isNew = !exam;
  const [title, setTitle] = useState(exam?.title ?? "");
  const [courseId, setCourseId] = useState(exam?.courseId ?? "");
  const [date, setDate] = useState(
    exam
      ? toDateInputValue(exam.date)
      : defaultDate
        ? toDateInputValue(defaultDate)
        : "",
  );
  const [note, setNote] = useState(exam?.note ?? "");

  const save = async () => {
    if (!title.trim() || !date) return;
    const dateTimestamp = fromDateInputValue(date, "09:00");
    if (dateTimestamp === null) return;
    const data = {
      title: title.trim(),
      courseId: courseId || null,
      date: dateTimestamp,
      note: note.trim(),
    };
    if (isNew) await db.exams.add({ id: uid("exam"), createdAt: Date.now(), ...data });
    else await db.exams.update(exam!.id, data);
    onClose();
  };

  const remove = async () => {
    if (exam) await db.exams.delete(exam.id);
    onClose();
  };

  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title={isNew ? "Sınav ekle" : "Sınavı düzenle"}
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
        <Field label="Sınav adı">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Sosyal Psikoloji Vize" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ders">
            <Select
              value={courseId || undefined}
              onValueChange={setCourseId}
              placeholder="Ders seç"
              options={courses.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Field>
          <Field label="Tarih">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Not">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Kapsam, derslik vs." />
        </Field>
      </div>
    </Modal>
  );
}

/* ---------------- Sınav geri sayım & takvim ---------------- */

const DAY = 86400000;

function ExamCountdown({
  exam,
  courseMap,
  now,
}: {
  exam: Exam | null;
  courseMap: Record<string, Course | undefined>;
  now: number;
}) {
  if (!exam) {
    return (
      <div className="rounded-3xl border border-line bg-surface p-6 text-center shadow-[var(--shadow)]">
        <p className="text-sm text-muted">Yaklaşan sınav yok 🎉</p>
      </div>
    );
  }
  const diff = Math.max(0, exam.date - now);
  const units = [
    { label: "Gün", value: Math.floor(diff / DAY) },
    { label: "Saat", value: Math.floor((diff % DAY) / 3600000) },
    { label: "Dakika", value: Math.floor((diff % 3600000) / 60000) },
    { label: "Saniye", value: Math.floor((diff % 60000) / 1000) },
  ];
  const c = exam.courseId ? courseMap[exam.courseId] : undefined;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow)]">
      <div className="absolute -top-20 -right-10 h-48 w-48 rounded-full accent-gradient opacity-20 blur-3xl" />
      <div className="relative">
        <p className="text-[11px] uppercase tracking-wider text-muted">En yakın sınav</p>
        <h3 className="mt-1 text-xl font-bold text-content">{exam.title}</h3>
        <p className="mt-0.5 text-[12px] text-muted">
          {fmt(exam.date, "d MMMM yyyy, EEEE · HH:mm")}
          {c ? ` · ${c.name}` : ""}
        </p>
        <div className="mt-5 grid max-w-md grid-cols-4 gap-3">
          {units.map((u) => (
            <div key={u.label} className="rounded-2xl border border-line bg-bg2/40 py-3 text-center">
              <div className="text-2xl font-bold tabular-nums text-content">{String(u.value).padStart(2, "0")}</div>
              <div className="text-[10px] text-muted">{u.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExamCalendar({
  exams,
  courseMap,
  onOpen,
  onAddOn,
}: {
  exams: Exam[];
  courseMap: Record<string, Course | undefined>;
  onOpen: (e: Exam) => void;
  onAddOn: (day: number) => void;
}) {
  const now = useNow();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  const byDay = useMemo(() => {
    const m = new Map<number, Exam[]>();
    for (const e of exams) {
      const k = startOfDay(e.date);
      const arr = m.get(k);
      if (arr) arr.push(e);
      else m.set(k, [e]);
    }
    return m;
  }, [exams]);

  const cells = useMemo(() => {
    const first = new Date(cursor);
    const idx = (first.getDay() + 6) % 7;
    const start = cursor - idx * DAY;
    return Array.from({ length: 42 }, (_, i) => start + i * DAY);
  }, [cursor]);

  const month = new Date(cursor).getMonth();
  const todayKey = startOfDay(now);
  const shift = (n: number) => {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + n);
    d.setDate(1);
    setCursor(d.getTime());
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)]">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => shift(-1)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:bg-line/50 hover:text-content"
          aria-label="Önceki ay"
        >
          <Icon name="chevron-left" size={17} />
        </button>
        <button
          onClick={() => shift(1)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:bg-line/50 hover:text-content"
          aria-label="Sonraki ay"
        >
          <Icon name="chevron-right" size={17} />
        </button>
        <h3 className="ml-1 text-base font-bold capitalize text-content">{fmt(cursor, "MMMM yyyy")}</h3>
        <span className="ml-auto text-[11px] text-muted">Bir güne tıkla → o güne sınav ekle</span>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1.5">
        {WEEKDAYS_SHORT_TR.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) => {
          const inMonth = new Date(cell).getMonth() === month;
          const isToday = cell === todayKey;
          const list = byDay.get(cell) ?? [];
          return (
            <button
              key={i}
              onClick={() => (list.length > 0 ? onOpen(list[0]) : onAddOn(cell))}
              className={cn(
                "flex h-[86px] flex-col rounded-xl border p-1.5 text-left transition-colors",
                isToday ? "border-accent bg-accentsoft" : "border-line bg-bg2/40 hover:border-accent/40",
                !inMonth && "opacity-50",
              )}
            >
              <span
                className={cn(
                  "text-[12px] font-semibold",
                  isToday ? "text-accent" : inMonth ? "text-content" : "text-muted",
                )}
              >
                {new Date(cell).getDate()}
              </span>
              <div className="mt-1 flex flex-col gap-1 overflow-hidden">
                {list.slice(0, 2).map((e) => {
                  const c = e.courseId ? courseMap[e.courseId] : undefined;
                  const color = c?.color ?? "var(--danger)";
                  return (
                    <span
                      key={e.id}
                      className="truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ background: `color-mix(in srgb, ${color} 20%, transparent)`, color }}
                      title={e.title}
                    >
                      {e.title}
                    </span>
                  );
                })}
                {list.length > 2 && (
                  <span className="pl-1 text-[10px] text-muted">+{list.length - 2} daha</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
