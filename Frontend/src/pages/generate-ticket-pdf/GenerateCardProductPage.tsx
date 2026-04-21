"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Checkbox } from "../../components/ui/checkbox"
import { Separator } from "../../components/ui/separator"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import {
  Filter,
  Settings,
  Package,
  Barcode,
  DollarSign,
  Tag,
  Palette,
  Search,
  FileText,
  Printer,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  List,
  Grid,
  CheckSquare,
  ArrowUpDown,
} from "lucide-react"
import { type Product, fetchProducts } from "../../services/productService"
import { obtenerCodigosBarrasDisponibles } from "../../services/codigoBarrasService"
import { PDFWrapper } from "../../components/pdf-wrapper"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"

interface TicketConfig {
  mostrarImagen: boolean
  mostrarCodigoBarras: boolean
  mostrarPrecioUnitario: boolean
  mostrarPrecioMayorista: boolean
  mostrarPrecioOferta: boolean
  tamanoFuente: number
  colorFondo: string
  colorTexto: string
  margenInterno: number
}

interface FiltrosProductos {
  categoria: string
  precioMin: string
  precioMax: string
  soloConStock: boolean
  soloOfertas: boolean
  busqueda: string
  ordenamiento: string
}

const PRODUCTOS_POR_PAGINA = 25 // Reducido para mejor rendimiento

