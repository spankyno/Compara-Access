# Informe de auditoría de seguridad

Fecha: 17 de octubre de 2026 · Alcance: código de la aplicación, dependencias, cabeceras HTTP y flujo de archivos.
Modelo: aplicación 100 % cliente (sin API ni base de datos). Los archivos se procesan en el navegador.

## Hallazgos corregidos
| Id | Severidad | Hallazgo | Corrección |
|----|-----------|----------|------------|
| S1 | Alta | Next.js 14.2.15 con decenas de avisos (DoS, SSRF, caché, XSS con CSP/nonces, optimizador de imágenes) | Actualizado a Next 16.4.2 + React 19.3.1 (webpack fijado en `dev`/`build`) |
| S2 | Media | jsPDF 2.5.2 → `dompurify` vulnerable (varios XSS) | jsPDF 4.2.1 + jspdf-autotable 5.0.9 |
| S3 | Baja | `uuid` vulnerable dentro de `exceljs` | `overrides: uuid ^11.1.1` (probado con la exportación) |
| S4 | Media | Sin cabeceras de seguridad | CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP; `poweredByHeader: false` |
| S5 | Media | Configuración JSON importada fusionada sin validar (riesgo de *prototype pollution*) | `sanitizeOptions()` reconstruye el objeto desde cero, filtra `__proto__`/`constructor`/`prototype`, fuerza tipos y límites; archivo ≤ 1 MB |
| S6 | Media | Cualquier archivo con extensión .accdb/.mdb se enviaba al parser | Validación de extensión, tamaño (≤ 400 MB) y cabecera Jet/ACE antes de leerlo |
| S7 | Media | Archivos manipulados podían agotar memoria o bloquear el worker | Tope de 3 000 000 registros por base y *watchdog* de 10 min de inactividad |
| S8 | Baja | JSON-LD incrustado sin escapar `<` | `safeJsonForScript()` |
| S9 | Baja | Nombres de descarga derivados de nombres de tabla | `safeFilename()` |
| S10 | Info | Sin canal de contacto de seguridad | `/.well-known/security.txt` |

## Verificado sin cambios necesarios
- **Inyección de fórmulas en Excel**: ExcelJS guarda los textos que empiezan por `=`, `+`, `@` como cadenas (comprobado: el XML no contiene `<f>`).
- **XSS**: React escapa todo el contenido; los únicos `dangerouslySetInnerHTML` son el JSON-LD (ahora escapado) y el script de tema (cadena fija).
- **Almacenamiento**: solo se guarda la preferencia de tema en `localStorage`. Ningún dato de usuario se persiste.
- **Enlaces externos**: `rel="noopener"`.

## Riesgos aceptados / decisiones pendientes
1. **Script de seguimiento (tercero)**: se carga sin SRI (el script puede cambiar) y tiene acceso al DOM de la página. La CSP limita a qué dominios puede conectarse. Sin modificar, por decisión del propietario.
2. **CSP con `'unsafe-inline'` en scripts**: Next.js inyecta scripts de arranque en línea y el sitio es estático (sin nonces). Mitigado por `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'` y origen único de scripts.
3. **Avisos de `npm audit` restantes (7, solo compilación)**: cadena de Tailwind 3 (`braces`, `chokidar`, `micromatch`, `postcss-selector-parser`). Se ejecutan en tiempo de build sobre código propio y no llegan al navegador. Solución: migrar a Tailwind 4.
4. **CSP sin probar en navegador real** durante esta auditoría. Verificar en una vista previa de Vercel (consola sin errores de CSP; comparar, exportar Excel/PDF y descargar). Para depurar: variable de entorno `CSP_REPORT_ONLY=1`.
5. **Límites del parser**: `mdb-reader` es un parser de terceros ante archivos hostiles; los límites reducen, pero no eliminan, el riesgo de cuelgue del propio navegador (el worker aísla la interfaz).

## Recomendaciones futuras
- Activar Dependabot/Renovate y ejecutar `npm audit` en CI.
- Tests automáticos del motor de comparación y de `lib/security.ts`.
- Si se añade autenticación o historial: validar en servidor, cookies `HttpOnly`/`SameSite`, y no guardar nunca los archivos.
