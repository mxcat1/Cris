// Configuración de URLs hacia el Backend ERP.
//
// ecommerce-integration hot-patch:
//   NEXT_PUBLIC_API_URL se inyecta via docker-compose (cliente = browser).
//   Ej: http://localhost:3100 (host del ERP en dev).
//   Fallback para dev local fuera de docker: http://localhost:3100.
//
// Nota: las llamadas al API se hacen desde el browser (client-side) en este
// Ecommerce, por eso NEXT_PUBLIC_*. Si alguna página añade server-side fetch,
// usar una segunda var `INTERNAL_API_URL=http://backend:3000` y distinguir.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3100"

// Backend API (Express.js) - rutas públicas de ecommerce
export const ECOMMERCE_API_URL = `${API_BASE}/api/ecommerce`
// Backend API (Express.js) - rutas admin con autenticación
export const API_URL = `${API_BASE}/api`
// Base URL para imágenes del Backend (servidas en /uploads/*)
export const IMAGE_BASE_URL = API_BASE

export const CATEGORIES = {
  REPUESTOS: "Repuestos",
  TUNNING: "Tunning",
  ACCESORIOS: "Accesorios",
  RACING: "Racing",
  POR_MARCA: "Por Marca",
  POR_SISTEMA: "Por Sistema",
}

// URLs anteriores (Laravel) - ya no se usan
// https://api.globivaldetalles.com/api
// http://127.0.0.1:8000/api
