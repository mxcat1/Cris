import axios from "axios"
import { ECOMMERCE_API_URL, API_URL } from "../config/constants"

// Cliente axios para rutas públicas de ecommerce (sin autenticación)
const ecommerceApi = axios.create({
  baseURL: ECOMMERCE_API_URL,
})

// Cliente axios para autenticación (usa API_URL base)
const authApi = axios.create({
  baseURL: API_URL,
})

// ==================== TIPOS DEL BACKEND ====================

interface BackendProductImage {
  id_imagen: number
  image_path: string
  orden: number
}

interface BackendProduct {
  id_producto: number
  nombre: string
  descripcion: string
  precio: number
  es_oferta: boolean
  precio_oferta: number | null
  imagen_url: string | null
  imagenes?: BackendProductImage[]
  id_categoria: number
  categoria: {
    nombre: string | null
  }
}

interface BackendCategory {
  id_categoria: number
  nombre: string
  descripcion: string | null
  imagen_url: string | null
}

interface BackendBanner {
  id_banner?: number
  titulo?: string | null
  imagen_url: string
  activo?: boolean
  creado_en?: string
}

// ==================== TIPOS DEL FRONTEND ====================

export interface ProductImage {
  id: number
  image_path: string
  order: number
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  precio_de_oferta?: number
  stock: number
  imagen?: string
  images?: ProductImage[]
  category_id: number
  category?: {
    id: number
    name: string
  }
}

export interface Category {
  id: number
  name: string
  description?: string
  imagen?: string
}

export interface Banner {
  id?: number
  title?: string
  image: string
  active?: boolean
  createdAt?: string
}

// ==================== FUNCIONES DE MAPEO ====================

const mapBackendProductToFrontend = (product: BackendProduct): Product => ({
  id: product.id_producto,
  name: product.nombre,
  description: product.descripcion || "",
  price: product.precio,
  precio_de_oferta: product.es_oferta && product.precio_oferta ? product.precio_oferta : undefined,
  stock: 100, // El backend no devuelve stock en las rutas públicas, asumimos disponible
  imagen: product.imagen_url || undefined,
  images: product.imagenes?.map((img) => ({
    id: img.id_imagen,
    image_path: img.image_path,
    order: img.orden
  })) || [],
  category_id: product.id_categoria,
  category: {
    id: product.id_categoria,
    name: product.categoria?.nombre || "Sin categoría"
  }
})

const mapBackendCategoryToFrontend = (category: BackendCategory): Category => ({
  id: category.id_categoria,
  name: category.nombre,
  description: category.descripcion || undefined,
  imagen: category.imagen_url || undefined
})

const mapBackendBannerToFrontend = (banner: BackendBanner): Banner => ({
  id: banner.id_banner,
  title: banner.titulo || undefined,
  image: banner.imagen_url,
  active: banner.activo ?? true,
  createdAt: banner.creado_en
})

// ==================== SERVICIOS PÚBLICOS DE ECOMMERCE ====================

// Servicios para productos (rutas públicas sin autenticación)
export const ecommerceProductService = {
  // Obtener todos los productos
  getAll: async (): Promise<{ data: Product[] }> => {
    const response = await ecommerceApi.get<BackendProduct[]>("/productos")
    const products = response.data.map(mapBackendProductToFrontend)
    return { data: products }
  },

  // Obtener producto por ID
  getById: async (id: number): Promise<{ data: Product }> => {
    const response = await ecommerceApi.get<BackendProduct>(`/productos/${id}`)
    const product = mapBackendProductToFrontend(response.data)
    return { data: product }
  },

  // Obtener productos en oferta
  getOffers: async (): Promise<{ data: Product[] }> => {
    const response = await ecommerceApi.get<BackendProduct[]>("/ofertas")
    const products = response.data.map(mapBackendProductToFrontend)
    return { data: products }
  },

  // Obtener productos destacados (usa ofertas como destacados)
  getFeaturedProducts: async (): Promise<{ data: Product[] }> => {
    const response = await ecommerceApi.get<BackendProduct[]>("/ofertas")
    const products = response.data.map(mapBackendProductToFrontend)
    return { data: products }
  },

  // Obtener productos por categoría
  getByCategory: async (categoryId: number): Promise<{ data: Product[] }> => {
    const response = await ecommerceApi.get<BackendProduct[]>(`/categorias/${categoryId}/productos`)
    const products = response.data.map(mapBackendProductToFrontend)
    return { data: products }
  }
}

// Servicios para categorías (rutas públicas sin autenticación)
export const ecommerceCategoryService = {
  // Obtener todas las categorías
  getAll: async (): Promise<{ data: Category[] }> => {
    const response = await ecommerceApi.get<BackendCategory[]>("/categorias")
    const categories = response.data.map(mapBackendCategoryToFrontend)
    return { data: categories }
  }
}

