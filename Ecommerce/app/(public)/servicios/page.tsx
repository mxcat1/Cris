"use client"

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import {
  Settings,
  Package,
  Zap,
  Gauge,
  Wrench,
  Globe,
  CheckCircle2,
  Sparkles,
  Award,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Star,
  Rocket,
  Users,
  Clock
} from "lucide-react"

// ==================== PARTICLE SYSTEM ====================
const ParticleBackground = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number }>>([])

  useEffect(() => {
    const particleCount = 50
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-[#2563EB]/20 to-[#7C3AED]/20 dark:from-[#60A5FA]/20 dark:to-[#A78BFA]/20"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  )
}

// ==================== FLOATING ORBS ====================
const FloatingOrbs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-[#2563EB]/20 via-[#2563EB]/10 to-transparent dark:from-[#60A5FA]/20 dark:via-[#60A5FA]/10 rounded-full filter blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-tl from-[#7C3AED]/20 via-[#7C3AED]/10 to-transparent dark:from-[#A78BFA]/20 dark:via-[#A78BFA]/10 rounded-full filter blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#2563EB]/5 via-[#7C3AED]/5 to-[#2563EB]/5 dark:from-[#60A5FA]/5 dark:via-[#A78BFA]/5 dark:to-[#60A5FA]/5 rounded-full filter blur-3xl"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  )
}

// ==================== ANIMATION VARIANTS ====================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.7, 
      ease: [0.22, 1, 0.36, 1],
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

const cardHoverVariants = {
  rest: { scale: 1, y: 0, rotateY: 0 },
  hover: { 
    scale: 1.03, 
    y: -12,
    rotateY: 2,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

const iconVariants = {
  rest: { scale: 1, rotate: 0 },
  hover: { 
    scale: 1.15, 
    rotate: [0, -10, 10, -10, 0],
    transition: {
      duration: 0.6,
      ease: "easeInOut"
    }
  }
}

// ==================== MAIN COMPONENT ====================
const Servicios = () => {

  const mainServices = [
    {
      icon: Settings,
      title: "Venta de Equipos y Componentes",
      description: "Laptops, PCs de escritorio, componentes y periféricos de las mejores marcas",
      features: [
        "Laptops empresariales y gaming",
        "PCs de escritorio personalizados",
        "Componentes de última generación",
        "Periféricos y accesorios premium"
      ],
      gradient: "from-[#2563EB] to-[#1E40AF] dark:from-[#60A5FA] dark:to-[#3B82F6]",
      bgColor: "bg-blue-50/50 dark:bg-blue-950/20"
    },
    {
      icon: Package,
      title: "Importación de Tecnología",
      description: "Importación directa de equipos y componentes de alta calidad",
      features: [
        "Equipos certificados y originales",
        "Marcas premium internacionales",
        "Garantía de autenticidad",
        "Envío directo desde origen"
      ],
      gradient: "from-[#7C3AED] to-[#6D28D9] dark:from-[#A78BFA] dark:to-[#8B5CF6]",
      bgColor: "bg-purple-50/50 dark:bg-purple-950/20"
    },
    {
      icon: Zap,
      title: "Armado de PCs",
      description: "Armado personalizado de computadoras según tus necesidades",
      features: [
        "Configuraciones personalizadas",
        "Optimización para gaming",
        "Equipos para trabajo profesional",
        "Asesoría técnica especializada"
      ],
      gradient: "from-[#2563EB] via-[#5B21B6] to-[#7C3AED] dark:from-[#60A5FA] dark:via-[#7C3AED] dark:to-[#A78BFA]",
      bgColor: "bg-indigo-50/50 dark:bg-indigo-950/20"
    }
  ]

  const additionalServices = [
    {
      icon: Globe,
      title: "Importación Personalizada",
      description: "Traemos cualquier equipo o componente del mundo directamente para ti. Contamos con conexiones internacionales con los mejores proveedores.",
      gradient: "from-[#2563EB] to-[#7C3AED] dark:from-[#60A5FA] dark:to-[#A78BFA]"
    },
    {
      icon: TrendingUp,
      title: "Soporte Técnico",
      description: "Equipo de técnicos especializados en hardware y software. Soporte técnico profesional para todos tus equipos.",
      gradient: "from-[#7C3AED] to-[#2563EB] dark:from-[#A78BFA] dark:to-[#60A5FA]"
    },
    {
      icon: Gauge,
      title: "Soluciones Empresariales",
      description: "Equipos y soluciones tecnológicas para empresas. Infraestructura, servidores y sistemas empresariales.",
      gradient: "from-[#2563EB] via-[#5B21B6] to-[#7C3AED] dark:from-[#60A5FA] dark:via-[#7C3AED] dark:to-[#A78BFA]"
    },
    {
      icon: Wrench,
      title: "Mantenimiento y Reparación",
      description: "Servicio técnico profesional. Reparación, mantenimiento y actualización de equipos de computación.",
      gradient: "from-[#7C3AED] to-[#2563EB] dark:from-[#A78BFA] dark:to-[#60A5FA]"
    }
  ]

  const stats = [
    { number: "2000+", label: "Equipos Importados", icon: Rocket },
    { number: "500+", label: "Clientes Satisfechos", icon: Users },
    { number: "50+", label: "Marcas Premium", icon: Star }
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1020] relative overflow-hidden">
      {/* Advanced Background Effects */}
      <FloatingOrbs />
      <ParticleBackground />
      
      {/* Animated Grid Pattern */}
      <motion.div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 dark:opacity-20"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Main Services Grid with Advanced Animations */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
        className="pt-24 pb-20 px-4 relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <motion.h2 
              className="text-5xl md:text-6xl font-black text-[#0F172A] dark:text-[#E5E7EB] mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] dark:from-[#60A5FA] dark:to-[#A78BFA] bg-clip-text text-transparent">
                Servicios Principales
              </span>
            </motion.h2>
            <motion.p 
              className="text-xl text-[#475569] dark:text-[#9CA3AF] max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Todo lo que necesitas para potenciar tu tecnología
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mainServices.map((service, index) => {
              const IconComponent = service.icon
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover="hover"
                  initial="rest"
                  className="group relative"
                >
                  <motion.div
                    variants={cardHoverVariants}
                    className={`relative ${service.bgColor} backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-[#1E1B4B]/50 hover:border-[#2563EB]/50 dark:hover:border-[#60A5FA]/50 transition-all duration-500`}
                  >
                    {/* Animated gradient border - REDUCED OPACITY */}
                    <motion.div 
                      className={`absolute -inset-0.5 bg-gradient-to-br ${service.gradient} rounded-3xl opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500 -z-10`}
                      animate={{
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                    
                    {/* Service Header with gradient */}
                    <div className={`relative bg-gradient-to-br ${service.gradient} p-10 text-white overflow-hidden`}>
                      {/* Animated overlay - REDUCED OPACITY */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
                        animate={{
                          x: ["-100%", "100%"],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut"
                        }}
                      />
                      
                      <div className="relative z-10">
                        <motion.div
                          variants={iconVariants}
                          className="w-20 h-20 mb-6 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl"
                        >
                          <IconComponent className="w-10 h-10 text-white" strokeWidth={2.5} />
                        </motion.div>
                        <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                        <p className="text-white/95 text-sm font-light leading-relaxed">{service.description}</p>
                      </div>
                    </div>

                    {/* Service Features */}
                    <div className="p-8 bg-gradient-to-b from-transparent to-white/50 dark:to-[#0B1020]/50">
                      <ul className="space-y-4">
                        {service.features.map((feature, idx) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            className="flex items-start gap-3 group/item"
                          >
                            <motion.div
                              whileHover={{ scale: 1.2, rotate: 360 }}
                              transition={{ duration: 0.5 }}
                            >
                              <CheckCircle2 className="text-[#2563EB] dark:text-[#60A5FA] mt-1 flex-shrink-0 w-6 h-6" strokeWidth={2.5} />
                            </motion.div>
                            <span className="text-[#0F172A] dark:text-[#E5E7EB] font-medium group-hover/item:text-[#2563EB] dark:group-hover/item:text-[#60A5FA] transition-colors">
                              {feature}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.section>

      {/* Enhanced Stats - MOVED DOWN */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="py-16 px-4 relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <motion.h2 
              className="text-4xl md:text-5xl font-black text-[#0F172A] dark:text-[#E5E7EB] mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] dark:from-[#60A5FA] dark:to-[#A78BFA] bg-clip-text text-transparent">
                Nuestra Experiencia
              </span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {stats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover="hover"
                  initial="rest"
                  className="group relative"
                >
                  <motion.div
                    variants={cardHoverVariants}
                    className="relative bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl rounded-3xl p-10 shadow-2xl border border-gray-200/50 dark:border-[#1E1B4B]/50 hover:border-[#2563EB]/50 dark:hover:border-[#60A5FA]/50 transition-all duration-500 overflow-hidden"
                  >
                    {/* Animated gradient border - REDUCED OPACITY */}
                    <motion.div 
                      className="absolute -inset-0.5 bg-gradient-to-br from-[#2563EB]/20 via-[#7C3AED]/20 to-[#2563EB]/20 dark:from-[#60A5FA]/20 dark:via-[#A78BFA]/20 dark:to-[#60A5FA]/20 rounded-3xl opacity-0 group-hover:opacity-60 blur-xl transition-opacity duration-500 -z-10"
                      animate={{
                        backgroundPosition: ["0% 0%", "100% 100%"],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "linear"
                      }}
                    />
                    
                    {/* Shimmer effect - MORE SUBTLE */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 dark:via-[#60A5FA]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <div className="relative z-10">
                      <motion.div
                        variants={iconVariants}
                        className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] dark:from-[#60A5FA] dark:to-[#A78BFA] flex items-center justify-center shadow-lg"
                      >
                        <IconComponent className="w-8 h-8 text-white" strokeWidth={2.5} />
                      </motion.div>
                      <motion.div 
                        className="text-6xl md:text-7xl font-black bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#2563EB] dark:from-[#60A5FA] dark:via-[#A78BFA] dark:to-[#60A5FA] bg-clip-text text-transparent bg-[length:200%_auto]"
                        animate={{
                          backgroundPosition: ["0% center", "200% center"],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "linear"
                        }}
                      >
                        {stat.number}
                      </motion.div>
                      <div className="text-[#475569] dark:text-[#9CA3AF] mt-4 font-semibold tracking-wide text-lg">
                        {stat.label}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* Additional Services with Enhanced Design */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
        className="py-20 px-4 bg-gradient-to-b from-transparent via-white/50 dark:via-[#111827]/50 to-transparent relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <motion.h2 
              className="text-5xl md:text-6xl font-black text-[#0F172A] dark:text-[#E5E7EB] mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] dark:from-[#60A5FA] dark:to-[#A78BFA] bg-clip-text text-transparent">
                Servicios Especializados
              </span>
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {additionalServices.map((service, index) => {
              const IconComponent = service.icon
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover="hover"
                  initial="rest"
                  className="group relative"
                >
                  <motion.div
                    variants={cardHoverVariants}
                    className="relative bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl rounded-3xl p-10 shadow-2xl border border-gray-200/50 dark:border-[#1E1B4B]/50 hover:border-[#2563EB]/50 dark:hover:border-[#60A5FA]/50 transition-all duration-500 overflow-hidden"
                  >
                    {/* Animated gradient border - REDUCED OPACITY */}
                    <motion.div 
                      className={`absolute -inset-0.5 bg-gradient-to-br ${service.gradient} rounded-3xl opacity-0 group-hover:opacity-50 blur-2xl transition-opacity duration-500 -z-10`}
                      animate={{
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                    
                    {/* Shimmer effect - MORE SUBTLE */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 dark:via-[#60A5FA]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <div className="flex items-start gap-6 relative z-10">
                      <motion.div
                        variants={iconVariants}
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-2xl flex-shrink-0`}
                      >
                        <IconComponent className="w-10 h-10 text-white" strokeWidth={2.5} />
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-[#0F172A] dark:text-[#E5E7EB] mb-3 group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-[#475569] dark:text-[#9CA3AF] leading-relaxed font-light text-lg">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.section>

      {/* Why Choose Us with Advanced Cards */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
        className="py-20 px-4 relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <motion.h2 
              className="text-5xl md:text-6xl font-black text-[#0F172A] dark:text-[#E5E7EB] mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] dark:from-[#60A5FA] dark:to-[#A78BFA] bg-clip-text text-transparent">
                ¿Por qué elegirnos?
              </span>
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: ShieldCheck, title: "Calidad Garantizada", text: "Solo trabajamos con proveedores certificados", gradient: "from-[#2563EB] to-[#7C3AED] dark:from-[#60A5FA] dark:to-[#A78BFA]" },
              { icon: Globe, title: "Alcance Global", text: "Importamos tecnología desde cualquier parte del mundo", gradient: "from-[#7C3AED] to-[#2563EB] dark:from-[#A78BFA] dark:to-[#60A5FA]" },
              { icon: Gauge, title: "Rapidez", text: "Procesos de importación optimizados", gradient: "from-[#2563EB] via-[#5B21B6] to-[#7C3AED] dark:from-[#60A5FA] dark:via-[#7C3AED] dark:to-[#A78BFA]" },
              { icon: Award, title: "Soporte Técnico", text: "Asesoría especializada en cada paso", gradient: "from-[#7C3AED] to-[#2563EB] dark:from-[#A78BFA] dark:to-[#60A5FA]" }
            ].map((item, index) => {
              const IconComponent = item.icon
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover="hover"
                  initial="rest"
                  className="group relative"
                >
                  <motion.div
                    variants={cardHoverVariants}
                    className="relative bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl rounded-3xl p-10 shadow-2xl border border-gray-200/50 dark:border-[#1E1B4B]/50 hover:border-[#2563EB]/50 dark:hover:border-[#60A5FA]/50 text-center transition-all duration-500 overflow-hidden"
                  >
                    {/* Animated gradient border - REDUCED OPACITY */}
                    <motion.div 
                      className={`absolute -inset-0.5 bg-gradient-to-br ${item.gradient} rounded-3xl opacity-0 group-hover:opacity-50 blur-2xl transition-opacity duration-500 -z-10`}
                      animate={{
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                    
                    {/* Shimmer effect - MORE SUBTLE */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 dark:via-[#60A5FA]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <motion.div
                      variants={iconVariants}
                      className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-2xl`}
                    >
                      <IconComponent className="w-10 h-10 text-white" strokeWidth={2.5} />
                    </motion.div>
                    <h3 className="text-xl font-bold text-[#0F172A] dark:text-[#E5E7EB] mb-3 group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#475569] dark:text-[#9CA3AF] font-light leading-relaxed">
                      {item.text}
                    </p>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.section>
    </div>
  )
}

export default Servicios
