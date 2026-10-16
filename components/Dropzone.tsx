"use client";
import { useRef, useState } from "react";

const fmtSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`);
export const WARN_BYTES = 150 * 1024 * 1024;

export function Dropzone({ label, file, onFile }: { label: string; file: File | null; onFile: (f: File | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const accept = (f?: File) => { if (f && /\.(accdb|mdb)$/i.test(f.name)) onFile(f); else if (f) alert("Formato no válido: usa un archivo .accdb o .mdb"); };
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); accept(e.dataTransfer.files[0]); }}
      className={`flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition ${over ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950" : "border-slate-300 hover:border-indigo-400 dark:border-slate-700"}`}
    >
      <input ref={ref} type="file" accept=".accdb,.mdb" hidden onChange={(e) => accept(e.target.files?.[0])} />
      <div className="text-sm font-semibold">{label}</div>
      {file ? (
        <>
          <div className="break-all text-sm">{file.name}</div>
          <div className={`text-xs ${file.size > WARN_BYTES ? "text-amber-600" : "text-slate-500"}`}>
            {fmtSize(file.size)}{file.size > WARN_BYTES && " · ⚠ archivo grande, puede tardar y consumir mucha memoria"}
          </div>
          <button className="text-xs text-red-600 underline" onClick={(e) => { e.stopPropagation(); onFile(null); }}>Quitar</button>
        </>
      ) : <div className="text-xs text-slate-500">Arrastra un .accdb / .mdb o haz clic para elegir</div>}
    </div>
  );
}
