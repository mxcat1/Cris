"use client"

import React, { useEffect, useState, useRef } from "react"
import { FaQuoteLeft, FaStar, FaInstagram, FaFacebook } from "react-icons/fa"
import { FaTiktok as FaTiktokIcon } from "react-icons/fa6"
import { motion } from "framer-motion"
import api from "@/services/api"
import { IMAGE_BASE_URL } from "@/config/constants"
import { fadeInUp } from "@/config/animationVariants"

// Importar las imágenes de testimonios - using public folder paths
const testimonio1 = "/testimonio1.jpeg"

// Helper para construir URLs de imagen evitando dobles "/storage" y barras
const buildImageUrl = (path?: string) => {
  if (!path) return ""
  if (/^https?:\/\//.test(path)) return path
  const clean = path.replace(/^\/+/, "")
  return clean.startsWith("storage/")
    ? `${IMAGE_BASE_URL}/${clean}`
    : `${IMAGE_BASE_URL}/storage/${clean}`
}

// Definimos la interfaz para los testimonios
interface Testimonial {
  id: number;
  name: string;
  message: string;
  image: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Componente para testimonios
const TestimoniosSection = () => {
  const [testimonios, setTestimonios] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestimonios = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/testimonials?active=true`);
        const testimoniosData = response.data.data || response.data || [];
        setTestimonios(testimoniosData);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar testimonios:", err);
        setError("No se pudieron cargar los testimonios");
        setLoading(false);
      }
    };

    fetchTestimonios();
  }, []);

  if (loading) {
    return (
      <>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="col-span-1">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-800 animate-pulse">
              <div className="w-full h-[400px] bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2"></div>
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }
  if (error) return <p className="text-center text-red-500 col-span-full">{error}</p>;
  if (testimonios.length === 0) return <p className="text-center text-gray-500 dark:text-gray-400 col-span-full">No hay testimonios disponibles</p>;

  return (
    <>
      {testimonios.map((testimonio, index) => (
        <TestimonioCard
          key={testimonio.id}
          nombre={testimonio.name}
          cargo="Cliente satisfecho"
          comentario={testimonio.message}
          rating={5}
          imagen={buildImageUrl(testimonio.image)}
          index={index}
        />
      ))}
    </>
  );
};

// Datos de respaldo en caso de que la API no esté disponible
// (datos de testimonios estáticos no utilizados eliminados)

// Sección de Testimonios de Clientes
const TestimoniosClientesSection = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-12 px-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 max-w-[1200px] mx-auto my-8"
    >
      <h2 className="text-center font-black mb-12 text-3xl md:text-4xl bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
        Testimonios de Nuestros Clientes
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center items-stretch">
        <TestimoniosSection />
      </div>
    </motion.section>
  );
};

// (keyframes no utilizados eliminados)

// Functional card component to render testimonials
interface TestimonioCardProps {
  nombre: string;
  cargo: string;
  comentario: string;
  rating: number;
  imagen: string;
  index: number;
}

const TestimonioCard: React.FC<TestimonioCardProps> = ({ nombre, cargo, comentario, rating, imagen, index }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="col-span-1">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ delay: index * 0.1 }}
        whileHover="hover"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 relative flex flex-col h-full shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        {/* Quote Icon Flotante */}
        <motion.div
          className="absolute top-6 right-6 text-primary dark:text-primary opacity-20 text-4xl z-10"
          animate={{
            y: isHovered ? -8 : 0,
            rotate: isHovered ? -10 : 0,
            opacity: isHovered ? 0.4 : 0.2
          }}
          transition={{ duration: 0.3 }}
        >
          <FaQuoteLeft />
        </motion.div>

        {/* Image con Ken Burns Effect */}
        <div className="w-full h-[400px] rounded-xl overflow-hidden mb-6 order-first relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none z-10"></div>
          <motion.img
            animate={{
              scale: isHovered ? 1.15 : 1,
              x: isHovered ? 15 : 0,
              y: isHovered ? -15 : 0
            }}
            transition={{ duration: 8, ease: "linear" }}
            src={imagen}
            alt={`Foto de ${nombre}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = String(testimonio1);
            }}
          />
        </div>

        {/* Name and Role */}
        <motion.div
          className="mb-4 text-center"
          variants={{
            hover: { y: -4, transition: { duration: 0.3 } }
          }}
        >
          <h4 className="m-0 mb-2 text-xl font-bold bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
            {nombre}
          </h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm m-0">{cargo}</p>
        </motion.div>

        {/* Comment */}
        <motion.div
          className="mb-6 text-gray-700 dark:text-gray-300 leading-relaxed relative z-[1] flex-grow"
          variants={{
            hover: { x: 4, transition: { duration: 0.3 } }
          }}
        >
          {comentario}
        </motion.div>

        {/* Rating Stars con Stagger */}
        <motion.div
          className="flex justify-center gap-1"
          variants={{
            hover: {
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          {Array.from({ length: Math.max(0, Math.min(5, rating)) }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              variants={{
                rest: { scale: 1, rotate: 0 },
                hover: {
                  scale: [1, 1.3, 1],
                  rotate: [0, 360, 360],
                  transition: { duration: 0.5 }
                }
              }}
            >
              <FaStar className="text-yellow-400 text-lg" />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

// Social Media Card con efecto magnético
interface SocialCardProps {
  href: string
  Icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  gradient: string
  delay: number
}

const SocialCard: React.FC<SocialCardProps> = ({ href, Icon, title, description, gradient, delay }) => {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * 0.1
    const y = (e.clientY - rect.top - rect.height / 2) * 0.1

    setMousePosition({ x, y })
  }

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 })
  }

  return (
    <motion.a
      ref={cardRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        x: mousePosition.x,
        y: mousePosition.y
      }}
      whileHover="hover"
      className="group bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-10 flex flex-col items-center text-center shadow-xl border border-gray-200 dark:border-gray-800 no-underline relative overflow-hidden"
    >
      {/* Glow effect */}
      <motion.div
        className={`absolute -inset-2 ${gradient} rounded-2xl opacity-0 blur-xl`}
        variants={{
          hover: { opacity: 0.6, transition: { duration: 0.3 } }
        }}
      />

      {/* Card content */}
      <div className="relative z-10 flex flex-col items-center w-full">
        <motion.div
          className={`w-20 h-20 rounded-2xl ${gradient} flex items-center justify-center text-white text-4xl mb-6 shadow-lg`}
          variants={{
            hover: {
              rotate: [0, -10, 10, -10, 10, 0],
              scale: 1.1
            }
          }}
          transition={{ duration: 0.5 }}
        >
          <Icon />
        </motion.div>

        <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-8 flex-grow">{description}</p>

        <motion.span
          className={`inline-flex items-center gap-2 ${gradient} text-white py-3 px-8 rounded-xl font-bold shadow-lg`}
          variants={{
            hover: { x: 8, transition: { duration: 0.3 } }
          }}
        >
          Visitar perfil →
        </motion.span>
      </div>
    </motion.a>
  )
}

// Instagram section implementation
const InstagramFeedSection = () => {
  return (
    <section className="my-16">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 text-3xl md:text-4xl font-black text-gray-900 dark:text-white"
      >
        Síguenos en{" "}
        <span className="bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
          Redes Sociales
        </span>
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1200px] mx-auto">
        <SocialCard
          href="https://www.instagram.com/criscomgroup/"
          Icon={FaInstagram}
          title="Instagram"
          description="Descubre nuestro contenido, novedades y momentos especiales."
          gradient="bg-gradient-to-br from-primary via-purple-500 to-orange-500"
          delay={0.1}
        />

        <SocialCard
          href="https://www.tiktok.com/@criscomgroup"
          Icon={FaTiktokIcon}
          title="TikTok"
          description="Videos, tendencias y demostraciones de nuestros productos."
          gradient="bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-200"
          delay={0.2}
        />

        <SocialCard
          href="https://www.facebook.com/profile.php?id=61572916207328"
          Icon={FaFacebook}
          title="Facebook"
          description="Sigue nuestras publicaciones y eventos especiales."
          gradient="bg-gradient-to-br from-primary to-fv-gold"
          delay={0.3}
        />
      </div>
    </section>
  );
}

