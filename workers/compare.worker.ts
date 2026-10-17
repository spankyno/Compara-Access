/// <reference lib="webworker" />
import { Buffer } from "buffer";
import { readAccess, readMeta } from "../lib/access";
import { compareSnapshots } from "../lib/compare";
import { isTableAllowed, summarizeSchema } from "../lib/schema";
import type { WorkerIn, WorkerOut } from "../lib/types";

// mdb-reader espera Buffer (API de Node); lo aportamos en el worker
(self as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
const post = (m: WorkerOut) => (self as DedicatedWorkerGlobalScope).postMessage(m);

// Los archivos se conservan en memoria del worker entre "inspect" y "compare"
let bufA: ArrayBuffer | null = null;
let bufB: ArrayBuffer | null = null;

self.onmessage = (e: MessageEvent<WorkerIn>) => {
  try {
    const msg = e.data;
    if (msg.type === "inspect") {
      bufA = msg.a; bufB = msg.b;
      const skip = (t: string) => !isTableAllowed(t, msg.options);
      post({ type: "progress", pct: 30, label: "Analizando estructura de la base A…" });
      const ma = readMeta(Buffer.from(bufA), skip);
      post({ type: "progress", pct: 70, label: "Analizando estructura de la base B…" });
      const mb = readMeta(Buffer.from(bufB), skip);
      post({ type: "inspected", summary: summarizeSchema(ma, mb, msg.options) });
      return;
    }
    if (!bufA || !bufB) throw new Error("Los archivos ya no están en memoria. Vuelve a pulsar «Comparar».");
    const o = msg.options;
    const skip = (t: string) => !isTableAllowed(t, o);
    const snapA = readAccess(Buffer.from(bufA), (n, i, t) => post({ type: "progress", pct: Math.round((i / t) * 30), label: `Leyendo A · ${n}` }), skip);
    const snapB = readAccess(Buffer.from(bufB), (n, i, t) => post({ type: "progress", pct: 30 + Math.round((i / t) * 30), label: `Leyendo B · ${n}` }), skip);
    const result = compareSnapshots(snapA, snapB, o, (pct, table) =>
      post({ type: "progress", pct: 60 + Math.round(pct * 0.4), label: table ? `Comparando · ${table}` : "Finalizando…" }));
    post({ type: "done", result });
  } catch (err) {
    post({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
export {};
