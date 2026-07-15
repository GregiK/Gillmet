import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Gillmet MES Dashboard",
  description: "Wyceny, dokumentacja, magazyn i produkcja konstrukcji stalowych",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-gillmet-bg">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
