"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/wyceny";

  const [tryb, setTryb] = useState<"logowanie" | "rejestracja">("logowanie");
  const [email, setEmail] = useState("");
  const [haslo, setHaslo] = useState("");
  const [imie, setImie] = useState("");
  const [busy, setBusy] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setBlad(null);
    try {
      const url = tryb === "logowanie" ? "/api/auth/login" : "/api/auth/register";
      const payload = tryb === "logowanie" ? { email, haslo } : { email, haslo, imie_nazwisko: imie };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gillmet-bg">
      <div className="card w-full max-w-sm p-6 space-y-5">
        <div>
          <div className="text-lg font-semibold text-gillmet-navy tracking-wide">GILLMET</div>
          <div className="text-xs text-gray-500">MES Dashboard - logowanie</div>
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
