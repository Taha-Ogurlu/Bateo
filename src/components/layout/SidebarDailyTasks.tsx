import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { db } from "../../db/db";
import { startOfDay } from "../../lib/stats";
import { cn } from "../../lib/cn";
import { Icon } from "../icons";
import { useNow } from "../../hooks/useNow";

const DAY = 86400000;

export function SidebarDailyTasks({ collapsed }: { collapsed: boolean }) {
  const now = useNow();
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []);
  const today = startOfDay(now);
  const endOfToday = today + DAY;
  const dueTasks = tasks
    .filter((task) => task.status !== "done" && task.dueDate != null && task.dueDate < endOfToday)
    .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));

  if (collapsed) {
    return (
      <Link
        to="/gorevler"
        title={`Bugünün görevleri${dueTasks.length ? ` · ${dueTasks.length} açık` : ""}`}
        aria-label={`Bugünün görevleri, ${dueTasks.length} açık görev`}
        className="relative grid h-12 place-items-center overflow-visible rounded-xl border border-line bg-bg2/55 text-accent transition-colors hover:bg-accentsoft"
      >
        <Icon name="calendar-today" size={19} />
        <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-[var(--accent-fg)]">
          {dueTasks.length}
        </span>
      </Link>
    );
  }

  return (
    <section
      className="flex min-h-[150px] flex-1 flex-col rounded-xl border border-line bg-bg2/55 p-3"
      aria-label="Bugünün görevleri"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xs font-semibold text-content">
          <Icon name="calendar-today" size={15} className="text-accent" /> Bugün
        </h2>
        <Link to="/gorevler" className="text-[10px] font-medium text-muted hover:text-accent">
          Tümü
        </Link>
      </div>
      {dueTasks.length ? (
        <div className="flex flex-col gap-1">
          {dueTasks.slice(0, 4).map((task) => {
            const overdue = (task.dueDate ?? endOfToday) < today;
            return (
              <Link
                key={task.id}
                to={`/gorevler?id=${encodeURIComponent(task.id)}`}
                title={task.title}
                className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-line/50"
              >
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", overdue ? "bg-danger" : task.status === "doing" ? "bg-accent" : "bg-muted")} />
                <span className="min-w-0 flex-1 truncate text-[11px] text-content">{task.title}</span>
                {overdue && <span className="shrink-0 text-[9px] text-danger">geçti</span>}
              </Link>
            );
          })}
          {dueTasks.length > 4 && (
            <Link to="/gorevler" className="px-1.5 pt-0.5 text-[10px] text-muted hover:text-accent">
              +{dueTasks.length - 4} görev daha
            </Link>
          )}
        </div>
      ) : (
        <p className="grid min-h-16 flex-1 place-items-center rounded-lg border border-dashed border-line px-2 py-3 text-center text-[10px] text-muted">
          Bugün için görev yok
        </p>
      )}
    </section>
  );
}
