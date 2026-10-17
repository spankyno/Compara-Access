import type { Cell, RunMeta, TableDiff } from "./types";
import { hasDifferences } from "./compare";
import { buildExecutive, fmtDate, presenceLabel, structureRows } from "./summary";
import { saveBlob } from "./download";

const MAX_ROWS = 50_000; // tope por sección para no bloquear el navegador
const C = { maroon: "FFA4373A", red: "FFFEE2E2", green: "FFDCFCE7", amber: "FFFEF3C7", gray: "FFF1F5F9", white: "FFFFFFFF", hAdd: "FF15803D", hDel: "FFB91C1C", hMod: "FFB45309" };

type Ws = import("exceljs").Worksheet;
const fill = (argb: string) => ({ type: "pattern" as const, pattern: "solid" as const, fgColor: { argb } });
const val = (v: Cell): string | number | boolean => (v === null ? "" : v);

/** Nombre de hoja válido (≤31, sin []:*?/\) y único */
function sheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[\\/*?:[\]]/g, "_").slice(0, 31) || "Tabla";
  let n = base, i = 2;
  while (used.has(n.toLowerCase())) { const suf = `~${i++}`; n = base.slice(0, 31 - suf.length) + suf; }
  used.add(n.toLowerCase());
  return n;
}
/** Cabeceras únicas (Excel exige nombres distintos en una tabla) */
const uniq = (names: string[]) => { const seen = new Map<string, number>(); return names.map((n) => { const k = n || "Columna"; const c = (seen.get(k) ?? 0) + 1; seen.set(k, c); return c === 1 ? k : `${k} (${c})`; }); };

let tableCounter = 0;
/** Añade una tabla de Excel (con botones de filtro) y devuelve la fila siguiente libre */
function addTable(ws: Ws, row: number, headers: string[], rows: (string | number | boolean)[][], headFill: string, paint?: (r: number, c: number, cell: import("exceljs").Cell) => string | undefined): number {
  ws.addTable({
    name: `T_${++tableCounter}`, ref: `A${row}`, headerRow: true, totalsRow: false,
    style: { theme: "TableStyleLight1", showRowStripes: false },
    columns: uniq(headers).map((name) => ({ name, filterButton: true })), rows,
  });
  const h = ws.getRow(row);
  for (let c = 1; c <= headers.length; c++) { const cell = h.getCell(c); cell.fill = fill(headFill); cell.font = { bold: true, color: { argb: C.white } }; cell.alignment = { vertical: "middle" }; }
  if (paint) rows.forEach((_, i) => { const r = ws.getRow(row + 1 + i); for (let c = 1; c <= headers.length; c++) { const color = paint(i, c, r.getCell(c)); if (color) r.getCell(c).fill = fill(color); } });
  return row + rows.length + 1;
}

function summarySheet(wb: import("exceljs").Workbook, diffs: TableDiff[], meta: RunMeta, sheets: Map<string, string>) {
  const ws = wb.addWorksheet("Resumen", { views: [{ state: "frozen", ySplit: 1 }], properties: { tabColor: { argb: C.maroon } } });
  [34, 24, 24, 18, 18, 14, 14, 24].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  const e = buildExecutive(diffs, meta);
  ws.mergeCells("A1:G1"); ws.getCell("A1").value = "Resumen Ejecutivo"; ws.getCell("A1").font = { bold: true, size: 18, color: { argb: C.maroon } }; ws.getRow(1).height = 28;
  const kv = (r: number, k: string, v: string | number, bg?: string) => { ws.getCell(`A${r}`).value = k; ws.getCell(`A${r}`).font = { bold: true }; ws.getCell(`B${r}`).value = v; ws.getCell(`B${r}`).alignment = { horizontal: "left" }; if (bg) { ws.getCell(`A${r}`).fill = fill(bg); ws.getCell(`B${r}`).fill = fill(bg); } };
  kv(2, "Fecha y hora", fmtDate(meta.generatedAt)); kv(3, "Base A", meta.fileA); kv(4, "Base B", meta.fileB);
  kv(6, "Tablas analizadas", e.tablesAnalyzed); kv(7, "Tablas con cambios", e.tablesWithChanges);
  kv(8, "Registros añadidos", e.added, C.green); kv(9, "Registros eliminados", e.removed, C.red); kv(10, "Registros modificados", e.modified, C.amber);
  kv(11, "Registros en Base A", e.rowsA); kv(12, "Registros en Base B", e.rowsB);
  let r = 14;
  ws.getCell(`A${r}`).value = "Las 5 tablas con más diferencias"; ws.getCell(`A${r}`).font = { bold: true, size: 13 }; r++;
  if (e.top.length) r = addTable(ws, r, ["Tabla", "Cambios"], e.top.map((t) => [t.name, t.changes]), C.maroon) + 1;
  else { ws.getCell(`A${r}`).value = "No se han detectado diferencias."; r += 2; }

  ws.getCell(`A${r}`).value = "Diferencias de estructura"; ws.getCell(`A${r}`).font = { bold: true, size: 13 }; r++;
  const sr = structureRows(diffs);
  if (sr.length) r = addTable(ws, r, ["Tabla", "Diferencia", "Columna", "Tipo en A", "Tipo en B"], sr.map((x) => [x.table, x.kind, x.column, x.typeA, x.typeB]), C.maroon, (i, c) => (c === 4 ? C.red : c === 5 ? C.green : undefined)) + 1;
  else { ws.getCell(`A${r}`).value = "Sin diferencias de estructura."; r += 2; }

  ws.getCell(`A${r}`).value = "Tablas"; ws.getCell(`A${r}`).font = { bold: true, size: 13 }; r++;
  const start = r;
  addTable(ws, r, ["Tabla", "Presencia", "Añadidos", "Eliminados", "Modificados", "Registros A", "Registros B", "Hoja de detalle"],
    diffs.map((d) => [d.name, presenceLabel(d.presence), d.added.length, d.removed.length, d.modified.length, d.rowsA ?? "", d.rowsB ?? "", sheets.get(d.name) ?? ""]), C.maroon,
    (i, c) => { const d = diffs[i]; return c === 3 && d.added.length ? C.green : c === 4 && d.removed.length ? C.red : c === 5 && d.modified.length ? C.amber : undefined; });
  // enlaces internos a cada hoja
  diffs.forEach((d, i) => { const s = sheets.get(d.name); if (!s) return; const cell = ws.getCell(`H${start + 1 + i}`); cell.value = { text: s, hyperlink: `#'${s.replace(/'/g, "''")}'!A1` }; cell.font = { color: { argb: "FF1D4ED8" }, underline: true }; });
}

function tableSheet(ws: Ws, d: TableDiff) {
  ws.getCell("A1").value = d.name; ws.getCell("A1").font = { bold: true, size: 14, color: { argb: C.maroon } };
  ws.getCell("A2").value = `${presenceLabel(d.presence)} · Registros A: ${d.rowsA ?? "—"} · Registros B: ${d.rowsB ?? "—"} · Añadidos ${d.added.length} · Eliminados ${d.removed.length} · Modificados ${d.modified.length}` + (d.pk.length ? ` · Clave: ${d.pk.join(", ")}` : "");
  ws.getCell("A2").font = { color: { argb: "FF475569" } };
  ws.views = [{ state: "frozen", ySplit: 2 }]; // cabecera de hoja congelada
  const widths: number[] = [28];
  const grow = (i: number, ...s: unknown[]) => { widths[i] = Math.min(48, Math.max(widths[i] ?? 12, ...s.map((x) => String(x ?? "").length + 2))); };
  let r = 4;
  const note = (text: string, color = "FF475569") => { ws.getCell(`A${r}`).value = text; ws.getCell(`A${r}`).font = { color: { argb: color } }; r++; };

  const lines = [...d.colsOnlyA.map((c) => `Columna solo en A: ${c.name} (${c.type})`), ...d.colsOnlyB.map((c) => `Columna solo en B: ${c.name} (${c.type})`), ...d.typeDiffs.map((t) => `Tipo distinto en ${t.column}: A = ${t.a} · B = ${t.b}`), ...d.warnings];
  if (lines.length) { ws.getCell(`A${r}`).value = "Diferencias de estructura y avisos"; ws.getCell(`A${r}`).font = { bold: true }; r++; lines.forEach((l) => note("• " + l, "FFB45309")); r++; }

  const section = (title: string, color: string, headers: string[], rows: (string | number | boolean)[][], paint: Parameters<typeof addTable>[5]) => {
    if (!rows.length) { ws.getCell(`A${r}`).value = `${title} (0)`; ws.getCell(`A${r}`).font = { bold: true, color: { argb: color } }; r += 2; return; }
    ws.getCell(`A${r}`).value = `${title} (${rows.length.toLocaleString("es-ES")})`; ws.getCell(`A${r}`).font = { bold: true, size: 12, color: { argb: color } }; r++;
    const shown = rows.slice(0, MAX_ROWS);
    headers.forEach((h, i) => grow(i, h)); shown.slice(0, 200).forEach((row) => row.forEach((v, i) => grow(i, v)));
    r = addTable(ws, r, headers, shown, color, paint);
    if (rows.length > MAX_ROWS) note(`Se muestran las primeras ${MAX_ROWS.toLocaleString("es-ES")} filas de ${rows.length.toLocaleString("es-ES")}.`, "FFB91C1C");
    r++;
  };
  const cols = (rows: TableDiff["added"]) => Object.keys(rows[0]?.row ?? {});
  section("AÑADIDOS", C.hAdd, ["Clave", ...cols(d.added)], d.added.map((x) => [x.key, ...Object.values(x.row).map(val)]), () => C.green);
  section("ELIMINADOS", C.hDel, ["Clave", ...cols(d.removed)], d.removed.map((x) => [x.key, ...Object.values(x.row).map(val)]), () => C.red);
  const mods = d.modified.flatMap((m) => m.changes.map((c) => [m.key, c.column, val(c.before), val(c.after)]));
  section("MODIFICADOS", C.hMod, ["Clave", "Campo", "Valor anterior", "Valor nuevo"], mods, (_i, c) => (c === 3 ? C.red : c === 4 ? C.green : undefined));
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));
}

/** Excel: hoja «Resumen» + una hoja por tabla con diferencias (o todas si includeUnchanged) */
export async function exportExcel(diffs: TableDiff[], meta: RunMeta, opts: { includeUnchanged: boolean }, filename = "comparacion-access.xlsx") {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Comparador de bases de datos Access"; wb.created = new Date(meta.generatedAt);
  tableCounter = 0;
  const used = new Set(["resumen"]);
  const withSheet = diffs.filter((d) => opts.includeUnchanged || hasDifferences(d));
  const sheets = new Map(withSheet.map((d) => [d.name, sheetName(d.name, used)]));
  summarySheet(wb, diffs, meta, sheets);
  for (const d of withSheet) tableSheet(wb.addWorksheet(sheets.get(d.name)!), d);
  const buf = await wb.xlsx.writeBuffer();
  saveBlob(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}
