"use client"

import { useState, useEffect, useRef } from "react"
import { Search, User, Menu, X, ChevronDown, Layers, Sparkles, LogOut, UserCircle, ClipboardList, Package2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { ecommerceProductService, ecommerceCategoryService, ecommerceAuthService, User as UserType } from "@/services/ecommerceApi"
import { IMAGE_BASE_URL } from "@/config/constants"
import { motion, AnimatePresence } from "framer-motion"
import CartDropdown from "@/components/layout/CartDropdown"
import { toast } from "react-toastify"

// Helper para construir URLs de imagen
const buildImageUrl = (path?: string) => {
  if (!path) return ""
  if (/^https?:\/\//.test(path)) return path
  const clean = path.replace(/^\/+/, "")
  return clean.startsWith("storage/")
    ? `${IMAGE_BASE_URL}/${clean}`
    : `${IMAGE_BASE_URL}/storage/${clean}`
}

interface Product {
  id: number;
  name: string;
  imagen?: string;
}

interface Category {
  id: number;
  name: string;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [cartCount, setCartCount] = useState(0)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [showCatalogDropdown, setShowCatalogDropdown] = useState(false)
  const [showMobileCategories, setShowMobileCategories] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const catalogRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Detectar scroll para efecto glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Cerrar menú móvil al cambiar de ubicación
  useEffect(() => {
    setIsMenuOpen(false)
    setShowSuggestions(false)
  }, [pathname])

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Cargar usuario actual
  useEffect(() => {
    const user = ecommerceAuthService.getCurrentUser()
    setCurrentUser(user)
  }, [pathname])

  // Cargar productos para autocompletado
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await ecommerceProductService.getAll();
        const productsData = response.data || [];
        setProducts(productsData);
      } catch (error) {
        console.error("Error al cargar productos:", error);
      }
    };
    fetchProducts();
  }, [])

  // Cargar categorías para el menú desplegable
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await ecommerceCategoryService.getAll();
        const categoriesData = response.data || [];
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      }
    };
    fetchCategories();
  }, [])

  // Filtrar productos según la búsqueda
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setFilteredProducts([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, products])

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (catalogRef.current && !catalogRef.current.contains(event.target as Node)) {
        setShowCatalogDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [])

  // Función de logout
  const handleLogout = () => {
    ecommerceAuthService.logout()
    setCurrentUser(null)
    setShowUserDropdown(false)
    toast.success("¡Hasta pronto!")
    router.push("/")
  }

  const computeCartCount = () => {
    try {
      const saved = localStorage.getItem('catalogo_cart_items')
      if (!saved) {
        setCartCount(0)
        return
      }
      const arr = JSON.parse(saved) as Array<{ quantity: number }>
      const total = arr.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
      setCartCount(total)
    } catch {
      setCartCount(0)
    }
  }

  useEffect(() => {
    computeCartCount()
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === 'catalogo_cart_items') computeCartCount()
    }
    const onFocus = () => computeCartCount()
    const onCustom = () => computeCartCount()

    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    window.addEventListener('catalogo_cart_items_updated', onCustom as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('catalogo_cart_items_updated', onCustom as EventListener)
    }
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isMenuOpen])

  const navigationItems = [
    { name: "Catálogo", to: "/catalogo" },
    { name: "Servicios", to: "/servicios" },
    { name: "Importa con nosotros", to: "/solicitud-importacion" },
    { name: "Contacto", to: "/contacto" },
  ]

  return (
    <>
      {/* Main Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/90 dark:bg-fv-black/95 backdrop-blur-2xl shadow-2xl"
            : "bg-white/95 dark:bg-fv-black/98 backdrop-blur-xl shadow-xl"
        }`}
      >
        {/* Racing stripe effect - TOP */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80"></div>

        {/* Racing stripe effect - BOTTOM */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0"></div>

        {/* Decorative racing diagonal lines background */}
        <div className="absolute inset-0 overflow-hidden opacity-5 dark:opacity-[0.03] pointer-events-none">
          <div className="absolute -left-20 top-0 bottom-0 w-32 bg-gradient-to-r from-primary to-transparent skew-x-12"></div>
          <div className="absolute -right-20 top-0 bottom-0 w-32 bg-gradient-to-l from-primary to-transparent -skew-x-12"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* NIVEL 1: Logo + Búsqueda + User/Cart */}
          <div className="flex items-center justify-between gap-3 py-3 lg:py-4 relative">

            {/* Mobile: Menu Button */}
            <div className="md:hidden">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all border border-primary/20"
              >
                <motion.div
                  animate={{ rotate: isMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isMenuOpen ? (
                    <X className="h-5 w-5 text-primary" />
                  ) : (
                    <Menu className="h-5 w-5 text-primary" />
                  )}
                </motion.div>
              </motion.button>
            </div>

            {/* LOGO - Grande y elegante con magnificación limpia */}
            <Link href="/" className="flex-shrink-0 group relative">
              <motion.img
                src="/logo.png"
                alt="Criscom Group - Tecnología que impulsa tu futuro"
                className="h-20 sm:h-24 md:h-28 lg:h-36 xl:h-40 2xl:h-44 w-auto"
                style={{
                  filter: "drop-shadow(0 2px 8px rgba(59,130,246,0.25)) drop-shadow(0 1px 4px rgba(251,191,36,0.2))",
                }}
                whileHover={{
                  scale: 1.08,
                  filter: "drop-shadow(0 4px 16px rgba(59,130,246,0.4)) drop-shadow(0 2px 8px rgba(251,191,36,0.35)) brightness(1.08)",
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                whileTap={{ scale: 0.95 }}
              />
            </Link>

            {/* BUSCADOR - Centrado y compacto (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-xl lg:max-w-2xl mx-4 lg:mx-6">
              <motion.div
                className="relative w-full"
                ref={searchRef}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Buscar laptops, componentes, periféricos..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        router.push(`/catalogo?search=${encodeURIComponent(searchQuery.trim())}`);
                        setShowSuggestions(false);
                      }
                    }}
                    className="w-full pl-11 pr-12 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-full focus:ring-2 focus:ring-primary/40 focus:border-primary bg-gray-50/80 dark:bg-fv-gray/80 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all shadow-sm hover:shadow-md font-medium text-sm"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-full p-2 shadow-md hover:shadow-lg transition-all"
                    onClick={() => {
                      if (searchQuery.trim()) {
                        router.push(`/catalogo?search=${encodeURIComponent(searchQuery.trim())}`);
                        setShowSuggestions(false);
                      }
                    }}
                  >
                    <Search className="h-3.5 w-3.5 text-white" />
                  </motion.button>
                </div>

                {/* Sugerencias */}
                <AnimatePresence>
                  {showSuggestions && filteredProducts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute z-50 w-full mt-2 bg-white/98 dark:bg-fv-gray/98 backdrop-blur-xl border-2 border-primary/20 dark:border-primary/30 rounded-xl shadow-2xl max-h-80 overflow-auto"
                    >
                      <div className="p-1.5">
                        {filteredProducts.map((product, index) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.04 }}
                          >
                            <Link
                              href={`/producto/${product.id}`}
                              className="flex items-center px-3 py-2.5 hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 rounded-lg transition-all group border-b border-gray-100 dark:border-gray-800 last:border-0"
                              onClick={() => {
                                setSearchQuery(product.name);
                                setShowSuggestions(false);
                              }}
                            >
                              {product.imagen && (
                                <div className="w-10 h-10 mr-2.5 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 ring-1 ring-primary/10">
                                  <img
                                    src={buildImageUrl(product.imagen)}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "/images/product-placeholder.jpg"
                                    }}
                                  />
                                </div>
                              )}
                              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">{product.name}</span>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* USER & CART - Derecha (Desktop) */}
            <motion.div
              className="hidden md:flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {currentUser ? (
                // Usuario autenticado - Mostrar menú con nombre
                <div className="relative" ref={userRef}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 transition-all border border-primary/20 hover:border-primary/40"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-sm">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                      {currentUser.name.split(" ")[0]}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showUserDropdown ? "rotate-180" : ""}`} />
                  </motion.button>

                  <AnimatePresence>
                    {showUserDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full mt-2 right-0 bg-white/98 dark:bg-fv-gray/98 backdrop-blur-xl border-2 border-primary/20 rounded-xl shadow-2xl z-50 w-56 overflow-hidden"
                      >
                        {/* Header del dropdown */}
                        <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-primary/20">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
                        </div>

                        {/* Opciones */}
                        <div className="p-2">
                          <Link
                            href="/mi-cuenta"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                          >
                            <UserCircle className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
                              Mi cuenta
                            </span>
                          </Link>
                          <Link
                            href="/mis-pedidos"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                          >
                            <Package2 className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
                              Mis Pedidos
                            </span>
                          </Link>
                          <Link
                            href="/mis-solicitudes"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                          >
                            <ClipboardList className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
                              Mis Solicitudes
                            </span>
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                          >
                            <LogOut className="h-4 w-4 text-gray-500 group-hover:text-red-500 transition-colors" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-500 transition-colors">
                              Cerrar sesión
                            </span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                // Usuario no autenticado - Mostrar botones de login/registro
                <div className="flex items-center gap-2">
                  <Link href="/iniciar-sesion">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                    >
                      Ingresar
                    </motion.button>
                  </Link>
                  <Link href="/registro">
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      Registrarse
                    </motion.button>
                  </Link>
                </div>
              )}

              <CartDropdown cartCount={cartCount} onCartUpdate={computeCartCount} />
            </motion.div>

            {/* Mobile: Cart */}
            <div className="md:hidden">
              <CartDropdown cartCount={cartCount} onCartUpdate={computeCartCount} />
            </div>
          </div>

          {/* NIVEL 2: Navegación - Compacta con Menú Desplegable de Categorías */}
          <div className="hidden md:block border-t border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-r from-transparent via-primary/[0.02] to-transparent">
            <nav className="flex items-center justify-center gap-1 py-2.5">
              {navigationItems.map((item, index) => {
                // Si es "Catálogo", mostrar con menú desplegable
                if (item.name === "Catálogo" && categories.length > 0) {
                  return (
                    <motion.div
                      key={item.name}
                      ref={catalogRef}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index, duration: 0.3 }}
                      className="relative"
                      onMouseEnter={() => setShowCatalogDropdown(true)}
                      onMouseLeave={() => setShowCatalogDropdown(false)}
                    >
                      <Link
                        href={item.to}
                        className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all duration-300 relative group uppercase flex items-center gap-1.5 ${
                          pathname === item.to || pathname.startsWith("/catalogo")
                            ? "text-primary"
                            : "text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                        }`}
                      >
                        <span className="relative z-10 flex items-center gap-1.5">
                          {item.name}
                          <ChevronDown 
                            className={`h-3 w-3 transition-transform duration-300 ${
                              showCatalogDropdown ? "rotate-180" : ""
                            }`}
                          />
                        </span>
                        {(pathname === item.to || pathname.startsWith("/catalogo")) && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-lg border border-primary/20"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-3/4 transition-all duration-300 rounded-full" />
                      </Link>

                      {/* Menú Desplegable de Categorías */}
                      <AnimatePresence>
                        {showCatalogDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white/98 dark:bg-fv-black/98 backdrop-blur-2xl border-2 border-primary/20 dark:border-primary/30 rounded-2xl shadow-2xl z-50 overflow-hidden"
                            style={{ pointerEvents: showCatalogDropdown ? 'auto' : 'none' }}
                          >
                            {/* Header del dropdown */}
                            <div className="p-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-b border-primary/20">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                  <Layers className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Categorías</h3>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">Explora por categoría</p>
                                </div>
                              </div>
                            </div>

                            {/* Lista de categorías */}
                            <div className="p-2 max-h-96 overflow-y-auto">
                              <Link
                                href="/catalogo"
                                onClick={() => setShowCatalogDropdown(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all group mb-1"
                              >
                                <Sparkles className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
                                  Ver todas
                                </span>
                              </Link>
                              <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-2" />
                              {categories.map((category, catIndex) => (
                                <motion.div
                                  key={category.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: catIndex * 0.03 }}
                                >
                                  <Link
                                    href={`/catalogo?category=${category.id}`}
                                    onClick={() => setShowCatalogDropdown(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all group"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary group-hover:scale-125 transition-all" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors flex-1">
                                      {category.name}
                                    </span>
                                    <ChevronDown className="h-3 w-3 text-gray-400 -rotate-90 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                  </Link>
                                </motion.div>
                              ))}
                            </div>

                            {/* Footer con efecto visual */}
                            <div className="p-3 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 border-t border-primary/10">
                              <Link
                                href="/catalogo"
                                onClick={() => setShowCatalogDropdown(false)}
                                className="block text-center text-xs font-bold text-primary hover:text-secondary transition-colors"
                              >
                                Ver catálogo completo →
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                }

                // Para otros items de navegación
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index, duration: 0.3 }}
                  >
                    <Link
                      href={item.to}
                      className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all duration-300 relative group uppercase ${
                        pathname === item.to
                          ? "text-primary"
                          : "text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                      }`}
                    >
                      <span className="relative z-10">{item.name}</span>
                      {pathname === item.to && (
                        <motion.div
                          layoutId={`activeNav-${item.name}`}
                          className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-lg border border-primary/20"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-3/4 transition-all duration-300 rounded-full" />
                    </Link>
                  </motion.div>
                )
              })}
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white/98 dark:bg-fv-black/98 backdrop-blur-2xl shadow-2xl border-r-2 border-primary/30"
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <img
                    src="/logo.png"
                    alt="Criscom Group"
                    className="h-16 w-auto"
                    style={{
                      filter: "drop-shadow(0 2px 8px rgba(59,130,246,0.2))",
                    }}
                  />
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-primary/20"
                >
                  <X className="h-5 w-5 text-primary" />
                </motion.button>
              </div>

              {/* Mobile Search */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        router.push(`/catalogo?search=${encodeURIComponent(searchQuery.trim())}`);
                        setIsMenuOpen(false);
                        setShowSuggestions(false);
                      }
                    }}
                    className="w-full pl-10 pr-11 py-2.5 border-2 border-primary/20 dark:border-primary/30 rounded-full bg-gray-50 dark:bg-fv-gray font-medium text-sm"
                  />
                  <button
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-secondary rounded-full p-1.5"
                    onClick={() => {
                      if (searchQuery.trim()) {
                        setIsMenuOpen(false);
                        router.push(`/catalogo?search=${encodeURIComponent(searchQuery.trim())}`);
                        setShowSuggestions(false);
                      }
                    }}
                  >
                    <Search className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
                {navigationItems.map((item, index) => {
                  if (item.name === "Catálogo" && categories.length > 0) {
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                      >
                        <button
                          onClick={() => setShowMobileCategories(!showMobileCategories)}
                          className={`w-full flex items-center justify-between py-3 px-4 rounded-lg transition-all font-bold uppercase tracking-wide text-sm ${
                            pathname === item.to || pathname.startsWith("/catalogo")
                              ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary shadow-sm border border-primary/30"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        >
                          <span>{item.name}</span>
                          <ChevronDown 
                            className={`h-4 w-4 -rotate-90 transition-transform duration-300 ${
                              showMobileCategories ? "rotate-0" : ""
                            }`}
                          />
                        </button>
                        
                        {/* Categorías móviles expandibles */}
                        <AnimatePresence>
                          {showMobileCategories && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pl-4 pr-2 py-2 space-y-1">
                                <Link
                                  href="/catalogo"
                                  onClick={() => {
                                    setIsMenuOpen(false)
                                    setShowMobileCategories(false)
                                  }}
                                  className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Ver todas las categorías
                                </Link>
                                {categories.map((category) => (
                                  <Link
                                    key={category.id}
                                    href={`/catalogo?category=${category.id}`}
                                    onClick={() => {
                                      setIsMenuOpen(false)
                                      setShowMobileCategories(false)
                                    }}
                                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary transition-colors"
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                    {category.name}
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  }

                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                    >
                      <Link
                        href={item.to}
                        className={`flex items-center justify-between py-3 px-4 rounded-lg transition-all font-bold uppercase tracking-wide text-sm ${
                          pathname === item.to
                            ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary shadow-sm border border-primary/30"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span>{item.name}</span>
                        <ChevronDown className="h-4 w-4 -rotate-90" />
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>

              {/* Mobile User Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                {currentUser ? (
                  <div className="space-y-2">
                    {/* Usuario info */}
                    <div className="flex items-center gap-3 px-3 py-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center shadow-md">
                        <span className="text-white font-bold">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
                      </div>
                    </div>
                    {/* Botón mis solicitudes */}
                    <Link
                      href="/mis-solicitudes"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 rounded-lg transition-all border border-primary/30 text-primary font-semibold text-sm"
                    >
                      <ClipboardList className="h-4 w-4" />
                      <span>Mis Solicitudes</span>
                    </Link>
                    {/* Botón cerrar sesión */}
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold text-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/iniciar-sesion"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg transition-all font-bold text-sm shadow-md"
                    >
                      <User className="h-4 w-4" />
                      <span>Iniciar Sesión</span>
                    </Link>
                    <Link
                      href="/registro"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all border border-primary/30 font-semibold text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span>Crear cuenta</span>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Header
