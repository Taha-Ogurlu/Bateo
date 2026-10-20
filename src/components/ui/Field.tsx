import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const base =
  "w-full rounded-xl border border-line bg-bg2/60 text-content placeholder:text-muted/70 " +
  "outline-none transition-[border-color,box-shadow,background-color] duration-150 " +
  "focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(base, "h-10 px-3.5 text-sm", className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(base, "px-3.5 py-2.5 text-sm resize-y min-h-20", className)} {...props} />;
  },
);

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-xs font-medium text-muted mb-1.5 tracking-wide", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label?: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label && <Label>{label}</Label>}
      {children}
      {hint && <p className="mt-1.5 text-[11px] text-muted/80">{hint}</p>}
    </div>
  );
}
