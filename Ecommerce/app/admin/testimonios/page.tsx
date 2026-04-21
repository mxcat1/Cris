"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaImage, FaUser, FaCommentDots, FaTimes, FaQuoteRight } from "react-icons/fa"
import { toast } from "react-toastify"
import { testimonialService } from "@/services/api"
import { IMAGE_BASE_URL } from "@/config/constants"

// Helper para construir URLs de imagen evitando dobles "/storage" y barras
const buildImageUrl = (path?: string) => {
  if (!path) return ""
  if (/^https?:\/\//.test(path)) return path
  const clean = path.replace(/^\/+/, "")
  return clean.startsWith("storage/") ? `${IMAGE_BASE_URL}/${clean}` : `${IMAGE_BASE_URL}/storage/${clean}`
}

interface Testimonial {
  id: number
  name: string
  message: string
  image: string
  active: boolean
  createdAt: string
  updatedAt: string
}

const TestimoniosAdmin = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [openForm, setOpenForm] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState<Testimonial | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    message: "",
    active: true,
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      setLoading(true)
      const response = await testimonialService.getAll()
      const testimonialsData = response.data.data || response.data
      setTestimonials(testimonialsData)
    } catch (error) {
      console.error("Error al cargar testimonios:", error)
      toast.error("Error al cargar los testimonios")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenForm = (testimonial?: Testimonial) => {
    if (testimonial) {
      setCurrentTestimonial(testimonial)
      setFormData({
        name: testimonial.name,
        message: testimonial.message,
        active: testimonial.active,
      })
      setPreviewImage(buildImageUrl(testimonial.image))
    } else {
      setCurrentTestimonial(null)
      setFormData({ name: "", message: "", active: true })
      setPreviewImage(null)
      setSelectedFile(null)
    }
    setOpenForm(true)
  }

  const handleCloseForm = () => {
    setOpenForm(false)
    setCurrentTestimonial(null)
    setFormData({ name: "", message: "", active: true })
    setPreviewImage(null)
    setSelectedFile(null)
  }

  const handleOpenDelete = (testimonial: Testimonial) => {
    setCurrentTestimonial(testimonial)
    setOpenDelete(true)
  }

  const handleCloseDelete = () => {
    setOpenDelete(false)
    setCurrentTestimonial(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData({
      ...formData,
      [name]: name === "active" ? checked : value,
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = () => setPreviewImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formDataToSend = new FormData()
      formDataToSend.append("name", formData.name)
      formDataToSend.append("message", formData.message)
      formDataToSend.append("active", formData.active ? "1" : "0")

      if (selectedFile) {
        formDataToSend.append("image", selectedFile)
      } else if (currentTestimonial && currentTestimonial.image) {
        formDataToSend.append("image", currentTestimonial.image)
      }

      if (currentTestimonial) {
        await testimonialService.update(currentTestimonial.id, formDataToSend)
        toast.success("Testimonio actualizado con éxito")
      } else {
        await testimonialService.create(formDataToSend)
        toast.success("Testimonio creado con éxito")
      }

      handleCloseForm()
      fetchTestimonials()
    } catch (error) {
      console.error("Error al guardar testimonio:", error)
      toast.error("Error al guardar el testimonio")
    }
  }

  const handleDelete = async () => {
    if (!currentTestimonial) return
    try {
      await testimonialService.delete(currentTestimonial.id)
      toast.success("Testimonio eliminado con éxito")
      handleCloseDelete()
      fetchTestimonials()
    } catch (error) {
      console.error("Error al eliminar testimonio:", error)
      toast.error("Error al eliminar el testimonio")
    }
  }

  const handleToggleActive = async (testimonial: Testimonial) => {
    try {
      await testimonialService.toggleActive(testimonial.id)
      toast.success(`Testimonio ${testimonial.active ? "desactivado" : "activado"} con éxito`)
      fetchTestimonials()
    } catch (error) {
      console.error("Error al cambiar estado del testimonio:", error)
      toast.error("Error al cambiar el estado del testimonio")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-rh-teal/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-fuchsia-500/20 rounded-full filter blur-3xl"></div>
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
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rh-teal to-fuchsia-600 flex items-center justify-center text-white shadow-lg"
              >
                <FaQuoteRight className="text-2xl" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-rh-teal to-fuchsia-600 bg-clip-text text-transparent">
                Testimonios
              </h1>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenForm()}
              className="flex items-center gap-2 bg-gradient-to-r from-rh-teal to-fuchsia-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <FaPlus />
              Nuevo Testimonio
            </motion.button>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 dark:text-gray-400"
          >
            Gestiona las opiniones de tus clientes
          </motion.p>
        </motion.div>

        {/* Table/Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden"
        >
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-4">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : testimonials.length === 0 ? (
            <div className="p-12 text-center">
              <FaCommentDots className="text-6xl text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No hay testimonios disponibles</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Imagen
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Nombre
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Mensaje
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {testimonials.map((testimonial, index) => (
                      <motion.tr
                        key={testimonial.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-14 h-14 rounded-xl overflow-hidden shadow-md"
                          >
                            <img
                              src={buildImageUrl(testimonial.image)}
                              alt={testimonial.name}
                              className="w-full h-full object-cover"
                            />
                          </motion.div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaUser className="text-gray-400" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {testimonial.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 max-w-md">
                            {testimonial.message}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                              testimonial.active
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {testimonial.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleOpenForm(testimonial)}
                              className="p-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary dark:hover:bg-primary/30 transition-colors"
                              title="Editar"
                            >
                              <FaEdit />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleToggleActive(testimonial)}
                              className={`p-2.5 rounded-lg transition-colors ${
                                testimonial.active
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                              }`}
                              title={testimonial.active ? "Desactivar" : "Activar"}
                            >
                              {testimonial.active ? <FaEyeSlash /> : <FaEye />}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleOpenDelete(testimonial)}
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

              {/* Mobile Cards */}
              <div className="md:hidden p-4 space-y-4">
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={testimonial.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                        <img
                          src={buildImageUrl(testimonial.image)}
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <FaUser className="text-gray-400 text-sm" />
                          <h3 className="font-bold text-lg truncate text-gray-900 dark:text-white">
                            {testimonial.name}
                          </h3>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            testimonial.active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {testimonial.active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                      {testimonial.message}
                    </p>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOpenForm(testimonial)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 transition-all text-sm font-semibold"
                      >
                        <FaEdit />
                        Editar
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleActive(testimonial)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all text-sm font-semibold ${
                          testimonial.active
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                        }`}
                      >
                        {testimonial.active ? <FaEyeSlash /> : <FaEye />}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOpenDelete(testimonial)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-all text-sm font-semibold"
                      >
                        <FaTrash />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {openForm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseForm}
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rh-teal to-fuchsia-600 flex items-center justify-center text-white">
                      <FaQuoteRight />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentTestimonial ? "Editar Testimonio" : "Nuevo Testimonio"}
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCloseForm}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                  >
                    <FaTimes className="text-xl" />
                  </motion.button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                          Nombre del Cliente <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          placeholder="Ingrese el nombre"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rh-teal/50 transition-all"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                          Mensaje <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows={5}
                          placeholder="Ingrese el testimonio del cliente"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rh-teal/50 transition-all resize-none"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-3"
                      >
                        <input
                          type="checkbox"
                          id="active"
                          name="active"
                          checked={formData.active}
                          onChange={handleInputChange}
                          className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-rh-teal focus:ring-rh-teal"
                        />
                        <label
                          htmlFor="active"
                          className="text-sm font-medium cursor-pointer text-gray-900 dark:text-white"
                        >
                          {formData.active ? "Testimonio activo" : "Testimonio inactivo"}
                        </label>
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex flex-col items-center justify-center space-y-4"
                    >
                      {previewImage && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-lg"
                        >
                          <img src={previewImage} alt="Vista previa" className="w-full h-full object-cover" />
                        </motion.div>
                      )}
                      <label className="w-full cursor-pointer">
                        <div className="flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-rh-teal transition-all">
                          <FaImage className="text-2xl text-rh-teal" />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {currentTestimonial ? "Cambiar Imagen" : "Subir Imagen"}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          required={!currentTestimonial}
                        />
                      </label>
                    </motion.div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleCloseForm}
                      className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-semibold text-gray-900 dark:text-white"
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-rh-teal to-fuchsia-600 text-white rounded-xl hover:from-rh-gold hover:to-fuchsia-700 transition-all font-semibold shadow-lg"
                    >
                      {currentTestimonial ? "Actualizar" : "Crear"}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {openDelete && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDelete}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000]"
            />

            {/* Modal Content */}
            <div className="fixed inset-0 flex items-center justify-center z-[1001] p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md"
              >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Eliminar Testimonio</h2>
                </div>

                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    ¿Estás seguro de que deseas eliminar este testimonio? Esta acción no se puede deshacer.
                  </p>
                </div>

                <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCloseDelete}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-semibold text-gray-900 dark:text-white"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg"
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

export default TestimoniosAdmin
