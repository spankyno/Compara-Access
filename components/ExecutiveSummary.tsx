import { fmtDate, nf, type Executive } from "@/lib/summary";

/** Resumen Ejecutivo: pensado para verse bien en pantalla y al imprimir */
export function ExecutiveSummary({ exec }: { exec: Executive }) {
  const kpi = (label: string, value: number, cls = "") => (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${cls}`}>{nf(value)}</div>
    </div>
  );
  return (
    <section className="card space-y-4 print:border-0 print:shadow-none" aria-labelledby="exec-title">
      <header className="border-b border-slate-200 pb-3 dark:border-slate-700">
        <h2 id="exec-title" className="text-xl font-bold text-access-700 dark:text-access-300">Resumen Ejecutivo</h2>
        <p className="text-sm text-slate-500">Comparación realizada el {fmtDate(exec.meta.generatedAt)}</p>
        <dl className="mt-2 grid gap-x-6 text-sm sm:grid-cols-2">
          <div className="flex gap-2"><dt className="font-medium">Base A:</dt><dd className="break-all">{exec.meta.fileA}</dd></div>
          <div className="flex gap-2"><dt className="font-medium">Base B:</dt><dd className="break-all">{exec.meta.fileB}</dd></div>
        </dl>
      </header>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpi("Tablas analizadas", exec.tablesAnalyzed)}
        {kpi("Tablas con cambios", exec.tablesWithChanges, exec.tablesWithChanges ? "text-amber-600" : "")}
        {kpi("Registros en Base A", exec.rowsA)}
        {kpi("Registros en Base B", exec.rowsB)}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {kpi("Registros añadidos", exec.added, "text-green-600")}
        {kpi("Registros eliminados", exec.removed, "text-red-600")}
        {kpi("Registros modificados", exec.modified, "text-amber-600")}
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold">Las 5 tablas con más diferencias</h3>
        {exec.top.length === 0 ? <p className="text-sm text-slate-500">No se han detectado diferencias.</p> : (
          <ol className="space-y-1 text-sm">
            {exec.top.map((t, i) => (
              <li key={t.name} className="flex items-center gap-2"><span className="w-5 text-slate-400">{i + 1}.</span><span className="flex-1 truncate">{t.name}</span><b className="tabular-nums">{nf(t.changes)}</b></li>))}
          </ol>)}
      </div>
    </section>
  );
}
