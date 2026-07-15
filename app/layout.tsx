import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Gillmet MES Dashboard",
  description: "Wyceny, dokumentacja, magazyn i produkcja konstrukcji stalowych",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="flex min-h-screen bg-gillmet-bg">
        <Sidebar />
        <main className="flex-1 min-w-0 p-6">{children}</main>
      </body>
    </html>
  );
}
