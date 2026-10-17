"use client";
import type { SchemaSummary } from "@/lib/types";
import { nf, plural } from "@/lib/summary";

function Names({ title, names }: { title: string; names: string[] }) {
  if (!names.length) return null;
  return (
    <details className="mt-1 text-xs text-slate-500">
      <summary className="cursor-pointer">{title}</summary>
      <p className="mt-1 break-words">{names.slice(0, 40).join(", ")}{names.length > 40 && ` … y ${names.length - 40} más`}</p>
    </details>
  );
}

/** Tarjeta de confirmación previa a la comparación de registros */
export function ValidationModal({ s, onCancel, onContinue }: { s: SchemaSummary; onCancel: () => void; onContinue: () => void }) {
  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="val-title">
      <div className="card max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto">
        <h2 id="val-title" className="text-lg font-bold text-access-700 dark:text-access-300">Validación previa</h2>
        <div>
          <p className="text-sm font-medium">Se encontraron:</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• <b>{plural(s.commonTables, "tabla común", "tablas comunes")}</b></li>
            <li>• <b>{plural(s.onlyA.length, "tabla", "tablas")}</b> solo en Base A<Names title="Ver nombres" names={s.onlyA} /></li>
            <li>• <b>{plural(s.onlyB.length, "tabla", "tablas")}</b> solo en Base B<Names title="Ver nombres" names={s.onlyB} /></li>
            <li>• <b>{plural(s.columnDiffs, "columna", "columnas")}</b> con diferencias de estructura en tablas comunes
              {s.tablesWithColumnDiffs > 0 && <span className="text-slate-500"> ({plural(s.tablesWithColumnDiffs, "tabla afectada", "tablas afectadas")})</span>}</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">Registros totales: Base A {nf(s.rowsA)} · Base B {nf(s.rowsB)}</p>
        </div>
        {s.warnings.length > 0 && (
          <div className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" role="note">
            {s.warnings.map((w) => <p key={w}>⚠ {w}</p>)}
            <p className="text-xs opacity-80">Es solo un aviso: puedes continuar igualmente.</p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn-primary" autoFocus onClick={onContinue}>Continuar con la comparación</button>
        </div>
      </div>
    </div>
  );
}
