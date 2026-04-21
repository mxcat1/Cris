"use client"

import { useState, useEffect } from "react"
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTimes, FaFolder, FaHashtag } from "react-icons/fa"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "react-toastify"
import { categoryService } from "@/services/api"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"

interface Category {
  id: number;
  name: string;
}

const CategorySchema = Yup.object().shape({
  name: Yup.string().required("El nombre es requerido").min(3, "El nombre debe tener al menos 3 caracteres"),
})

// Skeleton Loader para tabla
const TableRowSkeleton = () => (
  <tr className="animate-pulse border-b border-gray-200 dark:border-gray-800">
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
    </td>
    <td className="px-6 py-4">
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </td>
  </tr>
)

// Skeleton Loader para cards
const CardSkeleton = () => (
  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 animate-pulse">
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  </div>
)

const CategoriasAdmin = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getAll()
        const categoriesData = response.data.data || response.data
        setCategories(categoriesData)
        setFilteredCategories(categoriesData)
        setLoading(false)
      } catch (error) {
        console.error("Error al cargar categorías:", error)
        toast.error("Error al cargar las categorías")
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = categories.filter((category) => category.name.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredCategories(filtered)
    } else {
      setFilteredCategories(categories)
    }
  }, [searchTerm, categories])

  const handleAddCategory = () => {
    setCurrentCategory(null)
    setIsModalOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category)
    setIsModalOpen(true)
  }

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta categoría?")) {
      try {
        await categoryService.delete(id)
        setCategories(categories.filter((category) => category.id !== id))
        toast.success("Categoría eliminada correctamente")
      } catch (error) {
        console.error("Error al eliminar categoría:", error)
        toast.error("Error al eliminar la categoría")
      }
    }
  }

  const handleSaveCategory = async (values: { name: string }, { setSubmitting, resetForm }: any) => {
    try {
      if (currentCategory) {
        const response = await categoryService.update(currentCategory.id, values)
        const categoryData = response.data.data || response.data
        const updatedCategories = categories.map((c) => (c.id === currentCategory.id ? categoryData : c))
        setCategories([...updatedCategories])
        toast.success("Categoría actualizada correctamente")
      } else {
        const response = await categoryService.create(values)
        const categoryData = response.data.data || response.data
        setCategories((prevCategories) => [...prevCategories, categoryData])
        toast.success("Categoría creada correctamente")
      }

      resetForm()
      setCurrentCategory(null)
      setIsModalOpen(false)
    } catch (error: any) {
      console.error("Error al guardar categoría:", error)
      const errorMessage = error.response?.data?.message || error.message
      toast.error(`Error al guardar la categoría: ${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentCategory(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-rh-teal/20 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-rh-gold bg-clip-text text-transparent mb-2">
                Gestión de Categorías
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Administra las categorías principales de tu catálogo
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddCategory}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-rh-gold text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              <FaPlus />
              Nueva Categoría
            </motion.button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </motion.div>

        {/* Desktop Table View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden md:block bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Nombre</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRowSkeleton key={index} />
                  ))
                ) : filteredCategories.length > 0 ? (
                  filteredCategories.map((category, index) => (
                    <motion.tr
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-rh-teal/20 flex items-center justify-center">
                            <FaHashtag className="text-primary text-xs" />
                          </div>
                          <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                            {category.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-fv-gold flex items-center justify-center shadow-md">
                            <FaFolder className="text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {category.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Categoría Principal
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditCategory(category)}
                            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-primary hover:text-white transition-colors"
                            title="Editar"
                          >
                            <FaEdit />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                            title="Eliminar"
                          >
                            <FaTrash />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                          <FaFolder className="text-3xl text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          No se encontraron categorías
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Mobile Card View */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))
          ) : filteredCategories.length > 0 ? (
            filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800"
              >
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-fv-gold flex items-center justify-center shadow-md">
                      <FaFolder className="text-white text-xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full font-mono">
                          #{category.id}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Categoría Principal
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEditCategory(category)}
                      className="flex-1 py-2 px-4 bg-gradient-to-r from-primary to-rh-gold text-white rounded-lg font-medium text-sm hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
                    >
                      <FaEdit />
                      Editar
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-shadow"
                    >
                      <FaTrash />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <FaFolder className="text-4xl text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                No se encontraron categorías
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentCategory ? "Editar Categoría" : "Nueva Categoría"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="p-6">
                <Formik
                  initialValues={{ name: currentCategory?.name || "" }}
                  validationSchema={CategorySchema}
                  onSubmit={handleSaveCategory}
                >
                  {({ isSubmitting }) => (
                    <Form>
                      <div className="mb-6">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nombre de la categoría *
                        </label>
                        <Field
                          type="text"
                          name="name"
                          id="name"
                          placeholder="Ingrese el nombre de la categoría"
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                        <ErrorMessage
                          name="name"
                          component="div"
                          className="mt-2 text-sm text-red-500"
                        />
                      </div>

                      <div className="flex gap-3">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={closeModal}
                          className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          Cancelar
                        </motion.button>
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={isSubmitting}
                          className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-rh-gold text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? "Guardando..." : "Guardar"}
                        </motion.button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CategoriasAdmin
