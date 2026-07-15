// Klient API dla backendu n8n (Gillmet_MES_Dashboard_API).
// Adres bazowy konfigurowany przez zmienna srodowiskowa N8N_BASE_URL.

const BASE_URL = process.env.NEXT_PUBLIC_N8N_BASE_URL || process.env.N8N_BASE_URL || "https://automatyzacja.zabawkijuniora.pl/webhook";

export type Zlecenie = {
  zlecenie_id: string;
  nazwa: string;
  klient: string;
  status: string;
  material_gatunek: string;
  data_utworzenia: string;
  deadline: string;
  wartosc_netto: number;
  powiazana_wycena_id: string;
  notatki: string;
  marza_procent?: number;
  ilosc_sztuk?: number;
  rodzaj_powloki?: string;
  elementy_zlozeniowe?: string;
  data_zakonczenia?: string;
};

export type PozycjaBom = {
  pozycja_id: string;
  zlecenie_id: string;
  profil: string;
  gatunek: string;
  dlugosc_mm: number;
  ilosc: number;
  zrodlo_pliku: string;
  cena_jednostkowa?: number;
};

export type WynikOptymalizacji = {
  wynik_id: string;
  zlecenie_id: string;
  profil: string;
  gatunek: string;
  pret_6m_szt: number;
  pret_12m_szt: number;
  odpad_proc: number;
  szczegoly_ciecia: string;
};

export type Wycena = {
  quote_id: string;
  thread_id: string;
  client_email: string;
  client_company: string;
  email_subject: string;
  status: string;
  created_at: string;
  decided_at: string;
  full_payload: string;
};

export type KosztDodatkowy = {
  pozycja_id: string;
  zlecenie_id: string;
  kategoria: string;
  opis: string;
  ilosc: number;
  jednostka: string;
  cena_jednostkowa: number;
  dodano_przez: string;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Blad API ${path}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getZlecenia(): Promise<{ zlecenia: Zlecenie[] }> {
  return apiFetch("/api/zlecenia");
}

export async function createZlecenie(payload: Partial<Zlecenie>) {
  return apiFetch("/api/zlecenia", { method: "POST", body: JSON.stringify(payload) });
}

export async function deleteZlecenie(zlecenieId: string) {
  return apiFetch(`/api/zlecenia?zlecenie_id=${encodeURIComponent(zlecenieId)}`, { method: "DELETE" });
}

export async function updateMarzaZlecenia(zlecenieId: string, marzaProcent: number) {
  return apiFetch("/api/zlecenia", {
    method: "PATCH",
    body: JSON.stringify({ zlecenie_id: zlecenieId, marza_procent: marzaProcent }),
  });
}

export async function updateZlecenie(zlecenieId: string, payload: Partial<Zlecenie>) {
  return apiFetch("/api/zlecenia", {
    method: "PATCH",
    body: JSON.stringify({ ...payload, zlecenie_id: zlecenieId }),
  });
}

export async function getBom(zlecenieId: string): Promise<{ pozycje_bom: PozycjaBom[] }> {
  return apiFetch(`/api/bom?zlecenie_id=${encodeURIComponent(zlecenieId)}`);
}

export async function deleteBomPozycja(pozycjaId: string) {
  return apiFetch(`/api/bom?pozycja_id=${encodeURIComponent(pozycjaId)}`, { method: "DELETE" });
}

export async function updateCenaBom(pozycjaId: string, cenaJednostkowa: number) {
  return apiFetch("/api/bom", {
    method: "PATCH",
    body: JSON.stringify({ pozycja_id: pozycjaId, cena_jednostkowa: cenaJednostkowa }),
  });
}

export async function runOptymalizacja(zlecenieId: string): Promise<{ wyniki_optymalizacji: WynikOptymalizacji[] }> {
  return apiFetch("/api/optymalizacja", { method: "POST", body: JSON.stringify({ zlecenie_id: zlecenieId }) });
}

export async function deleteWynikOptymalizacji(wynikId: string) {
  return apiFetch(`/api/optymalizacja?wynik_id=${encodeURIComponent(wynikId)}`, { method: "DELETE" });
}

export async function getWyceny(): Promise<{ wyceny: Wycena[] }> {
  return apiFetch("/api/wyceny");
}

export async function importDokumentacja(zlecenieId: string, files: File[]) {
  const form = new FormData();
  form.append("zlecenie_id", zlecenieId);
  files.forEach((f, i) => form.append(`data${i}`, f, f.name));
  const res = await fetch(`${BASE_URL}/api/dokumentacja/import`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Blad importu dokumentacji: ${res.status}`);
  return res.json();
}

export async function getKosztyDodatkowe(zlecenieId: string): Promise<{ koszty_dodatkowe: KosztDodatkowy[] }> {
  return apiFetch(`/api/koszty-dodatkowe?zlecenie_id=${encodeURIComponent(zlecenieId)}`);
}

export async function addKosztDodatkowy(payload: Omit<KosztDodatkowy, "pozycja_id">) {
  return apiFetch("/api/koszty-dodatkowe", { method: "POST", body: JSON.stringify(payload) });
}

export async function deleteKosztDodatkowy(pozycjaId: string) {
  return apiFetch(`/api/koszty-dodatkowe?pozycja_id=${encodeURIComponent(pozycjaId)}`, { method: "DELETE" });
}

export async function wyslijOferteDoDostawcow(payload: {
  zlecenie_id: string;
  dostawca_email: string;
  wiadomosc?: string;
}) {
  return apiFetch("/api/dokumentacja/wyslij-oferte", { method: "POST", body: JSON.stringify(payload) });
}

export type DostawaMagazynowa = {
  dostawa_id: string;
  pozycja_id: string;
  data_dostawy: string;
  dostawca: string;
  numer_dokumentu: string;
  profil: string;
  gatunek: string;
  dlugosc_mm: number;
  ilosc: number;
  jednostka: string;
  zrodlo_pliku: string;
  uwagi: string;
  dodano_kiedy: string;
};

export async function getMagazyn(): Promise<{ dostawy: DostawaMagazynowa[] }> {
  return apiFetch("/api/magazyn");
}

export async function deleteDostawaMagazynowa(pozycjaId: string) {
  return apiFetch(`/api/magazyn?pozycja_id=${encodeURIComponent(pozycjaId)}`, { method: "DELETE" });
}

export async function skanujDostawe(files: File[], uwagi?: string) {
  const form = new FormData();
  if (uwagi) form.append("uwagi", uwagi);
  files.forEach((f, i) => form.append(`data${i}`, f, f.name));
  const res = await fetch(`${BASE_URL}/api/magazyn/skan`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Blad skanowania dostawy: ${res.status}`);
  return res.json();
}
