"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { deleteZlecenie, getZlecenia, updateZlecenie, type Zlecenie } from "@/lib/api";

const STATUS_OPTIONS = ["nowe", "w_realizacji", "wstrzymane", "zakonczone"];

const POWLOKI_SUGESTIE = [
  "Cynkowanie ogniowe",
  "Cynkowanie galwaniczne",
  "Malowanie proszkowe",
  "Malowanie natryskowe",
  "Bez powloki",
];

type FormularzZlecenia = {
  klient: string;
  nazwa: string;
  material_gatunek: string;
  deadline: string;
  ilosc_sztuk: string;
  rodzaj_powloki: string;
  elementy_zlozeniowe: string;
  notatki: string;
};

const PUSTY_FORMULARZ: FormularzZlecenia = {
  klient: "",
  nazwa: "",
  material_gatunek: "",
  deadline: "",
  ilosc_sztuk: "",
  rodzaj_powloki: "",
  elementy_zlozeniowe: "",
  notatki: "",
};

export default function ProdukcjaPage() {
  return (
    <Suspense fallback={<div className="card p-6 text-sm text-gray-500">Ladowanie...</div>}>
      <ProdukcjaTresc />
    </Suspense>
  );
}

function ProdukcjaTresc() {
  const searchParams = useSearchParams();
  const idZLinku = searchParams.get("edytuj");

  const [zlecenia, setZlecenia] = useState<Zlecenie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const [edytowaneId, setEdytowaneId] = useState<string | null>(null);
  const [formularz, setFormularz] = useState<FormularzZlecenia>(PUSTY_FORMULARZ);
  const [zapisywanie, setZapisywanie] = useState(false);
  const [bladZapisu, setBladZapisu] = useState<string | null>(null);
  const [autoOtwartyId, setAutoOtwartyId] = useState<string | null>(null);

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

  // Blokada przewijania tla, gdy modal edycji jest otwarty.
  useEffect(() => {
    if (!edytowaneId) return;
    const poprzedni = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = poprzedni;
    };
  }, [edytowaneId]);

  const usun = async (id: string) => {
    if (!confirm(`Usunac zlecenie ${id}? Tej operacji nie mozna cofnac.`)) return;
    await deleteZlecenie(id);
    load();
  };

  const otworzEdycje = (z: Zlecenie) => {
    setBladZapisu(null);
    setFormularz({
      klient: z.klient || "",
      nazwa: z.nazwa || "",
      material_gatunek: z.material_gatunek || "",
      deadline: z.deadline || "",
      ilosc_sztuk: z.ilosc_sztuk ? String(z.ilosc_sztuk) : "",
      rodzaj_powloki: z.rodzaj_powloki || "",
      elementy_zlozeniowe: z.elementy_zlozeniowe || "",
      notatki: z.notatki || "",
    });
    setEdytowaneId(z.zlecenie_id);
  };

  // Deep-link z Dashboardu (?edytuj=ZP-xxx) - otworz edycje raz, po wczytaniu listy.
  useEffect(() => {
    if (!idZLinku || loading || autoOtwartyId === idZLinku) return;
    const znalezione = zlecenia.find((z) => z.zlecenie_id === idZLinku);
    if (znalezione) {
      otworzEdycje(znalezione);
      setAutoOtwartyId(idZLinku);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idZLinku, loading, zlecenia, autoOtwartyId]);

  const zapiszEdycje = async () => {
    if (!edytowaneId) return;
    setZapisywanie(true);
    setBladZapisu(null);
    try {
      await updateZlecenie(edytowaneId, {
        klient: formularz.klient,
        nazwa: formularz.nazwa,
        material_gatunek: formularz.material_gatunek,
        deadline: formularz.deadline,
        ilosc_sztuk: Number(formularz.ilosc_sztuk) || 0,
        rodzaj_powloki: formularz.rodzaj_powloki,
        elementy_zlozeniowe: formularz.elementy_zlozeniowe,
        notatki: formularz.notatki,
      });
      setEdytowaneId(null);
      load();
    } catch (e) {
      setBladZapisu(`Blad zapisu: ${(e as Error).message}`);
    } finally {
      setZapisywanie(false);
    }
  };

  const widoczne = filter === "all" ? zlecenia : zlecenia.filter((z) => z.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gillmet-navy">Produkcja</h1>
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

      {!loading && !error && widoczne.length === 0 && (
        <div className="card p-6 text-center text-gray-400 text-sm">Brak zlecen w tym filtrze.</div>
      )}

      {!loading && !error && widoczne.length > 0 && (
        <>
          {/* Widok kartowy - telefon */}
          <div className="md:hidden space-y-3">
            {widoczne.map((z) => (
              <div key={z.zlecenie_id} className="card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-gillmet-navy">{z.klient || "Klient nieznany"}</div>
                    <div className="text-sm text-gray-600">{z.nazwa}</div>
                    <div className="text-xs text-gray-400">{z.zlecenie_id}</div>
                  </div>
                  <span className="badge shrink-0 bg-gray-100 text-gray-700">{z.status}</span>
                </div>

                {z.elementy_zlozeniowe && (
                  <div className="text-xs text-gray-500 pt-1">
                    <span className="text-gray-400">Elementy rysunku zlozeniowego: </span>
                    {z.elementy_zlozeniowe}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <div>Gatunek: {z.material_gatunek || "-"}</div>
                  <div>Ilosc: {z.ilosc_sztuk ? `${z.ilosc_sztuk} szt.` : "-"}</div>
                  <div>Powloka: {z.rodzaj_powloki || "-"}</div>
                  <div>Deadline: {z.deadline || "-"}</div>
                </div>

                {z.notatki && (
                  <div className="text-xs text-gray-500 italic pt-1 border-t border-gray-100">
                    Uwagi: {z.notatki}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button onClick={() => otworzEdycje(z)} className="text-gillmet-steel text-xs hover:underline">
                    Edytuj
                  </button>
                  <button onClick={() => usun(z.zlecenie_id)} className="text-red-600 text-xs hover:underline">
                    Usun zlecenie
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Widok tabelaryczny - tablet/desktop */}
          <div className="card overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3">Zlecenie</th>
                    <th className="text-left px-4 py-3">Klient</th>
                    <th className="text-left px-4 py-3">Nazwa detalu</th>
                    <th className="text-left px-4 py-3">Elementy zlozeniowe</th>
                    <th className="text-left px-4 py-3">Ilosc</th>
                    <th className="text-left px-4 py-3">Powloka</th>
                    <th className="text-left px-4 py-3">Gatunek</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Deadline</th>
                    <th className="text-left px-4 py-3">Uwagi</th>
                    <th className="text-right px-4 py-3">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {widoczne.map((z) => (
                    <tr key={z.zlecenie_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gillmet-navy">{z.zlecenie_id}</td>
                      <td className="px-4 py-3">{z.klient || "-"}</td>
                      <td className="px-4 py-3">{z.nazwa}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[220px] truncate" title={z.elementy_zlozeniowe}>
                        {z.elementy_zlozeniowe || "-"}
                      </td>
                      <td className="px-4 py-3">{z.ilosc_sztuk ? `${z.ilosc_sztuk} szt.` : "-"}</td>
                      <td className="px-4 py-3">{z.rodzaj_powloki || "-"}</td>
                      <td className="px-4 py-3">{z.material_gatunek}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-gray-100 text-gray-700">{z.status}</span>
                      </td>
                      <td className="px-4 py-3">{z.deadline || "-"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-[180px] truncate" title={z.notatki}>
                        {z.notatki || "-"}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => otworzEdycje(z)} className="text-gillmet-steel text-xs hover:underline mr-3">
                          Edytuj
                        </button>
                        <button onClick={() => usun(z.zlecenie_id)} className="text-red-600 text-xs hover:underline">
                          Usun
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal edycji zlecenia */}
      {edytowaneId && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !zapisywanie && setEdytowaneId(null)} />
          <div className="relative bg-white w-full md:max-w-lg md:rounded-lg rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium text-gillmet-navy">Edycja zlecenia {edytowaneId}</div>
              <button onClick={() => !zapisywanie && setEdytowaneId(null)} className="text-gray-400 text-xl leading-none px-1">
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Klient</label>
                <input
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                  value={formularz.klient}
                  onChange={(e) => setFormularz((f) => ({ ...f, klient: e.target.value }))}
                  placeholder="Nazwa firmy / klienta"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Nazwa zamowionego detalu</label>
                <input
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                  value={formularz.nazwa}
                  onChange={(e) => setFormularz((f) => ({ ...f, nazwa: e.target.value }))}
                  placeholder="Np. Balustrada zewnetrzna"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Elementy rysunku zlozeniowego</label>
                <textarea
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                  rows={2}
                  value={formularz.elementy_zlozeniowe}
                  onChange={(e) => setFormularz((f) => ({ ...f, elementy_zlozeniowe: e.target.value }))}
                  placeholder="Np. slupek, porecz, wypelnienie, kotwy montazowe"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Ilosc sztuk</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                    value={formularz.ilosc_sztuk}
                    onChange={(e) => setFormularz((f) => ({ ...f, ilosc_sztuk: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Gatunek materialu</label>
                  <input
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                    value={formularz.material_gatunek}
                    onChange={(e) => setFormularz((f) => ({ ...f, material_gatunek: e.target.value }))}
                    placeholder="Np. S235"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Rodzaj powloki</label>
                  <input
                    list="powloki-lista"
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                    value={formularz.rodzaj_powloki}
                    onChange={(e) => setFormularz((f) => ({ ...f, rodzaj_powloki: e.target.value }))}
                    placeholder="Np. cynkowanie ogniowe"
                  />
                  <datalist id="powloki-lista">
                    {POWLOKI_SUGESTIE.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Deadline</label>
                  <input
                    type="date"
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                    value={formularz.deadline}
                    onChange={(e) => setFormularz((f) => ({ ...f, deadline: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Uwagi klienta lub technologa</label>
                <textarea
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                  rows={3}
                  value={formularz.notatki}
                  onChange={(e) => setFormularz((f) => ({ ...f, notatki: e.target.value }))}
                  placeholder="Dodatkowe informacje dotyczace realizacji"
                />
              </div>
            </div>

            {bladZapisu && <div className="text-sm text-red-600">{bladZapisu}</div>}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={zapiszEdycje}
                disabled={zapisywanie}
                className="bg-gillmet-accent text-gillmet-navy font-semibold text-sm px-4 py-2 rounded-md disabled:opacity-50"
              >
                {zapisywanie ? "Zapisywanie..." : "Zapisz zmiany"}
              </button>
              <button
                onClick={() => setEdytowaneId(null)}
                disabled={zapisywanie}
                className="text-sm text-gray-500 px-3 py-2"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
