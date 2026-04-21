"use client"

import { useState, useEffect } from "react"
import { FaSave, FaStar, FaCheckCircle } from "react-icons/fa"
import { motion } from "framer-motion"
import { toast } from "react-toastify"
import { categoryService, featuredCategoryService } from "@/services/api"

interface Category {
  id: number
  name: string
}

const ConfiguracionDestacados = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Cargar categorías disponibles y configuración actual
        const [categoriesRes, featuredRes] = await Promise.all([
          categoryService.getAll(),
          featuredCategoryService.get()
        ])

        const categoriesData = categoriesRes.data.data || categoriesRes.data
        setCategories(categoriesData)

        const featuredData = featuredRes.data.data || featuredRes.data
        if (featuredData?.category_id) {
          setSelectedCategoryId(featuredData.category_id)
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast.error("Error al cargar la configuración")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      await featuredCategoryService.update(selectedCategoryId)
      toast.success("Configuración guardada exitosamente")
    } catch (error) {
      console.error("Error al guardar configuración:", error)
      toast.error("Error al guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-8 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-rh-gold p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FaStar className="text-3xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Configuración de Productos Destacados
                </h1>
                <p className="text-white/90 text-sm mt-1">
                  Selecciona la categoría que se mostrará en la página de inicio
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Información */}
              <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-xl p-4">
                <div className="flex gap-3">
                  <FaCheckCircle className="text-primary text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      ¿Cómo funciona?
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Los productos que pertenezcan a la categoría seleccionada
                      se mostrarán en la sección de "Productos Destacados" del home.
                      Si no seleccionas ninguna categoría, se mostrarán todos los productos disponibles.
                    </p>
                  </div>
                </div>
              </div>

              {/* Selector de categoría */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Categoría Destacada
                </label>
                <select
                  value={selectedCategoryId ?? ""}
                  onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">Sin categoría destacada (mostrar todos los productos)</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview de la selección */}
              {selectedCategoryId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-primary/5 to-rh-teal/5 border border-primary/20 rounded-xl p-4"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Selección actual:</span>{" "}
                    <span className="text-primary font-bold">
                      {categories.find(c => c.id === selectedCategoryId)?.name}
                    </span>
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Los productos de esta categoría aparecerán en el home
                  </p>
                </motion.div>
              )}

              {/* Botón guardar */}
              <div className="flex justify-end pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-rh-gold text-white rounded-xl font-semibold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <FaSave className="text-lg" />
                  {saving ? "Guardando..." : "Guardar Configuración"}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Vista previa de categorías */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Categorías Disponibles
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    selectedCategoryId === category.id
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold text-gray-900 dark:text-white text-sm text-center">
                    {category.name}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default ConfiguracionDestacados
