// Wlasna, bezstanowa sesja logowania Next.js (niezalezna od tabeli n8n "sesje").
// Po udanym /api/auth/login (weryfikacja haslo w n8n) wystawiamy podpisany cookie
// zawierajacy {email, rola, imie_nazwisko, exp}. Podpis HMAC-SHA256 z SESSION_SECRET.

import crypto from "crypto";

export type SessionPayload = {
  email: string;
  rola: string;
  imie_nazwisko: string;
  exp: number;
};

const SECRET = process.env.SESSION_SECRET || "gillmet-dev-secret-zmien-w-produkcji";
export const SESSION_COOKIE = "gillmet_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 dni

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function createSessionToken(user: { email: string; rola: string; imie_nazwisko: string }): string {
  const payload: SessionPayload = {
    email: user.email,
    rola: user.rola,
    imie_nazwisko: user.imie_nazwisko,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const body = base64url(JSON.stringify(payload));
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = sign(body);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
