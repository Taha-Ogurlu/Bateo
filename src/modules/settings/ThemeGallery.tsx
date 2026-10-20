import { updateSettings } from "../../db/db";
import { useSettings } from "../../hooks/useSettings";
import { FONT_STACKS, THEMES, type Theme, type ThemeFamily } from "../../lib/themes";
import { cn } from "../../lib/cn";
import { Icon } from "../../components/icons";

const FAMILIES: { key: ThemeFamily; label: string; hint: string }[] = [
  { key: "renk", label: "Renk temaları", hint: "Sadece palet değişir" },
  { key: "yazi", label: "Yazı stilli", hint: "Palet + yazı tipi" },
  { key: "sinematik", label: "Sinematik", hint: "Palet + atmosfer / arka plan görseli" },
];

export function ThemeGallery() {
  const settings = useSettings();

  const apply = (t: Theme) => updateSettings({ themeId: t.id, accent: t.vars.accent });

  return (
    <div className="flex flex-col gap-6">
      {FAMILIES.map((fam) => (
        <div key={fam.key}>
          <div className="mb-2.5 flex items-baseline gap-2">
            <h4 className="text-sm font-semibold text-content">{fam.label}</h4>
            <span className="text-[11px] text-muted">{fam.hint}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.filter((t) => t.family === fam.key).map((t) => (
              <ThemeCard key={t.id} theme={t} active={settings.themeId === t.id} onPick={() => apply(t)} />
            ))}
          </div>
        </div>
      ))}

      <p className="text-[11px] text-muted leading-relaxed">
        <Icon name="info" size={12} className="mr-1 inline -mt-0.5" />
        Sinematik temaların arka plan görseli için: <code className="text-content">public/themes/&lt;id&gt;.jpg</code>{" "}
        (1920×1080 JPG). Görsel yoksa temanın kendi gradyanı kullanılır.
      </p>
    </div>
  );
}

function ThemeCard({ theme, active, onPick }: { theme: Theme; active: boolean; onPick: () => void }) {
  const v = theme.vars;
  const bgImage = theme.image ? `${theme.image}, ${theme.wallpaper ?? ""}` : (theme.wallpaper ?? "");

  return (
    <button
      onClick={onPick}
      className={cn(
        "group overflow-hidden rounded-2xl border text-left transition-all hover:-translate-y-0.5",
        active ? "border-accent ring-2 ring-[var(--accent-soft)]" : "border-line hover:border-accent/50",
      )}
    >
      {/* Önizleme */}
      <div
        className={cn("relative w-full", theme.family === "sinematik" ? "h-36" : "h-24")}
        style={{
          background: v.bg,
          backgroundImage: bgImage || undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: theme.image
              ? "linear-gradient(180deg, rgba(5, 8, 18, 0.12), rgba(5, 8, 18, 0.58))"
              : v.bg,
          }}
        />
        <div className="absolute inset-0 p-3">
          <div className="flex gap-1.5">
            <span className="h-6 w-6 rounded-md" style={{ background: v.accent }} />
            <span className="h-6 w-6 rounded-md" style={{ background: v.accent2 }} />
            <span className="h-6 w-10 rounded-md" style={{ background: v.surface }} />
          </div>
          <div className="mt-2 space-y-1">
            <span className="block h-1.5 w-16 rounded-full" style={{ background: v.muted }} />
            <span className="block h-1.5 w-10 rounded-full" style={{ background: v.line }} />
          </div>
          <span
            className="absolute bottom-2.5 right-3 rounded-md px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: v.accent, color: v.bg }}
          >
            Aa
          </span>
        </div>

        {active && (
          <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full accent-gradient text-[var(--accent-fg)]">
            <Icon name="check" size={14} strokeWidth={2.5} />
          </span>
        )}
      </div>

      {/* Bilgi */}
      <div className="bg-surface px-3 py-2.5">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-content">{theme.name}</p>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-muted">
            {theme.family === "sinematik" ? "SİNEMATİK" : theme.font === "serif" ? "serif" : theme.font === "mono" ? "mono" : "sans"}
          </span>
        </div>
        <p className="text-[11px] text-muted mt-0.5 leading-snug">{theme.description}</p>
        <p className="mt-1.5 text-[11px] text-content/80" style={{ fontFamily: FONT_STACKS[theme.font] }}>
          Sessiz bir akşam, açık bir kitap.
        </p>
      </div>
    </button>
  );
}
