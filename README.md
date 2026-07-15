# Gillmet MES Dashboard

Panel produkcyjny dla Gillmet (konstrukcje stalowe S235 / S355). Cztery zakładki: **Wyceny**, **Opracowanie
dokumentacji**, **Magazyn**, **Produkcja**.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS
- Backend: n8n workflow `Gillmet_MES_Dashboard_API` (Data Tables jako baza danych, webhooki jako REST API)

## Uruchomienie lokalne

```bash
npm install
cp .env.example .env.local
npm run dev
```

Aplikacja domyślnie łączy się z backendem pod `https://automatyzacja.zabawkijuniora.pl/webhook`. Zmień
`N8N_BASE_URL` w `.env.local`, jeśli backend zostanie przeniesiony na inną domenę.

## Backend / API

Wszystkie dane (zlecenia produkcyjne, BOM, wyniki optymalizacji cięcia, wyceny) są przechowywane w n8n Data
Tables i udostępniane przez webhooki:

| Endpoint | Metoda | Opis |
| --- | --- | --- |
| `/api/zlecenia` | GET | Lista zleceń produkcyjnych |
| `/api/zlecenia` | POST | Utworzenie nowego zlecenia |
| `/api/zlecenia?zlecenie_id=...` | DELETE | Usunięcie zlecenia |
| `/api/bom?zlecenie_id=...` | GET | Pozycje BOM dla zlecenia |
| `/api/bom?pozycja_id=...` | DELETE | Usunięcie pozycji BOM |
| `/api/bom` | PATCH | Aktualizacja ceny jednostkowej pozycji BOM |
| `/api/dokumentacja/import` | POST (multipart) | Import do 100 plików PDF/DXF (wysyłane w paczkach po 10) — AI (OpenRouter) wyodrębnia BOM |
| `/api/dokumentacja/wyslij-oferte` | POST | Wysyłka zapytania ofertowego (pełny BOM) do dostawców e-mailem |
| `/api/optymalizacja` | POST | Optymalizacja cięcia (bin-packing, pręty 6m/12m) dla zlecenia |
| `/api/optymalizacja?wynik_id=...` | DELETE | Usunięcie wyniku optymalizacji |
| `/api/koszty-dodatkowe?zlecenie_id=...` | GET | Dodatkowe pozycje kosztowe zlecenia |
| `/api/koszty-dodatkowe` | POST | Dodanie pozycji kosztowej |
| `/api/koszty-dodatkowe?pozycja_id=...` | DELETE | Usunięcie pozycji kosztowej |
| `/api/zlecenia` | PATCH | Aktualizacja marży zlecenia |
| `/api/auth/register` | POST | Rejestracja bootstrap (działa tylko, gdy nie istnieje jeszcze żaden użytkownik) |
| `/api/auth/login` | POST | Logowanie (weryfikacja hasła, hash+sól SHA-256) |
| `/api/wyceny` | GET | Wyceny z automatyzacji zapytań klientów, status weryfikacji technologa |

## Logowanie i role

Dashboard wymaga zalogowania (middleware chroni wszystkie strony poza `/login`). Sesja to podpisany (HMAC,
`SESSION_SECRET`) cookie ustawiany przez własne endpointy Next.js `/api/auth/login` i `/api/auth/register` — nie
zależy od tabeli n8n `sesje`. Role: `admin` / `technolog` / `kosztorysant` — każda z nich może korygować ceny i
marże bezpośrednio w zakładce **Opracowanie dokumentacji**.

**Pierwsze uruchomienie**: wejdź na `/login`, przełącz na zakładkę "Pierwsza konfiguracja" i utwórz konto — działa
to tylko raz (dopóki tabela `uzytkownicy` jest pusta), więc utwórz od razu docelowe konto administratora.

**WAŻNE**: ustaw zmienną środowiskową `SESSION_SECRET` w Vercel (Project Settings → Environment Variables) na
długi losowy ciąg znaków — bez tego użyty zostanie niebezpieczny sekret domyślny z kodu.

## Narzędzia kosztorysanta (zakładka Opracowanie dokumentacji)

- Edycja ceny jednostkowej każdej pozycji BOM (zapis od razu do bazy).
- Dodatkowe pozycje kosztowe (transport, obróbka powierzchniowa, spawanie zewnętrzne, montaż, inne).
- Kalkulator marży i ceny końcowej (koszt materiału + koszty dodatkowe, marża w %, zapis marży do zlecenia).
- Eksport kosztorysu do Excel (CSV) i do PDF (drukowanie widoku).
- Wysyłka zapytania ofertowego (pełny BOM) do dostawców e-mailem (Gmail), formularz ad-hoc bez bazy dostawców.
- Kasowanie pozycji BOM i wyników optymalizacji cięcia.

Kasowanie całych zleceń dostępne jest w zakładce **Produkcja**.

## AI — import dokumentacji technicznej

Zakładka **Opracowanie dokumentacji** pozwala wgrać jednocześnie do 100 rysunków PDF/DXF (dashboard wysyła je do
backendu automatycznie w paczkach po 10, żeby nie przeciążyć pojedynczego zapytania). Backend:

1. Rozbija paczkę na pojedyncze pliki.
2. Dla PDF — wyodrębnia tekst (`n8n-nodes-base.extractFromFile`, operacja `pdf`).
3. Dla DXF/TXT — wyodrębnia treść jako tekst.
4. Wysyła treść do modelu AI przez OpenRouter z jawną instrukcją: **nie zmyślać** długości/ilości/profili —
   pominąć niepewne pozycje i opisać je w polu `uwagi`. Domyślny gatunek to S235, jeśli nie podano inaczej
   (S235/S355 to główne gatunki używane w Gillmet).
5. Zapisuje wynikowe pozycje do tabeli `pozycje_bom`.
6. Endpoint `/api/optymalizacja` liczy algorytmem First-Fit-Decreasing najlepszy podział na pręty 6m i 12m,
   minimalizując odpad.

## Struktura danych (n8n Data Tables)

- `zlecenia_produkcyjne` — ogólny rejestr zleceń
- `pozycje_bom` — pozycje materiałowe wyodrębnione z dokumentacji
- `wyniki_optymalizacji_ciecia` — wyniki bin-packingu per profil/gatunek
- `dokumentacja_import` — log przetworzonych plików
- `wyceny_do_weryfikacji` — most do istniejącego procesu wycen/zatwierdzania

## Status wdrożenia

Projekt jest przygotowany do wdrożenia na Vercel i wypchnięcia na GitHub. W chwili przygotowania repozytorium
oba te kroki wymagały akcji po stronie właściciela konta (uprawnienia zespołu Vercel do tworzenia projektów;
autoryzacja konektora GitHub) — po ich odblokowaniu wystarczy `git remote add origin ...` i `git push`, oraz
import projektu w Vercel (Framework: Next.js, zmienna środowiskowa `N8N_BASE_URL`).
