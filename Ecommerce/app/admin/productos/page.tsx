"use client"

import { useState, useEffect } from "react"
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye, FaTimes, FaExclamationTriangle, FaTag, FaBox, FaFilter, FaChevronLeft, FaChevronRight, FaImage } from "react-icons/fa"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "react-toastify"
import { productService, categoryService } from "@/services/api"
import ProductoForm from "@/components/admin/ProductoForm"
import { IMAGE_BASE_URL } from "@/config/constants"

// Helper para construir URLs de imagen evitando dobles "/storage" y barras
const buildImageUrl = (path?: string) => {
  if (!path) return ""
  if (/^https?:\/\//.test(path)) return path
  const clean = path.replace(/^\/+/, "")
  return clean.startsWith("storage/")
    ? `${IMAGE_BASE_URL}/${clean}`
    : `${IMAGE_BASE_URL}/storage/${clean}`
}

interface ProductImage {
  id: number;
  image_path: string;
  order: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  precio_de_oferta?: number;
  stock: number;
  imagen?: string;
  images?: ProductImage[];
  category?: {
    id: number;
    name: string;
  };
}

// Skeleton Loader para cards
const CardSkeleton = () => (
  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 animate-pulse">
    <div className="p-5">
      <div className="flex items-start mb-4">
        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl mr-4"></div>
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  </div>
)

// Quick View Modal
interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

const QuickViewModal = ({ product, onClose, onEdit, onDelete }: QuickViewModalProps) => {
  const [fullProduct, setFullProduct] = useState<Product | null>(product)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadFullProduct = async () => {
      if (!product) return

      setLoading(true)
      try {
        const response = await productService.getById(product.id)
        const productData = response.data.data || response.data
        setFullProduct(productData)
      } catch (error) {
        console.error("Error al cargar producto completo:", error)
        setFullProduct(product)
      } finally {
        setLoading(false)
      }
    }

    loadFullProduct()
  }, [product])

  if (!fullProduct) return null

  const discount = fullProduct.precio_de_oferta
    ? Math.round(((Number(fullProduct.price) - Number(fullProduct.precio_de_oferta)) / Number(fullProduct.price)) * 100)
    : 0

  const stockPercentage = Math.min((fullProduct.stock / 100) * 100, 100)
  const stockStatus = fullProduct.stock === 0 ? "out" : fullProduct.stock < 10 ? "low" : "good"

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con botón cerrar */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-rh-teal to-rh-gold px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <FaBox className="text-base sm:text-xl" />
                <span className="hidden sm:inline">Vista Rápida del Producto</span>
                <span className="sm:hidden">Vista Rápida</span>
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <FaTimes className="text-base sm:text-xl" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-4rem)] sm:max-h-[calc(90vh-5rem)]">
            {/* Imagen del producto */}
            <div className="relative">
              <div className="sticky top-0">
                {loading ? (
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-rh-teal/30 border-t-rh-teal rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={buildImageUrl(fullProduct.imagen) || "/placeholder.jpg"}
                      alt={fullProduct.name}
                      className="w-full h-full object-cover"
                    />

                  {/* Badges flotantes */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {discount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-rh-teal text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-1"
                      >
                        <FaTag className="text-xs" />
                        -{discount}% OFF
                      </motion.div>
                    )}

                    {stockStatus === "out" && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-1"
                      >
                        <FaExclamationTriangle className="text-xs" />
                        Sin Stock
                      </motion.div>
                    )}

                    {stockStatus === "low" && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="px-3 py-1.5 bg-yellow-500 text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-1"
                      >
                        <FaExclamationTriangle className="text-xs" />
                        Stock Bajo
                      </motion.div>
                    )}
                  </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detalles del producto */}
            <div className="flex flex-col">
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                </div>
              ) : (
                <>
                  {/* Categoría */}
                  <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary text-[10px] sm:text-xs font-medium rounded-full">
                      {fullProduct.category?.name || "N/A"}
                    </span>
                  </div>

                  {/* Título */}
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    {fullProduct.name}
                  </h2>

                  {/* Precio */}
                  <div className="flex items-baseline gap-2 sm:gap-3 mb-4 sm:mb-6">
                    {fullProduct.precio_de_oferta ? (
                      <>
                        <span className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-rh-teal to-rh-gold bg-clip-text text-transparent">
                          S/ {Number(fullProduct.precio_de_oferta).toFixed(2)}
                        </span>
                        <span className="text-base sm:text-lg md:text-xl text-gray-500 line-through">
                          S/ {Number(fullProduct.price).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-rh-teal to-rh-gold bg-clip-text text-transparent">
                        S/ {Number(fullProduct.price).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Descripción */}
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2 flex items-center gap-2">
                      <FaBox className="text-rh-teal text-xs sm:text-sm" />
                      Descripción
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                      {fullProduct.description || "Sin descripción disponible"}
                    </p>
                  </div>

                  {/* Stock */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Stock Disponible</span>
                      <span className={`text-sm font-bold ${
                        stockStatus === "out" ? "text-red-500" :
                        stockStatus === "low" ? "text-yellow-500" :
                        "text-green-500"
                      }`}>
                        {fullProduct.stock} unidades
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stockPercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          stockStatus === "out" ? "bg-gradient-to-r from-red-500 to-red-600" :
                          stockStatus === "low" ? "bg-gradient-to-r from-yellow-400 to-yellow-500" :
                          "bg-gradient-to-r from-green-400 to-green-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* ID del producto y SKU */}
                  <div className="mb-6 p-4 bg-gradient-to-br from-rh-accent to-rh-accent dark:from-gray-800 dark:to-gray-850 rounded-xl border border-rh-teal-light dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-rh-teal dark:text-rh-teal-light block mb-1 font-semibold">ID del Producto</span>
                        <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">#{fullProduct.id}</span>
                      </div>
                      {(fullProduct as any).SKU && (
                        <div>
                          <span className="text-xs text-rh-teal dark:text-rh-teal-light block mb-1 font-semibold">SKU</span>
                          <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">{(fullProduct as any).SKU}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información adicional */}
                  {(fullProduct as any).created_at && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Información del Sistema</h4>
                      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Creado:</span>
                          <span className="font-mono">{new Date((fullProduct as any).created_at).toLocaleDateString('es-PE')}</span>
                        </div>
                        {(fullProduct as any).updated_at && (
                          <div className="flex justify-between">
                            <span>Actualizado:</span>
                            <span className="font-mono">{new Date((fullProduct as any).updated_at).toLocaleDateString('es-PE')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-auto">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onEdit(fullProduct)}
                      className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 bg-gradient-to-r from-rh-teal to-rh-gold text-white rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <FaEdit />
                      Editar
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onDelete(fullProduct.id)}
                      className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <FaTrash />
                      Eliminar
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

interface Category {
  id: number;
  name: string;
}

function ProductosAdmin() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [isOperationInProgress, setIsOperationInProgress] = useState(false)

  // Filtros avanzados
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedStockFilter, setSelectedStockFilter] = useState<string>("all")
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: "", max: "" })
  const [showFilters, setShowFilters] = useState(false)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productService.getAll(),
          categoryService.getAll(),
        ])

        const productsData = productsRes.data.data || productsRes.data
        const categoriesData = categoriesRes.data.data || categoriesRes.data

        setProducts(productsData)
        setFilteredProducts(productsData)
        setCategories(categoriesData)
        setLoading(false)
      } catch {
        toast.error("Error al cargar los productos")
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Sistema de filtrado avanzado
  useEffect(() => {
    let filtered = [...products]

    // Filtro por búsqueda de texto
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por categoría
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category?.id === Number(selectedCategory)
      )
    }

    // Filtro por stock
    if (selectedStockFilter !== "all") {
      if (selectedStockFilter === "out") {
        filtered = filtered.filter((product) => product.stock === 0)
      } else if (selectedStockFilter === "low") {
        filtered = filtered.filter((product) => product.stock > 0 && product.stock < 10)
      } else if (selectedStockFilter === "available") {
        filtered = filtered.filter((product) => product.stock >= 10)
      }
    }

    // Filtro por rango de precios
    if (priceRange.min) {
      filtered = filtered.filter(
        (product) => {
          const price = product.precio_de_oferta || product.price
          return Number(price) >= Number(priceRange.min)
        }
      )
    }
    if (priceRange.max) {
      filtered = filtered.filter(
        (product) => {
          const price = product.precio_de_oferta || product.price
          return Number(price) <= Number(priceRange.max)
        }
      )
    }

    setFilteredProducts(filtered)
    setCurrentPage(1) // Resetear a página 1 cuando cambien los filtros
  }, [searchTerm, products, selectedCategory, selectedStockFilter, priceRange])

  // Cálculos de paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("")
    setSelectedStockFilter("all")
    setPriceRange({ min: "", max: "" })
    setCurrentPage(1)
  }

  const activeFiltersCount = [
    selectedCategory,
    selectedStockFilter !== "all",
    priceRange.min,
    priceRange.max
  ].filter(Boolean).length

  const handleAddProduct = () => {
    setCurrentProduct(null)
    setIsModalOpen(true)
  }

  const handleEditProduct = async (product: Product) => {
    try {
      // Cargar el producto completo desde el API para asegurar que tenga toda la información
      const response = await productService.getById(product.id)
      const productData = response.data.data || response.data
      setCurrentProduct(productData)
      setIsModalOpen(true)
      setQuickViewProduct(null)
    } catch (error) {
      console.error("Error al cargar producto:", error)
      toast.error("Error al cargar el producto")
      // Si falla, usar el producto actual como fallback
      setCurrentProduct(product)
      setIsModalOpen(true)
      setQuickViewProduct(null)
    }
  }

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      try {
        await productService.delete(id)
        setProducts((prevProducts) => prevProducts.filter((product) => product.id !== id))
        setQuickViewProduct(null)
        toast.success("Producto eliminado correctamente")
      } catch {
        toast.error("Error al eliminar el producto")
      }
    }
  }

  const handleSaveProduct = async (formData: FormData) => {
    if (isOperationInProgress) {
      toast.info("Hay una operación en curso, por favor espere")
      return
    }

    try {
      setIsOperationInProgress(true)

      const apiForm = new FormData()

      const name = formData.get("name")
      if (name !== null) apiForm.append("name", String(name))

      const description = formData.get("description")
      if (description !== null) apiForm.append("description", String(description))

      const price = formData.get("price")
      if (price !== null) {
        const n = Number(String(price).trim())
        if (!Number.isNaN(n)) apiForm.append("price", n.toFixed(2))
      }

      const precioOferta = formData.get("precio_de_oferta")
      if (precioOferta !== null && String(precioOferta).trim() !== "") {
        const po = Number(String(precioOferta).trim())
        if (!Number.isNaN(po)) apiForm.append("precio_de_oferta", po.toFixed(2))
      }

      const stock = formData.get("stock")
      if (stock !== null && String(stock).trim() !== "") {
        const s = parseInt(String(stock).trim(), 10)
        if (!Number.isNaN(s)) apiForm.append("stock", String(s))
      } else {
        apiForm.append("stock", "0")
      }

      const skuLower = formData.get("sku")
      const skuUpper = formData.get("SKU")
      if (skuUpper !== null) {
        apiForm.append("SKU", String(skuUpper))
      } else if (skuLower !== null) {
        apiForm.append("SKU", String(skuLower))
      }

      const image = formData.get("image")
      const imagen = formData.get("imagen")
      if (image instanceof File) {
        apiForm.append("imagen", image)
      } else if (imagen instanceof File) {
        apiForm.append("imagen", imagen)
      }

      const categoryId = formData.get("categoryId") ?? formData.get("category_id")
      if (categoryId !== null) {
        const numericId = Number(String(categoryId).trim())
        if (!Number.isNaN(numericId)) {
          apiForm.append("category_id", String(numericId))
        }
      }

      // Copiar imágenes adicionales
      const additionalImages = formData.getAll("images[]")
      console.log(`🖼️ Copying ${additionalImages.length} additional images to apiForm`)
      additionalImages.forEach((image, index) => {
        if (image instanceof File) {
          console.log(`  📎 Image ${index + 1}:`, image.name, image.size, 'bytes')
          apiForm.append("images[]", image)  // ✅ Usar images[] para que Laravel lo interprete como array
        }
      })

      if (currentProduct) {
        const response = await productService.update(currentProduct.id, apiForm)
        const productData = response.data.data || response.data
        const updatedProducts = products.map((p) => (p.id === currentProduct.id ? productData : p))
        setProducts([...updatedProducts])
        toast.success("Producto actualizado correctamente")
      } else {
        const response = await productService.create(apiForm)
        const productData = response.data.data || response.data
        setProducts((prevProducts) => [...prevProducts, productData])
        toast.success("Producto creado correctamente")
      }

      setCurrentProduct(null)
      setIsModalOpen(false)
    } catch (error: any) {
      console.error('❌ Error saving product:', error)
      console.error('❌ Error response:', error.response)
      console.error('❌ Error data:', error.response?.data)

      // Mostrar errores de validación específicos
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        console.error('❌ Validation errors:', errors)
        Object.entries(errors).forEach(([field, messages]) => {
          console.error(`  ${field}:`, messages)
        })
        toast.error(`Error de validación: ${Object.keys(errors).join(', ')}`)
      } else {
        toast.error("Error al guardar el producto")
      }
    } finally {
      setIsOperationInProgress(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentProduct(null)
  }

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded-full">
          <FaExclamationTriangle />
          Sin Stock
        </span>
      )
    } else if (stock < 10) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-medium rounded-full">
          <FaExclamationTriangle />
          Stock Bajo
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
          <FaBox />
          En Stock
        </span>
      )
    }
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rh-teal to-rh-gold bg-clip-text text-transparent mb-2">
                Gestión de Productos
              </h1>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <FaBox className="text-rh-teal" />
                Administra tu catálogo de productos de forma eficiente
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddProduct}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-rh-teal to-rh-gold text-white rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all"
            >
              <FaPlus />
              Nuevo Producto
            </motion.button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Advanced Filters */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FaFilter className="text-primary" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Filtros Avanzados</h3>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                    {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    Limpiar filtros
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-sm text-primary hover:underline"
                >
                  {showFilters ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    {/* Categoría */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Categoría
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 transition-all"
                      >
                        <option value="">Todas las categorías</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Stock */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estado de Stock
                      </label>
                      <select
                        value={selectedStockFilter}
                        onChange={(e) => setSelectedStockFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 transition-all"
                      >
                        <option value="all">Todos</option>
                        <option value="available">Disponible (≥10)</option>
                        <option value="low">Stock Bajo (&lt;10)</option>
                        <option value="out">Sin Stock</option>
                      </select>
                    </div>

                    {/* Rango de Precio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rango de Precio
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Mín"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                          className="w-1/2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                        <input
                          type="number"
                          placeholder="Máx"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                          className="w-1/2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Results Info */}
          <div className="flex justify-between items-center mb-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              Mostrando <span className="font-semibold text-gray-900 dark:text-white">{indexOfFirstItem + 1}</span> - <span className="font-semibold text-gray-900 dark:text-white">{Math.min(indexOfLastItem, filteredProducts.length)}</span> de <span className="font-semibold text-gray-900 dark:text-white">{filteredProducts.length}</span> productos
            </p>
            <p>
              Página <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> de <span className="font-semibold text-gray-900 dark:text-white">{totalPages || 1}</span>
            </p>
          </div>
        </motion.div>

        {/* Card Grid View - All screen sizes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))
          ) : currentItems.length > 0 ? (
            currentItems.map((product, index) => {
              const discount = product.precio_de_oferta
                ? Math.round(((Number(product.price) - Number(product.precio_de_oferta)) / Number(product.price)) * 100)
                : 0

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 group flex flex-col h-full"
                >
                  {/* Product Header with Image */}
                  <div className="relative flex-shrink-0">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <img
                        src={buildImageUrl(product.imagen) || "/placeholder.jpg"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>

                    {/* Badges */}
                    {discount > 0 && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-red-500 to-rh-teal text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                        <FaTag />
                        -{discount}% OFF
                      </div>
                    )}

                    {/* Multiple Images Indicator */}
                    {product.images && product.images.length > 0 && (
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-1">
                        <FaImage className="text-xs" />
                        {product.images.length + 1}
                      </div>
                    )}

                    <div className="absolute top-3 right-3">
                      {getStockBadge(product.stock)}
                    </div>
                  </div>

                  {/* Product Info - Flex grow para ocupar el espacio disponible */}
                  <div className="p-5 flex flex-col flex-grow">
                    {/* Category */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <span className="px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary text-[10px] font-medium rounded-full whitespace-nowrap">
                        {product.category?.name || "N/A"}
                      </span>
                    </div>

                    {/* Title - Altura fija con line-clamp */}
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 h-14 leading-7">
                      {product.name}
                    </h3>

                    {/* Description - Altura fija con line-clamp */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 h-10 leading-5">
                      {product.description || "Sin descripción"}
                    </p>

                    {/* Price - Altura fija */}
                    <div className="mb-4 min-h-[4rem]">
                      {product.precio_de_oferta ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-2xl font-bold bg-gradient-to-r from-rh-teal to-rh-gold bg-clip-text text-transparent">
                              S/ {Number(product.precio_de_oferta).toFixed(2)}
                            </span>
                            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                              -{discount}% OFF
                            </span>
                          </div>
                          <span className="text-sm text-gray-500 line-through block">
                            S/ {Number(product.price).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold bg-gradient-to-r from-rh-teal to-rh-gold bg-clip-text text-transparent block">
                          S/ {Number(product.price).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Stock Info */}
                    <div className="mb-5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Stock</span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                          {product.stock} unidades
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            product.stock === 0 ? "bg-red-500" :
                            product.stock < 10 ? "bg-yellow-500" :
                            "bg-green-500"
                          }`}
                          style={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons - mt-auto para empujar al final */}
                    <div className="flex gap-2 mt-auto">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setQuickViewProduct(product)}
                        className="flex-1 py-2.5 px-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <FaEye className="text-sm" />
                        <span>Ver</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleEditProduct(product)}
                        className="flex-1 py-2.5 px-3 bg-gradient-to-r from-rh-teal to-rh-gold text-white rounded-xl font-medium text-sm hover:shadow-lg transition-shadow flex items-center justify-center gap-2 shadow-md"
                      >
                        <FaEdit className="text-sm" />
                        <span>Editar</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-shadow flex items-center justify-center min-w-[2.75rem] shadow-md"
                      >
                        <FaTrash className="text-sm" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <FaBox className="text-4xl text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                No se encontraron productos
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredProducts.length > 0 && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex justify-center items-center gap-2"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-rh-teal hover:to-rh-gold hover:text-white hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-900/80 disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300 transition-all"
            >
              <FaChevronLeft />
            </motion.button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <motion.button
                      key={page}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[2.5rem] px-4 py-2 rounded-xl font-semibold transition-all ${
                        currentPage === page
                          ? "bg-gradient-to-r from-rh-teal to-rh-gold text-white shadow-lg"
                          : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {page}
                    </motion.button>
                  )
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-gray-400">...</span>
                }
                return null
              })}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-rh-teal hover:to-rh-gold hover:text-white hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-900/80 disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300 transition-all"
            >
              <FaChevronRight />
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      )}

      {/* Edit/Create Modal */}
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
              className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentProduct ? "Editar Producto" : "Nuevo Producto"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-5rem)] p-6">
                <ProductoForm
                  product={currentProduct}
                  categories={categories}
                  onSave={handleSaveProduct}
                  onCancel={closeModal}
                  isSubmitting={isOperationInProgress}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProductosAdmin
