import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Footer } from "@/components/Footer";
import { AUTHOR, BLOG_URL, CONTACT_URL, HUB_URL, SITE_DESC, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} · Informe de diferencias en Excel y PDF`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: ["comparar bases de datos access", "comparar accdb", "comparar mdb", "diferencias access", "diff access", "informe diferencias excel", "comparador access online", "registros añadidos eliminados modificados"],
  authors: [{ name: AUTHOR, url: BLOG_URL }],
  creator: AUTHOR,
  publisher: AUTHOR,
  category: "utilities",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  verification: { google: "MEiDmnJOvnWITHUi0HCLxuoulOEm0oTM4fwQMugxoyY" }, // → <meta name="google-site-verification" ...>
  openGraph: {
    type: "website", locale: "es_ES", url: SITE_URL, siteName: SITE_NAME,
    title: `${SITE_NAME} · Informe de diferencias en Excel y PDF`, description: SITE_DESC,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Comparador de bases de datos Access: registros añadidos, eliminados y modificados", type: "image/png" }],
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESC, images: ["/og-image.png"] },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1,
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#A4373A" }, { media: "(prefers-color-scheme: dark)", color: "#331112" }],
};

/** Datos estructurados (schema.org) enlazando app, autor, blog, Aitor Hub y contacto */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication", "@id": `${SITE_URL}/#app`, name: SITE_NAME, url: SITE_URL, description: SITE_DESC,
      applicationCategory: "UtilitiesApplication", operatingSystem: "Any (navegador web)", browserRequirements: "Requiere JavaScript y Web Workers",
      inLanguage: "es", isAccessibleForFree: true, image: `${SITE_URL}/og-image.png`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      featureList: ["Compara dos bases .accdb/.mdb", "Registros añadidos, eliminados y modificados", "Comparación de esquema", "Exportación a Excel y PDF", "Procesamiento 100 % en el navegador"],
      author: { "@id": `${BLOG_URL}/#aitor` }, creator: { "@id": `${BLOG_URL}/#aitor` }, publisher: { "@id": `${BLOG_URL}/#aitor` },
      mainEntityOfPage: { "@id": `${SITE_URL}/#website` },
    },
    {
      "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, inLanguage: "es",
      publisher: { "@id": `${BLOG_URL}/#aitor` },
    },
    {
      "@type": "Person", "@id": `${BLOG_URL}/#aitor`, name: AUTHOR, url: BLOG_URL,
      sameAs: [BLOG_URL, HUB_URL],
      contactPoint: { "@type": "ContactPoint", contactType: "customer support", url: CONTACT_URL, availableLanguage: "es" },
      owns: [{ "@type": "WebSite", name: "Aitor Hub", url: HUB_URL }, { "@id": `${SITE_URL}/#app` }],
    },
  ],
};

// Aplica el tema guardado antes del primer pintado (evita parpadeo)
const themeInit = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
        {/* Seguimiento del dashboard personal */}
        <Script src="https://aitors-hub-dashboard.asanchezgu.workers.dev/tracker.js" data-app="compara-access" data-key="ak_3453feb1cce24b2eb2f75783f0d55dd0" strategy="afterInteractive" />
      </body>
    </html>
  );
}
