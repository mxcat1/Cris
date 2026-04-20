"use client"

import type React from "react"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Percent,
  Search,
  Filter,
  Loader2,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Tag,
  BarChart4,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Barcode,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs"
import { Slider } from "../../components/ui/slider"
import { fetchProducts } from "../../services/productService"
import { fetchCategories } from "../../services/categoryService"
import { buscarProductoPorCodigoBarras } from "../../services/codigoBarrasService"
import { formatCurrency } from "../../lib/utils"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { useBusinessHours } from "../../hooks/useBusinessHours"
import { motion } from "framer-motion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog"
import api from "../../lib/api"

// Utility functions for precise decimal operations
const preciseNumber = {
  // Redondear a 2 decimales de forma precisa
  round: (num: number, decimals = 2): number => {
    return Math.round((num + Number.EPSILON) * Math.pow(10, decimals)) / Math.pow(10, decimals)
  },

  // Convertir string a número con precisión
  parse: (value: string | number): number => {
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value)
      return isNaN(parsed) ? 0 : preciseNumber.round(parsed)
    }
    return preciseNumber.round(value)
  },

  // Formatear número para envío al servidor
  toFixed: (num: number, decimals = 2): string => {
    return preciseNumber.round(num, decimals).toFixed(decimals)
  },
}

// Interfaces
interface Offer {
  id_oferta?: number
  id_producto: number
  descuento: number
  precio_fijo?: number // Nuevo campo para precio fijo
}

interface Product {
  id_producto: number
  sku: string
  nombre: string
  precio_unitario: string
  precio_unitario_con_igv: string
  precio_mayoritario?: string | null
  precio_mayoritario_con_igv?: string | null
  precio_oferta?: string | null
  precio_oferta_con_igv?: string | null
  es_oferta?: boolean
  stock: number
  id_categoria: number
  categoria?: {
    nombre: string
  }
}

// Servicios para ofertas - modificado para manejar precio fijo
const createOrUpdateOffer = async (offerData: Offer | Offer[]): Promise<any> => {
  // Asegurar que los precios se envíen con precisión exacta
  const processedData = Array.isArray(offerData)
    ? offerData.map((offer) => ({
        ...offer,
        descuento: preciseNumber.round(offer.descuento),
        precio_fijo: offer.precio_fijo ? preciseNumber.round(offer.precio_fijo) : undefined,
      }))
    : {
        ...offerData,
        descuento: preciseNumber.round(offerData.descuento),
        precio_fijo: offerData.precio_fijo ? preciseNumber.round(offerData.precio_fijo) : undefined,
      }

  const response = await api.put("/ofertas-del-dia", processedData)
  return response.data
}

const deleteOffer = async (productId: number): Promise<any> => {
  const response = await api.delete(`/ofertas-del-dia/${productId}`)
  return response.data
}

const StatCard = ({
  title,
  value,
  icon,
  color,
}: { title: string; value: string; icon: React.ReactNode; color: string }) => (
  <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border border-border/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-purple-200 dark:hover:border-purple-700">
    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-50/30 dark:to-purple-900/20" />
    <CardContent className="p-6 relative">
      <div className="flex items-center justify-between space-x-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div
          className={`p-3 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-md ${color.replace("text-", "text-")}`}
        >
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
)

