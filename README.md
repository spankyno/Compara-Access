# Comparador de bases de datos Access

Compara dos bases `.accdb` / `.mdb` y genera un informe de registros **añadidos, eliminados y modificados**
(valor anterior → nuevo), más diferencias de **esquema**. Exporta a **Excel** y **PDF**.

## Arquitectura (100 % gratis)
- **Todo en el navegador**: `mdb-reader` (JS puro) lee los archivos Access dentro de un Web Worker.
  - `node-adodb` y `mdbtools` no funcionan en Vercel/Cloudflare (requieren Windows/ACE o binarios nativos).
  - Vercel Hobby limita el cuerpo de las peticiones a ~4,5 MB, inviable para subir bases de datos.
  - Ventaja: privacidad total (nada se sube ni se guarda), sin costes de servidor.
- Next.js 14 (App Router) + TypeScript + Tailwind. Exportación: `exceljs` y `jspdf` + `jspdf-autotable`.
- Sin API Routes. Para añadir autenticación o historial en el futuro basta con crear `app/api/*` y
  guardar solo el `CompareResult` (nunca los archivos).

## Flujo de comparación
1. **Validación previa**: al pulsar «Comparar», el worker lee solo la estructura (columnas y nº de registros) y muestra
   un resumen (tablas comunes, solo en A/B, columnas distintas) con avisos suaves; el usuario confirma o cancela.
2. **Comparación completa** de registros (el worker conserva los archivos en memoria entre ambas fases).
3. **Dashboard**: Resumen Ejecutivo, «Diferencias de estructura» (desplegable) y lista de tablas con carga progresiva.
4. **Exportación** (menú «Exportar informe»): PDF compacto (recomendado), PDF completo con índice clicable,
   Excel (hoja «Resumen» + una hoja por tabla, con filtros, colores y cabeceras congeladas) e impresión del resumen.

## Desarrollo
```bash
npm install
npm run dev      # http://localhost:3000
npm run typecheck
```

## Despliegue en Vercel
1. Sube el proyecto a GitHub.
2. En vercel.com → *Add New Project* → importa el repositorio (preset Next.js, sin variables de entorno).
3. *Deploy*. También sirve Cloudflare Pages (Next.js estático/edge) sin cambios de código.

## Limitaciones conocidas
- Memoria: el límite práctico depende del navegador (~150–300 MB por base). Se avisa en pantalla.
- Bases cifradas/con contraseña, tablas vinculadas, campos complejos/adjuntos: no soportados por `mdb-reader`.
- `mdb-reader` no expone los índices de Access, por lo que la clave primaria se **detecta por heurística**
  (columna tipo Id/Código única o cualquier columna única). Se puede forzar en *Opciones avanzadas*.
  Sin clave detectable se usan todas las columnas (solo altas y bajas).
- PDF: máx. 1000 filas por tabla (Excel incluye todo).

## SEO y metadatos
- `app/layout.tsx`: título con plantilla, descripción, keywords, canonical, robots, Open Graph, Twitter Cards
  (`/og-image.png` 1200×630), verificación de Google Search Console, tema (`viewport`) y JSON-LD
  (`WebApplication`, `WebSite`, `Person` con enlaces a blog, Aitor Hub y contacto).
- `app/acerca-de/page.tsx`: página «Acerca de» con `AboutPage`, `BreadcrumbList` y `FAQPage`.
- `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`, `app/icon.svg`, `app/apple-icon.png`.
- Seguimiento: script del dashboard cargado con `next/script` en el layout.
- Tras desplegar, envía `https://compara-access.vercel.app/sitemap.xml` en Google Search Console
  y valida las vistas previas con el depurador de Facebook y el Card Validator de X.
