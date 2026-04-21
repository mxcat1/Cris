"use client"

// ecommerce-integration MVP hot-patch B:
//   Página pública de seguimiento de solicitud de importación.
//   Llama GET /api/ecommerce/seguimiento/:codigo y muestra el estado actual
//   con un timeline visual. Sin auth.

import { Suspense, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  FaClipboardList,
  FaCheckCircle,
  FaHourglassHalf,
  FaFileInvoiceDollar,
  FaTruck,
  FaBoxOpen,
  FaExclamationTriangle,
  FaArrowLeft,
} from "react-icons/fa"
import { ecommerceImportService } from "@/services/ecommerceApi"

type EstadoKey =
  | "recibida"
  | "en_revision"
  | "cotizada"
  | "aprobada"
  | "en_transito"
  | "entregada"
  | "rechazada"

type SolicitudSeguimiento = {
  codigo_seguimiento: string
  nombre_producto: string
  tipo_producto: string
  marca?: string
  modelo?: string
  cantidad: number
  nivel_urgencia?: string
  estado: EstadoKey
  cotizacion_monto?: number | null
  cotizacion_nota?: string | null
  cotizacion_fecha?: string | null
  fecha_entrega_estimada?: string | null
  created_at?: string
  updated_at?: string
}

const ESTADOS_ORDEN: EstadoKey[] = [
  "recibida",
  "en_revision",
  "cotizada",
  "aprobada",
  "en_transito",
  "entregada",
]

const ESTADO_LABEL: Record<EstadoKey, string> = {
  recibida: "Recibida",
  en_revision: "En revisión",
  cotizada: "Cotizada",
  aprobada: "Aprobada",
  en_transito: "En tránsito",
  entregada: "Entregada",
  rechazada: "Rechazada",
}

const ESTADO_ICON: Record<EstadoKey, React.ComponentType<{ className?: string }>> = {
  recibida: FaClipboardList,
  en_revision: FaHourglassHalf,
  cotizada: FaFileInvoiceDollar,
  aprobada: FaCheckCircle,
  en_transito: FaTruck,
  entregada: FaBoxOpen,
  rechazada: FaExclamationTriangle,
}

