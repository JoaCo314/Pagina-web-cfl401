import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Poppins } from "next/font/google";
import {
  DEFAULT_TITLE,
  DESCRIPCION_SITIO,
  NOMBRE_SITIO,
  urlSitio,
} from "@/lib/meta";
import { getSiteConfig } from "@/lib/siteConfig";
import "./globals.css";
import ChatPublico from "@/components/ChatPublico";

const poppins = Poppins({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const plex = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-plex",
});

export const viewport: Viewport = {
  themeColor: "#224259",
};

// Metadatos base de todo el sitio (SEO): el `template` de título hace que cada
// página con `title: "Sección"` publique "Sección — CFL 401 Azul". La URL base
// (metadataBase) habilita los enlaces absolutos de Open Graph.
export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  const favicon = config.faviconUrl || "/favicon.ico";

  return {
    metadataBase: new URL(urlSitio()),
    title: { default: DEFAULT_TITLE, template: `%s — ${NOMBRE_SITIO}` },
    description: DESCRIPCION_SITIO,
    manifest: "/site.webmanifest",
    icons: {
      icon: [
        { url: favicon, type: "image/x-icon" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      shortcut: favicon,
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    openGraph: {
      type: "website",
      locale: "es_AR",
      siteName: NOMBRE_SITIO,
      title: DEFAULT_TITLE,
      description: DESCRIPCION_SITIO,
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${plex.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ChatPublico />
      </body>
    </html>
  );
}
