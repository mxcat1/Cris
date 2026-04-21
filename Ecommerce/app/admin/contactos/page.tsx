"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FaSearch, FaEye, FaTrash, FaCheck, FaEnvelope, FaTimes } from "react-icons/fa"
import { toast } from "react-toastify"
import api from "@/services/api"

interface Contacto {
  id: number
  nombre: string
  telefono: string
  email: string
  titulo: string
  categoria: string
  mensaje: string
  leido: boolean
  createdAt: string
}

const ContactosAdmin = () => {
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedContacto, setSelectedContacto] = useState<Contacto | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Cargar contactos
  useEffect(() => {
    fetchContactos()
  }, [])

  const fetchContactos = async () => {
    try {
      setLoading(true)
      const response = await api.get("/contacts")
      const contactsData = response.data.data || response.data
      setContactos(contactsData)
    } catch (error) {
      console.error("Error al cargar los contactos:", error)
      toast.error("No se pudieron cargar los mensajes de contacto")
    } finally {
      setLoading(false)
    }
  }

  // Filtrar contactos por término de búsqueda
  const filteredContactos = contactos.filter(
    (contacto) =>
      contacto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contacto.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contacto.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contacto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Marcar como leído
  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/contacts/${id}/read`, {})
      toast.success("Mensaje marcado como leído")
      fetchContactos() // Recargar la lista
    } catch (error) {
      console.error("Error al marcar como leído:", error)
      toast.error("No se pudo marcar el mensaje como leído")
    }
  }

  // Eliminar contacto
  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este mensaje?")) {
      try {
        await api.delete(`/contacts/${id}`)
        toast.success("Mensaje eliminado correctamente")
        fetchContactos() // Recargar la lista
      } catch (error) {
        console.error("Error al eliminar el mensaje:", error)
        toast.error("No se pudo eliminar el mensaje")
      }
    }
  }

  // Ver detalles del contacto
  const handleViewDetails = (contacto: Contacto) => {
    setSelectedContacto(contacto)
    setModalOpen(true)

    // Si no está leído, marcarlo como leído
    if (!contacto.leido) {
      handleMarkAsRead(contacto.id)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-rh-teal/20 rounded-full filter blur-3xl"></div>
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
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-rh-gold flex items-center justify-center text-white shadow-lg"
              >
                <FaEnvelope className="text-2xl" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-500 to-rh-gold bg-clip-text text-transparent">
                Mensajes de Contacto
              </h1>
            </div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg focus-within:ring-2 focus-within:ring-purple-500/50 transition-all w-full sm:w-auto"
            >
              <FaSearch className="text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email, título..."
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
            Gestiona los mensajes de contacto de tus clientes
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
          ) : filteredContactos.length === 0 ? (
            <div className="p-12 text-center">
              <FaEnvelope className="text-6xl text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No hay mensajes de contacto disponibles
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Nombre
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Título
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Categoría
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
                  {filteredContactos.map((contacto, index) => (
                    <motion.tr
                      key={contacto.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                        !contacto.leido ? "bg-purple-50/50 dark:bg-purple-900/10" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                            contacto.leido
                              ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                              : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          }`}
                        >
                          {contacto.leido ? "Leído" : "No leído"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {contacto.nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {contacto.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {contacto.titulo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {contacto.categoria}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(contacto.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleViewDetails(contacto)}
                            className="p-2.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50 transition-colors"
                            title="Ver detalles"
                          >
                            <FaEye />
                          </motion.button>
                          {!contacto.leido && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleMarkAsRead(contacto.id)}
                              className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors"
                              title="Marcar como leído"
                            >
                              <FaCheck />
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(contacto.id)}
                            className="p-2.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
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

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && selectedContacto && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-rh-gold flex items-center justify-center text-white">
                      <FaEnvelope />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Detalles del mensaje
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setModalOpen(false)}
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
                    <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      Nombre
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">{selectedContacto.nombre}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      Email
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">{selectedContacto.email}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      Teléfono
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">{selectedContacto.telefono}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      Título
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">{selectedContacto.titulo}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      Categoría
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">{selectedContacto.categoria}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      Fecha
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {new Date(selectedContacto.createdAt).toLocaleString()}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-3">
                      Mensaje
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedContacto.mensaje}
                    </p>
                  </motion.div>
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-semibold text-gray-900 dark:text-white"
                  >
                    Cerrar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      handleDelete(selectedContacto.id)
                      setModalOpen(false)
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg"
                  >
                    Eliminar
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ContactosAdmin