const GenerateCardProductPage = () => {
  // Configurar título de la página
  useDocumentTitle("Generar Tarjetas de Productos")
  
  const [productos, setProductos] = useState<Product[]>([])
  const [productosFiltrados, setProductosFiltrados] = useState<Product[]>([])
  const [productosSeleccionados, setProductosSeleccionados] = useState<Set<number>>(new Set())
  const [codigosBarras, setCodigosBarras] = useState<Record<number, string[]>>({})
  const [cargando, setCargando] = useState(true)
  const [] = useState(false)
  const [errorPDF, setErrorPDF] = useState<string | null>(null)
  const [vistaTabla, setVistaTabla] = useState(true) // Nueva vista por defecto
  const [paginaActual, setPaginaActual] = useState(1)
  const [categorias, setCategorias] = useState<string[]>([])

  // Configuración del ticket (sin selector de fuente)
  const [config, setConfig] = useState<TicketConfig>({
    mostrarImagen: false,
    mostrarCodigoBarras: true,
    mostrarPrecioUnitario: true,
    mostrarPrecioMayorista: true,
    mostrarPrecioOferta: true,
    tamanoFuente: 12,
    colorFondo: "#ffffff",
    colorTexto: "#000000",
    margenInterno: 10,
  })

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosProductos>({
    categoria: "",
    precioMin: "",
    precioMax: "",
    soloConStock: true,
    soloOfertas: false,
    busqueda: "",
    ordenamiento: "id_desc", // Por defecto, últimos agregados primero
  })

  // Función para validar producto
  const validarProducto = useCallback((producto: any): producto is Product => {
    return (
      producto &&
      typeof producto === "object" &&
      producto.id_producto &&
      typeof producto.id_producto === "number" &&
      producto.nombre &&
      typeof producto.nombre === "string" &&
      producto.sku &&
      typeof producto.sku === "string"
    )
  }, [])

  // Aplicar filtros cuando cambien
  useEffect(() => {
    aplicarFiltros()
  }, [productos, filtros])

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setPaginaActual(1)
  }, [filtros])

  const aplicarFiltros = useCallback(() => {
    try {
      let productosFiltrados = productos.filter(validarProducto)

      // Filtro por búsqueda
      if (filtros.busqueda.trim()) {
        const busquedaLower = filtros.busqueda.toLowerCase().trim()
        productosFiltrados = productosFiltrados.filter(
          (p) => p.nombre.toLowerCase().includes(busquedaLower) || p.sku.toLowerCase().includes(busquedaLower),
        )
      }

      // Filtro por categoría - FIXED
      if (filtros.categoria && filtros.categoria !== "todas") {
        productosFiltrados = productosFiltrados.filter((p) => {
          const categoriaProducto = p.categoria?.nombre || "sin_categoria"
          return (
            categoriaProducto === filtros.categoria || (filtros.categoria === "sin_categoria" && !p.categoria?.nombre)
          )
        })
      }

      // Rest of your filters remain the same...
      if (filtros.precioMin.trim()) {
        const precioMin = Number.parseFloat(filtros.precioMin)
        if (!isNaN(precioMin)) {
          productosFiltrados = productosFiltrados.filter((p) => {
            const precio = Number.parseFloat(p.precio_unitario_con_igv || "0")
            return !isNaN(precio) && precio >= precioMin
          })
        }
      }

      if (filtros.precioMax.trim()) {
        const precioMax = Number.parseFloat(filtros.precioMax)
        if (!isNaN(precioMax)) {
          productosFiltrados = productosFiltrados.filter((p) => {
            const precio = Number.parseFloat(p.precio_unitario_con_igv || "0")
            return !isNaN(precio) && precio <= precioMax
          })
        }
      }

      if (filtros.soloConStock) {
        productosFiltrados = productosFiltrados.filter((p) => (p.stock || 0) > 0)
      }

      if (filtros.soloOfertas) {
        productosFiltrados = productosFiltrados.filter((p) => Boolean(p.es_oferta))
      }

      // Aplicar ordenamiento
      productosFiltrados = productosFiltrados.sort((a, b) => {
        switch (filtros.ordenamiento) {
          case "id_desc":
            return b.id_producto - a.id_producto // Últimos agregados primero
          case "id_asc":
            return a.id_producto - b.id_producto // Primeros agregados primero
          case "name_asc":
            return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }) // A-Z
          case "name_desc":
            return b.nombre.localeCompare(a.nombre, "es", { sensitivity: "base" }) // Z-A
          case "updated_desc":
            // Últimos modificados primero (si existe el campo actualizado_en)
            return new Date(b.actualizado_en || b.creado_en).getTime() - new Date(a.actualizado_en || a.creado_en).getTime()
          case "updated_asc":
            // Primeros modificados primero
            return new Date(a.actualizado_en || a.creado_en).getTime() - new Date(b.actualizado_en || b.creado_en).getTime()
          case "precio_asc":
            // Precio menor a mayor
            return Number.parseFloat(a.precio_unitario_con_igv || "0") - Number.parseFloat(b.precio_unitario_con_igv || "0")
          case "precio_desc":
            // Precio mayor a menor
            return Number.parseFloat(b.precio_unitario_con_igv || "0") - Number.parseFloat(a.precio_unitario_con_igv || "0")
          case "stock_asc":
            return (a.stock || 0) - (b.stock || 0) // Stock menor a mayor
          case "stock_desc":
            return (b.stock || 0) - (a.stock || 0) // Stock mayor a menor
          default:
            return b.id_producto - a.id_producto // Por defecto: últimos agregados primero
        }
      })

      setProductosFiltrados(productosFiltrados)
    } catch (error) {
      console.error("Error al aplicar filtros:", error)
      setProductosFiltrados([])
    }
  }, [productos, filtros, validarProducto])

  // Calcular productos para la página actual
  const productosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA
    const fin = inicio + PRODUCTOS_POR_PAGINA
    return productosFiltrados.slice(inicio, fin)
  }, [productosFiltrados, paginaActual])

  const totalPaginas = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA)

  const toggleProductoSeleccionado = useCallback((idProducto: number) => {
    setProductosSeleccionados((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(idProducto)) {
        newSet.delete(idProducto)
      } else {
        newSet.add(idProducto)
      }
      return newSet
    })
    setErrorPDF(null) // Limpiar errores previos
  }, [])

  const seleccionarTodos = useCallback(() => {
    const idsValidos = productosFiltrados.filter(validarProducto).map((p) => p.id_producto)
    setProductosSeleccionados(new Set(idsValidos))
    setErrorPDF(null)
  }, [productosFiltrados, validarProducto])

  const seleccionarPaginaActual = useCallback(() => {
    const idsValidos = productosPaginados.filter(validarProducto).map((p) => p.id_producto)
    setProductosSeleccionados((prev) => {
      const newSet = new Set(prev)
      idsValidos.forEach((id) => newSet.add(id))
      return newSet
    })
    setErrorPDF(null)
  }, [productosPaginados, validarProducto])

  const deseleccionarTodos = useCallback(() => {
    setProductosSeleccionados(new Set())
    setErrorPDF(null)
  }, [])

  const cargarProductos = async () => {
    try {
      setCargando(true)
      setErrorPDF(null)

      const productosData = await fetchProducts()
      const productosValidos = productosData.filter(validarProducto)
      setProductos(productosValidos)

      // Extraer categorías únicas - FIXED
      const categoriasUnicas = [
        ...new Set(
          productosValidos
            .map((p) => p.categoria?.nombre) // Extract the nombre property
            .filter((nombre): nombre is string => Boolean(nombre)), // Type guard to ensure string type
        ),
      ]
      setCategorias(categoriasUnicas.sort())

      // Cargar códigos de barras solo para la primera página (carga lazy)
      const codigosData: Record<number, string[]> = {}
      const primerosProductos = productosValidos.slice(0, PRODUCTOS_POR_PAGINA)
      
      await Promise.all(
        primerosProductos.map(async (producto) => {
          try {
            const codigos = await obtenerCodigosBarrasDisponibles(producto.id_producto)
            codigosData[producto.id_producto] = Array.isArray(codigos) ? codigos : []
          } catch (error) {
            console.warn(`Error al cargar códigos para producto ${producto.id_producto}:`, error)
            codigosData[producto.id_producto] = []
          }
        })
      )
      
      setCodigosBarras(codigosData)
    } catch (error) {
      console.error("Error al cargar productos:", error)
      setErrorPDF("Error al cargar productos. Por favor, recarga la página.")
    } finally {
      setCargando(false)
    }
  }

  // Cargar productos al montar el componente
  useEffect(() => {
    cargarProductos()
  }, [])

  // Función para cargar códigos de barras de forma lazy
  const cargarCodigosBarrasPagina = useCallback(async (productos: Product[]) => {
    const productosNecesarios = productos.filter(p => !codigosBarras[p.id_producto])
    
    if (productosNecesarios.length === 0) return

    const codigosData: Record<number, string[]> = { ...codigosBarras }
    
    await Promise.all(
      productosNecesarios.map(async (producto) => {
        try {
          const codigos = await obtenerCodigosBarrasDisponibles(producto.id_producto)
          codigosData[producto.id_producto] = Array.isArray(codigos) ? codigos : []
        } catch (error) {
          console.warn(`Error al cargar códigos para producto ${producto.id_producto}:`, error)
          codigosData[producto.id_producto] = []
        }
      })
    )
    
    setCodigosBarras(codigosData)
  }, [codigosBarras])

  // Cargar códigos cuando cambie la página
  useEffect(() => {
    if (productosPaginados.length > 0) {
      cargarCodigosBarrasPagina(productosPaginados)
    }
  }, [paginaActual, productosFiltrados, cargarCodigosBarrasPagina])

  // Función para cargar códigos de barras para productos seleccionados
  const cargarCodigosProductosSeleccionados = useCallback(async () => {
    const productosSeleccionadosArray = productos.filter(p => productosSeleccionados.has(p.id_producto))
    const productosNecesarios = productosSeleccionadosArray.filter(p => !codigosBarras[p.id_producto])
    
    if (productosNecesarios.length === 0) return

    const codigosData: Record<number, string[]> = { ...codigosBarras }
    
    // Cargar en lotes de 20 para evitar sobrecarga
    const LOTE_SIZE = 20
    for (let i = 0; i < productosNecesarios.length; i += LOTE_SIZE) {
      const lote = productosNecesarios.slice(i, i + LOTE_SIZE)
      
      await Promise.all(
        lote.map(async (producto) => {
          try {
            const codigos = await obtenerCodigosBarrasDisponibles(producto.id_producto)
            codigosData[producto.id_producto] = Array.isArray(codigos) ? codigos : []
          } catch (error) {
            console.warn(`Error al cargar códigos para producto ${producto.id_producto}:`, error)
            codigosData[producto.id_producto] = []
          }
        })
      )
    }
    
    setCodigosBarras(codigosData)
  }, [productos, productosSeleccionados, codigosBarras])

  const obtenerPrecioMostrar = useCallback((producto: any, tipo: "unitario" | "mayorista" | "oferta") => {
    let precio = 0

    try {
      switch (tipo) {
        case "unitario":
          precio = Number.parseFloat(producto.precio_unitario_con_igv || "0")
          break
        case "mayorista":
          precio = Number.parseFloat(producto.precio_mayoritario_con_igv || "0")
          break
        case "oferta":
          precio = Number.parseFloat(producto.precio_oferta_con_igv || "0")
          break
      }

      if (isNaN(precio)) precio = 0
    } catch (error) {
      console.warn(`Error al obtener precio ${tipo}:`, error)
      precio = 0
    }

    const parteEntera = Math.floor(precio)
    const parteDecimal = Math.abs(precio - parteEntera)
      .toFixed(2)
      .substring(2)

    return { parteEntera, parteDecimal, precioCompleto: precio }
  }, [])

  const formatearPrecioCodificado = useCallback((precio: number, sku: string) => {
    try {
      const precioSeguro = isNaN(precio) ? 0 : precio
      // Quitar el punto decimal del precio mayorista (convertir a centavos)
      const precioSinDecimal = Math.round(precioSeguro * 100)

      // Usar el SKU dividido
      const skuLimpio = sku.replace(/[^a-zA-Z0-9]/g, "") // Quitar caracteres especiales
      if (skuLimpio.length === 0) {
        return `${precioSinDecimal}` // Si no hay SKU válido, solo el precio
      }

      const mitad = Math.ceil(skuLimpio.length / 2)
      const primeraParte = skuLimpio.substring(0, mitad)
      const segundaParte = skuLimpio.substring(mitad)

      return `${primeraParte}${precioSinDecimal}${segundaParte}`
    } catch (error) {
      console.warn("Error al formatear precio:", error)
      return `${sku}0`
    }
  }, [])

  // Memoizar los productos seleccionados para el PDF con validaciones mejoradas

  if (cargando) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="flex items-center justify-center min-h-[60vh] bg-card/50 backdrop-blur-sm rounded-2xl border border-border/20 shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center space-y-4">
              <div className="relative">
                <Package className="h-16 w-16 mx-auto text-blue-600 dark:text-blue-400 animate-pulse" />
                <div className="absolute inset-0 h-16 w-16 mx-auto border-4 border-blue-600/20 dark:border-blue-400/20 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Cargando productos...</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Obteniendo información de productos y códigos de barras
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <motion.div
        className="max-w-7xl mx-auto space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header mejorado */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Generador de Tickets PDF
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Crea tickets personalizados para tus productos con códigos de barras y precios codificados
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 px-4 py-2"
            >
              <FileText className="h-4 w-4 mr-2" />
              {productosSeleccionados.size} productos seleccionados
            </Badge>
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Sistema de tickets</span>
            </div>
          </div>
        </motion.div>

        {/* Mostrar error si existe */}
        {errorPDF && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error:</span>
              <span>{errorPDF}</span>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Panel de Filtros y Configuración - Sidebar */}
          <motion.div
            className="xl:col-span-1 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border border-border/20 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Configuración
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="filtros" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <TabsTrigger
                      value="filtros"
                      className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200"
                    >
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">Filtros</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="config"
                      className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200"
                    >
                      <Palette className="h-4 w-4" />
                      <span className="hidden sm:inline">Diseño</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Filtros */}
                  <TabsContent value="filtros" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      {/* Búsqueda mejorada */}
                      <div className="space-y-2">
                        <Label htmlFor="busqueda" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Buscar producto
                        </Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="busqueda"
                            placeholder="Nombre o SKU..."
                            value={filtros.busqueda}
                            onChange={(e) => setFiltros((prev) => ({ ...prev, busqueda: e.target.value }))}
                            className="pl-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-lg shadow-sm focus:shadow-md focus:border-blue-300 dark:focus:border-blue-600 transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Filtro por categoría */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</Label>
                        <Select
                          value={filtros.categoria}
                          onValueChange={(value) => setFiltros((prev) => ({ ...prev, categoria: value }))}
                        >
                          <SelectTrigger className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-lg shadow-sm focus:shadow-md focus:border-blue-300 dark:focus:border-blue-600 transition-all duration-200">
                            <SelectValue placeholder="Todas las categorías" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todas">Todas las categorías</SelectItem>
                            {categorias.map((categoria) => (
                              <SelectItem key={categoria} value={categoria || "sin_categoria"}>
                                {categoria || "Sin categoría"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filtro de ordenamiento */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <ArrowUpDown className="h-4 w-4" />
                          Ordenar por
                        </Label>
                        <Select
                          value={filtros.ordenamiento}
                          onValueChange={(value) => setFiltros((prev) => ({ ...prev, ordenamiento: value }))}
                        >
                          <SelectTrigger className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-lg shadow-sm focus:shadow-md focus:border-blue-300 dark:focus:border-blue-600 transition-all duration-200">
                            <SelectValue placeholder="Seleccionar orden" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="id_desc">Últimos agregados</SelectItem>
                            <SelectItem value="id_asc">Primeros agregados</SelectItem>
                            <SelectItem value="updated_desc">Últimos modificados</SelectItem>
                            <SelectItem value="updated_asc">Primeros modificados</SelectItem>
                            <SelectItem value="name_asc">Nombre A-Z</SelectItem>
                            <SelectItem value="name_desc">Nombre Z-A</SelectItem>
                            <SelectItem value="precio_asc">Precio menor a mayor</SelectItem>
                            <SelectItem value="precio_desc">Precio mayor a menor</SelectItem>
                            <SelectItem value="stock_asc">Stock menor a mayor</SelectItem>
                            <SelectItem value="stock_desc">Stock mayor a menor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Rango de precios mejorado */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rango de precios</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Input
                              type="number"
                              placeholder="Mín."
                              value={filtros.precioMin}
                              onChange={(e) => setFiltros((prev) => ({ ...prev, precioMin: e.target.value }))}
                              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-lg shadow-sm focus:shadow-md focus:border-blue-300 dark:focus:border-blue-600 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <Input
                              type="number"
                              placeholder="Máx."
                              value={filtros.precioMax}
                              onChange={(e) => setFiltros((prev) => ({ ...prev, precioMax: e.target.value }))}
                              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-lg shadow-sm focus:shadow-md focus:border-blue-300 dark:focus:border-blue-600 transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Checkboxes mejorados */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Opciones de filtrado
                        </Label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                            <Checkbox
                              id="soloConStock"
                              checked={filtros.soloConStock}
                              onCheckedChange={(checked) =>
                                setFiltros((prev) => ({ ...prev, soloConStock: checked as boolean }))
                              }
                              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <Label
                              htmlFor="soloConStock"
                              className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                            >
                              Solo con stock disponible
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                            <Checkbox
                              id="soloOfertas"
                              checked={filtros.soloOfertas}
                              onCheckedChange={(checked) =>
                                setFiltros((prev) => ({ ...prev, soloOfertas: checked as boolean }))
                              }
                              className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                            />
                            <Label
                              htmlFor="soloOfertas"
                              className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                            >
                              Solo productos en oferta
                            </Label>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {/* Botones de selección mejorados */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Selección masiva</Label>
                        <div className="grid grid-cols-1 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={seleccionarTodos}
                            className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all duration-200"
                          >
                            Todos ({productosFiltrados.length})
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={seleccionarPaginaActual}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-200"
                          >
                            Página actual ({productosPaginados.length})
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={deseleccionarTodos}
                            className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:from-gray-100 hover:to-slate-100 dark:hover:from-gray-800 dark:hover:to-slate-800 transition-all duration-200"
                          >
                            Deseleccionar todos
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Configuración de diseño */}
                  <TabsContent value="config" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      {/* Elementos a mostrar */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Elementos del ticket
                        </Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                            <Checkbox
                              id="mostrarCodigoBarras"
                              checked={config.mostrarCodigoBarras}
                              onCheckedChange={(checked) =>
                                setConfig((prev) => ({ ...prev, mostrarCodigoBarras: checked as boolean }))
                              }
                              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <Label
                              htmlFor="mostrarCodigoBarras"
                              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                            >
                              <Barcode className="h-4 w-4" />
                              Código de barras
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                            <Checkbox
                              id="mostrarPrecioUnitario"
                              checked={config.mostrarPrecioUnitario}
                              onCheckedChange={(checked) =>
                                setConfig((prev) => ({ ...prev, mostrarPrecioUnitario: checked as boolean }))
                              }
                              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <Label
                              htmlFor="mostrarPrecioUnitario"
                              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                            >
                              <DollarSign className="h-4 w-4" />
                              Precio unitario
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                            <Checkbox
                              id="mostrarPrecioMayorista"
                              checked={config.mostrarPrecioMayorista}
                              onCheckedChange={(checked) =>
                                setConfig((prev) => ({ ...prev, mostrarPrecioMayorista: checked as boolean }))
                              }
                              className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                            />
                            <Label
                              htmlFor="mostrarPrecioMayorista"
                              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                            >
                              <Tag className="h-4 w-4" />
                              Precio mayorista
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                            <Checkbox
                              id="mostrarPrecioOferta"
                              checked={config.mostrarPrecioOferta}
                              onCheckedChange={(checked) =>
                                setConfig((prev) => ({ ...prev, mostrarPrecioOferta: checked as boolean }))
                              }
                              className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                            />
                            <Label
                              htmlFor="mostrarPrecioOferta"
                              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                            >
                              <Tag className="h-4 w-4" />
                              Precio oferta
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Nueva opción para ofertas */}
                      {config.mostrarPrecioOferta && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Configuración de ofertas
                          </Label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 px-3">
                            Los productos con oferta muestran automáticamente el precio anterior tachado y el precio de oferta resaltado.
                          </p>
                        </div>
                      )}

                      <Separator />

                      {/* Configuración de tipografía (sin selector de fuente) */}
                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Configuración de tipografía
                        </Label>

                        {/* Información de fuente fija */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <Tag className="h-4 w-4" />
                            <span className="text-sm font-medium">Fuente: Arial (fija)</span>
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            La fuente Arial está configurada por defecto para todos los tickets
                          </p>
                        </div>

                        {/* Tamaño de fuente mejorado */}
                        <div className="space-y-3">
                          <Label
                            htmlFor="tamanoFuente"
                            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            <DollarSign className="h-4 w-4" />
                            Tamaño de fuente: {config.tamanoFuente}px
                          </Label>
                          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <Input
                              id="tamanoFuente"
                              type="range"
                              min="8"
                              max="20"
                              value={config.tamanoFuente}
                              onChange={(e) =>
                                setConfig((prev) => ({ ...prev, tamanoFuente: Number.parseInt(e.target.value) }))
                              }
                              className="w-full accent-blue-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span>8px</span>
                              <span>14px</span>
                              <span>20px</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Lista de Productos - Área principal */}
          <motion.div
            className="xl:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border border-border/20 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Productos Disponibles
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {productosFiltrados.length} productos encontrados
                      {totalPaginas > 1 && (
                        <span className="ml-2">
                          (Página {paginaActual} de {totalPaginas})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {/* Toggle vista */}
                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1">
                      <Button
                        variant={vistaTabla ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setVistaTabla(true)}
                        className="h-8 px-3"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={!vistaTabla ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setVistaTabla(false)}
                        className="h-8 px-3"
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* En lugar de los botones existentes, usa: */}
                    <PDFWrapper
                      productos={productos}
                      codigosBarras={codigosBarras}
                      config={config}
                      productosSeleccionados={productosSeleccionados}
                      onCargarCodigosBarras={cargarCodigosProductosSeleccionados}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {productosFiltrados.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <Package className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No se encontraron productos
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Ajusta los filtros para encontrar los productos que necesitas
                      </p>
                      <Button
                        onClick={() =>
                          setFiltros({
                            categoria: "",
                            precioMin: "",
                            precioMax: "",
                            soloConStock: false,
                            soloOfertas: false,
                            busqueda: "",
                            ordenamiento: "id_desc",
                          })
                        }
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Limpiar filtros
                      </Button>
                    </div>
                  </div>
                ) : vistaTabla ? (
                  // Vista de tabla para manejar muchos productos
                  <div className="space-y-4">
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                            <TableHead className="w-12">
                              <Checkbox
                                checked={productosPaginados.every((p) => productosSeleccionados.has(p.id_producto))}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    seleccionarPaginaActual()
                                  } else {
                                    const idsActuales = productosPaginados.map((p) => p.id_producto)
                                    setProductosSeleccionados((prev) => {
                                      const newSet = new Set(prev)
                                      idsActuales.forEach((id) => newSet.delete(id))
                                      return newSet
                                    })
                                  }
                                }}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                            </TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Precio Unit.</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-center">Código Barras</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productosPaginados.map((producto) => {
                            const precioUnitario = obtenerPrecioMostrar(producto, "unitario")
                            const codigoBarrasProducto = codigosBarras[producto.id_producto]?.[0]
                            const seleccionado = productosSeleccionados.has(producto.id_producto)

                            return (
                              <TableRow
                                key={producto.id_producto}
                                className={`cursor-pointer transition-colors duration-200 ${
                                  seleccionado
                                    ? "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                }`}
                                onClick={() => toggleProductoSeleccionado(producto.id_producto)}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={seleccionado}
                                    onCheckedChange={() => toggleProductoSeleccionado(producto.id_producto)}
                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  <div className="max-w-xs">
                                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                      {producto.nombre}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                    {producto.sku}
                                  </code>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {typeof producto.categoria === "string"
                                      ? producto.categoria
                                      : producto.categoria &&
                                          typeof producto.categoria === "object" &&
                                          "nombre" in producto.categoria
                                        ? producto.categoria.nombre
                                        : "Sin categoría"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="font-semibold text-sm">
                                    S/ {precioUnitario.parteEntera}.{precioUnitario.parteDecimal}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs ${
                                      producto.stock > 10
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                        : producto.stock > 0
                                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                    }`}
                                  >
                                    {producto.stock}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center gap-1">
                                    {producto.es_oferta && (
                                      <Badge variant="destructive" className="text-xs">
                                        Oferta
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {codigoBarrasProducto ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <Barcode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                        {codigoBarrasProducto.substring(0, 8)}...
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">Sin código</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Paginación */}
                    {totalPaginas > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Mostrando {(paginaActual - 1) * PRODUCTOS_POR_PAGINA + 1} a{" "}
                          {Math.min(paginaActual * PRODUCTOS_POR_PAGINA, productosFiltrados.length)} de{" "}
                          {productosFiltrados.length} productos
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                            disabled={paginaActual === 1}
                            className="flex items-center gap-1"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                              const pageNum = i + 1
                              return (
                                <Button
                                  key={pageNum}
                                  variant={paginaActual === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setPaginaActual(pageNum)}
                                  className="w-8 h-8 p-0"
                                >
                                  {pageNum}
                                </Button>
                              )
                            })}
                            {totalPaginas > 5 && (
                              <>
                                <span className="text-gray-400">...</span>
                                <Button
                                  variant={paginaActual === totalPaginas ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setPaginaActual(totalPaginas)}
                                  className="w-8 h-8 p-0"
                                >
                                  {totalPaginas}
                                </Button>
                              </>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
                            disabled={paginaActual === totalPaginas}
                            className="flex items-center gap-1"
                          >
                            Siguiente
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Vista de cards original (para cuando se prefiera)
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto pr-2">
                    <AnimatePresence>
                      {productosPaginados.map((producto, index) => {
                        const precioUnitario = obtenerPrecioMostrar(producto, "unitario")
                        const precioMayorista = obtenerPrecioMostrar(producto, "mayorista")
                        const codigoBarrasProducto = codigosBarras[producto.id_producto]?.[0]
                        const seleccionado = productosSeleccionados.has(producto.id_producto)

                        return (
                          <motion.div
                            key={producto.id_producto}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: 0.05 * index }}
                            className={`group relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                              seleccionado
                                ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 shadow-lg transform scale-105"
                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
                            }`}
                            onClick={() => toggleProductoSeleccionado(producto.id_producto)}
                          >
                            {/* Indicador de selección */}
                            {seleccionado && (
                              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full p-1 shadow-lg">
                                <CheckSquare className="h-4 w-4" />
                              </div>
                            )}

                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                                  {producto.nombre}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  SKU: {producto.sku}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1 ml-2">
                                {producto.es_oferta && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs bg-gradient-to-r from-red-600 to-rose-600 border-0"
                                  >
                                    Oferta
                                  </Badge>
                                )}
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${
                                    producto.stock > 10
                                      ? "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                                      : producto.stock > 0
                                        ? "bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700"
                                        : "bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                                  }`}
                                >
                                  Stock: {producto.stock}
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <span className="text-xs text-gray-600 dark:text-gray-400">Unitario:</span>
                                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                  S/ {precioUnitario.parteEntera}.{precioUnitario.parteDecimal}
                                </span>
                              </div>
                              {precioMayorista.precioCompleto > 0 && (
                                <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                  <span className="text-xs text-green-600 dark:text-green-400">Mayorista:</span>
                                  <span className="font-semibold text-sm text-green-700 dark:text-green-300 font-mono">
                                    {formatearPrecioCodificado(precioMayorista.precioCompleto, producto.sku)}
                                  </span>
                                </div>
                              )}
                              {codigoBarrasProducto && (
                                <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    <Barcode className="h-3 w-3" />
                                    Código:
                                  </span>
                                  <span className="font-mono text-xs text-blue-700 dark:text-blue-300">
                                    {codigoBarrasProducto.substring(0, 8)}...
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Checkbox visual */}
                            <div className="absolute bottom-2 left-2">
                              <Checkbox
                                checked={seleccionado}
                                onCheckedChange={() => toggleProductoSeleccionado(producto.id_producto)}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default GenerateCardProductPage
