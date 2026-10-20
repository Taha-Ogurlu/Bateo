import { useState } from "react";
import { DEFAULT_SETTINGS, updateSettings } from "../../db/db";
import { useSettings } from "../../hooks/useSettings";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select, Slider } from "../../components/ui/Controls";
import { Icon } from "../../components/icons";
import { Logo } from "../../components/layout/Logo";
import { AccountCard } from "./AccountCard";
import { BackupCard } from "./BackupCard";
import { NotificationsCard } from "./NotificationsCard";
import { ThemeGallery } from "./ThemeGallery";

export function SettingsPage() {
  const settings = useSettings();
  const [message, setMessage] = useState<string | null>(null);

  const update = (patch: Partial<typeof settings>) => void updateSettings(patch);

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader icon={<Icon name="gear" size={18} />} title="Temalar" subtitle="Renk, yazı tipi ve atmosfer" />
        <CardBody><ThemeGallery /></CardBody>
      </Card>

      <Card>
        <CardHeader icon={<Icon name="pomodoro" size={18} />} title="Odak zamanlayıcı" subtitle="Pomodoro süreleri" />
        <CardBody className="flex flex-col gap-5">
          <SliderRow label="Çalışma süresi" value={settings.pomodoroWork} min={5} max={90} step={5} unit="dk" onChange={(v) => update({ pomodoroWork: v })} />
          <SliderRow label="Kısa mola" value={settings.pomodoroShortBreak} min={1} max={30} step={1} unit="dk" onChange={(v) => update({ pomodoroShortBreak: v })} />
          <SliderRow label="Uzun mola" value={settings.pomodoroLongBreak} min={5} max={45} step={5} unit="dk" onChange={(v) => update({ pomodoroLongBreak: v })} />
          <div className="grid grid-cols-2 items-center gap-4">
            <div>
              <p className="text-sm font-medium text-content">Uzun mola sıklığı</p>
              <p className="text-[12px] text-muted">Kaç turda bir uzun mola?</p>
            </div>
            <Select
              value={String(settings.pomodoroRounds)}
              onValueChange={(value) => update({ pomodoroRounds: Number(value) })}
              options={[2, 3, 4, 5, 6].map((count) => ({ value: String(count), label: `${count} tur` }))}
            />
          </div>
        </CardBody>
      </Card>

      <Card className="flex self-stretch flex-col">
        <CardHeader icon={<Icon name="target" size={18} />} title="Hedefler" subtitle="Motivasyonunu yüksek tut" />
        <CardBody className="flex flex-1 flex-col justify-around gap-5">
          <SliderRow label="Günlük çalışma hedefi" value={settings.dailyGoalMinutes} min={30} max={480} step={15} unit="dk" onChange={(v) => update({ dailyGoalMinutes: v })} />
          <SliderRow label="Haftalık hedef" value={settings.weeklyGoalMinutes} min={120} max={3600} step={60} unit="dk" onChange={(v) => update({ weeklyGoalMinutes: v })} />
        </CardBody>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader icon={<Icon name="bell" size={18} />} title="Bildirimler ve hatırlatıcılar" subtitle="Görev, sınav ve odak hatırlatmaları" />
        <CardBody><NotificationsCard /></CardBody>
      </Card>

      <BackupCard />

      <Card>
        <CardHeader icon={<Icon name="sync" size={18} />} title="Senkronizasyon" subtitle="Verilerini cihazların arasında güncel tut" />
        <CardBody><AccountCard view="sync" /></CardBody>
      </Card>

      <Card className="lg:col-span-2">
        <CardBody className="flex flex-wrap items-center gap-4 py-5">
          <Logo size={44} withText={false} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-content">BATEO — öğrenci merkezi</p>
            <p className="text-[12px] text-muted">Offline-first · verilerin cihazında güvende</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!confirm("Uygulama tercihleri varsayılana dönecek. Emin misin?")) return;
              void updateSettings(DEFAULT_SETTINGS).then(() => {
                setMessage("Ayarlar sıfırlandı.");
                window.setTimeout(() => setMessage(null), 2500);
              });
            }}
          >
            Ayarları sıfırla
          </Button>
          {message && <p className="w-full text-right text-[12px] font-medium text-accent">{message}</p>}
        </CardBody>
      </Card>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const formatted = unit === "dk" && value >= 60
    ? `${Math.floor(value / 60)} sa ${value % 60 ? `${value % 60} dk` : ""}`.trim()
    : `${value} ${unit}`;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium text-content">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-accent">{formatted}</span>
      </div>
      <Slider value={value} onValueChange={onChange} min={min} max={max} step={step} />
    </div>
  );
}
