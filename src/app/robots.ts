import type { MetadataRoute } from "next";
import { urlSitio } from "@/lib/meta";

/// Robots para buscadores: todo lo público indexable, con el panel, la API y
/// las páginas de sesión fuera del alcance. Referencia al sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/panel", "/api", "/login"],
      },
    ],
    sitemap: `${urlSitio()}/sitemap.xml`,
  };
}