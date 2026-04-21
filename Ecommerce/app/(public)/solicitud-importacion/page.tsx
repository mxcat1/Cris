"use client"

// ecommerce-integration MVP hot-patch B:
//   - Form público sin auth (antes redirigía a /iniciar-sesion).
//   - Agrega campos del solicitante: nombre / email / teléfono.
//   - Submit con plain JSON a /api/ecommerce/solicitudes-importacion.
//   - Tras crear, muestra el código de seguimiento + link a /seguimiento-solicitud/:codigo.
//   - Upload de imágenes NO soportado en v1 (pendiente ciclo ecommerce-features).

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { motion, AnimatePresence } from "framer-motion"
import {
  FaLaptop,
  FaMemory,
  FaKeyboard,
  FaDesktop,
  FaHdd,
  FaNetworkWired,
  FaBox,
  FaCheckCircle,
  FaPaperPlane,
  FaGlobe,
  FaExclamationTriangle,
  FaDollarSign,
  FaInfoCircle,
  FaSearch,
  FaClipboardList,
  FaUser,
  FaEnvelope,
  FaPhone,
} from "react-icons/fa"
import { toast } from "react-toastify"
import { ecommerceImportService, type CrearSolicitudPayload } from "@/services/ecommerceApi"

// Esquema de validación
const ImportRequestSchema = Yup.object().shape({
  // Datos del solicitante (MVP sin auth)
  nombre_solicitante: Yup.string()
    .min(3, "Nombre demasiado corto")
    .max(120, "Nombre demasiado largo")
    .required("Tu nombre es obligatorio"),
  email_solicitante: Yup.string()
    .email("Email inválido")
    .required("Tu email es obligatorio"),
  telefono_solicitante: Yup.string().max(40, "Teléfono demasiado largo"),
  // Producto
  nombre_producto: Yup.string()
    .min(3, "Nombre demasiado corto")
    .max(255, "Nombre demasiado largo")
    .required("El nombre del producto es obligatorio"),
  tipo_producto: Yup.string()
    .required("Selecciona el tipo de producto")
    .oneOf(
      ["laptop", "componente", "periferico", "monitor", "almacenamiento", "red", "otro"],
      "Tipo inválido"
    ),
  marca: Yup.string().max(100, "Marca demasiado larga"),
  modelo: Yup.string().max(100, "Modelo demasiado largo"),
  especificaciones: Yup.string().max(2000, "Especificaciones demasiado largas"),
  pais_origen: Yup.string().max(100, "País demasiado largo"),
  cantidad: Yup.number()
    .min(1, "Mínimo 1 unidad")
    .max(100, "Máximo 100 unidades")
    .required("La cantidad es obligatoria"),
  presupuesto_min: Yup.number().min(0, "El presupuesto no puede ser negativo").nullable(),
  presupuesto_max: Yup.number()
    .min(0, "El presupuesto no puede ser negativo")
    .nullable()
    .test("mayor-que-min", "Debe ser mayor al presupuesto mínimo", function (value) {
      const { presupuesto_min } = this.parent
      if (value && presupuesto_min && value < presupuesto_min) return false
      return true
    }),
  nivel_urgencia: Yup.string()
    .required("Selecciona el nivel de urgencia")
    .oneOf(["baja", "media", "alta", "urgente"], "Nivel de urgencia inválido"),
  mensaje: Yup.string().max(2000, "Mensaje demasiado largo"),
})

