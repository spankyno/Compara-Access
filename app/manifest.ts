import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Comparador de bases de datos Access", short_name: "Compara Access", lang: "es",
    description: "Compara dos bases de datos Access y exporta el informe a Excel y PDF.",
    start_url: "/", display: "standalone", background_color: "#ffffff", theme_color: "#A4373A",
    icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
