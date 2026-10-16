"use client";
import type { CompareOptions } from "@/lib/types";

const csv = (a: string[]) => a.join(", ");
const parse = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
/** Formato de claves manuales: una por línea → Tabla=col1,col2 */
const pkToText = (m: CompareOptions["pkOverrides"]) => Object.entries(m).map(([t, c]) => `${t}=${c.join(",")}`).join("\n");
const textToPk = (s: string) => Object.fromEntries(s.split("\n").map((l) => l.split("=")).filter((p) => p.length === 2 && p[0].trim()).map(([t, c]) => [t.trim(), parse(c)]));

export function OptionsPanel({ value, onChange, onSave, onLoad }: { value: CompareOptions; onChange: (o: CompareOptions) => void; onSave: () => void; onLoad: (f: File) => void }) {
  const set = (p: Partial<CompareOptions>) => onChange({ ...value, ...p });
  return (
    <div className="card space-y-3 text-sm">
      <h3 className="font-semibold">Opciones avanzadas</h3>
      <label className="block">Solo estas tablas (separadas por coma)
        <input className="input mt-1" value={csv(value.onlyTables)} onChange={(e) => set({ onlyTables: parse(e.target.value) })} placeholder="Todas" /></label>
      <label className="block">Ignorar tablas
        <input className="input mt-1" value={csv(value.ignoreTables)} onChange={(e) => set({ ignoreTables: parse(e.target.value) })} /></label>
      <label className="block">Ignorar columnas (<code>columna</code> o <code>Tabla.columna</code>)
        <input className="input mt-1" value={csv(value.ignoreColumns)} onChange={(e) => set({ ignoreColumns: parse(e.target.value) })} placeholder="FechaModificacion, Clientes.Notas" /></label>
      <label className="block">Clave primaria manual (<code>Tabla=col1,col2</code>, una por línea)
        <textarea className="input mt-1 h-16" defaultValue={pkToText(value.pkOverrides)} onBlur={(e) => set({ pkOverrides: textToPk(e.target.value) })} /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={value.ignoreCase} onChange={(e) => set({ ignoreCase: e.target.checked })} />Ignorar mayúsculas/minúsculas</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={value.trimSpaces} onChange={(e) => set({ trimSpaces: e.target.checked })} />Ignorar espacios sobrantes</label>
      <div className="flex gap-2 pt-1">
        <button className="btn-ghost flex-1" onClick={onSave}>Guardar configuración</button>
        <label className="btn-ghost flex-1 cursor-pointer">Cargar<input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && onLoad(e.target.files[0])} /></label>
      </div>
    </div>
  );
}