const tiposProducto = [
  { value: "laptop", label: "Laptop / Notebook", icon: FaLaptop },
  { value: "componente", label: "Componente (RAM, CPU, GPU...)", icon: FaMemory },
  { value: "periferico", label: "Periférico (Teclado, Mouse...)", icon: FaKeyboard },
  { value: "monitor", label: "Monitor / Pantalla", icon: FaDesktop },
  { value: "almacenamiento", label: "Almacenamiento (SSD, HDD...)", icon: FaHdd },
  { value: "red", label: "Equipos de Red", icon: FaNetworkWired },
  { value: "otro", label: "Otro", icon: FaBox },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const SolicitudImportacion = () => {
  const router = useRouter()
  const [mode, setMode] = useState<"nueva" | "consultar">("nueva")
  const [codigoConsulta, setCodigoConsulta] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [codigoSeguimiento, setCodigoSeguimiento] = useState("")

  const handleConsultar = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = codigoConsulta.trim().toUpperCase()
    if (!trimmed) {
      toast.error("Ingresá el código de seguimiento.")
      return
    }
    router.push(`/seguimiento-solicitud/${encodeURIComponent(trimmed)}`)
  }

  const handleSubmit = async (
    values: Record<string, unknown>,
    { resetForm }: { resetForm: () => void }
  ) => {
    setEnviando(true)
    try {
      // Convertir el formulario a payload JSON plano para /api/ecommerce/solicitudes-importacion.
      // Se omiten campos vacíos para que el backend use sus defaults.
      const payload: CrearSolicitudPayload = {
        nombre_solicitante: String(values.nombre_solicitante || ""),
        email_solicitante: String(values.email_solicitante || ""),
        telefono_solicitante: values.telefono_solicitante
          ? String(values.telefono_solicitante)
          : undefined,
        nombre_producto: String(values.nombre_producto || ""),
        tipo_producto: values.tipo_producto as CrearSolicitudPayload["tipo_producto"],
        marca: values.marca ? String(values.marca) : undefined,
        modelo: values.modelo ? String(values.modelo) : undefined,
        especificaciones: values.especificaciones ? String(values.especificaciones) : undefined,
        pais_origen: values.pais_origen ? String(values.pais_origen) : undefined,
        cantidad: Number(values.cantidad || 1),
        presupuesto_min:
          values.presupuesto_min !== "" && values.presupuesto_min !== undefined
            ? Number(values.presupuesto_min)
            : undefined,
        presupuesto_max:
          values.presupuesto_max !== "" && values.presupuesto_max !== undefined
            ? Number(values.presupuesto_max)
            : undefined,
        nivel_urgencia: (values.nivel_urgencia || "media") as CrearSolicitudPayload["nivel_urgencia"],
        mensaje: values.mensaje ? String(values.mensaje) : undefined,
      }

      const response = await ecommerceImportService.crear(payload)

      if (response.success) {
        toast.success("¡Solicitud enviada exitosamente!")
        setSubmitted(true)
        setCodigoSeguimiento(response.data?.codigo_seguimiento || "")
        resetForm()
      } else {
        toast.error(response.msg || "Error al enviar la solicitud")
      }
    } catch (error: unknown) {
      console.error("Error al enviar el formulario:", {
        message: error instanceof Error ? error.message : String(error),
      })
      toast.error("Hubo un problema al enviar tu solicitud. Por favor, intenta nuevamente.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 dark:from-gray-950 dark:via-gray-900 dark:to-black relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl" />
      </div>

      <motion.div
        className="max-w-4xl mx-auto relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-primary to-secondary mb-6 shadow-xl">
            <FaLaptop className="text-white text-4xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            Importa con Nosotros
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            ¿No encuentras el producto que buscas? Nosotros lo importamos para ti desde cualquier parte del mundo.
            Completa el formulario y te enviaremos un código para dar seguimiento a tu pedido.
          </p>
        </motion.div>

        {/* Toggle: nueva solicitud / consultar estado */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <div className="inline-flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-md border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setMode("nueva")}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                mode === "nueva"
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-primary"
              }`}
            >
              <FaPaperPlane className="inline mr-2" />
              Nueva solicitud
            </button>
            <button
              type="button"
              onClick={() => setMode("consultar")}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                mode === "consultar"
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-primary"
              }`}
            >
              <FaSearch className="inline mr-2" />
              Consultar estado
            </button>
          </div>
        </motion.div>

        {/* Modo: Consultar por código */}
        {mode === "consultar" && (
          <motion.div
            variants={itemVariants}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-xl border border-gray-200 dark:border-gray-800 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-3">
              <FaClipboardList className="text-primary" />
              Consultar estado de tu solicitud
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Ingresá el código que recibiste al enviar tu solicitud
              (formato <span className="font-mono text-sm">SOL-AAAAMMDD-XXXXXX</span>).
            </p>
            <form
              onSubmit={handleConsultar}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                value={codigoConsulta}
                onChange={(e) => setCodigoConsulta(e.target.value)}
                placeholder="SOL-20260421-ABC123"
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono"
                autoFocus
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-lg hover:shadow-2xl transition-all flex items-center justify-center gap-2"
              >
                <FaSearch /> Ver estado
              </button>
            </form>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Si aún no tenés un código,{" "}
              <button
                type="button"
                onClick={() => setMode("nueva")}
                className="text-primary hover:underline font-semibold"
              >
                enviá una nueva solicitud
              </button>
              .
            </p>
          </motion.div>
        )}

        {/* Success Message */}
        <AnimatePresence>
          {submitted && codigoSeguimiento && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-2xl p-8 mb-8 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                <FaCheckCircle className="text-green-500 text-5xl" />
              </div>
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                ¡Solicitud enviada exitosamente!
              </h3>
              <p className="text-green-600 dark:text-green-300 mb-4">
                Hemos recibido tu solicitud. Te contactaremos pronto con una cotización.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 inline-block mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Guardá tu código de seguimiento:
                </p>
                <p className="text-2xl font-mono font-bold text-primary">{codigoSeguimiento}</p>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setCodigoSeguimiento("")
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Nueva solicitud
                </button>
                <Link
                  href={`/seguimiento-solicitud/${codigoSeguimiento}`}
                  className="px-6 py-2 bg-white dark:bg-gray-800 border border-green-500 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                >
                  Ver estado de mi solicitud
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form — solo en modo nueva y mientras no se haya enviado */}
        {mode === "nueva" && !submitted && (
          <motion.div
            variants={itemVariants}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-xl border border-gray-200 dark:border-gray-800"
          >
            <Formik
              initialValues={{
                nombre_solicitante: "",
                email_solicitante: "",
                telefono_solicitante: "",
                nombre_producto: "",
                tipo_producto: "",
                marca: "",
                modelo: "",
                especificaciones: "",
                pais_origen: "",
                cantidad: 1,
                presupuesto_min: "",
                presupuesto_max: "",
                nivel_urgencia: "media",
                mensaje: "",
              }}
              validationSchema={ImportRequestSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, values, setFieldValue, errors, touched }) => (
                <Form className="space-y-8">
                  {/* Datos del solicitante */}
                  <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-6 border border-primary/20">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <FaUser className="text-primary" />
                      Tus datos de contacto
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          Nombre completo *
                        </label>
                        <Field
                          type="text"
                          name="nombre_solicitante"
                          placeholder="María Pérez"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                        <ErrorMessage name="nombre_solicitante" component="p" className="text-red-500 text-sm mt-1" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          <FaEnvelope className="inline mr-2" />
                          Email *
                        </label>
                        <Field
                          type="email"
                          name="email_solicitante"
                          placeholder="tu@email.com"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                        <ErrorMessage name="email_solicitante" component="p" className="text-red-500 text-sm mt-1" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          <FaPhone className="inline mr-2" />
                          Teléfono / WhatsApp
                        </label>
                        <Field
                          type="tel"
                          name="telefono_solicitante"
                          placeholder="+51 999 123 456"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tipo de producto */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      Tipo de producto *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {tiposProducto.map((tipo) => {
                        const Icon = tipo.icon
                        const isSelected = values.tipo_producto === tipo.value
                        return (
                          <button
                            key={tipo.value}
                            type="button"
                            onClick={() => setFieldValue("tipo_producto", tipo.value)}
                            className={`p-4 rounded-xl border-2 transition-all text-center ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                            }`}
                          >
                            <Icon className={`text-2xl mx-auto mb-2 ${isSelected ? "text-primary" : "text-gray-400"}`} />
                            <span className="text-xs font-semibold">{tipo.label}</span>
                          </button>
                        )
                      })}
                    </div>
                    {errors.tipo_producto && touched.tipo_producto && (
                      <p className="text-red-500 text-sm mt-2">{errors.tipo_producto}</p>
                    )}
                  </div>

                  {/* Nombre del producto */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Nombre del producto *
                    </label>
                    <Field
                      type="text"
                      name="nombre_producto"
                      placeholder="Ej: NVIDIA GeForce RTX 4090, MacBook Pro M3..."
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                    <ErrorMessage name="nombre_producto" component="p" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Marca y Modelo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Marca
                      </label>
                      <Field
                        type="text"
                        name="marca"
                        placeholder="Ej: ASUS, Apple, AMD..."
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Modelo
                      </label>
                      <Field
                        type="text"
                        name="modelo"
                        placeholder="Ej: ROG Strix, Pro Max..."
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Especificaciones */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Especificaciones técnicas
                    </label>
                    <Field
                      as="textarea"
                      name="especificaciones"
                      rows={3}
                      placeholder="Describe las características que necesitas: RAM, procesador, almacenamiento, resolución..."
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                    />
                  </div>

                  {/* País de origen y Cantidad */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        <FaGlobe className="inline mr-2" />
                        País de origen preferido
                      </label>
                      <Field
                        type="text"
                        name="pais_origen"
                        placeholder="Ej: Estados Unidos, Japón, China..."
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Cantidad *
                      </label>
                      <Field
                        type="number"
                        name="cantidad"
                        min="1"
                        max="100"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                      <ErrorMessage name="cantidad" component="p" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>

                  {/* Presupuesto */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <FaDollarSign className="inline mr-2" />
                      Rango de presupuesto (USD)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Field
                          type="number"
                          name="presupuesto_min"
                          placeholder="Mínimo"
                          min="0"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <Field
                          type="number"
                          name="presupuesto_max"
                          placeholder="Máximo"
                          min="0"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <ErrorMessage name="presupuesto_max" component="p" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Nivel de urgencia */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      <FaExclamationTriangle className="inline mr-2" />
                      Nivel de urgencia *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: "baja", label: "Baja", color: "green" },
                        { value: "media", label: "Media", color: "yellow" },
                        { value: "alta", label: "Alta", color: "orange" },
                        { value: "urgente", label: "Urgente", color: "red" },
                      ].map((nivel) => {
                        const isSelected = values.nivel_urgencia === nivel.value
                        const colorClasses = {
                          green: isSelected ? "border-green-500 bg-green-50 text-green-700" : "",
                          yellow: isSelected ? "border-yellow-500 bg-yellow-50 text-yellow-700" : "",
                          orange: isSelected ? "border-orange-500 bg-orange-50 text-orange-700" : "",
                          red: isSelected ? "border-red-500 bg-red-50 text-red-700" : "",
                        }
                        return (
                          <button
                            key={nivel.value}
                            type="button"
                            onClick={() => setFieldValue("nivel_urgencia", nivel.value)}
                            className={`py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                              isSelected
                                ? colorClasses[nivel.color as keyof typeof colorClasses]
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                            }`}
                          >
                            {nivel.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Mensaje adicional */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <FaInfoCircle className="inline mr-2" />
                      Información adicional
                    </label>
                    <Field
                      as="textarea"
                      name="mensaje"
                      rows={4}
                      placeholder="¿Algún detalle extra que debamos saber? Links de referencia, variantes específicas..."
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting || enviando}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex justify-center items-center gap-3 py-4 px-6 rounded-xl text-lg font-bold transition-all bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-2xl disabled:opacity-70"
                  >
                    {enviando ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        Enviar solicitud
                      </>
                    )}
                  </motion.button>
                </Form>
              )}
            </Formik>
          </motion.div>
        )}

        {/* Additional info cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 text-center">
            <FaSearch className="text-primary text-3xl mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Búsqueda global</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Buscamos en proveedores de todo el mundo
            </p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 text-center">
            <FaDollarSign className="text-green-500 text-3xl mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Mejores precios</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cotizamos las mejores opciones para ti
            </p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 text-center">
            <FaClipboardList className="text-secondary text-3xl mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Seguimiento por código</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Te damos un código único para que sigas tu solicitud en todo momento
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default SolicitudImportacion
