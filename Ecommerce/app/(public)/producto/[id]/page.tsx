"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { FaArrowLeft, FaCheck, FaWhatsapp, FaChevronLeft, FaChevronRight, FaTimes, FaSearchPlus } from "react-icons/fa"
import { ecommerceProductService } from "@/services/ecommerceApi"
import { motion, AnimatePresence, useMotionValueEvent } from "framer-motion"
import { IMAGE_BASE_URL } from "@/config/constants"
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter"

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
  category_id?: number;
  category?: {
    id: number;
    name: string;
  };
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
}

// Animated Price Component
interface AnimatedPriceProps {
  value: number
  isStrikethrough?: boolean
  isOffer?: boolean
}

const AnimatedPrice: React.FC<AnimatedPriceProps> = ({ value, isStrikethrough = false, isOffer = false }) => {
  // Asegurarse de que value sea un número válido
  const numericValue = Number(value) || 0
  const displayPrice = useAnimatedCounter(numericValue, 1)
  const [formattedPrice, setFormattedPrice] = useState(numericValue.toFixed(2))

  useMotionValueEvent(displayPrice, "change", (latest) => {
    setFormattedPrice(latest.toFixed(2))
  })

  return (
    <motion.span
      key={value}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      className={
        isStrikethrough
          ? "text-gray-400 dark:text-gray-600 line-through text-xl"
          : isOffer
          ? "text-4xl font-bold bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent"
          : "text-4xl font-bold bg-gradient-to-r from-purple-500 to-fv-gold bg-clip-text text-transparent"
      }
    >
      S/ {formattedPrice}
    </motion.span>
  )
}

