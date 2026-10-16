import type { TableDiff } from "./types";

const fmt = (v: unknown) => (v === null || v === undefined ? "(vacío)" : String(v));
/** Recorta valores largos para que las columnas del PDF no se ensanchen */
const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const rowText = (r: Record<string, unknown>) => Object.entries(r).map(([k, v]) => `${k}: ${fmt(v)}`).join(" | ");

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Excel: hojas Resumen, Esquema y Detalle (formato largo, filtrable) */
export async function exportExcel(diffs: TableDiff[], filename = "comparacion-access.xlsx") {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const head = (ws: import("exceljs").Worksheet) => { ws.getRow(1).font = { bold: true }; ws.views = [{ state: "frozen", ySplit: 1 }]; ws.autoFilter = { from: "A1", to: { row: 1, column: ws.columnCount } }; };

  const s = wb.addWorksheet("Resumen");
  s.columns = [{ header: "Tabla", width: 32 }, { header: "Presencia", width: 14 }, { header: "Clave", width: 28 }, { header: "Añadidos", width: 11 }, { header: "Eliminados", width: 11 }, { header: "Modificados", width: 13 }];
  diffs.forEach((d) => s.addRow([d.name, d.presence === "both" ? "Ambas" : d.presence === "onlyA" ? "Solo A" : "Solo B", d.pk.join(", "), d.added.length, d.removed.length, d.modified.length]));
  head(s);

  const e = wb.addWorksheet("Esquema");
  e.columns = [{ header: "Tabla", width: 30 }, { header: "Diferencia", width: 24 }, { header: "Columna", width: 28 }, { header: "Tipo A", width: 16 }, { header: "Tipo B", width: 16 }];
  diffs.forEach((d) => {
    if (d.presence !== "both") e.addRow([d.name, d.presence === "onlyA" ? "Tabla solo en A" : "Tabla solo en B"]);
    d.colsOnlyA.forEach((c) => e.addRow([d.name, "Columna solo en A", c]));
    d.colsOnlyB.forEach((c) => e.addRow([d.name, "Columna solo en B", c]));
    d.typeDiffs.forEach((t) => e.addRow([d.name, "Tipo distinto", t.column, t.a, t.b]));
  });
  head(e);

  const w = wb.addWorksheet("Detalle");
  w.columns = [{ header: "Tabla", width: 28 }, { header: "Cambio", width: 13 }, { header: "Clave", width: 28 }, { header: "Campo", width: 24 }, { header: "Valor anterior", width: 36 }, { header: "Valor nuevo", width: 36 }];
  const fills = { Añadido: "FFD1FAE5", Eliminado: "FFFEE2E2", Modificado: "FFFEF9C3" } as const;
  const add = (cells: unknown[], kind: keyof typeof fills) => { const r = w.addRow(cells); r.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: fills[kind] } }; };
  diffs.forEach((d) => {
    d.added.forEach((x) => add([d.name, "Añadido", x.key, "(registro)", "", rowText(x.row)], "Añadido"));
    d.removed.forEach((x) => add([d.name, "Eliminado", x.key, "(registro)", rowText(x.row), ""], "Eliminado"));
    d.modified.forEach((m) => m.changes.forEach((c) => add([d.name, "Modificado", m.key, c.column, fmt(c.before), fmt(c.after)], "Modificado")));
  });
  head(w);

  const buf = await wb.xlsx.writeBuffer();
  save(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}

/** PDF: portada con resumen + una sección por tabla (máx. 1000 filas por sección) */
export async function exportPdf(diffs: TableDiff[], filename = "comparacion-access.pdf") {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(18); doc.text("Informe de comparación de bases de datos Access", 14, 16);
  doc.setFontSize(10); doc.text(`Generado: ${new Date().toLocaleString("es-ES")}`, 14, 23);
  autoTable(doc, {
    startY: 28, head: [["Tabla", "Presencia", "Clave", "Añadidos", "Eliminados", "Modificados"]],
    body: diffs.map((d) => [d.name, d.presence === "both" ? "Ambas" : d.presence === "onlyA" ? "Solo A" : "Solo B", d.pk.join(", "), d.added.length, d.removed.length, d.modified.length]),
    styles: { fontSize: 8 }, tableWidth: 269, columnStyles: { 0: { cellWidth: 85 }, 1: { cellWidth: 24 }, 2: { cellWidth: 60 }, 3: { cellWidth: 30 }, 4: { cellWidth: 30 }, 5: { cellWidth: 40 } }, headStyles: { fillColor: [164, 55, 58] },
  });
  const LIMIT = 1000;
  for (const d of diffs) {
    const body: string[][] = [];
    d.added.forEach((x) => body.push(["Añadido", trunc(x.key, 40), "", "", trunc(rowText(x.row), 140)]));
    d.removed.forEach((x) => body.push(["Eliminado", trunc(x.key, 40), "", trunc(rowText(x.row), 140), ""]));
    d.modified.forEach((m) => m.changes.forEach((c) => body.push(["Modificado", trunc(m.key, 40), trunc(c.column, 30), trunc(fmt(c.before), 100), trunc(fmt(c.after), 100)])));
    const schema = [...d.colsOnlyA.map((c) => `Columna solo en A: ${c}`), ...d.colsOnlyB.map((c) => `Columna solo en B: ${c}`), ...d.typeDiffs.map((t) => `Tipo distinto en ${t.column}: ${t.a} → ${t.b}`), ...d.warnings];
    if (!body.length && !schema.length) continue;
    doc.addPage(); doc.setFontSize(14); doc.text(d.name, 14, 16);
    let y = 22;
    if (schema.length) { doc.setFontSize(9); schema.forEach((t) => { doc.text(`• ${t}`, 14, y); y += 5; }); y += 2; }
    if (body.length) autoTable(doc, {
      startY: y, head: [["Cambio", "Clave", "Campo", "Anterior", "Nuevo"]], body: body.slice(0, LIMIT),
      styles: { fontSize: 7, overflow: "linebreak", cellPadding: 1.5, valign: "top" }, tableWidth: 269,
      columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 48 }, 2: { cellWidth: 38 }, 3: { cellWidth: 80 }, 4: { cellWidth: 81 } }, headStyles: { fillColor: [164, 55, 58] },
      didParseCell: (h) => { if (h.section === "body") { if (h.column.index === 3) h.cell.styles.textColor = [185, 28, 28]; if (h.column.index === 4) h.cell.styles.textColor = [21, 128, 61]; } },
    });
    if (body.length > LIMIT) { doc.setFontSize(8); doc.text(`… ${body.length - LIMIT} filas más (usa Excel para el detalle completo).`, 14, (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6); }
  }
  doc.save(filename);
}
