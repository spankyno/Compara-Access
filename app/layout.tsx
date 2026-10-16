import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comparador de bases de datos Access",
  description: "Compara dos bases de datos .accdb/.mdb. Todo se procesa en tu navegador.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
