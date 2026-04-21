"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, Mail, Phone, ShieldCheck, Package, FileText, LogOut, Edit, Calendar, Award, ShoppingBag } from "lucide-react"
import { ecommerceAuthService, User as UserType } from "@/services/ecommerceApi"
import Link from "next/link"

const MiCuentaPage = () => {
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const currentUser = ecommerceAuthService.getCurrentUser()
    if (!currentUser) {
      router.push("/iniciar-sesion")
    } else {
      setUser(currentUser)
      setLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    ecommerceAuthService.logout()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!user) return null

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1:
        return "Administrador"
      case 2:
        return "Vendedor"
      case 3:
        return "Cliente"
      default:
        return "Usuario"
    }
  }

  const getRoleBadgeColor = (roleId: number) => {
    switch (roleId) {
      case 1:
        return "from-red-500 to-pink-500"
      case 2:
        return "from-blue-500 to-cyan-500"
      case 3:
        return "from-green-500 to-emerald-500"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const quickActions = [
    {
      title: "Mis Pedidos",
      description: "Ver y hacer seguimiento a tus pedidos",
      icon: Package,
      href: "/mis-pedidos",
      color: "from-blue-500 to-cyan-500",
      iconColor: "text-blue-600"
    },
    {
      title: "Mis Solicitudes",
      description: "Ver mis solicitudes de importación",
      icon: FileText,
      href: "/mis-solicitudes",
      color: "from-purple-500 to-pink-500",
      iconColor: "text-purple-600"
    },
    {
      title: "Catálogo",
      description: "Explorar productos",
      icon: ShoppingBag,
      href: "/catalogo",
      color: "from-orange-500 to-red-500",
      iconColor: "text-orange-600"
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-fv-gold/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors mb-4"
          >
            ← Volver al inicio
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-2">
            Mi Cuenta
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona tu información personal y preferencias
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-2xl">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-fv-gold/5"></div>

              {/* Avatar section */}
              <div className="relative p-8 text-center">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="inline-block relative mb-4"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-fv-gold rounded-full blur-xl opacity-50"></div>
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary to-fv-gold flex items-center justify-center text-white text-5xl font-black shadow-2xl">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </motion.div>

                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  {user.name}
                </h2>

                {/* Role Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  className="inline-block"
                >
                  <div className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${getRoleBadgeColor(user.id_role)} text-white text-sm font-bold shadow-lg`}>
                    <ShieldCheck className="inline h-4 w-4 mr-1" />
                    {getRoleName(user.id_role)}
                  </div>
                </motion.div>
              </div>

              {/* Info section */}
              <div className="relative px-8 pb-8 space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.email}</p>
                  </div>
                </div>

                {user.celular && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Teléfono</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.celular}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">ID de Usuario</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">#{user.id}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="relative p-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-fv-gold text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <Edit className="h-5 w-5" />
                  Editar Perfil
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl border-2 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  Cerrar Sesión
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Solicitudes", value: "0", icon: FileText, color: "from-blue-500 to-cyan-500" },
                { label: "Pedidos", value: "0", icon: Package, color: "from-purple-500 to-pink-500" },
                { label: "Puntos", value: "0", icon: Award, color: "from-orange-500 to-red-500" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-lg"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -mr-16 -mt-16`}></div>
                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
                Acciones Rápidas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <Link
                      href={action.href}
                      className="block relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-2xl transition-all p-6 group"
                    >
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 rounded-full -mr-16 -mt-16 transition-opacity`}></div>
                      <div className="relative">
                        <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${action.color} shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                          <action.icon className="h-8 w-8 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                          {action.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {action.description}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Activity (placeholder) */}
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
                Actividad Reciente
              </h3>
              <div className="rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-lg p-8">
                <div className="text-center py-12">
                  <div className="inline-flex p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    No hay actividad reciente
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Tus próximas acciones aparecerán aquí
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default MiCuentaPage
