"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/zapomniane-haslo") ||
    pathname?.startsWith("/reset-hasla");

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gillmet-bg w-full">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6">{children}</main>
    </div>
  );
}
