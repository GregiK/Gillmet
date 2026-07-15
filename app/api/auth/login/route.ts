import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

const BASE_URL = process.env.N8N_BASE_URL || "https://automatyzacja.zabawkijuniora.pl/webhook";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const upstream = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok || !data.ok) {
    return NextResponse.json({ error: data.error || "Nieprawidlowy e-mail lub haslo." }, { status: upstream.status || 401 });
  }

  const token = createSessionToken({ email: data.email, rola: data.rola, imie_nazwisko: data.imie_nazwisko });
  const res = NextResponse.json({ ok: true, email: data.email, rola: data.rola, imie_nazwisko: data.imie_nazwisko });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
