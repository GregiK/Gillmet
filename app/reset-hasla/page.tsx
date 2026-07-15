"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [haslo, setHaslo] = useState("");
  const [haslo2, setHaslo2] = useState("");
  const [busy, setBusy] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlad(null);
    if (!token) {
      setBlad("Brak tokenu resetu w linku. Wyslij prosbe o reset ponownie.");
      return;
    }
    if (haslo.length < 8) {
      setBlad("Haslo musi miec co najmniej 8 znakow.");
      return;
    }
    if (haslo !== haslo2) {
      setBlad("Hasla nie sa identyczne.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, haslo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBlad(data.error || "Nie udalo sie zresetowac hasla.");
        return;
      }
      router.push("/wyceny");
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
          <div className="text-xs text-gray-500">Ustaw nowe haslo</div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Nowe haslo</label>
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
          <div>
            <label className="text-xs text-gray-500 block mb-1">Powtorz nowe haslo</label>
            <input
              type="password"
              required
              minLength={8}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
              value={haslo2}
              onChange={(e) => setHaslo2(e.target.value)}
            />
          </div>
          {blad && <div className="text-xs text-red-600 bg-red-50 rounded-md p-2">{blad}</div>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-gillmet-accent text-gillmet-navy font-semibold text-sm py-2 rounded-md disabled:opacity-50"
          >
            {busy ? "Zapisywanie..." : "Ustaw nowe haslo"}
          </button>
        </form>

        <Link href="/login" className="text-xs text-gillmet-steel underline block text-center">
          Wroc do logowania
        </Link>
      </div>
    </div>
  );
}

export default function ResetHaslaPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
