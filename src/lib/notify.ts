import { Capacitor } from "@capacitor/core";

/**
 * Birleşik bildirim katmanı (v3)
 * - Masaüstü/tarayıcı: Web Notification API
 * - Android (Capacitor): LocalNotifications (uygulama kapalıyken de çalışır)
 * Eklenti tembel yüklenir.
 */

export type PermState = "granted" | "denied" | "prompt" | "unsupported";

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function notificationsSupported(): boolean {
  return isNative() || (typeof window !== "undefined" && "Notification" in window);
}

async function localNotifications() {
  return (await import("@capacitor/local-notifications")).LocalNotifications;
}

export async function getPermission(): Promise<PermState> {
  if (isNative()) {
    try {
      const LN = await localNotifications();
      const r = await LN.checkPermissions();
      return r.display === "granted" ? "granted" : "prompt";
    } catch {
      return "unsupported";
    }
  }
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as PermState;
}

export async function requestPermission(): Promise<boolean> {
  if (isNative()) {
    try {
      const LN = await localNotifications();
      const r = await LN.requestPermissions();
      return r.display === "granted";
    } catch {
      return false;
    }
  }
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

function nextId(): number {
  return Math.floor(Date.now() % 100000) + Math.floor(Math.random() * 1000);
}

/** Hemen bildirim göster */
export async function notifyNow(title: string, body: string): Promise<void> {
  if (isNative()) {
    try {
      const LN = await localNotifications();
      await LN.schedule({ notifications: [{ id: nextId(), title, body }] });
    } catch {
      /* yoksay */
    }
    return;
  }
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "./favicon.svg" });
    }
  } catch {
    /* yoksay */
  }
}

/** Gelecekte bir bildirim planla (yalnızca native; web'de uygulama açıkken kontrol edilir) */
export async function scheduleAt(id: number, title: string, body: string, at: number): Promise<void> {
  if (!isNative() || at <= Date.now()) return;
  try {
    const LN = await localNotifications();
    await LN.schedule({
      notifications: [{ id, title, body, schedule: { at: new Date(at), allowWhileIdle: true } }],
    });
  } catch {
    /* yoksay */
  }
}

export async function cancelScheduled(ids: number[]): Promise<void> {
  if (!isNative() || ids.length === 0) return;
  try {
    const LN = await localNotifications();
    await LN.cancel({ notifications: ids.map((id) => ({ id })) });
  } catch {
    /* yoksay */
  }
}
