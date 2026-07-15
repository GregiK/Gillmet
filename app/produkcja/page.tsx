"use client";

import { useEffect, useState } from "react";
import { deleteZlecenie, getZlecenia, type Zlecenie } from "@/lib/api";

const STATUS_OPTIONS = ["nowe", "w_realizacji", "wstrzymane", "zakonczone"];

export default function ProdukcjaPage() {
  const [zlecenia, setZlecenia] = useState<Zlecenie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = () => {
    setLoading(true);
    getZlecenia()
      .then((r) => setZlecenia(r.zlecenia || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const usun = async (id: string) => {
    if (!confirm(`Usunac zlecenie ${id}? Tej operacji nie mozna cofnac.`)) return;
    await deleteZlecenie(id);
    load();
  };

  const widoczne = filter === "all" ? zlecenia : zlecenia.filter((z) => z.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gillmet-navy">Produkcja</h1>
        <p className="text-sm text-gray-500 mt-1">
          Rejestr zlecen produkcyjnych - ogolny przeglad statusow. Kazde zlecenie moze byc powiazane z wycena i
          zestawieniem BOM z zakladki Opracowanie dokumentacji.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs px-3 py-1.5 rounded-full border ${filter === "all" ? "bg-gillmet-navy text-white border-gillmet-navy" : "border-gray-300 text-gray-600"}`}
        >
          Wszystkie
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border ${filter === s ? "bg-gillmet-navy text-white border-gillmet-navy" : "border-gray-300 text-gray-600"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && <div className="card p-6 text-sm text-gray-500">Ladowanie zlecen...</div>}
      {error && <div className="card p-6 text-sm text-red-600">Blad: {error}</div>}

      {!loading && !error && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Zlecenie</th>
                <th className="text-left px-4 py-3">Klient</th>
                <th className="text-left px-4 py-3">Gatunek</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Wartosc netto</th>
                <th className="text-left px-4 py-3">Deadline</th>
                <th className="text-right px-4 py-3">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {widoczne.map((z) => (
                <tr key={z.zlecenie_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gillmet-navy">{z.zlecenie_id}</td>
                  <td className="px-4 py-3">{z.nazwa}</td>
                  <td className="px-4 py-3">{z.material_gatunek}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-gray-100 text-gray-700">{z.status}</span>
                  </td>
                  <td className="px-4 py-3">{z.wartosc_netto ? `${z.wartosc_netto.toLocaleString("pl-PL")} zl` : "-"}</td>
                  <td className="px-4 py-3">{z.deadline || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => usun(z.zlecenie_id)} className="text-red-600 text-xs hover:underline">
                      Usun
                    </button>
                  </td>
                </tr>
              ))}
              {widoczne.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">
                    Brak zlecen w tym filtrze.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
