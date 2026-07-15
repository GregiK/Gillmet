"use client";

import { useEffect, useState } from "react";
import { getWyceny, type Wycena } from "@/lib/api";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  oczekuje: { label: "Oczekuje na weryfikacje", className: "bg-amber-100 text-amber-800" },
  zatwierdzona: { label: "Zatwierdzona", className: "bg-emerald-100 text-emerald-800" },
  odrzucona: { label: "Odrzucona", className: "bg-red-100 text-red-800" },
};

type DaneZapytania = {
  extracted_data?: {
    client_company?: string;
    material_grade?: string;
    estimated_weight_kg?: number;
    surface_protection?: string;
    quality_requirements?: string[];
    special_requirements?: string[];
    missing_critical_data?: string[];
    detected_language?: string;
    inquiry_quality?: string;
    has_technical_docs?: boolean;
    blad_parsowania?: boolean;
    surowy_tekst?: string;
    [klucz: string]: unknown;
  };
  business_decision?: string;
  escalation_flags?: string[];
  calculator_input?: {
    estimated_min?: number;
    estimated_max?: number;
    price_per_ton?: number;
    valid_until?: string;
    lead_time_days?: number;
    disclaimer?: string;
    source?: string;
    client_summary?: {
      cena_konstrukcja_netto?: number;
      cena_ocynkowanie_netto?: number;
      cena_transport_netto?: number;
      cena_montaz_na_miejscu_netto?: number;
      [klucz: string]: unknown;
    };
    [klucz: string]: unknown;
  } | null;
  has_cad_files?: boolean;
  thread_id?: string;
  [klucz: string]: unknown;
};

function formatPLN(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? `${n.toLocaleString("pl-PL")} zl` : "-";
}

function odznaki(lista: unknown, klasa: string) {
  if (!Array.isArray(lista) || lista.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {lista.map((el, i) => (
        <span key={i} className={`badge ${klasa}`}>
          {String(el)}
        </span>
      ))}
    </div>
  );
}

