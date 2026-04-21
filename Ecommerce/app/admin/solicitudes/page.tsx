"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FaSearch,
  FaEye,
  FaTrash,
  FaFileImport,
  FaLaptop,
  FaGlobe,
  FaExclamationTriangle,
  FaImage,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaDollarSign,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaClipboardList,
  FaEdit,
  FaCheck
} from "react-icons/fa"
import { toast } from "react-toastify"
import { importRequestService } from "@/services/api"
import { IMAGE_BASE_URL } from "@/config/constants"

// Helper para normalizar URLs de imágenes
const getImageUrl = (path: string): string => {
  if (!path) return ""
  if (path.startsWith("http")) return path
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${IMAGE_BASE_URL}${cleanPath}`
}

// Tipos de productos de computación
const TIPO_PRODUCTO_LABELS: Record<string, string> = {
  laptop: "Laptop / Notebook",
  componente: "Componente de PC",
  periferico: "Periférico",
  monitor: "Monitor / Pantalla",
  almacenamiento: "Almacenamiento",
  red: "Equipos de Red",
  otro: "Otro"
}

// Estados disponibles
const ESTADOS = [
  { value: "pendiente", label: "Pendiente", color: "blue" },
  { value: "revision", label: "En Revisión", color: "indigo" },
  { value: "cotizando", label: "Cotizando", color: "purple" },
  { value: "cotizado", label: "Cotizado", color: "violet" },
  { value: "aprobado", label: "Aprobado", color: "teal" },
  { value: "en_proceso", label: "En Proceso", color: "cyan" },
  { value: "en_aduana", label: "En Aduana", color: "amber" },
  { value: "en_transito", label: "En Tránsito", color: "orange" },
  { value: "entregado", label: "Entregado", color: "green" },
  { value: "cancelado", label: "Cancelado", color: "gray" },
  { value: "rechazado", label: "Rechazado", color: "red" }
]

interface ImportRequest {
  id_solicitud: number
  nombre_producto: string
  tipo_producto: string
  marca?: string
  modelo?: string
  especificaciones?: string
  pais_origen?: string
  cantidad: number
  presupuesto_min?: number
  presupuesto_max?: number
  nivel_urgencia: string
  mensaje?: string
  imagenes?: string[]
  estado: string
  codigo_seguimiento?: string
  cotizacion_monto?: number
  cotizacion_nota?: string
  cotizacion_fecha?: string
  fecha_entrega_estimada?: string
  notas_admin?: string
  fecha_creacion: string
  fecha_actualizacion: string
  usuario?: {
    id: number
    name: string
    email: string
    celular?: string
  }
}

interface Estadisticas {
  total: number
  pendientes: number
  enProceso: number
  entregadas: number
  canceladas: number
  urgentes: number
}

const SolicitudesAdmin = () => {
  const [requests, setRequests] = useState<ImportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("todos")
  const [selectedRequest, setSelectedRequest] = useState<ImportRequest | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [cotizacionModalOpen, setCotizacionModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)

  // Estado para cotización
  const [cotizacionData, setCotizacionData] = useState({
    cotizacion_monto: "",
    cotizacion_nota: "",
    fecha_entrega_estimada: ""
  })

  useEffect(() => {
    fetchRequests()
    fetchEstadisticas()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await importRequestService.getAll()
      const requestsData = response.data.data || response.data
      setRequests(requestsData)
    } catch (error) {
      console.error("Error al cargar solicitudes:", error)
      toast.error("No se pudieron cargar las solicitudes")
    } finally {
      setLoading(false)
    }
  }

  const fetchEstadisticas = async () => {
    try {
      const response = await importRequestService.getEstadisticas()
      setEstadisticas(response.data.data)
    } catch (error) {
      console.error("Error al cargar estadísticas:", error)
    }
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.codigo_seguimiento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.usuario?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.usuario?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "todos" || request.estado === filterStatus

    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await importRequestService.updateStatus(id, newStatus)
      toast.success("Estado actualizado correctamente")
      fetchRequests()
      fetchEstadisticas()
    } catch (error) {
      console.error("Error al actualizar estado:", error)
      toast.error("No se pudo actualizar el estado")
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta solicitud?")) {
      try {
        await importRequestService.delete(id)
        toast.success("Solicitud eliminada correctamente")
        fetchRequests()
        fetchEstadisticas()
      } catch (error) {
        console.error("Error al eliminar solicitud:", error)
        toast.error("No se pudo eliminar la solicitud")
      }
    }
  }

  const handleViewDetails = (request: ImportRequest) => {
    setSelectedRequest(request)
    setCurrentImageIndex(0)
    setModalOpen(true)
  }

  const handleOpenCotizacion = (request: ImportRequest) => {
    setSelectedRequest(request)
    setCotizacionData({
      cotizacion_monto: request.cotizacion_monto?.toString() || "",
      cotizacion_nota: request.cotizacion_nota || "",
      fecha_entrega_estimada: request.fecha_entrega_estimada?.split("T")[0] || ""
    })
    setCotizacionModalOpen(true)
  }

  const handleSubmitCotizacion = async () => {
    if (!selectedRequest) return

    if (!cotizacionData.cotizacion_monto) {
      toast.error("El monto de cotización es requerido")
      return
    }

    try {
      await importRequestService.addCotizacion(selectedRequest.id_solicitud, {
        cotizacion_monto: parseFloat(cotizacionData.cotizacion_monto),
        cotizacion_nota: cotizacionData.cotizacion_nota || undefined,
        fecha_entrega_estimada: cotizacionData.fecha_entrega_estimada || undefined
      })
      toast.success("Cotización agregada correctamente")
      setCotizacionModalOpen(false)
      fetchRequests()
    } catch (error) {
      console.error("Error al agregar cotización:", error)
      toast.error("No se pudo agregar la cotización")
    }
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

  const getStatusBadge = (estado: string) => {
    const status = ESTADOS.find(s => s.value === estado)
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
      indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
      purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
      violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
      teal: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300",
      cyan: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
      amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
      orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
      green: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
      gray: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300",
      red: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
    }
    return colorMap[status?.color || "blue"]
  }

  const getStatusLabel = (estado: string) => {
    const status = ESTADOS.find(s => s.value === estado)
    return status?.label || estado
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return "N/A"
    return `S/ ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-fv-gold/20 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-fv-gold flex items-center justify-center text-white shadow-lg"
              >
                <FaFileImport className="text-2xl" />
              </motion.div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
                  Solicitudes de Importación
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Gestiona las solicitudes de productos de computación
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg focus-within:ring-2 focus-within:ring-primary/50 transition-all w-full sm:w-auto"
            >
              <FaSearch className="text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto, marca, código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 w-full sm:w-64"
              />
            </motion.div>
          </div>

          {/* Estadísticas */}
          {estadisticas && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6"
            >
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.total}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400">Pendientes</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{estadisticas.pendientes}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-600 dark:text-purple-400">En Proceso</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{estadisticas.enProceso}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400">Entregadas</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{estadisticas.entregadas}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/20 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400">Canceladas</p>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{estadisticas.canceladas}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400">Urgentes</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{estadisticas.urgentes}</p>
              </div>
            </motion.div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterStatus("todos")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === "todos"
                  ? "bg-primary text-white shadow-lg"
                  : "bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Todos
            </motion.button>
            {ESTADOS.map((status) => (
              <motion.button
                key={status.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus(status.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === status.value
                    ? "bg-primary text-white shadow-lg"
                    : "bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {status.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden"
        >
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-4">
                  <div className="flex-1 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <FaFileImport className="text-6xl text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No hay solicitudes de importación disponibles
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Código
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Producto
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Urgencia
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request, index) => (
                    <motion.tr
                      key={request.id_solicitud}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {request.codigo_seguimiento || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {request.nombre_producto}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {request.marca} {request.modelo}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {request.usuario?.name || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {request.usuario?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {TIPO_PRODUCTO_LABELS[request.tipo_producto] || request.tipo_producto}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getUrgencyBadge(request.nivel_urgencia)}`}>
                          {request.nivel_urgencia}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={request.estado}
                          onChange={(e) => handleStatusChange(request.id_solicitud, e.target.value)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border-none cursor-pointer ${getStatusBadge(request.estado)}`}
                        >
                          {ESTADOS.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(request.fecha_creacion).toLocaleDateString("es-PE")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleViewDetails(request)}
                            className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            title="Ver detalles"
                          >
                            <FaEye />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleOpenCotizacion(request)}
                            className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                            title="Agregar cotización"
                          >
                            <FaDollarSign />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(request.id_solicitud)}
                            className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            title="Eliminar"
                          >
                            <FaTrash />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal de detalles */}
      <AnimatePresence>
        {modalOpen && selectedRequest && (
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
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-primary to-fv-gold p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Detalles de la Solicitud</h2>
                  <p className="text-white/80 text-sm font-mono">{selectedRequest.codigo_seguimiento}</p>
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
                {/* Información del Cliente */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FaUser /> Información del Cliente
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <FaUser className="text-xs" /> Nombre
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedRequest.usuario?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <FaEnvelope className="text-xs" /> Email
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedRequest.usuario?.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <FaPhone className="text-xs" /> Teléfono
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedRequest.usuario?.celular || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información del Producto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Nombre del Producto
                    </h3>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedRequest.nombre_producto}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Tipo de Producto
                    </h3>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {TIPO_PRODUCTO_LABELS[selectedRequest.tipo_producto] || selectedRequest.tipo_producto}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Marca
                    </h3>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedRequest.marca || "N/A"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Modelo
                    </h3>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedRequest.modelo || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Especificaciones */}
                {selectedRequest.especificaciones && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Especificaciones Técnicas
                    </h3>
                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-4 rounded-xl whitespace-pre-wrap">
                      {selectedRequest.especificaciones}
                    </p>
                  </div>
                )}

                {/* Detalles adicionales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                      <FaGlobe /> País de Origen
                    </h3>
                    <p className="text-gray-900 dark:text-white">
                      {selectedRequest.pais_origen || "Cualquiera"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Cantidad
                    </h3>
                    <p className="text-gray-900 dark:text-white">
                      {selectedRequest.cantidad} unidad(es)
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                      <FaExclamationTriangle /> Urgencia
                    </h3>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold capitalize inline-block ${getUrgencyBadge(selectedRequest.nivel_urgencia)}`}>
                      {selectedRequest.nivel_urgencia}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                      <FaDollarSign /> Presupuesto
                    </h3>
                    <p className="text-gray-900 dark:text-white">
                      {selectedRequest.presupuesto_min || selectedRequest.presupuesto_max
                        ? `${formatCurrency(selectedRequest.presupuesto_min)} - ${formatCurrency(selectedRequest.presupuesto_max)}`
                        : "No especificado"}
                    </p>
                  </div>
                </div>

                {/* Cotización */}
                {selectedRequest.cotizacion_monto && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
                      <FaDollarSign /> Cotización
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-green-600 dark:text-green-400">Monto</p>
                        <p className="text-xl font-bold text-green-700 dark:text-green-300">
                          {formatCurrency(selectedRequest.cotizacion_monto)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600 dark:text-green-400">Fecha Estimada de Entrega</p>
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">
                          {selectedRequest.fecha_entrega_estimada
                            ? new Date(selectedRequest.fecha_entrega_estimada).toLocaleDateString("es-PE")
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600 dark:text-green-400">Fecha de Cotización</p>
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">
                          {selectedRequest.cotizacion_fecha
                            ? new Date(selectedRequest.cotizacion_fecha).toLocaleDateString("es-PE")
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    {selectedRequest.cotizacion_nota && (
                      <div className="mt-4">
                        <p className="text-xs text-green-600 dark:text-green-400">Nota</p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {selectedRequest.cotizacion_nota}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Mensaje */}
                {selectedRequest.mensaje && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Mensaje del Cliente
                    </h3>
                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-4 rounded-xl whitespace-pre-wrap">
                      {selectedRequest.mensaje}
                    </p>
                  </div>
                )}

                {/* Imágenes */}
                {selectedRequest.imagenes && selectedRequest.imagenes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                      <FaImage /> Imágenes ({selectedRequest.imagenes.length})
                    </h3>
                    <div className="relative">
                      {/* Main Image */}
                      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                        <img
                          src={getImageUrl(selectedRequest.imagenes[currentImageIndex])}
                          alt={`Imagen ${currentImageIndex + 1}`}
                          className="w-full h-full object-contain"
                        />

                        {/* Navigation Arrows */}
                        {selectedRequest.imagenes.length > 1 && (
                          <>
                            <button
                              onClick={() => setCurrentImageIndex((prev) => (prev - 1 + selectedRequest.imagenes!.length) % selectedRequest.imagenes!.length)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                            >
                              <FaChevronLeft />
                            </button>
                            <button
                              onClick={() => setCurrentImageIndex((prev) => (prev + 1) % selectedRequest.imagenes!.length)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                            >
                              <FaChevronRight />
                            </button>
                          </>
                        )}

                        {/* Image Counter */}
                        <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 text-white text-sm rounded-lg">
                          {currentImageIndex + 1} / {selectedRequest.imagenes.length}
                        </div>
                      </div>

                      {/* Thumbnails */}
                      {selectedRequest.imagenes.length > 1 && (
                        <div className="grid grid-cols-5 gap-2 mt-4">
                          {selectedRequest.imagenes.map((img, index) => (
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Cotización */}
      <AnimatePresence>
        {cotizacionModalOpen && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setCotizacionModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-2xl flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Agregar Cotización</h2>
                  <p className="text-white/80 text-sm">{selectedRequest.nombre_producto}</p>
                </div>
                <button
                  onClick={() => setCotizacionModalOpen(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <FaTimes className="text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monto de Cotización (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cotizacionData.cotizacion_monto}
                    onChange={(e) => setCotizacionData(prev => ({ ...prev, cotizacion_monto: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Estimada de Entrega
                  </label>
                  <input
                    type="date"
                    value={cotizacionData.fecha_entrega_estimada}
                    onChange={(e) => setCotizacionData(prev => ({ ...prev, fecha_entrega_estimada: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nota (opcional)
                  </label>
                  <textarea
                    value={cotizacionData.cotizacion_nota}
                    onChange={(e) => setCotizacionData(prev => ({ ...prev, cotizacion_nota: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Detalles adicionales de la cotización..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setCotizacionModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitCotizacion}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    <FaCheck /> Guardar Cotización
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SolicitudesAdmin
