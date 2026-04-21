"use client"

import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  CreditCard,
  Info,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Receipt,
  Tag,
  ShoppingCart,
  Package,
  Warehouse,
} from "lucide-react"
import { QrCode } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { fetchSaleById, generateSaleTicket as generateSaleTicketAPI } from "../../services/saleService"
import { fetchCompanyForSales } from "../../services/companyService"
import { prepareInvoiceData, getInvoicePdf } from "../../services/invoiceService"
import { formatCurrency, formatDateTime } from "../../lib/utils"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { fetchUserBasicInfo } from "../../services/userService"
import TicketViewer from "../../components/ticket-viewer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"
import { generateFileName as generateFileNameUtil } from "../../utils/openDocument"
import { motion } from "framer-motion"

const SaleDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  useDocumentTitle(`Detalle de Venta #${id}`)
  const navigate = useNavigate()
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)
  const [ticketHtml, setTicketHtml] = useState<string>("")
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)

  // Fetch sale details
  const {
    data: sale,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["sale", id],
    queryFn: () => fetchSaleById(Number(id)),
    retry: false,
  })

  // Fetch company data for invoice
  const { data: company } = useQuery({
    queryKey: ["company"],
    queryFn: fetchCompanyForSales,
  })
  // Replace the getPaymentMethodBadge function with this updated version
  const getPaymentMethodBadge = (method: string) => {
    // Capitalize the first letter of the payment method
    const formattedMethod = method?.charAt(0).toUpperCase() + method?.slice(1).toLowerCase()

    switch (method?.toLowerCase()) {
      case "efectivo":
        return (
          <Badge variant="outline" className="bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 dark:from-emerald-900/20 dark:to-green-900/20 dark:text-emerald-400 dark:border-emerald-800 shadow-sm">
            <DollarSign className="h-3 w-3 mr-1" />
            {formattedMethod}
          </Badge>
        )
      case "tarjeta":
        return (
          <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:text-blue-400 dark:border-blue-800 shadow-sm">
            <CreditCard className="h-3 w-3 mr-1" />
            {formattedMethod}
          </Badge>
        )
      case "transferencia":
        return (
          <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-purple-200 dark:from-purple-900/20 dark:to-violet-900/20 dark:text-purple-400 dark:border-purple-800 shadow-sm">
            <Receipt className="h-3 w-3 mr-1" />
            {formattedMethod}
          </Badge>
        )
      case "yape":
        return (
          <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-md">
            <QrCode className="h-3 w-3 mr-1" />
            {formattedMethod}
          </Badge>
        )
      case "plin":
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-md">
            <QrCode className="h-3 w-3 mr-1" />
            {formattedMethod}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200 dark:from-gray-900/20 dark:to-slate-900/20 dark:text-gray-400 dark:border-gray-800 shadow-sm">
            <CreditCard className="h-3 w-3 mr-1" />
            {formattedMethod}
          </Badge>
        )
    }
  }

  // Modificar la función getTipoDocumento para usar directamente los datos de la venta
  const getTipoDocumento = () => {
    // Si la venta tiene tipo_documento, usarlo (1 = Factura, 3 = Boleta)
    if (sale?.tipo_documento) {
      return sale.tipo_documento === "1" ? "01" : "03"
    }
    // Si no tiene tipo_documento pero tiene cliente con RUC, asumir Factura
    if (sale?.cliente_tipo_documento === "6") {
      return "01" // Factura
    }
    // Por defecto, asumir que es boleta
    return "03" // Boleta
  }
  // Modificar la función getNombreDocumento para ser más descriptiva
  const getNombreDocumento = () => {
    return getTipoDocumento() === "01" ? "Factura Electrónica" : "Boleta Electrónica"
  }
  // Función para generar nombre de archivo inteligente usando el utilitario
  const generateFileName = () => {
    if (!sale) return `documento-${new Date().getTime()}`

    // Preparar datos del cliente en el formato esperado por la función utilitaria
    const clienteData = sale.cliente_numero_documento ? {
      numeroDocumento: sale.cliente_numero_documento,
      tipoDocumento: sale.cliente_tipo_documento || "1",
      nombre: sale.cliente_nombre || ""
    } : null

    // Usar correlativo real de la venta
    const correlativoReal = sale.correlativo || sale.venta_id

    return generateFileNameUtil({
      tipoDocumento: getTipoDocumento(),
      correlativoReal,
      clienteData
    })
  }

  // Generate electronic invoice
  const generateInvoice = async () => {
    if (!sale || !company) {
      toast.error("No hay datos de venta o empresa disponibles")
      return
    }

    try {
      setIsGeneratingInvoice(true)

      // Preparar invoice data - asegurar que se usa la fecha original de la venta
      const saleWithItems = {
        ...sale,
        fecha: sale.fecha, // Asegurar que se usa la fecha original de la venta
        items:
          sale.detalles?.map((detalle) => ({
            producto_id: detalle.producto_id,
            nombre: detalle.producto?.nombre || `Producto #${detalle.producto_id}`,
            precio_unitario: detalle.precio_unitario,
            precio_unitario_con_igv: detalle.precio_unitario_con_igv,
            cantidad: detalle.cantidad,
          })) || [],
      }

      // Obtener el tipo de documento
      const tipoDocumento = getTipoDocumento()

      // Usar series predeterminadas si no hay información
      const series = {
        facturaActual: 1,
        boletaActual: 1,
      }      // Convertir el formato del cliente al formato esperado por prepareInvoiceData
      const clienteAdaptado = sale.cliente
        ? {
          tipoDocumento: sale.cliente.tipoDoc || sale.cliente_tipo_documento || "1",
          numeroDocumento: sale.cliente.numDoc || sale.cliente_numero_documento || "",
          nombre: sale.cliente.nombre || sale.cliente_nombre || "",
          direccion: sale.cliente.direccion || "",
          email: sale.cliente.email || "",
        }
        : null

      const invoiceData = prepareInvoiceData(saleWithItems, company, tipoDocumento, clienteAdaptado, series)

      // Generar PDF o get HTML
      const result = await getInvoicePdf(invoiceData)

      if (typeof result === "string") {
        // Es HTML, intentamos convertirlo a PDF
        try {
          // Importar la función de conversión dinámicamente
          const { convertHtmlToPdf, isMobileOrLowEndDevice } = await import("../../services/invoiceService")

          // Guardar el HTML para referencia
          setTicketHtml(result)

          // Verificar si es un dispositivo móvil o con poca memoria
          const isLowEndDevice = isMobileOrLowEndDevice()

          if (isLowEndDevice) {
            // En dispositivos móviles, mostrar advertencia y permitir elegir
            toast.info("Detectado dispositivo móvil. Se mostrará la vista HTML optimizada.")
            setPdfBlob(null)
            setIsTicketModalOpen(true)
            return
          }

          // Convertir HTML a PDF en dispositivos de escritorio
          toast.info(`Procesando ${getNombreDocumento()}...`)

          // Usar Promise.race para timeout personalizado
          const timeoutMs = 20000 // 20 segundos máximo
          const conversionPromise = convertHtmlToPdf(result)
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('La conversión está tardando demasiado')), timeoutMs)
          )

          const pdfResult = await Promise.race([conversionPromise, timeoutPromise])
          setPdfBlob(pdfResult)

          // Abrir el modal para mostrar el documento
          setIsTicketModalOpen(true)
          toast.success(`${getNombreDocumento()} generada correctamente`)
        } catch (conversionError) {
          console.error("Error al convertir HTML a PDF:", conversionError)

          // Si falla la conversión, mostramos el HTML directamente
          setTicketHtml(result)
          setPdfBlob(null)
          setIsTicketModalOpen(true)

          // Mensaje de error más específico
          const errorMessage = (conversionError as Error).message
          if (errorMessage.includes('Timeout') || errorMessage.includes('tardando demasiado')) {
            toast.warning(`La conversión a PDF tardó demasiado. Mostrando vista HTML.`)
          } else if (errorMessage.includes('memoria') || errorMessage.includes('memory')) {
            toast.warning(`Memoria insuficiente para PDF. Mostrando vista HTML.`)
          } else {
            toast.warning(`${getNombreDocumento()} generada en formato HTML`)
          }
        }
      } else {
        // Es un PDF blob, lo guardamos para mostrarlo
        setPdfBlob(result)
        setTicketHtml("")

        // Abrir el modal para mostrar el documento
        setIsTicketModalOpen(true)
        toast.success(`${getNombreDocumento()} generada correctamente`)
      }
    } catch (error: any) {
      console.error(`Error al generar ${getNombreDocumento().toLowerCase()}:`, error)
      toast.error(error.message || `Error al generar la ${getNombreDocumento().toLowerCase()}`)
    } finally {
      setIsGeneratingInvoice(false)
    }
  }
  // Función para generar ticket de venta (no comprobante fiscal)
  const generateSaleTicket = async () => {
    if (!sale) {
      toast.error("No hay datos de venta disponibles")
      return
    }

    try {
      setIsGeneratingInvoice(true)
      toast.info("Generando ticket de venta...")

      const result = await generateSaleTicketAPI(sale.venta_id)
      
      // Establecer el HTML del ticket
      setTicketHtml(result.html)
      setPdfBlob(null)
      
      // Abrir el modal para mostrar el ticket
      setIsTicketModalOpen(true)
      toast.success("Ticket de venta generado correctamente")

    } catch (error: any) {
      console.error("Error al generar ticket de venta:", error)
      toast.error(error.message || "Error al generar el ticket de venta")
    } finally {
      setIsGeneratingInvoice(false)
    }
  }

  // Agregar esta nueva función para mostrar el formato de serie-correlativo
  const getComprobanteNumero = () => {
    if (!sale) return "Sin número"

    // Si tiene serie y correlativo, mostrarlos en formato F001-00001 o B001-00001
    if (sale.serie && sale.correlativo) {
      return `${sale.serie}-${String(sale.correlativo).padStart(8, "0")}`
    }

    // Si no tiene serie/correlativo pero tiene tipo_documento
    if (sale.tipo_documento) {
      const prefix = sale.tipo_documento === "1" ? "F" : "B"
      return `${prefix}001-00000000`
    }

    return "Sin número de comprobante"
  }
  // Agregar esta nueva función para mostrar la información del cliente
  const ClienteInfo = () => {
    if (!sale) return <p className="text-sm text-gray-500 dark:text-gray-400">Sin información del cliente</p>    // Si hay datos de cliente, mostrarlos
    if (sale.cliente_nombre && sale.cliente_numero_documento) {
      const tipoDocTexto = sale.cliente_tipo_documento === "6" ? "RUC" : "DNI"

      return (
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{sale.cliente_nombre}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tipoDocTexto}: {sale.cliente_numero_documento}
          </p>
        </div>
      )
    }// Si hay comprobante emitido pero no hay datos específicos, mostrar CLIENTE GENERAL
    if (sale.comprobante_emitido && sale.tipo_documento === "3") {
      return (
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">CLIENTE GENERAL</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">DNI: 00000000</p>
        </div>
      )
    }

    // Si no hay comprobante ni datos de cliente
    return <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Cliente no registrado</p>
  }
  // Función para obtener el badge del tipo de venta (mayorista o minorista)
  const getSaleTypeBadge = (esMayorista: boolean) => {
    if (esMayorista) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:text-blue-400 dark:border-blue-800 shadow-sm">
                <Warehouse className="h-3 w-3 mr-1" />
                Mayorista
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 shadow-xl rounded-xl">
              <p>Venta realizada con precio mayorista</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:text-green-400 dark:border-green-800 shadow-sm">
              <Package className="h-3 w-3 mr-1" />
              Minorista
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 shadow-xl rounded-xl">
            <p>Venta realizada con precio unitario</p>
          </TooltipContent>
        </Tooltip>      </TooltipProvider>
    )
  }

  useEffect(() => {
    // Scroll to top when component mounts or when sale id changes
    window.scrollTo(0, 0)
  }, [id])
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Cargando detalles de la venta...</p>
        </motion.div>
      </div>
    )
  }  if (isError || !sale) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="text-center space-y-6 max-w-md mx-auto px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 p-8 rounded-full w-32 h-32 flex items-center justify-center mx-auto shadow-lg">
            <AlertTriangle className="h-16 w-16 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Venta no encontrada</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">La venta que buscas no existe o ha sido eliminada</p>
          <Button
            onClick={() => navigate("/sales")}
            className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Ventas
          </Button>
        </motion.div>
      </div>
    )
  }  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decoraciones de fondo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-200 via-purple-100 to-transparent dark:from-blue-800/30 dark:via-purple-800/20 rounded-full opacity-40 blur-3xl transform translate-x-1/4 -translate-y-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-200 via-blue-100 to-transparent dark:from-indigo-800/30 dark:via-blue-800/20 rounded-full opacity-40 blur-3xl transform -translate-x-1/4 translate-y-1/4 pointer-events-none" /><div className="relative z-10 container mx-auto px-4 py-2">
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header with gradient */}          <motion.div
            className="relative overflow-hidden bg-card/50 backdrop-blur-sm rounded-2xl shadow-xl border border-border/20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 opacity-90" />            <div className="relative z-10 p-3 text-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/sales")}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h1 className="text-xl font-bold flex items-center">
                      <Receipt className="mr-2 h-5 w-5" />
                      Venta #{sale.venta_id}
                    </h1>
                    <p className="text-white/90 text-sm">Detalle completo de la transacción</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white rounded-xl px-3 py-1 text-xs font-medium transition-all duration-200 shadow-sm">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(sale.fecha).toLocaleDateString()}
                  </Badge>
                  {getPaymentMethodBadge(sale.metodo_pago)}
                </div>
              </div>
            </div>
          </motion.div>          {/* Action buttons */}          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {sale.comprobante_emitido ? (
              <>
                <Button
                  variant="outline"
                  className="bg-card/50 backdrop-blur-sm border-border/20 hover:bg-accent/50 transition-all duration-200 shadow-sm hover:shadow-md rounded-xl"
                  onClick={generateInvoice}
                  disabled={isGeneratingInvoice}
                >
                  {isGeneratingInvoice ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Ver {getNombreDocumento()}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm border-gray-300/80 dark:border-gray-600/80 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60 rounded-xl"
                  disabled={true}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Sin comprobante electrónico
                </Button>
                
                {/* Botón para generar ticket de venta (solo disponible cuando NO hay comprobante) */}
                <Button
                  variant="outline"
                  className="bg-card/50 backdrop-blur-sm border-border/20 hover:bg-accent/50 transition-all duration-200 shadow-sm hover:shadow-md rounded-xl"
                  onClick={generateSaleTicket}
                  disabled={isGeneratingInvoice}
                >
                  {isGeneratingInvoice ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Generar Ticket
                </Button>
              </>
            )}
          </motion.div><div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Left column - Sale information */}
            <div className="lg:col-span-1 space-y-3">
              {/* Sale information card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >                <Card className="bg-card/50 backdrop-blur-sm rounded-xl shadow-lg border border-border/20 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 text-white">
                    <CardTitle className="text-sm font-semibold flex items-center">
                      <Info className="mr-2 h-4 w-4" />
                      Información de la Venta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-3">
                      {/* ID de Venta */}
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
                        <Receipt className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">ID Venta</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">#{sale.venta_id}</p>
                        </div>
                      </div>

                      {/* Comprobante */}
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
                        <FileText className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Comprobante</p>
                          {sale.comprobante_emitido ? (
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{getComprobanteNumero()}</p>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">Sin comprobante</p>
                          )}
                        </div>
                      </div>

                      {/* Fecha y Hora */}
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
                        <Calendar className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Fecha y Hora</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatDateTime(sale.fecha)}</p>
                        </div>
                      </div>

                      {/* Cliente */}
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
                        <User className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Cliente</p>
                          <div className="text-sm">
                            <ClienteInfo />
                          </div>
                        </div>
                      </div>

                      {/* Método de Pago */}
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50 dark:border-gray-700/50">
                        <CreditCard className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Método de Pago</p>
                          <div className="mt-1">
                            {getPaymentMethodBadge(sale.metodo_pago)}
                          </div>
                        </div>
                      </div>

                      {/* Cajero */}
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Cajero</p>
                          <div className="text-sm">
                            <CajeroInfo id={sale.id_cajero} />
                          </div>
                        </div>
                      </div>

                      {/* Observaciones */}
                      {sale.observaciones && (
                        <div className="flex items-start gap-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                          <Tag className="h-3 w-3 text-purple-600 dark:text-purple-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Observaciones</p>
                            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 break-words">{sale.observaciones}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Status card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >                <Card className="bg-card/50 backdrop-blur-sm rounded-xl shadow-lg border border-border/20 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-600 p-3 text-white">
                    <CardTitle className="text-sm font-semibold flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Estado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="text-center">
                      <Badge variant="outline" className="bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 dark:from-emerald-900/20 dark:to-green-900/20 dark:text-emerald-400 dark:border-emerald-800 shadow-sm mb-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completada
                      </Badge>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(sale.fecha).toLocaleDateString()} a las {new Date(sale.fecha).toLocaleTimeString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>            </div>

            {/* Right column - Products detail card */}
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >              <Card className="bg-card/50 backdrop-blur-sm rounded-xl shadow-lg border border-border/20 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 text-white">
                  <CardTitle className="text-sm font-semibold flex items-center">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Detalle de Productos                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                {sale.detalles && sale.detalles.length > 0 ? (
                  <div className="rounded-xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-800/50 dark:via-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200/80 dark:border-gray-700/80">                            <th className="text-left py-2 px-3 font-semibold text-sm text-gray-800 dark:text-gray-200">Producto</th>
                            <th className="text-center py-2 px-3 font-semibold text-sm text-gray-800 dark:text-gray-200">Cantidad</th>
                            <th className="text-right py-2 px-3 font-semibold text-sm text-gray-800 dark:text-gray-200">Precio Unit.</th>
                            <th className="text-right py-2 px-3 font-semibold text-sm text-gray-800 dark:text-gray-200">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sale.detalles.map((detalle, index) => (
                            <tr
                              key={detalle.detalle_id}
                              className={`border-b border-gray-200/60 dark:border-gray-700/60 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 transition-all duration-200 ${index % 2 === 0
                                  ? 'bg-white/50 dark:bg-gray-800/20'
                                  : 'bg-gray-50/50 dark:bg-gray-900/20'
                                }`}
                            >
                              <td className="py-3 px-4">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {detalle.producto?.nombre || `Producto #${detalle.producto_id}`}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                    SKU: {detalle.producto?.sku || "N/A"}
                                  </div>
                                </div>
                              </td>                              <td className="text-center py-2 px-3">
                                <div className="flex items-center justify-center gap-1">
                                  <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:text-blue-400 dark:border-blue-800 shadow-sm text-xs">
                                    {detalle.cantidad}
                                  </Badge>
                                  {getSaleTypeBadge(detalle.es_venta_mayorista!)}
                                </div>
                              </td>
                              <td className="text-right py-2 px-3 font-bold text-sm text-gray-900 dark:text-gray-100">
                                {formatCurrency(Number.parseFloat(detalle.precio_unitario_con_igv))}
                              </td>
                              <td className="text-right py-2 px-3 font-bold text-sm text-purple-600 dark:text-purple-400">
                                {formatCurrency(Number.parseFloat(detalle.subtotal_con_igv))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (                  <motion.div
                    className="flex flex-col items-center justify-center py-6 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <ShoppingCart className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">No hay detalles disponibles</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">No se encontraron productos en esta venta</p>
                  </motion.div>
                )}
              </CardContent>              <CardFooter className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 p-3 border-t border-gray-200/80 dark:border-gray-700/80">
                <div className="w-full">
                  <div className="bg-card/50 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-border/20">
                    {(() => {
                      // Calcular valores base
                      const subtotal = Number.parseFloat(sale.total_con_igv) // Subtotal = Total con IGV
                      const precioNeto = subtotal / 1.18 // Operación gravada (precio neto)
                      const igv = subtotal - precioNeto // IGV = Subtotal - Precio Neto
                      const descuento = sale.es_descuento ? Number.parseFloat(sale.descuento?.toString() || "0") : 0
                      const totalGeneral = subtotal - descuento // Total final después del descuento

                      return (                        <div className="space-y-2">                          <div className="flex justify-between items-center py-1 border-b border-gray-200/50 dark:border-gray-700/50">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Subtotal:</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(subtotal)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-gray-200/50 dark:border-gray-700/50">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Precio Neto:</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(precioNeto)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-gray-200/50 dark:border-gray-700/50">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">IGV (18%):</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(igv)}</span>
                          </div>
                          {sale.es_descuento && descuento > 0 && (
                            <div className="flex justify-between items-center py-1 border-b border-gray-200/50 dark:border-gray-700/50">
                              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Descuento:</span>
                              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                -{formatCurrency(descuento)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center py-2 mt-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg px-3 border border-purple-200/50 dark:border-purple-800/30">
                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">Total General:</span>
                            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatCurrency(totalGeneral)}</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>              </CardFooter>
            </Card>
            </motion.div>
          </div>

          {/* Modal para mostrar el ticket */}
          <TicketViewer
            isOpen={isTicketModalOpen}
            onClose={() => setIsTicketModalOpen(false)}
            htmlContent={ticketHtml}
            pdfBlob={pdfBlob}
            title={`${getNombreDocumento()} #${sale.venta_id}`}
            documentType={getNombreDocumento()}
            fileName={generateFileName()}
          />
        </motion.div>
      </div>
    </div>
  )
}

// Componente para mostrar información del cajero
const CajeroInfo = ({ id }: { id: number }) => {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUserBasicInfo(id),
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
  if (isLoading) {
    return <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Cargando...</p>
  }

  if (isError || !user) {
    return <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Cajero ID: {id}</p>
  }

  return <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{(user as any)?.name || `Cajero ID: ${id}`}</p>
}

export default SaleDetailPage
