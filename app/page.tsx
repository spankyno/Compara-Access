"use client";
import { useEffect, useRef, useState } from "react";
import { AccessIcon } from "@/components/AccessIcon";
import { Dropzone } from "@/components/Dropzone";
import { OptionsPanel } from "@/components/OptionsPanel";
import { Summary } from "@/components/Summary";
import { TableDetail } from "@/components/TableDetail";
import { exportExcel, exportPdf } from "@/lib/export";
import { DEFAULT_OPTIONS, type CompareOptions, type CompareResult, type TableDiff, type WorkerOut } from "@/lib/types";

export default function Home() {
  const [fileA, setA] = useState<File | null>(null);
  const [fileB, setB] = useState<File | null>(null);
  const [options, setOptions] = useState<CompareOptions>(DEFAULT_OPTIONS);
  const [showOpts, setShowOpts] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [selected, setSelected] = useState<TableDiff | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [dark, setDark] = useState(false);
  const worker = useRef<Worker | null>(null);

  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); };
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  const toggleTheme = () => { const n = !dark; setDark(n); document.documentElement.classList.toggle("dark", n); try { localStorage.setItem("theme", n ? "dark" : "light"); } catch {} };

  async function compare() {
    if (!fileA || !fileB) return;
    setResult(null); setSelected(null); setProgress({ pct: 0, label: "Cargando archivos…" });
    try {
      const [a, b] = await Promise.all([fileA.arrayBuffer(), fileB.arrayBuffer()]);
      worker.current?.terminate();
      const w = new Worker(new URL("../workers/compare.worker.ts", import.meta.url));
      worker.current = w;
      w.onmessage = (e: MessageEvent<WorkerOut>) => {
        const m = e.data;
        if (m.type === "progress") setProgress({ pct: m.pct, label: m.label });
        else if (m.type === "done") { setResult(m.result); setProgress(null); notify("Comparación completada"); w.terminate(); }
        else { setProgress(null); notify(`Error: ${m.message}. ¿El archivo está dañado, protegido con contraseña o es de un formato no soportado?`, false); w.terminate(); }
      };
      w.onerror = () => { setProgress(null); notify("Error inesperado (posible falta de memoria con archivos muy grandes).", false); };
      w.postMessage({ a, b, options }, [a, b]);
    } catch { setProgress(null); notify("No se pudieron leer los archivos.", false); }
  }

  const doExport = async (kind: "xlsx" | "pdf", diffs: TableDiff[], name: string) => {
    try { setProgress({ pct: 100, label: "Generando informe…" }); await (kind === "xlsx" ? exportExcel(diffs, `${name}.xlsx`) : exportPdf(diffs, `${name}.pdf`)); notify("Informe descargado"); }
    catch { notify("No se pudo generar el informe", false); } finally { setProgress(null); }
  };
  const saveCfg = () => { const u = URL.createObjectURL(new Blob([JSON.stringify(options, null, 2)], { type: "application/json" })); Object.assign(document.createElement("a"), { href: u, download: "config-comparacion.json" }).click(); };
  const loadCfg = async (f: File) => { try { setOptions({ ...DEFAULT_OPTIONS, ...JSON.parse(await f.text()) }); notify("Configuración cargada"); } catch { notify("Archivo de configuración no válido", false); } };

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <header className="flex items-center gap-3">
        <AccessIcon size={48} className="shrink-0" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-access-700 dark:text-access-300 md:text-3xl">Comparador de bases de datos Access</h1>
          <p className="text-sm text-slate-500">🔒 Modo privacidad: los archivos se procesan en tu navegador y nunca se suben ni se guardan.</p>
        </div>
        <button className="btn-ghost" onClick={toggleTheme} aria-label="Cambiar tema">{dark ? "☀️" : "🌙"}</button>
      </header>

      {!selected && (
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Dropzone label="Base de datos A (original)" file={fileA} onFile={setA} />
            <Dropzone label="Base de datos B (nueva)" file={fileB} onFile={setB} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-primary px-8 py-3 text-base" disabled={!fileA || !fileB || !!progress} onClick={compare}>Comparar bases de datos</button>
            <button className="btn-ghost" onClick={() => setShowOpts(!showOpts)}>⚙ Opciones avanzadas</button>
            {result && <>
              <button className="btn-ghost" onClick={() => doExport("xlsx", result.diffs, "comparacion-access")}>Exportar Excel</button>
              <button className="btn-ghost" onClick={() => doExport("pdf", result.diffs, "comparacion-access")}>Exportar PDF</button>
            </>}
          </div>
          {showOpts && <OptionsPanel value={options} onChange={setOptions} onSave={saveCfg} onLoad={loadCfg} />}
        </section>
      )}

      {progress && (
        <div className="card space-y-2">
          <div className="flex justify-between text-sm"><span>{progress.label}</span><span>{progress.pct}%</span></div>
          <div className="h-2 overflow-hidden rounded bg-slate-200 dark:bg-slate-800"><div className="h-full bg-access-600 transition-all" style={{ width: `${progress.pct}%` }} /></div>
          {!result && <div className="space-y-2 pt-2">{[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />)}</div>}
        </div>
      )}

      {result && !selected && <Summary diffs={result.diffs} onSelect={setSelected} />}
      {selected && <TableDetail diff={selected} onBack={() => setSelected(null)} onExport={(k) => doExport(k, [selected], `comparacion-${selected.name}`)} />}

      {!result && !selected && (
        <section aria-label="Qué puedes hacer" className="grid gap-3 pt-4 text-sm md:grid-cols-3">
          {[["Compara datos y esquema", "Registros añadidos, eliminados y modificados, con valor anterior y nuevo de cada campo."],
            ["Informe en Excel y PDF", "Descarga el informe completo o solo de una tabla concreta."],
            ["100 % privado", "Tus archivos .accdb y .mdb se procesan en tu navegador y nunca se suben."]].map(([h, d]) => (
            <div key={h} className="card"><h2 className="font-semibold text-access-700 dark:text-access-300">{h}</h2><p className="mt-1 text-slate-600 dark:text-slate-400">{d}</p></div>))}
        </section>
      )}

      {toast && <div role="status" className={`fixed bottom-4 right-4 max-w-sm rounded-lg px-4 py-3 text-sm text-white shadow-lg ${toast.ok ? "bg-green-600" : "bg-red-600"}`}>{toast.msg}</div>}
    </main>
  );
}
