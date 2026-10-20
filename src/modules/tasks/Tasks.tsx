import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { uid } from "../../lib/id";
import { dueLabel, fromDateInputValue, isOverdue, fmt, toDateInputValue, WEEKDAYS_SHORT_TR } from "../../lib/date";
import { cn } from "../../lib/cn";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Field, Input, Textarea } from "../../components/ui/Field";
import { Select, Checkbox } from "../../components/ui/Controls";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/Tabs";
import { EmptyState } from "../../components/ui/misc";
import { Icon } from "../../components/icons";
import type { Priority, Task, TaskStatus } from "../../types";
import { useNow } from "../../hooks/useNow";

const DAY = 86400000;

const PRIORITY_META: Record<Priority, { label: string; tone: "muted" | "accent" | "danger" }> = {
  low: { label: "Düşük", tone: "muted" },
  normal: { label: "Normal", tone: "accent" },
  high: { label: "Yüksek", tone: "danger" },
};

const STATUS_META: Record<TaskStatus, { label: string; icon: string }> = {
  todo: { label: "Yapılacak", icon: "box" },
  doing: { label: "Devam ediyor", icon: "progress-circle" },
  done: { label: "Tamamlandı", icon: "check-circle" },
};

export function Tasks() {
  const now = useNow();
  const [params, setParams] = useSearchParams();
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []);
  const courses = useLiveQuery(() => db.courses.toArray(), [], []);

  const [view, setView] = useState("list");
  const [editing, setEditing] = useState<Task | "new" | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");

  const courseMap = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses]);

  // ?new=1 → yeni görev
  useEffect(() => {
    if (params.get("new") === "1") {
      setEditing("new");
      const p = new URLSearchParams(params);
      p.delete("new");
      setParams(p, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Komut paletinden bir görev seçildiğinde düzenleme penceresini doğrudan aç.
  useEffect(() => {
    const taskId = params.get("id");
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    setEditing(task);
    const next = new URLSearchParams(params);
    next.delete("id");
    setParams(next, { replace: true });
  }, [params, tasks, setParams]);

  const filtered = useMemo(
    () => tasks.filter((t) => (statusFilter === "all" ? true : t.status === statusFilter)),
    [tasks, statusFilter],
  );

  const grouped = useMemo(() => {
    const todayKey = new Date(now).toDateString();
    const open = filtered.filter((t) => t.status !== "done");
    const overdue = open.filter((t) => t.dueDate && isOverdue(t.dueDate));
    const today = open.filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === todayKey);
    const upcoming = open.filter(
      (t) => t.dueDate && !isOverdue(t.dueDate) && new Date(t.dueDate).toDateString() !== todayKey,
    );
    const none = open.filter((t) => !t.dueDate);
    const done = filtered.filter((t) => t.status === "done");
    return [
      { key: "overdue", title: "Geciken", items: overdue, tone: "danger" as const },
      { key: "today", title: "Bugün", items: today, tone: "accent" as const },
      { key: "upcoming", title: "Yaklaşan", items: upcoming, tone: "default" as const },
      { key: "none", title: "Tarihsiz", items: none, tone: "default" as const },
      { key: "done", title: "Tamamlanan", items: done, tone: "success" as const },
    ].filter((g) => g.items.length > 0);
  }, [filtered, now]);

  const openCount = tasks.filter((t) => t.status !== "done").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Üst çubuk */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="list">
              <Icon name="list-todo" size={15} /> Liste
            </TabsTrigger>
            <TabsTrigger value="board">
              <Icon name="dashboard" size={15} /> Pano
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Icon name="calendar-week" size={15} /> Takvim
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select
          className="h-9 w-[150px]"
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          options={[
            { value: "all", label: "Tüm görevler" },
            { value: "todo", label: "Yapılacak" },
            { value: "doing", label: "Devam ediyor" },
            { value: "done", label: "Tamamlandı" },
          ]}
        />

        <div className="ml-auto flex items-center gap-2">
          <Badge tone="muted">{openCount} açık görev</Badge>
          <Button onClick={() => setEditing("new")} className="gap-2">
            <Icon name="plus" size={17} /> Görev ekle
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon="list-todo"
          title="Henüz görev yok"
          hint="İlk görevini ekleyerek başla."
          action={
            <Button onClick={() => setEditing("new")} className="gap-2">
              <Icon name="plus" size={16} /> Görev ekle
            </Button>
          }
        />
      ) : view === "list" ? (
        <div className="flex flex-col gap-5">
          {grouped.map((g) => (
            <div key={g.key}>
              <div className="mb-2 flex items-center gap-2">
                <h3
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    g.tone === "danger" ? "text-danger" : g.tone === "accent" ? "text-accent" : "text-muted",
                  )}
                >
                  {g.title}
                </h3>
                <span className="text-[11px] text-muted/70">{g.items.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {g.items.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    courseName={t.courseId ? courseMap[t.courseId]?.name : undefined}
                    courseColor={t.courseId ? courseMap[t.courseId]?.color : undefined}
                    onOpen={() => setEditing(t)}
                  />
                ))}
              </div>
            </div>
          ))}
          {grouped.length === 0 && <EmptyState icon="filter" title="Bu filtrede görev yok" />}
        </div>
      ) : view === "board" ? (
        <div className="grid gap-4 md:grid-cols-3">
          {(["todo", "doing", "done"] as TaskStatus[]).map((col) => (
            <KanbanColumn
              key={col}
              status={col}
              tasks={filtered.filter((t) => t.status === col)}
              courseMap={courseMap}
              onOpen={setEditing}
            />
          ))}
        </div>
      ) : (
        <MonthCalendar
          tasks={filtered}
          courseMap={courseMap}
          onOpenTask={setEditing}
          onToggle={async (t) => {
            const done = t.status === "done";
            await db.tasks.update(t.id, {
              status: done ? "todo" : "done",
              completedAt: done ? null : Date.now(),
              updatedAt: Date.now(),
            });
          }}
        />
      )}

      {editing && (
        <TaskModal
          task={editing === "new" ? null : editing}
          courses={courses}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function TaskRow({
  task,
  courseName,
  courseColor,
  onOpen,
}: {
  task: Task;
  courseName?: string;
  courseColor?: string;
  onOpen: () => void;
}) {
  const done = task.status === "done";
  const overdue = !done && task.dueDate && isOverdue(task.dueDate);
  const doneSubs = task.subtasks.filter((s) => s.done).length;

  const cycle = async () => {
    const next: TaskStatus = task.status === "done" ? "todo" : "done";
    await db.tasks.update(task.id, {
      status: next,
      completedAt: next === "done" ? Date.now() : null,
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="group flex items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-[var(--shadow)] transition-colors hover:border-accent/40">
      <button
        onClick={cycle}
        aria-label="Durum değiştir"
        className={cn(
          "mt-0.5 grid h-5.5 w-5.5 shrink-0 place-items-center rounded-md border transition-colors",
          done ? "border-accent bg-accent text-[var(--accent-fg)]" : "border-line text-transparent hover:border-accent hover:text-accent",
        )}
        style={{ height: 22, width: 22 }}
      >
        <Icon name="check" size={14} strokeWidth={2.5} />
      </button>

      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className={cn("text-sm font-medium", done ? "text-muted line-through" : "text-content")}>{task.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge tone={PRIORITY_META[task.priority].tone}>{PRIORITY_META[task.priority].label}</Badge>
          {task.dueDate && (
            <Badge tone={overdue ? "danger" : "muted"}>
              <Icon name="deadline" size={11} /> {dueLabel(task.dueDate)}
            </Badge>
          )}
          {courseName && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: courseColor }} />
              {courseName}
            </span>
          )}
          {task.subtasks.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted">
              <Icon name="subtask" size={12} /> {doneSubs}/{task.subtasks.length}
            </span>
          )}
        </div>
      </button>

      <button
        onClick={changeStatus.bind(null, task, "doing")}
        title="Devam ediyor"
        className={cn(
          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
          task.status === "doing" ? "text-accent bg-accentsoft" : "text-muted/50 hover:text-accent hover:bg-line/50",
        )}
      >
        <Icon name="progress-circle" size={17} />
      </button>
    </div>
  );
}

async function changeStatus(task: Task, status: TaskStatus) {
  await db.tasks.update(task.id, {
    status: task.status === status ? "todo" : status,
    updatedAt: Date.now(),
  });
}

function KanbanColumn({
  status,
  tasks,
  courseMap,
  onOpen,
}: {
  status: TaskStatus;
  tasks: Task[];
  courseMap: Record<string, { name: string; color: string }>;
  onOpen: (t: Task) => void;
}) {
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData("text/task");
        if (id) await db.tasks.update(id, { status, updatedAt: Date.now() });
      }}
      className={cn(
        "flex min-h-[240px] flex-col rounded-2xl border bg-bg2/40 p-3 transition-colors",
        over ? "border-accent bg-accentsoft" : "border-line",
      )}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <Icon name={STATUS_META[status].icon} size={16} className="text-accent" />
        <span className="text-sm font-semibold text-content">{STATUS_META[status].label}</span>
        <span className="ml-auto text-[11px] text-muted">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((t) => (
          <div
            key={t.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/task", t.id)}
            onClick={() => onOpen(t)}
            className="cursor-grab rounded-xl border border-line bg-surface p-3 shadow-sm transition-transform hover:-translate-y-0.5 active:cursor-grabbing"
          >
            <p className={cn("text-sm font-medium", t.status === "done" ? "text-muted line-through" : "text-content")}>
              {t.title}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone={PRIORITY_META[t.priority].tone}>{PRIORITY_META[t.priority].label}</Badge>
              {t.dueDate && <Badge tone="muted">{dueLabel(t.dueDate)}</Badge>}
              {t.courseId && courseMap[t.courseId] && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] text-muted"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: courseMap[t.courseId].color }} />
                  {courseMap[t.courseId].name}
                </span>
              )}
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p className="px-1 py-6 text-center text-xs text-muted/70">Buraya sürükle</p>}
      </div>
    </div>
  );
}

