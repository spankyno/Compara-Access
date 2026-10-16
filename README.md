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
