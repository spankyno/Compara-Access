export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const fmtCell = (v: unknown) => (v === null || v === undefined ? "(vacío)" : String(v));
export const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
export const rowText = (r: Record<string, unknown>) => Object.entries(r).map(([k, v]) => `${k}: ${fmtCell(v)}`).join(" | ");
