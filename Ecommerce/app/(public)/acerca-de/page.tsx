"use client"

import { motion } from "framer-motion"
import { 
  CarFront, 
  Gauge, 
  Wrench, 
  MapPin, 
  Mail, 
  Award,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Users,
  Package,
  Star
} from "lucide-react"
import { FaWhatsapp, FaFacebook, FaInstagram } from "react-icons/fa"
import { FaTiktok } from "react-icons/fa6"
const acercaImage = "/historia.png"
import { useParallax } from "@/hooks/useParallax"
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter"
import {
  fadeInUp,
  staggerContainer
} from "@/config/animationVariants"

// Componente para stats counter animado
const AnimatedStat = ({ value, suffix = "", label, icon: Icon }: { value: number; suffix?: string; label: string; icon?: any }) => {
  const count = useAnimatedCounter(value, 2)

  return (
    <motion.div
      variants={fadeInUp}
      className="text-center group relative"
    >
      <div className="relative inline-flex flex-col items-center p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-800/60 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
        {Icon && (
          <div className="mb-4 w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-fv-gold/10 dark:from-primary/20 dark:to-fv-gold/20 flex items-center justify-center">
            <Icon className="w-7 h-7 text-primary dark:text-fv-gold" />
          </div>
        )}
        <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary via-fv-gold to-primary bg-clip-text text-transparent bg-[length:200%_auto] group-hover:animate-shimmer">
          <motion.span>{count}</motion.span>
          {suffix}
        </div>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-2 font-medium">
          {label}
        </p>
      </div>
    </motion.div>
  )
}

