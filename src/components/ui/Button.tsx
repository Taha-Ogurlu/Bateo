import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type ButtonVariant = "primary" | "soft" | "ghost" | "outline" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "accent-gradient text-[var(--accent-fg)] shadow-[var(--shadow)] hover:brightness-110 active:brightness-95",
  soft: "bg-accentsoft text-accent hover:bg-accentsoft/70",
  ghost: "text-content hover:bg-line/60",
  outline: "border border-line bg-surface text-content hover:bg-line/40",
  danger: "bg-danger/90 text-white hover:bg-danger",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-[15px] rounded-xl gap-2",
  icon: "h-10 w-10 rounded-xl justify-center",
  "icon-sm": "h-8 w-8 rounded-lg justify-center",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center font-medium select-none whitespace-nowrap",
        "transition-[background-color,color,box-shadow,filter,transform] duration-150",
        "focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
});
