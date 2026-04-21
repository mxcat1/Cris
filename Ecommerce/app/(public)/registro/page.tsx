"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { FaUser, FaLock, FaEnvelope, FaPhone, FaUserPlus, FaShoppingBag, FaCheck } from "react-icons/fa"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "react-toastify"
import { ecommerceAuthService } from "@/services/ecommerceApi"

const RegisterSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .required("El nombre es requerido"),
  email: Yup.string()
    .email("Email inválido")
    .required("El email es requerido"),
  password: Yup.string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .required("La contraseña es requerida"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
    .required("Confirma tu contraseña"),
  celular: Yup.string()
    .matches(/^\d*$/, "Solo se permiten números")
    .min(9, "El teléfono debe tener al menos 9 dígitos")
    .optional(),
})

const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delayChildren: 0.2,
      staggerChildren: 0.08,
      type: "spring",
      stiffness: 100,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 },
  },
}

const floatingVariants = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

const successVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
}

const Register = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"
  const [registerSuccess, setRegisterSuccess] = useState(false)

  const handleSubmit = async (
    values: { name: string; email: string; password: string; celular?: string },
    { setSubmitting, setFieldError }: { setSubmitting: (isSubmitting: boolean) => void; setFieldError: (field: string, message: string) => void }
  ) => {
    try {
      const response = await ecommerceAuthService.register({
        name: values.name,
        email: values.email,
        password: values.password,
        celular: values.celular || undefined,
      })

      if (response.success) {
        setRegisterSuccess(true)
        toast.success("¡Cuenta creada exitosamente!")

        // Esperar un momento para mostrar la animación de éxito
        setTimeout(() => {
          router.push(redirect)
        }, 2000)
      } else {
        if (response.errors) {
          response.errors.forEach((error) => {
            if (error.param) {
              setFieldError(error.param, error.msg)
            }
          })
        }
        toast.error(response.msg || "Error al crear la cuenta")
      }
    } catch (error) {
      console.error("Error de registro:", error)
      toast.error("Error al conectar con el servidor")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-primary/10 via-white to-fv-gold/10 dark:from-gray-950 dark:via-gray-900 dark:to-black relative overflow-hidden py-8">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <motion.div
          variants={floatingVariants}
          initial="initial"
          animate="animate"
          className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl"
        />
        <motion.div
          variants={floatingVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 1 }}
          className="absolute bottom-20 right-10 w-72 h-72 bg-fv-gold/20 rounded-full filter blur-3xl"
        />
        <motion.div
          variants={floatingVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl"
        />
      </div>

      {/* Contenedor principal */}
      <div className="relative z-10 flex justify-center items-center min-h-[calc(100vh-200px)] p-4 md:p-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Card de Registro */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Header con gradiente */}
            <div className="relative bg-gradient-to-r from-primary to-fv-gold p-8 text-center">
              <motion.div
                variants={itemVariants}
                className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
              />

              <motion.div variants={itemVariants} className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-xl">
                  <FaUserPlus className="text-white text-4xl" />
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                  Crear Cuenta
                </h1>

                <p className="text-white/90 text-sm md:text-base font-medium">
                  Únete a nuestra comunidad
                </p>
              </motion.div>

              {/* Decorative wave */}
              <div className="absolute bottom-0 left-0 right-0">
                <svg
                  viewBox="0 0 1440 120"
                  className="w-full h-auto"
                  preserveAspectRatio="none"
                >
                  <path
                    fill="currentColor"
                    fillOpacity="0.3"
                    d="M0,64L80,58.7C160,53,320,43,480,48C640,53,800,75,960,80C1120,85,1280,75,1360,69.3L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
                    className="text-white dark:text-gray-900"
                  />
                </svg>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                {registerSuccess ? (
                  <motion.div
                    key="success"
                    variants={successVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-center py-8"
                  >
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center shadow-xl">
                      <FaCheck className="text-white text-5xl" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      ¡Bienvenido!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Tu cuenta ha sido creada exitosamente
                    </p>
                    <p className="text-sm text-primary mt-2">
                      Redirigiendo...
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="form">
                    <motion.div variants={itemVariants} className="mb-6 text-center">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Regístrate gratis
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Completa tus datos para crear tu cuenta
                      </p>
                    </motion.div>

                    <Formik
                      initialValues={{
                        name: "",
                        email: "",
                        password: "",
                        confirmPassword: "",
                        celular: "",
                      }}
                      validationSchema={RegisterSchema}
                      onSubmit={handleSubmit}
                    >
                      {({ isSubmitting, errors, touched }) => (
                        <Form className="space-y-5">
                          {/* Nombre */}
                          <motion.div variants={itemVariants}>
                            <label
                              htmlFor="name"
                              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                            >
                              Nombre completo
                            </label>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <FaUser className="text-lg" />
                              </div>
                              <Field
                                type="text"
                                name="name"
                                id="name"
                                placeholder="Tu nombre"
                                className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                                  errors.name && touched.name
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 dark:border-gray-700 focus:ring-primary"
                                } bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400`}
                              />
                            </div>
                            <ErrorMessage
                              name="name"
                              component="div"
                              className="text-red-500 text-xs mt-1.5 ml-1"
                            />
                          </motion.div>

                          {/* Email */}
                          <motion.div variants={itemVariants}>
                            <label
                              htmlFor="email"
                              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                            >
                              Correo electrónico
                            </label>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <FaEnvelope className="text-lg" />
                              </div>
                              <Field
                                type="email"
                                name="email"
                                id="email"
                                placeholder="tu@email.com"
                                className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                                  errors.email && touched.email
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 dark:border-gray-700 focus:ring-primary"
                                } bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400`}
                              />
                            </div>
                            <ErrorMessage
                              name="email"
                              component="div"
                              className="text-red-500 text-xs mt-1.5 ml-1"
                            />
                          </motion.div>

                          {/* Teléfono (opcional) */}
                          <motion.div variants={itemVariants}>
                            <label
                              htmlFor="celular"
                              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                            >
                              Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
                            </label>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <FaPhone className="text-lg" />
                              </div>
                              <Field
                                type="text"
                                name="celular"
                                id="celular"
                                placeholder="987654321"
                                className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                                  errors.celular && touched.celular
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 dark:border-gray-700 focus:ring-primary"
                                } bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400`}
                              />
                            </div>
                            <ErrorMessage
                              name="celular"
                              component="div"
                              className="text-red-500 text-xs mt-1.5 ml-1"
                            />
                          </motion.div>

                          {/* Contraseña */}
                          <motion.div variants={itemVariants}>
                            <label
                              htmlFor="password"
                              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                            >
                              Contraseña
                            </label>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <FaLock className="text-lg" />
                              </div>
                              <Field
                                type="password"
                                name="password"
                                id="password"
                                placeholder="Mínimo 6 caracteres"
                                className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                                  errors.password && touched.password
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 dark:border-gray-700 focus:ring-primary"
                                } bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400`}
                              />
                            </div>
                            <ErrorMessage
                              name="password"
                              component="div"
                              className="text-red-500 text-xs mt-1.5 ml-1"
                            />
                          </motion.div>

                          {/* Confirmar Contraseña */}
                          <motion.div variants={itemVariants}>
                            <label
                              htmlFor="confirmPassword"
                              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                            >
                              Confirmar contraseña
                            </label>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <FaLock className="text-lg" />
                              </div>
                              <Field
                                type="password"
                                name="confirmPassword"
                                id="confirmPassword"
                                placeholder="Repite tu contraseña"
                                className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                                  errors.confirmPassword && touched.confirmPassword
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 dark:border-gray-700 focus:ring-primary"
                                } bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400`}
                              />
                            </div>
                            <ErrorMessage
                              name="confirmPassword"
                              component="div"
                              className="text-red-500 text-xs mt-1.5 ml-1"
                            />
                          </motion.div>

                          {/* Submit Button */}
                          <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 px-6 bg-gradient-to-r from-primary to-fv-gold text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                          >
                            {isSubmitting ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creando cuenta...
                              </>
                            ) : (
                              <>
                                <FaUserPlus className="text-xl transition-transform group-hover:scale-110" />
                                Crear mi cuenta
                              </>
                            )}
                          </motion.button>
                        </Form>
                      )}
                    </Formik>

                    {/* Ya tengo cuenta */}
                    <motion.div
                      variants={itemVariants}
                      className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 text-center"
                    >
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        ¿Ya tienes una cuenta?{" "}
                        <Link
                          href="/iniciar-sesion"
                          className="text-primary font-semibold hover:underline"
                        >
                          Inicia sesión
                        </Link>
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 grid grid-cols-2 gap-4"
          >
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200/50 dark:border-gray-700/50">
              <FaShoppingBag className="text-primary text-2xl mx-auto mb-2" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Guarda tu historial de compras
              </p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200/50 dark:border-gray-700/50">
              <FaCheck className="text-green-500 text-2xl mx-auto mb-2" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Ofertas exclusivas
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Cargando...
        </div>
      }
    >
      <Register />
    </Suspense>
  )
}
