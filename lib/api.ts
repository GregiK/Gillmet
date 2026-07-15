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
};

export type PozycjaBom = {
  pozycja_id: string;
  zlecenie_id: string;
  profil: string;
  gatunek: string;
  dlugosc_mm: number;
  ilosc: number;
  zrodlo_pliku: string;
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

export async function getBom(zlecenieId: string): Promise<{ pozycje_bom: PozycjaBom[] }> {
  return apiFetch(`/api/bom?zlecenie_id=${encodeURIComponent(zlecenieId)}`);
}

export async function runOptymalizacja(zlecenieId: string): Promise<{ wyniki_optymalizacji: WynikOptymalizacji[] }> {
  return apiFetch("/api/optymalizacja", { method: "POST", body: JSON.stringify({ zlecenie_id: zlecenieId }) });
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
