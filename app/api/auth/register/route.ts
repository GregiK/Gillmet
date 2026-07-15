import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

const BASE_URL = process.env.N8N_BASE_URL || "https://automatyzacja.zabawkijuniora.pl/webhook";

// Rejestracja dziala tylko "na pusto" (bootstrap) - n8n odrzuci ja (403), jesli
// w tabeli uzytkownicy istnieje juz jakiekolwiek konto. Sluzy wylacznie do
// utworzenia pierwszego konta administratora przy pierwszym uruchomieniu.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const upstream = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok || !data.ok) {
    return NextResponse.json({ error: data.error || "Nie udalo sie utworzyc konta." }, { status: upstream.status || 400 });
  }

  const token = createSessionToken({ email: body.email, rola: data.rola || "admin", imie_nazwisko: body.imie_nazwisko || "" });
  const res = NextResponse.json({ ok: true, rola: data.rola || "admin" });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
