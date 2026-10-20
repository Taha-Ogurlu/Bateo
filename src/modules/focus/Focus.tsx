import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { useSettings } from "../../hooks/useSettings";
import { startOfDay, todayFocusMinutes } from "../../lib/stats";
import { minutesToLabel, fmt } from "../../lib/date";
import { cn } from "../../lib/cn";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Controls";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { ProgressRing } from "../../components/ui/misc";
import { Icon } from "../../components/icons";
import { useFocusTimer } from "../../store/focusTimer";
import type { FocusKind } from "../../types";
import { useNow } from "../../hooks/useNow";

const DAY = 86400000;

const MODE_META: Record<FocusKind, { label: string; icon: string }> = {
  work: { label: "Çalışma", icon: "focus" },
  break: { label: "Mola", icon: "break" },
};

export function Focus() {
  const now = useNow();
  const settings = useSettings();
  const courses = useLiveQuery(() => db.courses.toArray(), [], []);
  const sessions = useLiveQuery(() => db.focusSessions.toArray(), [], []);

  const mode = useFocusTimer((state) => state.mode);
  const running = useFocusTimer((state) => state.running);
  const round = useFocusTimer((state) => state.round);
  const courseId = useFocusTimer((state) => state.courseId);
  const secondsLeft = useFocusTimer((state) => state.secondsLeft);
  const durationSec = useFocusTimer((state) => state.durationSec);
  const setMode = useFocusTimer((state) => state.setMode);
  const toggle = useFocusTimer((state) => state.toggle);
  const reset = useFocusTimer((state) => state.reset);
  const setCourseId = useFocusTimer((state) => state.setCourseId);

  const work = settings.pomodoroWork;
  const brk = settings.pomodoroShortBreak;
  const courseMap = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses]);
  const todayMinutes = todayFocusMinutes(sessions, now);
  const todayCount = sessions.filter(
    (s) => s.kind === "work" && s.completed && new Date(s.startedAt).toDateString() === new Date(now).toDateString(),
  ).length;

  // Geçmiş: son 14 gün, gün gün + ders ders
  const history = useMemo(() => {
    const today = startOfDay(now);
    const out: {
      day: number;
      minutes: number;
      count: number;
      courses: { name: string; color: string; minutes: number }[];
    }[] = [];
    for (let i = 0; i < 14; i++) {
      const day = today - i * DAY;
      const ds = sessions.filter((s) => s.completed && s.kind === "work" && startOfDay(s.startedAt) === day);
      if (ds.length === 0) continue;
      const byCourse = new Map<string, number>();
      for (const s of ds) {
        const key = s.courseId ?? "_free";
        byCourse.set(key, (byCourse.get(key) ?? 0) + Math.round(s.elapsedSeconds / 60));
      }
      out.push({
        day,
        minutes: ds.reduce((a, s) => a + Math.round(s.elapsedSeconds / 60), 0),
        count: ds.length,
        courses: [...byCourse]
          .map(([id, m]) => ({
            name: id === "_free" ? "Serbest" : courseMap[id]?.name ?? "Ders",
            color: id === "_free" ? "var(--accent)" : courseMap[id]?.color ?? "var(--accent)",
            minutes: m,
          }))
          .sort((a, b) => b.minutes - a.minutes),
      });
    }
    return out;
  }, [sessions, courseMap, now]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const progress = durationSec > 0 ? ((durationSec - secondsLeft) / durationSec) * 100 : 0;
  const isWork = mode === "work";

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-5">
        {/* Zamanlayıcı */}
        <Card className="relative overflow-hidden">
          <div
            className={cn(
              "absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl opacity-20",
              isWork ? "accent-gradient" : "bg-success",
            )}
          />
          <div className="relative flex flex-col items-center gap-5 px-6 py-8">
            {/* Mod seçici */}
            <div className="inline-flex items-center gap-1 rounded-xl border border-line bg-bg2/60 p-1">
              {(["work", "break"] as FocusKind[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(
                    m,
                    (m === "work"
                      ? work
                      : round > 0 && round % settings.pomodoroRounds === 0
                        ? settings.pomodoroLongBreak
                        : brk) * 60,
                  )}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-4 h-9 text-[13px] font-medium transition-colors",
                    mode === m ? "bg-surface text-content shadow-sm" : "text-muted hover:text-content",
                  )}
                >
                  <Icon name={MODE_META[m].icon} size={16} /> {MODE_META[m].label}
                </button>
              ))}
            </div>

            <ProgressRing value={progress} size={254} stroke={14}>
              <div className="text-center">
                <div className="text-6xl font-bold tabular-nums text-content tracking-tight">
                  {mm}:{ss}
                </div>
                <div className="mt-2 text-sm text-muted">
                  {isWork ? "Odaklanma seansı" : "Dinlenme zamanı"} · Tur {round + 1}
                </div>
              </div>
            </ProgressRing>

            <p className="text-sm text-muted">Süre: {isWork ? work : brk} dakika · Ayarlardan değiştirilebilir</p>

            <div className="flex items-center gap-3">
              <Button size="lg" onClick={toggle} className="gap-2 min-w-[150px] justify-center">
                <Icon name={running ? "pause" : "pomodoro"} size={19} />
                {running ? "Duraklat" : secondsLeft < durationSec ? "Devam et" : "Başlat"}
              </Button>
              <Button size="lg" variant="outline" onClick={reset} className="gap-2">
                <Icon name="repeat" size={19} /> Sıfırla
              </Button>
            </div>

            {isWork && (
              <div className="w-full max-w-xs">
                <Select
                  value={courseId || undefined}
                  onValueChange={setCourseId}
                  placeholder="Hangi derse çalışıyorsun? (isteğe bağlı)"
                  options={courses.map((c) => ({ value: c.id, label: c.name }))}
                />
              </div>
            )}
          </div>
        </Card>

      </div>

      {/* Sağ */}
      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader icon={<Icon name="target" size={18} />} title="Günlük hedef" subtitle={`${todayCount} seans bugün`} />
          <CardBody className="pt-1">
            <div className="flex items-center justify-center py-2">
              <ProgressRing
                value={Math.min(100, (todayMinutes / Math.max(1, settings.dailyGoalMinutes)) * 100)}
                size={148}
                stroke={12}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-content">{todayMinutes}</div>
                  <div className="text-[11px] text-muted">/ {settings.dailyGoalMinutes} dk</div>
                </div>
              </ProgressRing>
            </div>
            <p className="mt-2 text-center text-[13px] text-muted">
              {todayMinutes >= settings.dailyGoalMinutes
                ? "Hedefi tamamladın, harikasın! 🎉"
                : `Hedefe ${minutesToLabel(Math.max(0, settings.dailyGoalMinutes - todayMinutes))} kaldı.`}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-start gap-3.5 py-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accentsoft text-accent">
              <Icon name="idea" size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-content">Odak ipucu</p>
              <p className="text-[13px] text-muted mt-0.5 leading-relaxed">
                Bildirimleri kapat, telefonu uzağa koy. 25 dakikalık bloklar hâlinde çalışmak kalıcı
                öğrenmeyi artırır.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Odak geçmişi sağ sütundaki alanı tamamlar */}
        <Card className="flex-1">
          <CardHeader
            icon={<Icon name="calendar-week" size={18} />}
            title="Odak geçmişi"
            subtitle="Son 14 gün · hangi gün ne kadar, neye çalıştın"
          />
          <CardBody className="pt-0">
            {history.length === 0 ? (
              <div className="grid min-h-[180px] place-items-center text-center">
                <p className="text-sm text-muted">Henüz kayıt yok.<br />İlk seansını tamamla!</p>
              </div>
            ) : (
              <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto pr-1">
                {history.map((d) => {
                  const isToday = d.day === startOfDay(now);
                  return (
                    <div key={d.day} className="rounded-xl border border-line bg-bg2/40 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-content">
                          {isToday ? "Bugün" : fmt(d.day, "d MMM, EEEE")}
                        </span>
                        <span className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold text-accent">
                          <Icon name="stopwatch" size={13} /> {minutesToLabel(d.minutes)}
                        </span>
                        <span className="text-[11px] text-muted">· {d.count} seans</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {d.courses.map((c) => (
                          <span
                            key={c.name}
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px]"
                            style={{ background: `color-mix(in srgb, ${c.color} 18%, transparent)`, color: c.color }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                            {c.name} · {c.minutes} dk
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

      </div>

    </div>
  );
}

