import type { ReactNode } from "react";
import { Icon } from "../icons";
import { cn } from "../../lib/cn";

/* ---------------- Progress ---------------- */
export function Progress({ value, className, tone }: { value: number; className?: string; tone?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-line/70", className)}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: tone ?? "linear-gradient(90deg, var(--accent), var(--accent-2))",
        }}
      />
    </div>
  );
}

/* ---------------- Progress Ring ---------------- */
export function ProgressRing({
  value,
  size = 84,
  stroke = 8,
  children,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;
  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/* ---------------- Section Title ---------------- */
export function SectionTitle({ children, icon, action }: { children: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon && <span className="text-accent">{icon}</span>}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{children}</h2>
      <div className="ml-auto">{action}</div>
    </div>
  );
}

/* ---------------- Empty State ---------------- */
export function EmptyState({
  icon = "note",
  title,
  hint,
  action,
}: {
  icon?: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line py-14 px-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accentsoft text-accent">
        <Icon name={icon} size={26} />
      </div>
      <div>
        <p className="text-sm font-semibold text-content">{title}</p>
        {hint && <p className="text-xs text-muted mt-1 max-w-xs">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------- Kbd ---------------- */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line bg-bg2 px-1.5 text-[10px] font-medium text-muted">
      {children}
    </kbd>
  );
}
