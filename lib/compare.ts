import type { Cell, CompareOptions, CompareResult, KeyedRow, ModifiedRecord, Row, Snapshot, TableDiff, TableData } from "./types";

const SEP = "\u0001";
const lc = (s: string) => s.toLowerCase();

/** Aplica la tolerancia configurada para comparar dos valores */
function norm(v: Cell, o: CompareOptions): Cell {
  if (typeof v !== "string") return v;
  let s = v;
  if (o.trimSpaces) s = s.trim().replace(/\s+/g, " ");
  if (o.ignoreCase) s = s.toLowerCase();
  return s;
}
const same = (x: Cell, y: Cell, o: CompareOptions) => norm(x, o) === norm(y, o);

function isIgnoredCol(table: string, col: string, o: CompareOptions) {
  const t = lc(table), c = lc(col);
  return o.ignoreColumns.some((x) => { const l = lc(x.trim()); return l === c || l === `${t}.${c}`; });
}

/** ¿Los valores de estas columnas forman una clave única y sin nulos? */
function isUnique(rows: Row[], cols: string[]): boolean {
  const seen = new Set<string>();
  for (const r of rows) {
    if (cols.some((c) => r[c] === null || r[c] === undefined)) return false;
    const k = cols.map((c) => String(r[c])).join(SEP);
    if (seen.has(k)) return false;
    seen.add(k);
  }
  return true;
}

/**
 * Detección heurística de la clave primaria (mdb-reader no expone los índices):
 * 1) columna con nombre tipo Id/Codigo/Clave única en ambas bases,
 * 2) cualquier otra columna única y sin nulos en ambas,
 * 3) si nada sirve, todas las columnas (solo se detectan altas/bajas).
 */
function detectPk(a: TableData, b: TableData, cols: string[]): { pk: string[]; source: TableDiff["pkSource"] } {
  const ok = (c: string) => isUnique(a.rows, [c]) && isUnique(b.rows, [c]);
  const nameLike = cols.filter((c) => /^(id|cod|codigo|código|clave|key|num|numero|número)$|(^id|id$|_id$|^cod)/i.test(c));
  for (const c of nameLike) if (ok(c)) return { pk: [c], source: "detectada" };
  for (const c of cols) if (ok(c)) return { pk: [c], source: "detectada" };
  return { pk: cols, source: "todas-las-columnas" };
}

/** Genera claves únicas incluso con filas duplicadas (sufijo #n) */
function indexRows(rows: Row[], pk: string[]): Map<string, Row> {
  const m = new Map<string, Row>();
  const count = new Map<string, number>();
  for (const r of rows) {
    const base = pk.map((c) => String(r[c] ?? "∅")).join(" | ");
    const n = (count.get(base) ?? 0) + 1;
    count.set(base, n);
    m.set(n === 1 ? base : `${base} #${n}`, r);
  }
  return m;
}

function compareTable(name: string, a: TableData, b: TableData, o: CompareOptions): TableDiff {
  const diff: TableDiff = {
    name, presence: "both", pk: [], pkSource: "detectada", added: [], removed: [], modified: [],
    colsOnlyA: [], colsOnlyB: [], typeDiffs: [], warnings: [],
  };
  const colsA = new Map(a.columns.map((c) => [c.name, c.type]));
  const colsB = new Map(b.columns.map((c) => [c.name, c.type]));
  const ig = (c: string) => isIgnoredCol(name, c, o);

  for (const [c, t] of colsA) if (!ig(c)) { if (!colsB.has(c)) diff.colsOnlyA.push(c); else if (colsB.get(c) !== t) diff.typeDiffs.push({ column: c, a: t, b: colsB.get(c)! }); }
  for (const c of colsB.keys()) if (!ig(c) && !colsA.has(c)) diff.colsOnlyB.push(c);

  const common = a.columns.map((c) => c.name).filter((c) => colsB.has(c) && !ig(c));
  if (common.length === 0) { diff.warnings.push("No hay columnas en común: no se pueden comparar datos."); return diff; }

  const override = Object.entries(o.pkOverrides).find(([t]) => lc(t) === lc(name))?.[1];
  if (override?.length && override.every((c) => common.includes(c))) { diff.pk = override; diff.pkSource = "manual"; }
  else {
    const d = detectPk(a, b, common);
    diff.pk = d.pk; diff.pkSource = d.source;
    if (override?.length) diff.warnings.push("La clave manual no es válida; se usó detección automática.");
  }
  if (diff.pkSource === "todas-las-columnas") diff.warnings.push("Sin clave primaria detectable: se usan todas las columnas, por lo que no se pueden detectar modificaciones (solo altas y bajas).");
  if (diff.pkSource === "manual" && !(isUnique(a.rows, diff.pk) && isUnique(b.rows, diff.pk))) diff.warnings.push("La clave manual tiene duplicados o nulos; los resultados pueden ser imprecisos.");

  const ia = indexRows(a.rows, diff.pk);
  const ib = indexRows(b.rows, diff.pk);
  const visible = (r: Row): Row => Object.fromEntries(common.map((c) => [c, r[c]]));

  for (const [k, ra] of ia) {
    const rb = ib.get(k);
    if (!rb) { diff.removed.push({ key: k, row: visible(ra) }); continue; }
    const changes = common.filter((c) => !same(ra[c], rb[c], o)).map((c) => ({ column: c, before: ra[c], after: rb[c] }));
    if (changes.length) diff.modified.push({ key: k, changes } as ModifiedRecord);
  }
  for (const [k, rb] of ib) if (!ia.has(k)) diff.added.push({ key: k, row: visible(rb) } as KeyedRow);
  return diff;
}

/** Compara dos snapshots completos. `onProgress` recibe 0-100 y la tabla actual. */
export function compareSnapshots(
  a: Snapshot, b: Snapshot, o: CompareOptions,
  onProgress?: (pct: number, table: string) => void,
): CompareResult {
  const allow = (t: string) => !o.ignoreTables.some((x) => lc(x.trim()) === lc(t)) && (o.onlyTables.length === 0 || o.onlyTables.some((x) => lc(x.trim()) === lc(t)));
  const names = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).filter(allow).sort((x, y) => x.localeCompare(y));
  const diffs: TableDiff[] = [];
  names.forEach((name, i) => {
    onProgress?.(Math.round((i / names.length) * 100), name);
    const ta = a[name], tb = b[name];
    if (ta && tb) diffs.push(compareTable(name, ta, tb, o));
    else diffs.push({
      name, presence: ta ? "onlyA" : "onlyB", pk: [], pkSource: "detectada", added: [], removed: [], modified: [],
      colsOnlyA: [], colsOnlyB: [], typeDiffs: [], warnings: [`La tabla solo existe en la base de datos ${ta ? "A" : "B"}.`],
    });
  });
  onProgress?.(100, "");
  return { diffs, tablesAnalyzed: names.length };
}

export const countChanges = (d: TableDiff) => d.added.length + d.removed.length + d.modified.length;
export const hasDifferences = (d: TableDiff) =>
  countChanges(d) > 0 || d.presence !== "both" || d.colsOnlyA.length > 0 || d.colsOnlyB.length > 0 || d.typeDiffs.length > 0;
