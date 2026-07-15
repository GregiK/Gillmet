"use client";

import { useEffect, useState } from "react";
import { getZlecenia, type Zlecenie } from "@/lib/api";

export default function MagazynPage() {
  const [zlecenia, setZlecenia] = useState<Zlecenie[]>([]);

  useEffect(() => {
    getZlecenia()
      .then((r) => setZlecenia(r.zlecenia || []))
      .catch(() => setZlecenia([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gillmet-navy">Magazyn</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ta zakladka jest przygotowana strukturalnie, ale jeszcze nie polaczona z realnym stanem magazynowym -
          nie chcemy pokazywac zmyslonych ilosci materialu. Nastepny krok: podlaczenie faktycznego zrodla danych
          (np. arkusz stanow magazynowych, system ERP lub reczne wprowadzanie przyjec/wydan).
        </p>
      </div>

      <div className="card p-5 space-y-3">
        <div className="text-sm font-medium text-gillmet-navy">Rekomendowany nastepny krok</div>
        <p className="text-sm text-gray-600">
          Do pelnej integracji Magazynu potrzebne jest jedno z: (1) dostep do arkusza / systemu, w ktorym
          prowadzicie stany kształtownikow i blach, (2) reczne wprowadzenie stanow poczatkowych do nowej tabeli
          n8n (np. `stany_magazynowe`: profil, gatunek, dlugosc_mm, ilosc_szt, lokalizacja), albo (3) integracja
          z dostawca (np. automatyczne pobieranie potwierdzen zamowien).
        </p>
        <p className="text-sm text-gray-600">
          Po wskazaniu zrodla danych mozna od razu polaczyc go z wynikami optymalizacji ciecia z zakladki
          &quot;Opracowanie dokumentacji&quot;, aby automatycznie sprawdzac czy potrzebne pretu 6m/12m sa juz na stanie.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm">
          Zapotrzebowanie z aktywnych zlecen (odczyt informacyjny)
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-2">Zlecenie</th>
              <th className="text-left px-4 py-2">Gatunek</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {zlecenia.map((z) => (
              <tr key={z.zlecenie_id}>
                <td className="px-4 py-2 font-medium">{z.zlecenie_id}</td>
                <td className="px-4 py-2">{z.material_gatunek}</td>
                <td className="px-4 py-2">
                  <span className="badge bg-gray-100 text-gray-700">{z.status}</span>
                </td>
              </tr>
            ))}
            {zlecenia.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-sm">
                  Brak danych.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
