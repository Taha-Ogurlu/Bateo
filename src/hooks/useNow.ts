import { useEffect, useState } from "react";

/** Belirli aralıkla güncellenen "şimdi" değeri (geri sayımlar için) */
export function useNow(intervalMs = 60000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}
