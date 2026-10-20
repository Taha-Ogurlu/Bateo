import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { CommandPalette } from "./components/layout/CommandPalette";
import { QuickAdd } from "./components/layout/QuickAdd";
import { Onboarding } from "./components/layout/Onboarding";
import { PageLoader } from "./components/layout/PageLoader";
import { WelcomeGate } from "./components/auth/WelcomeGate";
import { SetNewPassword } from "./components/auth/SetNewPassword";
import { isRecoveryFlow } from "./db/supabase";
import { TooltipProvider } from "./components/ui/Tooltip";
import { useThemeSync } from "./hooks/useSettings";
import { useReminders } from "./hooks/useReminders";
import { useFocusTimerRuntime } from "./hooks/useFocusTimerRuntime";
import { useAuth } from "./hooks/useAuth";
import { useUI } from "./store/ui";
import { ensureDeviceId, ensureSettings } from "./db/db";
import { migrateNotesToHtml } from "./db/migrate";
import { hasCloud, startAutoSync, stopAutoSync } from "./db/sync";
import { initNative } from "./lib/native";

const Dashboard = lazy(() => import("./modules/dashboard/Dashboard").then((m) => ({ default: m.Dashboard })));
const Notes = lazy(() => import("./modules/notes/Notes").then((m) => ({ default: m.Notes })));
const Tasks = lazy(() => import("./modules/tasks/Tasks").then((m) => ({ default: m.Tasks })));
const Schedule = lazy(() => import("./modules/schedule/Schedule").then((m) => ({ default: m.Schedule })));
const Focus = lazy(() => import("./modules/focus/Focus").then((m) => ({ default: m.Focus })));
const Stats = lazy(() => import("./modules/stats/Stats").then((m) => ({ default: m.Stats })));
const AccountPage = lazy(() => import("./modules/account/AccountPage").then((m) => ({ default: m.AccountPage })));
const Cards = lazy(() => import("./modules/cards/Cards").then((m) => ({ default: m.Cards })));
const Books = lazy(() => import("./modules/books/Books").then((m) => ({ default: m.Books })));
const SettingsPage = lazy(() =>
  import("./modules/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);

const LAST_LOCATION_KEY = "bateo:last-location:v1";

/** Reopen the web app on the last page the user visited. */
function RememberLastLocation() {
  const location = useLocation();
  const navigate = useNavigate();
  const restored = useRef(false);
  const pendingRestore = useRef<string | null>(null);

  useEffect(() => {
    const current = `${location.pathname}${location.search}${location.hash}`;

    // StrictMode can replay effects before a navigation commits. Avoid saving
    // the temporary `/` location over the route we're in the process of restoring.
    if (pendingRestore.current) {
      if (current !== pendingRestore.current) return;
      pendingRestore.current = null;
    }

    if (!restored.current) {
      restored.current = true;
      if (location.pathname === "/" && !location.search && !location.hash) {
        try {
          const previous = localStorage.getItem(LAST_LOCATION_KEY);
          if (previous?.startsWith("/") && previous !== "/") {
            pendingRestore.current = previous;
            navigate(previous, { replace: true });
            return;
          }
        } catch {
          // Keep the app usable when browser storage is unavailable.
        }
      }
    }

    try {
      // `new=1` only opens a temporary creation dialog; do not reopen it later.
      const params = new URLSearchParams(location.search);
      params.delete("new");
      const query = params.toString();
      const search = query ? `?${query}` : "";
      localStorage.setItem(LAST_LOCATION_KEY, `${location.pathname}${search}${location.hash}`);
    } catch {
      // Keep the app usable when browser storage is unavailable.
    }
  }, [location.hash, location.pathname, location.search, navigate, restored]);

  return null;
}

export default function App() {
  useThemeSync();
  useReminders();
  useFocusTimerRuntime();
  const { user, loading, configured } = useAuth();
  const [recovery, setRecovery] = useState(isRecoveryFlow());

  const togglePalette = useUI((s) => s.togglePalette);
  const setPaletteOpen = useUI((s) => s.setPaletteOpen);
  const setQuickAddOpen = useUI((s) => s.setQuickAddOpen);

  useEffect(() => {
    void (async () => {
      await ensureSettings();
      await ensureDeviceId();
      await migrateNotesToHtml();
    })();
  }, []);

  useEffect(() => {
    if (!hasCloud() || !user) {
      stopAutoSync();
      return;
    }
    startAutoSync();
    return () => stopAutoSync();
  }, [user]);

  useEffect(() => {
    void initNative();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) {
        if (e.key === "Escape") setPaletteOpen(false);
        return;
      }
      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
      }
      if (e.key.toLowerCase() === "j") {
        e.preventDefault();
        setQuickAddOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePalette, setPaletteOpen, setQuickAddOpen]);

  // Hesap zorunlu (bulut yapılandırıldıysa): önce oturum kontrolü
  if (configured && loading) {
    return (
      <TooltipProvider>
        <PageLoader />
      </TooltipProvider>
    );
  }

  if (configured && !user) {
    return (
      <TooltipProvider>
        <WelcomeGate />
      </TooltipProvider>
    );
  }

  // Şifre sıfırlama bağlantısıyla gelindiyse yeni şifre belirleme ekranı
  if (configured && user && recovery) {
    return (
      <TooltipProvider>
        <SetNewPassword onDone={() => setRecovery(false)} />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <HashRouter>
        <RememberLastLocation />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/notlar" element={<Notes />} />
              <Route path="/gorevler" element={<Tasks />} />
              <Route path="/program" element={<Schedule />} />
              <Route path="/odak" element={<Focus />} />
              <Route path="/kartlar" element={<Cards />} />
              <Route path="/kitaplar" element={<Books />} />
              <Route path="/istatistik" element={<Stats />} />
              <Route path="/hesabim" element={<AccountPage />} />
              <Route path="/ayarlar" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
        <CommandPalette />
        <QuickAdd />
        <Onboarding />
      </HashRouter>
    </TooltipProvider>
  );
}
