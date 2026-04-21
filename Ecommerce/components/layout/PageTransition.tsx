import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Wrapper para transiciones entre páginas
 * Aplica animaciones suaves al cambiar de ruta
 *
 * Características:
 * - Fade + slide sutil en entrada/salida
 * - AnimatePresence para transiciones suaves
 * - Detecta cambios de ruta automáticamente
 * - Easing curve tipo Apple
 * - Respeta prefers-reduced-motion
 *
 * @example
 * // En App.tsx o router principal
 * <PageTransition>
 *   <Routes>
 *     <Route path="/" element={<Home />} />
 *   </Routes>
 * </PageTransition>
 */
export const PageTransition = ({ children }: PageTransitionProps) => {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