// Simple call-to-action section
const CallToAction = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center my-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-12 shadow-xl border border-gray-200 dark:border-gray-800 max-w-[800px] mx-auto"
    >
      <h5 className="font-black mb-4 text-3xl md:text-4xl bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
        ¿Listo para crear momentos especiales?
      </h5>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
        Explora nuestros productos y encuentra el regalo perfecto.
      </p>
      <motion.a
        href="/catalogo"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="inline-flex items-center gap-2 py-4 px-8 rounded-xl text-white no-underline bg-gradient-to-r from-primary to-fv-gold hover:shadow-2xl transition-all font-bold text-lg shadow-lg"
      >
        Ver productos
      </motion.a>
    </motion.div>
  );
}

const Social = () => {
  return (
    <div>
      <div className="min-h-screen bg-gradient-to-br from-primary via-white to-primary dark:from-gray-950 dark:via-gray-900 dark:to-black relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-fv-gold/20 rounded-full filter blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="font-black text-4xl md:text-5xl lg:text-6xl mb-6 bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
              Nuestra Comunidad Social
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-[800px] mx-auto leading-relaxed">
              Conecta con nosotros en redes sociales y descubre cómo nuestros
              productos crean momentos especiales para nuestros clientes.
            </p>
          </motion.div>

          {/* Testimonios de Clientes */}
          <TestimoniosClientesSection />

          {/* Instagram Feed Section */}
          <InstagramFeedSection />

          {/* Call to Action */}
          <CallToAction />
        </div>
      </div>
    </div>
  );
}

export default Social
