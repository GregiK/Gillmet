"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/zapomniane-haslo") ||
    pathname?.startsWith("/reset-hasla");

  const [menuOtwarte, setMenuOtwarte] = useState(false);

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gillmet-bg md:flex">
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-gillmet-navy text-white px-4 py-3">
        <div className="font-semibold tracking-wide text-sm">GILLMET</div>
        <button
          onClick={() => setMenuOtwarte(true)}
          aria-label="Otworz menu"
          className="p-2 -mr-2"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {menuOtwarte && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-64 max-w-[80vw]">
            <Sidebar onNavigate={() => setMenuOtwarte(false)} />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMenuOtwarte(false)} />
        </div>
      )}

      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="flex-1 min-w-0 p-4 md:p-6">{children}</main>
    </div>
  );
}
