"use client";

import { useState } from "react";
import Link from "next/link";

export default function ZapomnianeHasloPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [wyslano, setWyslano] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setBlad(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setBlad(data.error || "Blad wysylki.");
        return;
      }
      setWyslano(true);
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
          <div className="text-xs text-gray-500">Reset hasla</div>
        </div>

        {wyslano ? (
          <div className="text-sm text-gray-700 bg-gray-50 rounded-md p-3">
            Jesli konto o podanym adresie istnieje, wyslalismy na nie link do ustawienia nowego hasla (wazny 1
            godzine). Sprawdz skrzynke odbiorcza.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">E-mail konta</label>
              <input
                type="email"
                required
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ty@gillmet.pl"
              />
            </div>
            {blad && <div className="text-xs text-red-600 bg-red-50 rounded-md p-2">{blad}</div>}
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-gillmet-accent text-gillmet-navy font-semibold text-sm py-2 rounded-md disabled:opacity-50"
            >
              {busy ? "Wysylanie..." : "Wyslij link do resetu hasla"}
            </button>
          </form>
        )}

        <Link href="/login" className="text-xs text-gillmet-steel underline block text-center">
          Wroc do logowania
        </Link>
      </div>
    </div>
  );
}