function SzczegolyWyceny({ wycena, onClose }: { wycena: Wycena; onClose: () => void }) {
  let dane: DaneZapytania | null = null;
  let bladParsowania = false;
  try {
    dane = JSON.parse(wycena.full_payload || "{}");
  } catch {
    bladParsowania = true;
  }
  const s = STATUS_LABEL[wycena.status] || { label: wycena.status, className: "bg-gray-100 text-gray-700" };
  const ed = dane?.extracted_data;
  const kalk = dane?.calculator_input;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full md:max-w-2xl md:rounded-lg rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-medium text-gillmet-navy">{wycena.client_company || "Klient nieznany"}</div>
            <div className="text-xs text-gray-400">{wycena.client_email}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`badge ${s.className}`}>{s.label}</span>
            <button onClick={onClose} className="text-gray-400 text-xl leading-none px-1">
              &times;
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-700">{wycena.email_subject || "-"}</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
          <span>Utworzono: {wycena.created_at ? new Date(wycena.created_at).toLocaleString("pl-PL") : "-"}</span>
          <span>Decyzja: {wycena.decided_at ? new Date(wycena.decided_at).toLocaleString("pl-PL") : "-"}</span>
          <span>ID: {wycena.quote_id}</span>
        </div>

        {bladParsowania && (
          <div className="text-sm text-red-600 bg-red-50 rounded-md p-3">
            Nie udalo sie odczytac struktury danych zapytania - sprawdz surowy tekst ponizej.
          </div>
        )}

        {ed && (
          <div className="border border-gray-200 rounded-md p-4 space-y-2">
            <div className="text-sm font-medium text-gillmet-navy">Zapytanie klienta</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <div>
                <span className="text-gray-400">Material: </span>
                {ed.material_grade || "-"}
              </div>
              <div>
                <span className="text-gray-400">Szac. waga: </span>
                {ed.estimated_weight_kg ? `${ed.estimated_weight_kg} kg` : "-"}
              </div>
              <div>
                <span className="text-gray-400">Powloka: </span>
                {ed.surface_protection || "-"}
              </div>
              <div>
                <span className="text-gray-400">Jezyk zapytania: </span>
                {ed.detected_language || "-"}
              </div>
              <div>
                <span className="text-gray-400">Dokumentacja techniczna: </span>
                {ed.has_technical_docs ? "tak" : "nie"}
              </div>
              <div>
                <span className="text-gray-400">Jakosc zapytania: </span>
                {ed.inquiry_quality || "-"}
              </div>
            </div>
            {odznaki(ed.quality_requirements, "bg-blue-50 text-blue-700") && (
              <div>
                <div className="text-xs text-gray-400 mb-1">Wymagania jakosciowe</div>
                {odznaki(ed.quality_requirements, "bg-blue-50 text-blue-700")}
              </div>
            )}
            {odznaki(ed.special_requirements, "bg-violet-50 text-violet-700") && (
              <div>
                <div className="text-xs text-gray-400 mb-1">Wymagania specjalne</div>
                {odznaki(ed.special_requirements, "bg-violet-50 text-violet-700")}
              </div>
            )}
            {odznaki(ed.missing_critical_data, "bg-amber-50 text-amber-700") && (
              <div>
                <div className="text-xs text-gray-400 mb-1">Brakujace dane</div>
                {odznaki(ed.missing_critical_data, "bg-amber-50 text-amber-700")}
              </div>
            )}
          </div>
        )}

        {kalk && (
          <div className="border border-gray-200 rounded-md p-4 space-y-2">
            <div className="text-sm font-medium text-gillmet-navy">Wycena / kalkulacja</div>
            <div className="text-lg font-semibold text-gillmet-navy">
              {formatPLN(kalk.estimated_min)} - {formatPLN(kalk.estimated_max)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <div>
                <span className="text-gray-400">Cena za tone: </span>
                {formatPLN(kalk.price_per_ton)}
              </div>
              <div>
                <span className="text-gray-400">Termin realizacji: </span>
                {kalk.lead_time_days ? `${kalk.lead_time_days} dni` : "-"}
              </div>
              <div>
                <span className="text-gray-400">Wazna do: </span>
                {kalk.valid_until || "-"}
              </div>
              <div>
                <span className="text-gray-400">Zrodlo kalkulacji: </span>
                {kalk.source || "-"}
              </div>
            </div>
            {kalk.client_summary && (
              <div className="pt-2 border-t border-gray-100 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Konstrukcja</span>
                  <span>{formatPLN(kalk.client_summary.cena_konstrukcja_netto)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ocynkowanie / powloka</span>
                  <span>{formatPLN(kalk.client_summary.cena_ocynkowanie_netto)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transport</span>
                  <span>{formatPLN(kalk.client_summary.cena_transport_netto)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Montaz na miejscu</span>
                  <span>{formatPLN(kalk.client_summary.cena_montaz_na_miejscu_netto)}</span>
                </div>
              </div>
            )}
            {kalk.disclaimer && <div className="text-xs text-gray-400 italic pt-1">{kalk.disclaimer}</div>}
          </div>
        )}

        {odznaki(dane?.escalation_flags, "bg-red-50 text-red-700") && (
          <div>
            <div className="text-xs text-gray-400 mb-1">Flagi eskalacji</div>
            {odznaki(dane?.escalation_flags, "bg-red-50 text-red-700")}
          </div>
        )}

        <details className="text-xs">
          <summary className="cursor-pointer text-gillmet-steel select-none">Pelne dane techniczne (JSON)</summary>
          <pre className="mt-2 bg-gray-50 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words text-[11px] text-gray-600">
            {bladParsowania ? wycena.full_payload : JSON.stringify(dane, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

export default function WycenyPage() {
  const [wyceny, setWyceny] = useState<Wycena[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wybrana, setWybrana] = useState<Wycena | null>(null);

  useEffect(() => {
    getWyceny()
      .then((r) => setWyceny(r.wyceny || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!wybrana) return;
    const poprzedni = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = poprzedni;
    };
  }, [wybrana]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gillmet-navy">Wyceny</h1>
      </div>

      {loading && <div className="card p-6 text-sm text-gray-500">Ladowanie wycen...</div>}
      {error && (
        <div className="card p-6 text-sm text-red-600">
          Nie udalo sie pobrac wycen: {error}. Sprawdz czy backend n8n (Gillmet_MES_Dashboard_API) jest opublikowany.
        </div>
      )}

      {!loading && !error && wyceny.length === 0 && (
        <div className="card p-6 text-sm text-gray-500">Brak wycen w systemie.</div>
      )}

      {!loading && wyceny.length > 0 && (
        <>
          {/* Widok kartowy - telefon */}
          <div className="md:hidden space-y-3">
            {wyceny.map((w) => {
              const s = STATUS_LABEL[w.status] || { label: w.status, className: "bg-gray-100 text-gray-700" };
              return (
                <button
                  key={w.quote_id}
                  onClick={() => setWybrana(w)}
                  className="card p-4 space-y-2 w-full text-left active:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-gillmet-navy">{w.client_company || "-"}</div>
                      <div className="text-xs text-gray-400">{w.client_email}</div>
                    </div>
                    <span className={`badge shrink-0 ${s.className}`}>{s.label}</span>
                  </div>
                  <div className="text-sm text-gray-600">{w.email_subject || "-"}</div>
                  <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                    <span>Utworzono: {w.created_at ? new Date(w.created_at).toLocaleDateString("pl-PL") : "-"}</span>
                    <span>Decyzja: {w.decided_at ? new Date(w.decided_at).toLocaleDateString("pl-PL") : "-"}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Widok tabelaryczny - tablet/desktop */}
          <div className="card overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3">Klient</th>
                    <th className="text-left px-4 py-3">Temat zapytania</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Utworzono</th>
                    <th className="text-left px-4 py-3">Decyzja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {wyceny.map((w) => {
                    const s = STATUS_LABEL[w.status] || { label: w.status, className: "bg-gray-100 text-gray-700" };
                    return (
                      <tr
                        key={w.quote_id}
                        onClick={() => setWybrana(w)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gillmet-navy">{w.client_company || "-"}</div>
                          <div className="text-xs text-gray-400">{w.client_email}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{w.email_subject || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${s.className}`}>{s.label}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {w.created_at ? new Date(w.created_at).toLocaleString("pl-PL") : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {w.decided_at ? new Date(w.decided_at).toLocaleString("pl-PL") : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="card p-4 text-xs text-gray-500 bg-gray-50">
        Zatwierdzanie/odrzucanie wycen odbywa sie z poziomu maila do glownego technologa (link jednokrotnego
        dzialania) - to zapewnia kontrole &quot;human-in-the-loop&quot; przed wyslaniem oferty do klienta. Kliknij
        wycene ponizej, aby zobaczyc pelna trasc zapytania.
      </div>

      {wybrana && <SzczegolyWyceny wycena={wybrana} onClose={() => setWybrana(null)} />}
    </div>
  );
}
