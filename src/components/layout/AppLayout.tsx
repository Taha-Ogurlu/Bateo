import { Outlet, useLocation } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";
import { cn } from "../../lib/cn";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const widePage = pathname === "/ayarlar";

  // Route changes should start at the top; query changes within a page keep position.
  useLayoutEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [pathname]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg">
      {/* Sinematik tema arka planı (varsa) */}
      <div className="theme-wallpaper" aria-hidden />
      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main ref={mainRef} className="relative flex-1 overflow-y-auto overflow-x-hidden">
          {/*
            Bilinçli olarak animasyon YOK: sayfa/kart giriş animasyonları tema ile birlikte
            "önce gelip sonra oynama" hissi veriyordu. İçerik anında görünür.
          */}
          <div className={cn("mx-auto w-full px-4 md:px-6 py-5 pb-28 md:pb-10", widePage ? "max-w-none" : "max-w-6xl")}>
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
