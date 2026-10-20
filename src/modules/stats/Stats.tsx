import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { db } from "../../db/db";
import { useSettings } from "../../hooks/useSettings";
import { dailyFocus, currentStreak, heatmapWeeks, startOfDay } from "../../lib/stats";
import { minutesToLabel, fmt } from "../../lib/date";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { ProgressRing } from "../../components/ui/misc";
import { Icon } from "../../components/icons";
import { cn } from "../../lib/cn";
import { useNow } from "../../hooks/useNow";

const DAY = 86400000;

type Period = "day" | "week" | "month";
const PERIODS: { key: Period; label: string }[] = [
  { key: "day", label: "Günlük" },
  { key: "week", label: "Haftalık" },
  { key: "month", label: "Aylık" },
];

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--elevated)",
    border: "1px solid var(--line)",
    borderRadius: 12,
    fontSize: 12,
    color: "var(--content)",
  },
  itemStyle: { color: "var(--content)" },
  labelStyle: { color: "var(--muted)" },
} as const;

export function Stats() {
  const now = useNow();
  const settings = useSettings();
  const sessions = useLiveQuery(() => db.focusSessions.toArray(), [], []);
  const courses = useLiveQuery(() => db.courses.toArray(), [], []);
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []);

  const [period, setPeriod] = useState<Period>("week");

  const courseMap = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses]);

  const week = useMemo(() => dailyFocus(sessions, 7, now), [sessions, now]);
  const month = useMemo(() => dailyFocus(sessions, 30, now), [sessions, now]);
  const weeks = useMemo(() => heatmapWeeks(sessions, 26, now), [sessions, now]);

  const weekTotal = week.reduce((s, d) => s + d.minutes, 0);
  const monthTotal = month.reduce((s, d) => s + d.minutes, 0);
  const activeDays = month.filter((d) => d.minutes > 0).length;
  const avgPerActive = activeDays ? Math.round(monthTotal / activeDays) : 0;
  const streak = currentStreak(sessions, now);

  const weeklyGoalPct = Math.min(100, Math.round((weekTotal / Math.max(1, settings.weeklyGoalMinutes)) * 100));

  const doneTasks = tasks.filter((t) => t.status === "done");
  const tasksThisWeek = doneTasks.filter((t) => t.completedAt && t.completedAt >= now - 7 * DAY).length;

  // Dönem bazlı ders dağılımı
  const byCourse = useMemo(() => {
    const today = startOfDay(now);
    const from =
      period === "day" ? today : period === "week" ? today - 6 * DAY : today - 29 * DAY;
    const to = today + DAY;
    const map = new Map<string, number>();
    for (const s of sessions) {
      if (!s.completed || s.kind !== "work" || s.startedAt < from || s.startedAt >= to) continue;
      const key = s.courseId ?? "_free";
      map.set(key, (map.get(key) ?? 0) + Math.round(s.elapsedSeconds / 60));
    }
    const ordered = [...map.entries()]
      .map(([id, minutes]) => ({
        id,
        minutes,
        name: id === "_free" ? "Serbest" : courseMap[id]?.name ?? "Ders",
        color: id === "_free" ? "var(--accent)" : courseMap[id]?.color ?? "var(--accent)",
      }))
      .sort((a, b) => b.minutes - a.minutes);
    const main = ordered.slice(0, 5);
    const otherMinutes = ordered.slice(5).reduce((sum, course) => sum + course.minutes, 0);
    return otherMinutes > 0
      ? [...main, { id: "_other", minutes: otherMinutes, name: "Diğer dersler", color: "var(--muted)" }]
      : main;
  }, [sessions, courseMap, period, now]);

  const periodTotal = byCourse.reduce((a, c) => a + c.minutes, 0);
  const maxHeat = Math.max(1, ...weeks.flatMap((w) => w.days.map((d) => Math.max(0, d.minutes))));
  const heatCells = weeks.flatMap((w) => w.days);
  const heatTotal = heatCells.reduce((a, d) => a + Math.max(0, d.minutes), 0);
  const heatActive = heatCells.filter((d) => d.minutes > 0).length;
  const weekdayLabels = ["Pzt", "", "Çar", "", "Cum", "", ""];

  return (
    <div className="flex flex-col gap-5">
      {/* Özet */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <SummaryCard icon="stopwatch" label="Bu hafta" value={minutesToLabel(weekTotal)} tone="accent" />
        <SummaryCard icon="line-chart" label="Son 30 gün" value={minutesToLabel(monthTotal)} tone="default" />
        <SummaryCard icon="streak" label="Aktif gün serisi" value={`${streak} gün`} tone="warning" />
        <SummaryCard icon="check-circle" label="Bu hafta biten görev" value={`${tasksThisWeek}`} tone="success" />
      </div>


      <div className="grid gap-5 lg:grid-cols-3">
        {/* Haftalık grafik */}
        <Card className="lg:col-span-2">
          <CardHeader
            icon={<Icon name="bar-chart" size={18} />}
            title="Haftalık odak dağılımı"
            subtitle={`Günde ortalama ${minutesToLabel(Math.round(weekTotal / 7))}`}
          />
          <CardBody>
            {weekTotal === 0 ? (
              <div className="grid h-40 md:h-56 place-items-center text-center text-sm text-muted">Bu hafta henüz odak kaydı yok.</div>
            ) : <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={week} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 5" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} width={42} allowDecimals={false} />
                  <RTooltip
                    cursor={{ fill: "var(--line)", opacity: 0.4 }}
                    {...TOOLTIP_STYLE}
                    formatter={(v) => [`${v} dk odak`, ""]}
                    labelFormatter={(l) => `${l} günü`}
                  />
                  <Bar dataKey="minutes" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                    {week.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.date === startOfDay(now) ? "var(--accent-2)" : "var(--accent)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>}
          </CardBody>
        </Card>

        {/* Haftalık hedef */}
        <Card>
          <CardHeader icon={<Icon name="target" size={18} />} title="Haftalık hedef" />
          <CardBody className="flex flex-col items-center gap-4 pt-2">
            <ProgressRing value={weeklyGoalPct} size={148} stroke={12}>
              <div className="text-center">
                <div className="text-3xl font-bold text-content">%{weeklyGoalPct}</div>
                <div className="text-[11px] text-muted">tamamlandı</div>
              </div>
            </ProgressRing>
            <div className="w-full flex items-center justify-between text-sm">
              <span className="text-muted">Bu hafta</span>
              <span className="font-semibold text-content">
                {minutesToLabel(weekTotal)} / {Math.round(settings.weeklyGoalMinutes / 60)} sa
              </span>
            </div>
            <div className="w-full flex items-center justify-between text-sm">
              <span className="text-muted">Aktif gün ortalaması</span>
              <span className="font-semibold text-content">{minutesToLabel(avgPerActive)}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Ders dağılımı + dönem geçişi */}
        <Card>
          <CardHeader
            icon={<Icon name="pie-chart" size={18} />}
            title="Derslere göre çalışma"
            subtitle={`${PERIODS.find((p) => p.key === period)?.label} toplam ${minutesToLabel(periodTotal)}`}
          />
          <CardBody className="pt-1">
            <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl border border-line bg-bg2/50 p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  aria-pressed={period === p.key}
                  className={cn(
                    "min-h-9 rounded-lg px-1 text-xs font-medium transition-colors",
                    period === p.key ? "bg-surface text-content shadow-sm" : "text-muted hover:text-content",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {byCourse.length === 0 ? (
              <div className="grid min-h-[140px] md:min-h-[220px] place-items-center text-center text-sm text-muted">
                <div><Icon name="pie-chart" size={26} className="mx-auto mb-2 opacity-60" />Bu dönemde odak kaydı yok.</div>
              </div>
            ) : (
              <div className="grid items-center gap-3 sm:grid-cols-[minmax(170px,0.9fr)_minmax(0,1.1fr)]">
                <div className="relative mx-auto h-[220px] w-full max-w-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byCourse} dataKey="minutes" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="none" isAnimationActive={false}>
                        {byCourse.map((course) => <Cell key={course.id} fill={course.color} />)}
                      </Pie>
                      <RTooltip {...TOOLTIP_STYLE} formatter={(value) => [`${minutesToLabel(Number(value))}`, "Odak"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase tracking-wider text-muted">Toplam</span>
                    <span className="mt-1 text-lg font-bold tabular-nums text-content">{minutesToLabel(periodTotal)}</span>
                  </div>
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  {byCourse.map((course) => (
                    <div key={course.id} className="flex min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-bg2/50">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: course.color }} />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-content">{course.name}</span>
                      <span className="shrink-0 text-xs font-medium tabular-nums text-muted">{minutesToLabel(course.minutes)}</span>
                      <span className="w-10 shrink-0 text-right text-[10px] tabular-nums text-muted">%{Math.round((course.minutes / Math.max(1, periodTotal)) * 100)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Görev durumu */}
        <Card>
          <CardHeader icon={<Icon name="progress" size={18} />} title="Görev durumu" />
          <CardBody className="pt-1">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "Yapılacak", value: tasks.filter((t) => t.status === "todo").length, icon: "box", tone: "text-muted" },
                { label: "Devam ediyor", value: tasks.filter((t) => t.status === "doing").length, icon: "progress-circle", tone: "text-accent" },
                { label: "Tamamlandı", value: doneTasks.length, icon: "check-circle", tone: "text-success" },
              ].map((s) => (
                <div key={s.label} className="min-w-0 rounded-2xl border border-line bg-bg2/40 p-2.5 sm:p-4 text-center">
                  <Icon name={s.icon} size={22} className={cn("mx-auto", s.tone)} />
                  <p className="mt-2 text-2xl font-bold text-content tabular-nums">{s.value}</p>
                  <p className="break-words text-[10px] leading-tight text-muted mt-0.5 sm:text-[11px]">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm text-muted">Genel tamamlanma</span>
                <span className="text-sm font-semibold text-accent">
                  %{tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-line/70">
                <div
                  className="h-full rounded-full accent-gradient"
                  style={{ width: `${tasks.length ? (doneTasks.length / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Isı haritası */}
      <Card>
        <CardHeader
          icon={<Icon name="dashboard" size={18} />}
          title="Çalışma ısı haritası"
          subtitle={`Son 6 ay · ${Math.round(heatTotal / 60)} saat · ${heatActive} aktif gün`}
        />
        <CardBody>
          <div className="overflow-x-auto no-scrollbar pb-1">
            <p className="mb-2 text-[11px] text-muted sm:hidden">Isı haritasını yana kaydırabilirsin.</p>
            <div
              className="grid min-w-[360px] gap-1 sm:min-w-[620px]"
              style={{
                gridTemplateColumns: `2rem repeat(${weeks.length}, minmax(0, 1fr))`,
                gridTemplateRows: `1.15rem repeat(7, auto)`,
              }}
            >
              {/* Ay etiketleri */}
              {weeks.map((w, i) => {
                const m = new Date(w.days[0].date).getMonth();
                const prev = i > 0 ? new Date(weeks[i - 1].days[0].date).getMonth() : -1;
                const show = i === 0 || m !== prev;
                return (
                  <span
                    key={`m-${i}`}
                    className="whitespace-nowrap text-[11px] leading-none text-muted"
                    style={{ gridColumn: i + 2, gridRow: 1 }}
                  >
                    {show ? fmt(w.days[0].date, "MMM") : ""}
                  </span>
                );
              })}

              {/* Gün etiketleri */}
              {weekdayLabels.map((l, r) => (
                <span
                  key={`w-${r}`}
                  className="flex items-center text-[11px] leading-none text-muted"
                  style={{ gridColumn: 1, gridRow: r + 2 }}
                >
                  {l}
                </span>
              ))}

              {/* Kareler */}
              {weeks.map((w, wi) =>
                w.days.map((c, di) => {
                  if (c.minutes < 0) {
                    return <div key={`${wi}-${di}`} style={{ gridColumn: wi + 2, gridRow: di + 2 }} />;
                  }
                  const level = c.minutes === 0 ? 0 : Math.min(4, Math.ceil((c.minutes / maxHeat) * 4));
                  const bg =
                    level === 0
                      ? "color-mix(in srgb, var(--muted) 15%, transparent)"
                      : `color-mix(in srgb, var(--accent) ${level * 25}%, transparent)`;
                  const isToday = c.date === startOfDay(now);
                  return (
                    <div
                      key={`${wi}-${di}`}
                      className={cn(
                        "box-border aspect-square w-full rounded-[5px] transition-colors hover:brightness-125",
                        isToday && "border-2 border-accent",
                      )}
                      style={{
                        gridColumn: wi + 2,
                        gridRow: di + 2,
                        background: isToday
                          ? `color-mix(in srgb, var(--accent) 18%, transparent)`
                          : bg,
                      }}
                      title={`${fmt(c.date, "d MMMM yyyy, EEEE")} — ${c.minutes} dk`}
                    />
                  );
                }),
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-muted">
            <span>Az</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <span
                key={l}
                className="h-4 w-4 rounded-[4px]"
                style={{
                  background:
                    l === 0
                      ? "color-mix(in srgb, var(--muted) 15%, transparent)"
                      : `color-mix(in srgb, var(--accent) ${l * 25}%, transparent)`,
                }}
              />
            ))}
            <span>Çok</span>
            <span className="ml-auto inline-flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded-[4px] ring-1 ring-accent" /> Bugün
            </span>
          </div>

          <p className="mt-3 text-[12px] text-muted leading-relaxed">
            <Icon name="info" size={13} className="inline -mt-0.5 mr-1" />
            Her kare bir günü gösterir; renk koyulaştıkça o gün daha çok odaklandın. İmleci bir karenin üzerine
            getirince o günün toplam süresini görürsün.
          </p>
        </CardBody>
      </Card>

    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  tone: "accent" | "warning" | "success" | "default";
}) {
  const tones = {
    accent: "text-accent bg-accentsoft",
    warning: "text-warning bg-warning/12",
    success: "text-success bg-success/12",
    default: "text-content bg-line/50",
  } as const;
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)]">
      <div className={cn("grid h-10 w-10 place-items-center rounded-xl", tones[tone])}>
        <Icon name={icon} size={20} />
      </div>
      <p className="mt-3 text-lg font-bold text-content">{value}</p>
      <p className="text-[11px] text-muted mt-0.5">{label}</p>
    </div>
  );
}