const OffersPage = () => {
  useDocumentTitle("Gestión de Ofertas")
  const { isWithinBusinessHours } = useBusinessHours()
  const queryClient = useQueryClient()

  // Estados
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [activeTab, setActiveTab] = useState("all")
  const [discountValue, setDiscountValue] = useState(10)
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [selectedOfferedProducts, setSelectedOfferedProducts] = useState<number[]>([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {})
  const [confirmMessage, setConfirmMessage] = useState("")
  const [confirmTitle, setConfirmTitle] = useState("")
  const [isApplyingBulk, setIsApplyingBulk] = useState(false)
  const [isRemovingBulk, setIsRemovingBulk] = useState(false)

  // Estados para el escáner de códigos de barras
  const [barcodeScanBuffer, setBarcodeScanBuffer] = useState<string>("")
  const [lastScanTime, setLastScanTime] = useState<number>(0)
  const [isSearchInputFocused, setIsSearchInputFocused] = useState<boolean>(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Estado para productos encontrados por código de barras
  const [barcodeSearchResults, setBarcodeSearchResults] = useState<any[]>([])

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)

  // Estado para el tipo de orden
  const [sortType, setSortType] = useState("id_desc") // id_desc, id_asc, name_asc, name_desc, stock_asc, stock_desc

  // Estados para precios fijos - MEJORADO
  const [isFixedPriceMode, setIsFixedPriceMode] = useState(true)
  const [individualFixedPrices, setIndividualFixedPrices] = useState<Record<number, string>>({}) // Cambiar a string para mejor control

  // Consultas
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  })

  // Mutaciones
  const createOfferMutation = useMutation({
    mutationFn: createOrUpdateOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Oferta aplicada correctamente")
      setIsApplyingBulk(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al aplicar la oferta")
      setIsApplyingBulk(false)
    },
  })

  const deleteOfferMutation = useMutation({
    mutationFn: deleteOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Oferta eliminada correctamente")
      setIsRemovingBulk(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al eliminar la oferta")
      setIsRemovingBulk(false)
    },
  })

  // Función para buscar productos por código de barras en tiempo real
  const searchByBarcode = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 5) {
      setBarcodeSearchResults([])
      return
    }

    try {
      const result = await buscarProductoPorCodigoBarras(searchTerm.trim())
      if (result && result.producto) {
        setBarcodeSearchResults([result.producto])
      } else {
        setBarcodeSearchResults([])
      }
    } catch (error: any) {
      setBarcodeSearchResults([])
    }
  }, [])

  // Effect para buscar por código de barras cuando cambia el término de búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchByBarcode(searchTerm)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchByBarcode])

  // Función para manejar eventos de teclado y detectar escaneos automáticamente
  const handleBarcodeScanning = useCallback(
    (event: KeyboardEvent) => {
      const systemKeys = [
        "Backspace",
        "Delete",
        "Tab",
        "Escape",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "PageUp",
        "PageDown",
        "Insert",
        "CapsLock",
        "NumLock",
        "ScrollLock",
        "Pause",
        "PrintScreen",
        "F1",
        "F2",
        "F3",
        "F4",
        "F5",
        "F6",
        "F7",
        "F8",
        "F9",
        "F10",
        "F11",
        "F12",
        "Shift",
        "Control",
        "Alt",
        "Meta",
        "ContextMenu",
      ]

      if (systemKeys.includes(event.key) || event.ctrlKey || event.altKey || event.metaKey) {
        return
      }

      if (!isSearchInputFocused || document.activeElement !== searchInputRef.current) {
        return
      }

      const currentTime = new Date().getTime()

      if (event.key === "Enter") {
        event.preventDefault()
        if (barcodeScanBuffer.trim()) {
          processScannedBarcode(barcodeScanBuffer.trim())
          setBarcodeScanBuffer("")
        }
        return
      }

      if (event.key.length > 1 && event.key !== "Space") {
        return
      }

      if (currentTime - lastScanTime > 100) {
        setBarcodeScanBuffer(event.key === "Space" ? " " : event.key)
      } else {
        setBarcodeScanBuffer((prev) => prev + (event.key === "Space" ? " " : event.key))
      }

      setLastScanTime(currentTime)
    },
    [barcodeScanBuffer, isSearchInputFocused, lastScanTime],
  )

  // Función para procesar un código escaneado
  const processScannedBarcode = async (barcode: string) => {
    if (!barcode.trim()) return

    try {
      const result = await buscarProductoPorCodigoBarras(barcode.trim())
      if (result && result.producto) {
        setSearchTerm(barcode.trim())
        toast.success(`Producto encontrado: ${result.producto.nombre}`)
        return
      }
    } catch (error: any) {

    }

    if (products && products.length > 0) {
      setSearchTerm(barcode.trim())
      const foundProducts = products.filter(
        (product: any) =>
          product.nombre.toLowerCase().includes(barcode.toLowerCase()) ||
          product.sku.toLowerCase().includes(barcode.toLowerCase()),
      )

      if (foundProducts.length > 0) {
        toast.success(
          `Encontrado${foundProducts.length > 1 ? "s" : ""} ${foundProducts.length} producto${foundProducts.length > 1 ? "s" : ""} relacionado${foundProducts.length > 1 ? "s" : ""}`,
        )
      } else {
        toast.warning(`No se encontraron productos con código: ${barcode.trim()}`)
      }
    } else {
      setSearchTerm(barcode.trim())
      toast.info(`Buscando productos con código: ${barcode.trim()}`)
    }
  }

  // Función MEJORADA para calcular porcentaje desde precio fijo
  const calculateDiscountFromFixedPrice = (originalPrice: number, fixedPrice: number) => {
    if (fixedPrice >= originalPrice) return 0
    const discount = ((originalPrice - fixedPrice) / originalPrice) * 100
    return preciseNumber.round(discount)
  }

  // Effect para manejar el registro y limpieza de los event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleBarcodeScanning)
    return () => {
      window.removeEventListener("keydown", handleBarcodeScanning)
    }
  }, [handleBarcodeScanning])

  // Productos filtrados y agrupados
  const productsWithOffers = useMemo(() => products?.filter((product) => product.es_oferta === true) || [], [products])
  const productsWithoutOffers = useMemo(
    () => products?.filter((product) => product.es_oferta !== true) || [],
    [products],
  )

  // Filtrar productos según la búsqueda y categoría
  const filterProducts = useCallback(
    (productsList: Product[]) => {
      const searchLower = searchTerm.toLowerCase()

      const nameSkuResults = productsList.filter((product) => {
        const matchesSearch =
          product.nombre.toLowerCase().includes(searchLower) || product.sku.toLowerCase().includes(searchLower)
        const matchesCategory =
          categoryFilter === "all" || !categoryFilter ? true : product.id_categoria === Number.parseInt(categoryFilter)
        return matchesSearch && matchesCategory
      })

      const barcodeResults = barcodeSearchResults.filter((product: any) => {
        const matchesCategory =
          categoryFilter === "all" || !categoryFilter ? true : product.id_categoria === Number.parseInt(categoryFilter)
        return matchesCategory
      })

      const combinedResults = [...nameSkuResults]
      barcodeResults.forEach((barcodeProduct: any) => {
        const alreadyExists = combinedResults.some((product: any) => product.id_producto === barcodeProduct.id_producto)
        if (!alreadyExists) {
          combinedResults.push(barcodeProduct)
        }
      })

      // Ordenar según el tipo seleccionado
      return combinedResults.sort((a: any, b: any) => {
        if (sortType === "id_desc") return b.id_producto - a.id_producto
        if (sortType === "id_asc") return a.id_producto - b.id_producto
        if (sortType === "name_asc") return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
        if (sortType === "name_desc") return b.nombre.localeCompare(a.nombre, "es", { sensitivity: "base" })
        if (sortType === "stock_asc") return a.stock - b.stock
        if (sortType === "stock_desc") return b.stock - a.stock
        return 0
      })
    },
    [searchTerm, categoryFilter, barcodeSearchResults, sortType],
  )

  const filteredAllProducts = useMemo(() => filterProducts(products || []), [products, filterProducts])
  const filteredProductsWithOffers = useMemo(
    () => filterProducts(productsWithOffers),
    [productsWithOffers, filterProducts],
  )
  const filteredProductsWithoutOffers = useMemo(
    () => filterProducts(productsWithoutOffers),
    [productsWithoutOffers, filterProducts],
  )

  // Lógica de paginación
  const getPaginatedProducts = (productsList: Product[]) => {
    const totalPages = Math.ceil(productsList.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentProducts = productsList.slice(startIndex, endIndex)

    return {
      products: currentProducts,
      totalPages,
      startIndex,
      endIndex,
      totalItems: productsList.length,
    }
  }

  // Resetear página actual cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, activeTab, sortType])

  // Estadísticas
  const stats = useMemo(() => {
    if (!products)
      return {
        totalProducts: 0,
        productsWithOffers: 0,
        averageDiscount: 0,
        maxDiscount: 0,
      }

    const offeredProducts = products.filter((p) => p.es_oferta === true)
    const discounts = offeredProducts
      .map((p) => {
        if (p.precio_oferta_con_igv && p.precio_unitario_con_igv) {
          const precioNormal = preciseNumber.parse(p.precio_unitario_con_igv)
          const precioOferta = preciseNumber.parse(p.precio_oferta_con_igv)
          return Math.round(((precioNormal - precioOferta) / precioNormal) * 100)
        }
        return 0
      })
      .filter((discount) => discount > 0)

    const avgDiscount = discounts.length ? discounts.reduce((sum, discount) => sum + discount, 0) / discounts.length : 0

    return {
      totalProducts: products.length,
      productsWithOffers: offeredProducts.length,
      averageDiscount: avgDiscount,
      maxDiscount: discounts.length ? Math.max(...discounts) : 0,
    }
  }, [products])

  // Funciones para gestionar ofertas - MEJORADA
  const handleToggleOffer = (product: Product) => {
    if (!isWithinBusinessHours) {
      toast.error("No puedes modificar ofertas fuera del horario laboral (8:00 AM - 8:00 PM)")
      return
    }

    if (product.es_oferta === true) {
      setConfirmTitle("Eliminar oferta")
      setConfirmMessage(`¿Estás seguro de que deseas eliminar la oferta para ${product.nombre}?`)
      setConfirmAction(() => () => {
        deleteOfferMutation.mutate(product.id_producto)
      })
      setShowConfirmDialog(true)
    } else {
      let descuentoAUsar = discountValue
      let precioFijo: number | undefined = undefined

      if (isFixedPriceMode && individualFixedPrices[product.id_producto]) {
        const fixedPriceValue = preciseNumber.parse(individualFixedPrices[product.id_producto])
        if (fixedPriceValue > 0) {
          const originalPrice = preciseNumber.parse(product.precio_unitario_con_igv)
          descuentoAUsar = calculateDiscountFromFixedPrice(originalPrice, fixedPriceValue)
          precioFijo = fixedPriceValue
        }
      }

      const offerData: Offer = {
        id_producto: product.id_producto,
        descuento: descuentoAUsar,
        ...(precioFijo && { precio_fijo: precioFijo }),
      }

      createOfferMutation.mutate(offerData)
    }
  }

  // Aplicar ofertas masivas - MEJORADA
  const handleApplyBulkOffers = () => {
    if (!isWithinBusinessHours) {
      toast.error("No puedes modificar ofertas fuera del horario laboral (8:00 AM - 8:00 PM)")
      return
    }

    if (selectedProducts.length === 0) {
      toast.error("Selecciona al menos un producto para aplicar ofertas")
      return
    }

    setConfirmTitle("Aplicar ofertas masivas")
    setConfirmMessage(`¿Estás seguro de que deseas aplicar ofertas a ${selectedProducts.length} productos?`)
    setConfirmAction(() => () => {
      setIsApplyingBulk(true)
      const offersToApply = selectedProducts.map((productId) => {
        let descuentoAUsar = discountValue
        let precioFijo: number | undefined = undefined

        if (isFixedPriceMode && individualFixedPrices[productId]) {
          const fixedPriceValue = preciseNumber.parse(individualFixedPrices[productId])
          if (fixedPriceValue > 0) {
            const product = products?.find((p) => p.id_producto === productId)
            if (product) {
              const originalPrice = preciseNumber.parse(product.precio_unitario_con_igv)
              descuentoAUsar = calculateDiscountFromFixedPrice(originalPrice, fixedPriceValue)
              precioFijo = fixedPriceValue
            }
          }
        }

        const offerData: Offer = {
          id_producto: productId,
          descuento: descuentoAUsar,
          ...(precioFijo && { precio_fijo: precioFijo }),
        }

        return offerData
      })

      createOfferMutation.mutate(offersToApply)
      setSelectedProducts([])
    })
    setShowConfirmDialog(true)
  }

  // Eliminar ofertas masivas
  const handleRemoveBulkOffers = () => {
    if (!isWithinBusinessHours) {
      toast.error("No puedes modificar ofertas fuera del horario laboral (8:00 AM - 8:00 PM)")
      return
    }

    if (selectedOfferedProducts.length === 0) {
      toast.error("Selecciona al menos un producto para eliminar ofertas")
      return
    }

    setConfirmTitle("Eliminar ofertas masivas")
    setConfirmMessage(
      `¿Estás seguro de que deseas eliminar las ofertas de ${selectedOfferedProducts.length} productos?`,
    )
    setConfirmAction(() => () => {
      setIsRemovingBulk(true)

      const promises = selectedOfferedProducts.map((productId) => deleteOfferMutation.mutateAsync(productId))

      Promise.all(promises)
        .then(() => {
          toast.success(`Se eliminaron ${selectedOfferedProducts.length} ofertas correctamente`)
          setSelectedOfferedProducts([])
          setIsRemovingBulk(false)
        })
        .catch((error) => {
          toast.error("Ocurrió un error al eliminar algunas ofertas")
          setIsRemovingBulk(false)
          console.error(error)
        })
    })
    setShowConfirmDialog(true)
  }

  // Eliminar todas las ofertas
  const handleRemoveAllOffers = () => {
    if (!isWithinBusinessHours) {
      toast.error("No puedes modificar ofertas fuera del horario laboral (8:00 AM - 8:00 PM)")
      return
    }

    if (productsWithOffers.length === 0) {
      toast.error("No hay ofertas activas para eliminar")
      return
    }

    setConfirmTitle("Eliminar todas las ofertas")
    setConfirmMessage(
      `¿Estás seguro de que deseas eliminar todas las ofertas (${productsWithOffers.length} productos)?`,
    )
    setConfirmAction(() => () => {
      setIsRemovingBulk(true)
      const promises = productsWithOffers.map((product) => deleteOfferMutation.mutateAsync(product.id_producto))

      Promise.all(promises)
        .then(() => {
          toast.success(`Se eliminaron ${productsWithOffers.length} ofertas correctamente`)
          setIsRemovingBulk(false)
        })
        .catch((error) => {
          toast.error("Ocurrió un error al eliminar algunas ofertas")
          setIsRemovingBulk(false)
          console.error(error)
        })
    })
    setShowConfirmDialog(true)
  }

  // Gestión de selección de productos
  const toggleProductSelection = (productId: number, isOffer = false) => {
    if (isOffer) {
      if (selectedOfferedProducts.includes(productId)) {
        setSelectedOfferedProducts(selectedOfferedProducts.filter((id) => id !== productId))
      } else {
        setSelectedOfferedProducts([...selectedOfferedProducts, productId])
      }
    } else {
      if (selectedProducts.includes(productId)) {
        setSelectedProducts(selectedProducts.filter((id) => id !== productId))
      } else {
        setSelectedProducts([...selectedProducts, productId])
      }
    }
  }

  // Función MEJORADA para actualizar precio fijo individual
  const updateIndividualFixedPrice = (productId: number, priceString: string) => {
    // Validar que el input sea un número válido
    if (priceString === "") {
      setIndividualFixedPrices((prev) => ({
        ...prev,
        [productId]: "",
      }))
      return
    }

    // Permitir números con hasta 2 decimales
    const regex = /^\d*\.?\d{0,2}$/
    if (!regex.test(priceString)) {
      return // No actualizar si no cumple el formato
    }

    setIndividualFixedPrices((prev) => ({
      ...prev,
      [productId]: priceString,
    }))
  }

  // Función para formatear precio al perder el foco
  const formatPriceOnBlur = (productId: number, priceString: string) => {
    if (priceString === "") return

    const numericValue = preciseNumber.parse(priceString)
    const formattedValue = preciseNumber.toFixed(numericValue, 2)

    setIndividualFixedPrices((prev) => ({
      ...prev,
      [productId]: formattedValue,
    }))
  }

  const selectAllProducts = (productsToSelect: Product[], isOffer = false) => {
    if (productsToSelect.length > 0) {
      if (isOffer) {
        if (selectedOfferedProducts.length === productsToSelect.length) {
          setSelectedOfferedProducts([])
        } else {
          setSelectedOfferedProducts(productsToSelect.map((p) => p.id_producto))
        }
      } else {
        if (selectedProducts.length === productsToSelect.length) {
          setSelectedProducts([])
        } else {
          setSelectedProducts(productsToSelect.map((p) => p.id_producto))
        }
      }
    }
  }

  // Calcular precio con descuento
  const calculateDiscountedPrice = (price: string, discount: number) => {
    const originalPrice = preciseNumber.parse(price)
    const discountedPrice = originalPrice * (1 - discount / 100)
    return formatCurrency(preciseNumber.round(discountedPrice))
  }

  // Renderizar tabla de productos
  const renderProductsTable = (productsToShow: Product[], isOfferTab = false) => {
    const selectedIds = isOfferTab ? selectedOfferedProducts : selectedProducts

    const paginationData = getPaginatedProducts(productsToShow)
    const { products: paginatedProducts, totalPages, startIndex, endIndex, totalItems } = paginationData

    return isLoadingProducts ? (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
          <p className="text-gray-600 dark:text-gray-400">Cargando productos...</p>
        </div>
      </div>
    ) : paginatedProducts.length > 0 ? (
      <div className="space-y-4">
        <div className="rounded-xl border border-border/20 overflow-hidden shadow-lg bg-card/50 backdrop-blur-sm">
          <Table>
            <TableHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-900/20">
              <TableRow className="border-gray-200/80 dark:border-gray-700/80">
                <TableHead className="w-[50px] text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === productsToShow.length}
                    onChange={() => selectAllProducts(productsToShow, isOfferTab)}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                  />
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Producto</TableHead>
                <TableHead className="hidden sm:table-cell font-semibold text-gray-700 dark:text-gray-300">
                  Categoría
                </TableHead>
                <TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">
                  Precio Normal
                </TableHead>
                <TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">
                  Precio Oferta
                </TableHead>
                {!isOfferTab && (
                  <TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">
                    {isFixedPriceMode ? "Precio Fijo (Editable)" : `Precio con ${discountValue}%`}
                  </TableHead>
                )}
                {isOfferTab && (
                  <TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">
                    Descuento
                  </TableHead>
                )}
                {isOfferTab && (
                  <TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">
                    Precio Oferta
                  </TableHead>
                )}
                <TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product, index) => (
                <motion.tr
                  key={product.id_producto}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.03 * index }}
                  className={`group transition-all duration-200 ${
                    product.es_oferta === true
                      ? "bg-gradient-to-r from-red-50/80 to-pink-50/40 dark:from-red-950/30 dark:to-pink-950/20 border-red-100 dark:border-red-900/30"
                      : "hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-purple-50/30 dark:hover:from-gray-800/50 dark:hover:to-purple-900/20"
                  }`}
                >
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id_producto)}
                      onChange={() => toggleProductSelection(product.id_producto, isOfferTab)}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium truncate max-w-[240px] text-gray-900 dark:text-gray-100">
                          {product.nombre}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-gray-700 dark:text-gray-300">
                    {product.categoria?.nombre || "-"}
                  </TableCell>
                  <TableCell className="text-center font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(preciseNumber.parse(product.precio_unitario_con_igv))}
                  </TableCell>

                  <TableCell className="text-center">
                    {product.es_oferta && product.precio_oferta_con_igv ? (
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-red-600 dark:text-red-400">
                          {formatCurrency(preciseNumber.parse(product.precio_oferta_con_igv))}
                        </span>
                        <Badge variant="destructive" className="text-xs mt-1">
                          {(() => {
                            const precioNormal = preciseNumber.parse(product.precio_unitario_con_igv)
                            const precioOferta = preciseNumber.parse(product.precio_oferta_con_igv)
                            const descuento = Math.round(((precioNormal - precioOferta) / precioNormal) * 100)
                            return `${descuento}% OFF`
                          })()}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-sm">Sin oferta</span>
                    )}
                  </TableCell>

                  {!isOfferTab && (
                    <TableCell className="text-center">
                      {isFixedPriceMode ? (
                        <div className="flex flex-col items-center space-y-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={individualFixedPrices[product.id_producto] || ""}
                            onChange={(e) => updateIndividualFixedPrice(product.id_producto, e.target.value)}
                            onBlur={(e) => formatPriceOnBlur(product.id_producto, e.target.value)}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-24 px-2 py-1 text-sm border rounded-md text-center bg-white dark:bg-gray-800 border-purple-300 dark:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-600"
                            placeholder="0.00"
                          />
                          <span className="text-xs text-purple-600 dark:text-purple-400">
                            {individualFixedPrices[product.id_producto] &&
                            preciseNumber.parse(individualFixedPrices[product.id_producto]) > 0 &&
                            preciseNumber.parse(individualFixedPrices[product.id_producto]) <
                              preciseNumber.parse(product.precio_unitario_con_igv)
                              ? `${calculateDiscountFromFixedPrice(
                                  preciseNumber.parse(product.precio_unitario_con_igv),
                                  preciseNumber.parse(individualFixedPrices[product.id_producto]),
                                )}% OFF`
                              : "0% OFF"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {calculateDiscountedPrice(product.precio_unitario_con_igv, discountValue)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Ahorro:{" "}
                            {formatCurrency(
                              preciseNumber.parse(product.precio_unitario_con_igv) * (discountValue / 100),
                            )}
                          </span>
                        </div>
                      )}
                    </TableCell>
                  )}

                  {isOfferTab && (
                    <TableCell className="text-center">
                      <Badge
                        variant="destructive"
                        className="bg-gradient-to-r from-red-500 to-pink-600 dark:from-red-600 dark:to-pink-700 text-white border-0 shadow-sm"
                      >
                        {(() => {
                          if (product.precio_oferta_con_igv && product.precio_unitario_con_igv) {
                            const precioNormal = preciseNumber.parse(product.precio_unitario_con_igv)
                            const precioOferta = preciseNumber.parse(product.precio_oferta_con_igv)
                            const descuento = Math.round(((precioNormal - precioOferta) / precioNormal) * 100)
                            return `${descuento}% OFF`
                          }
                          return "OFERTA"
                        })()}
                      </Badge>
                    </TableCell>
                  )}

                  {isOfferTab && (
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(preciseNumber.parse(product.precio_oferta_con_igv || "0"))}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Ahorro:{" "}
                          {formatCurrency(
                            preciseNumber.parse(product.precio_unitario_con_igv) -
                              preciseNumber.parse(product.precio_oferta_con_igv || "0"),
                          )}
                        </span>
                      </div>
                    </TableCell>
                  )}

                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleOffer(product)}
                      disabled={!isWithinBusinessHours}
                      className={
                        product.es_oferta === true
                          ? "border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 bg-red-50/50 dark:bg-red-900/10 shadow-sm hover:shadow-md transition-all duration-200"
                          : "border-green-300 dark:border-green-600 text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 bg-green-50/50 dark:bg-green-900/10 shadow-sm hover:shadow-md transition-all duration-200"
                      }
                    >
                      {product.es_oferta === true ? (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">Eliminar</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">Aplicar</span>
                        </>
                      )}
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border/20 shadow-sm">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} productos
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="bg-white/80 dark:bg-gray-700/80 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="bg-white/80 dark:bg-gray-700/80 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/80 dark:border-gray-700/80">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-purple-100 dark:from-gray-800 dark:to-purple-900/30 flex items-center justify-center mb-6 shadow-lg">
          <Package className="h-10 w-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay productos</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {searchTerm || categoryFilter
            ? "No se encontraron productos con esos criterios de búsqueda"
            : isOfferTab
              ? "No hay productos con ofertas actualmente"
              : "No hay productos disponibles para aplicar ofertas"}
        </p>
        {(searchTerm || categoryFilter) && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("")
              setCategoryFilter("")
              setSortType("id_desc")
            }}
            className="bg-card/50 backdrop-blur-sm border-border/20 hover:bg-accent/50 transition-all duration-200"
          >
            Limpiar filtros
          </Button>
        )}
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
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Ofertas del Día
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-gray-600 dark:text-gray-400">Gestiona descuentos y promociones para tus productos</p>
              {isSearchInputFocused && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                >
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  Escáner activo
                </motion.div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleApplyBulkOffers}
              disabled={selectedProducts.length === 0 || !isWithinBusinessHours}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Percent className="h-4 w-4 mr-2" />
              Aplicar Ofertas
            </Button>
            <Button
              onClick={handleRemoveAllOffers}
              variant="destructive"
              disabled={productsWithOffers.length === 0 || isRemovingBulk || !isWithinBusinessHours}
              className="shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Eliminar Todas
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            title="Total Productos"
            value={stats.totalProducts.toString()}
            icon={<Package className="h-6 w-6 text-blue-500" />}
            color="text-blue-500"
          />
          <StatCard
            title="Productos en Oferta"
            value={stats.productsWithOffers.toString()}
            icon={<Tag className="h-6 w-6 text-red-500" />}
            color="text-red-500"
          />
          <StatCard
            title="Descuento Promedio"
            value={`${stats.averageDiscount.toFixed(1)}%`}
            icon={<Percent className="h-6 w-6 text-green-500" />}
            color="text-green-500"
          />
          <StatCard
            title="Descuento Máximo"
            value={`${stats.maxDiscount}%`}
            icon={<BarChart4 className="h-6 w-6 text-purple-500" />}
            color="text-purple-500"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border border-border/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-50/30 dark:to-purple-900/20" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Configuración de Ofertas
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Define descuentos y aplícalos a tus productos
              </CardDescription>
            </CardHeader>
            <CardContent className="relative p-6">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  {isSearchInputFocused && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      <Barcode className="h-4 w-4 text-green-500 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Escáner activo</span>
                    </div>
                  )}
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Buscar productos o escanear código de barras..."
                    className="pl-10 pr-28 h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchInputFocused(true)}
                    onBlur={() => setIsSearchInputFocused(false)}
                  />
                </div>
                <div className="w-full md:w-auto">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-[200px] h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filtrar por categoría" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 shadow-xl rounded-xl">
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id_categoria} value={category.id_categoria.toString()}>
                          {category.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-auto">
                  <select
                    value={sortType}
                    onChange={(e) => setSortType(e.target.value)}
                    className="w-full md:w-[200px] h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm hover:shadow-md px-3 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200"
                  >
                    <option value="id_desc">Más recientes</option>
                    <option value="id_asc">Más antiguos</option>
                    <option value="name_asc">Nombre A-Z</option>
                    <option value="name_desc">Nombre Z-A</option>
                    <option value="stock_asc">Stock ascendente</option>
                    <option value="stock_desc">Stock descendente</option>
                  </select>
                </div>
              </div>

              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6 grid grid-cols-3 w-full bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm p-1 rounded-xl shadow-sm">
                  <TabsTrigger
                    value="all"
                    className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-md transition-all duration-200"
                  >
                    Todos los Productos
                  </TabsTrigger>
                  <TabsTrigger
                    value="with-offers"
                    className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-md transition-all duration-200"
                  >
                    Con Ofertas ({productsWithOffers.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="without-offers"
                    className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-md transition-all duration-200"
                  >
                    Sin Ofertas
                  </TabsTrigger>
                </TabsList>

                <div className="bg-gradient-to-br from-gray-50/80 to-purple-50/40 dark:from-gray-800/80 dark:to-purple-900/20 backdrop-blur-sm p-6 rounded-xl mb-6 border border-gray-200/60 dark:border-gray-700/60 shadow-sm">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1 space-y-4 w-full">
                      <div className="flex items-center justify-center space-x-4 mb-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Porcentaje</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isFixedPriceMode}
                            onChange={() => setIsFixedPriceMode(!isFixedPriceMode)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Precio Fijo</span>
                      </div>

                      {isFixedPriceMode ? (
                        <div className="space-y-3">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Modo Precio Fijo Activado
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Edita el precio de cada producto individualmente en la tabla. Los precios se guardarán
                              exactamente como los ingreses.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                            Porcentaje de descuento:
                          </label>
                          <div className="flex items-center gap-4 w-full">
                            <Slider
                              value={[discountValue]}
                              min={1}
                              max={70}
                              step={1}
                              onValueChange={(value) => setDiscountValue(value[0])}
                              className="flex-1"
                            />
                            <input
                              type="number"
                              min={1}
                              max={70}
                              value={discountValue}
                              onChange={(e) => {
                                let val = Number(e.target.value)
                                if (isNaN(val)) val = 1
                                if (val < 1) val = 1
                                if (val > 70) val = 70
                                setDiscountValue(val)
                              }}
                              className="w-16 px-2 py-1 border rounded-md text-center bg-card/50 border-border/20 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-600"
                            />
                            <Badge
                              variant="outline"
                              className="font-mono bg-card/50 border-border/20 text-foreground min-w-[48px] text-center"
                            >
                              {discountValue}%
                            </Badge>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>1%</span>
                            <span>70%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      {activeTab === "all" || activeTab === "without-offers" ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleApplyBulkOffers}
                          disabled={selectedProducts.length === 0 || isApplyingBulk || !isWithinBusinessHours}
                          className="whitespace-nowrap bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 hover:from-green-600 hover:to-emerald-700 dark:hover:from-green-700 dark:hover:to-emerald-800 text-white border-0 w-full md:w-auto"
                        >
                          {isApplyingBulk ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Percent className="mr-2 h-4 w-4" />
                          )}
                          Aplicar a seleccionados ({selectedProducts.length})
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveBulkOffers}
                          disabled={selectedOfferedProducts.length === 0 || isRemovingBulk || !isWithinBusinessHours}
                          className="whitespace-nowrap w-full md:w-auto bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white border-0"
                        >
                          {isRemovingBulk ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Eliminar ofertas ({selectedOfferedProducts.length})
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <TabsContent value="all">{renderProductsTable(filteredAllProducts, false)}</TabsContent>
                <TabsContent value="with-offers">
                  <div className="flex justify-between items-center mb-6 p-4 bg-gradient-to-r from-red-50/80 to-pink-50/40 dark:from-red-950/30 dark:to-pink-950/20 rounded-xl border border-red-200/60 dark:border-red-800/40">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                      Ofertas Activas ({filteredProductsWithOffers.length})
                    </h3>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveAllOffers}
                      disabled={productsWithOffers.length === 0 || isRemovingBulk || !isWithinBusinessHours}
                      className="whitespace-nowrap bg-gradient-to-r from-red-500 to-pink-600 dark:from-red-600 dark:to-pink-700 hover:from-red-600 hover:to-pink-700 dark:hover:from-red-700 dark:hover:to-pink-800 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {isRemovingBulk ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Eliminar todas
                    </Button>
                  </div>
                  {renderProductsTable(filteredProductsWithOffers, true)}
                </TabsContent>
                <TabsContent value="without-offers">
                  <div className="flex justify-between items-center mb-6 p-4 bg-gradient-to-r from-green-50/80 to-emerald-50/40 dark:from-green-950/30 dark:to-emerald-950/20 rounded-xl border border-green-200/60 dark:border-green-800/40">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                      Productos Sin Oferta ({filteredProductsWithoutOffers.length})
                    </h3>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        if (selectedProducts.length > 0) {
                          handleApplyBulkOffers()
                        } else {
                          toast.info("Selecciona productos primero")
                        }
                      }}
                      disabled={selectedProducts.length === 0 || !isWithinBusinessHours}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 hover:from-green-600 hover:to-emerald-700 dark:hover:from-green-700 dark:hover:to-emerald-800 text-white border-0 whitespace-nowrap shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Percent className="mr-2 h-4 w-4" />
                      Aplicar a seleccionados
                    </Button>
                  </div>
                  {renderProductsTable(filteredProductsWithoutOffers, false)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl max-w-md p-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400" />
          <AlertDialogHeader className="p-6 pb-4">
            <div className="mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center mx-auto shadow-lg">
              <AlertTriangle className="h-8 w-8 text-amber-500 dark:text-amber-400" />
            </div>
            <AlertDialogTitle className="text-xl text-center font-semibold text-gray-900 dark:text-gray-100">
              {confirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600 dark:text-gray-300">
              {confirmMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center space-x-3 p-6 pt-2">
            <AlertDialogCancel
              onClick={() => setShowConfirmDialog(false)}
              className="border-border/20 hover:bg-accent/50 transition-all duration-200 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md rounded-xl"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmAction()
                setShowConfirmDialog(false)
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 dark:from-purple-600 dark:to-pink-700 dark:hover:from-purple-700 dark:hover:to-pink-800 border-0 shadow-md hover:shadow-lg transition-all duration-200 text-white rounded-xl"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default OffersPage
