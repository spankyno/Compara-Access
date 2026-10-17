import type { Col, CompareOptions, Meta, SchemaSummary } from "./types";

const lc = (s: string) => s.toLowerCase();

/** ¿Esta tabla entra en la comparación según las opciones? */
export function isTableAllowed(name: string, o: CompareOptions): boolean {
  const eq = (x: string) => lc(x.trim()) === lc(name);
  return !o.ignoreTables.some(eq) && (o.onlyTables.length === 0 || o.onlyTables.some(eq));
}

/** ¿Esta columna se ignora? Acepta "columna" o "Tabla.columna" */
export function isIgnoredCol(table: string, col: string, o: CompareOptions): boolean {
  const t = lc(table), c = lc(col);
  return o.ignoreColumns.some((x) => { const l = lc(x.trim()); return l === c || l === `${t}.${c}`; });
}

/** Diferencias de columnas entre dos versiones de una tabla */
export function diffColumns(table: string, a: Col[], b: Col[], o: CompareOptions) {
  const mb = new Map(b.map((c) => [c.name, c.type]));
  const ma = new Map(a.map((c) => [c.name, c.type]));
  const colsOnlyA: Col[] = [], colsOnlyB: Col[] = [], typeDiffs: { column: string; a: string; b: string }[] = [];
  for (const c of a) {
    if (isIgnoredCol(table, c.name, o)) continue;
    if (!mb.has(c.name)) colsOnlyA.push(c);
    else if (mb.get(c.name) !== c.type) typeDiffs.push({ column: c.name, a: c.type, b: mb.get(c.name)! });
  }
  for (const c of b) if (!isIgnoredCol(table, c.name, o) && !ma.has(c.name)) colsOnlyB.push(c);
  return { colsOnlyA, colsOnlyB, typeDiffs };
}

/** Resumen de estructura para la validación previa (antes de comparar registros) */
export function summarizeSchema(a: Meta, b: Meta, o: CompareOptions): SchemaSummary {
  const names = new Set([...Object.keys(a), ...Object.keys(b)]);
  const s: SchemaSummary = { commonTables: 0, onlyA: [], onlyB: [], tablesWithColumnDiffs: 0, columnDiffs: 0, rowsA: 0, rowsB: 0, warnings: [] };
  for (const n of Array.from(names).sort((x, y) => x.localeCompare(y))) {
    if (!isTableAllowed(n, o)) continue;
    const ta = a[n], tb = b[n];
    s.rowsA += ta?.rowCount ?? 0; s.rowsB += tb?.rowCount ?? 0;
    if (ta && !tb) s.onlyA.push(n);
    else if (tb && !ta) s.onlyB.push(n);
    else {
      s.commonTables++;
      const d = diffColumns(n, ta.columns, tb.columns, o);
      const k = d.colsOnlyA.length + d.colsOnlyB.length + d.typeDiffs.length;
      if (k) { s.columnDiffs += k; s.tablesWithColumnDiffs++; }
    }
  }
  const total = s.commonTables + s.onlyA.length + s.onlyB.length;
  if (total === 0) s.warnings.push("No se encontró ninguna tabla que comparar con las opciones actuales.");
  else {
    if (s.commonTables === 0) s.warnings.push("Las bases no tienen ninguna tabla en común: no habrá comparación de registros.");
    else if ((s.onlyA.length + s.onlyB.length) / total > 0.3) s.warnings.push("Más del 30 % de las tablas existe solo en una de las bases. ¿Son los archivos correctos?");
    if (s.commonTables > 0 && s.tablesWithColumnDiffs / s.commonTables > 0.5) s.warnings.push("Más de la mitad de las tablas comunes tiene columnas distintas; las bases parecen versiones muy diferentes.");
    if (s.rowsA + s.rowsB > 2_000_000) s.warnings.push("Volumen alto de registros: el análisis puede tardar y consumir bastante memoria.");
  }
  return s;
}
