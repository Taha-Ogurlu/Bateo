import { updateSettings } from "../../db/db";
import { useAuth } from "../../hooks/useAuth";
import { useSettings } from "../../hooks/useSettings";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Field, Input } from "../../components/ui/Field";
import { Icon } from "../../components/icons";
import { AccountCard } from "../settings/AccountCard";

export function AccountPage() {
  const settings = useSettings();
  const { user, configured } = useAuth();
  const initial = settings.userName.trim().slice(0, 1).toLocaleUpperCase("tr-TR") || "B";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 md:gap-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Kişisel alanın</p>
          <h1 className="text-2xl font-bold tracking-tight text-content sm:text-[28px]">Hesabım</h1>
          <p className="mt-1 text-sm text-muted">Profilini ve hesap güvenliğini buradan yönet.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1.5 text-xs text-muted backdrop-blur">
          <span className={`h-2 w-2 rounded-full ${user ? "bg-accent" : "bg-muted/60"}`} />
          {user ? "BATEO hesabı bağlı" : configured ? "Oturum açılmadı" : "Bu cihazda kayıtlı"}
        </div>
      </header>

      <section className="relative isolate overflow-hidden rounded-3xl border border-line bg-surface/90 shadow-[var(--shadow)] backdrop-blur-xl">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-28 -z-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-1/3 bg-gradient-to-l from-accent/5 to-transparent" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-7">
          <div className="grid h-[76px] w-[76px] shrink-0 place-items-center rounded-[26px] border border-accent/30 bg-gradient-to-br from-accent/30 via-accent/15 to-surface text-3xl font-bold text-accent shadow-lg shadow-accent/10">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted">BATEO profili</p>
            <h2 className="mt-1 truncate text-xl font-semibold text-content sm:text-2xl">{settings.userName.trim() || "İsmini belirle"}</h2>
            <p className="mt-1 truncate text-sm text-muted">{user?.email ?? "Odak alanını kendine göre düzenle"}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-line/80 bg-bg/35 px-4 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
              <Icon name={user ? "lock" : "profile"} size={19} />
            </span>
            <div>
              <p className="text-xs text-muted">Hesap durumu</p>
              <p className="mt-0.5 text-sm font-semibold text-content">{user ? "Güvende" : configured ? "Giriş gerekli" : "Yerel profil"}</p>
            </div>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-line to-transparent" />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5 text-xs text-muted sm:px-7">
          <span className="inline-flex items-center gap-2"><Icon name="check" size={15} className="text-accent" /> Profil bilgilerin bu cihazda saklanır</span>
          <span className="inline-flex items-center gap-2"><Icon name="sync" size={15} className="text-accent" /> {user ? "Senkronizasyon hesabınla eşitlenir" : "Hesap bağlayarak cihazların arasında eşitle"}</span>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <Card className="bg-surface/90 backdrop-blur-xl">
            <CardHeader icon={<Icon name="profile" size={19} />} title="Profil bilgileri" subtitle="Uygulamada sana nasıl hitap edileceğini belirle" />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-line bg-bg/30 p-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent/15 text-lg font-bold text-accent">{initial}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-content">{settings.userName.trim() || "Adın henüz eklenmedi"}</p>
                  <p className="text-xs text-muted">Ana sayfa ve profil simgesinde görünür</p>
                </div>
              </div>
              <Field label="Görünen ad">
                <Input
                  value={settings.userName}
                  onChange={(event) => void updateSettings({ userName: event.target.value })}
                  placeholder="Örn. Taha"
                  maxLength={40}
                />
              </Field>
              <p className="text-xs leading-relaxed text-muted">Değişikliklerin otomatik kaydedilir ve uygulama içinde hemen görünür.</p>
            </CardBody>
          </Card>

        </div>

        <div>
          <Card className="bg-surface/90 backdrop-blur-xl">
            <CardHeader icon={<Icon name="lock" size={19} />} title="Giriş ve güvenlik" subtitle="Hesabına erişimi ve giriş bilgilerini yönet" />
            <CardBody>
              <AccountCard view="account" />
            </CardBody>
          </Card>
        </div>
      </div>

      <Card className="bg-surface/90 backdrop-blur-xl">
        <CardHeader icon={<Icon name="info" size={19} />} title="Profilin hakkında" subtitle="BATEO’daki kişisel alanın" />
        <CardBody>
          <div className="grid min-h-[116px] items-center gap-5 rounded-xl border border-line bg-bg/30 p-5 md:grid-cols-[auto_minmax(0,1fr)_minmax(180px,0.7fr)]">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent"><Icon name="idea" size={21} /></span>
            <p className="text-sm leading-relaxed text-muted">Profil adın odak oturumlarına veya notlarına dokunmaz. Yalnızca uygulamadaki karşılama ve profil görünümünü kişiselleştirir.</p>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <span className="rounded-full border border-line px-3 py-1.5 text-xs text-muted">Karşılama ekranında görünür</span>
              <span className="rounded-full border border-line px-3 py-1.5 text-xs text-muted">Verilerini değiştirmez</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
