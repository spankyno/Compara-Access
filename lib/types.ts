export type Cell = string | number | boolean | null;
export type Row = Record<string, Cell>;
export interface Col { name: string; type: string }
export interface TableData { columns: Col[]; rows: Row[] }
/** Contenido completo de una base de datos Access, ya normalizado */
export type Snapshot = Record<string, TableData>;

export interface CompareOptions {
  ignoreTables: string[];
  /** "columna" (global) o "Tabla.columna" */
  ignoreColumns: string[];
  /** Si no está vacío, solo se comparan estas tablas */
  onlyTables: string[];
  ignoreCase: boolean;
  trimSpaces: boolean;
  /** Clave primaria manual por tabla */
  pkOverrides: Record<string, string[]>;
}
export const DEFAULT_OPTIONS: CompareOptions = {
  ignoreTables: [], ignoreColumns: [], onlyTables: [], ignoreCase: false, trimSpaces: false, pkOverrides: {},
};

export interface FieldChange { column: string; before: Cell; after: Cell }
export interface ModifiedRecord { key: string; changes: FieldChange[] }
export interface KeyedRow { key: string; row: Row }

export interface TableDiff {
  name: string;
  /** both = en las dos; onlyA / onlyB = solo existe en una */
  presence: "both" | "onlyA" | "onlyB";
  pk: string[];
  pkSource: "detectada" | "manual" | "todas-las-columnas";
  added: KeyedRow[];
  removed: KeyedRow[];
  modified: ModifiedRecord[];
  /** Columnas que solo existen en A / solo en B (con su tipo) */
  colsOnlyA: Col[];
  colsOnlyB: Col[];
  /** Nº de registros en cada base (null si la tabla no existe en esa base) */
  rowsA: number | null;
  rowsB: number | null;
  typeDiffs: { column: string; a: string; b: string }[];
  warnings: string[];
}
export interface CompareResult { diffs: TableDiff[]; tablesAnalyzed: number }

/** Estructura ligera de una base (sin datos): sirve para la validación previa */
export type Meta = Record<string, { columns: Col[]; rowCount: number }>;
export interface SchemaSummary {
  commonTables: number;
  onlyA: string[];
  onlyB: string[];
  tablesWithColumnDiffs: number;
  columnDiffs: number;
  rowsA: number;
  rowsB: number;
  /** Avisos suaves: no bloquean el proceso */
  warnings: string[];
}
export interface RunMeta { fileA: string; fileB: string; generatedAt: string }

export type WorkerIn =
  | { type: "inspect"; a: ArrayBuffer; b: ArrayBuffer; options: CompareOptions }
  | { type: "compare"; options: CompareOptions };
export type WorkerOut =
  | { type: "progress"; pct: number; label: string }
  | { type: "inspected"; summary: SchemaSummary }
  | { type: "done"; result: CompareResult }
  | { type: "error"; message: string };
