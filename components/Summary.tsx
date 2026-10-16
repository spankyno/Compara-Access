"use client";
import type { TableDiff } from "@/lib/types";
import { countChanges, hasDifferences } from "@/lib/compare";

const badge = (n: number) => n === 0 ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : n < 10 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" : n < 100 ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";

export function Summary({ diffs, onSelect }: { diffs: TableDiff[]; onSelect: (t: TableDiff) => void }) {
  const sum = (f: (d: TableDiff) => number) => diffs.reduce((a, d) => a + f(d), 0);
  const stats = [
    ["Tablas analizadas", diffs.length, ""], ["Con diferencias", diffs.filter(hasDifferences).length, ""],
    ["Añadidos", sum((d) => d.added.length), "text-green-600"], ["Eliminados", sum((d) => d.removed.length), "text-red-600"], ["Modificados", sum((d) => d.modified.length), "text-amber-600"],
  ] as const;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(([l, v, c]) => <div key={l} className="card"><div className="text-xs text-slate-500">{l}</div><div className={`text-2xl font-bold ${c}`}>{v}</div></div>)}
      </div>
      <div className="card divide-y divide-slate-200 p-0 dark:divide-slate-800">
        {diffs.map((d) => {
          const n = countChanges(d);
          return (
            <button key={d.name} onClick={() => onSelect(d)} className="flex w-full flex-wrap items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
              <span className="flex-1 font-medium">{d.name}</span>
              {d.presence !== "both" && <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-800">Solo en {d.presence === "onlyA" ? "A" : "B"}</span>}
              {(d.colsOnlyA.length + d.colsOnlyB.length + d.typeDiffs.length > 0) && <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">Esquema</span>}
              <span className={`rounded px-2 py-0.5 text-xs ${badge(n)}`}>{n === 0 ? "Sin cambios" : `${n} cambios`}</span>
              <span className="text-xs text-green-600">+{d.added.length}</span><span className="text-xs text-red-600">−{d.removed.length}</span><span className="text-xs text-amber-600">~{d.modified.length}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
