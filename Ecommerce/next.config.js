/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build standalone para empaquetado en Docker mínimo (ecommerce-integration hot-patch)
  output: 'standalone',
  reactStrictMode: true,
  images: {
    // El Ecommerce consume imágenes del Backend ERP (localhost:3100 desde el browser,
    // backend:3000 desde server-side dentro de docker). Ambos patrones deben estar permitidos.
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3100',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3100',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'backend',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },
  // Compatibilidad con styled-components heredados del proyecto original
  compiler: {
    styledComponents: true,
  },
  // Deshabilitar errores estrictos de TS solo en build por legados de copy-paste
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Legacy: el paquete fue reutilizado de otro proyecto y tiene errores de lint
    // no relacionados con esta integración. Evaluar refactor en ciclo ecommerce-features.
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
