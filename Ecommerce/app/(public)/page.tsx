"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  FaArrowRight,
  FaCar,
  FaTachometerAlt,
  FaTools,
  FaCog,
  FaEye,
  FaExpand,
  FaWhatsapp,
  FaChevronLeft,
  FaChevronRight,
  FaShoppingCart,
  FaTimes,
  FaCheckCircle,
  FaLayerGroup,
  FaHeart,
} from "react-icons/fa"
import { ecommerceProductService, ecommerceBannerService } from "@/services/ecommerceApi"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { IMAGE_BASE_URL } from "@/config/constants"

import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeleton"
import { fadeInUp, staggerContainer, cardLift, slideVariants } from "@/config/animationVariants"

const buildImageUrl = (path?: string) => {
  if (!path) return ""
  if (/^https?:\/\//.test(path)) return path
  const clean = path.replace(/^\/+/, "")
  return clean.startsWith("storage/") ? `${IMAGE_BASE_URL}/${clean}` : `${IMAGE_BASE_URL}/storage/${clean}`
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  precio_de_oferta?: number
  stock: number
  imagen?: string
  subCategory?: {
    id: number
    name: string
  }
}

const banner1 = "/banner.png"
const testimonio1 = "/banner.png"
const testimonio2 = "/banner.png"
const testimonio3 = "/banner.png"
const testimonio4 = "/banner.png"

const ProductCardSkeleton = () => (
  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800">
    <ShimmerSkeleton className="h-64 w-full" />
    <div className="p-5 space-y-3">
      <ShimmerSkeleton className="h-4 w-1/3 rounded" />
      <ShimmerSkeleton className="h-6 w-full rounded" />
      <ShimmerSkeleton className="h-6 w-2/3 rounded" />
      <div className="flex gap-2">
        <ShimmerSkeleton className="h-10 flex-1 rounded-xl" />
        <ShimmerSkeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  </div>
)

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
}

interface QuickViewModalProps {
  product: Product | null
  onClose: () => void
  onAddToCart: (product: Product) => void
}

