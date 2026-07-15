import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";

// lib/session.ts korzysta z modulu Node "crypto" (HMAC) - wymaga uruchomienia
// middleware w srodowisku Node.js zamiast domyslnego Edge Runtime.
export const runtime = "nodejs";

// Chroni wszystkie strony poza /login i /api/auth/* (oraz zasobami statycznymi Next.js).
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/zapomniane-haslo") ||
    pathname.startsWith("/reset-hasla") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (isPublic) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
