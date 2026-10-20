import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Tone = "default" | "accent" | "success" | "warning" | "danger" | "muted";

const TONES: Record<Tone, string> = {
  default: "bg-line/60 text-content",
  accent: "bg-accentsoft text-accent",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  muted: "bg-line/40 text-muted",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-5",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