// Servicios para banners (rutas públicas sin autenticación)
export const ecommerceBannerService = {
  // Obtener todos los banners
  getAll: async (): Promise<{ data: Banner[] }> => {
    const response = await ecommerceApi.get<BackendBanner[]>("/banners")
    const banners = response.data.map(mapBackendBannerToFrontend)
    return { data: banners }
  },

  // Obtener banner principal
  getMain: async (): Promise<{ data: Banner }> => {
    const response = await ecommerceApi.get<BackendBanner>("/banner")
    const banner = mapBackendBannerToFrontend(response.data)
    return { data: banner }
  }
}

// Servicios para libro de reclamaciones
export const ecommerceClaimService = {
  create: async (data: {
    nombre: string
    email: string
    telefono?: string
    asunto?: string
    mensaje: string
  }) => {
    return ecommerceApi.post("/libro-reclamaciones", data)
  }
}

// ==================== TIPOS DE AUTENTICACIÓN ====================

export interface User {
  id: number
  id_user: number
  name: string
  email: string
  celular?: string | null
  id_role: number
}

export interface AuthResponse {
  success: boolean
  msg?: string
  token?: string
  user?: User
  errors?: Array<{ msg: string; param: string }>
}

// ==================== SERVICIOS DE AUTENTICACIÓN ====================

const TOKEN_KEY = "ecommerce_token"
const USER_KEY = "ecommerce_user"

// ==================== TIPOS DE SOLICITUD DE IMPORTACIÓN ====================

export interface SolicitudImportacion {
  id_solicitud: number
  id_usuario: number
  nombre_producto: string
  tipo_producto: "laptop" | "componente" | "periferico" | "monitor" | "almacenamiento" | "red" | "otro"
  marca?: string
  modelo?: string
  especificaciones?: string
  pais_origen?: string
  cantidad: number
  presupuesto_min?: number
  presupuesto_max?: number
  nivel_urgencia: "baja" | "media" | "alta" | "urgente"
  mensaje?: string
  imagenes?: string[]
  estado: string
  cotizacion_monto?: number
  cotizacion_nota?: string
  cotizacion_fecha?: string
  codigo_seguimiento?: string
  fecha_entrega_estimada?: string
  fecha_creacion: string
  fecha_actualizacion: string
}

// ==================== SERVICIO DE SOLICITUDES DE IMPORTACIÓN ====================
// MVP hot-patch: endpoints públicos (sin auth). Cliente identifica su solicitud
// con el codigo_seguimiento que devuelve el POST.
// La versión con auth de cliente (misSolicitudes real) queda pendiente para el
// ciclo ecommerce-features cuando exista un sistema de auth de clientes.

export type CrearSolicitudPayload = {
  nombre_solicitante: string
  email_solicitante: string
  telefono_solicitante?: string
  nombre_producto: string
  tipo_producto:
    | "laptop"
    | "componente"
    | "periferico"
    | "monitor"
    | "almacenamiento"
    | "red"
    | "otro"
  marca?: string
  modelo?: string
  especificaciones?: string
  pais_origen?: string
  cantidad: number
  presupuesto_min?: number | string
  presupuesto_max?: number | string
  nivel_urgencia?: "baja" | "media" | "alta" | "urgente"
  mensaje?: string
}

export const ecommerceImportService = {
  // Crear solicitud (público — sin auth).
  crear: async (
    data: CrearSolicitudPayload
  ): Promise<{ success: boolean; msg: string; data?: SolicitudImportacion }> => {
    const response = await ecommerceApi.post("/solicitudes-importacion", data)
    return response.data
  },

  // Seguimiento público por código de seguimiento.
  seguimiento: async (
    codigo: string
  ): Promise<{ success: boolean; data?: SolicitudImportacion; msg?: string }> => {
    const response = await ecommerceApi.get(`/seguimiento/${codigo}`)
    return response.data
  },

  // Legacy: mantenido como stub para no romper imports en `/mis-solicitudes`
  // hasta que se implemente auth de clientes en ecommerce-features.
  misSolicitudes: async (): Promise<{ success: boolean; data: SolicitudImportacion[] }> => {
    return { success: true, data: [] }
  },
}

export const ecommerceAuthService = {
  // Registro de clientes (público)
  register: async (data: {
    name: string
    email: string
    password: string
    celular?: string
  }): Promise<AuthResponse> => {
    const response = await authApi.post<AuthResponse>("/auth/register-customer", data)

    if (response.data.success && response.data.token && response.data.user) {
      localStorage.setItem(TOKEN_KEY, response.data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user))
    }

    return response.data
  },

  // Login
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await authApi.post<AuthResponse>("/auth/login", { email, password })

    if (response.data.success && response.data.token && response.data.user) {
      localStorage.setItem(TOKEN_KEY, response.data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user))
    }

    return response.data
  },

  // Logout
  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  // Obtener usuario actual
  getCurrentUser: (): User | null => {
    if (typeof window === "undefined") return null
    const userStr = localStorage.getItem(USER_KEY)
    if (!userStr) return null
    try {
      return JSON.parse(userStr) as User
    } catch {
      return null
    }
  },

  // Verificar si está autenticado
  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem(TOKEN_KEY)
  },

  // Obtener token
  getToken: (): string | null => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(TOKEN_KEY)
  }
}

export default ecommerceApi
