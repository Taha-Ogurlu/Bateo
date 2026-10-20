import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Koşullu + birleştirilmiş Tailwind sınıfları */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
