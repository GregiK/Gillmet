import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

const N8N_BASE_URL = process.env.N8N_BASE_URL || "https://automatyzacja.zabawkijuniora.pl/webhook";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function redirectToLogin(req: NextRequest, error: string) {
  const url = new URL("/login", req.url);
  url.searchParams.set("google_error", error);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("gillmet_oauth_state")?.value;
  const next = req.cookies.get("gillmet_oauth_next")?.value || "/wyceny";

  if (!code || !state || !savedState || state !== savedState) {
    return redirectToLogin(req, "Nieprawidlowa proba logowania Google (state). Sprobuj ponownie.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectToLogin(req, "Logowanie Google nie jest skonfigurowane po stronie serwera.");
  }
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.nextUrl.origin}/api/auth/google/callback`;

  // Wymiana kodu autoryzacyjnego na token dostepu.
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenData.access_token) {
    return redirectToLogin(req, "Nie udalo sie zalogowac przez Google (wymiana tokenu).");
  }

  // Pobranie zweryfikowanego adresu e-mail bezposrednio z API Google (nie ufamy samemu id_token bez weryfikacji podpisu).
  const userRes = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userInfo = await userRes.json().catch(() => ({}));
  if (!userRes.ok || !userInfo.email || !userInfo.email_verified) {
    return redirectToLogin(req, "Nie udalo sie pobrac zweryfikowanego adresu e-mail z Google.");
  }

  const email = String(userInfo.email).trim().toLowerCase();

  // Konto Google musi odpowiadac juz istniejacemu kontu w systemie (logowanie Google to alternatywna
  // metoda dostepu do istniejacego konta, a nie publiczna rejestracja nowych uzytkownikow).
  const lookupRes = await fetch(`${N8N_BASE_URL}/api/auth/uzytkownik?email=${encodeURIComponent(email)}`, {
    cache: "no-store",
  });
  const lookup = await lookupRes.json().catch(() => ({}));

  if (!lookup.found) {
    return redirectToLogin(req, `Konto ${email} nie istnieje w systemie Gillmet. Poproś administratora o dodanie konta.`);
  }
  if (lookup.aktywny === false) {
    return redirectToLogin(req, "To konto jest nieaktywne. Skontaktuj sie z administratorem.");
  }

  const token = createSessionToken({ email: lookup.email, rola: lookup.rola, imie_nazwisko: lookup.imie_nazwisko });
  const res = NextResponse.redirect(new URL(next, req.url));
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE });
  res.cookies.set("gillmet_oauth_state", "", { path: "/", maxAge: 0 });
  res.cookies.set("gillmet_oauth_next", "", { path: "/", maxAge: 0 });
  return res;
}