function SeguimientoContent() {
  const params = useParams<{ codigo: string }>()
  const codigo = params.codigo
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SolicitudSeguimiento | null>(null)

  useEffect(() => {
    if (!codigo) return
    let cancelled = false
    const fetchSeguimiento = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await ecommerceImportService.seguimiento(codigo)
        if (cancelled) return
        if (res.success && res.data) {
          setData(res.data as unknown as SolicitudSeguimiento)
        } else {
          setError(res.msg || "No encontramos una solicitud con ese código.")
        }
      } catch (err: unknown) {
        if (cancelled) return
        console.error("[seguimiento] error:", {
          message: err instanceof Error ? err.message : String(err),
        })
        setError("No encontramos una solicitud con ese código.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchSeguimiento()
    return () => {
      cancelled = true
    }
  }, [codigo])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-red-200">
          <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Solicitud no encontrada</h1>
          <p className="text-gray-600 mb-6">{error ?? "Revisa el código e intenta de nuevo."}</p>
          <p className="text-sm text-gray-500 mb-6">
            Código buscado: <span className="font-mono font-bold">{codigo}</span>
          </p>
          <Link
            href="/solicitud-importacion"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            <FaArrowLeft /> Volver al formulario
          </Link>
        </div>
      </div>
    )
  }

  const estadoActual = data.estado
  const esRechazada = estadoActual === "rechazada"
  const indiceActual = ESTADOS_ORDEN.indexOf(estadoActual)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 dark:from-gray-950 dark:via-gray-900 dark:to-black py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/solicitud-importacion"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <FaArrowLeft /> Nueva solicitud
        </Link>

        {/* Card principal */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-xl border border-gray-200 dark:border-gray-800 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Código de seguimiento
              </p>
              <p className="text-2xl font-mono font-bold text-primary">
                {data.codigo_seguimiento}
              </p>
            </div>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
                esRechazada
                  ? "bg-red-100 text-red-700 border border-red-300"
                  : "bg-green-100 text-green-700 border border-green-300"
              }`}
            >
              {(() => {
                const Icon = ESTADO_ICON[estadoActual]
                return <Icon className="text-lg" />
              })()}
              {ESTADO_LABEL[estadoActual]}
            </div>
          </div>

          {/* Info del producto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Producto</p>
              <p className="font-bold text-gray-900 dark:text-white">{data.nombre_producto}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tipo</p>
              <p className="font-semibold text-gray-700 dark:text-gray-300 capitalize">
                {data.tipo_producto}
              </p>
            </div>
            {data.marca && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Marca</p>
                <p className="font-semibold text-gray-700 dark:text-gray-300">{data.marca}</p>
              </div>
            )}
            {data.modelo && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Modelo</p>
                <p className="font-semibold text-gray-700 dark:text-gray-300">{data.modelo}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cantidad</p>
              <p className="font-semibold text-gray-700 dark:text-gray-300">{data.cantidad}</p>
            </div>
            {data.nivel_urgencia && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Urgencia</p>
                <p className="font-semibold text-gray-700 dark:text-gray-300 capitalize">
                  {data.nivel_urgencia}
                </p>
              </div>
            )}
          </div>

          {/* Cotización (si existe) */}
          {data.cotizacion_monto && (
            <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FaFileInvoiceDollar className="text-primary" />
                Cotización disponible
              </h3>
              <p className="text-3xl font-black text-primary mb-2">
                USD {Number(data.cotizacion_monto).toFixed(2)}
              </p>
              {data.cotizacion_nota && (
                <p className="text-gray-700 dark:text-gray-300 mb-2">{data.cotizacion_nota}</p>
              )}
              {data.cotizacion_fecha && (
                <p className="text-sm text-gray-500">
                  Cotizado el {new Date(data.cotizacion_fecha).toLocaleDateString("es-PE")}
                </p>
              )}
            </div>
          )}

          {data.fecha_entrega_estimada && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 text-center">
              <p className="text-sm text-blue-700 mb-1">Fecha estimada de entrega</p>
              <p className="text-xl font-bold text-blue-900">
                {new Date(data.fecha_entrega_estimada).toLocaleDateString("es-PE", {
                  dateStyle: "long",
                })}
              </p>
            </div>
          )}

          {/* Timeline de estados */}
          {!esRechazada && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-6">Progreso</h3>
              <ol className="relative border-l-4 border-primary/30 ml-4 space-y-8">
                {ESTADOS_ORDEN.map((estado, idx) => {
                  const completado = idx <= indiceActual
                  const actual = idx === indiceActual
                  const Icon = ESTADO_ICON[estado]
                  return (
                    <li key={estado} className="ml-6">
                      <span
                        className={`absolute -left-[18px] flex items-center justify-center w-8 h-8 rounded-full ring-4 ring-white dark:ring-gray-900 ${
                          completado
                            ? "bg-primary text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                        }`}
                      >
                        <Icon className="text-xs" />
                      </span>
                      <h4
                        className={`font-semibold ${
                          actual
                            ? "text-primary text-lg"
                            : completado
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-400 dark:text-gray-600"
                        }`}
                      >
                        {ESTADO_LABEL[estado]}
                        {actual && <span className="ml-2 text-xs font-normal">(estado actual)</span>}
                      </h4>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}

          {esRechazada && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
              <FaExclamationTriangle className="text-red-500 text-3xl mx-auto mb-2" />
              <p className="font-semibold text-red-700">
                Esta solicitud fue rechazada. Contáctanos para más información.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500">
          Última actualización:{" "}
          {data.updated_at
            ? new Date(data.updated_at).toLocaleString("es-PE")
            : "desconocida"}
        </p>
      </div>
    </div>
  )
}

export default function SeguimientoSolicitudPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <SeguimientoContent />
    </Suspense>
  )
}
