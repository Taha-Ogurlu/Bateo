import { useState, type InputHTMLAttributes } from "react";
import { Icon } from "../icons";
import { cn } from "../../lib/cn";

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Sol taraftaki ikon (varsayılan: kilit) */
  icon?: string | null;
}

/** Şifre alanı — sağda göz (👁) ile göster/gizle */
export function PasswordInput({ className, icon = "lock", ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={cn(
        "flex h-11 items-center gap-2.5 rounded-xl border border-line bg-bg2/50 px-3.5 transition-colors",
        "focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft)]",
        className,
      )}
    >
      {icon && <Icon name={icon} size={17} className="shrink-0 text-muted" />}
      <input
        {...props}
        type={visible ? "text" : "password"}
        className="min-w-0 flex-1 bg-transparent text-sm text-content outline-none placeholder:text-muted/60"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:text-content hover:bg-line/50"
        aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
        title={visible ? "Şifreyi gizle" : "Şifreyi göster"}
        tabIndex={-1}
      >
        <Icon name={visible ? "eye-off" : "eye"} size={17} />
      </button>
    </div>
  );
}
