import { useLocation } from "react-router-dom";
import { NAV_ITEMS } from "../../lib/nav";
import { Icon } from "../icons";
import { useUI } from "../../store/ui";
import { Logo } from "./Logo";
import { Kbd } from "../ui/misc";
import { fmt } from "../../lib/date";
import { useNow } from "../../hooks/useNow";

export function TopBar() {
  const now = useNow();
  const location = useLocation();
  const setPaletteOpen = useUI((s) => s.setPaletteOpen);
  const setQuickAddOpen = useUI((s) => s.setQuickAddOpen);

  const current = NAV_ITEMS.find((i) =>
    i.end ? location.pathname === i.to : location.pathname.startsWith(i.to),
  );

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/70 px-4 md:px-6 h-16 backdrop-blur-xl">
      <div className="md:hidden">
        <Logo size={32} withText={false} />
      </div>

      <div className="min-w-0">
        <h1 className="text-[15px] font-semibold text-content leading-tight truncate">
          {current?.label ?? "BATEO"}
        </h1>
        <p className="hidden sm:block text-[11px] text-muted leading-tight">
          {fmt(now, "d MMMM yyyy, EEEE")}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => setPaletteOpen(true)}
          className="group flex items-center gap-2 rounded-xl border border-line bg-bg2/50 px-3 h-10 text-sm text-muted transition-colors hover:border-accent/50 hover:text-content md:w-56"
          aria-label="Ara"
        >
          <Icon name="search" size={17} />
          <span className="hidden md:inline">Ara…</span>
          <span className="hidden md:inline ml-auto">
            <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
          </span>
        </button>

        <button
          onClick={() => setQuickAddOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:text-content hover:bg-line/50 transition-colors"
          aria-label="Hızlı ekle"
        >
          <Icon name="plus" size={19} />
        </button>
      </div>
    </header>
  );
}
