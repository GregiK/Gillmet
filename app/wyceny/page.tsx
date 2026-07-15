"use client";

import { useEffect, useState } from "react";
import { getWyceny, type Wycena } from "@/lib/api";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  oczekuje: { label: "Oczekuje na weryfikacje", className: "bg-amber-100 text-amber-800" },
  zatwierdzona: { label: "Zatwierdzona", className: "bg-emerald-100 text-emerald-800" },
  odrzucona: { label: "Odrzucona", className: "bg-red-100 text-red-800" },
};

export default function WycenyPage() {
  const [wyceny, setWyceny] = useState<Wycena[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getWyceny()
      .then((r) => setWyceny(r.wyceny || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gillmet-navy">Wyceny</h1>
        <p className="text-sm text-gray-500 mt-1">
          Wyceny wygenerowane automatycznie z zapytan klientow (email / formularz), oczekujace na weryfikacje
          glownego technologa lub juz zatwierdzone/odrzucone. Zrodlo: n8n workflow Steel_Inquiry_Automation.
        </p>
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
        <div className="card overflow-hidden">
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
                  <tr key={w.quote_id} className="hover:bg-gray-50">
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
      )}

      <div className="card p-4 text-xs text-gray-500 bg-gray-50">
        Zatwierdzanie/odrzucanie wycen odbywa sie z poziomu maila do glownego technologa (link jednokrotnego
        dzialania) - to zapewnia kontrole &quot;human-in-the-loop&quot; przed wyslaniem oferty do klienta. Ten widok jest
        podgladem statusu, nie edytorem.
      </div>
    </div>
  );
}
