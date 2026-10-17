import { countChanges, hasDifferences } from "./compare";
import type { RunMeta, TableDiff } from "./types";

/** Puntuación de diferencias de una tabla: cambios de datos + de estructura */
export const diffScore = (d: TableDiff) =>
  countChanges(d) + d.colsOnlyA.length + d.colsOnlyB.length + d.typeDiffs.length + (d.presence !== "both" ? 1 : 0);

export interface Executive {
  meta: RunMeta;
  tablesAnalyzed: number;
  tablesWithChanges: number;
  added: number; removed: number; modified: number;
  rowsA: number; rowsB: number;
  top: { name: string; changes: number }[];
  structure: { onlyA: number; onlyB: number; columnDiffs: number };
}

export function buildExecutive(diffs: TableDiff[], meta: RunMeta): Executive {
  const sum = (f: (d: TableDiff) => number) => diffs.reduce((a, d) => a + f(d), 0);
  return {
    meta,
    tablesAnalyzed: diffs.length,
    tablesWithChanges: diffs.filter(hasDifferences).length,
    added: sum((d) => d.added.length), removed: sum((d) => d.removed.length), modified: sum((d) => d.modified.length),
    rowsA: sum((d) => d.rowsA ?? 0), rowsB: sum((d) => d.rowsB ?? 0),
    top: diffs.filter((d) => diffScore(d) > 0).sort((a, b) => diffScore(b) - diffScore(a)).slice(0, 5).map((d) => ({ name: d.name, changes: diffScore(d) })),
    structure: {
      onlyA: diffs.filter((d) => d.presence === "onlyA").length,
      onlyB: diffs.filter((d) => d.presence === "onlyB").length,
      columnDiffs: sum((d) => d.colsOnlyA.length + d.colsOnlyB.length + d.typeDiffs.length),
    },
  };
}

export interface StructureRow { table: string; kind: string; column: string; typeA: string; typeB: string }

/** Filas planas con todas las diferencias de estructura (pantalla, Excel y PDF) */
export function structureRows(diffs: TableDiff[]): StructureRow[] {
  const out: StructureRow[] = [];
  for (const d of diffs) {
    if (d.presence === "onlyA") out.push({ table: d.name, kind: "Tabla solo en Base A", column: "", typeA: "", typeB: "" });
    if (d.presence === "onlyB") out.push({ table: d.name, kind: "Tabla solo en Base B", column: "", typeA: "", typeB: "" });
    d.colsOnlyA.forEach((c) => out.push({ table: d.name, kind: "Columna solo en A", column: c.name, typeA: c.type, typeB: "" }));
    d.colsOnlyB.forEach((c) => out.push({ table: d.name, kind: "Columna solo en B", column: c.name, typeA: "", typeB: c.type }));
    d.typeDiffs.forEach((t) => out.push({ table: d.name, kind: "Tipo de dato distinto", column: t.column, typeA: t.a, typeB: t.b }));
  }
  return out;
}

export const presenceLabel = (p: TableDiff["presence"]) => (p === "both" ? "Ambas bases" : p === "onlyA" ? "Solo en Base A" : "Solo en Base B");
export const fmtDate = (iso: string) => new Date(iso).toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" });
export const nf = (n: number | null) => (n === null ? "—" : n.toLocaleString("es-ES"));
export const plural = (n: number, s: string, p: string) => `${n.toLocaleString("es-ES")} ${n === 1 ? s : p}`;
