"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Calendar,
  DollarSign,
  CreditCard,
  Smartphone,
  Receipt,
  Users,
  Package,
  Save,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  PieChart,
  User,
  Warehouse,
  Store,
  Tag,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Separator } from "../../components/ui/separator"
import { fetchSalesByDate, fetchSaleDetail } from "../../services/saleService"
import { fetchUserBasicInfo } from "../../services/userService"
import { formatCurrency } from "../../lib/utils"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { registrarCierreCaja, obtenerCierreCajaPorFecha, obtenerCierresCajaPorRango } from "../../services/cierreCajaService"

import moment from "moment-timezone"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"

// Configurar moment para español de forma explícita
moment.locale("es")
// Definir traducciones personalizadas para asegurar que funcione
moment.updateLocale("es", {
  months: "enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre".split("_"),
  monthsShort: "ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic".split("_"),
  weekdays: "domingo_lunes_martes_miércoles_jueves_viernes_sábado".split("_"),
  weekdaysShort: "dom_lun_mar_mié_jue_vie_sáb".split("_"),
  weekdaysMin: "do_lu_ma_mi_ju_vi_sá".split("_"),
})

// Definir interfaces para los datos agregados
interface PaymentMethodSummary {
  method: string
  amount: number
  count: number
  icon: React.ReactNode
  color: string
}

interface CashierSummary {
  id: number
  name: string
  sales: number
  transactions: number
  averageTicket: number
}

interface ProductSummary {
  id: number
  name: string
  quantity: number
  total: number
  isWholesale?: boolean
}

interface DailySummary {
  date: string
  totalSales: number
  totalTransactions: number
  averageTicket: number
  paymentMethods: PaymentMethodSummary[]
  cashiers: CashierSummary[]
  topProducts: ProductSummary[]
  isClosed: boolean
  closedBy?: string
  closedAt?: string
  cashBalance?: number
  notes?: string
  // Nuevos campos para ventas mayoristas
  wholesaleSales: number
  retailSales: number
  wholesaleTransactions: number
  retailTransactions: number
  // Nuevos campos para descuentos
  totalDiscounts: number
  discountTransactions: number
}


// Interfaces for API data
interface SaleDetail {
  detalle_id: number
  venta_id: number
  producto_id: number
  cantidad: number
  precio_unitario: string
  precio_unitario_con_igv: string
  subtotal: string
  subtotal_con_igv: string
  creado_en: string
  es_venta_mayorista?: boolean
  producto?: {
    id_producto: number
    nombre: string
    sku: string
  }
}

interface SaleWithDetails {
  venta_id: number
  fecha: string
  total: string
  total_con_igv: string
  id_cajero: number
  metodo_pago: string
  observaciones: string
  tipo_documento: string
  serie: string
  correlativo: number
  cliente_tipo_documento: string
  cliente_numero_documento: string
  cliente_nombre: string
  comprobante_emitido: boolean
  detalles: SaleDetail[]
  // Campos de descuento
  es_descuento?: boolean
  descuento?: number
}