const AcercaDe = () => {
  const { ref: parallaxRef, y: parallaxY } = useParallax(100)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Cleaner background with subtle gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-96 bg-gradient-to-t from-fv-gold/5 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Hero Header - Clean and Modern */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 md:mb-24"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary dark:text-fv-gold">Nuestra Historia</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight text-gray-900 dark:text-white">
            Acerca de{" "}
            <span className="bg-gradient-to-r from-primary via-fv-gold to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
              Criscom Group
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Tecnología que impulsa tu futuro
          </p>
        </motion.div>

        {/* Main Content - History and Image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-20 md:mb-28">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-fv-gold flex items-center justify-center shadow-md">
                <CarFront className="text-white w-6 h-6" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                Nuestra Historia
              </h2>
            </div>

            <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              <p className="text-base md:text-lg">
                Criscom Group nació de la pasión por la tecnología y el deseo de ofrecer equipos y componentes de la más alta calidad al mercado peruano.
              </p>
              <p className="text-base md:text-lg">
                Iniciamos como especialistas en computación, hardware e importaciones tecnológicas, enfocados en brindar soluciones que combinan calidad, rendimiento y confiabilidad.
              </p>
              <p className="text-base md:text-lg">
                Cada producto que importamos es seleccionado cuidadosamente, garantizando su autenticidad y rendimiento óptimo para tus necesidades tecnológicas.
              </p>
              <p className="text-base md:text-lg">
                En Criscom Group, no solo vendemos tecnología, transformamos tu experiencia digital con productos de primer nivel, armado de PCs personalizado y asesoría técnica especializada.
              </p>
              <p className="text-base md:text-lg">
                Continuamos expandiéndonos, innovando y trayendo las mejores marcas del mercado internacional para satisfacer las necesidades de profesionales, gamers y empresas más exigentes.
              </p>
            </div>
          </motion.div>

          <motion.div
            ref={parallaxRef}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200/50 dark:border-gray-800/50 h-[400px] lg:h-[500px]"
          >
            <motion.img
              style={{ y: parallaxY }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              src={acercaImage}
              alt="Criscom Group - Tecnología que impulsa tu futuro"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
          </motion.div>
        </div>

        {/* Stats Section - Clean Design */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mb-20 md:mb-28"
        >
          <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 rounded-2xl p-8 md:p-12 border border-gray-200/50 dark:border-gray-800/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              <AnimatedStat value={500} suffix="+" label="Clientes Satisfechos" icon={Users} />
              <AnimatedStat value={2000} suffix="+" label="Equipos Importados" icon={Package} />
              <AnimatedStat value={50} suffix="+" label="Marcas Premium" icon={Star} />
              <AnimatedStat value={100} suffix="%" label="Garantía de Calidad" icon={CheckCircle2} />
            </div>
          </div>
        </motion.section>

        {/* Values Section - Clean Card Design */}
        <motion.section className="mb-20 md:mb-28">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-12 md:mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 mb-6"
            >
              <Award className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary dark:text-fv-gold">Nuestros Valores</span>
            </motion.div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
              Nuestros{" "}
              <span className="bg-gradient-to-r from-primary via-fv-gold to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
                Valores
              </span>
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -4 }}
              className="group bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/10 to-fv-gold/10 dark:from-primary/20 dark:to-fv-gold/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-7 h-7 text-primary dark:text-fv-gold" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Calidad Garantizada
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Importación directa de equipos y componentes originales con certificados de autenticidad y garantía de fábrica.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -4 }}
              className="group bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/10 to-fv-gold/10 dark:from-primary/20 dark:to-fv-gold/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Wrench className="w-7 h-7 text-primary dark:text-fv-gold" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Asesoría Técnica
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Equipo especializado que te guía en la selección de los equipos y componentes ideales para tus necesidades tecnológicas.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -4 }}
              className="group bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/10 to-fv-gold/10 dark:from-primary/20 dark:to-fv-gold/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Gauge className="w-7 h-7 text-primary dark:text-fv-gold" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Alto Rendimiento
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Hardware diseñado para maximizar el rendimiento, la eficiencia y la experiencia de uso.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -4 }}
              className="group bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/10 to-fv-gold/10 dark:from-primary/20 dark:to-fv-gold/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-7 h-7 text-primary dark:text-fv-gold" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Innovación Tecnológica
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Compartimos tu pasión por la tecnología y te ofrecemos productos que transforman tu experiencia digital.
              </p>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Contact Section - Clean Design */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12 md:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 mb-6">
              <Mail className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary dark:text-fv-gold">Contáctanos</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
              <span className="bg-gradient-to-r from-primary via-fv-gold to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
                Contáctanos
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="group bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-lg text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-gradient-to-br from-primary/10 to-fv-gold/10 dark:from-primary/20 dark:to-fv-gold/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-7 h-7 text-primary dark:text-fv-gold" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Ubicación</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lima, Perú</p>
            </motion.div>

            <motion.a
              href={`https://wa.me/51967411110?text=${encodeURIComponent('Hola, me gustaría consultar sobre productos de tecnología y computación.')}`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="group bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg text-center no-underline"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 dark:from-green-500/20 dark:to-green-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FaWhatsapp className="text-green-600 dark:text-green-500 text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">WhatsApp</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">967 411 110</p>
            </motion.a>

            <motion.a
              href={`mailto:contacto@criscomgroup.com.pe?subject=${encodeURIComponent('Consulta Criscom Group')}&body=${encodeURIComponent('Hola, me gustaría obtener información sobre productos de tecnología y computación.')}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -4 }}
              className="group bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-lg text-center no-underline"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-gradient-to-br from-primary/10 to-fv-gold/10 dark:from-primary/20 dark:to-fv-gold/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-7 h-7 text-primary dark:text-fv-gold" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Email</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 break-all">contacto@criscomgroup.com.pe</p>
            </motion.a>
          </div>

          {/* Social Media Links - Clean Design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-center gap-4"
          >
            <motion.a
              href="https://www.facebook.com/criscomgroup"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-xl text-primary dark:text-fv-gold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300"
            >
              <FaFacebook />
            </motion.a>
            <motion.a
              href="https://www.instagram.com/criscomgroup/"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-xl text-primary dark:text-fv-gold hover:bg-gradient-to-br hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 hover:text-white hover:border-transparent transition-all duration-300"
            >
              <FaInstagram />
            </motion.a>
            <motion.a
              href="https://www.tiktok.com/@criscomgroup"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-xl text-primary dark:text-fv-gold hover:bg-black hover:text-white hover:border-black transition-all duration-300"
            >
              <FaTiktok />
            </motion.a>
          </motion.div>
        </motion.section>
      </div>
    </div>
  )
}

export default AcercaDe
