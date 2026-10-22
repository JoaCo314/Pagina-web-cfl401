import type { Metadata } from "next";
import { IBM_Plex_Sans, Poppins } from "next/font/google";
import {
  DEFAULT_TITLE,
  DESCRIPCION_SITIO,
  NOMBRE_SITIO,
  urlSitio,
} from "@/lib/meta";
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

// Metadatos base de todo el sitio (SEO): el `template` de título hace que cada
// página con `title: "Sección"` publique "Sección — CFL 401 Azul". La URL base
// (metadataBase) habilita los enlaces absolutos de Open Graph.
export const metadata: Metadata = {
  metadataBase: new URL(urlSitio()),
  title: { default: DEFAULT_TITLE, template: `%s — ${NOMBRE_SITIO}` },
  description: DESCRIPCION_SITIO,
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: NOMBRE_SITIO,
    title: DEFAULT_TITLE,
    description: DESCRIPCION_SITIO,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
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
