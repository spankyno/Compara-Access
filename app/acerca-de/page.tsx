import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AccessIcon } from "@/components/AccessIcon";
import { safeJsonForScript } from "@/lib/security";
import { AUTHOR, BLOG_URL, CONTACT_URL, HUB_URL, SITE_NAME, SITE_URL } from "@/lib/site";

const title = "Acerca de";
const description = "Qué hace el comparador de bases de datos Access, cómo funciona, su stack tecnológico y por qué tus archivos nunca salen de tu navegador.";

export const metadata: Metadata = {
  title, description, alternates: { canonical: "/acerca-de" },
  openGraph: { title: `${title} · ${SITE_NAME}`, description, url: `${SITE_URL}/acerca-de`, type: "article", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITE_NAME }] },
  twitter: { card: "summary_large_image", title: `${title} · ${SITE_NAME}`, description, images: ["/og-image.png"] },
};

const features = [
  ["Comparación de datos", "Detecta registros añadidos, eliminados y modificados, mostrando el valor anterior y el nuevo de cada campo."],
  ["Comparación de esquema", "Tablas que solo existen en una base, columnas que faltan o sobran y diferencias de tipo de dato."],
  ["Clave primaria inteligente", "Detección automática, con opción de forzar la clave por tabla; sin clave se usan todas las columnas."],
  ["Opciones avanzadas", "Ignorar tablas o columnas, comparar solo un subconjunto e ignorar mayúsculas o espacios."],
  ["Informe interactivo", "Resumen con contadores, detalle por tabla con pestañas, búsqueda, filtros y paginación."],
  ["Exportación", "Informe completo o de una sola tabla en Excel (.xlsx) y PDF."],
  ["Configuración reutilizable", "Guarda y carga tus opciones de comparación en un archivo JSON."],
  ["Privacidad total", "El procesamiento ocurre en tu navegador: los archivos no se suben ni se almacenan."],
];
const stack = [
  ["Next.js 14 (App Router)", "Framework React, SEO, metadatos y despliegue estático en Vercel"],
  ["TypeScript", "Tipado estricto en toda la lógica de comparación"],
  ["Tailwind CSS", "Diseño responsive y modo oscuro"],
  ["mdb-reader", "Lectura de .accdb/.mdb en JavaScript puro, sin drivers nativos"],
  ["Web Workers", "Análisis en segundo plano sin bloquear la interfaz"],
  ["ExcelJS", "Generación del informe .xlsx"],
  ["jsPDF + AutoTable", "Generación del informe PDF"],
  ["Vercel", "Hosting gratuito (free tier)"],
];
const faqs = [
  ["¿Se suben mis bases de datos a algún servidor?", "No. Los archivos se leen y comparan dentro de tu navegador mediante un Web Worker y no se envían ni se guardan en ningún sitio."],
  ["¿Qué formatos de Access admite?", "Archivos .accdb y .mdb (Access 97 a Microsoft 365) sin contraseña. Las tablas vinculadas y los campos adjuntos no están soportados."],
  ["¿Cómo identifica qué registro es cuál?", "Mediante la clave primaria, detectada automáticamente o definida por ti. Si no existe, compara por todas las columnas."],
  ["¿Hay límite de tamaño?", "Depende de la memoria de tu navegador; se recomienda por debajo de 150–300 MB por base de datos. La aplicación avisa si el archivo es grande."],
];

const ld = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "AboutPage", "@id": `${SITE_URL}/acerca-de#page`, url: `${SITE_URL}/acerca-de`, name: `${title} · ${SITE_NAME}`, description, inLanguage: "es", isPartOf: { "@id": `${SITE_URL}/#website` }, about: { "@id": `${SITE_URL}/#app` }, primaryImageOfPage: { "@type": "ImageObject", url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL }, { "@type": "ListItem", position: 2, name: title, item: `${SITE_URL}/acerca-de` }] },
    { "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ],
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 p-4 md:p-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonForScript(ld) }} />
      <nav aria-label="Migas de pan" className="text-sm text-slate-500"><Link href="/" className="hover:underline">Inicio</Link> / Acerca de</nav>
      <header className="space-y-4">
        <div className="flex items-center gap-3"><AccessIcon size={44} /><h1 className="text-2xl font-bold md:text-3xl">Acerca del comparador de bases de datos Access</h1></div>
        <p className="text-slate-600 dark:text-slate-300">Herramienta web gratuita para comparar dos bases de datos Microsoft Access con las mismas tablas y obtener un informe detallado de lo que ha cambiado entre ellas.</p>
        <Image src="/og-image.png" alt="Comparador de bases de datos Access: resumen de registros añadidos, eliminados y modificados" width={1200} height={630} sizes="(max-width: 768px) 100vw, 768px" priority className="h-auto w-full rounded-xl border border-slate-200 shadow-sm dark:border-slate-800" />
      </header>

      <section aria-labelledby="func"><h2 id="func" className="mb-3 text-xl font-semibold text-access-700 dark:text-access-300">Funcionalidades</h2>
        <ul className="grid gap-3 sm:grid-cols-2">{features.map(([t, d]) => <li key={t} className="card"><h3 className="font-semibold">{t}</h3><p className="text-sm text-slate-600 dark:text-slate-400">{d}</p></li>)}</ul></section>

      <section aria-labelledby="como"><h2 id="como" className="mb-3 text-xl font-semibold text-access-700 dark:text-access-300">Cómo funciona</h2>
        <ol className="list-decimal space-y-1 pl-5 text-slate-700 dark:text-slate-300"><li>Sube la base A (original) y la base B (nueva).</li><li>Ajusta las opciones avanzadas si lo necesitas.</li><li>Pulsa «Comparar bases de datos» y consulta el resumen.</li><li>Entra en cada tabla y exporta el informe a Excel o PDF.</li></ol></section>

      <section aria-labelledby="stack"><h2 id="stack" className="mb-3 text-xl font-semibold text-access-700 dark:text-access-300">Stack tecnológico</h2>
        <div className="card overflow-x-auto p-0"><table className="w-full text-sm"><tbody>{stack.map(([t, d]) => <tr key={t} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><th scope="row" className="whitespace-nowrap px-4 py-2 text-left font-medium">{t}</th><td className="px-4 py-2 text-slate-600 dark:text-slate-400">{d}</td></tr>)}</tbody></table></div></section>

      <section aria-labelledby="faq"><h2 id="faq" className="mb-3 text-xl font-semibold text-access-700 dark:text-access-300">Preguntas frecuentes</h2>
        <div className="space-y-2">{faqs.map(([q, a]) => <details key={q} className="card"><summary className="cursor-pointer font-medium">{q}</summary><p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{a}</p></details>)}</div></section>

      <section aria-labelledby="autor" className="card"><h2 id="autor" className="mb-2 text-xl font-semibold text-access-700 dark:text-access-300">Autor</h2>
        <p className="text-sm">Creado por <strong>{AUTHOR}</strong>. <a className="text-access-600 underline dark:text-access-300" href={BLOG_URL} target="_blank" rel="noopener">Blog</a> · <a className="text-access-600 underline dark:text-access-300" href={HUB_URL} target="_blank" rel="noopener">Aitor Hub</a> · <a className="text-access-600 underline dark:text-access-300" href={CONTACT_URL} target="_blank" rel="noopener">Contacto</a></p>
        <p className="mt-2 text-xs text-slate-500">Microsoft Access es una marca de Microsoft Corporation. Esta aplicación es independiente y no está afiliada a Microsoft.</p></section>
      <div><Link href="/" className="btn-primary">← Volver al comparador</Link></div>
    </main>
  );
}
