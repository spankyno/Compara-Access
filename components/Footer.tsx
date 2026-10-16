import Link from "next/link";
import { AUTHOR, BLOG_URL, CONTACT_URL, HUB_URL } from "@/lib/site";

export function Footer() {
  const a = "hover:text-access-600 hover:underline dark:hover:text-access-300";
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-600 dark:text-slate-400 md:px-8">
        <nav aria-label="Enlaces del pie de página" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/acerca-de" className={a}>Acerca de…</Link>
          <a href={BLOG_URL} target="_blank" rel="noopener" className={a}>Blog</a>
          <a href={HUB_URL} target="_blank" rel="noopener" className={a}>Aitor Hub</a>
          <a href={CONTACT_URL} target="_blank" rel="noopener" className={a}>Contacto</a>
        </nav>
        <p>Autor: {AUTHOR} · © 2026 Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
