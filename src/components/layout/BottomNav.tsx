import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { MOBILE_NAV, MORE_NAV } from "../../lib/nav";
import { Icon } from "../icons";
import { cn } from "../../lib/cn";
import { Modal } from "../ui/Modal";

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const inMore = MORE_NAV.some((i) => location.pathname.startsWith(i.to));

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-line bg-surface/85 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-stretch justify-around px-1 pt-1.5 pb-1">
          {MOBILE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-accent" : "text-muted",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute top-0 h-1 w-8 rounded-full accent-gradient" />}
                  <Icon name={item.icon} size={21} strokeWidth={isActive ? 2.1 : 1.75} />
                  <span className="max-w-full truncate px-0.5">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors",
              inMore ? "text-accent" : "text-muted",
            )}
          >
            {inMore && <span className="absolute top-0 h-1 w-8 rounded-full accent-gradient" />}
            <Icon name="menu" size={21} strokeWidth={inMore ? 2.1 : 1.75} />
            <span>Daha fazla</span>
          </button>
        </div>
      </nav>

      <Modal open={moreOpen} onOpenChange={setMoreOpen} title="Tüm bölümler">
        <div className="grid grid-cols-2 gap-2.5">
          {MORE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 rounded-2xl border border-line bg-bg2/40 px-3.5 py-3 text-sm font-medium text-content transition-colors hover:border-accent/50"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-accentsoft text-accent">
                <Icon name={item.icon} size={19} />
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </Modal>
    </>
  );
}
