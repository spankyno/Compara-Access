import MDBReader from "mdb-reader";
import type { Cell, Meta, Row, Snapshot } from "./types";

/** Convierte cualquier valor devuelto por mdb-reader a un tipo simple y comparable */
export function normalizeCell(v: unknown): Cell {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v.toISOString();
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number" || typeof v === "string" || typeof v === "boolean") return v;
  if (typeof Uint8Array !== "undefined" && v instanceof Uint8Array) {
    return "0x" + Array.from(v.slice(0, 64)).map((b) => b.toString(16).padStart(2, "0")).join("") + (v.length > 64 ? "…" : "");
  }
  try { return JSON.stringify(v); } catch { return String(v); }
}

/**
 * Lee una base .accdb/.mdb completa en memoria.
 * @param onTable callback de progreso por tabla (nombre, índice, total)
 */
export function readAccess(
  buffer: Buffer,
  onTable?: (name: string, i: number, total: number) => void,
  skipTable?: (name: string) => boolean,
): Snapshot {
  const reader = new MDBReader(buffer);
  const names = reader.getTableNames({ normalTables: true, systemTables: false, linkedTables: false });
  const snap: Snapshot = {};
  names.forEach((name, i) => {
    onTable?.(name, i, names.length);
    if (skipTable?.(name)) return;
    const table = reader.getTable(name);
    const columns = table.getColumns().map((c) => ({ name: c.name, type: String(c.type) }));
    const rows: Row[] = table.getData().map((r) => {
      const out: Row = {};
      for (const c of columns) out[c.name] = normalizeCell((r as Record<string, unknown>)[c.name]);
      return out;
    });
    snap[name] = { columns, rows };
  });
  return snap;
}

/** Lectura rápida: solo columnas y nº de registros (sin cargar los datos) */
export function readMeta(buffer: Buffer, skipTable?: (name: string) => boolean): Meta {
  const reader = new MDBReader(buffer);
  const meta: Meta = {};
  for (const name of reader.getTableNames({ normalTables: true, systemTables: false, linkedTables: false })) {
    if (skipTable?.(name)) continue;
    const table = reader.getTable(name);
    meta[name] = { columns: table.getColumns().map((c) => ({ name: c.name, type: String(c.type) })), rowCount: table.rowCount };
  }
  return meta;
}
