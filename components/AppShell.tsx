"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import MobileNavGrid from "@/components/MobileNavGrid";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/zapomniane-haslo") ||
    pathname?.startsWith("/reset-hasla");

  const [menuOtwarte, setMenuOtwarte] = useState(false);

  // Zamykaj wysuwane menu automatycznie przy zmianie strony (np. po kliknieciu w link).
  useEffect(() => {
    setMenuOtwarte(false);
  }, [pathname]);

  // Blokada przewijania tla + zamykanie klawiszem Escape, gdy menu jest otwarte.
  useEffect(() => {
    if (!menuOtwarte) return;
    const poprzedniOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOtwarte(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = poprzedniOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOtwarte]);

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gillmet-bg md:flex">
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-gillmet-navy text-white px-4 h-14 shadow-sm">
        <div className="font-semibold tracking-wide text-sm">Gillmet WKS</div>
        <button
          onClick={() => setMenuOtwarte(true)}
          aria-label="Otworz menu"
          className="p-2 -mr-2 rounded-md active:bg-white/10"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Pelnoekranowe menu kafelkowe (mobile) */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-opacity duration-200 ${
          menuOtwarte ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!menuOtwarte}
      >
        <div
          className={`absolute inset-0 transition-transform duration-200 ease-out ${
            menuOtwarte ? "translate-y-0" : "-translate-y-4"
          }`}
        >
          <div className="flex items-center justify-between bg-gillmet-navy text-white px-4 h-14 border-b border-white/10">
            <div className="font-semibold tracking-wide text-sm">Gillmet WKS</div>
            <button
              onClick={() => setMenuOtwarte(false)}
              aria-label="Zamknij menu"
              className="p-2 -mr-2 rounded-md active:bg-white/10"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            </button>
          </div>
          <div className="h-[calc(100%-3.5rem)]">
            <MobileNavGrid onNavigate={() => setMenuOtwarte(false)} />
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">{children}</main>
    </div>
  );
}
