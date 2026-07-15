"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    opis:
      "Tutaj widzisz podsumowanie calej produkcji: aktywne i opoznione zlecenia, ile sztuk jest w toku, przekroczone terminy oraz najblizsze deadline'y.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    href: "/wyceny",
    label: "Wyceny",
    opis:
      "Tutaj sprawdzisz zapytania ofertowe od klientow, ich status oraz szczegoly wyceny przygotowanej automatycznie przez system.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <line x1="6" y1="9" x2="6" y2="9.01" />
        <line x1="18" y1="15" x2="18" y2="15.01" />
      </svg>
    ),
  },
  {
    href: "/dokumentacja",
    label: "Opracowanie dokumentacji",
    opis:
      "Tutaj wysylasz rysunki techniczne do sztucznej inteligencji, ktora policzy zapotrzebowanie materialowe, przygotuje kosztorys i pozwoli wyslac zapytanie do dostawcow.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    ),
  },
  {
    href: "/magazyn",
    label: "Magazyn",
    opis:
      "Tutaj zrobisz telefonem zdjecie dokumentu dostawy, a sztuczna inteligencja sama odczyta dostawce i doda ksztaltowniki do stanu magazynowego.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-6 9 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="3 9 12 15 21 9" />
      </svg>
    ),
  },
  {
    href: "/produkcja",
    label: "Produkcja",
    opis:
      "Tutaj zarzadzasz zleceniami produkcyjnymi: klient, nazwa detalu, ilosc sztuk, rodzaj powloki i terminy. Mozesz tez edytowac kazde zlecenie.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.32.44.55.79.63a1.65 1.65 0 0 0 .81.06V9.51A2 2 0 0 1 21 12v0a2 2 0 0 1-1.6 1.51z" />
      </svg>
    ),
  },
];

type Me = { email: string; rola: string; imie_nazwisko: string };

// Wybiera preferowany glos kobiecy dla jezyka polskiego (heurystyka po nazwie glosu -
// przegladarki nie udostepniaja jednoznacznej plci, wiec dopasowujemy popularne polskie
// imiona zenskie uzywane w silnikach TTS oraz slowo "female").
function wybierzGlosKobiecy(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const polskie = voices.filter((v) => v.lang?.toLowerCase().startsWith("pl"));
  const wzorzecKobiecy = /female|kobiet|zofia|paulina|ewa|agnieszka|zosia|magda/i;
  const polskaKobieta = polskie.find((v) => wzorzecKobiecy.test(v.name));
  if (polskaKobieta) return polskaKobieta;
  if (polskie.length > 0) return polskie[0];
  const jakakolwiekKobieta = voices.find((v) => wzorzecKobiecy.test(v.name));
  return jakakolwiekKobieta || voices[0] || null;
}

export default function MobileNavGrid({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [mowiHref, setMowiHref] = useState<string | null>(null);
  const glosyRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  // Wczytaj dostepne glosy syntezatora mowy (na niektorych przegladarkach ladujja sie asynchronicznie).
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const wczytaj = () => {
      glosyRef.current = window.speechSynthesis.getVoices();
    };
    wczytaj();
    window.speechSynthesis.addEventListener("voiceschanged", wczytaj);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", wczytaj);
      window.speechSynthesis.cancel();
    };
  }, []);

  const odczytajOpis = (e: React.MouseEvent, href: string, opis: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (mowiHref === href) {
      window.speechSynthesis.cancel();
      setMowiHref(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(opis);
    utter.lang = "pl-PL";
    utter.rate = 1;
    utter.pitch = 1.05;
    const glos = wybierzGlosKobiecy(glosyRef.current.length ? glosyRef.current : window.speechSynthesis.getVoices());
    if (glos) utter.voice = glos;
    utter.onstart = () => setMowiHref(href);
    utter.onend = () => setMowiHref(null);
    utter.onerror = () => setMowiHref(null);
    window.speechSynthesis.speak(utter);
  };

  const wyloguj = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="h-full bg-gillmet-navy text-white flex flex-col">
      <div className="grid grid-cols-1 gap-3 p-4 flex-1 content-start">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
          const mowi = mowiHref === item.href;
          return (
            <div
              key={item.href}
              className={`flex items-center gap-2 rounded-xl transition-colors ${
                active ? "bg-gillmet-accent text-gillmet-navy font-semibold" : "bg-white/10 text-white"
              }`}
            >
              <Link href={item.href} onClick={onNavigate} className="flex-1 flex items-center gap-4 px-4 py-4 min-w-0">
                {item.icon}
                <span className="text-base leading-tight">{item.label}</span>
              </Link>
              <button
                onClick={(e) => odczytajOpis(e, item.href, item.opis)}
                aria-label={`Odsluchaj opis zakladki ${item.label}`}
                className={`shrink-0 w-9 h-9 mr-3 rounded-full flex items-center justify-center text-sm font-semibold border transition-colors ${
                  active
                    ? "border-gillmet-navy/30 text-gillmet-navy"
                    : "border-white/30 text-white/80 active:bg-white/20"
                } ${mowi ? "animate-pulse ring-2 ring-white/60" : ""}`}
              >
                {mowi ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                  </svg>
                ) : (
                  "?"
                )}
              </button>
            </div>
          );
        })}
      </div>

      {me && (
        <div className="px-5 py-4 border-t border-white/10 text-xs">
          <div className="text-white/90 font-medium">{me.imie_nazwisko || me.email}</div>
          <div className="text-white/40">{me.rola}</div>
          <button onClick={wyloguj} className="mt-2 text-white/60 hover:text-white underline">
            Wyloguj
          </button>
        </div>
      )}
    </div>
  );
}
