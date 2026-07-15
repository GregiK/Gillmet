"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addKosztDodatkowy,
  createZlecenie,
  deleteBomPozycja,
  deleteKosztDodatkowy,
  deleteWynikOptymalizacji,
  getBom,
  getKosztyDodatkowe,
  getZlecenia,
  importDokumentacja,
  runOptymalizacja,
  updateCenaBom,
  updateMarzaZlecenia,
  wyslijOferteDoDostawcow,
  type KosztDodatkowy,
  type PozycjaBom,
  type WynikOptymalizacji,
  type Zlecenie,
} from "@/lib/api";

const KATEGORIE_KOSZTOW = ["transport", "obrobka_powierzchniowa", "spawanie_zewnetrzne", "montaz", "inne"];

export default function DokumentacjaPage() {
  const [zlecenieId, setZlecenieId] = useState("");
  const [nazwaZlecenia, setNazwaZlecenia] = useState("");
  const [zlecenie, setZlecenie] = useState<Zlecenie | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [bom, setBom] = useState<PozycjaBom[]>([]);
  const [wyniki, setWyniki] = useState<WynikOptymalizacji[]>([]);
  const [kosztyDodatkowe, setKosztyDodatkowe] = useState<KosztDodatkowy[]>([]);
  const [busy, setBusy] = useState(false);

  const [marza, setMarza] = useState<number>(20);
  const [nowyKoszt, setNowyKoszt] = useState({
    kategoria: "transport",
    opis: "",
    ilosc: 1,
    jednostka: "kpl",
    cena_jednostkowa: 0,
  });
  const [dostawcaEmail, setDostawcaEmail] = useState("");
  const [wiadomoscRfq, setWiadomoscRfq] = useState("");

  const MAX_PLIKOW = 100;
  const ROZMIAR_PACZKI = 10;

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
    if (files.length > MAX_PLIKOW) {
      setStatus(`Maksymalnie ${MAX_PLIKOW} plikow na raz.`);
      return;
    }
    setBusy(true);
    try {
      const paczki: File[][] = [];
      for (let i = 0; i < files.length; i += ROZMIAR_PACZKI) {
        paczki.push(files.slice(i, i + ROZMIAR_PACZKI));
      }
      for (let i = 0; i < paczki.length; i++) {
        setStatus(
          `Wysylanie do AI: paczka ${i + 1}/${paczki.length} (${paczki[i].length} plikow z ${files.length})...`
        );
        await importDokumentacja(zlecenieId, paczki[i]);
      }
      setStatus(
        `Wszystkie ${files.length} plikow przyjete (w ${paczki.length} paczkach). AI przetwarza je w tle (ekstrakcja profili, gatunkow, dlugosci i ilosci) - przy wiekszej liczbie rysunkow moze to potrwac kilkanascie minut. Kliknij "Odswiez BOM" za chwile.`
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

  const odswiezKosztyDodatkowe = useCallback(async () => {
    if (!zlecenieId) return;
    try {
      const res = await getKosztyDodatkowe(zlecenieId);
      setKosztyDodatkowe(res.koszty_dodatkowe || []);
    } catch {
      // ciche niepowodzenie - sekcja pomocnicza
    }
  }, [zlecenieId]);

  const odswiezZlecenie = useCallback(async () => {
    if (!zlecenieId) return;
    try {
      const res = await getZlecenia();
      const z = (res.zlecenia || []).find((x) => x.zlecenie_id === zlecenieId) || null;
      setZlecenie(z);
      if (z && typeof z.marza_procent === "number") setMarza(z.marza_procent);
    } catch {
      // ciche niepowodzenie
    }
  }, [zlecenieId]);

  useEffect(() => {
    if (!zlecenieId) return;
    odswiezBom();
    odswiezKosztyDodatkowe();
    odswiezZlecenie();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const usunPozycjeBom = async (id: string) => {
    if (!confirm("Usunac te pozycje BOM?")) return;
    await deleteBomPozycja(id);
    setBom((b) => b.filter((x) => x.pozycja_id !== id));
  };

  const usunWynikOptymalizacji = async (id: string) => {
    if (!confirm("Usunac ten wynik optymalizacji?")) return;
    await deleteWynikOptymalizacji(id);
    setWyniki((w) => w.filter((x) => x.wynik_id !== id));
  };

  const zapiszCeneBom = async (pozycjaId: string, cena: number) => {
    setBom((b) => b.map((x) => (x.pozycja_id === pozycjaId ? { ...x, cena_jednostkowa: cena } : x)));
    try {
      await updateCenaBom(pozycjaId, cena);
    } catch (e) {
      setStatus(`Blad zapisu ceny: ${(e as Error).message}`);
    }
  };

  const zapiszMarze = async () => {
    if (!zlecenieId) return;
    try {
      await updateMarzaZlecenia(zlecenieId, marza);
      setStatus(`Zapisano marze ${marza}% dla zlecenia ${zlecenieId}.`);
    } catch (e) {
      setStatus(`Blad zapisu marzy: ${(e as Error).message}`);
    }
  };

  const dodajKoszt = async () => {
    if (!zlecenieId) return;
    if (!nowyKoszt.opis) {
      setStatus("Podaj opis dodatkowej pozycji kosztowej.");
      return;
    }
    try {
      await addKosztDodatkowy({ zlecenie_id: zlecenieId, ...nowyKoszt, dodano_przez: "" });
      setNowyKoszt({ kategoria: "transport", opis: "", ilosc: 1, jednostka: "kpl", cena_jednostkowa: 0 });
      odswiezKosztyDodatkowe();
    } catch (e) {
      setStatus(`Blad dodawania kosztu: ${(e as Error).message}`);
    }
  };

  const usunKoszt = async (id: string) => {
    if (!confirm("Usunac te pozycje kosztowa?")) return;
    await deleteKosztDodatkowy(id);
    setKosztyDodatkowe((k) => k.filter((x) => x.pozycja_id !== id));
  };

  const wyslijRfq = async () => {
    if (!zlecenieId || !dostawcaEmail) {
      setStatus("Podaj numer zlecenia i adres e-mail dostawcy.");
      return;
    }
    setBusy(true);
    try {
      await wyslijOferteDoDostawcow({ zlecenie_id: zlecenieId, dostawca_email: dostawcaEmail, wiadomosc: wiadomoscRfq });
      setStatus(`Zapytanie ofertowe wyslane do: ${dostawcaEmail}.`);
      setDostawcaEmail("");
      setWiadomoscRfq("");
    } catch (e) {
      setStatus(`Blad wysylki zapytania ofertowego: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const kosztMaterialu = useMemo(
    () => bom.reduce((sum, b) => sum + (b.ilosc || 0) * (b.cena_jednostkowa || 0), 0),
    [bom]
  );
  const kosztDodatkowyLaczny = useMemo(
    () => kosztyDodatkowe.reduce((sum, k) => sum + (k.ilosc || 0) * (k.cena_jednostkowa || 0), 0),
    [kosztyDodatkowe]
  );
  const kosztCalkowity = kosztMaterialu + kosztDodatkowyLaczny;
  const cenaKoncowa = kosztCalkowity * (1 + (marza || 0) / 100);

  const eksportujCsv = () => {
    const linie: string[] = [];
    linie.push(`Kosztorys - zlecenie ${zlecenieId}${zlecenie?.nazwa ? " - " + zlecenie.nazwa : ""}`);
    linie.push("");
    linie.push("Profil;Gatunek;Dlugosc [mm];Ilosc;Cena jednostkowa;Wartosc");
    bom.forEach((b) => {
      const wartosc = (b.ilosc || 0) * (b.cena_jednostkowa || 0);
      linie.push(`${b.profil};${b.gatunek};${b.dlugosc_mm};${b.ilosc};${b.cena_jednostkowa || 0};${wartosc.toFixed(2)}`);
    });
    linie.push("");
    linie.push("Dodatkowe pozycje kosztowe");
    linie.push("Kategoria;Opis;Ilosc;Jednostka;Cena jednostkowa;Wartosc");
    kosztyDodatkowe.forEach((k) => {
      const wartosc = (k.ilosc || 0) * (k.cena_jednostkowa || 0);
      linie.push(`${k.kategoria};${k.opis};${k.ilosc};${k.jednostka};${k.cena_jednostkowa};${wartosc.toFixed(2)}`);
    });
    linie.push("");
    linie.push(`Koszt materialu;${kosztMaterialu.toFixed(2)}`);
    linie.push(`Koszty dodatkowe;${kosztDodatkowyLaczny.toFixed(2)}`);
    linie.push(`Koszt calkowity;${kosztCalkowity.toFixed(2)}`);
    linie.push(`Marza (%);${marza}`);
    linie.push(`Cena koncowa;${cenaKoncowa.toFixed(2)}`);

    const csv = "﻿" + linie.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kosztorys_${zlecenieId || "zlecenie"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 print:space-y-3">
      <div className="print:hidden">
        <h1 className="text-2xl font-semibold text-gillmet-navy">Opracowanie dokumentacji</h1>
        <p className="text-sm text-gray-500 mt-1">
          Wgraj do 100 rysunkow technicznych (PDF lub DXF) na raz - AI (OpenRouter, model Claude) opracuje kazdy
          dokument osobno i wyodrebni z nich zapotrzebowanie materialowe (BOM). Ponizej znajdziesz komplet narzedzi
          kosztorysanta: edycje cen jednostkowych, dodatkowe pozycje kosztowe, kalkulator marzy i ceny koncowej,
          eksport kosztorysu oraz wysylke zapytania ofertowego do dostawcow.
        </p>
      </div>

      <div className="card p-5 space-y-4 print:hidden">
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
          <label className="text-xs text-gray-500 block">Rysunki techniczne (PDF / DXF, maks. 100 plikow)</label>
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

      <div className="flex flex-wrap gap-3 print:hidden">
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
        <button onClick={eksportujCsv} disabled={!zlecenieId || bom.length === 0} className="text-sm underline text-gillmet-steel disabled:opacity-40">
          Eksportuj kosztorys do Excel (CSV)
        </button>
        <button onClick={() => window.print()} disabled={!zlecenieId} className="text-sm underline text-gillmet-steel disabled:opacity-40">
          Eksportuj kosztorys do PDF (drukuj)
        </button>
      </div>

      {bom.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm flex justify-between items-center">
            <span>Zestawienie materialowe (BOM) - edycja cen jednostkowych</span>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2">Profil</th>
                <th className="text-left px-4 py-2">Gatunek</th>
                <th className="text-left px-4 py-2">Dlugosc [mm]</th>
                <th className="text-left px-4 py-2">Ilosc</th>
                <th className="text-left px-4 py-2">Cena jedn. [zl]</th>
                <th className="text-left px-4 py-2">Wartosc [zl]</th>
                <th className="text-left px-4 py-2">Zrodlo</th>
                <th className="text-right px-4 py-2 print:hidden">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bom.map((b) => (
                <tr key={b.pozycja_id}>
                  <td className="px-4 py-2 font-medium">{b.profil}</td>
                  <td className="px-4 py-2">{b.gatunek}</td>
                  <td className="px-4 py-2">{b.dlugosc_mm}</td>
                  <td className="px-4 py-2">{b.ilosc}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      step="0.01"
                      className="border border-gray-200 rounded px-2 py-1 w-24 text-sm print:hidden"
                      defaultValue={b.cena_jednostkowa || 0}
                      onBlur={(e) => zapiszCeneBom(b.pozycja_id, Number(e.target.value) || 0)}
                    />
                    <span className="hidden print:inline">{(b.cena_jednostkowa || 0).toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-2">{((b.ilosc || 0) * (b.cena_jednostkowa || 0)).toFixed(2)}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{b.zrodlo_pliku}</td>
                  <td className="px-4 py-2 text-right print:hidden">
                    <button onClick={() => usunPozycjeBom(b.pozycja_id)} className="text-red-600 text-xs hover:underline">
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

      {wyniki.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm">
            Optymalizacja ciecia (pret 6m vs 12m)
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2">Profil</th>
                <th className="text-left px-4 py-2">Gatunek</th>
                <th className="text-left px-4 py-2">Pretow 6m</th>
                <th className="text-left px-4 py-2">Pretow 12m</th>
                <th className="text-left px-4 py-2">Odpad %</th>
                <th className="text-right px-4 py-2 print:hidden">Akcje</th>
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
                  <td className="px-4 py-2 text-right print:hidden">
                    <button onClick={() => usunWynikOptymalizacji(w.wynik_id)} className="text-red-600 text-xs hover:underline">
                      Usun
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {zlecenieId && (
        <div className="card p-5 space-y-3">
          <div className="font-medium text-sm">Dodatkowe pozycje kosztowe</div>
          <div className="flex flex-wrap gap-2 items-end print:hidden">
            <select
              className="border border-gray-300 rounded-md px-2 py-2 text-sm"
              value={nowyKoszt.kategoria}
              onChange={(e) => setNowyKoszt((k) => ({ ...k, kategoria: e.target.value }))}
            >
              {KATEGORIE_KOSZTOW.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <input
              className="border border-gray-300 rounded-md px-2 py-2 text-sm w-48"
              placeholder="Opis"
              value={nowyKoszt.opis}
              onChange={(e) => setNowyKoszt((k) => ({ ...k, opis: e.target.value }))}
            />
            <input
              type="number"
              className="border border-gray-300 rounded-md px-2 py-2 text-sm w-20"
              placeholder="Ilosc"
              value={nowyKoszt.ilosc}
              onChange={(e) => setNowyKoszt((k) => ({ ...k, ilosc: Number(e.target.value) }))}
            />
            <input
              className="border border-gray-300 rounded-md px-2 py-2 text-sm w-20"
              placeholder="Jedn."
              value={nowyKoszt.jednostka}
              onChange={(e) => setNowyKoszt((k) => ({ ...k, jednostka: e.target.value }))}
            />
            <input
              type="number"
              step="0.01"
              className="border border-gray-300 rounded-md px-2 py-2 text-sm w-24"
              placeholder="Cena jedn."
              value={nowyKoszt.cena_jednostkowa}
              onChange={(e) => setNowyKoszt((k) => ({ ...k, cena_jednostkowa: Number(e.target.value) }))}
            />
            <button onClick={dodajKoszt} className="bg-gillmet-navy text-white text-sm px-3 py-2 rounded-md">
              Dodaj
            </button>
          </div>

          {kosztyDodatkowe.length > 0 && (
            <table className="w-full text-sm mt-2">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-3 py-2">Kategoria</th>
                  <th className="text-left px-3 py-2">Opis</th>
                  <th className="text-left px-3 py-2">Ilosc</th>
                  <th className="text-left px-3 py-2">Jedn.</th>
                  <th className="text-left px-3 py-2">Cena jedn.</th>
                  <th className="text-left px-3 py-2">Wartosc</th>
                  <th className="text-right px-3 py-2 print:hidden">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {kosztyDodatkowe.map((k) => (
                  <tr key={k.pozycja_id}>
                    <td className="px-3 py-2">{k.kategoria}</td>
                    <td className="px-3 py-2">{k.opis}</td>
                    <td className="px-3 py-2">{k.ilosc}</td>
                    <td className="px-3 py-2">{k.jednostka}</td>
                    <td className="px-3 py-2">{(k.cena_jednostkowa || 0).toFixed(2)}</td>
                    <td className="px-3 py-2">{((k.ilosc || 0) * (k.cena_jednostkowa || 0)).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right print:hidden">
                      <button onClick={() => usunKoszt(k.pozycja_id)} className="text-red-600 text-xs hover:underline">
                        Usun
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {zlecenieId && (
        <div className="card p-5 space-y-2">
          <div className="font-medium text-sm">Kalkulator marzy i ceny koncowej</div>
          <div className="text-sm text-gray-600">Koszt materialu (BOM): {kosztMaterialu.toFixed(2)} zl</div>
          <div className="text-sm text-gray-600">Koszty dodatkowe: {kosztDodatkowyLaczny.toFixed(2)} zl</div>
          <div className="text-sm text-gray-600 font-medium">Koszt calkowity: {kosztCalkowity.toFixed(2)} zl</div>
          <div className="flex items-center gap-2 print:hidden">
            <label className="text-xs text-gray-500">Marza (%)</label>
            <input
              type="number"
              step="0.5"
              className="border border-gray-300 rounded-md px-2 py-1 w-24 text-sm"
              value={marza}
              onChange={(e) => setMarza(Number(e.target.value))}
            />
            <button onClick={zapiszMarze} className="text-xs underline text-gillmet-steel">
              Zapisz marze dla zlecenia
            </button>
          </div>
          <div className="text-lg font-semibold text-gillmet-navy">Cena koncowa: {cenaKoncowa.toFixed(2)} zl</div>
        </div>
      )}

      {zlecenieId && (
        <div className="card p-5 space-y-3 print:hidden">
          <div className="font-medium text-sm">Zapytanie ofertowe do dostawcow</div>
          <p className="text-xs text-gray-500">
            Wysyla e-mail z pelnym zestawieniem BOM (profile, gatunki, dlugosci, ilosci) do wskazanego dostawcy
            (lub kilku, adresy po przecinku).
          </p>
          <input
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
            placeholder="dostawca@firma.pl, drugi.dostawca@firma.pl"
            value={dostawcaEmail}
            onChange={(e) => setDostawcaEmail(e.target.value)}
          />
          <textarea
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
            placeholder="Dodatkowa wiadomosc (opcjonalnie)"
            rows={3}
            value={wiadomoscRfq}
            onChange={(e) => setWiadomoscRfq(e.target.value)}
          />
          <button
            onClick={wyslijRfq}
            disabled={busy || bom.length === 0}
            className="bg-gillmet-accent text-gillmet-navy font-semibold text-sm px-4 py-2 rounded-md disabled:opacity-50"
          >
            Wyslij zapytanie ofertowe
          </button>
        </div>
      )}
    </div>
  );
}
