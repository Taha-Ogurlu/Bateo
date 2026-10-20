import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import * as Dialog from "@radix-ui/react-dialog";
import { db, updateSettings } from "../../db/db";
import { NAV_ITEMS } from "../../lib/nav";
import { Icon } from "../icons";
import { useUI } from "../../store/ui";
import { useSettings } from "../../hooks/useSettings";
import { THEMES, themeIsDark } from "../../lib/themes";
import { cn } from "../../lib/cn";
import { Kbd } from "../ui/misc";

interface Cmd {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  group: string;
  run: () => void;
}

export function CommandPalette() {
  const open = useUI((s) => s.paletteOpen);
  const setOpen = useUI((s) => s.setPaletteOpen);
  const setQuickAddOpen = useUI((s) => s.setQuickAddOpen);
  const navigate = useNavigate();
  const settings = useSettings();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const notes = useLiveQuery(() => db.notes.filter((n) => !n.archived).toArray(), [], []);
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []);

  const go = useCallback((to: string) => {
    setOpen(false);
    navigate(to);
  }, [navigate, setOpen]);

  const commands = useMemo<Cmd[]>(() => {
    const cmds: Cmd[] = NAV_ITEMS.map((n) => ({
      id: `nav:${n.to}`,
      label: n.label,
      hint: "Sayfa",
      icon: n.icon,
      group: "Sayfalar",
      run: () => go(n.to),
    }));

    cmds.push(
      {
        id: "act:theme",
        label: settings.theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç",
        icon: settings.theme === "dark" ? "sunrise" : "sunset",
        group: "İşlemler",
        run: () => {
          const targetDark = settings.theme !== "dark";
          const targetTheme = THEMES.find((theme) => themeIsDark(theme) === targetDark) ?? THEMES[0];
          void updateSettings({
            themeId: targetTheme.id,
            theme: targetDark ? "dark" : "light",
            accent: targetTheme.vars.accent,
          });
          setOpen(false);
        },
      },
      {
        id: "act:newnote",
        label: "Yeni not oluştur",
        icon: "note",
        group: "İşlemler",
        run: () => {
          setOpen(false);
          navigate("/notlar?new=1");
        },
      },
      {
        id: "act:newtask",
        label: "Yeni görev ekle",
        icon: "list-todo",
        group: "İşlemler",
        run: () => {
          setOpen(false);
          navigate("/gorevler?new=1");
        },
      },
      {
        id: "act:focus",
        label: "Odak seansı başlat",
        icon: "pomodoro",
        group: "İşlemler",
        run: () => go("/odak"),
      },
      {
        id: "act:quick",
        label: "Hızlı ekle…",
        icon: "plus",
        group: "İşlemler",
        run: () => {
          setOpen(false);
          setQuickAddOpen(true);
        },
      },
    );

    for (const n of notes) {
      cmds.push({
        id: `note:${n.id}`,
        label: n.title || "Başlıksız not",
        hint: "Not",
        icon: "note",
        group: "Notlar",
        run: () => {
          setOpen(false);
          navigate(`/notlar?id=${n.id}`);
        },
      });
    }
    for (const t of tasks) {
      cmds.push({
        id: `task:${t.id}`,
        label: t.title,
        hint: "Görev",
        icon: "list-todo",
        group: "Görevler",
        run: () => {
          setOpen(false);
          navigate(`/gorevler?id=${encodeURIComponent(t.id)}`);
        },
      });
    }
    return cmds;
  }, [notes, tasks, settings.theme, navigate, setOpen, setQuickAddOpen, go]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return commands.filter((c) => c.group === "Sayfalar" || c.group === "İşlemler");
    return commands.filter((c) => c.label.toLocaleLowerCase("tr").includes(q)).slice(0, 40);
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[active]?.run();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-[15%] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-elevated shadow-[var(--shadow)] data-[state=open]:animate-pop outline-none"
          onKeyDown={onKeyDown}
        >
          <Dialog.Title className="sr-only">Komut paleti</Dialog.Title>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Icon name="search" size={18} className="text-muted shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ara veya komut çalıştır…"
              className="h-14 flex-1 bg-transparent text-[15px] text-content outline-none placeholder:text-muted/70"
            />
            <Kbd>Esc</Kbd>
          </div>

          <div className="max-h-[52vh] overflow-y-auto p-2">
            {filtered.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-muted">Sonuç bulunamadı.</p>
            )}
            {filtered.map((c, i) => {
              const showGroup = i === 0 || c.group !== filtered[i - 1].group;
              return (
                <div key={c.id}>
                  {showGroup && (
                    <div className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted/80">
                      {c.group}
                    </div>
                  )}
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => c.run()}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      i === active ? "bg-accentsoft text-accent" : "text-content hover:bg-line/40",
                    )}
                  >
                    <Icon name={c.icon} size={18} className="shrink-0" />
                    <span className="truncate flex-1">{c.label}</span>
                    {c.hint && <span className="text-[11px] text-muted">{c.hint}</span>}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 border-t border-line px-4 py-2.5 text-[11px] text-muted">
            <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> gezin</span>
            <span className="flex items-center gap-1"><Kbd>Enter</Kbd> aç</span>
            <span className="ml-auto flex items-center gap-1"><Kbd>Ctrl</Kbd><Kbd>K</Kbd></span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
