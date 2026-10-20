import { useEffect, useState, type ReactNode } from "react";
import { updateSettings } from "../../db/db";
import { useSettings } from "../../hooks/useSettings";
import {
  getPermission,
  notificationsSupported,
  notifyNow,
  requestPermission,
  type PermState,
} from "../../lib/notify";
import { Switch, Select } from "../../components/ui/Controls";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/icons";

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 - 23:00

export function NotificationsCard() {
  const settings = useSettings();
  const [perm, setPerm] = useState<PermState>("prompt");
  const [busy, setBusy] = useState(false);
  const supported = notificationsSupported();

  useEffect(() => {
    void getPermission().then(setPerm);
  }, []);

  const ask = async () => {
    setBusy(true);
    const ok = await requestPermission();
    setPerm(await getPermission());
    if (ok) await notifyNow("Bildirimler açık ✅", "BATEO seni zamanında hatırlatacak.");
    setBusy(false);
  };

  const permLabel: Record<PermState, string> = {
    granted: "İzin verildi",
    denied: "İzin reddedildi",
    prompt: "İzin gerekli",
    unsupported: "Desteklenmiyor",
  };

  return (
    <div className="flex flex-col gap-5">
      {!supported && (
        <p className="rounded-xl border border-line bg-bg2/40 p-3 text-[12px] text-muted">
          Bu ortamda sistem bildirimleri desteklenmiyor. Masaüstü uygulaması ve telefonda çalışır.
        </p>
      )}

      {/* İzin durumu */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-line bg-bg2/40 p-3.5">
        <Icon
          name={perm === "granted" ? "check-circle" : "bell"}
          size={18}
          className={perm === "granted" ? "text-success" : "text-accent"}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-content">{permLabel[perm]}</p>
          <p className="text-[11px] text-muted">Hatırlatıcıların çalışması için bildirim izni gerekli.</p>
        </div>
        {perm !== "granted" && supported && (
          <Button onClick={ask} disabled={busy} className="gap-2">
            <Icon name="bell" size={16} /> {busy ? "İsteniyor…" : "İzin ver"}
          </Button>
        )}
        {perm === "granted" && (
          <Button variant="outline" onClick={() => void notifyNow("BATEO test 🔔", "Bildirimler çalışıyor!")} className="gap-2">
            <Icon name="bell" size={16} /> Test bildirimi
          </Button>
        )}
      </div>

      {/* Anahtarlar */}
      <div className="flex flex-col gap-4">
        <Row
          title="Görev hatırlatıcı"
          desc={`Her gün ${String(settings.reminderHour).padStart(2, "0")}:00'da o günün görevlerini özetler`}
        >
          <Switch
            checked={settings.notifyTasks}
            onCheckedChange={(v) => updateSettings({ notifyTasks: v })}
          />
        </Row>
        <Row title="Sınav hatırlatıcı" desc="Sınavdan 7 gün ve 1 gün önce haber verir">
          <Switch checked={settings.notifyExams} onCheckedChange={(v) => updateSettings({ notifyExams: v })} />
        </Row>
        <Row title="Odak (Pomodoro) bildirimi" desc="Seans ve mola bitince bildirim gönderir">
          <Switch
            checked={settings.notifyPomodoro}
            onCheckedChange={(v) => updateSettings({ notifyPomodoro: v })}
          />
        </Row>

        <div className="grid grid-cols-2 items-center gap-4">
          <div>
            <p className="text-sm font-medium text-content">Hatırlatma saati</p>
            <p className="text-[12px] text-muted">Günlük görev özetinin gönderileceği saat</p>
          </div>
          <Select
            value={String(settings.reminderHour)}
            onValueChange={(v) => updateSettings({ reminderHour: Number(v) })}
            options={HOURS.map((h) => ({ value: String(h), label: `${String(h).padStart(2, "0")}:00` }))}
          />
        </div>
      </div>
    </div>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-content">{title}</p>
        <p className="text-[12px] text-muted">{desc}</p>
      </div>
      {children}
    </div>
  );
}
