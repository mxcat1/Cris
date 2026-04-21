"use client"

import { useState, useEffect } from "react"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Building2,
  LogOut,
  Menu,
  User,
  DollarSign,
  FileText,
  ChevronLeft,
  Sparkles,
  AlertTriangle,
  Percent,
  ClipboardList,
  X,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "../components/ui/button"
import { ThemeToggle } from "../components/theme-toggle"
import { useTheme } from "../lib/theme"
import { motion, AnimatePresence } from "framer-motion"
import { BackgroundDecorations } from "../components/background-decorations"
import { useKeyboardShortcuts } from "../contexts/KeyboardShortcutsContext"
import { features } from "../config/features"
import { HelpCircle } from "lucide-react"
import { BusinessHoursIndicator } from "../components/business-hours-indicator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog"

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme } = useTheme()
  const { setShowShortcutModal } = useKeyboardShortcuts()

  // Determinar el rol del usuario (por defecto, asumimos No Autorizado - 4)
  const userRole = user?.id_role || 4

  const handleLogoutRequest = () => {
    setLogoutConfirmOpen(true)
  }

  const handleLogoutConfirm = () => {
    logout()
    navigate("/login")
    setLogoutConfirmOpen(false)
  }

  // Efecto para manejar el cambio de tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
        setMobileMenuOpen(false)
      } else {
        setSidebarOpen(true)
        setMobileMenuOpen(false)
      }
    }

    // Configuración inicial
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Añadir atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "s") {
        e.preventDefault()
        setSidebarOpen(prev => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])
  // Filtrar los elementos de navegación según el rol
  const getNavItems = () => {
    const baseItems = [
      { path: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, allowedRoles: [1, 2, 3] },
    ]

    const roleSpecificItems = [
      { path: "/products", label: "Productos", icon: <Package className="h-5 w-5" />, allowedRoles: [1, 2, 3] },
      { path: "/categories", label: "Categorías", icon: <Tags className="h-5 w-5" />, allowedRoles: [1, 2, 3] },
      { path: "/sales", label: "Ventas", icon: <ShoppingCart className="h-5 w-5" />, allowedRoles: [1, 2, 3] },
      { path: "/sales/new", label: "Nueva Venta", icon: <ShoppingCart className="h-5 w-5" />, allowedRoles: [1, 2, 3] },
      { path: "/offers", label: "Ofertas", icon: <Percent className="h-5 w-5" />, allowedRoles: [1, 2] },
      ...(features.marketing ? [{ path: "/marketing", label: "Marketing", icon: <Sparkles className="h-5 w-5" />, allowedRoles: [1, 2] }] : []),
      // Nuevo ítem para generación de tickets PDF
      { path: "/generate-ticket-pdf", label: "Tickets PDF", icon: <FileText className="h-5 w-5" />, allowedRoles: [1, 2] },
      // Nuevo ítem para generación de Excel de productos
      { path: "/generate-excel-products", label: "Generar Excel Productos", icon: <FileText className="h-5 w-5" />, allowedRoles: [1, 2] },
      {
        path: "/cash-register",
        label: "Caja Diaria",
        icon: <DollarSign className="h-5 w-5" />,
        allowedRoles: [1, 2],
      },
      ...(features.libroReclamaciones ? [{ path: "/libro-reclamaciones", label: "Libro de Reclamaciones", icon: <AlertTriangle className="h-5 w-5" />, allowedRoles: [1, 2] }] : []),
      // Solicitudes de importación — admin UI (hot-patch B). Visible solo si FEATURE_ECOMMERCE.
      ...(features.ecommerce ? [{ path: "/solicitudes-importacion", label: "Solicitudes Importación", icon: <ClipboardList className="h-5 w-5" />, allowedRoles: [1, 2] }] : []),
      { path: "/company", label: "Empresa", icon: <Building2 className="h-5 w-5" />, allowedRoles: [1] },
      { path: "/users", label: "Usuarios", icon: <User className="h-5 w-5" />, allowedRoles: [1] },
      { path: "/audit-logs", label: "Logs de Auditoría", icon: <FileText className="h-5 w-5" />, allowedRoles: [1] },
    ]

    return [...baseItems, ...roleSpecificItems.filter((item) => item.allowedRoles.includes(userRole))]
  }

  const navItems = getNavItems()

  return (
    <div className={`min-h-screen bg-background ${theme}`}>
      <BackgroundDecorations />

      {/* Mobile menu backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 z-50 h-full w-80 bg-card/95 backdrop-blur-xl border-r border-border lg:hidden shadow-2xl"
          >
            <div className="flex flex-col h-full">
              {/* Mobile Sidebar Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <Link to="/" className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                   <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Criscom Group
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.05 * index }}
                  >
                    <Link
                      to={item.path}
                      className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${location.pathname === item.path
                          ? "bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className={`transition-colors ${location.pathname === item.path ? "text-indigo-600 dark:text-indigo-400" : "group-hover:text-foreground"
                        }`}>
                        {item.icon}
                      </div>
                      <span>{item.label}</span>
                      {location.pathname === item.path && (
                        <motion.div
                          layoutId="mobileActiveIndicator"
                          className="ml-auto h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        />
                      )}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Mobile Sidebar Footer */}
              <div className="p-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={handleLogoutRequest}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </motion.aside>
        )}

        {/* Desktop Sidebar */}
        <motion.aside
          initial={false}
          animate={{
            width: sidebarOpen ? "20rem" : "5rem",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 z-30 h-full bg-card/95 backdrop-blur-xl border-r border-border hidden lg:block shadow-xl"
        >
          <div className="flex flex-col h-full">
            {/* Desktop Sidebar Header */}
            <div className="p-6 border-b border-border">
              <Link to="/" className="flex items-center gap-3">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                </div>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap"
                    >
                      Criscom Group
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 * index }}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.path}
                          className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative ${location.pathname === item.path
                              ? "bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                        >
                          <div className={`transition-colors flex-shrink-0 ${location.pathname === item.path ? "text-indigo-600 dark:text-indigo-400" : "group-hover:text-foreground"
                            }`}>
                            {item.icon}
                          </div>
                          <AnimatePresence>
                            {sidebarOpen && (
                              <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="whitespace-nowrap"
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {location.pathname === item.path && (
                            <motion.div
                              layoutId="desktopActiveIndicator"
                              className="absolute right-2 h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            />
                          )}
                        </Link>
                      </TooltipTrigger>
                      {!sidebarOpen && (
                        <TooltipContent side="right" className="ml-2">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              ))}
            </nav>

            {/* Desktop Sidebar Footer */}
            <div className="p-4 border-t border-border">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full text-muted-foreground hover:text-foreground ${sidebarOpen ? "justify-start" : "justify-center"
                        }`}
                      onClick={handleLogoutRequest}
                    >
                      <LogOut className="h-4 w-4" />
                      <AnimatePresence>
                        {sidebarOpen && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="ml-3 whitespace-nowrap"
                          >
                            Cerrar Sesión
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </TooltipTrigger>
                  {!sidebarOpen && (
                    <TooltipContent side="right" className="ml-2">
                      Cerrar Sesión
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        className="flex flex-col min-h-screen"
        animate={{
          paddingLeft: sidebarOpen ? "20rem" : "5rem",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-background/95 backdrop-blur-xl border-b border-border">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Desktop sidebar toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hidden lg:flex"
                  >
                    <motion.div
                      animate={{ rotate: sidebarOpen ? 0 : 180 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </motion.div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {sidebarOpen ? "Colapsar menú" : "Expandir menú"}
                  <div className="text-xs opacity-70 mt-1">Alt + S</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Page title for mobile */}
            <div className="lg:hidden">
              <Link to="/" className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Criscom Group
                </span>
              </Link>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <BusinessHoursIndicator />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowShortcutModal(true)}
                    className="hidden sm:flex"
                  >
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Atajos de teclado
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <ThemeToggle />

            {/* User info */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium text-sm hidden sm:block">{user?.name || "Usuario"}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </motion.div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl font-semibold">
              ¿Cerrar sesión?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground">
              ¿Estás seguro de que deseas cerrar tu sesión? Tendrás que volver a iniciar sesión para acceder a tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center gap-3 mt-6">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default DashboardLayout