function TaskModal({
  task,
  courses,
  onClose,
}: {
  task: Task | null;
  courses: { id: string; name: string }[];
  onClose: () => void;
}) {
  const isNew = !task;
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "normal");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [courseId, setCourseId] = useState(task?.courseId ?? "");
  const [due, setDue] = useState(toDateInputValue(task?.dueDate));
  const [subtasks, setSubtasks] = useState(task?.subtasks ?? []);
  const [subInput, setSubInput] = useState("");

  const save = async () => {
    if (!title.trim()) return;
    const now = Date.now();
    const data = {
      title: title.trim(),
      notes: notes.trim(),
      priority,
      status,
      courseId: courseId || null,
      dueDate: fromDateInputValue(due, "23:59"),
      subtasks,
      updatedAt: now,
    };
    if (isNew) {
      await db.tasks.add({ id: uid("task"), tags: [], createdAt: now, completedAt: null, ...data });
    } else {
      await db.tasks.update(task!.id, data);
    }
    onClose();
  };

  const remove = async () => {
    if (task) await db.tasks.delete(task.id);
    onClose();
  };

  const addSub = () => {
    const v = subInput.trim();
    if (!v) return;
    setSubtasks((s) => [...s, { id: uid("st"), title: v, done: false }]);
    setSubInput("");
  };

  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title={isNew ? "Yeni görev" : "Görevi düzenle"}
      size="md"
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
        <Field label="Görev">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ne yapılacak?" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Durum">
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as TaskStatus)}
              options={[
                { value: "todo", label: "Yapılacak" },
                { value: "doing", label: "Devam ediyor" },
                { value: "done", label: "Tamamlandı" },
              ]}
            />
          </Field>
          <Field label="Öncelik">
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Priority)}
              options={[
                { value: "low", label: "Düşük" },
                { value: "normal", label: "Normal" },
                { value: "high", label: "Yüksek" },
              ]}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Ders">
            <Select
              value={courseId || undefined}
              onValueChange={setCourseId}
              placeholder="Ders seç"
              options={courses.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Field>
          <Field label="Teslim tarihi">
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </div>

        <Field label="Notlar">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detaylar (isteğe bağlı)" />
        </Field>

        <Field label="Alt görevler">
          <div className="flex flex-col gap-1.5">
            {subtasks.map((s) => (
              <div key={s.id} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-1.5">
                <Checkbox
                  checked={s.done}
                  onCheckedChange={(v) =>
                    setSubtasks((list) => list.map((x) => (x.id === s.id ? { ...x, done: v } : x)))
                  }
                />
                <span className={cn("flex-1 text-sm", s.done ? "text-muted line-through" : "text-content")}>
                  {s.title}
                </span>
                <button
                  onClick={() => setSubtasks((list) => list.filter((x) => x.id !== s.id))}
                  className="text-muted hover:text-danger"
                >
                  <Icon name="close" size={15} />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input
                value={subInput}
                onChange={(e) => setSubInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSub())}
                placeholder="Alt görev ekle ve Enter"
                className="h-9"
              />
              <Button variant="soft" size="sm" onClick={addSub}>
                Ekle
              </Button>
            </div>
          </div>
        </Field>
      </div>
    </Modal>
  );
}

/* ---------------- Takvim (planlayıcı) ---------------- */

function dayKey(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function MonthCalendar({
  tasks,
  courseMap,
  onOpenTask,
  onToggle,
}: {
  tasks: Task[];
  courseMap: Record<string, { name: string; color: string }>;
  onOpenTask: (t: Task) => void;
  onToggle: (t: Task) => Promise<void>;
}) {
  const now = useNow();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });
  const [dayModal, setDayModal] = useState<number | null>(null);

  const tasksByDay = useMemo(() => {
    const map = new Map<number, Task[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const k = dayKey(t.dueDate);
      const arr = map.get(k) ?? [];
      arr.push(t);
      map.set(k, arr);
    }
    return map;
  }, [tasks]);

  const cells = useMemo(() => {
    const first = new Date(cursor);
    const idx = (first.getDay() + 6) % 7; // 0 = Pazartesi
    const start = cursor - idx * DAY;
    return Array.from({ length: 42 }, (_, i) => start + i * DAY);
  }, [cursor]);

  const month = new Date(cursor).getMonth();
  const todayKey = dayKey(now);
  const undated = tasks.filter((t) => !t.dueDate && t.status !== "done").length;

  const shift = (n: number) => {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + n);
    d.setDate(1);
    setCursor(d.getTime());
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Başlık */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => shift(-1)} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:text-content hover:bg-line/50" aria-label="Önceki ay">
            <Icon name="chevron-left" size={17} />
          </button>
          <button onClick={() => shift(1)} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:text-content hover:bg-line/50" aria-label="Sonraki ay">
            <Icon name="chevron-right" size={17} />
          </button>
          <Button
            variant="outline"
            className="ml-1"
            onClick={() => {
              const d = new Date();
              d.setDate(1);
              d.setHours(0, 0, 0, 0);
              setCursor(d.getTime());
            }}
          >
            Bugün
          </Button>
        </div>
        <h3 className="text-lg font-bold text-content capitalize">{fmt(cursor, "MMMM yyyy")}</h3>
        <div className="ml-auto flex items-center gap-2">
          {undated > 0 && <Badge tone="muted">{undated} tarihsiz görev</Badge>}
          <Badge tone="muted">Göreve tıkla → düzenle · Güne tıkla → ekle</Badge>
        </div>
      </div>

      {/* Izgara */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
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
              const dayTasks = tasksByDay.get(cell) ?? [];
              return (
                <button
                  key={i}
                  onClick={() => setDayModal(cell)}
                  className={cn(
                    "flex h-[104px] flex-col rounded-xl border p-1.5 text-left transition-colors",
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
                    {dayTasks.slice(0, 3).map((t) => {
                      const c = t.courseId ? courseMap[t.courseId] : undefined;
                      const color = c?.color ?? "var(--accent)";
                      return (
                        <span
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTask(t);
                          }}
                          className={cn(
                            "truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                            t.status === "done" && "line-through opacity-60",
                          )}
                          style={{ background: `color-mix(in srgb, ${color} 20%, transparent)`, color }}
                          title={t.title}
                        >
                          {t.title}
                        </span>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <span className="pl-1 text-[10px] text-muted">+{dayTasks.length - 3} daha</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {dayModal !== null && (
        <DayModal
          day={dayModal}
          tasks={tasksByDay.get(dayModal) ?? []}
          courseMap={courseMap}
          onOpenTask={onOpenTask}
          onToggle={onToggle}
          onClose={() => setDayModal(null)}
        />
      )}
    </div>
  );
}

function DayModal({
  day,
  tasks,
  courseMap,
  onOpenTask,
  onToggle,
  onClose,
}: {
  day: number;
  tasks: Task[];
  courseMap: Record<string, { name: string; color: string }>;
  onOpenTask: (t: Task) => void;
  onToggle: (t: Task) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");

  const add = async () => {
    const v = title.trim();
    if (!v) return;
    const now = Date.now();
    const due = day + 23 * 3600000 + 59 * 60000;
    await db.tasks.add({
      id: uid("task"),
      title: v,
      status: "todo",
      priority,
      dueDate: due,
      courseId: null,
      tags: [],
      subtasks: [],
      createdAt: now,
      updatedAt: now,
    });
    setTitle("");
  };

  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title={fmt(day, "d MMMM yyyy, EEEE")}
      description={`${tasks.length} görev`}
    >
      <div className="flex flex-col gap-3">
        {/* Hızlı ekle */}
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void add())}
            placeholder="Bu güne görev ekle…"
          />
          <Select
            className="h-10 w-[110px] shrink-0"
            value={priority}
            onValueChange={(v) => setPriority(v as Priority)}
            options={[
              { value: "low", label: "Düşük" },
              { value: "normal", label: "Normal" },
              { value: "high", label: "Yüksek" },
            ]}
          />
          <Button onClick={add} className="gap-1.5 shrink-0">
            <Icon name="plus" size={16} /> Ekle
          </Button>
        </div>

        {/* Liste */}
        <div className="flex flex-col gap-1.5 max-h-[46vh] overflow-y-auto">
          {tasks.length === 0 && <p className="py-6 text-center text-sm text-muted">Bu gün için görev yok.</p>}
          {tasks.map((t) => {
            const c = t.courseId ? courseMap[t.courseId] : undefined;
            const done = t.status === "done";
            return (
              <div key={t.id} className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2">
                <button
                  onClick={() => void onToggle(t)}
                  className={cn(
                    "grid h-5.5 w-5.5 shrink-0 place-items-center rounded-md border transition-colors",
                    done ? "border-accent bg-accent text-[var(--accent-fg)]" : "border-line text-transparent hover:border-accent hover:text-accent",
                  )}
                  style={{ height: 22, width: 22 }}
                  aria-label="Durum değiştir"
                >
                  <Icon name="check" size={14} strokeWidth={2.5} />
                </button>
                <button onClick={() => onOpenTask(t)} className="min-w-0 flex-1 text-left">
                  <p className={cn("truncate text-sm", done ? "text-muted line-through" : "text-content")}>{t.title}</p>
                </button>
                <Badge tone={PRIORITY_META[t.priority].tone}>{PRIORITY_META[t.priority].label}</Badge>
                {c && <span className="h-2 w-2 rounded-full shrink-0" style={{ background: c.color }} title={c.name} />}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
