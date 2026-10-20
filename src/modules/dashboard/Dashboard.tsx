import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { db } from "../../db/db";
import { useSettings } from "../../hooks/useSettings";
import { uid } from "../../lib/id";
import { fmt, dueLabel, minutesToLabel, toMondayIndex, WEEKDAYS_TR } from "../../lib/date";
import { dailyFocus, currentStreak, todayFocusMinutes } from "../../lib/stats";
import { greeting, quoteOfDay } from "../../lib/quotes";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { ProgressRing, EmptyState } from "../../components/ui/misc";
import { Icon } from "../../components/icons";
import { cn } from "../../lib/cn";
import type { Task } from "../../types";
import { useNow } from "../../hooks/useNow";

/** Ders olmayan günlerde dönüşümlü gösterilen mesajlar */
const NO_CLASS_NOTES = [
  "Bugün ders yok — kendi planına göre ilerle. 🎯",
  "Sınıf yok; eksik kalan konuları kapatmak için iyi bir gün.",
  "Boş gün: kısa bir tekrar bile fark yaratır.",
  "Ders yok — kütüphane ya da kendi masan, ikisi de olur. 📚",
  "Serbest gün; küçük bir hedef koy ve tamamla.",
  "Bugün ders yok; alışkanlığını bozmamak için bir seans yeter. 🔥",
  "Ders yok — 25 dakikalık bir odak seansı iyi gider.",
];

