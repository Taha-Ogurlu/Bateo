import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../../lib/nav";
import { Icon } from "../icons";
import { cn } from "../../lib/cn";
import { useUI } from "../../store/ui";
import { Logo, SidebarLink } from "./Logo";
import { Tip } from "../ui/Tooltip";
import { SidebarDailyTasks } from "./SidebarDailyTasks";
import { useSettings } from "../../hooks/useSettings";

export function Sidebar() {
  const collapsed = useUI((state) => state.sidebarCollapsed);
  const toggleSidebar = useUI((state) => state.toggleSidebar);
  const settings = useSettings();
  const avatar = settings.userName.trim().slice(0, 1).toLocaleUpperCase("tr-TR") || "B";
  const primary = NAV_ITEMS.filter((item) => item.to !== "/ayarlar" && item.to !== "/hesabim");

  return (
    <aside
      className={cn(
        "relative z-10 hidden h-full min-h-0 shrink-0 flex-col gap-2 overflow-hidden border-r border-line bg-surface/70 backdrop-blur-xl md:flex",
        "transition-[width] duration-300 ease-out",
        collapsed ? "w-[84px] px-3 py-4" : "w-[248px] px-3.5 py-4",
      )}
    >
      <div className={cn("mb-2 flex items-center px-1", collapsed && "justify-center")}>
        <Logo size={38} withText={!collapsed} />
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto no-scrollbar">
        {primary.map((item) => <SidebarLink key={item.to} {...item} collapsed={collapsed} />)}
        <SidebarDailyTasks collapsed={collapsed} />
      </nav>

      <div className="shrink-0 flex flex-col gap-1 border-t border-line pt-2">
        <NavLink
          to="/ayarlar"
          title={collapsed ? "Ayarlar" : undefined}
          className={({ isActive }) =>
            cn(
              "group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              isActive ? "bg-accentsoft text-accent" : "text-muted hover:bg-line/50 hover:text-content",
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full accent-gradient" />}
              <Icon name="settings" size={20} className="shrink-0" />
              {!collapsed && "Ayarlar"}
            </>
          )}
        </NavLink>

        <div className={cn("flex shrink-0 items-center gap-1", collapsed ? "flex-col" : "justify-between px-1")}>
          <NavLink
            to="/hesabim"
            title={collapsed ? "Hesabım" : undefined}
            className={({ isActive }) =>
              cn(
                "flex min-w-0 items-center gap-2.5 rounded-xl p-1.5 text-sm font-medium transition-colors",
                collapsed ? "h-9 w-9 justify-center" : "flex-1",
                isActive ? "text-accent" : "text-muted hover:bg-line/50 hover:text-content",
              )
            }
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-accentsoft text-xs font-semibold text-accent">
              {avatar}
            </span>
            {!collapsed && <span className="truncate">Hesabım</span>}
          </NavLink>
          <Tip label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}>
            <button
              onClick={toggleSidebar}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-line/50 hover:text-content"
              aria-label="Menüyü daralt/genişlet"
            >
              <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={19} />
            </button>
          </Tip>
        </div>
      </div>
    </aside>
  );
}
