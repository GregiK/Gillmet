"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteDostawaMagazynowa, getMagazyn, skanujDostawe, type DostawaMagazynowa } from "@/lib/api";
import VoiceInput from "@/components/VoiceInput";

export default function MagazynPage() {
  const [dostawy, setDostawy] = useState<DostawaMagazynowa[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [uwagi, setUwagi] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const odswiez = useCallback(() => {
    setLoading(true);
    getMagazyn()
      .then((r) => setDostawy(r.dostawy || []))
      .catch((e) => setStatus(`Blad pobierania magazynu: ${(e as Error).message}`))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    odswiez();
  }, [odswiez]);

  const wyslijSkan = useCallback(async () => {
    if (files.length === 0) {
      setStatus("Wybierz lub sfotografuj dokument dostawy (WZ / fakture).");
      return;
    }
    setBusy(true);
    setStatus("Wysylanie do AI - odczyt dostawcy, profili i ilosci...");
    try {
      await skanujDostawe(files, uwagi);
      setStatus(
        'Skan przyjety. AI odczytuje dokument w tle (moze to potrwac do minuty przy wiekszych zdjeciach) - kliknij "Odswiez" za chwile.'
      );
      setFiles([]);
      setUwagi("");
    } catch (e) {
      setStatus(`Blad wysylki skanu: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }, [files, uwagi]);

  const usunPozycje = async (id: string) => {
    if (!confirm("Usunac te pozycje dostawy z magazynu?")) return;
    await deleteDostawaMagazynowa(id);
    setDostawy((d) => d.filter((x) => x.pozycja_id !== id));
  };

  const stanMagazynowy = useMemo(() => {
    const mapa = new Map<string, { profil: string; gatunek: string; ilosc: number; jednostka: string }>();
    for (const d of dostawy) {
      const klucz = `${d.profil}__${d.gatunek}__${d.jednostka}`;
      const istniejacy = mapa.get(klucz);
      if (istniejacy) {
        istniejacy.ilosc += Number(d.ilosc) || 0;
      } else {
        mapa.set(klucz, { profil: d.profil, gatunek: d.gatunek, ilosc: Number(d.ilosc) || 0, jednostka: d.jednostka });
      }
    }
    return Array.from(mapa.values()).sort((a, b) => a.profil.localeCompare(b.profil));
  }, [dostawy]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gillmet-navy">Magazyn</h1>
      </div>

      <div className="card p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-gray-500 block">Zdjecie / skan dokumentu dostawy (WZ, faktura)</label>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            capture="environment"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="text-sm"
          />
          <div className="text-[11px] text-gray-400">
            Na telefonie ten przycisk otworzy aparat. Na komputerze mozesz wybrac plik ze zdjeciem lub skanem PDF.
          </div>
          {files.length > 0 && (
            <div className="text-xs text-gray-500">Wybrano: {files.map((f) => f.name).join(", ")}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
            placeholder="Uwagi (opcjonalnie, np. nazwa hurtowni jesli nie jest widoczna na zdjeciu) - lub podyktuj"
            value={uwagi}
            onChange={(e) => setUwagi(e.target.value)}
          />
          <VoiceInput onResult={(t) => setUwagi((prev) => (prev ? `${prev} ${t}` : t))} />
        </div>
        <button
          onClick={wyslijSkan}
          disabled={busy}
          className="w-full sm:w-auto bg-gillmet-accent text-gillmet-navy font-semibold text-sm px-4 py-2 rounded-md disabled:opacity-50"
        >
          Wyslij do AI - odczytaj dostawe
        </button>
        {status && <div className="text-sm text-gray-700 bg-gray-50 rounded-md p-3">{status}</div>}
      </div>

      <div className="flex gap-3">
        <button onClick={odswiez} className="text-sm underline text-gillmet-steel">
          Odswiez
        </button>
      </div>

      {loading && <div className="card p-6 text-sm text-gray-500">Ladowanie magazynu...</div>}

      {!loading && stanMagazynowy.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm">
            Stan magazynowy (suma dostaw wedlug profilu)
          </div>

          {/* Karty - telefon */}
          <div className="md:hidden divide-y divide-gray-100">
            {stanMagazynowy.map((s) => (
              <div key={`${s.profil}-${s.gatunek}-${s.jednostka}`} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.profil}</div>
                  <div className="text-xs text-gray-400">{s.gatunek}</div>
                </div>
                <div className="text-sm font-medium text-gillmet-navy">
                  {s.ilosc} {s.jednostka}
                </div>
              </div>
            ))}
          </div>

          {/* Tabela - tablet/desktop */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2">Profil</th>
                  <th className="text-left px-4 py-2">Gatunek</th>
                  <th className="text-left px-4 py-2">Ilosc</th>
                  <th className="text-left px-4 py-2">Jednostka</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stanMagazynowy.map((s) => (
                  <tr key={`${s.profil}-${s.gatunek}-${s.jednostka}`}>
                    <td className="px-4 py-2 font-medium">{s.profil}</td>
                    <td className="px-4 py-2">{s.gatunek}</td>
                    <td className="px-4 py-2">{s.ilosc}</td>
                    <td className="px-4 py-2">{s.jednostka}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && dostawy.length === 0 && (
        <div className="card p-6 text-sm text-gray-500">
          Brak dostaw w magazynie. Zeskanuj pierwszy dokument dostawy powyzej.
        </div>
      )}

      {!loading && dostawy.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm">Historia dostaw</div>

          {/* Karty - telefon */}
          <div className="md:hidden divide-y divide-gray-100">
            {dostawy.map((d) => (
              <div key={d.pozycja_id} className="px-4 py-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium">{d.profil}</div>
                  <div className="text-sm text-gillmet-navy font-medium shrink-0">
                    {d.ilosc} {d.jednostka}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {d.gatunek} - {d.dlugosc_mm ? `${d.dlugosc_mm} mm` : "dlugosc nieznana"}
                </div>
                <div className="text-xs text-gray-400">
                  {d.dostawca || "Dostawca nieznany"} {d.numer_dokumentu ? `- ${d.numer_dokumentu}` : ""}
                  {d.data_dostawy ? ` - ${d.data_dostawy}` : ""}
                </div>
                {d.uwagi && <div className="text-xs text-gray-400 italic">{d.uwagi}</div>}
                <button onClick={() => usunPozycje(d.pozycja_id)} className="text-red-600 text-xs hover:underline pt-1">
                  Usun
                </button>
              </div>
            ))}
          </div>

          {/* Tabela - tablet/desktop */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2">Data</th>
                  <th className="text-left px-4 py-2">Dostawca</th>
                  <th className="text-left px-4 py-2">Dokument</th>
                  <th className="text-left px-4 py-2">Profil</th>
                  <th className="text-left px-4 py-2">Gatunek</th>
                  <th className="text-left px-4 py-2">Dlugosc [mm]</th>
                  <th className="text-left px-4 py-2">Ilosc</th>
                  <th className="text-left px-4 py-2">Uwagi</th>
                  <th className="text-right px-4 py-2">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dostawy.map((d) => (
                  <tr key={d.pozycja_id}>
                    <td className="px-4 py-2 text-gray-500">{d.data_dostawy || "-"}</td>
                    <td className="px-4 py-2">{d.dostawca || "-"}</td>
                    <td className="px-4 py-2 text-gray-500">{d.numer_dokumentu || "-"}</td>
                    <td className="px-4 py-2 font-medium">{d.profil}</td>
                    <td className="px-4 py-2">{d.gatunek}</td>
                    <td className="px-4 py-2">{d.dlugosc_mm || "-"}</td>
                    <td className="px-4 py-2">
                      {d.ilosc} {d.jednostka}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-400">{d.uwagi || "-"}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => usunPozycje(d.pozycja_id)} className="text-red-600 text-xs hover:underline">
                        Usun
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