export function Dashboard() {
  const now = useNow();
  const settings = useSettings();
  const navigate = useNavigate();
  const [quick, setQuick] = useState("");

  const notes = useLiveQuery(() => db.notes.filter((n) => !n.archived).toArray(), [], []);
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []);
  const courses = useLiveQuery(() => db.courses.toArray(), [], []);
  const slots = useLiveQuery(() => db.classSlots.toArray(), [], []);
  const exams = useLiveQuery(() => db.exams.toArray(), [], []);
  const sessions = useLiveQuery(() => db.focusSessions.toArray(), [], []);

  const courseMap = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses]);

  const todayMinutes = todayFocusMinutes(sessions, now);
  const goalPct = Math.min(100, Math.round((todayMinutes / Math.max(1, settings.dailyGoalMinutes)) * 100));
  const streak = currentStreak(sessions, now);
  const week = useMemo(() => dailyFocus(sessions, 7, now), [sessions, now]);
  const weekTotal = week.reduce((s, d) => s + d.minutes, 0);

  const todayIdx = toMondayIndex(new Date(now).getDay());
  const todayClasses = useMemo(
    () => slots.filter((s) => s.day === todayIdx).sort((a, b) => a.start.localeCompare(b.start)),
    [slots, todayIdx],
  );

  const openTasks = tasks.filter((t) => t.status !== "done");
  const todayTasks = useMemo(
    () =>
      openTasks
        .filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === new Date(now).toDateString())
        .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0)),
    [openTasks, now],
  );

  const upcomingExams = useMemo(
    () => exams.filter((e) => e.date >= now - 86400000).sort((a, b) => a.date - b.date).slice(0, 3),
    [exams, now],
  );

  const recentNotes = useMemo(() => [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3), [notes]);

  const quote = quoteOfDay();

  // Ders olmayan günler için sırayla değişen mesajlar (hafta sonu ayrı)
  const noClassNote = useMemo(() => {
    const d = new Date(now);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const idx = Math.floor(d.getTime() / 86400000);
    return isWeekend
      ? "Hafta sonu — zihnini dinlendir; hafif bir tekrar yeterli. 🌿"
      : NO_CLASS_NOTES[idx % NO_CLASS_NOTES.length];
  }, [now]);

  const saveQuick = async () => {
    const v = quick.trim();
    if (!v) return;
    const now = Date.now();
    await db.notes.add({
      id: uid("note"),
      title: v,
      content: "",
      folderId: null,
      tags: [],
      pinned: false,
      favorite: false,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
    setQuick("");
  };

  return (
    <div className="flex flex-col gap-5">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-[var(--shadow)]">
        <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full accent-gradient opacity-[0.18] blur-3xl" />
        <div className="absolute -bottom-28 -left-10 h-56 w-56 rounded-full bg-accent2 opacity-[0.12] blur-3xl" />
        <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-7">
          <div className="min-w-0">
            <p className="text-sm text-muted">{fmt(now, "EEEE, d MMMM")}</p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold text-content">
              {greeting()}
              {settings.userName ? <>, <span className="text-gradient">{settings.userName}</span></> : ""} 👋
            </h1>
            <p className="mt-2 text-sm text-muted italic max-w-lg">
              “{quote.text}” <span className="not-italic text-muted/75">— {quote.by}</span>
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button onClick={() => navigate("/notlar?new=1")} className="gap-2">
                <Icon name="note" size={17} /> Yeni not
              </Button>
              <Button variant="soft" onClick={() => navigate("/odak")} className="gap-2">
                <Icon name="pomodoro" size={17} /> Odak başlat
              </Button>
              <Button variant="ghost" onClick={() => navigate("/gorevler?new=1")} className="gap-2">
                <Icon name="plus" size={17} /> Görev
              </Button>
            </div>

            <form
              className="mt-5 flex items-center gap-2 max-w-md"
              onSubmit={(e) => {
                e.preventDefault();
                void saveQuick();
              }}
            >
              <div className="flex items-center gap-2 flex-1 rounded-xl border border-line bg-bg2/50 px-3.5 h-11">
                <Icon name="sticky" size={17} className="text-muted shrink-0" />
                <input
                  value={quick}
                  onChange={(e) => setQuick(e.target.value)}
                  placeholder="Hızlı not: aklına geleni yaz, Enter'a bas…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70"
                />
              </div>
            </form>
          </div>

          <div className="flex shrink-0 items-center justify-center gap-5 md:flex-col">
            <ProgressRing value={goalPct} size={128} stroke={10}>
              <div className="text-center">
                <div className="text-2xl font-bold text-content">{todayMinutes}</div>
                <div className="text-[11px] text-muted">/ {settings.dailyGoalMinutes} dk</div>
              </div>
            </ProgressRing>
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-wider text-muted">Günlük hedef</p>
              <p className="text-sm font-semibold text-accent">%{goalPct} tamam</p>
            </div>
          </div>
        </div>
      </div>

      {/* STAT KARTLARI */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard icon="stopwatch" label="Bugün odak" value={minutesToLabel(todayMinutes)} tone="accent" />
        <StatCard
          icon="streak"
          label="Gün serisi"
          value={streak > 0 ? `${streak} gün` : "Başla!"}
          tone="warning"
        />
        <StatCard
          icon="list-todo"
          label="Açık görev"
          value={String(openTasks.length)}
          tone="default"
        />
        <StatCard
          icon="exam"
          label="Yaklaşan sınav"
          value={String(exams.filter((e) => e.date >= now).length)}
          tone="danger"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* SOL */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Haftalık grafik */}
          <Card>
            <CardHeader
              icon={<Icon name="line-chart" size={18} />}
              title="Bu haftanın odağı"
              subtitle={`Toplam ${minutesToLabel(weekTotal)} · son 7 gün`}
              action={
                <Link to="/istatistik">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Detay <Icon name="chevron-right" size={15} />
                  </Button>
                </Link>
              }
            />
            <CardBody>
              {weekTotal === 0 ? (
                <div className="grid h-44 place-items-center text-sm text-muted">Bu hafta henüz odak kaydı yok.</div>
              ) : <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={week} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 5" />
                    <YAxis
                      width={42}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted)", fontSize: 10 }}
                      tickFormatter={(value: number) => value >= 60 ? `${Math.round(value / 60)} sa` : `${value} dk`}
                      allowDecimals={false}
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted)", fontSize: 11 }}
                    />
                    <RTooltip
                      cursor={{ stroke: "var(--line)" }}
                      contentStyle={{
                        background: "var(--elevated)",
                        border: "1px solid var(--line)",
                        borderRadius: 12,
                        fontSize: 12,
                        color: "var(--content)",
                      }}
                      itemStyle={{ color: "var(--content)" }}
                      labelStyle={{ color: "var(--muted)" }}
                      formatter={(v) => [`${v} dk odak`, ""]}
                      labelFormatter={(l) => `${l} günü`}
                    />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="var(--accent)"
                      strokeWidth={2.5}
                      fill="url(#focusFill)"
                      dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }}
                      activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>}
            </CardBody>
          </Card>

          {/* Bugünün dersleri */}
          <Card>
            <CardHeader
              icon={<Icon name="timetable" size={18} />}
              title="Bugünün dersleri"
              subtitle={WEEKDAYS_TR[todayIdx]}
              action={
                <Link to="/program">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Program <Icon name="chevron-right" size={15} />
                  </Button>
                </Link>
              }
            />
            <CardBody className="pt-0">
              {todayClasses.length === 0 ? (
                <p className="text-sm text-muted py-2">{noClassNote}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] text-muted">
                    {todayClasses.length} ders · {todayClasses[0].start}–{todayClasses[todayClasses.length - 1].end}
                  </p>
                  {todayClasses.map((s) => {
                    const c = courseMap[s.courseId];
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 rounded-xl border border-line bg-bg2/40 px-3.5 py-2.5"
                      >
                        <span
                          className="h-9 w-1.5 rounded-full shrink-0"
                          style={{ background: c?.color ?? "var(--accent)" }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-content truncate">{c?.name ?? "Ders"}</p>
                          <p className="text-[11px] text-muted">
                            {s.room ? `${s.room} · ` : ""}
                            {c?.teacher ?? ""}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-content tabular-nums shrink-0">
                          {s.start}–{s.end}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* SAĞ */}
        <div className="flex flex-col gap-5">
          {/* Yaklaşan sınavlar */}
          <Card>
            <CardHeader icon={<Icon name="alarm" size={18} />} title="Geri sayım" />
            <CardBody className="pt-0">
              {upcomingExams.length === 0 ? (
                <p className="text-sm text-muted py-2">Yaklaşan sınav yok.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {upcomingExams.map((e) => {
                    const days = Math.ceil((e.date - now) / 86400000);
                    const c = e.courseId ? courseMap[e.courseId] : undefined;
                    return (
                      <div key={e.id} className="flex items-center gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-danger/12 text-danger">
                          <span className="text-sm font-bold leading-none">{days}</span>
                          <span className="text-[8px] uppercase leading-none mt-0.5">gün</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-content truncate">{e.title}</p>
                          <p className="text-[11px] text-muted">{c?.name ?? ""} · {fmt(e.date, "d MMM")}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Bugünün görevleri */}
          <Card>
            <CardHeader
              icon={<Icon name="list-todo" size={18} />}
              title="Bugünün görevleri"
              action={
                <Link to="/gorevler">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Tümü <Icon name="chevron-right" size={15} />
                  </Button>
                </Link>
              }
            />
            <CardBody className="pt-0">
              {todayTasks.length === 0 ? (
                <p className="text-sm text-muted py-2">Bugüne ait görev yok.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {todayTasks.slice(0, 4).map((t) => (
                    <TaskRow key={t.id} task={t} now={now} onToggle={() => toggleTask(t)} />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Son notlar */}
          <Card>
            <CardHeader
              icon={<Icon name="note" size={18} />}
              title="Son notlar"
              action={
                <Link to="/notlar">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Tümü <Icon name="chevron-right" size={15} />
                  </Button>
                </Link>
              }
            />
            <CardBody className="pt-0">
              {recentNotes.length === 0 ? (
                <EmptyState icon="note" title="Henüz not yok" hint="İlk notunu oluştur." />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {recentNotes.map((n) => (
                    <Link
                      key={n.id}
                      to={`/notlar?id=${n.id}`}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-line/40 transition-colors"
                    >
                      <Icon name="note" size={16} className="text-accent shrink-0" />
                      <span className="text-sm text-content truncate flex-1">{n.title}</span>
                      {n.pinned && <Icon name="pin" size={13} className="text-muted" />}
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  tone: "accent" | "warning" | "danger" | "default";
}) {
  const tones = {
    accent: "text-accent bg-accentsoft",
    warning: "text-warning bg-warning/12",
    danger: "text-danger bg-danger/12",
    default: "text-content bg-line/50",
  } as const;
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)]">
      <div className={cn("grid h-10 w-10 place-items-center rounded-xl", tones[tone])}>
        <Icon name={icon} size={20} />
      </div>
      <p className="mt-3 text-lg font-bold text-content tabular-nums">{value}</p>
      <p className="text-[11px] text-muted mt-0.5">{label}</p>
    </div>
  );
}

function TaskRow({ task, now, onToggle }: { task: Task; now: number; onToggle: () => void }) {
  const overdue = task.dueDate ? task.dueDate < now : false;
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5 hover:bg-line/30 transition-colors">
      <button
        onClick={onToggle}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-line text-transparent hover:border-accent hover:text-accent transition-colors"
        aria-label="Tamamla"
      >
        <Icon name="check" size={14} strokeWidth={2.5} />
      </button>
      <span className="text-sm text-content truncate flex-1">{task.title}</span>
      {task.dueDate && (
        <Badge tone={overdue ? "danger" : "muted"}>{dueLabel(task.dueDate)}</Badge>
      )}
    </div>
  );
}

async function toggleTask(t: Task) {
  const done = t.status === "done";
  await db.tasks.update(t.id, {
    status: done ? "todo" : "done",
    completedAt: done ? null : Date.now(),
    updatedAt: Date.now(),
  });
}
