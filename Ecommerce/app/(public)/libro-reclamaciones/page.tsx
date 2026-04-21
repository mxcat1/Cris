"use client"

import { useState } from "react"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { FaBook, FaCheck, FaPaperPlane } from "react-icons/fa"
import { toast } from "react-toastify"
import { ecommerceClaimService } from "@/services/ecommerceApi"
import { motion } from "framer-motion"

// (keyframes no utilizados eliminados)

// Esquema de validación para el formulario
const ReclamacionSchema = Yup.object().shape({
  nombre: Yup.string().required("El nombre es requerido").min(3, "El nombre debe tener al menos 3 caracteres"),
  email: Yup.string().email("Email inválido").required("El email es requerido"),
  telefono: Yup.string()
    .matches(/^\d+$/, "Solo se permiten números")
    .min(9, "El teléfono debe tener al menos 9 dígitos"),
  mensaje: Yup.string().required("El mensaje es requerido").min(10, "El mensaje debe tener al menos 10 caracteres"),
})

const LibroReclamaciones = () => {
  const [submitted, setSubmitted] = useState(false)

  // Función para manejar el envío del formulario
  const handleSubmit = async (values: Record<string, unknown>, { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }) => {
    try {
      await ecommerceClaimService.create({
        nombre: values.nombre as string,
        email: values.email as string,
        telefono: values.telefono as string,
        asunto: values.asunto as string,
        mensaje: values.mensaje as string,
      })
      setSubmitted(true)
      resetForm()
      toast.success("Reclamación enviada correctamente")
    } catch {
      console.error("Error al enviar reclamación")
      toast.error("Error al enviar la reclamación. Por favor, inténtalo de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Fondo con animaciones */}
      <div className="fixed inset-0 -z-10 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,var(--primary),transparent_40%),radial-gradient(circle_at_80%_70%,var(--primary),transparent_40%),radial-gradient(circle_at_40%_80%,var(--primary),transparent_30%)] opacity-60 animate-[floatingOrbs_20s_ease-in-out_infinite_alternate]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_0%,var(--primary)_50%,transparent_100%),linear-gradient(-45deg,transparent_0%,var(--primary)_50%,transparent_100%)] bg-[length:200%_200%] animate-[gradientShift_15s_ease-in-out_infinite] opacity-10"></div>
      </div>

      {/* Contenedor principal */}
      <div className="container mx-auto py-8 relative z-10 bg-background/80 min-h-[calc(100vh-160px)] backdrop-blur-xl">
        {/* Encabezado */}
        <div className="bg-card p-8 mb-8 rounded-md shadow-lg border border-border relative overflow-hidden text-center backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent -z-10"></div>
          <div className="absolute inset-0 -z-10 opacity-0 animate-[pulse_6s_ease-in-out_infinite] bg-radial-gradient"></div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 relative z-10 text-2xl font-bold"
          >
            Libro de <span className="text-primary relative after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-transparent after:via-primary after:to-transparent">Reclamaciones</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground max-w-3xl mx-auto relative z-10"
          >
            Tu opinión es importante para nosotros. Completa el formulario para registrar tu reclamo o sugerencia.
          </motion.p>
        </div>

        {/* Contenido principal - Grid de dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Columna de información */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-card rounded-md p-6 h-fit shadow-md border border-border relative backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent -z-10"></div>
            <div className="absolute inset-0 bg-conic-gradient opacity-0 transition-all duration-600 animate-[rotate_20s_linear_infinite] -z-10 hover:opacity-10"></div>
            
            <h2 className="mb-6 flex items-center text-xl font-semibold">
              <FaBook className="text-primary mr-3" />
              Información Importante
            </h2>

            <p className="text-muted-foreground mb-6 leading-relaxed">
              El Libro de Reclamaciones es una herramienta que permite a los consumidores presentar sus quejas o
              reclamos sobre los productos o servicios ofrecidos.
            </p>

            <ul className="list-none p-0 mb-6">
              <motion.li
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-start mb-4"
              >
                <FaCheck className="text-primary mr-3 mt-1" />
                <div>
                  <strong>Reclamo:</strong> Disconformidad relacionada a los productos o servicios.
                </div>
              </motion.li>
              
              <motion.li
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-start mb-4"
              >
                <FaCheck className="text-primary mr-3 mt-1" />
                <div>
                  <strong>Queja:</strong> Disconformidad no relacionada a los productos o servicios, o malestar o
                  descontento respecto a la atención al público.
                </div>
              </motion.li>
              
              <motion.li
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex items-start mb-4"
              >
                <FaCheck className="text-primary mr-3 mt-1" />
                <div>
                  <strong>Tiempo de respuesta:</strong> Nos comprometemos a responder en un plazo máximo de 30 días
                  calendario.
                </div>
              </motion.li>
            </ul>

            <p className="text-muted-foreground leading-relaxed">
              También puedes presentar tu reclamo de manera presencial en cualquiera de nuestras tiendas.
            </p>
          </motion.div>

          {/* Columna del formulario */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-card rounded-md p-6 shadow-md border border-border relative backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 to-transparent -z-10"></div>
            <div className="absolute top-[-50%] right-[-50%] w-[200%] h-[200%] bg-radial-gradient opacity-0 transition-all duration-600 -z-10 hover:opacity-10"></div>
            
            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-green-100/10 to-green-100/5 border border-green-500 text-green-500 p-4 rounded-md mb-6 flex items-center"
              >
                <FaCheck className="mr-3 text-xl" />
                <div>
                  <strong>¡Reclamación enviada!</strong>
                  <p>Hemos recibido tu reclamación y te responderemos a la brevedad.</p>
                </div>
              </motion.div>
            )}

            <Formik
              initialValues={{ nombre: "", email: "", telefono: "", mensaje: "" }}
              validationSchema={ReclamacionSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="mb-6">
                    <label htmlFor="nombre" className="block mb-2 font-medium">
                      Nombre completo *
                    </label>
                    <Field
                      type="text"
                      name="nombre"
                      id="nombre"
                      placeholder="Ingresa tu nombre completo"
                      className="w-full p-3 bg-card border border-border rounded-md text-foreground text-base transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background/50 placeholder:text-muted-foreground backdrop-blur-md"
                    />
                    <ErrorMessage name="nombre" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="email" className="block mb-2 font-medium">
                      Correo electrónico *
                    </label>
                    <Field
                      type="email"
                      name="email"
                      id="email"
                      placeholder="Ingresa tu correo electrónico"
                      className="w-full p-3 bg-card border border-border rounded-md text-foreground text-base transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background/50 placeholder:text-muted-foreground backdrop-blur-md"
                    />
                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="telefono" className="block mb-2 font-medium">
                      Teléfono
                    </label>
                    <Field
                      type="text"
                      name="telefono"
                      id="telefono"
                      placeholder="Ingresa tu número de teléfono"
                      className="w-full p-3 bg-card border border-border rounded-md text-foreground text-base transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background/50 placeholder:text-muted-foreground backdrop-blur-md"
                    />
                    <ErrorMessage name="telefono" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="mensaje" className="block mb-2 font-medium">
                      Detalle de la reclamación *
                    </label>
                    <Field
                      as="textarea"
                      name="mensaje"
                      id="mensaje"
                      placeholder="Describe detalladamente tu reclamo o queja"
                      className="w-full p-3 bg-card border border-border rounded-md text-foreground text-base transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background/50 placeholder:text-muted-foreground min-h-[150px] resize-y backdrop-blur-md"
                    />
                    <ErrorMessage name="mensaje" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-3 bg-gradient-to-r from-primary to-red-500 text-white border-none rounded-md text-base font-semibold cursor-pointer transition-all flex items-center justify-center disabled:bg-muted-foreground disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none hover:-translate-y-1 hover:shadow-lg"
                  >
                    {isSubmitting ? (
                      "Enviando..."
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2" /> Enviar Reclamación
                      </>
                    )}
                  </motion.button>
                </Form>
              )}
            </Formik>
          </motion.div>
        </div>
      </div>
    </>
  )
}

export default LibroReclamaciones
