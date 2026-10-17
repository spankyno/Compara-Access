"use client";
import { useState } from "react";

export type ExportKind = "xlsx" | "pdf-compact" | "pdf-complete";

/** Menú único de exportación: mantiene la barra de herramientas simple */
export function ExportMenu({ onExport, onPrint, includeUnchanged, setIncludeUnchanged }: {
  onExport: (k: ExportKind) => void; onPrint: () => void; includeUnchanged: boolean; setIncludeUnchanged: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const item = "block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800";
  const run = (k: ExportKind) => { setOpen(false); onExport(k); };
  return (
    <div className="relative no-print">
      <button className="btn-ghost" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>Exportar informe ▾</button>
      {open && (
        <div role="menu" className="absolute left-0 z-40 mt-1 w-72 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <button role="menuitem" className={item} onClick={() => run("pdf-compact")}>PDF compacto <span className="text-xs text-access-600">(recomendado)</span><br /><span className="text-xs text-slate-500">Resumen + solo tablas con cambios</span></button>
          <button role="menuitem" className={item} onClick={() => run("pdf-complete")}>PDF completo<br /><span className="text-xs text-slate-500">Índice y detalle de todas las tablas</span></button>
          <button role="menuitem" className={item} onClick={() => run("xlsx")}>Excel (.xlsx)<br /><span className="text-xs text-slate-500">Resumen + una hoja por tabla</span></button>
          <label className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-400"><input type="checkbox" checked={includeUnchanged} onChange={(e) => setIncludeUnchanged(e.target.checked)} />Excel: incluir hojas de tablas sin cambios</label>
          <button role="menuitem" className={item} onClick={() => { setOpen(false); onPrint(); }}>Imprimir resumen ejecutivo</button>
        </div>)}
    </div>
  );
}
