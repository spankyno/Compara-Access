import type { RunMeta, TableDiff } from "./types";
import { countChanges, hasDifferences } from "./compare";
import { buildExecutive, fmtDate, nf, presenceLabel, structureRows } from "./summary";
import { fmtCell, rowText, trunc } from "./download";

export type PdfMode = "complete" | "compact";
type RGB = [number, number, number];
const MAROON: RGB = [164, 55, 58], GREEN: RGB = [21, 128, 61], RED: RGB = [185, 28, 28], AMBER: RGB = [180, 83, 9], GRAY: RGB = [100, 116, 139];
const TOOL = "Comparador de bases de datos Access";
const M = 14, PW = 210, PH = 297, CW = PW - 2 * M, TOP = 22, BOTTOM = 18;
const INDEX_PER_PAGE = 40;

/**
 * PDF completo: portada, índice clicable, resumen, estructura y detalle de TODAS las tablas.
 * PDF compacto: portada, resumen y solo las tablas con cambios, en formato denso.
 */
export async function exportPdf(diffs: TableDiff[], meta: RunMeta, mode: PdfMode, filename?: string) {
  const { jsPDF } = await import("jspdf");
  // Interoperabilidad ESM/CJS: según el empaquetador, la función puede venir anidada en .default
  const at = (await import("jspdf-autotable")) as unknown as { default?: unknown; autoTable?: unknown };
  const autoTable = ((at.default as { default?: unknown })?.default ?? at.default ?? at.autoTable) as typeof import("jspdf-autotable").default;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const compact = mode === "compact";
  const list = compact ? diffs.filter(hasDifferences) : diffs;
  const exec = buildExecutive(diffs, meta);
  const last = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const pages = () => doc.getNumberOfPages();
  let y = TOP;
  const need = (h: number) => { if (y + h > PH - BOTTOM) { doc.addPage(); y = TOP; } };
  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const baseTable = { margin: { top: TOP, bottom: BOTTOM, left: M, right: M }, tableWidth: CW };

  // ---- Portada ----
  doc.setFillColor(...MAROON); doc.rect(0, 0, PW, 95, "F");
  doc.setFillColor(255, 255, 255); doc.roundedRect(M, 28, 30, 30, 5, 5, "F");
  doc.setFillColor(...MAROON); doc.roundedRect(M + 3, 31, 24, 24, 4, 4, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(26); doc.text("A", M + 15, 49, { align: "center" });
  doc.setFontSize(24); doc.text("Informe de comparación", M + 38, 40); doc.text("de bases de datos Access", M + 38, 51);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.text(compact ? "Versión compacta · solo tablas con cambios" : "Versión completa", M + 38, 61);
  color([30, 41, 59]); doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Archivos comparados", M, 115);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  doc.text(`Base A: ${trunc(meta.fileA, 70)}`, M, 124); doc.text(`Base B: ${trunc(meta.fileB, 70)}`, M, 132);
  doc.setFont("helvetica", "bold"); doc.text("Fecha y hora", M, 150); doc.setFont("helvetica", "normal"); doc.text(fmtDate(meta.generatedAt), M, 158);
  color(GRAY); doc.setFontSize(9); doc.text("Informe generado en el navegador. Los archivos originales no se han subido a ningún servidor.", M, PH - 20);

  // ---- Páginas reservadas para el índice (solo informe completo) ----
  const indexEntries = list.length + 2;
  const indexPages = compact ? 0 : Math.ceil(indexEntries / INDEX_PER_PAGE);
  for (let i = 0; i < indexPages; i++) doc.addPage();

  // ---- Resumen ejecutivo ----
  doc.addPage(); const execPage = pages(); y = TOP;
  doc.setFont("helvetica", "bold"); doc.setFontSize(18); color(MAROON); doc.text("Resumen Ejecutivo", M, y); y += 7;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); color(GRAY); doc.text(fmtDate(meta.generatedAt), M, y); y += 6;
  color([30, 41, 59]); doc.setFontSize(10);
  doc.text(`Base A: ${trunc(meta.fileA, 80)}`, M, y); y += 5; doc.text(`Base B: ${trunc(meta.fileB, 80)}`, M, y); y += 8;
  const box = (x: number, w: number, label: string, v: string, c: RGB, bg: RGB) => {
    doc.setFillColor(...bg); doc.roundedRect(x, y, w, 20, 2, 2, "F");
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); color(GRAY); doc.text(label, x + 3, y + 6);
    doc.setFontSize(15); doc.setFont("helvetica", "bold"); color(c); doc.text(v, x + 3, y + 15);
  };
  const w4 = (CW - 9) / 4, w3 = (CW - 6) / 3, k: RGB = [30, 41, 59], g: RGB = [241, 245, 249];
  box(M, w4, "Tablas analizadas", nf(exec.tablesAnalyzed), k, g); box(M + w4 + 3, w4, "Tablas con cambios", nf(exec.tablesWithChanges), AMBER, g);
  box(M + 2 * (w4 + 3), w4, "Registros en Base A", nf(exec.rowsA), k, g); box(M + 3 * (w4 + 3), w4, "Registros en Base B", nf(exec.rowsB), k, g); y += 25;
  box(M, w3, "Registros añadidos", nf(exec.added), GREEN, [220, 252, 231]); box(M + w3 + 3, w3, "Registros eliminados", nf(exec.removed), RED, [254, 226, 226]);
  box(M + 2 * (w3 + 3), w3, "Registros modificados", nf(exec.modified), AMBER, [254, 243, 199]); y += 28;
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); color([30, 41, 59]); doc.text("Las 5 tablas con más diferencias", M, y); y += 2;
  if (exec.top.length) { autoTable(doc, { ...baseTable, startY: y, head: [["#", "Tabla", "Cambios"]], body: exec.top.map((t, i) => [String(i + 1), trunc(t.name, 70), nf(t.changes)]), styles: { fontSize: 9 }, headStyles: { fillColor: MAROON }, columnStyles: { 0: { cellWidth: 10 }, 2: { cellWidth: 28, halign: "right" } } }); y = last() + 8; }
  else { y += 6; doc.setFont("helvetica", "normal"); doc.setFontSize(9); color(GRAY); doc.text("No se han detectado diferencias.", M, y); y += 8; }

  // ---- Diferencias de estructura ----
  if (!compact) { doc.addPage(); y = TOP; } else need(30);
  const structPage = pages();
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); color(MAROON); doc.text("Diferencias de estructura", M, y); y += 3;
  const sr = structureRows(diffs);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); color(GRAY);
  doc.text(`${exec.structure.onlyA} tabla(s) solo en A · ${exec.structure.onlyB} tabla(s) solo en B · ${exec.structure.columnDiffs} columna(s) con diferencias`, M, y + 5); y += 8;
  if (sr.length) {
    const cap = compact ? 300 : 2000;
    autoTable(doc, { ...baseTable, startY: y, head: [["Tabla", "Diferencia", "Columna", "Tipo en A", "Tipo en B"]], body: sr.slice(0, cap).map((x) => [trunc(x.table, 30), x.kind, trunc(x.column, 30), x.typeA || "-", x.typeB || "-"]),
      styles: { fontSize: compact ? 7 : 8, cellPadding: compact ? 1 : 1.5 }, headStyles: { fillColor: MAROON }, columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 42 }, 2: { cellWidth: 40 }, 3: { cellWidth: 30 }, 4: { cellWidth: 30 } } });
    y = last() + 6;
    if (sr.length > cap) { doc.setFontSize(8); color(GRAY); doc.text(`… ${sr.length - cap} filas más (consulta el Excel).`, M, y); y += 6; }
  } else { y += 4; doc.setFontSize(9); color(GREEN); doc.text("Las dos bases tienen la misma estructura.", M, y); y += 8; }

  // ---- Detalle por tabla ----
  const pageOf = new Map<string, number>();
  const cap = compact ? 150 : 1000;
  const section = (title: string, n: number, c: RGB, head: string[], body: string[][], styles: Record<number, { cellWidth: number }>, paint?: boolean) => {
    if (!body.length) return;
    need(22); doc.setFont("helvetica", "bold"); doc.setFontSize(compact ? 8.5 : 9.5); color(c); doc.text(`${title} (${nf(n)})`, M, y); y += 2;
    autoTable(doc, { ...baseTable, startY: y, head: [head], body: body.slice(0, cap), theme: "grid",
      styles: { fontSize: compact ? 6.5 : 7.5, cellPadding: compact ? 0.9 : 1.5, overflow: "linebreak", valign: "top", lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: c, textColor: 255 }, columnStyles: styles,
      didParseCell: (h) => { if (paint && h.section === "body") { if (h.column.index === 2) { h.cell.styles.fillColor = [254, 226, 226]; h.cell.styles.textColor = RED; } if (h.column.index === 3) { h.cell.styles.fillColor = [220, 252, 231]; h.cell.styles.textColor = GREEN; } } } });
    y = last() + 3;
    if (body.length > cap) { doc.setFont("helvetica", "italic"); doc.setFontSize(7); color(GRAY); doc.text(`… ${nf(body.length - cap)} filas más. Consulta el Excel para el detalle completo.`, M, y + 2); y += 6; }
    y += 3;
  };
  for (const d of list) {
    const changes = countChanges(d);
    if (!compact && changes > 0) { doc.addPage(); y = TOP; } else need(compact ? 26 : 20);
    pageOf.set(d.name, pages());
    doc.setFont("helvetica", "bold"); doc.setFontSize(compact ? 11 : 13); color(MAROON); doc.text(trunc(d.name, 70), M, y); y += compact ? 5 : 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); color(GRAY);
    doc.text(`${presenceLabel(d.presence)} · Registros A: ${nf(d.rowsA)} · Registros B: ${nf(d.rowsB)}` + (d.presence === "both" && d.pk.length ? ` · Clave: ${trunc(d.pk.join(", "), 50)}` : ""), M, y); y += 4;
    doc.text(`Añadidos: ${nf(d.added.length)} · Eliminados: ${nf(d.removed.length)} · Modificados: ${nf(d.modified.length)}`, M, y); y += 5;
    const notes = [...d.colsOnlyA.map((c) => `Columna solo en A: ${c.name} (${c.type})`), ...d.colsOnlyB.map((c) => `Columna solo en B: ${c.name} (${c.type})`), ...d.typeDiffs.map((t) => `Tipo distinto en ${t.column}: A = ${t.a}, B = ${t.b}`), ...d.warnings];
    color(AMBER); notes.slice(0, 12).forEach((t) => { need(5); doc.text(`- ${trunc(t, 120)}`, M, y); y += 4; });
    if (notes.length > 12) { doc.text(`- … y ${notes.length - 12} más`, M, y); y += 4; }
    if (changes === 0) { color(GRAY); need(5); doc.text(notes.length ? "Sin cambios en los datos." : "Sin cambios.", M, y); y += 6; continue; }
    y += 1;
    section("Añadidos", d.added.length, GREEN, ["Clave", "Registro"], d.added.map((x) => [trunc(x.key, 40), trunc(rowText(x.row), 220)]), { 0: { cellWidth: 42 }, 1: { cellWidth: CW - 42 } });
    section("Eliminados", d.removed.length, RED, ["Clave", "Registro"], d.removed.map((x) => [trunc(x.key, 40), trunc(rowText(x.row), 220)]), { 0: { cellWidth: 42 }, 1: { cellWidth: CW - 42 } });
    const mods = d.modified.flatMap((m) => m.changes.map((c) => [trunc(m.key, 38), trunc(c.column, 30), trunc(fmtCell(c.before), 100), trunc(fmtCell(c.after), 100)]));
    section("Modificados", mods.length, AMBER, ["Clave", "Campo", "Valor anterior", "Valor nuevo"], mods, { 0: { cellWidth: 36 }, 1: { cellWidth: 34 }, 2: { cellWidth: (CW - 70) / 2 }, 3: { cellWidth: (CW - 70) / 2 } }, true);
    if (compact) { need(4); doc.setDrawColor(226, 232, 240); doc.line(M, y, PW - M, y); y += 5; }
  }

  // ---- Índice clicable (se rellena al final, cuando ya se conocen las páginas) ----
  if (!compact) {
    const entries: [string, number, string][] = [["Resumen Ejecutivo", execPage, ""], ["Diferencias de estructura", structPage, ""], ...list.map((d): [string, number, string] => [d.name, pageOf.get(d.name) ?? execPage, d.presence !== "both" ? presenceLabel(d.presence).toLowerCase() : countChanges(d) ? `${nf(countChanges(d))} ${countChanges(d) === 1 ? "cambio" : "cambios"}` : hasDifferences(d) ? "solo estructura" : "sin cambios"])];
    entries.forEach(([label, page, info], i) => {
      const p = 2 + Math.floor(i / INDEX_PER_PAGE), row = i % INDEX_PER_PAGE;
      doc.setPage(p);
      if (row === 0) { doc.setFont("helvetica", "bold"); doc.setFontSize(16); color(MAROON); doc.text("Índice", M, TOP); }
      const yy = TOP + 10 + row * 6;
      doc.setFont("helvetica", i < 2 ? "bold" : "normal"); doc.setFontSize(9); color([30, 64, 175]);
      doc.text(trunc(label, 62), M, yy);
      color(GRAY); doc.text(info, PW - M - 22, yy, { align: "right" }); doc.text(String(page), PW - M, yy, { align: "right" });
      doc.link(M, yy - 4, CW, 5.5, { pageNumber: page });
    });
  }

  // ---- Encabezado y pie con numeración (todas las páginas salvo la portada) ----
  const total = pages();
  for (let p = 2; p <= total; p++) {
    doc.setPage(p); doc.setFont("helvetica", "normal"); doc.setFontSize(8); color(GRAY);
    doc.text(TOOL, M, 11); doc.text(trunc(`${meta.fileA}  vs  ${meta.fileB}`, 60), PW - M, 11, { align: "right" });
    doc.setDrawColor(...MAROON); doc.setLineWidth(0.4); doc.line(M, 13.5, PW - M, 13.5);
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.2); doc.line(M, PH - 13, PW - M, PH - 13);
    doc.text(`${TOOL} · ${fmtDate(meta.generatedAt)}`, M, PH - 8); doc.text(`Página ${p} de ${total}`, PW - M, PH - 8, { align: "right" });
  }
  doc.save(filename ?? `comparacion-access-${compact ? "compacto" : "completo"}.pdf`);
}