const DailyCashPage = () => {
  useDocumentTitle("Caja Diaria")

  // Estado para la fecha seleccionada (por defecto hoy)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Usar moment-timezone para obtener la fecha actual en zona horaria peruana
    return moment().tz("America/Lima").format("YYYY-MM-DD")
  })

  // Estado para el cierre de caja
  const [isCashRegisterClosed, setIsCashRegisterClosed] = useState<boolean>(false)
  const [cashBalance, setCashBalance] = useState<string>("")
  const [cashRegisterNotes, setCashRegisterNotes] = useState<string>("")
  const [isClosingCashRegister, setIsClosingCashRegister] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("resumen")
  const [formattedDate, setFormattedDate] = useState<string>("")

  // Estado para almacenar detalles de ventas
  const [salesDetails, setSalesDetails] = useState<SaleWithDetails[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false)

  // Estado para guardar los datos del cierre de caja registrado
  const [cierreCajaData, setCierreCajaData] = useState<any>(null)

  // Estado para el historial de cierres de caja
  const [historialCierres, setHistorialCierres] = useState<any[]>([])
  const [isLoadingHistorial, setIsLoadingHistorial] = useState<boolean>(false)
  const [fechaInicioHistorial, setFechaInicioHistorial] = useState<string>(() => {
    // Por defecto, mostrar los últimos 30 días
    return moment().tz("America/Lima").subtract(30, 'days').format("YYYY-MM-DD")
  })
  const [fechaFinHistorial, setFechaFinHistorial] = useState<string>(() => {
    return moment().tz("America/Lima").format("YYYY-MM-DD")
  })

  useEffect(() => {
    // Crear fecha con moment-timezone en zona horaria peruana
    const date = moment(selectedDate).tz("America/Lima")
    // Forzar el idioma español y formatear correctamente
    date.locale("es")
    const formattedDay = date.format("dddd").charAt(0).toUpperCase() + date.format("dddd").slice(1)
    setFormattedDate(`${formattedDay}, ${date.format("D [de] MMMM [de] YYYY")}`)
  }, [selectedDate])

  // Obtener ventas por fecha
  const {
    data: salesByDate,
    isLoading: isLoadingSales,
    refetch: refetchSales,
  } = useQuery({
    queryKey: ["sales", "date", selectedDate],
    queryFn: () => fetchSalesByDate(selectedDate),
    enabled: !!selectedDate,
  })
  // Estado para almacenar los nombres de los cajeros
  const [cashierNames, setCashierNames] = useState<Record<number, string>>({})

  // Función para obtener el nombre del cajero
  const { isLoading: isLoadingCashierNames } = useQuery({
    queryKey: ["cashierNames", salesByDate],
    queryFn: async () => {
      if (!salesByDate) return {};
      
      const uniqueCajeroIds = [...new Set(salesByDate.map((sale) => sale.id_cajero))]
      const names: Record<number, string> = {}
      for (const cajeroId of uniqueCajeroIds) {
        try {
          // Usar fetchUserBasicInfo en lugar de fetchUserById para permitir acceso desde rol 3 (vendedor)
          // fetchUserBasicInfo utiliza el endpoint /users/:id/basic que es accesible para roles 1 (admin) y 3 (vendedor)
          const cajero = await fetchUserBasicInfo(cajeroId)
          names[cajeroId] = cajero?.name || `Cajero #${cajeroId}`
        } catch (error) {
          console.error(`Error fetching user with ID ${cajeroId}:`, error)
          names[cajeroId] = `Cajero #${cajeroId} (Error)`
        }
      }
      setCashierNames(names)
      return names
    },
    enabled: !!salesByDate && salesByDate.length > 0,
  })

  // Cargar detalles de ventas cuando se obtengan las ventas por fecha
  useEffect(() => {
    const fetchSalesDetails = async () => {
      if (!salesByDate || salesByDate.length === 0) return

      setIsLoadingDetails(true)
      try {
        const detailsPromises = salesByDate.map((sale) => fetchSaleDetail(sale.venta_id))
        const details = await Promise.all(detailsPromises)
        setSalesDetails(details)
      } catch (error) {
        console.error("Error fetching sales details:", error)
        toast.error("Error al cargar detalles de ventas")
      } finally {
        setIsLoadingDetails(false)
      }
    }

    fetchSalesDetails()
  }, [salesByDate])

  // Consultar el estado de cierre de caja cada vez que cambie la fecha filtrada
  useEffect(() => {
    const fetchCierre = async () => {
      try {
        let cierre = await obtenerCierreCajaPorFecha(selectedDate)
        // Si la respuesta es un array, busca el que coincida exactamente con la fecha filtrada
        if (Array.isArray(cierre)) {
          cierre = cierre.find((c) => c.fecha_apertura && c.fecha_apertura.startsWith(selectedDate))
        } else if (cierre && cierre.fecha_apertura && !cierre.fecha_apertura.startsWith(selectedDate)) {
          cierre = null
        }
        if (cierre && cierre.estado === "cerrado") {
          setCierreCajaData(cierre)
          setIsCashRegisterClosed(true)
        } else {
          setCierreCajaData(null)
          setIsCashRegisterClosed(false)
        }
      } catch (e) {
        setCierreCajaData(null)
        setIsCashRegisterClosed(false)
      }
    }
    fetchCierre()
  }, [selectedDate])

  // Función para cargar el historial de cierres
  const cargarHistorialCierres = async () => {
    if (activeTab !== "historial") return
    
    setIsLoadingHistorial(true)
    try {
      const cierres = await obtenerCierresCajaPorRango(fechaInicioHistorial, fechaFinHistorial)
      setHistorialCierres(cierres)
    } catch (error) {
      console.error("Error al cargar historial de cierres:", error)
      toast.error("Error al cargar el historial de cierres")
    } finally {
      setIsLoadingHistorial(false)
    }
  }

  // Cargar historial cuando se cambie la tab o las fechas
  useEffect(() => {
    cargarHistorialCierres()
  }, [activeTab, fechaInicioHistorial, fechaFinHistorial])

  // Calcular resumen diario
  const dailySummary: DailySummary = useMemo(() => {    if (!salesByDate || salesByDate.length === 0) {
      return {
        date: selectedDate,
        totalSales: 0,
        totalTransactions: 0,
        averageTicket: 0,
        paymentMethods: [],
        cashiers: [],
        topProducts: [],
        isClosed: false,
        wholesaleSales: 0,
        retailSales: 0,
        wholesaleTransactions: 0,
        retailTransactions: 0,
        totalDiscounts: 0,
        discountTransactions: 0,
      }
    }

    // Calcular totales (considerando descuentos aplicados)
    const totalSales = salesByDate.reduce((sum, sale) => {
      const baseTotal = Number(sale.total_con_igv) || 0
      const discount = (sale.es_descuento && sale.descuento) ? Number(sale.descuento) : 0
      return sum + (baseTotal - discount)
    }, 0)
    const totalTransactions = salesByDate.length
    const averageTicket = totalSales / totalTransactions

    // Agrupar por método de pago
    const paymentMethodsMap = new Map<string, { amount: number; count: number }>()

    salesByDate.forEach((sale) => {
      const method = sale.metodo_pago.toLowerCase()
      // Calcular el monto real considerando descuentos
      const baseTotal = Number(sale.total_con_igv) || 0
      const discount = (sale.es_descuento && sale.descuento) ? Number(sale.descuento) : 0
      const amount = baseTotal - discount

      if (paymentMethodsMap.has(method)) {
        const current = paymentMethodsMap.get(method)!
        paymentMethodsMap.set(method, {
          amount: current.amount + amount,
          count: current.count + 1,
        })
      } else {
        paymentMethodsMap.set(method, { amount, count: 1 })
      }
    })

    // Convertir a array y añadir iconos
    const paymentMethods: PaymentMethodSummary[] = Array.from(paymentMethodsMap.entries()).map(([method, data]) => {
      let icon: React.ReactNode
      let color: string

      switch (method) {
        case "efectivo":
          icon = <DollarSign className="h-4 w-4" />
          color = "text-green-500"
          break
        case "tarjeta":
          icon = <CreditCard className="h-4 w-4" />
          color = "text-blue-500"
          break
        case "transferencia":
          icon = <Receipt className="h-4 w-4" />
          color = "text-purple-500"
          break
        case "yape":
          icon = <Smartphone className="h-4 w-4" />
          color = "text-fuchsia-500"
          break
        case "plin":
          icon = <Smartphone className="h-4 w-4" />
          color = "text-cyan-500"
          break
        default:
          icon = <DollarSign className="h-4 w-4" />
          color = "text-gray-500"
      }

      return {
        method,
        amount: data.amount,
        count: data.count,
        icon,
        color,
      }
    })

    // Agrupar por cajero
    const cashiersMap = new Map<number, { sales: number; transactions: number }>()

    salesByDate.forEach((sale) => {
      const cajeroId = sale.id_cajero
      // Calcular el monto real considerando descuentos
      const baseTotal = Number(sale.total_con_igv) || 0
      const discount = (sale.es_descuento && sale.descuento) ? Number(sale.descuento) : 0
      const amount = baseTotal - discount

      if (cashiersMap.has(cajeroId)) {
        const current = cashiersMap.get(cajeroId)!
        cashiersMap.set(cajeroId, {
          sales: current.sales + amount,
          transactions: current.transactions + 1,
        })
      } else {
        cashiersMap.set(cajeroId, { sales: amount, transactions: 1 })
      }
    })

    // Convertir a array
    const cashiers: CashierSummary[] = Array.from(cashiersMap.entries()).map(([id, data]) => ({
      id,
      name: cashierNames[id] || `Cajero #${id}`,
      sales: data.sales,
      transactions: data.transactions,
      averageTicket: data.sales / data.transactions,
    }))

    // Variables para contabilizar ventas mayoristas y minoristas
    let wholesaleSales = 0
    let retailSales = 0
    let wholesaleTransactions = 0
    let retailTransactions = 0

    // Agrupar productos vendidos usando los detalles completos
    const productsMap = new Map<
      number,
      {
        name: string
        quantity: number
        total: number
        isWholesale: boolean
        wholesaleQty: number
        retailQty: number
      }
    >()

    // Usar salesDetails en lugar de salesByDate para los productos
    salesDetails.forEach((sale) => {
      if (sale.detalles && sale.detalles.length > 0) {
        // Verificar si la venta tiene al menos un detalle mayorista
        const hasWholesaleItems = sale.detalles.some((detalle) => detalle.es_venta_mayorista)

        if (hasWholesaleItems) {
          wholesaleTransactions++
        } else {
          retailTransactions++
        }

        // Calcular el factor de descuento para aplicar proporcionalmente a cada detalle
        const saleTotal = Number(sale.total_con_igv) || 0
        const saleDiscount = (sale.es_descuento && sale.descuento) ? Number(sale.descuento) : 0
        const discountFactor = saleDiscount > 0 && saleTotal > 0 ? (saleTotal - saleDiscount) / saleTotal : 1

        sale.detalles.forEach((detalle: SaleDetail) => {
          const productId = detalle.producto_id
          const productName = detalle.producto?.nombre || `Producto #${productId}`
          const quantity = detalle.cantidad
          const baseTotal = Number(detalle.subtotal_con_igv)
          // Aplicar proporcionalmente el descuento global de la venta
          const total = baseTotal * discountFactor
          const isWholesale = detalle.es_venta_mayorista || false

          // Sumar al total de ventas mayoristas o minoristas
          if (isWholesale) {
            wholesaleSales += total
          } else {
            retailSales += total
          }

          if (productsMap.has(productId)) {
            const current = productsMap.get(productId)!
            productsMap.set(productId, {
              name: productName,
              quantity: current.quantity + quantity,
              total: current.total + total,
              isWholesale: current.isWholesale || isWholesale, // Si alguna vez fue mayorista, se marca como tal
              wholesaleQty: current.wholesaleQty + (isWholesale ? quantity : 0),
              retailQty: current.retailQty + (isWholesale ? 0 : quantity),
            })
          } else {
            productsMap.set(productId, {
              name: productName,
              quantity,
              total,
              isWholesale,
              wholesaleQty: isWholesale ? quantity : 0,
              retailQty: isWholesale ? 0 : quantity,
            })
          }
        })
      }
    })

    // Convertir a array y ordenar por cantidad
    const topProducts: ProductSummary[] = Array.from(productsMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        quantity: data.quantity,
        total: data.total,
        isWholesale: data.wholesaleQty > data.retailQty, // Determinar si la mayoría de ventas fueron mayoristas
      }))      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10) // Top 10 productos

    // Calcular descuentos totales
    const totalDiscounts = salesByDate.reduce((sum, sale) => {
      // Verificar si la venta tiene descuento y sumar el monto del descuento
      if (sale.descuento && Number(sale.descuento) > 0) {
        return sum + Number(sale.descuento)
      }
      return sum
    }, 0)

    // Contar transacciones con descuento
    const discountTransactions = salesByDate.filter(sale => 
      sale.descuento && Number(sale.descuento) > 0
    ).length

    return {
      date: selectedDate,
      totalSales,
      totalTransactions,
      averageTicket,
      paymentMethods,
      cashiers,
      topProducts,
      isClosed: false,
      wholesaleSales,
      retailSales,
      wholesaleTransactions,
      retailTransactions,
      totalDiscounts,
      discountTransactions,
    }
  }, [salesByDate, selectedDate, cashierNames, salesDetails])

  // Función para cambiar la fecha
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Al recibir una fecha del input, aseguramos que se interprete en zona horaria peruana
    const newDate = e.target.value
    setSelectedDate(newDate)
  }

  // Función para cerrar caja
  const handleCloseCashRegister = async () => {
    if (!cashBalance) {
      toast.error("Debe ingresar el saldo en efectivo")
      return
    }
    if (!hasData) {
      toast.error("No hay ventas para cerrar la caja")
      return
    }
    setIsClosingCashRegister(true)
    try {      const fechaApertura = selectedDate + "T00:00:00"
      const fechaCierre = moment().tz("America/Lima").toISOString()
      const cajeroId = salesByDate[0]?.id_cajero || 1
      // const montoTotal = dailySummary.totalSales
      const saldoEfectivo = Number.parseFloat(cashBalance) // Parse the cash balance input value

      // Extraer montos por método de pago
      const totalEfectivo = dailySummary.paymentMethods.find((m) => m.method === "efectivo")?.amount || 0
      const totalTarjeta = dailySummary.paymentMethods.find((m) => m.method === "tarjeta")?.amount || 0
      const totalTransferencia = dailySummary.paymentMethods.find((m) => m.method === "transferencia")?.amount || 0
      const totalYape = dailySummary.paymentMethods.find((m) => m.method === "yape")?.amount || 0
      const totalPlin = dailySummary.paymentMethods.find((m) => m.method === "plin")?.amount || 0

      const cantidadVentas = dailySummary.totalTransactions
      const estado = "cerrado"
      const observaciones = cashRegisterNotes

      const payload = {
        fecha_apertura: fechaApertura,
        fecha_cierre: fechaCierre,
        cajero_id: cajeroId,
        saldo_efectivo: saldoEfectivo,
        total_efectivo: totalEfectivo,
        total_tarjeta: totalTarjeta,
        total_transferencia: totalTransferencia,
        total_yape: totalYape,
        total_plin: totalPlin,
        cantidad_ventas: cantidadVentas,
        estado,
        observaciones,
      }

      await registrarCierreCaja(payload)
      // Refresca el estado de cierre para la fecha actual
      let cierre = await obtenerCierreCajaPorFecha(selectedDate)
      if (Array.isArray(cierre)) {
        cierre = cierre[0]
      }
      if (cierre && cierre.estado === "cerrado") {
        setCierreCajaData(cierre)
        setIsCashRegisterClosed(true)
      }
      toast.success("Caja cerrada correctamente")
    } catch (error: any) {
      toast.error("Error al cerrar la caja")
    } finally {
      setIsClosingCashRegister(false)
    }
  }

  // Verificar si hay datos para mostrar
  const hasData = salesByDate && salesByDate.length > 0

  // Función para renderizar el badge de tipo de venta
  const getSaleTypeBadge = (isWholesale: boolean) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`ml-2 ${
              isWholesale
                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30"
                : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30"
            }`}
          >
            {isWholesale ? (
              <>
                <Warehouse className="h-3 w-3 mr-1" /> Mayorista
              </>
            ) : (
              <>
                <Store className="h-3 w-3 mr-1" /> Minorista
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {isWholesale ? "Venta realizada con precio mayorista" : "Venta realizada con precio minorista"}
        </TooltipContent>      </Tooltip>
    </TooltipProvider>
  )

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <motion.div
        className="max-w-7xl mx-auto space-y-6"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Caja Diaria
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-gray-600 dark:text-gray-400">
                Control y resumen de ventas diarias
              </p>
            </div>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2 font-medium">{formattedDate}</p>
          </div>          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-card/30 backdrop-blur-sm rounded-xl px-4 py-2 border border-border/20">
              <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={handleDateChange} 
                className="bg-transparent border-0 text-gray-700 dark:text-gray-300 placeholder-gray-500 focus:ring-0 focus:outline-none h-auto p-0 text-sm font-medium"
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => refetchSales()} 
              className="bg-card/30 backdrop-blur-sm border-border/20 hover:bg-accent/50 transition-all duration-200 rounded-xl w-10 h-10"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>{isLoadingSales || isLoadingCashierNames ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Cargando datos de ventas...</p>
          </div>
        ) : (
          <>
            {/* Tarjetas de resumen con animación secuencial */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/20 overflow-hidden">
                  <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-white/20 backdrop-blur-sm">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{formatCurrency(dailySummary.totalSales)}</div>
                    <p className="text-sm text-white/90">{dailySummary.totalTransactions} transacciones</p>
                  </div>
                </div>
              </motion.div>              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/20 overflow-hidden">
                  <div className="p-6 bg-gradient-to-br from-red-500 to-red-600">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-white/20 backdrop-blur-sm">
                      <Tag className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {formatCurrency(dailySummary.totalDiscounts)}
                    </div>
                    <p className="text-sm text-white/90">
                      Total descuentos ({dailySummary.discountTransactions} ventas)
                    </p>
                  </div>
                </div>
              </motion.div>              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/20 overflow-hidden">
                  <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-700">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-white/20 backdrop-blur-sm">
                      <Tag className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <div className="text-sm font-medium text-white/90">Mayorista</div>
                        <div className="text-lg font-bold text-white">
                          {formatCurrency(dailySummary.wholesaleSales)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white/90">Minorista</div>
                        <div className="text-lg font-bold text-white">{formatCurrency(dailySummary.retailSales)}</div>
                      </div>
                    </div>
                    <div className="w-full bg-white/20 h-2 rounded-full mt-3 mb-2">
                      <div
                        className="bg-white h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            dailySummary.totalSales > 0
                              ? (dailySummary.wholesaleSales / dailySummary.totalSales) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-white/80 text-center">
                      {dailySummary.totalSales > 0
                        ? `${Math.round((dailySummary.wholesaleSales / dailySummary.totalSales) * 100)}% mayorista`
                        : "Sin ventas"}
                    </p>
                  </div>
                </div>
              </motion.div>              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/20 overflow-hidden">
                  <div
                    className={`p-6 ${
                      isCashRegisterClosed
                        ? "bg-gradient-to-br from-emerald-500 to-green-600"
                        : "bg-gradient-to-br from-amber-500 to-amber-600"
                    }`}
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-white/20 backdrop-blur-sm">
                      {isCashRegisterClosed ? (
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      ) : (
                        <Clock className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {isCashRegisterClosed ? "Cerrada" : "Abierta"}
                    </div>
                    <p className="text-sm text-white/90">
                      {isCashRegisterClosed ? "Caja cerrada correctamente" : "Pendiente de cierre"}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>            {/* Contenido principal con tabs */}
            <Tabs
              defaultValue="resumen"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-5 w-full max-w-2xl mb-6 bg-card/50 backdrop-blur-sm border border-border/20 rounded-xl p-1 shadow-lg">
                <TabsTrigger 
                  value="resumen" 
                  className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <BarChart3 className="h-4 w-4" />
                  Resumen
                </TabsTrigger>
                <TabsTrigger 
                  value="metodos-pago" 
                  className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <CreditCard className="h-4 w-4" />
                  Métodos
                </TabsTrigger>
                <TabsTrigger 
                  value="cajeros" 
                  className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <User className="h-4 w-4" />
                  Cajeros
                </TabsTrigger>
                <TabsTrigger 
                  value="productos" 
                  className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Package className="h-4 w-4" />
                  Productos
                </TabsTrigger>
                <TabsTrigger 
                  value="historial" 
                  className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Clock className="h-4 w-4" />
                  Historial
                </TabsTrigger>
              </TabsList>

              <TabsContent value="resumen" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Métodos de pago (resumen) */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >                    <Card className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/20 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                        <CardTitle className="text-lg font-bold flex items-center">
                          <PieChart className="h-5 w-5 mr-2" />
                          Métodos de Pago
                        </CardTitle>
                        <CardDescription className="text-white/90 mt-1">Distribución de ventas por método de pago</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {hasData ? (                          <div className="space-y-4">
                            {dailySummary.paymentMethods.map((method) => (
                              <div key={method.method} className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                                <div className="flex items-center">
                                  <div className={`p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 ${method.color}`}>
                                    {method.icon}
                                  </div>
                                  <div className="ml-4">
                                    <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{method.method}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{method.count} transacciones</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(method.amount)}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {Math.round((method.amount / dailySummary.totalSales) * 100)}%
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>                        ) : (
                          <div className="text-center py-12">
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                              <AlertTriangle className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Sin datos disponibles</h3>
                            <p className="text-gray-600 dark:text-gray-400">No hay ventas registradas para esta fecha</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Cajeros (resumen) */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >                    <Card className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/20 overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 text-white">
                        <CardTitle className="text-lg font-bold flex items-center">
                          <Users className="h-5 w-5 mr-2" />
                          Ventas por Cajero
                        </CardTitle>
                        <CardDescription className="text-white/90 mt-1">Rendimiento de cada cajero</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {hasData && dailySummary.cashiers.length > 0 ? (                          <div className="space-y-4">
                            {dailySummary.cashiers.map((cashier) => (
                              <div key={cashier.id} className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                                <div className="flex items-center">
                                  <div className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400">
                                    <User className="h-4 w-4" />
                                  </div>
                                  <div className="ml-4">
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{cashier.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{cashier.transactions} ventas</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(cashier.sales)}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {Math.round((cashier.sales / dailySummary.totalSales) * 100)}%
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>                        ) : (
                          <div className="text-center py-12">
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                              <AlertTriangle className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Sin datos disponibles</h3>
                            <p className="text-gray-600 dark:text-gray-400">No hay ventas registradas para esta fecha</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Productos más vendidos (resumen) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >                  <Card className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/20 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
                      <CardTitle className="text-lg font-bold flex items-center">
                        <Package className="h-5 w-5 mr-2" />
                        Productos Más Vendidos
                      </CardTitle>
                      <CardDescription className="text-white/90 mt-1">Top 5 productos por cantidad vendida</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {hasData && dailySummary.topProducts.length > 0 ? (                        <div className="overflow-x-auto">
                          <Table className="w-full">
                            <TableHeader>
                              <TableRow className="border-border/20">
                                <TableHead className="text-left font-semibold text-gray-700 dark:text-gray-300">Producto</TableHead>
                                <TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">Cantidad</TableHead>
                                <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Precio Unitario</TableHead>
                                <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {isLoadingDetails ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-12">
                                    <div className="flex flex-col items-center">
                                      <div className="relative mb-4">
                                        <div className="w-12 h-12 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-spin"></div>
                                        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin"></div>
                                      </div>
                                      <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando productos...</p>
                                    </div>
                                  </TableCell>
                                </TableRow>                              ) : (
                                dailySummary.topProducts.map((product) => (
                                  <TableRow key={product.id} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                    <TableCell className="font-medium text-left text-gray-900 dark:text-gray-100">{product.name}</TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex items-center justify-center">
                                        <span className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-semibold border border-purple-200 dark:border-purple-800/50">{product.quantity}</span>
                                        {getSaleTypeBadge(product.isWholesale || false)}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right text-gray-900 dark:text-gray-100">
                                      {formatCurrency(product.total / product.quantity)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100">
                                      {formatCurrency(product.total)}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>                      ) : (
                        <div className="text-center py-16">
                          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Sin datos disponibles</h3>
                          <p className="text-gray-600 dark:text-gray-400">No hay ventas registradas para esta fecha</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Cierre de caja */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >                  <Card
                    className={`bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/20 overflow-hidden ${isCashRegisterClosed ? "opacity-90" : ""}`}
                  >
                    <CardHeader className={`p-6 text-white ${isCashRegisterClosed ? "bg-gradient-to-r from-emerald-500 to-green-600" : "bg-gradient-to-r from-amber-500 to-orange-600"}`}>
                      <CardTitle className="text-lg font-bold flex items-center">
                        {isCashRegisterClosed ? (
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                        ) : (
                          <Clock className="h-5 w-5 mr-2" />
                        )}
                        {isCashRegisterClosed ? "Caja Cerrada" : "Cierre de Caja"}
                      </CardTitle>
                      <CardDescription className="text-white/90 mt-1">
                        {isCashRegisterClosed
                          ? "La caja ha sido cerrada correctamente"
                          : "Registre el cierre de caja del día"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {isCashRegisterClosed ? (                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800/50">
                              <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Efectivo Disponible</p>
                              <p className="text-xl font-bold text-green-800 dark:text-green-200">
                                {formatCurrency(cierreCajaData?.saldo_efectivo ?? dailySummary.totalSales)}
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800/50">
                              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Fecha de Cierre</p>
                              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                {cierreCajaData?.fecha_cierre
                                  ? new Date(cierreCajaData.fecha_cierre).toLocaleString()
                                  : new Date().toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800/50">
                              <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Cerrado por</p>
                              <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                                {cierreCajaData?.cajero_id
                                  ? cashierNames[cierreCajaData.cajero_id] || `Cajero #${cierreCajaData.cajero_id}`
                                  : "Administrador"}
                              </p>
                            </div>
                          </div>                          {cierreCajaData?.observaciones && (
                            <div className="mt-6">
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notas:</p>
                              <div className="bg-gray-50/80 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                                <p className="text-gray-700 dark:text-gray-300">{cierreCajaData.observaciones}</p>
                              </div>
                            </div>
                          )}
                        </div>                      ) : (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Saldo en Efectivo
                              </label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  className="h-11 pl-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200"
                                  value={cashBalance}
                                  onChange={(e) => setCashBalance(e.target.value)}
                                />
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                Ingrese el monto total en efectivo al cierre
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Notas de Cierre
                              </label>
                              <Input
                                placeholder="Observaciones (opcional)"
                                className="h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200"
                                value={cashRegisterNotes}
                                onChange={(e) => setCashRegisterNotes(e.target.value)}
                              />
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                Agregue cualquier observación relevante
                              </p>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50">
                            <div className="flex items-start">
                              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-amber-800 dark:text-amber-300">Verificación de cierre</p>
                                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                  Asegúrese de haber registrado todas las ventas del día antes de cerrar la caja. Esta
                                  acción no se puede deshacer.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>                    {!isCashRegisterClosed && (
                      <CardFooter className="flex justify-end pt-6 border-t border-gray-200/80 dark:border-gray-700/80 bg-gradient-to-r from-gray-50/50 to-purple-50/20 dark:from-gray-800/50 dark:to-purple-900/10">
                        <Button
                          onClick={handleCloseCashRegister}
                          disabled={isClosingCashRegister}
                          className="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-500 dark:to-orange-500 hover:from-amber-700 hover:to-orange-700 dark:hover:from-amber-600 dark:hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-xl"
                        >
                          {isClosingCashRegister ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Cerrar Caja
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </motion.div>
              </TabsContent>              <TabsContent value="metodos-pago" className="space-y-6">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                    <CardTitle className="text-lg font-bold flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Detalle por Método de Pago
                    </CardTitle>
                    <CardDescription className="text-white/90 mt-1">Análisis detallado de ventas por método de pago</CardDescription>
                  </CardHeader>
                  <CardContent>                    {hasData ? (
                      <div className="space-y-8">
                        {dailySummary.paymentMethods.map((method) => (
                          <div key={method.method} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                                  {method.icon}
                                </div>
                                <div className="ml-4">
                                  <h3 className="font-bold text-gray-900 dark:text-gray-100 capitalize">{method.method}</h3>
                                </div>
                              </div>
                              <Badge variant="outline" className="font-medium bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                                {method.count} transacciones
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-900/20 p-4 rounded-xl border border-gray-200 dark:border-gray-700/50">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Total Ventas
                                </p>
                                <p className="text-xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                                  {formatCurrency(method.amount)}
                                </p>
                              </div>

                              <div className="bg-gradient-to-br from-gray-50/50 to-blue-50/50 dark:from-gray-900/30 dark:to-blue-900/10 p-4 rounded-xl border border-gray-200 dark:border-gray-700/50">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Porcentaje
                                </p>
                                <p className="text-xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                                  {Math.round((method.amount / dailySummary.totalSales) * 100)}%
                                </p>
                              </div>

                              <div className="bg-gradient-to-br from-gray-50/30 to-blue-50/30 dark:from-gray-900/20 dark:to-blue-900/5 p-4 rounded-xl border border-gray-200 dark:border-gray-700/50">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Ticket Promedio
                                </p>
                                <p className="text-xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                                  {formatCurrency(method.amount / method.count)}
                                </p>
                              </div>
                            </div>

                            <Separator className="my-4 bg-gray-200 dark:bg-gray-700" />
                          </div>
                        ))}                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                          <AlertTriangle className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Sin datos disponibles</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          No hay ventas registradas para esta fecha. Seleccione otra fecha o registre ventas para ver
                          estadísticas.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cajeros" className="space-y-6">                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 text-white">
                    <CardTitle className="text-lg font-bold flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Rendimiento por Cajero
                    </CardTitle>
                    <CardDescription className="text-white/90 mt-1">Análisis detallado de ventas por cajero</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {hasData && dailySummary.cashiers.length > 0 ? (
                      <div className="space-y-8">
                        {dailySummary.cashiers.map((cashier, index) => (
                          <div key={cashier.id} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                  <User className="h-5 w-5" />
                                </div>
                                <div className="ml-3">
                                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                    {cashier.name}
                                  </h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">ID: {cashier.id}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="font-normal">
                                {cashier.transactions} ventas
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Ventas</p>
                                <p className="text-xl font-bold mt-1 text-blue-800 dark:text-blue-200">
                                  {formatCurrency(cashier.sales)}
                                </p>
                              </div>

                              <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Porcentaje</p>
                                <p className="text-xl font-bold mt-1 text-blue-800 dark:text-blue-200">
                                  {Math.round((cashier.sales / dailySummary.totalSales) * 100)}%
                                </p>
                              </div>

                              <div className="p-4 rounded-lg bg-blue-50/30 dark:bg-blue-900/5 border border-blue-100 dark:border-blue-900/30">
                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Ticket Promedio</p>
                                <p className="text-xl font-bold mt-1 text-blue-800 dark:text-blue-200">
                                  {formatCurrency(cashier.averageTicket)}
                                </p>
                              </div>
                            </div>

                            {index < dailySummary.cashiers.length - 1 && <Separator className="my-4" />}
                          </div>
                        ))}
                      </div>                    ) : (
                      <div className="text-center py-16">
                        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                          <AlertTriangle className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Sin datos disponibles</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          No hay ventas registradas para esta fecha. Seleccione otra fecha o registre ventas para ver
                          estadísticas.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="productos" className="space-y-6">                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
                    <CardTitle className="text-lg font-bold flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Productos Vendidos
                    </CardTitle>
                    <CardDescription className="text-white/90 mt-1">Listado completo de productos vendidos en el día</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {hasData && dailySummary.topProducts.length > 0 ? (                      <div className="overflow-x-auto">
                        <Table className="w-full">
                          <TableHeader>
                            <TableRow className="border-gray-200 dark:border-gray-700">
                              <TableHead className="text-left font-semibold text-gray-700 dark:text-gray-300">Producto</TableHead>
                              <TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">Cantidad</TableHead>
                              <TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">Tipo de Venta</TableHead>
                              <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Precio Unitario</TableHead>
                              <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoadingDetails ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                  <div className="flex flex-col items-center">
                                    <div className="relative mb-4">
                                      <div className="w-12 h-12 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-spin"></div>
                                      <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin"></div>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando productos...</p>
                                  </div>
                                </TableCell>
                              </TableRow>                            ) : (
                              dailySummary.topProducts.map((product) => (
                                <TableRow key={product.id} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                  <TableCell className="font-medium text-left text-gray-900 dark:text-gray-100">{product.name}</TableCell>
                                  <TableCell className="text-center">
                                    <span className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-semibold border border-purple-200 dark:border-purple-800/50">{product.quantity}</span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {product.isWholesale ? (
                                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30">
                                        <Warehouse className="h-3 w-3 mr-1" /> Mayorista
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30">
                                        <Store className="h-3 w-3 mr-1" /> Minorista
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right text-gray-900 dark:text-gray-100">
                                    {formatCurrency(product.total / product.quantity)}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(product.total)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>                    ) : (
                      <div className="text-center py-16">
                        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                          <AlertTriangle className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Sin datos disponibles</h3>
                        <p className="text-gray-600 dark:text-gray-400">No hay ventas registradas para esta fecha</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historial" className="space-y-6">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
                    <CardTitle className="text-lg font-bold flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Historial de Cierres de Caja
                    </CardTitle>
                    <CardDescription className="text-white/90 mt-1">
                      Registro de todas las cajas cerradas por rango de fechas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Filtros de fecha */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fecha Inicio
                        </label>
                        <Input
                          type="date"
                          value={fechaInicioHistorial}
                          onChange={(e) => setFechaInicioHistorial(e.target.value)}
                          className="h-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-lg shadow-sm focus:shadow-md focus:border-orange-300 dark:focus:border-orange-600 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fecha Fin
                        </label>
                        <Input
                          type="date"
                          value={fechaFinHistorial}
                          onChange={(e) => setFechaFinHistorial(e.target.value)}
                          className="h-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-lg shadow-sm focus:shadow-md focus:border-orange-300 dark:focus:border-orange-600 transition-all duration-200"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={cargarHistorialCierres}
                          disabled={isLoadingHistorial}
                          className="bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-500 dark:to-red-500 hover:from-orange-700 hover:to-red-700 dark:hover:from-orange-600 dark:hover:to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed h-10 px-6 rounded-lg"
                        >
                          {isLoadingHistorial ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Cargando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Actualizar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Tabla de historial */}
                    {isLoadingHistorial ? (
                      <div className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <div className="relative mb-4">
                            <div className="w-12 h-12 border-4 border-orange-200 dark:border-orange-800 rounded-full animate-spin"></div>
                            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-orange-600 dark:border-t-orange-400 rounded-full animate-spin"></div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando historial...</p>
                        </div>
                      </div>
                    ) : historialCierres.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table className="w-full">
                          <TableHeader>
                            <TableRow className="border-gray-200 dark:border-gray-700">
                              <TableHead className="text-left font-semibold text-gray-700 dark:text-gray-300">Fecha Apertura</TableHead>
                              <TableHead className="text-left font-semibold text-gray-700 dark:text-gray-300">Fecha Cierre</TableHead>
                              <TableHead className="text-left font-semibold text-gray-700 dark:text-gray-300">Cajero</TableHead>
                              <TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">Estado</TableHead>
                              <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Saldo Efectivo</TableHead>
                              <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Total Efectivo</TableHead>
                              <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Total Tarjeta</TableHead>
                              <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Total Yape</TableHead>
                              <TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">Ventas</TableHead>
                              <TableHead className="text-left font-semibold text-gray-700 dark:text-gray-300">Observaciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {historialCierres.map((cierre) => (
                              <TableRow key={cierre.id_cierre} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                                  {moment(cierre.fecha_apertura).format("DD/MM/YYYY")}
                                </TableCell>
                                <TableCell className="text-gray-900 dark:text-gray-100">
                                  {cierre.fecha_cierre ? moment(cierre.fecha_cierre).format("DD/MM/YYYY HH:mm") : "N/A"}
                                </TableCell>
                                <TableCell className="text-gray-900 dark:text-gray-100">
                                  {cashierNames[cierre.cajero_id] || `Cajero #${cierre.cajero_id}`}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className={`${
                                    cierre.estado === "cerrado" 
                                      ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30" 
                                      : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/30"
                                  }`}>
                                    {cierre.estado === "cerrado" ? (
                                      <>
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Cerrado
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="h-3 w-3 mr-1" />
                                        Abierto
                                      </>
                                    )}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100">
                                  {formatCurrency(cierre.saldo_efectivo)}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100">
                                  {formatCurrency(cierre.total_efectivo)}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100">
                                  {formatCurrency(cierre.total_tarjeta)}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-gray-900 dark:text-gray-100">
                                  {formatCurrency(cierre.total_yape)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-sm font-semibold border border-orange-200 dark:border-orange-800/50">
                                    {cierre.cantidad_ventas}
                                  </span>
                                </TableCell>
                                <TableCell className="text-gray-900 dark:text-gray-100 max-w-xs truncate">
                                  {cierre.observaciones || "Sin observaciones"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                          <AlertTriangle className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Sin datos disponibles</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          No hay cierres de caja registrados para el rango de fechas seleccionado
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default DailyCashPage
