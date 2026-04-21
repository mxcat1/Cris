"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Building2,
  Save,
  Loader2,
  Upload,
  FileText,
  User,
  MapPin,
  Key,
  Lock,
  CreditCard,
  ShieldCheck,
  Settings,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "../../components/ui/form"
import { Switch } from "../../components/ui/switch"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { fetchCompany, createCompany, updateCompany } from "../../services/companyService"
import { useAuth } from "../../contexts/AuthContext"
import { Input } from "../../components/ui/input"
import { motion } from "framer-motion"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { ImageIcon } from "lucide-react"

import { Navigate } from "react-router-dom"

const companySchema = z.object({
  razon_social: z.string().min(1, "La razón social es requerida"),
  ruc: z
    .string()
    .length(11, "El RUC debe tener 11 dígitos")
    .regex(/^(10|20)\d{9}$/, "El RUC debe comenzar con 10 o 20 y tener 11 dígitos"),
  direccion: z.string().min(1, "La dirección es requerida"),
  sol_user: z.string().min(1, "El usuario SOL es requerido"),
  sol_pass: z.string().min(1, "La contraseña SOL es requerida"),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  production: z.boolean().default(false),
})

type CompanyFormValues = z.infer<typeof companySchema>

const CompanyPage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [certFile, setCertFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Verificar si el usuario tiene permisos de gerente
  const isManager = user?.id_role === 1

  useDocumentTitle("Datos de la Empresa")

  if (!isManager) {
    return <Navigate to="/" />
  }

  // Fetch company data
  const { data: company, isLoading } = useQuery({
    queryKey: ["company"],
    queryFn: fetchCompany,
  })

  // Create/Update company mutation
  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      if (company) {
        return updateCompany(company.id_company, data)
      } else {
        return createCompany(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] })
      toast.success(company ? "Empresa actualizada exitosamente" : "Empresa creada exitosamente")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Error al guardar la información de la empresa")
    },
  })

  // Form for company data
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      razon_social: "",
      ruc: "",
      direccion: "",
      sol_user: "",
      sol_pass: "",
      client_id: "",
      client_secret: "",
      production: false,
    },
  })

  // Update form values when company data is loaded
  useEffect(() => {
    if (company) {
      form.reset({
        razon_social: company.razon_social,
        ruc: company.ruc,
        direccion: company.direccion,
        sol_user: company.sol_user,
        sol_pass: company.sol_pass,
        client_id: company.client_id || "",
        client_secret: company.client_secret || "",
        production: company.production,
      })

      if (company.logo_url) {
        // Verificar si la URL es una ruta de archivo local o una URL HTTP válida
        if (company.logo_url.startsWith("http://") || company.logo_url.startsWith("https://")) {
          // Es una URL HTTP válida, usarla directamente
          setLogoPreview(company.logo_url)
        } else {
          // Es una ruta de archivo local, extraer solo el nombre del archivo
          const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"          // Extraer solo el nombre del archivo de la ruta completa
          const fileName = company.logo_url.split("\\").pop()?.split("/").pop()
          
          if (fileName) {
            // Construir la URL correcta usando solo el nombre del archivo
            setLogoPreview(`${baseUrl}/uploads/logos/${fileName}`)
          } else {
            setLogoPreview(null)
          }
        }
      }
    }
  }, [company, form])

  const onSubmit = (data: CompanyFormValues) => {
    const formData = new FormData()

    // Add form fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString())
      }
    })

    // Add files if selected
    if (logoFile) {
      formData.append("logo", logoFile)
    }

    if (certFile) {
      formData.append("cert", certFile)
    }

    // Add user ID
    if (user?.id) {
      formData.append("id_user", user.id.toString())
    }

    mutation.mutate(formData)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }
  const handleCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCertFile(e.target.files[0])
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Cargando información...</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Obteniendo datos de la empresa</p>
        </div>
      </div>
    )
  }return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Información de la Empresa
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestiona los datos de tu empresa para la facturación electrónica
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >          <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border border-border/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-50/30 dark:to-purple-900/20" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent flex items-center">
                <Building2 className="mr-2 h-6 w-6 text-purple-600 dark:text-purple-400" />
                Datos de la Empresa
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Información requerida para la emisión de comprobantes electrónicos
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="relative space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Logo preview and upload */}
                    <motion.div
                      className="w-full md:w-1/3 flex flex-col items-center space-y-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >                      <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-900/20 flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                        {logoPreview ? (
                          <img
                            src={logoPreview || "/placeholder.svg"}
                            alt="Logo de la empresa"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // Si hay error al cargar la imagen, mostrar el placeholder
                              e.currentTarget.style.display = "none"
                              setLogoPreview(null)
                            }}
                          />
                        ) : (
                          <ImageIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>                      <div className="w-full">
                        <label htmlFor="logo-upload" className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md hover:from-purple-700 hover:to-indigo-700 dark:hover:from-purple-600 dark:hover:to-indigo-600 transition-all duration-200 cursor-pointer">
                          <Upload className="h-4 w-4" />
                          <span>Subir Logo</span>
                        </label>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoChange}
                        />
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                          Formatos: JPG, PNG. Máx 2MB
                        </p>
                      </div>
                    </motion.div>

                    {/* Company details form */}
                    <div className="w-full md:w-2/3 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="razon_social"
                          render={({ field }) => (                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                Razón Social
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Nombre de la empresa" 
                                  {...field} 
                                  className="h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200" 
                                />
                              </FormControl>
                              <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="ruc"
                          render={({ field }) => (                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                RUC
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Número de RUC" 
                                  {...field} 
                                  className="h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200" 
                                />
                              </FormControl>
                              <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="direccion"
                        render={({ field }) => (                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              Dirección Fiscal
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Dirección completa" 
                                {...field} 
                                className="h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200" 
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>                  <div className="space-y-4 p-6 bg-gradient-to-r from-gray-50/80 to-purple-50/30 dark:from-gray-800/50 dark:to-purple-900/20 rounded-xl border border-gray-200/60 dark:border-gray-700/40">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Datos de SUNAT
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="sol_user"
                        render={({ field }) => (                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <Key className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                Usuario SOL
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Usuario SOL de SUNAT" 
                                  {...field} 
                                  className="h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200" 
                                />
                              </FormControl>
                              <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                            </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sol_pass"
                        render={({ field }) => (                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <Lock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                Clave SOL
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Clave SOL de SUNAT"
                                  {...field}
                                  className="h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200"
                                />
                              </FormControl>
                              <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                            </FormItem>
                        )}
                      />
                    </div>                    <div className="mt-4">
                      <label htmlFor="cert-upload" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-3">
                        <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        Certificado Digital
                      </label>
                      <div className="flex items-center gap-3 p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-border/20 rounded-xl shadow-sm">
                        <label htmlFor="cert-upload" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md hover:from-purple-700 hover:to-indigo-700 dark:hover:from-purple-600 dark:hover:to-indigo-600 transition-all duration-200 cursor-pointer">
                          <Upload className="h-4 w-4" />
                          <span>Seleccionar archivo</span>
                        </label>
                        <input
                          id="cert-upload"
                          type="file"
                          accept=".pem,.txt,.cer,.cert"
                          className="hidden"
                          onChange={handleCertChange}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                          {certFile
                            ? certFile.name
                            : company?.cert_path
                              ? "Certificado cargado"
                              : "Ningún archivo seleccionado"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Formatos aceptados: .pem, .txt, .cer, .cert
                      </p>
                    </div>
                  </div>                  <div className="space-y-4 p-6 bg-gradient-to-r from-gray-50/80 to-purple-50/30 dark:from-gray-800/50 dark:to-purple-900/20 rounded-xl border border-gray-200/60 dark:border-gray-700/40">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Configuración Avanzada
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="client_id"
                        render={({ field }) => (                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                Client ID (opcional)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Client ID para API" 
                                  {...field} 
                                  className="h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200" 
                                />
                              </FormControl>
                              <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                            </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="client_secret"
                        render={({ field }) => (                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <Lock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                Client Secret (opcional)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Client Secret para API"
                                  {...field}
                                  className="h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200"
                                />
                              </FormControl>
                              <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                            </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-4">                      <FormField
                        control={form.control}
                        name="production"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-border/20 rounded-xl shadow-sm">
                            <div className="flex-1">
                              <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                Modo Producción
                              </FormLabel>
                              <FormDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Activar para enviar comprobantes reales a SUNAT
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-purple-600 dark:data-[state=checked]:bg-purple-500"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>                <CardFooter className="relative flex justify-end pt-6">
                  <Button 
                    type="submit" 
                    disabled={mutation.isPending}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 hover:from-purple-700 hover:to-indigo-700 dark:hover:from-purple-600 dark:hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-xl"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </motion.div>      </motion.div>
      </div>
    </div>
  )
}

export default CompanyPage
