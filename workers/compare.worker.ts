/// <reference lib="webworker" />
import { Buffer } from "buffer";
import { readAccess } from "../lib/access";
import { compareSnapshots } from "../lib/compare";
import type { WorkerIn, WorkerOut } from "../lib/types";

// mdb-reader espera Buffer (API de Node); lo aportamos en el worker
(self as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
const post = (m: WorkerOut) => (self as DedicatedWorkerGlobalScope).postMessage(m);

self.onmessage = (e: MessageEvent<WorkerIn>) => {
  try {
    const { a, b, options } = e.data;
    const skip = (t: string) =>
      options.ignoreTables.some((x) => x.trim().toLowerCase() === t.toLowerCase()) ||
      (options.onlyTables.length > 0 && !options.onlyTables.some((x) => x.trim().toLowerCase() === t.toLowerCase()));
    const snapA = readAccess(Buffer.from(a), (n, i, t) => post({ type: "progress", pct: Math.round((i / t) * 30), label: `Leyendo A · ${n}` }), skip);
    const snapB = readAccess(Buffer.from(b), (n, i, t) => post({ type: "progress", pct: 30 + Math.round((i / t) * 30), label: `Leyendo B · ${n}` }), skip);
    const result = compareSnapshots(snapA, snapB, options, (pct, table) =>
      post({ type: "progress", pct: 60 + Math.round(pct * 0.4), label: table ? `Comparando · ${table}` : "Finalizando…" }));
    post({ type: "done", result });
  } catch (err) {
    post({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
export {};
