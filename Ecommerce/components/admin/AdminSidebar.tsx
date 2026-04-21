'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { FaHome, FaTags, FaLayerGroup, FaComments, FaTimes, FaTachometerAlt, FaBoxOpen, FaQuoteRight, FaEnvelope, FaBars, FaStar, FaFileImport } from "react-icons/fa"
import { useState, useEffect } from "react"

interface AdminSidebarProps {
  onClose?: () => void;
}

const AdminSidebar = ({ onClose }: AdminSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  // Persistir el estado del sidebar en localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed')
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved))
    }
  }, [])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('admin_sidebar_collapsed', JSON.stringify(newState))
    // Disparar evento para que AdminLayout se entere del cambio
    window.dispatchEvent(new Event('sidebarCollapsedChange'))
  }

  const handleLinkClick = () => {
    if (onClose) {
      onClose()
    }
  }

  const menuSections = [
    {
      title: "Principal",
      links: [
        { to: "/admin", icon: FaTachometerAlt, label: "Dashboard", end: true }
      ]
    },
    {
      title: "Gestión de Productos",
      links: [
        { to: "/admin/productos", icon: FaBoxOpen, label: "Productos" },
        { to: "/admin/categorias", icon: FaLayerGroup, label: "Categorías" }
      ]
    },
    {
      title: "Contenido",
      links: [
        { to: "/admin/reclamaciones", icon: FaComments, label: "Reclamaciones" },
        { to: "/admin/testimonios", icon: FaQuoteRight, label: "Testimonios" },
        { to: "/admin/contactos", icon: FaEnvelope, label: "Contacto" },
        { to: "/admin/solicitudes", icon: FaFileImport, label: "Solicitudes Importación" }
      ]
    },
    {
      title: "Marketing",
      links: [
        { to: "/admin/banners", icon: FaTags, label: "Banners" },
        { to: "/admin/destacados", icon: FaStar, label: "Destacados" }
      ]
    }
  ]

  return (
    <motion.div
      animate={{ width: isCollapsed ? '80px' : '256px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white dark:bg-gray-900 h-full flex flex-col shadow-xl relative overflow-hidden"
    >
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-800">
        {!isCollapsed ? (
          <>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="flex-1 flex items-center justify-center gap-3 p-3 rounded-xl bg-gradient-to-br from-gray-100/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-850/50 transition-all group"
            >
              <img
                src="/logo.png"
                alt="Globival & Detalles"
                className="h-14 w-auto object-contain filter drop-shadow-lg dark:filter dark:brightness-0 dark:invert transition-all duration-300 group-hover:drop-shadow-2xl group-hover:scale-105"
              />
            </motion.div>

            {/* Close button (mobile only) */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="md:hidden p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-md"
            >
              <FaTimes className="text-xl" />
            </motion.button>
          </>
        ) : (
          <motion.div
            className="w-full flex justify-center group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <img
              src="/logo.png"
              alt="G"
              className="h-12 w-12 object-contain filter drop-shadow-lg dark:filter dark:brightness-0 dark:invert transition-all duration-300 group-hover:drop-shadow-2xl"
            />
          </motion.div>
        )}
      </div>

      {/* Toggle Button (desktop only) */}
      <div className="hidden md:flex relative z-10 justify-center p-2 border-b border-gray-200 dark:border-gray-800">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleCollapse}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white transition-all"
          title={isCollapsed ? "Expandir sidebar" : "Contraer sidebar"}
        >
          <FaBars className="text-lg" />
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title}>
            {/* Section Title */}
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: sectionIndex * 0.1 }}
                className="px-6 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {section.title}
              </motion.div>
            )}

            {/* Section Links */}
            {section.links.map((link, linkIndex) => {
              const Icon = link.icon
              return (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (sectionIndex * 0.1) + (linkIndex * 0.05) }}
                  className="relative group/tooltip"
                >
                  <Link
                    href={link.to}
                    onClick={handleLinkClick}
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${isCollapsed ? 'px-2' : 'px-6'} py-3 mx-2 rounded-xl transition-all duration-200 group ${
                      ((link as any).end ? pathname === link.to : pathname.startsWith(link.to))
                        ? "bg-gradient-to-r from-primary to-fv-gold-bright text-white shadow-lg"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:translate-x-1"
                    }`}
                    title={isCollapsed ? link.label : undefined}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`text-xl ${((link as any).end ? pathname === link.to : pathname.startsWith(link.to)) ? "text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-primary"}`}
                    >
                      <Icon />
                    </motion.div>
                    <AnimatePresence>
                      {!isCollapsed && (
                        <>
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="font-medium whitespace-nowrap"
                          >
                            {link.label}
                          </motion.span>
                          {((link as any).end ? pathname === link.to : pathname.startsWith(link.to)) && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="ml-auto w-2 h-2 rounded-full bg-white"
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          )}
                        </>
                      )}
                    </AnimatePresence>
                  </Link>

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                      {link.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                    </div>
                  )}
                </motion.div>
              )
            })}

            {/* Divider */}
            {sectionIndex < menuSections.length - 1 && (
              <div className={`my-4 ${isCollapsed ? 'mx-2' : 'mx-6'} h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent`}></div>
            )}
          </div>
        ))}

        {/* Separator */}
        <div className={`my-4 ${isCollapsed ? 'mx-2' : 'mx-6'} h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent`}></div>

        {/* View Site Link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="relative group/tooltip"
        >
          <Link
            href="/"
            onClick={handleLinkClick}
            className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-6'} py-3 mx-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:translate-x-1 transition-all duration-200 group`}
            title={isCollapsed ? "Ver Sitio" : undefined}
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="text-xl text-gray-500 dark:text-gray-400 group-hover:text-primary"
            >
              <FaHome />
            </motion.div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-medium whitespace-nowrap"
                >
                  Ver Sitio
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
              Ver Sitio
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
            </div>
          )}
        </motion.div>
      </nav>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 p-4 border-t border-gray-200 dark:border-gray-800"
      >
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-850">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-fv-gold-bright flex items-center justify-center text-white font-bold shadow-md">
              A
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Admin</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Panel de Administración</div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-fv-gold-bright flex items-center justify-center text-white font-bold shadow-md">
              A
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default AdminSidebar