const QuickViewModal = ({ product, onClose, onAddToCart }: QuickViewModalProps) => {
  if (!product) return null

  const discount = product.precio_de_oferta
    ? Math.round(((Number(product.price) - Number(product.precio_de_oferta)) / Number(product.price)) * 100)
    : 0

  const getWhatsAppLink = () => {
    const message = `Hola, quiero información sobre: ${product.name} - Precio: S/ ${product.precio_de_oferta ?? product.price}`
    return `https://wa.me/51967411110?text=${encodeURIComponent(message)}`
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
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            <FaTimes className="text-xl text-gray-700 dark:text-gray-300" />
          </button>

          <div className="grid md:grid-cols-2 gap-6 p-6 md:p-8">
            <div className="space-y-4">
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden group">
                <img
                  src={buildImageUrl(product.imagen) || "/placeholder.jpg"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {product.precio_de_oferta && (
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="bg-gradient-to-r from-red-500 to-secondary text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      -{discount}% OFF
                    </div>
                  </div>
                )}
                {product.stock <= 5 && product.stock > 0 && (
                  <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    ¡Solo {product.stock} disponibles!
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex-1">
                <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-3">
                  {product.subCategory?.name || "General"}
                </div>

                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{product.name}</h2>

                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  {product.description || "Sin descripción disponible"}
                </p>

                <div className="bg-gradient-to-br from-primary/5 to-primary/5 rounded-2xl p-6 mb-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    {product.precio_de_oferta ? (
                      <>
                        <span className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
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
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">Agotado</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    onAddToCart(product)
                    onClose()
                  }}
                  disabled={product.stock === 0}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                >
                  <FaShoppingCart className="text-xl" />
                  Agregar al carrito
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={getWhatsAppLink()}
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

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(0)
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  interface Banner {
    image: string
    title: string
  }

  const fallbackBanners: Banner[] = [
    { image: banner1, title: "Promoción Especial" },
    { image: testimonio1, title: "Detalles Artesanales" },
    { image: testimonio2, title: "Regalos con Amor" },
    { image: testimonio3, title: "Sorpresas Únicas" },
    { image: testimonio4, title: "Momentos Memorables" },
  ]

  const [banners, setBanners] = useState<Banner[]>([])

  const normalizeProduct = (p: unknown): Product => {
    const obj = p as Record<string, unknown>

    const priceRaw = obj.price as number | string | undefined
    const price = typeof priceRaw === "string" ? Number(priceRaw) : typeof priceRaw === "number" ? priceRaw : 0

    const offerRaw = obj.precio_de_oferta as number | string | null | undefined
    const offer =
      offerRaw == null
        ? undefined
        : typeof offerRaw === "string"
          ? Number(offerRaw)
          : typeof offerRaw === "number"
            ? offerRaw
            : undefined

    const idRaw = obj.id as number | string | undefined
    const id = typeof idRaw === "string" ? Number(idRaw) : typeof idRaw === "number" ? idRaw : 0

    const name = String(obj.name ?? "")
    const description = String(obj.description ?? "")

    const stockRaw = obj.stock as number | string | undefined
    const stock = typeof stockRaw === "string" ? Number(stockRaw) : typeof stockRaw === "number" ? stockRaw : 0

    const imagen = obj.imagen as string | undefined

    const sc = obj.subCategory as { id?: number | string; name?: unknown } | undefined
    const subCategory =
      sc && typeof sc === "object"
        ? {
            id: typeof sc.id === "string" ? Number(sc.id) : typeof sc.id === "number" ? sc.id : 0,
            name: String(sc.name ?? "General"),
          }
        : undefined

    return {
      id,
      name,
      description,
      price: Number.isNaN(price) ? 0 : price,
      precio_de_oferta: offer !== undefined && Number.isNaN(offer as number) ? undefined : (offer as number | undefined),
      stock,
      imagen,
      subCategory,
    }
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await ecommerceProductService.getFeaturedProducts()
        const productsData = response?.data || []
        const normalized = productsData.map((item: unknown) => normalizeProduct(item))
        setFeaturedProducts(normalized.slice(0, 4))
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await ecommerceBannerService.getAll()
        const bannersData = res?.data || []
        const items = bannersData
          .filter((b) => Boolean(b?.image) && b?.active !== false)
          .map((b) => ({
            image: buildImageUrl(b.image),
            title: b?.title ?? "Promoción Especial",
          })) as Banner[]
        setBanners(items)
        setCurrentSlide(0)
      } catch (error) {
        console.error("Error fetching banners:", error)
      }
    }

    fetchBanners()
  }, [])

  const displayBanners = banners.length > 0 ? banners : fallbackBanners

  useEffect(() => {
    if (displayBanners.length === 0) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === displayBanners.length - 1 ? 0 : prev + 1))
    }, 5000)

    return () => clearInterval(interval)
  }, [displayBanners.length])

  const nextSlide = () => {
    setDirection(1)
    setCurrentSlide((prev) => (prev === displayBanners.length - 1 ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setDirection(-1)
    setCurrentSlide((prev) => (prev === 0 ? displayBanners.length - 1 : prev - 1))
  }

  const openProductModal = (product: Product) => {
    setSelectedProduct(product)
  }

  const closeProductModal = () => {
    setSelectedProduct(null)
  }

  const addToCart = (product: Product) => {
    try {
      const unitPrice = product.precio_de_oferta ?? product.price
      const saved = localStorage.getItem("catalogo_cart_items")
      const currentCart = saved ? JSON.parse(saved) : []

      const existing = currentCart.find((item: any) => item.productId === product.id)
      const updatedCart = existing
        ? currentCart.map((item: any) =>
            item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [
            ...currentCart,
            {
              productId: product.id,
              name: product.name,
              price: unitPrice,
              imagen: product.imagen,
              quantity: 1,
            },
          ]

      localStorage.setItem("catalogo_cart_items", JSON.stringify(updatedCart))
      window.dispatchEvent(new Event("catalogo_cart_items_updated"))
    } catch (error) {
      console.error("Error adding to cart:", error)
    }
  }

  return (
    <div className="relative w-full bg-gradient-to-b from-background to-background/80">
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] sm:h-[70vh] lg:h-[75vh] flex items-center justify-center text-center text-foreground overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${displayBanners[currentSlide]?.image})` }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <motion.a
            href={`https://wa.me/51967411110?text=${encodeURIComponent("Hola, me interesa conocer más sobre: " + (displayBanners[currentSlide]?.title ?? ""))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 md:px-8 py-3.5 md:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-xl ring-2 ring-white/70 font-semibold flex items-center gap-3 whitespace-nowrap hover:shadow-2xl transition-shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaWhatsapp className="text-xl md:text-2xl" />
            <span className="text-sm md:text-base">Consulta por este producto</span>
          </motion.a>
        </div>

        {/* Carousel Controls */}
        <motion.button
          className="absolute left-5 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-primary p-4 rounded-full z-20 shadow-xl"
          onClick={prevSlide}
          whileHover={{ scale: 1.1, x: -4 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaChevronLeft />
        </motion.button>
        <motion.button
          className="absolute right-5 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-primary p-4 rounded-full z-20 shadow-xl"
          onClick={nextSlide}
          whileHover={{ scale: 1.1, x: 4 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaChevronRight />
        </motion.button>

        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {displayBanners.map((_, index) => (
            <motion.button
              key={index}
              className={`rounded-full transition-all ${
                index === currentSlide ? "bg-primary" : "bg-white/50 dark:bg-gray-600/50"
              }`}
              onClick={() => {
                setDirection(index > currentSlide ? 1 : -1)
                setCurrentSlide(index)
              }}
              animate={{
                scale: index === currentSlide ? 1.5 : 1,
                opacity: index === currentSlide ? 1 : 0.6,
              }}
              whileHover={{ scale: index === currentSlide ? 1.5 : 1.2, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{ width: index === currentSlide ? "32px" : "12px", height: "12px" }}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 md:py-20 bg-gradient-to-b from-background/80 to-background overflow-x-hidden">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-4xl font-bold text-center mb-12 relative z-10 text-foreground"
        >
          Por qué elegir <span className="text-primary">Criscom Group</span>
        </motion.h2>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10"
        >
          {[
            { icon: FaCar, title: "Tecnología de Vanguardia", desc: "Equipos y componentes de las mejores marcas internacionales" },
            { icon: FaTachometerAlt, title: "Alto Rendimiento", desc: "Hardware diseñado para máximo rendimiento y eficiencia" },
            { icon: FaTools, title: "Asesoría Especializada", desc: "Te guiamos en la selección perfecta para tus necesidades" },
            { icon: FaCog, title: "Garantía y Soporte", desc: "Respaldo completo con garantía y soporte técnico profesional" },
          ].map((feature, idx) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 transition-all"
              >
                <div className="text-4xl text-primary mb-4">
                  <Icon />
                </div>
                <h3 className="text-xl font-bold mb-3 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* Products Section */}
      <section className="py-16 md:py-20 relative bg-white dark:bg-gray-950 overflow-hidden">
        <motion.h2
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="text-3xl md:text-4xl font-bold text-center mb-12 relative z-10 dark:text-white"
        >
          Tecnología <span className="text-primary">Destacada</span>
        </motion.h2>

        <LayoutGroup>
          <motion.div
            layout
            className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10"
          >
            {loading ? (
              Array(4)
                .fill(0)
                .map((_, index) => <ProductCardSkeleton key={index} />)
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product, index) => {
                const discount = product.precio_de_oferta
                  ? Math.round(
                      ((Number(product.price) - Number(product.precio_de_oferta)) / Number(product.price)) * 100,
                    )
                  : 0

                return (
                  <motion.div
                    key={product.id}
                    layout
                    layoutId={`product-${product.id}`}
                    variants={cardLift}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    whileHover="hover"
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                      opacity: { duration: 0.4, delay: index * 0.1 },
                      scale: { duration: 0.4, delay: index * 0.1 },
                    }}
                    className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg border border-gray-200/50 dark:border-gray-800/50 hover:shadow-xl transition-shadow"
                  >
                    <div className="relative h-64 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <Link href={`/producto/${product.id}`}>
                        <img
                          src={buildImageUrl(product.imagen) || "/placeholder.jpg"}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      </Link>

                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.precio_de_oferta && (
                          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                            -{discount}% OFF
                          </div>
                        )}
                        {product.stock <= 5 && product.stock > 0 && (
                          <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            ¡Últimas {product.stock}!
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => openProductModal(product)}
                        className="absolute top-3 right-3 p-3 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 rounded-full opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-lg"
                      >
                        <FaExpand className="text-sm" />
                      </button>

                      <button className="absolute bottom-3 right-3 p-3 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 rounded-full opacity-0 group-hover:opacity-100 hover:text-red-500 hover:scale-110 transition-all shadow-lg">
                        <FaHeart className="text-sm" />
                      </button>
                    </div>

                    <div className="p-5">
                      <div className="text-xs text-primary font-medium mb-2 flex items-center gap-1">
                        <FaLayerGroup className="text-xs" />
                        {product.subCategory?.name || "General"}
                      </div>

                      <Link href={`/producto/${product.id}`}>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="flex items-baseline gap-2 mb-4">
                        {product.precio_de_oferta ? (
                          <>
                            <span className="text-2xl font-bold text-primary">
                              S/ {Number(product.precio_de_oferta).toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              S/ {Number(product.price).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-primary">S/ {Number(product.price).toFixed(2)}</span>
                        )}
                      </div>

                      {product.stock > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${
                                product.stock > 10 ? "bg-green-500" : product.stock > 5 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              initial={{ scaleX: 0 }}
                              whileInView={{ scaleX: 1 }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                              style={{
                                transformOrigin: "left",
                                width: `${Math.min((product.stock / 20) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{product.stock > 10 ? "Alto" : "Bajo"}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 pt-0 flex gap-2">
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                      >
                        <FaShoppingCart className="text-sm" />
                        <span className="text-sm">Agregar</span>
                      </button>
                      <a
                        href={`https://wa.me/51967411110?text=Hola,%20estoy%20interesado%20en:%20${product.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 hover:scale-110 transition-all"
                      >
                        <FaWhatsapp className="text-lg" />
                      </a>
                      <button
                        onClick={() => openProductModal(product)}
                        className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-110 transition-all"
                      >
                        <FaEye className="text-lg" />
                      </button>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No hay productos disponibles</p>
              </div>
            )}
          </motion.div>
        </LayoutGroup>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center relative z-10"
        >
          <Link href="/catalogo">
            <button className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all inline-flex items-center gap-2">
              Ver todo el catálogo
              <FaArrowRight className="text-sm" />
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal product={selectedProduct} onClose={closeProductModal} onAddToCart={addToCart} />
    </div>
  )
}

export default Home
