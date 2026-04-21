import api from "../lib/api"

/**
 * Admin UI para solicitudes de importación (hot-patch B).
 * Endpoints del ERP:
 *   GET  /api/solicitudes-importacion        — listado (auth requerido)
 *   PUT  /api/solicitudes-importacion/:id/estado — cambiar estado / cotización
 */

export type EstadoSolicitud =
  | "recibida"
  | "en_revision"
  | "cotizada"
  | "aprobada"
  | "en_transito"
  | "entregada"
  | "rechazada"

export type NivelUrgencia = "baja" | "media" | "alta" | "urgente"

export interface SolicitudImportacion {
  id_solicitud: number
  codigo_seguimiento: string
  nombre_solicitante: string
  email_solicitante: string
  telefono_solicitante: string | null
  id_usuario: number | null
  nombre_producto: string
  tipo_producto: string
  marca: string | null
  modelo: string | null
  especificaciones: string | null
  pais_origen: string | null
  cantidad: number
  presupuesto_min: string | number | null
  presupuesto_max: string | number | null
  nivel_urgencia: NivelUrgencia
  mensaje: string | null
  estado: EstadoSolicitud
  cotizacion_monto: string | number | null
  cotizacion_nota: string | null
  cotizacion_fecha: string | null
  fecha_entrega_estimada: string | null
  notas_admin: string | null
  createdAt?: string
  updatedAt?: string
  created_at?: string
  updated_at?: string
}

export interface UpdateEstadoPayload {
  estado?: EstadoSolicitud
  notas_admin?: string | null
  cotizacion_monto?: number | null
  cotizacion_nota?: string | null
  cotizacion_fecha?: string | null
  fecha_entrega_estimada?: string | null
}

export const solicitudImportacionService = {
  listAll: async (params?: {
    estado?: EstadoSolicitud
    limit?: number
    offset?: number
  }): Promise<SolicitudImportacion[]> => {
    const res = await api.get<{ success: boolean; data: SolicitudImportacion[] }>(
      "/solicitudes-importacion",
      { params }
    )
    return res.data.data
  },

  updateEstado: async (
    id: number,
    payload: UpdateEstadoPayload
  ): Promise<SolicitudImportacion> => {
    const res = await api.put<{ success: boolean; data: SolicitudImportacion }>(
      `/solicitudes-importacion/${id}/estado`,
      payload
    )
    return res.data.data
  },
}

// Etiquetas legibles reutilizables en la UI
export const ESTADO_LABELS: Record<EstadoSolicitud, string> = {
  recibida: "Recibida",
  en_revision: "En revisión",
  cotizada: "Cotizada",
  aprobada: "Aprobada",
  en_transito: "En tránsito",
  entregada: "Entregada",
  rechazada: "Rechazada",
}

export const ESTADO_COLORES: Record<EstadoSolicitud, string> = {
  recibida: "bg-blue-100 text-blue-800 border-blue-300",
  en_revision: "bg-yellow-100 text-yellow-800 border-yellow-300",
  cotizada: "bg-purple-100 text-purple-800 border-purple-300",
  aprobada: "bg-green-100 text-green-800 border-green-300",
  en_transito: "bg-indigo-100 text-indigo-800 border-indigo-300",
  entregada: "bg-emerald-100 text-emerald-800 border-emerald-300",
  rechazada: "bg-red-100 text-red-800 border-red-300",
}

export const URGENCIA_COLORES: Record<NivelUrgencia, string> = {
  baja: "bg-green-50 text-green-700",
  media: "bg-yellow-50 text-yellow-700",
  alta: "bg-orange-50 text-orange-700",
  urgente: "bg-red-50 text-red-700",
}
