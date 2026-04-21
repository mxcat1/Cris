import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart, X, Plus, Minus, Trash2, ExternalLink } from "lucide-react"
import { FaWhatsapp } from "react-icons/fa"
import { IMAGE_BASE_URL } from "@/config/constants"
import Link from "next/link"

// Helper para construir URLs de imagen
const buildImageUrl = (path?: string) => {
  if (!path) return ""
  if (/^https?:\/\//.test(path)) return path
  const clean = path.replace(/^\/+/, "")
  return clean.startsWith("storage/")
    ? `${IMAGE_BASE_URL}/${clean}`
    : `${IMAGE_BASE_URL}/storage/${clean}`
}

interface CartItem {
  productId: number;
  name: string;
  price: number;
  imagen?: string;
  quantity: number;
}

interface CartDropdownProps {
  cartCount: number;
  onCartUpdate?: () => void;
}

const CartDropdown = ({ cartCount, onCartUpdate }: CartDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Cargar items del carrito
  useEffect(() => {
    const loadCart = () => {
      try {
        const saved = localStorage.getItem("catalogo_cart_items")
        if (saved) {
          setCartItems(JSON.parse(saved))
        } else {
          setCartItems([])
        }
      } catch {
        setCartItems([])
      }
    }

    loadCart()

    // Escuchar cambios en el carrito
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "catalogo_cart_items" || e.key === null) {
        loadCart()
      }
    }

    const handleCustomEvent = () => {
      loadCart()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("catalogo_cart_items_updated", handleCustomEvent as EventListener)
    window.addEventListener("focus", loadCart)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("catalogo_cart_items_updated", handleCustomEvent as EventListener)
      window.removeEventListener("focus", loadCart)
    }
  }, [])

  // Calcular total
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  )

  const formatCurrency = (n: number) => n.toLocaleString("es-PE", { style: "currency", currency: "PEN" })

  // Funciones de carrito
  const updateQuantity = (productId: number, delta: number) => {
    const updatedCart = cartItems
      .map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
      .filter((item) => item.quantity > 0)

    setCartItems(updatedCart)
    localStorage.setItem("catalogo_cart_items", JSON.stringify(updatedCart))
    window.dispatchEvent(new Event("catalogo_cart_items_updated"))
    if (onCartUpdate) onCartUpdate()
  }

  const removeFromCart = (productId: number) => {
    const updatedCart = cartItems.filter((item) => item.productId !== productId)
    setCartItems(updatedCart)
    localStorage.setItem("catalogo_cart_items", JSON.stringify(updatedCart))
    window.dispatchEvent(new Event("catalogo_cart_items_updated"))
    if (onCartUpdate) onCartUpdate()
  }

  const clearCart = () => {
    setCartItems([])
    localStorage.setItem("catalogo_cart_items", JSON.stringify([]))
    window.dispatchEvent(new Event("catalogo_cart_items_updated"))
    if (onCartUpdate) onCartUpdate()
  }

  const getWhatsAppLink = () => {
    if (cartItems.length === 0) return "https://wa.me/51967411110"
    const lines = cartItems.map(
      (item) =>
        `• ${item.name} x${item.quantity} — ${formatCurrency(item.price)} c/u = ${formatCurrency(
          item.price * item.quantity
        )}`
    )
    const totalLine = `\nTotal: ${formatCurrency(cartTotal)}`
    const header = "Hola, quiero solicitar estos productos de Globival & Detalles:\n\n"
    const message = `${header}${lines.join("\n")}${totalLine}`
    return `https://wa.me/51967411110?text=${encodeURIComponent(message)}`
  }

  return (
    <div className="relative">
      {/* Cart Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-full bg-gradient-to-br from-primary/20 to-rh-teal/20 hover:from-primary/30 hover:to-rh-teal/30 transition-all shadow-sm hover:shadow-md"
      >
        <ShoppingCart className="h-5 w-5 text-primary dark:text-rh-teal-light" />
        {cartCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="absolute -top-1 -right-1 bg-gradient-to-r from-primary to-rh-gold text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-lg"
          >
            {cartCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="fixed md:absolute top-16 md:top-auto right-0 md:right-0 md:mt-2 w-full md:w-96 max-w-full md:max-w-[calc(100vw-2rem)] h-[calc(100vh-4rem)] md:h-auto max-h-[90vh] bg-white/98 dark:bg-gray-900/98 backdrop-blur-2xl rounded-none md:rounded-2xl shadow-2xl border-t md:border border-gray-200 dark:border-gray-800 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Mi Carrito ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="max-h-96 overflow-y-auto">
                {cartItems.length > 0 ? (
                  <div className="p-4 space-y-3">
                    {cartItems.map((item, index) => (
                      <motion.div
                        key={`cart-item-${item.productId}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary/30 transition-all group"
                      >
                        {/* Image */}
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img
                            src={buildImageUrl(item.imagen) || "/images/product-placeholder.jpg"}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
                            {item.name}
                          </h4>
                          <p className="text-sm text-primary font-semibold mb-2">
                            {formatCurrency(item.price)}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-primary hover:text-primary transition-all"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-[2rem] text-center text-sm font-medium text-gray-900 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-primary hover:text-primary transition-all"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="self-start p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-2">Tu carrito está vacío</p>
                    <Link
                      href="/catalogo"
                      onClick={() => setIsOpen(false)}
                      className="text-sm text-primary hover:underline"
                    >
                      Explorar productos
                    </Link>
                  </div>
                )}
              </div>

              {/* Footer */}
              {cartItems.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-3 bg-gray-50/50 dark:bg-gray-800/50">
                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total:</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(cartTotal)}</span>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    {/* Checkout Button - Principal */}
                    <Link
                      href="/checkout"
                      onClick={() => setIsOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all text-sm font-medium shadow-lg hover:shadow-xl"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Finalizar Compra
                    </Link>

                    {/* WhatsApp Button - Alternativa */}
                    <a
                      href={getWhatsAppLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all text-sm font-medium shadow-lg hover:shadow-xl"
                    >
                      <FaWhatsapp className="h-4 w-4" />
                      Ordenar por WhatsApp
                    </a>

                    {/* Continue Shopping */}
                    <Link
                      href="/catalogo"
                      onClick={() => setIsOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary transition-all text-sm font-medium"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Seguir Comprando
                    </Link>
                  </div>

                  {/* Clear Cart */}
                  <button
                    onClick={clearCart}
                    className="w-full text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    Vaciar carrito
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CartDropdown
