"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { FaBoxOpen, FaLayerGroup, FaComments, FaChartLine, FaExclamationTriangle, FaArrowUp, FaTachometerAlt, FaQuoteRight, FaEnvelope, FaTags, FaArrowRight } from "react-icons/fa"
import { categoryService, productService, claimService, testimonialService } from "@/services/api"

const Dashboard = () => {
  const [stats, setStats] = useState({
    categories: 0,
    products: 0,
    claims: 0,
    testimonials: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)

        const [categories, products, claims, testimonials] = await Promise.all([
          categoryService.getAll(),
          productService.getAll(),
          claimService.getAll(),
          testimonialService.getAll()
        ])

        // Extraer datos considerando API Resources wrapping
        const categoriesData = categories.data.data || categories.data || []
        const productsData = products.data.data || products.data || []
        const claimsData = claims.data.data || claims.data || []
        const testimonialsData = testimonials.data.data || testimonials.data || []

        setStats({
          categories: categoriesData.length,
          products: productsData.length,
          claims: claimsData.length,
          testimonials: testimonialsData.length
        })

        setError(null)
      } catch (err) {
        console.error("Error fetching dashboard stats:", err)
        setError("No se pudieron cargar las estadísticas del dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

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
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-rh-gold flex items-center justify-center text-white shadow-lg"
            >
              <FaTachometerAlt className="text-2xl" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary to-rh-gold bg-clip-text text-transparent">
              Panel de Control
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-base">
            Gestiona tu tienda desde un solo lugar
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-3 shadow-sm"
          >
            <FaExclamationTriangle className="text-xl flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
                  <div className="w-20 h-8 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <StatCard
              icon={<FaLayerGroup />}
              title="Categorías"
              value={stats.categories}
              trend="+12%"
              gradient="from-gray-700 to-gray-900"
              link="/admin/categorias"
              index={0}
            />
            <StatCard
              icon={<FaBoxOpen />}
              title="Productos"
              value={stats.products}
              trend="+23%"
              gradient="from-emerald-500 to-teal-600"
              link="/admin/productos"
              index={1}
            />
            <StatCard
              icon={<FaExclamationTriangle />}
              title="Reclamaciones"
              value={stats.claims}
              trend="-5%"
              gradient="from-amber-500 to-red-600"
              link="/admin/reclamaciones"
              index={2}
            />
            <StatCard
              icon={<FaComments />}
              title="Testimonios"
              value={stats.testimonials}
              trend="+15%"
              gradient="from-rh-teal to-fuchsia-600"
              link="/admin/testimonios"
              index={3}
            />
          </div>
        )}

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Activity Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary">
                <FaChartLine className="text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Actividad Reciente</h2>
            </div>
            <div className="space-y-4">
              <ActivityItem
                title="Nuevo producto añadido"
                description="Se ha añadido un producto al catálogo"
                time="Hace 2 horas"
                icon={<FaBoxOpen />}
                color="from-green-500 to-emerald-600"
                index={0}
              />
              <ActivityItem
                title="Nueva reclamación"
                description="Un cliente ha enviado una nueva reclamación"
                time="Hace 5 horas"
                icon={<FaExclamationTriangle />}
                color="from-amber-500 to-orange-600"
                index={1}
              />
              <ActivityItem
                title="Nuevo testimonio"
                description="Un cliente ha dejado un nuevo testimonio"
                time="Hace 1 día"
                icon={<FaComments />}
                color="from-rh-teal to-rh-gold"
                index={2}
              />
            </div>
          </motion.div>

          {/* Quick Actions Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rh-teal/20 to-rh-teal/10 flex items-center justify-center text-rh-gold">
                <FaArrowRight className="text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Acciones Rápidas</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickActionButton
                title="Añadir Producto"
                icon={<FaBoxOpen />}
                link="/admin/productos"
                gradient="from-emerald-500 to-teal-600"
                index={0}
              />
              <QuickActionButton
                title="Ver Reclamaciones"
                icon={<FaExclamationTriangle />}
                link="/admin/reclamaciones"
                gradient="from-amber-500 to-orange-600"
                index={1}
              />
              <QuickActionButton
                title="Añadir Categoría"
                icon={<FaLayerGroup />}
                link="/admin/categorias"
                gradient="from-gray-700 to-gray-900"
                index={2}
              />
              <QuickActionButton
                title="Ver Testimonios"
                icon={<FaQuoteRight />}
                link="/admin/testimonios"
                gradient="from-rh-teal to-rh-gold"
                index={3}
              />
              <QuickActionButton
                title="Ver Contactos"
                icon={<FaEnvelope />}
                link="/admin/contactos"
                gradient="from-purple-500 to-rh-gold"
                index={4}
              />
              <QuickActionButton
                title="Gestionar Banners"
                icon={<FaTags />}
                link="/admin/banners"
                gradient="from-primary to-fv-gold"
                index={5}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  trend: string;
  gradient: string;
  link: string;
  index: number;
}

const StatCard = ({ icon, title, value, trend, gradient, link, index }: StatCardProps) => {
  const isPositive = trend.startsWith('+')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
    >
      {/* Animated background glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

      <Link href={link} className="relative z-10 block">
        <div className="flex items-center justify-between mb-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 6 }}
            className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
          >
            <span className="text-2xl text-white">
              {icon}
            </span>
          </motion.div>
          <div className="flex items-center gap-1 text-sm font-semibold">
            <FaArrowUp className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500 rotate-180'}`} />
            <span className={isPositive ? 'text-green-500' : 'text-red-500'}>{trend}</span>
          </div>
        </div>

        <div>
          <h3 className="text-base text-gray-600 dark:text-gray-400 font-medium mb-2">{title}</h3>
          <p className="text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {value}
          </p>
        </div>

        <div className="mt-4 flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Ver detalles
          <FaArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </motion.div>
  )
}

interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  color: string;
  index: number;
}

const ActivityItem = ({ title, description, time, icon, color, index }: ActivityItemProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.5 + index * 0.1 }}
    className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
  >
    <motion.div
      whileHover={{ scale: 1.1, rotate: 6 }}
      className={`w-10 h-10 flex-shrink-0 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-md`}
    >
      {icon}
    </motion.div>
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors duration-300">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{description}</p>
      <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 inline-block">{time}</span>
    </div>
  </motion.div>
)

interface QuickActionButtonProps {
  title: string;
  icon: React.ReactNode;
  link: string;
  gradient: string;
  index: number;
}

const QuickActionButton = ({ title, icon, link, gradient, index }: QuickActionButtonProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.6 + index * 0.05 }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Link
      href={link}
      className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg"
    >
      <motion.div
        whileHover={{ rotate: 6 }}
        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md`}
      >
        {icon}
      </motion.div>
      <span className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors duration-300 flex-1">{title}</span>
      <FaArrowRight className="text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
    </Link>
  </motion.div>
)

export default Dashboard
