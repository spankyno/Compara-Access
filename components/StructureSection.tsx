"use client";
import { useState } from "react";
import type { TableDiff } from "@/lib/types";
import { plural, structureRows } from "@/lib/summary";

/** Sección compacta «Diferencias de estructura»: badges y detalle desplegable */
export function StructureSection({ diffs }: { diffs: TableDiff[] }) {
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(100);
  const onlyA = diffs.filter((d) => d.presence === "onlyA");
  const onlyB = diffs.filter((d) => d.presence === "onlyB");
  const cols = structureRows(diffs).filter((r) => r.column);
  const tablesWithCols = diffs.filter((d) => d.colsOnlyA.length + d.colsOnlyB.length + d.typeDiffs.length > 0).length;
  const total = onlyA.length + onlyB.length + cols.length;
  const b = (txt: string, cls: string) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{txt}</span>;

  const detail = (
    <div className="mt-3 space-y-3 text-sm">
      {[["Tablas solo en Base A", onlyA], ["Tablas solo en Base B", onlyB]].map(([t, l]) => (l as TableDiff[]).length > 0 && (
        <div key={t as string}><h4 className="font-medium">{t as string}</h4><p className="text-slate-600 dark:text-slate-400">{(l as TableDiff[]).map((d) => `${d.name} (${d.rowsA ?? d.rowsB} reg.)`).join(", ")}</p></div>))}
      {cols.length > 0 && (
        <div className="overflow-x-auto">
          <h4 className="mb-1 font-medium">Columnas con diferencias</h4>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800"><tr>{["Tabla", "Diferencia", "Columna", "Tipo en A", "Tipo en B"].map((h) => <th key={h} className="px-2 py-1">{h}</th>)}</tr></thead>
            <tbody>{cols.slice(0, limit).map((r, i) => (
              <tr key={i} className="border-t border-slate-100 dark:border-slate-800"><td className="px-2 py-1">{r.table}</td><td className="px-2 py-1">{r.kind}</td><td className="px-2 py-1 font-medium">{r.column}</td><td className="px-2 py-1">{r.typeA || "—"}</td><td className="px-2 py-1">{r.typeB || "—"}</td></tr>))}</tbody>
          </table>
          {cols.length > limit && <button className="btn-ghost mt-2" onClick={() => setLimit(limit + 200)}>Mostrar más ({cols.length - limit} restantes)</button>}
        </div>)}
    </div>
  );

  return (
    <section className="card" aria-labelledby="struct-title">
      <button className="flex w-full flex-wrap items-center gap-2 text-left print:pointer-events-none" aria-expanded={open} onClick={() => total && setOpen(!open)} disabled={total === 0}>
        <h2 id="struct-title" className="mr-2 font-semibold">Diferencias de estructura</h2>
        {total === 0 ? b("Sin diferencias de estructura", "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100") : <>
          {onlyA.length > 0 && b(plural(onlyA.length, "tabla solo en A", "tablas solo en A"), "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100")}
          {onlyB.length > 0 && b(plural(onlyB.length, "tabla solo en B", "tablas solo en B"), "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100")}
          {cols.length > 0 && b(`${plural(cols.length, "columna diferente", "columnas diferentes")} · ${plural(tablesWithCols, "tabla", "tablas")}`, "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100")}
          <span className="ml-auto text-xs text-slate-500 print:hidden">{open ? "Ocultar ▲" : "Ver detalle ▼"}</span></>}
      </button>
      {open && <div className="print:hidden">{detail}</div>}
      <div className="hidden print:block">{detail}</div>
    </section>
  );
}
