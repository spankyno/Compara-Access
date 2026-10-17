import { DEFAULT_OPTIONS, type CompareOptions } from "./types";

/** Tamaño máximo aceptado por archivo (protege la memoria del navegador) */
export const MAX_FILE_BYTES = 400 * 1024 * 1024;
/** Tope de registros por base de datos (protege frente a archivos manipulados) */
export const MAX_ROWS_PER_DB = 3_000_000;
/** Inactividad máxima del worker antes de abortar el análisis */
export const WORKER_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_CONFIG_BYTES = 1024 * 1024;

/** Claves que nunca deben usarse como propiedades de un objeto (prototype pollution) */
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
export const isSafeKey = (k: string) => !FORBIDDEN_KEYS.has(k);

/**
 * Comprueba la cabecera de un archivo de Access: los .mdb/.accdb (formato Jet/ACE)
 * contienen "Standard Jet DB" o "Standard ACE DB" a partir del byte 4.
 * Devuelve un mensaje de error o null si es válido.
 */
export async function validateAccessFile(file: File): Promise<string | null> {
  if (!/\.(accdb|mdb)$/i.test(file.name)) return "Formato no válido: usa un archivo .accdb o .mdb.";
  if (file.size === 0) return "El archivo está vacío.";
  if (file.size > MAX_FILE_BYTES) return `El archivo supera el límite de ${MAX_FILE_BYTES / 1048576} MB que el navegador puede procesar con seguridad.`;
  const head = new Uint8Array(await file.slice(0, 24).arrayBuffer());
  const text = String.fromCharCode(...head.slice(4, 19));
  if (head[0] !== 0 || (text !== "Standard Jet DB" && text !== "Standard ACE DB")) return "El archivo no parece una base de datos de Access válida (cabecera no reconocida) o está dañado.";
  return null;
}

/** Nombre de archivo seguro para descargas (sin rutas ni caracteres de control) */
export function safeFilename(name: string, max = 80): string {
  const s = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w.\- ]+/g, "_").replace(/\.{2,}/g, ".").replace(/^[.\s]+|[\s.]+$/g, "");
  return (s || "informe").slice(0, max);
}

/** JSON para incrustar en <script>: neutraliza "<" y separadores de línea Unicode */
export const safeJsonForScript = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

const cleanList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 200)).filter(Boolean).slice(0, 500) : [];

/** Valida y reconstruye desde cero una configuración importada (nunca fusiona objetos sin filtrar) */
export function sanitizeOptions(raw: unknown): CompareOptions {
  const o: CompareOptions = { ...DEFAULT_OPTIONS, pkOverrides: {} };
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new Error("Configuración no válida");
  const r = raw as Record<string, unknown>;
  o.ignoreTables = cleanList(r.ignoreTables);
  o.ignoreColumns = cleanList(r.ignoreColumns);
  o.onlyTables = cleanList(r.onlyTables);
  o.ignoreCase = r.ignoreCase === true;
  o.trimSpaces = r.trimSpaces === true;
  const pk = r.pkOverrides;
  if (typeof pk === "object" && pk !== null && !Array.isArray(pk)) {
    for (const [table, cols] of Object.entries(pk as Record<string, unknown>).slice(0, 500)) {
      const t = table.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 200);
      if (t && isSafeKey(t)) o.pkOverrides[t] = cleanList(cols).filter(isSafeKey);
    }
  }
  return o;
}

/** Lee y valida un archivo de configuración JSON (máx. 1 MB) */
export async function parseConfigFile(f: File): Promise<CompareOptions> {
  if (f.size > MAX_CONFIG_BYTES) throw new Error("El archivo de configuración es demasiado grande");
  return sanitizeOptions(JSON.parse(await f.text()));
}
