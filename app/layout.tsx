import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Gillmet WKS Dashboard",
  description: "Wyceny, dokumentacja, magazyn i produkcja konstrukcji stalowych",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0e3b2c",
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
