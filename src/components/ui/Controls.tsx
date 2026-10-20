import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Icon } from "../icons";
import { cn } from "../../lib/cn";

/* ---------------- Switch ---------------- */
export function Switch({
  checked,
  onCheckedChange,
  className,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border border-line transition-colors duration-200",
        "data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=unchecked]:bg-line/70",
        "focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--accent-soft)]",
        className,
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "block h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform duration-200",
          "data-[state=checked]:translate-x-[20px] data-[state=unchecked]:translate-x-[3px]",
        )}
        style={{ height: 18, width: 18 }}
      />
    </SwitchPrimitive.Root>
  );
}

/* ---------------- Checkbox ---------------- */
export function Checkbox({
  checked,
  onCheckedChange,
  className,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      onCheckedChange={(v) => onCheckedChange(!!v)}
      className={cn(
        "h-5 w-5 shrink-0 grid place-items-center rounded-md border border-line transition-colors duration-150",
        "data-[state=checked]:bg-accent data-[state=checked]:border-accent text-[var(--accent-fg)]",
        "hover:border-accent focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--accent-soft)]",
        className,
      )}
    >
      <CheckboxPrimitive.Indicator>
        <Icon name="check" size={14} strokeWidth={2.5} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

/* ---------------- Slider ---------------- */
export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: {
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <SliderPrimitive.Root
      value={[value]}
      onValueChange={(v) => onValueChange(v[0])}
      min={min}
      max={max}
      step={step}
      className={cn("relative flex h-5 w-full touch-none select-none items-center", className)}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-line">
        <SliderPrimitive.Range className="absolute h-full rounded-full accent-gradient" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4.5 w-4.5 rounded-full border-2 border-accent bg-elevated shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--accent-soft)]" style={{ height: 18, width: 18 }} />
    </SliderPrimitive.Root>
  );
}

/* ---------------- Select ---------------- */
export interface SelectOption {
  value: string;
  label: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Seç…",
  className,
}: {
  value?: string;
  onValueChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        className={cn(
          "inline-flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-line bg-bg2/60 px-3.5 text-sm text-content",
          "hover:border-accent/60 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)] outline-none transition",
          "data-[placeholder]:text-muted",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <Icon name="chevron-down" size={16} className="text-muted" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-line bg-elevated shadow-[var(--shadow)] data-[state=open]:animate-pop"
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o.value}
                value={o.value}
                className="relative flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm text-content outline-none data-[highlighted]:bg-accentsoft data-[highlighted]:text-accent"
              >
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="ml-auto text-accent">
                  <Icon name="check" size={15} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
