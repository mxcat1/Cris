"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FaSearch, FaEye, FaExclamationTriangle, FaTimes } from "react-icons/fa"
import { toast } from "react-toastify"
import { claimService } from "@/services/api"

interface Reclamacion {
  id: number
  nombre: string
  email: string
  telefono?: string
  mensaje: string
  createdAt: string
}

const ReclamacionesAdmin = () => {
  const [reclamaciones, setReclamaciones] = useState<Reclamacion[]>([])
  const [filteredReclamaciones, setFilteredReclamaciones] = useState<Reclamacion[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentReclamacion, setCurrentReclamacion] = useState<Reclamacion | null>(null)

  useEffect(() => {
    const fetchReclamaciones = async () => {
      try {
        const response = await claimService.getAll()
        const reclamacionesData = response.data.data || response.data
        setReclamaciones(reclamacionesData)
        setFilteredReclamaciones(reclamacionesData)
        setLoading(false)
      } catch (error) {
        console.error("Error al cargar reclamaciones:", error)
        toast.error("Error al cargar las reclamaciones")
        setLoading(false)
      }
    }

    fetchReclamaciones()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = reclamaciones.filter(
        (reclamacion) =>
          reclamacion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reclamacion.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reclamacion.mensaje.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredReclamaciones(filtered)
    } else {
      setFilteredReclamaciones(reclamaciones)
    }
  }, [searchTerm, reclamaciones])

  const handleViewReclamacion = (reclamacion: Reclamacion) => {
    setCurrentReclamacion(reclamacion)
    setIsModalOpen(true)
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    return new Date(dateString).toLocaleDateString("es-ES", options)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-500/20 rounded-full filter blur-3xl"></div>
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
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg"
              >
                <FaExclamationTriangle className="text-2xl" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                Reclamaciones
              </h1>
            </div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg focus-within:ring-2 focus-within:ring-amber-500/50 transition-all w-full sm:w-auto"
            >
              <FaSearch className="text-gray-400" />
              <input
                type="text"
                placeholder="Buscar reclamaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 w-full sm:w-64"
              />
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 dark:text-gray-400"
          >
            Gestiona las reclamaciones de tus clientes
          </motion.p>
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
          ) : filteredReclamaciones.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Nombre
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Teléfono
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReclamaciones.map((reclamacion, index) => (
                    <motion.tr
                      key={reclamacion.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(reclamacion.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {reclamacion.nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {reclamacion.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {reclamacion.telefono || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleViewReclamacion(reclamacion)}
                          className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                        >
                          <FaEye />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <FaExclamationTriangle className="text-6xl text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No se encontraron reclamaciones
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && currentReclamacion && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000]"
            />

            {/* Modal Content */}
            <div className="fixed inset-0 flex items-center justify-center z-[1001] p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
                      <FaExclamationTriangle />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Detalle de Reclamación
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                  >
                    <FaTimes className="text-xl" />
                  </motion.button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">
                      Fecha
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {formatDate(currentReclamacion.createdAt)}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">
                      Nombre
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">{currentReclamacion.nombre}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">
                      Email
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">{currentReclamacion.email}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">
                      Teléfono
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {currentReclamacion.telefono || "No proporcionado"}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3">
                      Mensaje
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {currentReclamacion.mensaje}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ReclamacionesAdmin
