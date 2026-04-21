"use client"

import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { FaSignOutAlt, FaBell, FaUser, FaBars, FaEnvelope, FaExclamationCircle } from "react-icons/fa"
import { useState } from "react"
import ThemeToggle from "../ThemeToggle"
import { useNotifications } from "@/hooks/useNotifications"

interface AdminHeaderProps {
  onMenuClick?: () => void;
  sidebarWidth?: string;
}

const AdminHeader = ({ onMenuClick, sidebarWidth = '0' }: AdminHeaderProps) => {
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const { notifications, unreadCount, loading, markContactAsRead } = useNotifications()

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  const handleOpenNotifications = async () => {
    const newState = !showNotifications
    setShowNotifications(newState)

    // Si se está abriendo el panel, marcar todas las notificaciones como leídas
    if (newState && unreadCount > 0) {
      const unreadNotifications = notifications.filter(n => n.unread)

      for (const notification of unreadNotifications) {
        if (notification.type === 'contact') {
          const contactId = parseInt(notification.id.replace('contact-', ''))
          await markContactAsRead(contactId)
        }
        // Para otros tipos de notificaciones, se pueden agregar aquí
      }
    }
  }

  const handleNotificationClick = async (notification: any) => {
    // Navegar a la página correspondiente
    if (notification.type === 'claim') {
      router.push('/admin/reclamaciones')
    } else if (notification.type === 'contact') {
      router.push('/admin/contactos')
    }

    setShowNotifications(false)
  }

  return (
    <header
      className="fixed top-0 right-0 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-lg z-[999] transition-all duration-300"
      style={{
        left: sidebarWidth
      }}
    >
      <div className="h-full px-3 sm:px-4 md:px-6 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          {/* Mobile Menu Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors shadow-md"
          >
            <FaBars className="text-lg sm:text-xl" />
          </motion.button>

          <h1 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-rh-gold bg-clip-text text-transparent">
            <span className="hidden sm:inline">Panel de Administración</span>
            <span className="sm:hidden">Admin</span>
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          {/* Theme Toggle */}
          <div className="scale-90 sm:scale-100">
            <ThemeToggle />
          </div>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenNotifications}
              className="relative p-2 md:p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors shadow-md"
            >
              <FaBell className="text-lg md:text-xl" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-rh-gold text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowNotifications(false)}
                  />

                  {/* Dropdown */}
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden z-20"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                      <h3 className="font-bold text-gray-900 dark:text-white">Notificaciones</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Tienes {unreadCount} notificaciones sin leer
                      </p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {loading ? (
                        <div className="p-8 flex items-center justify-center">
                          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <FaBell className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No hay notificaciones
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification, index) => (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                              notification.unread ? "bg-primary/5" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {notification.unread && (
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                              )}
                              <div className="flex-shrink-0 mt-0.5">
                                {notification.type === 'claim' ? (
                                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <FaExclamationCircle className="text-red-600 dark:text-red-400 text-sm" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                    <FaEnvelope className="text-primary dark:text-primary text-sm" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <button className="w-full text-sm text-primary font-medium hover:underline">
                        Ver todas las notificaciones
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User Info */}
          <div className="hidden sm:flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 md:py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors">
            <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-primary to-rh-gold flex items-center justify-center text-white shadow-md">
              <FaUser className="text-xs md:text-sm" />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Admin</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Administrador</span>
            </div>
          </div>

          {/* Logout Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
            title="Cerrar Sesión"
          >
            <FaSignOutAlt className="text-lg md:text-xl" />
          </motion.button>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader
