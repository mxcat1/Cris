'use client'

import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import styled from "styled-components"
import ThemeToggle from "@/components/ThemeToggle"
import { FaWhatsapp } from "react-icons/fa"
import { motion } from "framer-motion"
import { PageTransition } from "@/components/layout/PageTransition"

const PublicThemeVars = styled.div`
  /* Mapear variables usadas en el sitio público a las variables globales */
  --bg-card: var(--card);
  --bg-secondary: var(--muted);
  --text-primary: var(--foreground);
  --text-secondary: var(--muted-foreground);
  --border-color: var(--border);
  --accent-primary: var(--primary);
  --accent-secondary: var(--secondary);
  --accent-glow: var(--primary);
  /* Sombra coherente para modo claro/oscuro */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.12);
`

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PublicThemeVars>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header />
        <main className="flex-grow pb-8 w-full">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        <div className="h-auto lg:h-[300px]">
          <Footer />
        </div>
        {/* Botón fijo de cambio de tema visible en todas las páginas públicas */}
        <div className="fixed bottom-4 left-4 z-[1100]">
          <ThemeToggle />
        </div>

        {/* Botón fijo de WhatsApp con animación flotante */}
        <motion.div className="fixed bottom-4 right-4 z-[1100]">
          <motion.a
            href="https://wa.me/51967411110?text=Hola,%20me%20gustaría%20obtener%20más%20información"
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center justify-center w-14 h-14 bg-green-500 rounded-full shadow-lg overflow-hidden"
            aria-label="Contactar por WhatsApp"
            title="Me gustaría obtener más información"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              y: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-50"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            />
            <FaWhatsapp className="text-white text-2xl relative z-10" />
          </motion.a>
        </motion.div>
      </div>
    </PublicThemeVars>
  )
}

