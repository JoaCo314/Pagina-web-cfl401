import type { NextConfig } from "next";

// Durante el build y la ejecución en Compose, `backend` resuelve al servicio
// interno. Para ejecutar Frontend fuera de Docker se puede definir BACKEND_URL.
const backendUrl = process.env.BACKEND_URL ?? "http://backend:3000";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