function DetalleProducto() {
  const { id } = useParams() as { id: string }
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addedToCart, setAddedToCart] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [zoomOrigin, setZoomOrigin] = useState({ x: 0.5, y: 0.5 })
  const imageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await ecommerceProductService.getById(Number(id))
        const productData = response.data
        setProduct(productData)
        setSelectedImageIndex(0) // Reset image selection when product changes

        // Obtener productos relacionados (misma categoría)
        const allProductsRes = await ecommerceProductService.getAll()
        const allProductsData = allProductsRes.data || []
        const related = allProductsData
          .filter((p: Product) => p.category?.id === productData.category?.id && p.id !== productData.id)
          .slice(0, 4)

        setRelatedProducts(related)
        setLoading(false)
      } catch (error) {
        console.error("Error al cargar producto:", error)
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  // Función para generar el enlace de WhatsApp con el mensaje predefinido
  const getWhatsAppLink = (product: Product) => {
    if (!product) return "#"
    const message = `Hola, estoy interesado en el producto "${product.name}" con precio ${product.precio_de_oferta ? `S/ ${product.precio_de_oferta}` : `S/ ${product.price}`}. ¿Podrías darme más información?`
    return `https://wa.me/51967411110?text=${encodeURIComponent(message)}`
  }

  // Estructura del carrito para evitar 'any'
  interface CartItem {
    id: number;
    name: string;
    price: number;
    imagen?: string;
    quantity: number;
  }

  const addToCart = (product: Product) => {
    const saved = localStorage.getItem('catalogo_cart_items')
    let cart: CartItem[] = []
    try {
      cart = saved ? (JSON.parse(saved) as CartItem[]) : []
    } catch {
      cart = []
    }

    const index = cart.findIndex((it) => it.id === product.id)
    if (index >= 0) {
      cart[index].quantity = (Number(cart[index].quantity) || 0) + 1
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.precio_de_oferta ?? product.price,
        imagen: product.imagen,
        quantity: 1,
      })
    }

    localStorage.setItem('catalogo_cart_items', JSON.stringify(cart))
    // Notificar al header en esta misma pestaña
    window.dispatchEvent(new Event('catalogo_cart_items_updated'))

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-fv-gold/20 rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Skeleton for back button */}
            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Skeleton for image */}
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>

              {/* Skeleton for details */}
              <div className="space-y-6">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                <div className="flex gap-4">
                  <div className="h-12 flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                  <div className="h-12 flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-fv-gold/20 rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center p-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Producto no encontrado</h2>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl text-gray-900 dark:text-white py-3 px-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all hover:-translate-x-1"
              >
                <FaArrowLeft /> Volver al catálogo
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl text-gray-900 dark:text-white py-3 px-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all hover:-translate-x-1"
          >
            <FaArrowLeft /> Volver al catálogo
          </Link>
        </motion.div>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            {(() => {
              // Build array of all images (main + additional)
              const allImages = [
                product.imagen || "/images/product-placeholder.jpg",
                ...(product.images?.sort((a, b) => a.order - b.order).map(img => img.image_path) || [])
              ]

              const goToPrevious = () => {
                setSelectedImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
              }

              const goToNext = () => {
                setSelectedImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
              }

              // Mouse tracking for zoom
              const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
                if (!imageRef.current) return
                const rect = imageRef.current.getBoundingClientRect()
                const x = (e.clientX - rect.left) / rect.width
                const y = (e.clientY - rect.top) / rect.height
                setZoomOrigin({ x, y })
              }

              return (
                <>
                  {/* Main Image */}
                  <div
                    ref={imageRef}
                    className="group bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800 relative cursor-zoom-in"
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setZoomLevel(2)}
                    onMouseLeave={() => setZoomLevel(1)}
                    onClick={() => setShowLightbox(true)}
                  >
                    <div className="aspect-square overflow-hidden relative">
                      {product.precio_de_oferta && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          transition={{
                            delay: 0.3,
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                          }}
                          whileHover={{ rotate: 5, scale: 1.1 }}
                          className="absolute top-4 right-4 z-10 bg-gradient-to-r from-primary to-fv-gold text-white py-2 px-4 rounded-xl font-bold text-sm shadow-lg"
                        >
                          ¡Oferta!
                        </motion.div>
                      )}
                      <motion.img
                        key={selectedImageIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{
                          opacity: 1,
                          scale: zoomLevel,
                          x: zoomLevel > 1 ? (0.5 - zoomOrigin.x) * 100 : 0,
                          y: zoomLevel > 1 ? (0.5 - zoomOrigin.y) * 100 : 0
                        }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        src={buildImageUrl(allImages[selectedImageIndex])}
                        alt={`${product.name} - Imagen ${selectedImageIndex + 1}`}
                        className="w-full h-full object-contain p-4"
                      />

                      {/* Zoom indicator */}
                      <motion.div
                        className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm rounded-full p-2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                          opacity: zoomLevel > 1 ? 1 : 0,
                          scale: zoomLevel > 1 ? 1 : 0.8
                        }}
                      >
                        <FaSearchPlus className="text-white text-sm" />
                      </motion.div>

                      {/* Navigation Arrows - Only show if there are multiple images */}
                      {allImages.length > 1 && (
                        <>
                          {/* Previous Button */}
                          <motion.button
                            onClick={goToPrevious}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <FaChevronLeft className="text-gray-700 dark:text-gray-300" />
                          </motion.button>

                          {/* Next Button */}
                          <motion.button
                            onClick={goToNext}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <FaChevronRight className="text-gray-700 dark:text-gray-300" />
                          </motion.button>

                          {/* Image Counter */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-sm font-semibold rounded-full shadow-lg">
                            {selectedImageIndex + 1} / {allImages.length}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail Gallery */}
                  {allImages.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-4 sm:grid-cols-6 gap-3"
                >
                  {allImages.map((imagePath, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? "border-primary dark:border-primary ring-2 ring-primary/50"
                          : "border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-fv-gold"
                      }`}
                    >
                      <img
                        src={buildImageUrl(imagePath)}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedImageIndex === index && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 bg-primary/20 dark:bg-primary/20"
                        />
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
                </>
              )
            })()}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-800 space-y-6"
          >
            {/* Category Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-block"
            >
              <span className="px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/10 border border-primary/20 dark:border-primary/20 rounded-xl text-fv-gold dark:text-fv-gold text-sm font-semibold">
                {product.category?.name || "Categoría"}
              </span>
            </motion.div>

            {/* Product Name */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white"
            >
              {product.name}
            </motion.h1>

            {/* Price with Animation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4"
            >
              {product.precio_de_oferta ? (
                <>
                  <AnimatedPrice value={product.price} isStrikethrough />
                  <AnimatedPrice value={product.precio_de_oferta} isOffer />
                </>
              ) : (
                <AnimatedPrice value={product.price} />
              )}
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              <p>{product.description || "Sin descripción disponible."}</p>
            </motion.div>

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-3"
            >
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-fv-gold flex items-center justify-center">
                  <FaCheck className="text-white text-sm" />
                </div>
                <span className="font-medium">ID: {product.id}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-fv-gold flex items-center justify-center">
                  <FaCheck className="text-white text-sm" />
                </div>
                <span className="font-medium">
                  Disponibilidad: <span className={product.stock > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                    {product.stock > 0 ? "En stock" : "Agotado"}
                  </span>
                </span>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(product)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-fv-gold text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all"
              >
                {addedToCart ? (
                  <>
                    <FaCheck /> ¡Agregado!
                  </>
                ) : (
                  'Agregar al Carrito'
                )}
              </motion.button>
              <motion.a
                href={getWhatsAppLink(product)}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#25d366] text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all"
              >
                <FaWhatsapp className="w-6 h-6" /> WhatsApp
              </motion.a>
            </motion.div>
          </motion.div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16"
          >
            <h2 className="text-center mb-12 text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
              Productos{" "}
              <span className="bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
                Relacionados
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct, index) => (
                <motion.div
                  key={relatedProduct.id}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={cardVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300"
                >
                  <Link href={`/producto/${relatedProduct.id}`}>
                    <div className="h-[200px] relative overflow-hidden">
                      <motion.img
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                        src={buildImageUrl(relatedProduct.imagen) || "/images/product-placeholder.jpg"}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover"
                      />
                      {relatedProduct.precio_de_oferta && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-primary to-fv-gold text-white py-1 px-3 rounded-lg text-xs font-bold shadow-lg z-10">
                          Oferta
                        </div>
                      )}
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="p-5 space-y-2">
                      <div className="text-fv-gold dark:text-fv-gold text-xs font-semibold uppercase tracking-wide">
                        {relatedProduct.category?.name || "Categoría"}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-fv-gold dark:group-hover:text-fv-gold transition-colors">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-center gap-2 pt-2">
                        {relatedProduct.precio_de_oferta ? (
                          <>
                            <span className="text-gray-400 dark:text-gray-600 line-through text-sm">
                              S/ {relatedProduct.price}
                            </span>
                            <span className="text-xl font-bold bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
                              S/ {relatedProduct.precio_de_oferta}
                            </span>
                          </>
                        ) : (
                          <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-fv-gold bg-clip-text text-transparent">
                            S/ {relatedProduct.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Lightbox Modal */}
        <AnimatePresence>
          {showLightbox && product && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLightbox(false)}
              className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 cursor-zoom-out"
            >
              {/* Close button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                transition={{ delay: 0.1 }}
                onClick={() => setShowLightbox(false)}
                className="absolute top-4 right-4 z-10 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes className="text-white text-2xl" />
              </motion.button>

              {/* Image */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-7xl max-h-full"
              >
                {(() => {
                  const allImages = [
                    product.imagen || "/images/product-placeholder.jpg",
                    ...(product.images?.sort((a, b) => a.order - b.order).map(img => img.image_path) || [])
                  ]

                  return (
                    <>
                      <motion.img
                        key={selectedImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        src={buildImageUrl(allImages[selectedImageIndex])}
                        alt={`${product.name} - Imagen ${selectedImageIndex + 1}`}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                      />

                      {/* Navigation in lightbox */}
                      {allImages.length > 1 && (
                        <>
                          <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
                            }}
                            whileHover={{ scale: 1.1, x: -4 }}
                            whileTap={{ scale: 0.9 }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors"
                          >
                            <FaChevronLeft className="text-white text-2xl" />
                          </motion.button>

                          <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
                            }}
                            whileHover={{ scale: 1.1, x: 4 }}
                            whileTap={{ scale: 0.9 }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors"
                          >
                            <FaChevronRight className="text-white text-2xl" />
                          </motion.button>

                          {/* Image counter in lightbox */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white text-lg font-bold rounded-full shadow-lg"
                          >
                            {selectedImageIndex + 1} / {allImages.length}
                          </motion.div>
                        </>
                      )}
                    </>
                  )
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default DetalleProducto
