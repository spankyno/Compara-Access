"use client";
import { useMemo, useState } from "react";
import type { Cell, TableDiff } from "@/lib/types";

const PAGE = 50;
const show = (v: Cell) => (v === null ? <em className="text-slate-400">(vacío)</em> : String(v));
type Tab = "added" | "removed" | "modified";

export function TableDetail({ diff, onBack, onExport }: { diff: TableDiff; onBack: () => void; onExport: (kind: "xlsx" | "pdf") => void }) {
  const [tab, setTab] = useState<Tab>("modified");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [colFilter, setColFilter] = useState("");

  const list = useMemo(() => {
    const s = q.toLowerCase();
    if (tab === "modified") return diff.modified.filter((m) => (!colFilter || m.changes.some((c) => c.column === colFilter)) && (!s || (m.key + m.changes.map((c) => `${c.column}${c.before}${c.after}`).join("")).toLowerCase().includes(s)));
    return diff[tab].filter((r) => !s || (r.key + Object.values(r.row).join(" ")).toLowerCase().includes(s));
  }, [diff, tab, q, colFilter]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const slice = list.slice(page * PAGE, page * PAGE + PAGE);
  const tabs: [Tab, string, number][] = [["added", "Añadidos", diff.added.length], ["removed", "Eliminados", diff.removed.length], ["modified", "Modificados", diff.modified.length]];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-ghost" onClick={onBack}>← Resumen</button>
        <h2 className="flex-1 text-xl font-bold">{diff.name}</h2>
        <button className="btn-ghost" onClick={() => onExport("xlsx")}>Excel (esta tabla)</button>
        <button className="btn-ghost" onClick={() => onExport("pdf")}>PDF (esta tabla)</button>
      </div>
      <div className="card space-y-1 text-sm">
        <div>Clave: <b>{diff.pk.join(", ") || "—"}</b> <span className="text-slate-500">({diff.pkSource})</span></div>
        {diff.colsOnlyA.length > 0 && <div className="text-red-600">Columnas solo en A: {diff.colsOnlyA.join(", ")}</div>}
        {diff.colsOnlyB.length > 0 && <div className="text-green-600">Columnas solo en B: {diff.colsOnlyB.join(", ")}</div>}
        {diff.typeDiffs.map((t) => <div key={t.column} className="text-amber-600">Tipo distinto en {t.column}: {t.a} → {t.b}</div>)}
        {diff.warnings.map((w) => <div key={w} className="text-amber-600">⚠ {w}</div>)}
      </div>
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {tabs.map(([k, l, n]) => <button key={k} onClick={() => { setTab(k); setPage(0); }} className={`px-4 py-2 text-sm ${tab === k ? "border-b-2 border-access-600 font-semibold" : "text-slate-500"}`}>{l} ({n})</button>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Buscar…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        {tab === "modified" && <select className="input max-w-xs" value={colFilter} onChange={(e) => { setColFilter(e.target.value); setPage(0); }}>
          <option value="">Todos los campos</option>
          {Array.from(new Set(diff.modified.flatMap((m) => m.changes.map((c) => c.column)))).map((c) => <option key={c}>{c}</option>)}
        </select>}
      </div>

      {tab === "modified" ? (
        <div className="space-y-2">
          {(slice as typeof diff.modified).map((m) => (
            <details key={m.key} className="card" open={m.changes.length <= 3}>
              <summary className="cursor-pointer font-medium">{m.key} <span className="text-xs text-slate-500">· {m.changes.length} campo(s)</span></summary>
              <table className="mt-2 w-full text-sm"><tbody>
                {m.changes.map((c) => (
                  <tr key={c.column} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="w-1/4 py-1 font-medium">{c.column}</td>
                    <td className="rounded bg-red-50 px-2 text-red-700 dark:bg-red-950 dark:text-red-300">{show(c.before)}</td>
                    <td className="w-6 text-center">→</td>
                    <td className="rounded bg-green-50 px-2 text-green-700 dark:bg-green-950 dark:text-green-300">{show(c.after)}</td>
                  </tr>))}
              </tbody></table>
            </details>))}
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800"><tr>{Object.keys((slice[0] as { row: object } | undefined)?.row ?? {}).map((c) => <th key={c} className="px-3 py-2 text-left">{c}</th>)}</tr></thead>
            <tbody>{(slice as typeof diff.added).map((r) => (
              <tr key={r.key} className={tab === "added" ? "bg-green-50 dark:bg-green-950/40" : "bg-red-50 dark:bg-red-950/40"}>
                {Object.values(r.row).map((v, i) => <td key={i} className="whitespace-nowrap px-3 py-1.5">{show(v)}</td>)}
              </tr>))}</tbody>
          </table>
        </div>
      )}
      {list.length === 0 && <div className="py-8 text-center text-slate-500">Sin resultados.</div>}
      <div className="flex items-center justify-center gap-3 text-sm">
        <button className="btn-ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
        <span>Página {page + 1} de {pages} · {list.length} registros</span>
        <button className="btn-ghost" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Siguiente</button>
      </div>
    </div>
  );
}
