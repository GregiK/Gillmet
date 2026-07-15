"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/wyceny", label: "Wyceny", icon: "PLN" },
  { href: "/dokumentacja", label: "Opracowanie dokumentacji", icon: "DOC" },
  { href: "/magazyn", label: "Magazyn", icon: "MAG" },
  { href: "/produkcja", label: "Produkcja", icon: "PRD" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-gillmet-navy text-white min-h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="text-lg font-semibold tracking-wide">GILLMET</div>
        <div className="text-xs text-white/60">MES Dashboard</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active ? "bg-gillmet-accent text-gillmet-navy font-semibold" : "text-white/80 hover:bg-white/10"
              }`}
            >
              <span className="text-[10px] font-mono opacity-70 w-8">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-white/10 text-[11px] text-white/40">
        Konstrukcje stalowe S235 / S355
      </div>
    </aside>
  );
}
