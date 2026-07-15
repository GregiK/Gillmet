"use client";

import { useCallback, useState } from "react";
import {
  createZlecenie,
  getBom,
  importDokumentacja,
  runOptymalizacja,
  type PozycjaBom,
  type WynikOptymalizacji,
} from "@/lib/api";

export default function DokumentacjaPage() {
  const [zlecenieId, setZlecenieId] = useState("");
  const [nazwaZlecenia, setNazwaZlecenia] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [bom, setBom] = useState<PozycjaBom[]>([]);
  const [wyniki, setWyniki] = useState<WynikOptymalizacji[]>([]);
  const [busy, setBusy] = useState(false);

  const utworzZlecenie = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = (await createZlecenie({ nazwa: nazwaZlecenia || "Nowe zlecenie", status: "nowe" })) as {
        zlecenie_id: string;
      };
      setZlecenieId(res.zlecenie_id);
      setStatus(`Utworzono zlecenie ${res.zlecenie_id}.`);
    } catch (e) {
      setStatus(`Blad tworzenia zlecenia: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }, [nazwaZlecenia]);

  const wyslijPliki = useCallback(async () => {
    if (!zlecenieId) {
      setStatus("Najpierw utworz lub wpisz numer zlecenia.");
      return;
    }
    if (files.length === 0) {
      setStatus("Wybierz przynajmniej jeden plik PDF/DXF.");
      return;
    }
    if (files.length > 10) {
      setStatus("Maksymalnie 10 plikow na raz.");
      return;
    }
    setBusy(true);
    setStatus("Wysylanie plikow do AI (ekstrakcja BOM)...");
    try {
      await importDokumentacja(zlecenieId, files);
      setStatus(
        "Pliki przyjete. AI przetwarza je w tle (ekstrakcja profili, gatunkow, dlugosci i ilosci). Kliknij 'Odswiez BOM' za chwile."
      );
    } catch (e) {
      setStatus(`Blad wysylki: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }, [zlecenieId, files]);

  const odswiezBom = useCallback(async () => {
    if (!zlecenieId) return;
    setBusy(true);
    try {
      const res = await getBom(zlecenieId);
      setBom(res.pozycje_bom || []);
      setStatus(`Pobrano ${res.pozycje_bom?.length || 0} pozycji BOM.`);
    } catch (e) {
      setStatus(`Blad pobierania BOM: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }, [zlecenieId]);

  const uruchomOptymalizacje = useCallback(async () => {
    if (!zlecenieId) return;
    setBusy(true);
    setStatus("Liczenie optymalizacji ciecia (6m/12m)...");
    try {
      const res = await runOptymalizacja(zlecenieId);
      setWyniki(res.wyniki_optymalizacji || []);
      setStatus("Optymalizacja gotowa.");
    } catch (e) {
      setStatus(`Blad optymalizacji: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }, [zlecenieId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gillmet-navy">Opracowanie dokumentacji</h1>
        <p className="text-sm text-gray-500 mt-1">
          Wgraj do 10 rysunkow technicznych (PDF lub DXF) - AI (OpenRouter, model Claude) wyodrebni z nich
          zapotrzebowanie materialowe (BOM): profile, gatunek stali (domyslnie S235, jesli nie podano inaczej),
          dlugosci i ilosci. Dane nie sa zmyslane - jesli AI nie jest pewne wartosci, zaznacza to w uwagach zamiast
          zgadywac.
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Nazwa nowego zlecenia</label>
            <input
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64"
              value={nazwaZlecenia}
              onChange={(e) => setNazwaZlecenia(e.target.value)}
              placeholder="np. Wspornik montazowy WS-440"
            />
          </div>
          <button
            onClick={utworzZlecenie}
            disabled={busy}
            className="bg-gillmet-navy text-white text-sm px-4 py-2 rounded-md disabled:opacity-50"
          >
            Utworz nowe zlecenie
          </button>
          <div className="text-gray-400 text-sm">lub</div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Numer istniejacego zlecenia</label>
            <input
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64"
              value={zlecenieId}
              onChange={(e) => setZlecenieId(e.target.value)}
              placeholder="ZP-..."
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <label className="text-xs text-gray-500 block">Rysunki techniczne (PDF / DXF, maks. 10 plikow)</label>
          <input
            type="file"
            multiple
            accept=".pdf,.dxf,.dwg,.txt"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="text-sm"
          />
          {files.length > 0 && (
            <div className="text-xs text-gray-500">Wybrano: {files.map((f) => f.name).join(", ")}</div>
          )}
          <button
            onClick={wyslijPliki}
            disabled={busy}
            className="bg-gillmet-accent text-gillmet-navy font-semibold text-sm px-4 py-2 rounded-md disabled:opacity-50"
          >
            Wyslij do AI - policz zapotrzebowanie materialu
          </button>
        </div>

        {status && <div className="text-sm text-gray-700 bg-gray-50 rounded-md p-3">{status}</div>}
      </div>

      <div className="flex gap-3">
        <button onClick={odswiezBom} disabled={busy || !zlecenieId} className="text-sm underline text-gillmet-steel disabled:opacity-40">
          Odswiez BOM
        </button>
        <button
          onClick={uruchomOptymalizacje}
          disabled={busy || !zlecenieId}
          className="text-sm underline text-gillmet-steel disabled:opacity-40"
        >
          Policz optymalizacje ciecia (6m/12m)
        </button>
      </div>

      {bom.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm">Zestawienie materialowe (BOM)</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2">Profil</th>
                <th className="text-left px-4 py-2">Gatunek</th>
                <th className="text-left px-4 py-2">Dlugosc [mm]</th>
                <th className="text-left px-4 py-2">Ilosc</th>
                <th className="text-left px-4 py-2">Zrodlo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bom.map((b) => (
                <tr key={b.pozycja_id}>
                  <td className="px-4 py-2 font-medium">{b.profil}</td>
                  <td className="px-4 py-2">{b.gatunek}</td>
                  <td className="px-4 py-2">{b.dlugosc_mm}</td>
                  <td className="px-4 py-2">{b.ilosc}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{b.zrodlo_pliku}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {wyniki.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm">
            Optymalizacja ciecia (pret 6m vs 12m)
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2">Profil</th>
                <th className="text-left px-4 py-2">Gatunek</th>
                <th className="text-left px-4 py-2">Pretow 6m</th>
                <th className="text-left px-4 py-2">Pretow 12m</th>
                <th className="text-left px-4 py-2">Odpad %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {wyniki.map((w) => (
                <tr key={w.wynik_id}>
                  <td className="px-4 py-2 font-medium">{w.profil}</td>
                  <td className="px-4 py-2">{w.gatunek}</td>
                  <td className="px-4 py-2">{w.pret_6m_szt}</td>
                  <td className="px-4 py-2">{w.pret_12m_szt}</td>
                  <td className="px-4 py-2">{w.odpad_proc}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
