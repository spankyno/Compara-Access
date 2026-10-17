"use client";
import { useMemo, useState } from "react";
import type { TableDiff } from "@/lib/types";
import { countChanges, hasDifferences } from "@/lib/compare";
import { nf, type Executive } from "@/lib/summary";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { StructureSection } from "./StructureSection";

const badge = (n: number) => n === 0 ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : n < 10 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" : n < 100 ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
const STEP = 100;

export function Summary({ diffs, exec, onSelect }: { diffs: TableDiff[]; exec: Executive; onSelect: (t: TableDiff) => void }) {
  const [q, setQ] = useState("");
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [limit, setLimit] = useState(STEP); // carga diferida: se pintan de 100 en 100
  const list = useMemo(() => diffs.filter((d) => (!onlyChanged || hasDifferences(d)) && d.name.toLowerCase().includes(q.toLowerCase())), [diffs, q, onlyChanged]);
  return (
    <div className="space-y-4">
      <ExecutiveSummary exec={exec} />
      <StructureSection diffs={diffs} />
      <section className="space-y-2 print:hidden" aria-label="Tablas">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold">Tablas ({list.length})</h2>
          <input className="input max-w-xs" placeholder="Buscar tabla…" value={q} onChange={(e) => { setQ(e.target.value); setLimit(STEP); }} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyChanged} onChange={(e) => setOnlyChanged(e.target.checked)} />Solo con cambios</label>
        </div>
        <div className="card divide-y divide-slate-200 p-0 dark:divide-slate-800">
          {list.slice(0, limit).map((d) => {
            const n = countChanges(d);
            return (
              <button key={d.name} onClick={() => onSelect(d)} className="flex w-full flex-wrap items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                <span className="min-w-0 flex-1 truncate font-medium">{d.name}</span>
                {d.presence !== "both" && <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-800">Solo en {d.presence === "onlyA" ? "A" : "B"}</span>}
                {d.presence === "both" && d.colsOnlyA.length + d.colsOnlyB.length + d.typeDiffs.length > 0 && <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">Estructura</span>}
                <span className="text-xs text-slate-500">A: {nf(d.rowsA)} · B: {nf(d.rowsB)}</span>
                <span className={`rounded px-2 py-0.5 text-xs ${badge(n)}`}>{n === 0 ? "Sin cambios" : `${n} ${n === 1 ? "cambio" : "cambios"}`}</span>
                <span className="text-xs text-green-600">+{d.added.length}</span><span className="text-xs text-red-600">−{d.removed.length}</span><span className="text-xs text-amber-600">~{d.modified.length}</span>
              </button>);
          })}
          {list.length === 0 && <div className="p-6 text-center text-sm text-slate-500">Ninguna tabla coincide.</div>}
        </div>
        {list.length > limit && <button className="btn-ghost" onClick={() => setLimit(limit + STEP)}>Mostrar más ({list.length - limit} restantes)</button>}
      </section>
    </div>
  );
}
