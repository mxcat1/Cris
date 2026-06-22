"use client"

import { FaInstagram, FaFacebook, FaWhatsapp, FaTiktok, FaYoutube } from "react-icons/fa"
import { MdEmail, MdPhone, MdLocationOn, MdArrowForward } from "react-icons/md"
import { HiShoppingBag, HiUsers, HiShieldCheck, HiTruck } from "react-icons/hi"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, useScroll, useTransform } from "framer-motion"
import { Heart, Send, Sparkles, Star } from "lucide-react"
import { useState } from "react"

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const pathname = usePathname()
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0.7, 1], [0.3, 1])
  const y = useTransform(scrollYProgress, [0.7, 1], [100, 0])

  const socialLinks = [
    {
      name: "Instagram",
      icon: FaInstagram,
      url: "#",
      color: "hover:bg-gradient-to-tr hover:from-purple-600 hover:to-pink-500",
      gradient: "from-purple-600 to-pink-500"
    },
    {
      name: "Facebook",
      icon: FaFacebook,
      url: "#",
      color: "hover:bg-blue-600",
      gradient: "from-blue-600 to-blue-500"
    },
    {
      name: "TikTok",
      icon: FaTiktok,
      url: "#",
      color: "hover:bg-black dark:hover:bg-white",
      gradient: "from-black to-gray-800"
    },
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      url: "https://wa.me/51904589554?text=Hola%2C%20me%20gustar%C3%ADa%20consultar%20sobre%20productos%20de%20tecnolog%C3%ADa",
      color: "hover:bg-green-500",
      gradient: "from-green-500 to-green-600"
    },
    {
      name: "YouTube",
      icon: FaYoutube,
      url: "#",
      color: "hover:bg-red-600",
      gradient: "from-red-600 to-red-500"
    }
  ]

  const quickLinks = [
    { name: "Inicio", to: "/", icon: "🏠" },
    { name: "Catálogo", to: "/catalogo", icon: "📦" },
    { name: "Acerca de", to: "/acerca-de", icon: "ℹ️" },
    { name: "Libro de reclamaciones", to: "/libro-reclamaciones", icon: "📋" },
    { name: "Testimonios", to: "/social", icon: "⭐" }
  ]

  const stats = [
    { icon: HiShoppingBag, value: "10K+", label: "Productos" },
    { icon: HiUsers, value: "50K+", label: "Clientes" },
    { icon: HiShieldCheck, value: "100%", label: "Garantía" },
    { icon: HiTruck, value: "24h", label: "Envío Rápido" }
  ]

  const contactInfo = [
    { icon: MdPhone, text: "+51 904 589 554", href: "tel:+51904589554", label: "Llámanos" },
    { icon: MdEmail, text: "contacto@criscomgroup.com.pe", href: "mailto:contacto@criscomgroup.com.pe", label: "Escríbenos" },
    { icon: MdLocationOn, text: "Arequipa, Perú", href: null, label: "Visítanos" }
  ]

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setTimeout(() => {
        setEmail("")
        setSubscribed(false)
      }, 3000)
    }
  }

  return (
    <footer className="relative bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black border-t border-gray-200 dark:border-gray-800 mt-auto w-full overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Decorative gradients */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/30 to-transparent rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-fv-gold/30 to-transparent rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div style={{ opacity, y }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-fv-gold/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg group-hover:shadow-2xl transition-all">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-fv-gold flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <stat.icon className="text-2xl text-white" />
                  </div>
                  <motion.h4
                    className="text-3xl font-black bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent mb-1"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                  >
                    {stat.value}
                  </motion.h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-fv-gold p-[2px]">
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-fv-gold/5"></div>
              <div className="relative z-10 max-w-2xl mx-auto text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="inline-block mb-4"
                >
                  <Sparkles className="h-12 w-12 text-primary" />
                </motion.div>
                <h3 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
                  ¡Únete a nuestra comunidad!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Recibe ofertas exclusivas, novedades y contenido premium directamente en tu correo 🎁
                </p>

                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <div className="relative flex-1">
                    <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-fv-gold text-white font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                  >
                    {subscribed ? (
                      <>
                        <Star className="h-5 w-5 fill-current" />
                        ¡Suscrito!
                      </>
                    ) : (
                      <>
                        Suscribirse
                        <Send className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Logo & Social Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <Link href="/" className="inline-block mb-6 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-fv-gold blur-xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
                <img
                  src="/logo.png"
                  alt="Criscom Group"
                  className="relative h-16 w-auto object-contain filter drop-shadow-2xl"
                />
              </motion.div>
            </Link>

            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6 text-sm">
              <span className="font-bold bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
                Tecnología que impulsa tu futuro
              </span>
              <br />
              Líder en soluciones tecnológicas innovadoras 💻⚡
            </p>

            {/* Social Media */}
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 500 }}
                  whileHover={{ scale: 1.2, y: -5, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className={`relative group p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all shadow-md hover:shadow-xl overflow-hidden`}
                  aria-label={social.name}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${social.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  <social.icon className="relative text-xl group-hover:text-white transition-colors" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 relative inline-block">
              Enlaces Rápidos
              <motion.span
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-fv-gold rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              ></motion.span>
            </h3>
            <nav className="space-y-3">
              {quickLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Link
                    href={link.to}
                    className={`group flex items-center gap-3 text-sm font-medium transition-all hover:translate-x-2 ${
                      pathname === link.to
                        ? "text-primary font-bold"
                        : "text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                    }`}
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span className="relative">
                      {link.name}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-fv-gold group-hover:w-full transition-all"></span>
                    </span>
                    <MdArrowForward className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 relative inline-block">
              Contacto
              <motion.span
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-fv-gold rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              ></motion.span>
            </h3>
            <div className="space-y-4">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 * index }}
                  whileHover={{ x: 5 }}
                  className="group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-fv-gold/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-fv-gold/20 transition-all group-hover:scale-110">
                      <info.icon className="text-xl text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 font-semibold mb-1">
                        {info.label}
                      </p>
                      {info.href ? (
                        <a
                          href={info.href}
                          className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                        >
                          {info.text}
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {info.text}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 relative inline-block">
              Confianza
              <motion.span
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-fv-gold rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              ></motion.span>
            </h3>
            <div className="space-y-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800"
              >
                <div className="flex items-center gap-3 mb-2">
                  <HiShieldCheck className="text-2xl text-green-600 dark:text-green-400" />
                  <span className="font-bold text-green-900 dark:text-green-100">Pago Seguro</span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">
                  SSL 256-bit Encriptado
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-center gap-3 mb-2">
                  <HiTruck className="text-2xl text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-blue-900 dark:text-blue-100">Envío Express</span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Entrega en 24-48 horas
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Star className="h-6 w-6 text-purple-600 dark:text-purple-400 fill-current" />
                  <span className="font-bold text-purple-900 dark:text-purple-100">Calidad Premium</span>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Garantía de satisfacción
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Divider with animated heart */}
        <div className="relative my-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-200 dark:border-gray-800"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-white dark:bg-gray-900 px-6">
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Heart className="h-6 w-6 text-primary fill-current drop-shadow-lg" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/terminos" className="hover:text-primary transition-colors">
              Términos y Condiciones
            </Link>
            <span className="hidden md:inline">•</span>
            <Link href="/privacidad" className="hover:text-primary transition-colors">
              Política de Privacidad
            </Link>
            <span className="hidden md:inline">•</span>
            <Link href="/libro-reclamaciones" className="hover:text-primary transition-colors">
              Libro de Reclamaciones
            </Link>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            &copy; {currentYear}{" "}
            <span className="font-bold bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
              Criscom Group
            </span>
            . Todos los derechos reservados.
          </p>

          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-xs text-gray-500 dark:text-gray-500 font-medium"
          >
            Hecho con{" "}
            <Heart className="inline h-3 w-3 text-red-500 fill-current" />{" "}
            en Perú 🇵🇪
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Decorative gradient wave at the bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-3" viewBox="0 0 1200 20" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" />
              <stop offset="50%" stopColor="rgb(251, 191, 36)" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0,10 Q300,20 600,10 T1200,10 L1200,20 L0,20 Z"
            fill="url(#gradient)"
            animate={{ d: ["M0,10 Q300,20 600,10 T1200,10 L1200,20 L0,20 Z", "M0,10 Q300,0 600,10 T1200,10 L1200,20 L0,20 Z"] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          />
        </svg>
      </div>
    </footer>
  )
}

export default Footer
