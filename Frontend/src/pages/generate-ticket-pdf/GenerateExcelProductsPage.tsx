"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Label } from "../../components/ui/label"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Checkbox } from "../../components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Separator } from "../../components/ui/separator"
import { 
  Loader2, 
  Download, 
  FileSpreadsheet, 
  Package, 
  Filter,
  Search,
  ArrowUpDown,
  Settings,
  CheckSquare
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { fetchProducts } from "../../services/productService"
import { obtenerCodigosBarras } from "../../services/codigoBarrasService"
import * as XLSX from "xlsx"

interface FiltrosExcel {
  busqueda: string
  categoria: string
  soloModificados: boolean
  soloConStock: boolean
  soloOfertas: boolean
  ordenamiento: string
}

const GenerateExcelProductsPage = () => {
  // Estado de filtros unificado
  const [filtros, setFiltros] = useState<FiltrosExcel>({
    busqueda: "",
    categoria: "",
    soloModificados: false,
    soloConStock: true,
    soloOfertas: false,
    ordenamiento: "id_desc", // Por defecto, últimos agregados primero
  })

  const [categorias, setCategorias] = useState<string[]>([])
  const [productosSeleccionados, setProductosSeleccionados] = useState<Set<number>>(new Set())

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })

  // Función para validar producto
  const validarProducto = useCallback((producto: any) => {
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

  // Cargar categorías cuando se cargan los productos
  useEffect(() => {
    if (products) {
      const categoriasUnicas = [
        ...new Set(
          products
            .map((p) => p.categoria?.nombre)
            .filter((nombre): nombre is string => Boolean(nombre))
        ),
      ]
      setCategorias(categoriasUnicas.sort())
    }
  }, [products])

  // Aplicar filtros
  const aplicarFiltros = useCallback(() => {
    if (!products) return []

    try {
      let productosFiltrados = products.filter(validarProducto)

      // Filtro por búsqueda
      if (filtros.busqueda.trim()) {
        const busquedaLower = filtros.busqueda.toLowerCase().trim()
        productosFiltrados = productosFiltrados.filter(
          (p) => p.nombre.toLowerCase().includes(busquedaLower) || p.sku.toLowerCase().includes(busquedaLower)
        )
      }

      // Filtro por categoría
      if (filtros.categoria && filtros.categoria !== "todas") {
        productosFiltrados = productosFiltrados.filter((p) => {
          const categoriaProducto = p.categoria?.nombre || "sin_categoria"
          return (
            categoriaProducto === filtros.categoria || 
            (filtros.categoria === "sin_categoria" && !p.categoria?.nombre)
          )
        })
      }

      // Filtro por productos modificados
      if (filtros.soloModificados) {
        productosFiltrados = productosFiltrados.filter((product) => {
          const isModified = new Date(product.actualizado_en).getTime() > new Date(product.creado_en).getTime()
          return isModified
        })
      }

      // Filtro por stock
      if (filtros.soloConStock) {
        productosFiltrados = productosFiltrados.filter((p) => (p.stock || 0) > 0)
      }

      // Filtro por ofertas
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
            // Últimos modificados primero
            return new Date(b.actualizado_en || b.creado_en).getTime() - new Date(a.actualizado_en || a.creado_en).getTime()
          case "updated_asc":
            // Primeros modificados primero
            return new Date(a.actualizado_en || a.creado_en).getTime() - new Date(b.actualizado_en || b.creado_en).getTime()
          case "stock_asc":
            return (a.stock || 0) - (b.stock || 0) // Stock menor a mayor
          case "stock_desc":
            return (b.stock || 0) - (a.stock || 0) // Stock mayor a menor
          default:
            return b.id_producto - a.id_producto // Por defecto: últimos agregados primero
        }
      })

      return productosFiltrados
    } catch (error) {
      console.error("Error al aplicar filtros:", error)
      return []
    }
  }, [products, filtros, validarProducto])

  // Filtrar productos según criterios
  const filteredProducts = aplicarFiltros()

  // Funciones para manejar selección de productos
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
  }, [])

  const seleccionarTodos = useCallback(() => {
    const idsValidos = filteredProducts.filter(validarProducto).map((p) => p.id_producto)
    setProductosSeleccionados(new Set(idsValidos))
  }, [filteredProducts, validarProducto])

  const deseleccionarTodos = useCallback(() => {
    setProductosSeleccionados(new Set())
  }, [])

  // Obtener productos seleccionados para el Excel
  const productosParaExcel = filteredProducts.filter(producto => 
    productosSeleccionados.has(producto.id_producto)
  )

  // Obtener el conteo correcto de productos seleccionados en la vista actual
  const productosSeleccionadosEnVista = filteredProducts.filter(producto => 
    productosSeleccionados.has(producto.id_producto)
  ).length

  // Seleccionar automáticamente todos los productos filtrados cuando cambien los filtros
  useEffect(() => {
    if (filteredProducts.length > 0) {
      // Solo seleccionar automáticamente si no hay productos seleccionados en la vista actual
      if (productosSeleccionadosEnVista === 0) {
        const idsValidos = filteredProducts.filter(validarProducto).map((p) => p.id_producto)
        setProductosSeleccionados(new Set(idsValidos))
      }
    } else {
      // Si no hay productos filtrados, limpiar la selección
      setProductosSeleccionados(new Set())
    }
  }, [filteredProducts.length, productosSeleccionadosEnVista, validarProducto])

  // Función para generar y descargar el Excel
  const handleDownloadExcel = async () => {
    if (!productosParaExcel?.length) {
      toast.error("No hay productos seleccionados para descargar")
      return
    }

    try {
      // Crear array de datos para el Excel con códigos de barras reales
      const excelDataPromises = productosParaExcel.map(async (product) => {
        // Dividir cantidad entre 6 y redondear al siguiente número par
        const cantidadDividida = product.stock / 6
        const cantidadPar = Math.ceil(cantidadDividida / 2) * 2

        // Intentar obtener todos los códigos de barras del producto
        let codigoBarras = product.sku // Fallback al SKU si no hay códigos de barras
        
        try {
          const data = await obtenerCodigosBarras(product.id_producto)
          if (data.codigos_barras && data.codigos_barras.length > 0) {
            // Concatenar todos los códigos de barras separados por comas
            const todosLosCodigos = data.codigos_barras.map((cb: any) => cb.codigo)
            codigoBarras = todosLosCodigos.join(", ")
          }
        } catch (error) {
          // Si falla, usar el SKU como fallback
          console.warn(`No se pudo obtener código de barras para producto ${product.id_producto}`)
        }

        return {
          Producto: product.nombre,
          "Código de Barras": codigoBarras,
          Cantidad: product.stock,
          "Cantidad (Par)": cantidadPar,
        }
      })

      // Esperar a que se resuelvan todas las promesas
      const excelData = await Promise.all(excelDataPromises)

      // Crear un nuevo workbook
      const workbook = XLSX.utils.book_new()

      // Crear la hoja de datos
      const worksheet = XLSX.utils.json_to_sheet(excelData)

      // Configurar el ancho de las columnas
      const columnWidths = [
        { wch: 40 }, // Producto
        { wch: 35 }, // Código de Barras (más ancho para múltiples códigos)
        { wch: 12 }, // Cantidad
        { wch: 15 }, // Cantidad (Par)
      ]
      worksheet["!cols"] = columnWidths

      // Agregar la hoja al workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Productos")

      // Generar el archivo
      const fileName = `productos_${filtros.soloModificados ? "modificados" : "todos"}_${filtros.soloConStock ? "con_stock" : "completo"}_${new Date().toISOString().split("T")[0]}.xlsx`

      // Descargar el archivo
      XLSX.writeFile(workbook, fileName)

      toast.success(`Excel descargado exitosamente: ${fileName}`)
    } catch (error) {
      toast.error("Error al generar el archivo Excel")
      console.error("Error generating Excel:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Cargando productos...</p>
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
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Generar Excel de Productos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Exporta tu inventario a formato Excel para análisis externo
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              <FileSpreadsheet className="h-4 w-4" />
              {productosSeleccionadosEnVista} seleccionados
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
              {filteredProducts?.length || 0} filtrados
            </div>
            {products && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 rounded-full text-sm">
                <Package className="h-4 w-4" />
                {products.length} total
              </div>
            )}
          </div>
        </motion.div>

        {/* Controles de Filtros */}
        <motion.div
          className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row gap-6">
            {/* Panel de Filtros */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros de Exportación</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Búsqueda */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Buscar producto</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nombre o SKU..."
                      value={filtros.busqueda}
                      onChange={(e) => setFiltros((prev) => ({ ...prev, busqueda: e.target.value }))}
                      className="pl-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-lg shadow-sm focus:shadow-md focus:border-blue-300 dark:focus:border-blue-600 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Categoría */}
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

                {/* Ordenamiento */}
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
                      <SelectItem value="stock_asc">Stock menor a mayor</SelectItem>
                      <SelectItem value="stock_desc">Stock mayor a menor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Checkboxes de filtros */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Opciones de filtrado
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                    <Checkbox
                      id="soloModificados"
                      checked={filtros.soloModificados}
                      onCheckedChange={(checked) =>
                        setFiltros((prev) => ({ ...prev, soloModificados: checked as boolean }))
                      }
                      className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                    />
                    <Label htmlFor="soloModificados" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      Solo productos modificados
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                    <Checkbox
                      id="soloConStock"
                      checked={filtros.soloConStock}
                      onCheckedChange={(checked) =>
                        setFiltros((prev) => ({ ...prev, soloConStock: checked as boolean }))
                      }
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <Label htmlFor="soloConStock" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
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
                    <Label htmlFor="soloOfertas" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      Solo productos en oferta
                    </Label>
                  </div>
                </div>

                {/* Indicadores de filtros activos */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {filtros.soloModificados && (
                    <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700">
                      Productos modificados
                    </Badge>
                  )}
                  {filtros.soloConStock && (
                    <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                      Solo con stock
                    </Badge>
                  )}
                  {filtros.soloOfertas && (
                    <Badge variant="secondary" className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700">
                      Solo ofertas
                    </Badge>
                  )}
                  {filtros.busqueda && (
                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                      Búsqueda: "{filtros.busqueda}"
                    </Badge>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              {/* Botones de selección masiva */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selección de productos
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={seleccionarTodos}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all duration-200"
                  >
                    Seleccionar todos ({filteredProducts.length})
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

            {/* Botón de descarga */}
            <div className="flex flex-col justify-between">
              <div className="mb-4">
                <Button
                  onClick={handleDownloadExcel}
                  disabled={isLoading || !productosSeleccionadosEnVista}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Excel ({productosSeleccionadosEnVista})
                    </>
                  )}
                </Button>
              </div>

              {/* Botón para limpiar filtros */}
              <Button
                variant="outline"
                onClick={() =>
                  setFiltros({
                    busqueda: "",
                    categoria: "",
                    soloModificados: false,
                    soloConStock: true,
                    soloOfertas: false,
                    ordenamiento: "id_desc",
                  })
                }
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {filteredProducts && filteredProducts.length > 0 && productosSeleccionadosEnVista > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-gray-700">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filteredProducts.length > 0 && filteredProducts.every((p) => productosSeleccionados.has(p.id_producto))}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            seleccionarTodos()
                          } else {
                            deseleccionarTodos()
                          }
                        }}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    </TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Producto</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Código de Barras</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100 font-semibold text-right">
                      Cantidad
                    </TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100 font-semibold text-right">
                      Cantidad (Par)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredProducts.map((product, index) => {
                      // Dividir cantidad entre 6 y redondear al siguiente número par
                      const cantidadDividida = product.stock / 6
                      const cantidadPar = Math.ceil(cantidadDividida / 2) * 2
                      const seleccionado = productosSeleccionados.has(product.id_producto)

                      return (
                        <motion.tr
                          key={product.id_producto}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className={`cursor-pointer transition-colors duration-200 ${
                            seleccionado
                              ? "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
                          } hover:shadow-sm`}
                          onClick={() => toggleProductoSeleccionado(product.id_producto)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={seleccionado}
                              onCheckedChange={() => toggleProductoSeleccionado(product.id_producto)}
                              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                            <div className="flex items-center gap-2">
                              {seleccionado && <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                              <span>{product.nombre}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-gray-700 dark:text-gray-300">
                            {product.sku}
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              SKU (códigos reales se obtienen al exportar)
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={product.stock > 0 ? "default" : "destructive"}
                              className={
                                product.stock > 0
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              }
                            >
                              {product.stock}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                            >
                              {cantidadPar}
                            </Badge>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            // Hay productos filtrados pero ninguno seleccionado
            <motion.div
              className="flex flex-col items-center justify-center py-16 text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/80 dark:border-gray-700/80"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-6 shadow-lg">
                <CheckSquare className="h-10 w-10 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No hay productos seleccionados
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
                Selecciona los productos que deseas incluir en el archivo Excel usando los checkboxes en la tabla
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={seleccionarTodos}
                  className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Seleccionar todos ({filteredProducts.length})
                </Button>
              </div>
            </motion.div>
          ) : (
            // No hay productos filtrados
            <motion.div
              className="flex flex-col items-center justify-center py-16 text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/80 dark:border-gray-700/80"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center mb-6 shadow-lg">
                <Package className="h-10 w-10 text-green-500 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {filtros.soloModificados 
                  ? "No hay productos modificados" 
                  : filtros.soloConStock 
                    ? "No hay productos con stock" 
                    : "No hay productos"
                }
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
                {filtros.soloModificados
                  ? "No se encontraron productos que hayan sido modificados después de su creación"
                  : filtros.soloConStock
                    ? "No hay productos con stock disponible para exportar"
                    : "No hay productos disponibles para exportar"
                }
              </p>
              {(filtros.soloModificados || filtros.soloConStock) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiltros((prev) => ({
                      ...prev,
                      soloModificados: false,
                      soloConStock: false,
                    }))
                  }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  Ver todos los productos
                </Button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Summary Card */}
        {productosSeleccionadosEnVista > 0 && (
          <motion.div
            className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-1">
                  Resumen de Exportación
                </h3>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  {productosSeleccionadosEnVista} producto{productosSeleccionadosEnVista !== 1 ? "s" : ""} seleccionado{productosSeleccionadosEnVista !== 1 ? "s" : ""}
                  {filtros.soloModificados ? " modificado" : ""}
                  {productosSeleccionadosEnVista !== 1 && filtros.soloModificados ? "s" : ""}
                  {filtros.soloConStock ? " con stock" : ""}
                  {" "}listo{productosSeleccionadosEnVista !== 1 ? "s" : ""} para exportar
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {productosParaExcel.reduce((total, product) => total + product.stock, 0)}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">unidades seleccionadas</div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default GenerateExcelProductsPage
