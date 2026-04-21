"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  FaFileImport,
  FaSearch,
  FaEye,
  FaTimes,
  FaClipboardList,
  FaExclamationTriangle,
  FaDollarSign,
  FaCalendarAlt,
  FaGlobe,
  FaBoxOpen,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaImage,
  FaCheckCircle,
  FaClock,
  FaTruck,
  FaTimesCircle
} from "react-icons/fa"
import { ecommerceAuthService, ecommerceImportService, SolicitudImportacion } from "@/services/ecommerceApi"
import { IMAGE_BASE_URL } from "@/config/constants"

// Helper para URLs de imágenes
const getImageUrl = (path: string): string => {
  if (!path) return ""
  if (path.startsWith("http")) return path
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${IMAGE_BASE_URL}${cleanPath}`
}

// Tipos de productos
const TIPO_PRODUCTO_LABELS: Record<string, string> = {
  laptop: "Laptop / Notebook",
  componente: "Componente de PC",
  periferico: "Periférico",
  monitor: "Monitor / Pantalla",
  almacenamiento: "Almacenamiento",
  red: "Equipos de Red",
  otro: "Otro"
}

// Estados con colores e iconos
const ESTADOS_INFO: Record<string, { label: string; color: string; icon: React.ElementType; description: string }> = {
  pendiente: { label: "Pendiente", color: "blue", icon: FaClock, description: "Tu solicitud está siendo revisada" },
  revision: { label: "En Revisión", color: "indigo", icon: FaClipboardList, description: "Estamos evaluando tu solicitud" },
  cotizando: { label: "Cotizando", color: "purple", icon: FaDollarSign, description: "Buscando el mejor precio para ti" },
  cotizado: { label: "Cotizado", color: "violet", icon: FaCheckCircle, description: "Hemos encontrado el producto" },
  aprobado: { label: "Aprobado", color: "teal", icon: FaCheckCircle, description: "Tu solicitud ha sido aprobada" },
  en_proceso: { label: "En Proceso", color: "cyan", icon: FaBoxOpen, description: "Estamos gestionando tu pedido" },
  en_aduana: { label: "En Aduana", color: "amber", icon: FaGlobe, description: "Tu producto está en aduanas" },
  en_transito: { label: "En Tránsito", color: "orange", icon: FaTruck, description: "Tu producto está en camino" },
  entregado: { label: "Entregado", color: "green", icon: FaCheckCircle, description: "Producto entregado exitosamente" },
  cancelado: { label: "Cancelado", color: "gray", icon: FaTimesCircle, description: "Esta solicitud fue cancelada" },
  rechazado: { label: "Rechazado", color: "red", icon: FaTimesCircle, description: "No pudimos procesar tu solicitud" }
}

export default function MisSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudImportacion[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("todos")
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudImportacion | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const checkAuth = ecommerceAuthService.isAuthenticated()
    setIsAuthenticated(checkAuth)

    if (checkAuth) {
      fetchSolicitudes()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchSolicitudes = async () => {
    try {
      setLoading(true)
      const response = await ecommerceImportService.misSolicitudes()
      setSolicitudes(response.data || [])
    } catch (error) {
      console.error("Error al cargar solicitudes:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSolicitudes = solicitudes.filter((solicitud) => {
    const matchesSearch =
      solicitud.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitud.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitud.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitud.codigo_seguimiento?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "todos" || solicitud.estado === filterStatus

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (estado: string) => {
    const info = ESTADOS_INFO[estado]
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
      teal: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
      cyan: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
      amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
      green: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
      gray: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
      red: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
    }
    return colorMap[info?.color || "blue"]
  }

  const getUrgencyBadge = (urgencia: string) => {
    const styles: Record<string, string> = {
      baja: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
      media: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
      alta: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
      urgente: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
    }
    return styles[urgencia] || styles.media
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return "N/A"
    return `S/ ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
  }

  const handleViewDetails = (solicitud: SolicitudImportacion) => {
    setSelectedSolicitud(solicitud)
    setCurrentImageIndex(0)
    setModalOpen(true)
  }

  // No autenticado
  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800"
          >
            <FaExclamationTriangle className="text-6xl text-amber-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Acceso Restringido
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Debes iniciar sesión para ver tus solicitudes de importación.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/iniciar-sesion"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-fv-gold text-white font-semibold hover:shadow-lg transition-all"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/registro"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-primary text-primary hover:bg-primary/10 font-semibold transition-all"
              >
                Crear Cuenta
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-fv-gold/20 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-fv-gold flex items-center justify-center text-white shadow-lg"
            >
              <FaClipboardList className="text-3xl" />
            </motion.div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent mb-4">
            Mis Solicitudes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Revisa el estado de tus solicitudes de importación
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="flex-1 flex items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg focus-within:ring-2 focus-within:ring-primary/50">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por producto, marca o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 w-full"
            />
          </div>

          <Link
            href="/solicitud-importacion"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-fv-gold text-white font-semibold hover:shadow-lg transition-all"
          >
            <FaPlus /> Nueva Solicitud
          </Link>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 flex-wrap mb-8"
        >
          <button
            onClick={() => setFilterStatus("todos")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterStatus === "todos"
                ? "bg-primary text-white shadow-lg"
                : "bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Todos
          </button>
          {["pendiente", "cotizado", "en_proceso", "en_transito", "entregado"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === status
                  ? "bg-primary text-white shadow-lg"
                  : "bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {ESTADOS_INFO[status]?.label || status}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white/80 dark:bg-gray-900/80 rounded-2xl h-64"></div>
            ))}
          </div>
        ) : filteredSolicitudes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <FaFileImport className="text-6xl text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No tienes solicitudes
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || filterStatus !== "todos"
                ? "No se encontraron solicitudes con los filtros aplicados"
                : "Aún no has realizado ninguna solicitud de importación"}
            </p>
            <Link
              href="/solicitud-importacion"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-fv-gold text-white font-semibold hover:shadow-lg transition-all"
            >
              <FaPlus /> Crear Nueva Solicitud
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredSolicitudes.map((solicitud, index) => {
              const statusInfo = ESTADOS_INFO[solicitud.estado]
              const StatusIcon = statusInfo?.icon || FaClock

              return (
                <motion.div
                  key={solicitud.id_solicitud}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden hover:shadow-xl transition-all"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">
                          {solicitud.nombre_producto}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {solicitud.marca} {solicitud.modelo}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(solicitud.estado)}`}>
                        {statusInfo?.label || solicitud.estado}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Código de seguimiento */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Código:</span>
                      <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {solicitud.codigo_seguimiento}
                      </span>
                    </div>

                    {/* Tipo y Cantidad */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {TIPO_PRODUCTO_LABELS[solicitud.tipo_producto] || solicitud.tipo_producto}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        x{solicitud.cantidad}
                      </span>
                    </div>

                    {/* Urgencia */}
                    <div className="flex items-center gap-2">
                      <FaExclamationTriangle className="text-xs text-gray-400" />
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getUrgencyBadge(solicitud.nivel_urgencia)}`}>
                        {solicitud.nivel_urgencia}
                      </span>
                    </div>

                    {/* Cotización si existe */}
                    {solicitud.cotizacion_monto && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2">
                          <FaDollarSign className="text-green-600 dark:text-green-400" />
                          <span className="font-bold text-green-700 dark:text-green-300">
                            {formatCurrency(solicitud.cotizacion_monto)}
                          </span>
                        </div>
                        {solicitud.fecha_entrega_estimada && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-green-600 dark:text-green-400">
                            <FaCalendarAlt />
                            <span>
                              Entrega estimada: {new Date(solicitud.fecha_entrega_estimada).toLocaleDateString("es-PE")}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Estado descripción */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <StatusIcon className="text-xs" />
                      <span>{statusInfo?.description}</span>
                    </div>

                    {/* Fecha */}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Creado: {new Date(solicitud.fecha_creacion).toLocaleDateString("es-PE")}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <button
                      onClick={() => handleViewDetails(solicitud)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      <FaEye /> Ver Detalles
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* Modal de Detalles */}
      <AnimatePresence>
        {modalOpen && selectedSolicitud && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-primary to-fv-gold p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Detalle de Solicitud
                  </h2>
                  <p className="text-white/80 text-sm font-mono">
                    {selectedSolicitud.codigo_seguimiento}
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <FaTimes className="text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Estado actual */}
                <div className={`rounded-xl p-4 border ${getStatusBadge(selectedSolicitud.estado)}`}>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const statusInfo = ESTADOS_INFO[selectedSolicitud.estado]
                      const StatusIcon = statusInfo?.icon || FaClock
                      return (
                        <>
                          <StatusIcon className="text-2xl" />
                          <div>
                            <p className="font-bold text-lg">{statusInfo?.label || selectedSolicitud.estado}</p>
                            <p className="text-sm opacity-80">{statusInfo?.description}</p>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Información del Producto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Nombre del Producto
                    </h4>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {selectedSolicitud.nombre_producto}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Tipo
                    </h4>
                    <p className="text-gray-900 dark:text-white">
                      {TIPO_PRODUCTO_LABELS[selectedSolicitud.tipo_producto] || selectedSolicitud.tipo_producto}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Marca
                    </h4>
                    <p className="text-gray-900 dark:text-white">
                      {selectedSolicitud.marca || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Modelo
                    </h4>
                    <p className="text-gray-900 dark:text-white">
                      {selectedSolicitud.modelo || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Cantidad
                    </h4>
                    <p className="text-gray-900 dark:text-white">
                      {selectedSolicitud.cantidad} unidad(es)
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      País de Origen Preferido
                    </h4>
                    <p className="text-gray-900 dark:text-white">
                      {selectedSolicitud.pais_origen || "Cualquiera"}
                    </p>
                  </div>
                </div>

                {/* Especificaciones */}
                {selectedSolicitud.especificaciones && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Especificaciones Técnicas
                    </h4>
                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-4 rounded-xl whitespace-pre-wrap">
                      {selectedSolicitud.especificaciones}
                    </p>
                  </div>
                )}

                {/* Presupuesto */}
                {(selectedSolicitud.presupuesto_min || selectedSolicitud.presupuesto_max) && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Tu Presupuesto
                    </h4>
                    <p className="text-gray-900 dark:text-white">
                      {formatCurrency(selectedSolicitud.presupuesto_min)} - {formatCurrency(selectedSolicitud.presupuesto_max)}
                    </p>
                  </div>
                )}

                {/* Cotización */}
                {selectedSolicitud.cotizacion_monto && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <h4 className="text-lg font-bold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
                      <FaDollarSign /> Cotización
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-green-600 dark:text-green-400">Monto Total</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {formatCurrency(selectedSolicitud.cotizacion_monto)}
                        </p>
                      </div>
                      {selectedSolicitud.fecha_entrega_estimada && (
                        <div>
                          <p className="text-xs text-green-600 dark:text-green-400">Fecha Estimada de Entrega</p>
                          <p className="text-lg font-medium text-green-700 dark:text-green-300">
                            {new Date(selectedSolicitud.fecha_entrega_estimada).toLocaleDateString("es-PE", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                    {selectedSolicitud.cotizacion_nota && (
                      <div className="mt-4">
                        <p className="text-xs text-green-600 dark:text-green-400">Nota</p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {selectedSolicitud.cotizacion_nota}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Mensaje */}
                {selectedSolicitud.mensaje && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Tu Mensaje
                    </h4>
                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-4 rounded-xl whitespace-pre-wrap">
                      {selectedSolicitud.mensaje}
                    </p>
                  </div>
                )}

                {/* Imágenes */}
                {selectedSolicitud.imagenes && selectedSolicitud.imagenes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                      <FaImage /> Imágenes ({selectedSolicitud.imagenes.length})
                    </h4>
                    <div className="relative">
                      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                        <img
                          src={getImageUrl(selectedSolicitud.imagenes[currentImageIndex])}
                          alt={`Imagen ${currentImageIndex + 1}`}
                          className="w-full h-full object-contain"
                        />

                        {selectedSolicitud.imagenes.length > 1 && (
                          <>
                            <button
                              onClick={() => setCurrentImageIndex((prev) => (prev - 1 + selectedSolicitud.imagenes!.length) % selectedSolicitud.imagenes!.length)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                            >
                              <FaChevronLeft />
                            </button>
                            <button
                              onClick={() => setCurrentImageIndex((prev) => (prev + 1) % selectedSolicitud.imagenes!.length)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                            >
                              <FaChevronRight />
                            </button>
                          </>
                        )}

                        <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 text-white text-sm rounded-lg">
                          {currentImageIndex + 1} / {selectedSolicitud.imagenes.length}
                        </div>
                      </div>

                      {selectedSolicitud.imagenes.length > 1 && (
                        <div className="grid grid-cols-5 gap-2 mt-4">
                          {selectedSolicitud.imagenes.map((img, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                index === currentImageIndex
                                  ? "border-primary scale-105"
                                  : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                              }`}
                            >
                              <img
                                src={getImageUrl(img)}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fechas */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-4">
                  <span>
                    Creado: {new Date(selectedSolicitud.fecha_creacion).toLocaleDateString("es-PE")}
                  </span>
                  <span>
                    Actualizado: {new Date(selectedSolicitud.fecha_actualizacion).toLocaleDateString("es-PE")}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
