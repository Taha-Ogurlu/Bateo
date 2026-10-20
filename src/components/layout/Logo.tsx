import { NavLink } from "react-router-dom";
import { Icon } from "../icons";
import { cn } from "../../lib/cn";
import { BateoIcon, BateoLogo } from "../brand/Bateo";

export function Logo({ size = 36, withText = true }: { size?: number; withText?: boolean }) {
  if (!withText) return <BateoIcon size={size} />;
  return <BateoLogo height={size} />;
}

export function SidebarLink({
  to,
  label,
  icon,
  end,
  collapsed,
  onClick,
}: {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-xl px-3 h-11 text-sm font-medium transition-colors duration-150",
          collapsed && "justify-center px-0",
          isActive ? "bg-accentsoft text-accent" : "text-muted hover:text-content hover:bg-line/50",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full accent-gradient" />
          )}
          <Icon name={icon} size={20} className="shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}
