"use client"

import { useState, useEffect, useMemo, Suspense, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import {
  FaFilter,
  FaTimes,
  FaSearch,
  FaChevronDown,
  FaChevronRight,
  FaEye,
  FaWhatsapp,
  FaTag,
  FaCheckCircle,
  FaDollarSign,
  FaShoppingCart,
  FaThLarge,
  FaListUl,
  FaLayerGroup,
  FaHome,
  FaChevronLeft,
  FaHeart,
  FaExpand,
  FaImage,
  FaCheck
} from "react-icons/fa"
import { ecommerceCategoryService, ecommerceProductService } from "@/services/ecommerceApi"
import { IMAGE_BASE_URL } from "@/config/constants"
import {
  cardLift,
  checkboxVariants
} from "@/config/animationVariants"

// Helper para construir URLs de imagen
const buildImageUrl = (path?: string) => {
  if (!path) return ""
  if (/^https?:\/\//.test(path)) return path
  const clean = path.replace(/^\/+/, "")
  return clean.startsWith("storage/")
    ? `${IMAGE_BASE_URL}/${clean}`
    : `${IMAGE_BASE_URL}/storage/${clean}`
}

// ==================== INTERFACES ====================

interface Category {
  id: number
  name: string
}

interface ProductImage {
  id: number
  image_path: string
  order: number
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  precio_de_oferta?: number
  stock: number
  imagen?: string
  images?: ProductImage[]
  category_id: number
  category?: {
    id: number
    name: string
  }
}

// ==================== COMPONENTE DE CARRUSEL ====================

interface ProductImageCarouselProps {
  images: string[]
  productName: string
  onImageClick: () => void
}

const ProductImageCarousel = ({ images, productName, onImageClick }: ProductImageCarouselProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <>
      <button
        onClick={onImageClick}
        className="relative w-full h-full cursor-pointer group/image"
        title="Click para vista rápida"
      >
        <motion.img
          key={currentImageIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          src={buildImageUrl(images[currentImageIndex])}
          alt={`${productName} - Imagen ${currentImageIndex + 1}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        {/* Overlay de vista rápida */}
        <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
            <FaExpand className="text-gray-700 dark:text-gray-300 text-lg" />
          </div>
        </div>
      </button>

      {/* Navigation Arrows - Only show if multiple images */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <FaChevronLeft className="text-gray-700 dark:text-gray-300 text-sm" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <FaChevronRight className="text-gray-700 dark:text-gray-300 text-sm" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentImageIndex(idx)
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentImageIndex
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </>
  )
}

// ==================== ANIMACIONES MEJORADAS ====================

const filterPanelVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2 }
  }
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 }
  }
}

// ==================== SKELETON LOADER ====================

const ProductCardSkeleton = () => (
  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 animate-pulse">
    <div className="h-64 bg-gray-200 dark:bg-gray-700"></div>
    <div className="p-5 space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      <div className="flex gap-2">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  </div>
)

// ==================== QUICK VIEW MODAL ====================

interface QuickViewModalProps {
  product: Product | null
  onClose: () => void
  onAddToCart: (product: Product) => void
  getWhatsAppLink: (product: Product) => string
}

const QuickViewModal = ({ product, onClose, onAddToCart, getWhatsAppLink }: QuickViewModalProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  if (!product) return null

  const discount = product.precio_de_oferta
    ? Math.round(((Number(product.price) - Number(product.precio_de_oferta)) / Number(product.price)) * 100)
    : 0

  // Build array of all images
  const allImages = [
    product.imagen || "/placeholder.jpg",
    ...(product.images?.sort((a, b) => a.order - b.order).map(img => img.image_path) || [])
  ]

  const goToPrevious = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setSelectedImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            <FaTimes className="text-xl text-gray-700 dark:text-gray-300" />
          </button>

          <div className="grid md:grid-cols-2 gap-6 p-6 md:p-8">
            {/* Image Gallery section */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden group">
                <motion.img
                  key={selectedImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={buildImageUrl(allImages[selectedImageIndex])}
                  alt={`${product.name} - Imagen ${selectedImageIndex + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />

                {/* Badges */}
                {product.precio_de_oferta && (
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="bg-gradient-to-r from-red-500 to-fv-gold text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      -{discount}% OFF
                    </div>
                  </div>
                )}
                {product.stock <= 5 && product.stock > 0 && (
                  <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    ¡Solo {product.stock} disponibles!
                  </div>
                )}

                {/* Navigation Arrows - Only show if multiple images */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevious}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all"
                    >
                      <FaChevronLeft className="text-gray-700 dark:text-gray-300" />
                    </button>

                    <button
                      onClick={goToNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all"
                    >
                      <FaChevronRight className="text-gray-700 dark:text-gray-300" />
                    </button>

                    {/* Image Counter */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-sm font-semibold rounded-full shadow-lg">
                      {selectedImageIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {allImages.map((imagePath, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? "border-primary ring-2 ring-primary/50"
                          : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={buildImageUrl(imagePath)}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedImageIndex === index && (
                        <div className="absolute inset-0 bg-primary/20" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info section */}
            <div className="flex flex-col">
              <div className="flex-1">
                <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-3">
                  {product.category?.name || "Sin categoría"}
                </div>

                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {product.name}
                </h2>

                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  {product.description || "Sin descripción disponible"}
                </p>

                {/* Price */}
                <div className="bg-gradient-to-br from-primary/5 to-primary/5 rounded-2xl p-6 mb-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    {product.precio_de_oferta ? (
                      <>
                        <span className="text-4xl font-bold bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
                          S/ {Number(product.precio_de_oferta).toFixed(2)}
                        </span>
                        <span className="text-xl text-gray-500 line-through">
                          S/ {Number(product.price).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-4xl font-bold bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
                        S/ {Number(product.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {product.precio_de_oferta && (
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      ¡Ahorras S/ {(Number(product.price) - Number(product.precio_de_oferta)).toFixed(2)}!
                    </p>
                  )}
                </div>

                {/* Stock status */}
                <div className="flex items-center gap-2 mb-6">
                  {product.stock > 0 ? (
                    <>
                      <FaCheckCircle className="text-green-500" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        En stock ({product.stock} unidades)
                      </span>
                    </>
                  ) : (
                    <>
                      <FaTimes className="text-red-500" />
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        Agotado
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    onAddToCart(product)
                    onClose()
                  }}
                  disabled={product.stock === 0}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-primary to-fv-gold text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                >
                  <FaShoppingCart className="text-xl" />
                  Agregar al carrito
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={getWhatsAppLink(product)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                  >
                    <FaWhatsapp className="text-xl" />
                    WhatsApp
                  </a>
                  <Link
                    href={`/producto/${product.id}`}
                    className="flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FaEye className="text-xl" />
                    Ver detalles
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// ==================== COMPONENTE PRINCIPAL ====================

const Catalogo = () => {
  const searchParams = useSearchParams()

  // Estados principales
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Estados UI
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const productsPerPage = 12

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [sortOption, setSortOption] = useState("default")
  const [offerOnly, setOfferOnly] = useState(false)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0])

  // Secciones expandidas
  const [showCategoryFilter, setShowCategoryFilter] = useState(true)
  const [showAvailabilityFilter, setShowAvailabilityFilter] = useState(true)
  const [showPriceFilter, setShowPriceFilter] = useState(true)

  // ==================== CARGAR DATOS ====================

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [catRes, prodRes] = await Promise.all([
          ecommerceCategoryService.getAll(),
          ecommerceProductService.getAll()
        ])

        const categoriesData = catRes.data || []
        const productsData = prodRes.data || []

        setCategories(categoriesData)
        setProducts(productsData)
      } catch (error) {
        console.error("Error al cargar catálogo:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Debounce para búsqueda - mejora el rendimiento
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300) // Espera 300ms después de que el usuario deje de escribir

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Procesar parámetro de búsqueda desde URL
  useEffect(() => {
    const searchParam = searchParams.get("search")
    if (searchParam) {
      setSearchTerm(searchParam)
      setDebouncedSearchTerm(searchParam)
    }
  }, [searchParams])

  // Cerrar filtros al cambiar a desktop
  useEffect(() => {
    if (!isMobile && isFilterOpen) {
      setIsFilterOpen(false)
    }
  }, [isMobile, isFilterOpen])

  // Scroll suave hacia arriba cuando cambie la página
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [currentPage])

  // ==================== CÁLCULOS ====================

  // Calcular rango de precios disponible
  const [computedMinPrice, computedMaxPrice] = useMemo(() => {
    if (products.length === 0) return [0, 0]
    const prices = products.map(p => p.precio_de_oferta ?? p.price)
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]
  }, [products])

  // Inicializar rango de precios
  useEffect(() => {
    if (products.length > 0 && priceRange[0] === 0 && priceRange[1] === 0) {
      setPriceRange([computedMinPrice, computedMaxPrice])
    }
  }, [products, computedMinPrice, computedMaxPrice, priceRange])

  // ==================== FILTRADO DE PRODUCTOS ====================

  useEffect(() => {
    let filtered = [...products]

    // Filtrar por categoría
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) => {
        return selectedCategories.includes(product.category_id)
      })
    }

    // Filtrar por búsqueda (usando debounced para mejor rendimiento)
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.category?.name.toLowerCase().includes(searchLower)
      )
    }

    // Filtrar por oferta
    if (offerOnly) {
      filtered = filtered.filter(p => !!p.precio_de_oferta)
    }

    // Filtrar por stock
    if (inStockOnly) {
      filtered = filtered.filter(p => p.stock > 0)
    }

    // Filtrar por rango de precio
    if (priceRange[0] > 0 || priceRange[1] > 0) {
      filtered = filtered.filter(p => {
        const price = p.precio_de_oferta ?? p.price
        return price >= priceRange[0] && price <= priceRange[1]
      })
    }

    // Ordenar
    switch (sortOption) {
      case "price_asc":
        filtered.sort((a, b) => (a.precio_de_oferta ?? a.price) - (b.precio_de_oferta ?? b.price))
        break
      case "price_desc":
        filtered.sort((a, b) => (b.precio_de_oferta ?? b.price) - (a.precio_de_oferta ?? a.price))
        break
      case "name_asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "name_desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name))
        break
      default:
        // Por defecto: Más recientes primero (ID descendente)
        filtered.sort((a, b) => b.id - a.id)
        break
    }

    setFilteredProducts(filtered)
    setCurrentPage(1)
  }, [
    products,
    selectedCategories,
    debouncedSearchTerm,
    sortOption,
    offerOnly,
    inStockOnly,
    priceRange
  ])

  // ==================== MANEJADORES ====================

  const handleCategoryToggle = useCallback((categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }, [])

  const clearFilters = useCallback(() => {
    setSelectedCategories([])
    setSearchTerm("")
    setDebouncedSearchTerm("")
    setSortOption("default")
    setOfferOnly(false)
    setInStockOnly(false)
    setPriceRange([computedMinPrice, computedMaxPrice])
    setCurrentPage(1)
  }, [computedMinPrice, computedMaxPrice])

  const addToCart = (product: Product) => {
    try {
      const unitPrice = product.precio_de_oferta ?? product.price
      const saved = localStorage.getItem("catalogo_cart_items")
      const currentCart = saved ? JSON.parse(saved) : []

      const existing = currentCart.find((item: any) => item.productId === product.id)
      const updatedCart = existing
        ? currentCart.map((item: any) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [
            ...currentCart,
            {
              productId: product.id,
              name: product.name,
              price: unitPrice,
              imagen: product.imagen,
              quantity: 1
            }
          ]

      localStorage.setItem("catalogo_cart_items", JSON.stringify(updatedCart))
      window.dispatchEvent(new Event("catalogo_cart_items_updated"))
    } catch (error) {
      console.error("Error adding to cart:", error)
    }
  }

  const getWhatsAppLink = (product: Product) => {
    const message = `Hola, quiero información sobre: ${product.name} - Precio: S/ ${product.precio_de_oferta ?? product.price}`
    return `https://wa.me/51967411110?text=${encodeURIComponent(message)}`
  }

  // ==================== HELPERS ====================

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    !!debouncedSearchTerm ||
    offerOnly ||
    inStockOnly ||
    (priceRange[0] > computedMinPrice || priceRange[1] < computedMaxPrice)

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  )

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

  const activeFiltersCount =
    selectedCategories.length +
    (debouncedSearchTerm ? 1 : 0) +
    (offerOnly ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (priceRange[0] > computedMinPrice || priceRange[1] < computedMaxPrice ? 1 : 0)

  // ==================== RENDER ====================

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black">
      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 to-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-primary/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Breadcrumbs */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm mb-6"
        >
          <Link href="/" className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
            <FaHome />
            <span>Inicio</span>
          </Link>
          <FaChevronRight className="text-gray-400 text-xs" />
          <span className="text-primary font-medium">Catálogo</span>
        </motion.nav>

        {/* Header mejorado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-xl border border-gray-200/50 dark:border-gray-800/50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/20 rounded-2xl">
                    <FaLayerGroup className="text-3xl text-primary dark:text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary to-fv-gold dark:from-primary dark:via-primary dark:to-fv-gold bg-clip-text text-transparent">
                      Catálogo de Productos
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Explora nuestra colección completa
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setOfferOnly(!offerOnly)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    offerOnly
                      ? "bg-gradient-to-r from-primary to-fv-gold text-white shadow-lg scale-105"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary"
                  }`}
                >
                  <FaTag className="text-sm" />
                  <span className="text-sm">Ofertas</span>
                </button>
                <button
                  onClick={() => setInStockOnly(!inStockOnly)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    inStockOnly
                      ? "bg-gradient-to-r from-primary to-fv-gold text-white shadow-lg scale-105"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary"
                  }`}
                >
                  <FaCheckCircle className="text-sm" />
                  <span className="text-sm">En Stock</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className={`grid grid-cols-1 ${!isFilterOpen ? 'lg:grid-cols-[280px_1fr]' : ''} gap-6`}>
          {/* Backdrop móvil */}
          <AnimatePresence>
            {isFilterOpen && isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFilterOpen(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden"
                aria-label="Cerrar filtros"
              />
            )}
          </AnimatePresence>

          {/* Sidebar de filtros mejorado - Ocupa todo el ancho en móvil cuando está abierto */}
          <AnimatePresence>
            {(isFilterOpen || !isMobile) && (
              <motion.aside
                variants={filterPanelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`${
                  isMobile && isFilterOpen
                    ? 'fixed inset-0 w-full h-full rounded-none'
                    : isMobile
                    ? 'hidden'
                    : 'sticky top-6 h-fit w-[280px]'
                } bg-white/98 dark:bg-gray-900/98 backdrop-blur-2xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 z-50 lg:z-auto overflow-hidden flex flex-col`}
                role="complementary"
                aria-label="Panel de filtros"
              >
                {/* Header filtros */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FaFilter className="text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filtros</h2>
                      {activeFiltersCount > 0 && (
                        <span className="text-xs text-gray-500" aria-live="polite">
                          {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro activo' : 'filtros activos'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    aria-label="Cerrar panel de filtros"
                  >
                    <FaTimes className="text-gray-500" aria-hidden="true" />
                  </button>
                </div>

                {/* Filtros con scroll */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Limpiar filtros */}
                  {hasActiveFilters && (
                    <motion.button
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={clearFilters}
                      className="w-full py-3 px-4 bg-gradient-to-r from-primary to-fv-gold text-white rounded-xl font-medium hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      <FaTimes />
                      Limpiar todos los filtros
                    </motion.button>
                  )}

                  {/* Categorías */}
                  <div>
                    <button
                      onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                      aria-expanded={showCategoryFilter}
                      aria-controls="category-filter-content"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaLayerGroup className="text-primary group-hover:scale-110 transition-transform" aria-hidden="true" />
                        Categorías
                      </span>
                      <FaChevronDown
                        className={`transition-transform text-gray-400 ${showCategoryFilter ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>

                    <AnimatePresence>
                      {showCategoryFilter && (
                        <motion.div
                          id="category-filter-content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 space-y-1 overflow-hidden"
                          role="group"
                          aria-label="Lista de categorías"
                        >
                          {categories.map((category) => {
                            const isSelected = selectedCategories.includes(category.id)

                            return (
                              <motion.label
                                key={category.id}
                                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer"
                                onClick={() => handleCategoryToggle(category.id)}
                                whileHover={{ x: 4 }}
                                transition={{ duration: 0.2 }}
                                role="checkbox"
                                aria-checked={isSelected}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    handleCategoryToggle(category.id)
                                  }
                                }}
                              >
                                {/* Custom animated checkbox */}
                                <div className="relative w-5 h-5 flex-shrink-0">
                                  <motion.div
                                    className="absolute inset-0 border-2 rounded"
                                    animate={{
                                      borderColor: isSelected ? "var(--primary)" : "rgb(209, 213, 219)"
                                    }}
                                    transition={{ duration: 0.2 }}
                                  />
                                  <motion.div
                                    className="absolute inset-0 bg-primary rounded flex items-center justify-center"
                                    variants={checkboxVariants}
                                    initial="unchecked"
                                    animate={isSelected ? "checked" : "unchecked"}
                                  >
                                    <FaCheck className="text-white text-xs" />
                                  </motion.div>
                                </div>
                                <div
                                  className={`flex-1 text-sm ${
                                    isSelected ? "text-primary font-semibold" : "text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {category.name}
                                </div>
                              </motion.label>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Disponibilidad */}
                  <div>
                    <button
                      onClick={() => setShowAvailabilityFilter(!showAvailabilityFilter)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaCheckCircle className="text-primary group-hover:scale-110 transition-transform" />
                        Disponibilidad
                      </span>
                      <FaChevronDown
                        className={`transition-transform text-gray-400 ${showAvailabilityFilter ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {showAvailabilityFilter && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 space-y-2 overflow-hidden"
                        >
                          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer group transition-colors">
                            <input
                              type="checkbox"
                              checked={offerOnly}
                              onChange={(e) => setOfferOnly(e.target.checked)}
                              className="w-4 h-4 accent-primary rounded"
                            />
                            <div className="flex-1 flex items-center gap-2">
                              <div className="p-1.5 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                                <FaTag className="text-primary text-xs" />
                              </div>
                              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                Solo en oferta
                              </span>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer group transition-colors">
                            <input
                              type="checkbox"
                              checked={inStockOnly}
                              onChange={(e) => setInStockOnly(e.target.checked)}
                              className="w-4 h-4 accent-primary rounded"
                            />
                            <div className="flex-1 flex items-center gap-2">
                              <div className="p-1.5 bg-green-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                <FaCheckCircle className="text-green-500 text-xs" />
                              </div>
                              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                Solo con stock
                              </span>
                            </div>
                          </label>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Precio */}
                  <div>
                    <button
                      onClick={() => setShowPriceFilter(!showPriceFilter)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FaDollarSign className="text-primary group-hover:scale-110 transition-transform" />
                        Rango de precio
                      </span>
                      <FaChevronDown
                        className={`transition-transform text-gray-400 ${showPriceFilter ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {showPriceFilter && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 space-y-4 overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-2 font-medium">
                                Mínimo
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
                                <input
                                  type="number"
                                  value={priceRange[0]}
                                  onChange={(e) =>
                                    setPriceRange([Number(e.target.value), priceRange[1]])
                                  }
                                  className="w-full pl-8 pr-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-2 font-medium">
                                Máximo
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
                                <input
                                  type="number"
                                  value={priceRange[1]}
                                  onChange={(e) =>
                                    setPriceRange([priceRange[0], Number(e.target.value)])
                                  }
                                  className="w-full pl-8 pr-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setPriceRange([computedMinPrice, computedMaxPrice])}
                            className="w-full text-sm text-primary hover:text-fv-gold font-medium hover:underline transition-colors"
                          >
                            Restablecer rango de precio
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Contenido principal */}
          <div className={`space-y-6 ${isMobile && isFilterOpen ? 'hidden' : ''}`}>
            {/* Barra de herramientas mejorada */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl p-4 md:p-6 shadow-xl border border-gray-200/50 dark:border-gray-800/50"
            >
              <div className="flex flex-col gap-4">
                {/* Primera fila: Filtros móvil + Búsqueda + Ordenar + Vista */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Botón filtros móvil */}
                  <button
                    onClick={() => setIsFilterOpen(true)}
                    className="lg:hidden relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-fv-gold text-white rounded-xl font-medium hover:shadow-xl transition-all"
                    aria-label={`Abrir filtros${activeFiltersCount > 0 ? ` (${activeFiltersCount} activos)` : ''}`}
                    aria-expanded={isFilterOpen}
                  >
                    <FaFilter aria-hidden="true" />
                    <span>Filtros</span>
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center" aria-label={`${activeFiltersCount} filtros activos`}>
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  {/* Búsqueda mejorada */}
                  <div className="flex-1 min-w-[200px] relative">
                    <label htmlFor="product-search" className="sr-only">
                      Buscar productos
                    </label>
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                    <input
                      id="product-search"
                      type="search"
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-10 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400"
                      aria-label="Buscar productos"
                      aria-describedby="search-results-count"
                      autoComplete="off"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                        aria-label="Limpiar búsqueda"
                      >
                        <FaTimes aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  {/* Ordenar */}
                  <label htmlFor="sort-select" className="sr-only">
                    Ordenar productos
                  </label>
                  <select
                    id="sort-select"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                    aria-label="Ordenar productos por"
                  >
                    <option value="default">Más recientes primero</option>
                    <option value="price_asc">Precio: Menor a Mayor</option>
                    <option value="price_desc">Precio: Mayor a Menor</option>
                    <option value="name_asc">Nombre: A-Z</option>
                    <option value="name_desc">Nombre: Z-A</option>
                  </select>

                  {/* Vista */}
                  <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl" role="group" aria-label="Vista de productos">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2.5 rounded-lg transition-all ${
                        viewMode === "grid"
                          ? "bg-gradient-to-r from-primary to-fv-gold text-white shadow-lg"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                      aria-label="Vista en cuadrícula"
                      aria-pressed={viewMode === "grid"}
                    >
                      <FaThLarge aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2.5 rounded-lg transition-all ${
                        viewMode === "list"
                          ? "bg-gradient-to-r from-primary to-fv-gold text-white shadow-lg"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                      aria-label="Vista en lista"
                      aria-pressed={viewMode === "list"}
                    >
                      <FaListUl aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Segunda fila: Filtros activos */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Filtros activos:
                    </span>
                    {debouncedSearchTerm && (
                      <motion.span
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
                      >
                        <FaSearch className="text-xs" aria-hidden="true" />
                        {debouncedSearchTerm}
                        <button
                          onClick={() => {
                            setSearchTerm("")
                            setDebouncedSearchTerm("")
                          }}
                          className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                          aria-label="Eliminar filtro de búsqueda"
                        >
                          <FaTimes className="text-xs" aria-hidden="true" />
                        </button>
                      </motion.span>
                    )}
                    {offerOnly && (
                      <motion.span
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
                      >
                        <FaTag className="text-xs" />
                        Ofertas
                      </motion.span>
                    )}
                    {inStockOnly && (
                      <motion.span
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-medium"
                      >
                        <FaCheckCircle className="text-xs" />
                        Con stock
                      </motion.span>
                    )}
                  </div>
                )}

                {/* Tercera fila: Contador de productos */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
                  <div className="text-sm" id="search-results-count" aria-live="polite">
                    <span className="text-gray-600 dark:text-gray-400">Mostrando</span>{" "}
                    <span className="font-bold text-primary">
                      {filteredProducts.length}
                    </span>{" "}
                    <span className="text-gray-600 dark:text-gray-400">
                      {filteredProducts.length === 1 ? "producto" : "productos"}
                    </span>
                  </div>
                  {totalPages > 1 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400" aria-label="Paginación">
                      Página <span className="font-bold text-primary">{currentPage}</span> de{" "}
                      <span className="font-bold">{totalPages}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Grid de productos mejorado - Optimizado para carga rápida */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="status" aria-label="Cargando productos">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-800/50"
              >
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-primary/20 rounded-3xl flex items-center justify-center">
                  <FaSearch className="text-4xl text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                  No se encontraron productos
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  No hay productos que coincidan con los filtros seleccionados. Intenta ajustar tu búsqueda.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-fv-gold text-white rounded-xl font-medium hover:shadow-xl hover:scale-105 transition-all inline-flex items-center gap-2"
                  >
                    <FaTimes />
                    Limpiar todos los filtros
                  </button>
                )}
              </motion.div>
            ) : (
              <>
                {viewMode === "grid" ? (
                  <LayoutGroup>
                    <motion.div
                      layout
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                      role="list"
                      aria-label={`Lista de productos en vista de cuadrícula. ${filteredProducts.length} productos encontrados.`}
                    >
                      <AnimatePresence mode="popLayout">
                        {paginatedProducts.map((product) => {
                          const discount = product.precio_de_oferta
                            ? Math.round(((Number(product.price) - Number(product.precio_de_oferta)) / Number(product.price)) * 100)
                            : 0

                          return (
                            <motion.article
                              key={product.id}
                              layout
                              layoutId={`catalog-product-${product.id}`}
                              variants={cardLift}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              whileHover="hover"
                              transition={{
                                layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                                opacity: { duration: 0.3 },
                                scale: { duration: 0.3 }
                              }}
                              className="group bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-lg border border-gray-200/50 dark:border-gray-800/50"
                              role="listitem"
                            >
                          <div className="relative h-64 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <ProductImageCarousel
                              images={[
                                product.imagen || "/placeholder.jpg",
                                ...(product.images?.sort((a, b) => a.order - b.order).map(img => img.image_path) || [])
                              ]}
                              productName={product.name}
                              onImageClick={() => setQuickViewProduct(product)}
                            />

                            {/* Badges */}
                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                              {product.precio_de_oferta && (
                                <div className="bg-gradient-to-r from-red-500 to-fv-gold text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                                  -{discount}% OFF
                                </div>
                              )}
                              {product.stock <= 5 && product.stock > 0 && (
                                <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                  ¡Últimas {product.stock}!
                                </div>
                              )}
                              {product.stock === 0 && (
                                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                  Agotado
                                </div>
                              )}
                            </div>

                            {/* Wishlist button */}
                            <button
                              className="absolute top-3 right-3 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-full opacity-0 group-hover:opacity-100 hover:text-red-500 hover:scale-110 transition-all shadow-lg"
                              title="Agregar a favoritos"
                            >
                              <FaHeart className="text-sm" />
                            </button>
                          </div>

                          <div className="p-5">
                            <div className="text-xs text-primary font-medium mb-2 flex items-center gap-1">
                              <FaLayerGroup className="text-xs" />
                              {product.category?.name || "Sin categoría"}
                            </div>

                            <Link href={`/producto/${product.id}`}>
                              <h3 className="font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                                {product.name}
                              </h3>
                            </Link>

                            <div className="flex items-baseline gap-2 mb-4">
                              {product.precio_de_oferta ? (
                                <>
                                  <span className="text-2xl font-bold bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
                                    S/ {Number(product.precio_de_oferta).toFixed(2)}
                                  </span>
                                  <span className="text-sm text-gray-500 line-through">
                                    S/ {Number(product.price).toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
                                  S/ {Number(product.price).toFixed(2)}
                                </span>
                              )}
                            </div>

                            {/* Stock indicator */}
                            {product.stock > 0 && (
                              <div className="flex items-center gap-2 mb-4">
                                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      product.stock > 10
                                        ? "bg-green-500"
                                        : product.stock > 5
                                        ? "bg-yellow-500"
                                        : "bg-orange-500"
                                    }`}
                                    style={{ width: `${Math.min((product.stock / 20) * 100, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {product.stock > 10 ? "Stock alto" : "Stock bajo"}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Botones de acción mejorados */}
                          <div className="p-4 pt-0 flex gap-2">
                            <button
                              onClick={() => addToCart(product)}
                              disabled={product.stock === 0}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary to-fv-gold text-white rounded-xl font-medium hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                            >
                              <FaShoppingCart />
                              <span className="text-sm">Agregar</span>
                            </button>
                            <a
                              href={getWhatsAppLink(product)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 hover:scale-110 transition-all"
                              title="Consultar por WhatsApp"
                            >
                              <FaWhatsapp className="text-xl" />
                            </a>
                            <button
                              onClick={() => setQuickViewProduct(product)}
                              className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-110 transition-all"
                              title="Vista rápida"
                            >
                              <FaEye className="text-xl" />
                            </button>
                          </div>
                        </motion.article>
                          )
                        })}
                      </AnimatePresence>
                    </motion.div>
                  </LayoutGroup>
                ) : (
                  <LayoutGroup>
                    <motion.div 
                      layout 
                      className="space-y-4"
                      role="list"
                      aria-label={`Lista de productos en vista de lista. ${filteredProducts.length} productos encontrados.`}
                    >
                      <AnimatePresence mode="popLayout">
                        {paginatedProducts.map((product) => {
                          const discount = product.precio_de_oferta
                            ? Math.round(((Number(product.price) - Number(product.precio_de_oferta)) / Number(product.price)) * 100)
                            : 0

                          return (
                            <motion.article
                              key={product.id}
                              layout
                              layoutId={`catalog-list-product-${product.id}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              whileHover={{ scale: 1.01, boxShadow: "0 20px 30px rgba(0,0,0,0.15)" }}
                              transition={{
                                layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                                opacity: { duration: 0.3 },
                                x: { duration: 0.3 }
                              }}
                              className="flex flex-col sm:flex-row gap-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-800/50 group"
                              role="listitem"
                            >
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => setQuickViewProduct(product)}
                              className="relative w-full sm:w-40 h-40 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer group/image"
                              title="Click para vista rápida"
                            >
                              <img
                                src={buildImageUrl(product.imagen) || "/placeholder.jpg"}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                              />
                              {/* Overlay de vista rápida */}
                              <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                <div className="opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg">
                                  <FaExpand className="text-gray-700 dark:text-gray-300 text-base" />
                                </div>
                              </div>
                              {product.precio_de_oferta && (
                                <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-fv-gold text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                                  -{discount}%
                                </div>
                              )}
                              {product.images && product.images.length > 0 && (
                                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-1">
                                  <FaImage className="text-xs" />
                                  {product.images.length + 1}
                                </div>
                              )}
                            </button>
                          </div>

                          <div className="flex-1 flex flex-col">
                            <div className="flex-1">
                              <div className="text-xs text-primary font-medium mb-1 flex items-center gap-1">
                                <FaLayerGroup className="text-xs" />
                                {product.category?.name || "Sin categoría"}
                              </div>
                              <Link href={`/producto/${product.id}`}>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 hover:text-primary transition-colors">
                                  {product.name}
                                </h3>
                              </Link>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {product.description || "Sin descripción disponible"}
                              </p>
                              <div className="flex items-baseline gap-2 mb-3">
                                {product.precio_de_oferta ? (
                                  <>
                                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
                                      S/ {Number(product.precio_de_oferta).toFixed(2)}
                                    </span>
                                    <span className="text-sm text-gray-500 line-through">
                                      S/ {Number(product.price).toFixed(2)}
                                    </span>
                                    <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded">
                                      ¡AHORRA S/ {(Number(product.price) - Number(product.precio_de_oferta)).toFixed(2)}!
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-2xl font-bold bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
                                    S/ {Number(product.price).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              {product.stock > 0 ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <FaCheckCircle className="text-green-500" />
                                  <span className="text-green-600 dark:text-green-400 font-medium">
                                    En stock ({product.stock} disponibles)
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-sm">
                                  <FaTimes className="text-red-500" />
                                  <span className="text-red-600 dark:text-red-400 font-medium">
                                    Agotado
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                              <button
                                onClick={() => addToCart(product)}
                                disabled={product.stock === 0}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-fv-gold text-white rounded-xl font-medium hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all text-sm"
                              >
                                <FaShoppingCart />
                                Agregar al carrito
                              </button>
                              <a
                                href={getWhatsAppLink(product)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors text-sm"
                              >
                                <FaWhatsapp />
                                WhatsApp
                              </a>
                              <button
                                onClick={() => setQuickViewProduct(product)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                              >
                                <FaEye />
                                Vista rápida
                              </button>
                            </div>
                          </div>
                        </motion.article>
                          )
                        })}
                      </AnimatePresence>
                    </motion.div>
                  </LayoutGroup>
                )}

                {/* Paginación mejorada */}
                {totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8"
                  >
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:text-primary hover:scale-105 transition-all font-medium"
                    >
                      <FaChevronLeft className="text-sm" />
                      <span>Anterior</span>
                    </button>

                    <div className="flex gap-2">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let page
                        if (totalPages <= 5) {
                          page = i + 1
                        } else if (currentPage <= 3) {
                          page = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i
                        } else {
                          page = currentPage - 2 + i
                        }

                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-11 h-11 rounded-xl font-bold transition-all ${
                              currentPage === page
                                ? "bg-gradient-to-r from-primary to-fv-gold text-white shadow-xl scale-110"
                                : "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary hover:scale-105"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:text-primary hover:scale-105 transition-all font-medium"
                    >
                      <span>Siguiente</span>
                      <FaChevronRight className="text-sm" />
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={addToCart}
          getWhatsAppLink={getWhatsAppLink}
        />
      )}
    </div>
  )
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      <Catalogo />
    </Suspense>
  )
}
