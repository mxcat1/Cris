"use client"

import { useState } from "react"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { motion, AnimatePresence } from "framer-motion"
import { FaEnvelope, FaPhone, FaUser, FaTag, FaList, FaCheckCircle, FaPaperPlane } from "react-icons/fa"
import { toast } from "react-toastify"
import api from "@/services/api"
import {
  fadeInUp
} from "@/config/animationVariants"

// Esquema de validación para el formulario
const ContactSchema = Yup.object().shape({
  nombre: Yup.string()
    .min(2, "Nombre demasiado corto")
    .max(50, "Nombre demasiado largo")
    .required("El nombre es obligatorio"),
  telefono: Yup.string()
    .matches(/^[0-9]+$/, "Solo se permiten números")
    .min(9, "El número debe tener al menos 9 dígitos")
    .required("El teléfono es obligatorio"),
  email: Yup.string()
    .email("Email inválido")
    .required("El email es obligatorio"),
  titulo: Yup.string()
    .min(5, "Título demasiado corto")
    .max(100, "Título demasiado largo")
    .required("El título es obligatorio"),
  mensaje: Yup.string()
    .min(10, "Mensaje demasiado corto")
    .max(500, "Mensaje demasiado largo")
    .required("El mensaje es obligatorio"),
  categoria: Yup.string()
    .required("Selecciona una categoría")
})

// Categorías para el formulario
const categorias = [
  "Consulta sobre piezas y repuestos",
  "Asesoría en tunning",
  "Importación de accesorios racing",
  "Cotización de productos",
  "Instalación y soporte técnico",
  "Otros"
]

// Componente FloatingLabelInput
interface FloatingLabelInputProps {
  label: string
  name: string
  type?: string
  icon?: React.ReactNode
  as?: string
  rows?: number
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  name,
  type = "text",
  icon,
  as,
  rows
}) => {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <Field name={name}>
      {({ field, meta }: any) => {
        const hasValue = field.value && field.value.trim().length > 0
        const hasError = meta.touched && meta.error

        return (
          <div className="relative">
            {/* Input Field */}
            {as === "textarea" ? (
              <textarea
                {...field}
                rows={rows}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
                  setIsFocused(false)
                  field.onBlur(e)
                }}
                className={`w-full px-4 py-3 pt-6 border-2 rounded-xl bg-white dark:bg-gray-800 outline-none transition-all ${
                  hasError
                    ? "border-red-500"
                    : isFocused
                    ? "border-primary"
                    : "border-gray-300 dark:border-gray-700"
                } ${icon ? "pl-12" : ""}`}
              />
            ) : (
              <input
                {...field}
                type={type}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
                  setIsFocused(false)
                  field.onBlur(e)
                }}
                className={`w-full px-4 py-3 pt-6 border-2 rounded-xl bg-white dark:bg-gray-800 outline-none transition-all ${
                  hasError
                    ? "border-red-500"
                    : isFocused
                    ? "border-primary"
                    : "border-gray-300 dark:border-gray-700"
                } ${icon ? "pl-12" : ""}`}
              />
            )}

            {/* Icon */}
            {icon && (
              <motion.div
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                animate={{
                  color: isFocused ? "var(--primary)" : undefined
                }}
                transition={{ duration: 0.2 }}
              >
                {icon}
              </motion.div>
            )}

            {/* Floating Label */}
            <motion.label
              className="absolute left-4 text-gray-500 pointer-events-none"
              animate={{
                y: isFocused || hasValue ? -8 : 12,
                x: icon && !(isFocused || hasValue) ? 32 : 0,
                scale: isFocused || hasValue ? 0.85 : 1,
                color: hasError ? "#ef4444" : isFocused ? "var(--primary)" : undefined
              }}
              transition={{ duration: 0.2 }}
              style={{ transformOrigin: "left center" }}
            >
              {label}
            </motion.label>

            {/* Focus Ring */}
            <motion.div
              className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{
                opacity: isFocused ? 1 : 0,
                scale: isFocused ? 1 : 1.05
              }}
              transition={{ duration: 0.2 }}
            />

            {/* Error Message */}
            <ErrorMessage name={name}>
              {(msg) => (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1 ml-1"
                >
                  {msg}
                </motion.p>
              )}
            </ErrorMessage>
          </div>
        )
      }}
    </Field>
  )
}

