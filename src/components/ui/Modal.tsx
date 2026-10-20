import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "../icons";
import { cn } from "../../lib/cn";

export interface ModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

export function Modal({ open, onOpenChange, title, description, children, footer, size = "md", className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
            "data-[state=open]:animate-fade-in",
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-line bg-elevated shadow-[var(--shadow)] outline-none",
            "data-[state=open]:animate-pop",
            SIZES[size],
            className,
          )}
        >
          {title && (
            <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-2">
              <div className="min-w-0">
                <Dialog.Title className="text-base font-semibold text-content">{title}</Dialog.Title>
                {description && (
                  <Dialog.Description className="text-xs text-muted mt-0.5">{description}</Dialog.Description>
                )}
              </div>
              <Dialog.Close asChild>
                <button
                  className="h-8 w-8 -mr-1 -mt-1 grid place-items-center rounded-lg text-muted hover:text-content hover:bg-line/60 transition-colors"
                  aria-label="Kapat"
                >
                  <Icon name="close" size={18} />
                </button>
              </Dialog.Close>
            </div>
          )}
          <div className="px-5 py-3">{children}</div>
          {footer && <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-2">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
