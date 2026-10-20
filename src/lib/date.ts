import { format, formatDistanceToNowStrict, isToday, isTomorrow, differenceInCalendarDays } from "date-fns";
import { tr } from "date-fns/locale";

export const TR_LOCALE = tr;

export function fmt(date: Date | number | string, pattern = "d MMMM yyyy"): string {
  return format(new Date(date), pattern, { locale: tr });
}

/** Timestamp'i HTML date input'unun yerel YYYY-MM-DD değeri olarak gösterir. */
export function toDateInputValue(timestamp?: number | null): string {
  if (timestamp == null) return "";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** HTML date input değerini yerel saat diliminde timestamp'e çevirir. */
export function fromDateInputValue(value: string, time = "00:00"): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T${time}:00`);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

export function relative(date: Date | number | string): string {
  return formatDistanceToNowStrict(new Date(date), { locale: tr, addSuffix: true });
}

/** İnsan dostu teslim tarihi: Bugün / Yarın / 3 gün kaldı / 2 gün geçti */
export function dueLabel(date: Date | number | string): string {
  const d = new Date(date);
  if (isToday(d)) return "Bugün";
  if (isTomorrow(d)) return "Yarın";
  const diff = differenceInCalendarDays(d, new Date());
  if (diff > 1) return `${diff} gün kaldı`;
  if (diff < 0) return `${Math.abs(diff)} gün geçti`;
  return fmt(d, "d MMM");
}

export function isOverdue(date?: Date | number | string | null): boolean {
  if (!date) return false;
  return differenceInCalendarDays(new Date(), new Date(date)) > 0;
}

export const WEEKDAYS_TR = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
export const WEEKDAYS_SHORT_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

/** JS 0=Pazar döner; bizde 0=Pazartesi olsun */
export function toMondayIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h && m) return `${h} sa ${m} dk`;
  if (h) return `${h} saat`;
  return `${m} dk`;
}