interface ContactFormValues {
  nombre: string;
  telefono: string;
  email: string;
  titulo: string;
  mensaje: string;
  categoria: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
}

const Contacto = () => {
  const [enviando, setEnviando] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (
    values: ContactFormValues,
    { resetForm }: { resetForm: () => void }
  ) => {
    setEnviando(true)
    try {
      await api.post(`/contacts`, values)
      toast.success("¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.")
      setSubmitted(true)
      resetForm()

      // Reset submitted state after 5 seconds
      setTimeout(() => {
        setSubmitted(false)
      }, 5000)
    } catch (error) {
      console.error("Error al enviar el formulario:", error)
      toast.error("Hubo un problema al enviar tu mensaje. Por favor, intenta nuevamente.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-white to-primary dark:from-gray-950 dark:via-gray-900 dark:to-black relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-fv-gold/20 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl"></div>
      </div>

      <motion.div
        className="max-w-7xl mx-auto relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent mb-6">
            Contáctanos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Estamos aquí para ayudarte. Completa el formulario y nos pondremos en contacto contigo lo antes posible.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información de contacto */}
          <motion.div
            variants={itemVariants}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-10 shadow-xl border border-gray-200 dark:border-gray-800 h-fit"
          >
            <h2 className="text-3xl font-black mb-8 bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
              Información de Contacto
            </h2>

            <div className="space-y-8">
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-start"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-fv-gold flex items-center justify-center shadow-lg">
                  <FaEnvelope className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Email</p>
                  <a
                    href="mailto:contacto@criscomgroup.com.pe"
                    className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-fv-gold transition-colors"
                  >
                    contacto@criscomgroup.com.pe
                  </a>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-start"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-fv-gold flex items-center justify-center shadow-lg">
                  <FaPhone className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Teléfono</p>
                  <a
                    href="tel:+51967411110"
                    className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-fv-gold transition-colors"
                  >
                    +51 967 411 110
                  </a>
                </div>
              </motion.div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Horario de Atención</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Lunes a Viernes</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">9:00 AM - 7:00 PM</span>
                </div>
                <div className="flex justify-between items-center py-2 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Sábados</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">10:00 AM - 5:00 PM</span>
                </div>
                <div className="flex justify-between items-center py-2 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Domingos</span>
                  <span className="text-sm text-red-600 dark:text-red-400 font-semibold">Cerrado</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Formulario de contacto */}
          <motion.div
            variants={itemVariants}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-10 shadow-xl border border-gray-200 dark:border-gray-800"
          >
            <h2 className="text-3xl font-black mb-8 bg-gradient-to-r from-primary to-fv-gold bg-clip-text text-transparent">
              Envíanos un Mensaje
            </h2>

            <Formik
              initialValues={{
                nombre: "",
                telefono: "",
                email: "",
                titulo: "",
                mensaje: "",
                categoria: ""
              }}
              validationSchema={ContactSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, values }) => {
                // Calcular progreso del formulario
                const fields = ['nombre', 'email', 'telefono', 'titulo', 'mensaje', 'categoria'] as const
                const completed = fields.filter(field => {
                  const value = values[field as keyof typeof values]
                  return value && String(value).trim()
                }).length
                const completionPercentage = (completed / fields.length) * 100

                return (
                  <>
                    {/* Progress Bar */}
                    <motion.div
                      className="mb-8"
                      variants={fadeInUp}
                      initial="hidden"
                      animate="visible"
                    >
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Progreso del formulario</span>
                        <span className="text-primary font-bold">{Math.round(completionPercentage)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-fv-gold"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: completionPercentage / 100 }}
                          style={{ transformOrigin: "left" }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>

                    {/* Success Message */}
                    <AnimatePresence>
                      {submitted && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180, opacity: 0 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          exit={{ scale: 0, rotate: 180, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                          }}
                          className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-2xl p-6 mb-6"
                        >
                          <motion.div
                            className="flex items-center gap-4"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <motion.div
                              animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, 0]
                              }}
                              transition={{
                                duration: 0.5,
                                delay: 0.3
                              }}
                            >
                              <FaCheckCircle className="text-green-500 text-4xl" />
                            </motion.div>

                            <div>
                              <motion.h3
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-lg font-bold text-green-700 dark:text-green-400"
                              >
                                ¡Mensaje enviado exitosamente!
                              </motion.h3>
                              <motion.p
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-green-600 dark:text-green-300 text-sm"
                              >
                                Te responderemos a la brevedad
                              </motion.p>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Form className="space-y-6">
                      {/* Nombre */}
                      <FloatingLabelInput
                        label="Nombre completo"
                        name="nombre"
                        type="text"
                        icon={<FaUser />}
                      />

                      {/* Teléfono */}
                      <FloatingLabelInput
                        label="Número de teléfono"
                        name="telefono"
                        type="tel"
                        icon={<FaPhone />}
                      />

                      {/* Email */}
                      <FloatingLabelInput
                        label="Correo electrónico"
                        name="email"
                        type="email"
                        icon={<FaEnvelope />}
                      />

                      {/* Categoría */}
                      <Field name="categoria">
                        {({ field, meta }: any) => {
                          const hasError = meta.touched && meta.error
                          return (
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                                <FaList />
                              </div>
                              <select
                                {...field}
                                className={`w-full pl-12 pr-4 py-3 pt-6 border-2 rounded-xl bg-white dark:bg-gray-800 outline-none transition-all appearance-none ${
                                  hasError ? "border-red-500" : "border-gray-300 dark:border-gray-700"
                                }`}
                              >
                                <option value=""></option>
                                {categorias.map((cat, index) => (
                                  <option key={index} value={cat}>{cat}</option>
                                ))}
                              </select>
                              <motion.label
                                className="absolute left-4 text-gray-500 pointer-events-none"
                                animate={{
                                  y: field.value ? -8 : 12,
                                  x: field.value ? 0 : 32,
                                  scale: field.value ? 0.85 : 1,
                                  color: hasError ? "#ef4444" : undefined
                                }}
                                transition={{ duration: 0.2 }}
                                style={{ transformOrigin: "left center" }}
                              >
                                Categoría
                              </motion.label>
                              <ErrorMessage name="categoria">
                                {(msg) => (
                                  <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 text-sm mt-1 ml-1"
                                  >
                                    {msg}
                                  </motion.p>
                                )}
                              </ErrorMessage>
                            </div>
                          )
                        }}
                      </Field>

                      {/* Título */}
                      <FloatingLabelInput
                        label="Título del mensaje"
                        name="titulo"
                        type="text"
                        icon={<FaTag />}
                      />

                      {/* Mensaje */}
                      <FloatingLabelInput
                        label="Escribe tu mensaje aquí"
                        name="mensaje"
                        as="textarea"
                        rows={5}
                      />

                      {/* Submit Button */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.button
                          type="submit"
                          disabled={isSubmitting || enviando}
                          className="w-full flex justify-center items-center gap-3 py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-gradient-to-r from-primary to-fv-gold hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
                          whileHover={!enviando && !isSubmitting ? {
                            boxShadow: "0 0 30px rgba(201, 169, 97, 0.6)"
                          } : {}}
                        >
                          {/* Animated icon */}
                          <motion.div
                            animate={enviando ? {
                              rotate: 360
                            } : {}}
                            transition={enviando ? {
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear"
                            } : {}}
                          >
                            <FaPaperPlane className={enviando ? "animate-pulse" : ""} />
                          </motion.div>

                          <span>{enviando ? "Enviando..." : "Enviar mensaje"}</span>

                          {/* Shimmer effect */}
                          {!enviando && !isSubmitting && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                              animate={{
                                x: ["-100%", "100%"]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 1
                              }}
                            />
                          )}
                        </motion.button>
                      </motion.div>
                    </Form>
                  </>
                )
              }}
            </Formik>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default Contacto