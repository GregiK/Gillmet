import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.N8N_BASE_URL || "https://automatyzacja.zabawkijuniora.pl/webhook";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const resetLinkBase = `${req.nextUrl.origin}/reset-hasla`;

  const upstream = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, reset_link_base: resetLinkBase }),
    cache: "no-store",
  });
  const data = await upstream.json().catch(() => ({}));

  // Zawsze zwracamy ta sama, generyczna odpowiedz - niezaleznie od tego, czy konto istnieje -
  // zeby nie ujawniac, ktore adresy e-mail sa zarejestrowane w systemie.
  return NextResponse.json({ ok: true, message: data.message || "Jesli konto istnieje, wyslalismy link do resetu hasla." });
}
