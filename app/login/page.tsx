"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/wyceny";
  const googleError = params.get("google_error");

  const [tryb, setTryb] = useState<"logowanie" | "rejestracja">("logowanie");
  const [email, setEmail] = useState("");
  const [haslo, setHaslo] = useState("");
  const [imie, setImie] = useState("");
  const [busy, setBusy] = useState(false);
  const [blad, setBlad] = useState<string | null>(googleError);

  const DEMO_EMAIL = "demo@gillmet.pl";
  const DEMO_HASLO = "Gillmet2026!";

  const zalogujSie = async (loginEmail: string, loginHaslo: string) => {
    setBusy(true);
    setBlad(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, haslo: loginHaslo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBlad(data.error || "Blad logowania.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch (e) {
      setBlad((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tryb === "logowanie") {
      await zalogujSie(email, haslo);
      return;
    }
    setBusy(true);
    setBlad(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, haslo, imie_nazwisko: imie }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBlad(data.error || "Blad rejestracji.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch (e) {
      setBlad((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gillmet-bg px-4">
      <div className="card w-full max-w-sm p-6 space-y-5">
        <div>
          <div className="text-lg font-semibold text-gillmet-navy tracking-wide">Gillmet WKS</div>
          <div className="text-xs text-gray-500">MES Dashboard - logowanie</div>
        </div>

        <div className="border border-dashed border-gillmet-accent rounded-md p-3 space-y-2 bg-amber-50">
          <div className="text-xs font-semibold text-gillmet-navy">Konto demonstracyjne</div>
          <div className="text-xs text-gray-600">
            E-mail: <span className="font-mono">{DEMO_EMAIL}</span>
            <br />
            Haslo: <span className="font-mono">{DEMO_HASLO}</span>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => zalogujSie(DEMO_EMAIL, DEMO_HASLO)}
            className="w-full bg-gillmet-navy text-white text-xs font-semibold py-2 rounded-md disabled:opacity-50"
          >
            Zaloguj jako demo
          </button>
        </div>

        <a
          href={`/api/auth/google/login?next=${encodeURIComponent(next)}`}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-md py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 35.4 27 36 24 36c-5.2 0-9.6-3.4-11.2-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.6 5.4C41.6 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-3.5z"/>
          </svg>
          Zaloguj przez Google
        </a>

        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <div className="flex-1 h-px bg-gray-200" />
          lub hasłem
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="flex text-xs rounded-md overflow-hidden border border-gray-200">
          <button
            type="button"
            onClick={() => setTryb("logowanie")}
            className={`flex-1 py-2 ${tryb === "logowanie" ? "bg-gillmet-navy text-white" : "bg-white text-gray-500"}`}
          >
            Logowanie
          </button>
          <button
            type="button"
            onClick={() => setTryb("rejestracja")}
            className={`flex-1 py-2 ${tryb === "rejestracja" ? "bg-gillmet-navy text-white" : "bg-white text-gray-500"}`}
          >
            Pierwsza konfiguracja
          </button>
        </div>

        {tryb === "rejestracja" && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded-md p-3">
            Zakladka konta administratora dziala tylko raz - przy pierwszym uruchomieniu systemu, gdy nie istnieje
            jeszcze zaden uzytkownik. Jesli konto juz istnieje, uzyj zakladki &quot;Logowanie&quot;.
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          {tryb === "rejestracja" && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Imie i nazwisko</label>
              <input
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                value={imie}
                onChange={(e) => setImie(e.target.value)}
                placeholder="np. Grzegorz Kizewski"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 block mb-1">E-mail</label>
            <input
              type="email"
              required
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ty@gillmet.pl"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Haslo</label>
            <input
              type="password"
              required
              minLength={8}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
              value={haslo}
              onChange={(e) => setHaslo(e.target.value)}
              placeholder="min. 8 znakow"
            />
          </div>

          {blad && <div className="text-xs text-red-600 bg-red-50 rounded-md p-2">{blad}</div>}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-gillmet-accent text-gillmet-navy font-semibold text-sm py-2 rounded-md disabled:opacity-50"
          >
            {busy ? "Prosze czekac..." : tryb === "logowanie" ? "Zaloguj" : "Utworz konto administratora"}
          </button>
        </form>

        {tryb === "logowanie" && (
          <Link href="/zapomniane-haslo" className="text-xs text-gillmet-steel underline block text-center">
            Nie pamietasz hasla?
          </Link>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
