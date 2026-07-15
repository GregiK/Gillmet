"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getZlecenia, type Zlecenie } from "@/lib/api";

const STATUS_LABEL: Record<string, { label: string; kolor: string }> = {
  nowe: { label: "Nowe", kolor: "#9ca3af" },
  w_realizacji: { label: "W realizacji", kolor: "#3b82f6" },
  wstrzymane: { label: "Wstrzymane", kolor: "#f59e0b" },
  zakonczone: { label: "Zakonczone", kolor: "#22c55e" },
};

function dzisiajStr() {
  return new Date().toISOString().slice(0, 10);
}

function dodajDni(bazowa: string, dni: number) {
  const d = new Date(bazowa + "T00:00:00");
  d.setDate(d.getDate() + dni);
  return d.toISOString().slice(0, 10);
}

function roznicaDni(od: string, doDaty: string) {
  const a = new Date(od + "T00:00:00").getTime();
  const b = new Date(doDaty + "T00:00:00").getTime();
  return Math.round((b - a) / 86400000);
}

function formatDataPL(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function eksportujCsv(zlecenia: Zlecenie[]) {
  const naglowki = ["zlecenie_id", "klient", "nazwa", "status", "ilosc_sztuk", "deadline", "data_zakonczenia"];
  const wiersze = zlecenia.map((z) =>
    naglowki.map((k) => String((z as unknown as Record<string, unknown>)[k] ?? "")).join(";")
  );
  const csv = [naglowki.join(";"), ...wiersze].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zlecenia-${dzisiajStr()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const [zlecenia, setZlecenia] = useState<Zlecenie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getZlecenia()
      .then((r) => setZlecenia(r.zlecenia || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dzis = dzisiajStr();
  const jutro = dodajDni(dzis, 1);

  const statystyki = useMemo(() => {
    const aktywne = zlecenia.filter((z) => z.status !== "zakonczone");
    const opoznione = aktywne.filter((z) => z.deadline && z.deadline < dzis);
    const zakonczoneWszystkie = zlecenia.filter((z) => z.status === "zakonczone");
    const zakonczoneDzis = zakonczoneWszystkie.filter((z) => z.data_zakonczenia === dzis);
    const wip = zlecenia
      .filter((z) => z.status === "nowe" || z.status === "w_realizacji")
      .reduce((suma, z) => suma + (Number(z.ilosc_sztuk) || 0), 0);
    const wipZlecen = zlecenia.filter((z) => z.status === "nowe" || z.status === "w_realizacji").length;
    const wRealizacji = aktywne.filter((z) => z.status === "w_realizacji").length;
    const wstrzymane = aktywne.filter((z) => z.status === "wstrzymane").length;

    const terminoweZakonczone = zakonczoneWszystkie.filter(
      (z) => z.data_zakonczenia && z.deadline && z.data_zakonczenia <= z.deadline
    );
    const terminowosc =
      zakonczoneWszystkie.length > 0
        ? Math.round((terminoweZakonczone.length / zakonczoneWszystkie.length) * 100)
        : null;

    const wgStatusu: Record<string, number> = { nowe: 0, w_realizacji: 0, wstrzymane: 0, zakonczone: 0 };
    zlecenia.forEach((z) => {
      if (wgStatusu[z.status] !== undefined) wgStatusu[z.status]++;
    });

    const przekroczoneTerminy = [...opoznione].sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));

    const najblizszeTerminy = [...aktywne]
      .filter((z) => z.deadline)
      .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""))
      .slice(0, 6);

    const throughput7dni = Array.from({ length: 7 }).map((_, i) => {
      const dzien = dodajDni(dzis, i - 6);
      const liczba = zakonczoneWszystkie.filter((z) => z.data_zakonczenia === dzien).length;
      return { dzien, liczba };
    });

    return {
      aktywne: aktywne.length,
      opoznione: opoznione.length,
      zakonczoneDzis: zakonczoneDzis.length,
      zakonczoneWszystkieLiczba: zakonczoneWszystkie.length,
      wip,
      wipZlecen,
      wRealizacji,
      wstrzymane,
      terminowosc,
      terminoweZakonczoneLiczba: terminoweZakonczone.length,
      wgStatusu,
      przekroczoneTerminy,
      najblizszeTerminy,
      throughput7dni,
    };
  }, [zlecenia, dzis]);

  const maxThroughput = Math.max(1, ...statystyki.throughput7dni.map((d) => d.liczba));
  const sumaStatusow = zlecenia.length || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gillmet-navy">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Przeglad produkcji na dzien {formatDataPL(dzis)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-sm border border-gray-300 rounded-md px-3 py-2 text-gray-600 bg-white"
          >
            Odswiez
          </button>
          <button
            onClick={() => eksportujCsv(zlecenia)}
            disabled={zlecenia.length === 0}
            className="flex items-center gap-1.5 text-sm border border-gray-300 rounded-md px-3 py-2 text-gray-600 bg-white disabled:opacity-40"
          >
            Eksport
          </button>
        </div>
      </div>

      {loading && <div className="card p-6 text-sm text-gray-500">Ladowanie danych...</div>}
      {error && <div className="card p-6 text-sm text-red-600">Blad: {error}</div>}

      {!loading && !error && (
        <>
          {/* Karty KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="card p-4 border-l-4 border-l-gillmet-accent">
              <div className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Aktywne zlecenia</div>
              <div className="text-3xl font-semibold text-gillmet-navy mt-1">{statystyki.aktywne}</div>
              <div className="text-xs text-gray-400 mt-1">
                w realizacji: {statystyki.wRealizacji} · wstrzymane: {statystyki.wstrzymane}
              </div>
            </div>

            <div className="card p-4 border-l-4 border-l-red-500">
              <div className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Opoznione</div>
              <div className="text-3xl font-semibold text-gillmet-navy mt-1">{statystyki.opoznione}</div>
              <div className="text-xs text-gray-400 mt-1">
                {statystyki.opoznione > 0 ? "wymaga interwencji" : "brak opoznien"}
              </div>
            </div>

            <div className="card p-4 border-l-4 border-l-emerald-500">
              <div className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Zakonczone dzis</div>
              <div className="text-3xl font-semibold text-gillmet-navy mt-1">{statystyki.zakonczoneDzis}</div>
              <div className="text-xs text-gray-400 mt-1">lacznie zakonczonych: {statystyki.zakonczoneWszystkieLiczba}</div>
            </div>

            <div className="card p-4 border-l-4 border-l-blue-500">
              <div className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">WIP (szt. w toku)</div>
              <div className="text-3xl font-semibold text-gillmet-navy mt-1">{statystyki.wip}</div>
              <div className="text-xs text-gray-400 mt-1">w {statystyki.wipZlecen} zleceniach</div>
            </div>

            <div className="card p-4 border-l-4 border-l-amber-500 col-span-2 lg:col-span-1">
              <div className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Terminowosc</div>
              <div className="text-3xl font-semibold text-gillmet-navy mt-1">
                {statystyki.terminowosc === null ? "-" : `${statystyki.terminowosc}%`}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {statystyki.zakonczoneWszystkieLiczba === 0
                  ? "brak zakonczonych zlecen"
                  : `${statystyki.terminoweZakonczoneLiczba} z ${statystyki.zakonczoneWszystkieLiczba} na czas`}
              </div>
            </div>
          </div>

          {/* Throughput 7 dni */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium text-sm text-gillmet-navy">Throughput - ostatnie 7 dni</div>
                <div className="text-xs text-gray-400">szt. zakonczonych zlecen / dzien</div>
              </div>
            </div>
            <div className="flex items-end gap-2 sm:gap-4 h-36">
              {statystyki.throughput7dni.map((d) => (
                <div key={d.dzien} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div className="text-xs text-gray-500 mb-1">{d.liczba > 0 ? d.liczba : ""}</div>
                  <div
                    className="w-full rounded-t bg-gillmet-accent min-h-[4px]"
                    style={{ height: `${(d.liczba / maxThroughput) * 100}%` }}
                  />
                  <div className="text-[10px] text-gray-400 mt-1">
                    {new Date(d.dzien + "T00:00:00").toLocaleDateString("pl-PL", { weekday: "short" })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Zadania wymagajace uwagi - przekroczone terminy */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-sm text-gillmet-navy flex items-center gap-2">
                  Zadania wymagajace uwagi
                  {statystyki.przekroczoneTerminy.length > 0 && (
                    <span className="badge bg-red-100 text-red-700">{statystyki.przekroczoneTerminy.length}</span>
                  )}
                </div>
                <Link href="/produkcja" className="text-xs text-gillmet-steel hover:underline">
                  Wszystkie
                </Link>
              </div>
              {statystyki.przekroczoneTerminy.length === 0 && (
                <div className="text-sm text-gray-400 py-4 text-center">Brak przekroczonych terminow.</div>
              )}
              <div className="divide-y divide-gray-100">
                {statystyki.przekroczoneTerminy.map((z) => (
                  <div key={z.zlecenie_id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gillmet-navy truncate">
                        {z.zlecenie_id} - {z.nazwa}
                      </div>
                      <div className="text-xs text-red-600">
                        Przekroczony termin - {Math.abs(roznicaDni(z.deadline, dzis))} dni po terminie
                      </div>
                    </div>
                    <Link
                      href={`/produkcja?edytuj=${encodeURIComponent(z.zlecenie_id)}`}
                      className="text-xs border border-gray-300 rounded-md px-3 py-1.5 shrink-0"
                    >
                      Otworz
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Najblizsze terminy */}
            <div className="card p-5">
              <div className="font-medium text-sm text-gillmet-navy mb-3">Najblizsze terminy</div>
              {statystyki.najblizszeTerminy.length === 0 && (
                <div className="text-sm text-gray-400 py-4 text-center">Brak zaplanowanych terminow.</div>
              )}
              <div className="divide-y divide-gray-100">
                {statystyki.najblizszeTerminy.map((z) => {
                  const dni = roznicaDni(dzis, z.deadline);
                  let etykieta = `za ${dni} dni`;
                  let klasa = "bg-gray-100 text-gray-600";
                  if (dni < 0) {
                    etykieta = `${Math.abs(dni)} dni po terminie`;
                    klasa = "bg-red-100 text-red-700";
                  } else if (dni === 0) {
                    etykieta = "dzisiaj";
                    klasa = "bg-amber-100 text-amber-700";
                  } else if (dni === 1) {
                    etykieta = "jutro";
                    klasa = "bg-amber-100 text-amber-700";
                  }
                  return (
                    <div key={z.zlecenie_id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gillmet-navy truncate">{z.zlecenie_id}</div>
                        <div className="text-xs text-gray-400 truncate">{z.nazwa}</div>
                      </div>
                      <span className={`badge shrink-0 ${klasa}`}>{etykieta}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Status zlecen */}
          <div className="card p-5">
            <div className="font-medium text-sm text-gillmet-navy mb-4">Status zlecen</div>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
                {(() => {
                  const promien = 55;
                  const obwod = 2 * Math.PI * promien;
                  let offset = 0;
                  return Object.entries(statystyki.wgStatusu).map(([status, liczba]) => {
                    const udzial = liczba / sumaStatusow;
                    const dlugosc = udzial * obwod;
                    const el = (
                      <circle
                        key={status}
                        cx="70"
                        cy="70"
                        r={promien}
                        fill="none"
                        stroke={STATUS_LABEL[status]?.kolor || "#ccc"}
                        strokeWidth="18"
                        strokeDasharray={`${dlugosc} ${obwod - dlugosc}`}
                        strokeDashoffset={-offset}
                        transform="rotate(-90 70 70)"
                      />
                    );
                    offset += dlugosc;
                    return el;
                  });
                })()}
                <text x="70" y="65" textAnchor="middle" className="fill-gillmet-navy" style={{ fontSize: 24, fontWeight: 600 }}>
                  {zlecenia.length}
                </text>
                <text x="70" y="83" textAnchor="middle" className="fill-gray-400" style={{ fontSize: 10 }}>
                  ZLECEN
                </text>
              </svg>
              <div className="space-y-1.5 flex-1 w-full">
                {Object.entries(statystyki.wgStatusu).map(([status, liczba]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_LABEL[status]?.kolor }} />
                      <span className="text-gray-600">{STATUS_LABEL[status]?.label}</span>
                    </div>
                    <span className="font-medium text-gillmet-navy">{liczba}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
