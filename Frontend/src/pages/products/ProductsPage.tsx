"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useLocation } from "react-router-dom"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Package,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Barcode,
  AlertTriangle,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Checkbox } from "../../components/ui/checkbox"
import { fetchProducts, createProduct, deleteProduct } from "../../services/productService"
import { Input } from "../../components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
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
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { fetchCategories } from "../../services/categoryService"
import { API_URL } from "../../config/api"
import {
  agregarCodigosBarras,
  obtenerCodigosBarras,
  buscarProductoPorCodigoBarras,
  type CodigoBarrasItem,
} from "../../services/codigoBarrasService"
import { formatCurrency } from "../../lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"
import { NewProductModal } from "../../components/products/NewProductModal"

const ProductsPage = () => {
  // Añadir el hook para cambiar el título del documento
  useDocumentTitle("Productos")

  const navigate = useNavigate()
  const location = useLocation()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showZeroStock, setShowZeroStock] = useState(false)
  const [showStockInconsistencies, setShowStockInconsistencies] = useState(false)
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false)
  const queryClient = useQueryClient()

  // Estados para el escáner de códigos de barras (automático cuando está enfocado el input)
  const [barcodeScanBuffer, setBarcodeScanBuffer] = useState<string>("")
  const [lastScanTime, setLastScanTime] = useState<number>(0)
  const [isSearchInputFocused, setIsSearchInputFocused] = useState<boolean>(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Estados para la vista de imagen
  const [isImageViewOpen, setIsImageViewOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("")

  // Estados para el diálogo de confirmación de eliminación
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null)
  // Estado para productos encontrados por código de barras
  const [barcodeSearchResults, setBarcodeSearchResults] = useState<any[]>([])

  // Estados para ver códigos de barras de un producto
  const [isViewBarcodesDialogOpen, setIsViewBarcodesDialogOpen] = useState(false)
  const [productBarcodes, setProductBarcodes] = useState<any[]>([])

  // Estados para mantener la posición del scroll
  const [scrollPosition, setScrollPosition] = useState(0)
  const [scrollRestorationPending, setScrollRestorationPending] = useState(false)
  const [restorationCompleted, setRestorationCompleted] = useState(false)
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })

  // Fetch categories for the dropdown
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  })

  // Effect unificado para manejar restauración de scroll y página
  useEffect(() => {
    // Enfocar el input de búsqueda al cargar la página
    const focusTimer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
        setIsSearchInputFocused(true)
      }
    }, 100)

    // Si la restauración ya se completó, no hacer nada más
    if (restorationCompleted) {
      return () => clearTimeout(focusTimer)
    }

    // Si no hay state de navegación, marcar restauración como completada
    if (!location.state?.scrollPosition && !location.state?.currentPage) {
      setRestorationCompleted(true)
      return () => clearTimeout(focusTimer)
    }

    // Esperar a que los datos se carguen completamente
    if (isLoading || !products) {
      return () => clearTimeout(focusTimer)
    }

    // Solo proceder si hay datos cargados
    let restorationTimer: NodeJS.Timeout

    // Restaurar página si existe
    if (location.state?.currentPage && location.state.currentPage !== currentPage) {
      setCurrentPage(location.state.currentPage)
      
      // Marcar restauración pendiente solo si también hay scroll position
      if (location.state?.scrollPosition) {
        setScrollRestorationPending(true)
      } else {
        // Si solo hay página pero no scroll, marcar como completado
        setRestorationCompleted(true)
      }
    } else if (location.state?.scrollPosition) {
      // Si la página ya está correcta o no hay cambio de página, restaurar scroll directamente
      restorationTimer = setTimeout(() => {
        // Usar múltiples requestAnimationFrame para asegurar que el DOM esté completamente renderizado
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo({
                top: location.state.scrollPosition,
                behavior: 'instant'
              })
              setScrollRestorationPending(false)
              setRestorationCompleted(true)
            })
          })
        })
      }, 200)
    }

    return () => {
      clearTimeout(focusTimer)
      if (restorationTimer) clearTimeout(restorationTimer)
    }
  }, [location.state, isLoading, products, currentPage, restorationCompleted])

  // Effect separado para manejar el scroll después de cambios de página
  useEffect(() => {
    if (scrollRestorationPending && 
        location.state?.scrollPosition && 
        location.state?.currentPage === currentPage && 
        !isLoading && 
        products) {
      
      // Usar un timeout más largo para asegurar que la paginación se haya renderizado
      const restorationTimer = setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo({
                top: location.state.scrollPosition,
                behavior: 'instant'
              })
              setScrollRestorationPending(false)
              setRestorationCompleted(true)
            })
          })
        })
      }, 300)
      
      return () => clearTimeout(restorationTimer)
    }
    
    // Timeout de seguridad para resetear scrollRestorationPending si algo falla
    if (scrollRestorationPending) {
      const safetyTimer = setTimeout(() => {
        setScrollRestorationPending(false)
        setRestorationCompleted(true)
      }, 2000)
      
      return () => clearTimeout(safetyTimer)
    }
  }, [currentPage, scrollRestorationPending, location.state?.scrollPosition, location.state?.currentPage, isLoading, products])

  // Effect para restaurar scroll position cuando se cierre el modal de códigos de barras
  useEffect(() => {
    if (!isViewBarcodesDialogOpen && scrollPosition > 0) {
      // Restaurar posición del scroll cuando se cierre el modal
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo({
              top: scrollPosition,
              behavior: 'instant'
            })
          })
        })
      }, 150)
      
      return () => clearTimeout(timer)
    }
  }, [isViewBarcodesDialogOpen, scrollPosition])

  // Función para buscar productos por código de barras en tiempo real
  const searchByBarcode = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 5) {
      setBarcodeSearchResults([])
      return
    }

    try {
      // Intentar buscar por código de barras exacto
      const result = await buscarProductoPorCodigoBarras(searchTerm.trim())
      if (result && result.producto) {
        setBarcodeSearchResults([result.producto])
      } else {
        setBarcodeSearchResults([])
      }
    } catch (error: any) {
      // Si no encuentra por código exacto, limpiar resultados
      setBarcodeSearchResults([])
    }
  }, [])

  // Effect para buscar por código de barras cuando cambia el término de búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchByBarcode(searchTerm)
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchByBarcode])

  // Función para construir la URL completa de la imagen
  const getImageUrl = (imagenUrl: string | null | undefined) => {
    if (!imagenUrl) return null

    // Si la imagen_url ya es una URL completa, devolverla tal como está
    if (imagenUrl.startsWith("http")) {
      return imagenUrl
    }

    // Si es una ruta relativa, construir la URL completa
    const baseUrl = API_URL.replace("/api", "")

    // Si imagen_url ya incluye 'uploads/', usar tal como está
    if (imagenUrl.includes("/uploads/")) {
      return `${baseUrl}${imagenUrl}`
    }

    // Si es solo el nombre del archivo, agregarlo a la ruta uploads/productos
    const filename = imagenUrl.split("\\").pop() || imagenUrl.split("/").pop() || imagenUrl
    return `${baseUrl}/uploads/productos/${filename}`
  }

  // Función para abrir la vista de imagen
  const openImageView = (imageUrl: string) => {
    saveScrollPosition()
    setSelectedImageUrl(imageUrl)
    setIsImageViewOpen(true)
  }

  // Función para verificar si un producto tiene inconsistencias de stock
  const hasStockInconsistency = (product: any) => {
    // Si el producto tiene stock pero no tiene códigos de barras, es una inconsistencia
    if (product.stock > 0 && (!product.codigos_barras || product.codigos_barras.length === 0)) {
      return true
    }

    // Si no tiene códigos de barras y no tiene stock, no hay inconsistencia
    if (!product.codigos_barras || product.codigos_barras.length === 0) {
      return false
    }

    // Calcular el stock total de códigos de barras
    const totalBarcodeStock = product.codigos_barras.reduce((total: number, barcode: any) => {
      return total + (barcode.cantidad || 0)
    }, 0)

    // Verificar si hay diferencia entre el stock del producto y el total de códigos de barras
    return product.stock !== totalBarcodeStock
  }

  // Función para guardar la posición actual del scroll y página
  const saveScrollPosition = () => {
    const currentPosition = window.scrollY
    setScrollPosition(currentPosition)
    return {
      scrollPosition: currentPosition,
      currentPage: currentPage
    }
  }

  // Función para restaurar la posición del scroll
  const restoreScrollPosition = (position?: number) => {
    const targetPosition = position || scrollPosition
    // Usar múltiples requestAnimationFrame para asegurar que el DOM esté listo
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: targetPosition,
          behavior: 'instant' // Cambiar a instant para evitar conflictos
        })
      })
    })
  }

  const createMutation = useMutation({
    mutationFn: async ({
      productData,
      barcodes,
    }: {
      productData: any
      barcodes: CodigoBarrasItem[]
    }) => {
      try {
        // Crear el producto primero
        const newProduct = await createProduct(productData)

        // Si hay códigos de barras, agregarlos al producto
        if (barcodes.length > 0) {
          try {
            // Convertir los barcodes al formato que espera la API
            const barcodesData = barcodes.map((item) => ({
              codigo: item.codigo,
              cantidad: item.cantidad,
            }))

            await agregarCodigosBarras(newProduct.id_producto, barcodesData)
          } catch (barcodeError: any) {
            // Si hay error con los códigos, mostramos advertencia pero no fallamos la creación del producto
            toast.warning(`Producto creado, pero: ${barcodeError.message || "Error al agregar códigos de barras"}`)
          }
        }
        return newProduct
      } catch (error: any) {
        // Capturar y relanzar el error para que onError lo maneje
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Producto creado exitosamente")
      setIsNewProductModalOpen(false)
      // NUEVO: Re-enfocar el input de búsqueda después de crear un producto
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
          setIsSearchInputFocused(true)
        }
      }, 100)
    },
    onError: (error: any) => {
      const errorMessage = error.message || error.response?.data?.message || "Error al crear el producto"
      toast.error(errorMessage)
    },
  })

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Producto eliminado exitosamente")
      // NUEVO: Re-enfocar el input de búsqueda después de eliminar un producto
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
          setIsSearchInputFocused(true)
        }
        restoreScrollPosition()
      }, 100)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al eliminar el producto")
    },
  })

  // Función para manejar el envío del formulario del modal
  const handleNewProductSubmit = async (values: any, barcodes: CodigoBarrasItem[], image: File | null) => {
    // Calcular el stock total basado en los códigos de barras
    const totalStock = barcodes.reduce((total, barcode) => total + barcode.cantidad, 0)

    // Asegurarse de que el precio con IGV sea el que ingresa el usuario
    const precioConIGV = values.precio_unitario
    // Calcular el precio sin IGV (precio neto)
    const precioSinIGV = Number((precioConIGV / 1.18).toFixed(2))

    // Calcular precio mayorista con IGV si existe
    let precioMayoristaConIGV = null
    let precioMayoristaSinIGV = null

    if (
      values.precio_mayoritario !== null &&
      values.precio_mayoritario !== undefined &&
      values.precio_mayoritario > 0
    ) {
      precioMayoristaConIGV = values.precio_mayoritario
      precioMayoristaSinIGV = Number((precioMayoristaConIGV / 1.18).toFixed(2))
    }

    // Crear objeto con los datos modificados, incluyendo el stock calculado y la imagen
    const productData = {
      sku: values.sku,
      nombre: values.nombre,
      descripcion: values.descripcion || "",
      precio_unitario: precioSinIGV,
      precio_unitario_con_igv: precioConIGV,
      precio_mayoritario: precioMayoristaSinIGV,
      precio_mayoritario_con_igv: precioMayoristaConIGV,
      stock: totalStock,
      id_categoria: values.id_categoria,
      es_oferta: false,
      imagen: image,
    }

    await createMutation.mutateAsync({ productData, barcodes })
  }

  // Ver códigos de barras de un producto
  const viewProductBarcodes = async (productId: number) => {
    try {
      const data = await obtenerCodigosBarras(productId)
      // La respuesta tiene la estructura: { producto: {...}, total_codigos: number, codigos_barras: [...] }
      setProductBarcodes(data.codigos_barras || [])
      setIsViewBarcodesDialogOpen(true)
    } catch (error: any) {
      toast.error(error.message || "Error al obtener códigos de barras")
    }
  }

  // Función para confirmar eliminación
  const confirmDelete = (productId: number) => {
    saveScrollPosition()
    setDeletingProductId(productId)
    setShowDeleteDialog(true)
  }

  // Función para eliminar producto
  const handleDelete = () => {
    if (deletingProductId) {
      deleteMutation.mutate(deletingProductId)
      setShowDeleteDialog(false)
      setDeletingProductId(null)
    }
  }

  // Función para navegar a edición preservando la posición y página
  const handleEdit = (productId: number) => {
    const currentState = saveScrollPosition()
    navigate(`/products/${productId}`, { state: currentState })
  }

  // Función para ver códigos de barras
  const handleViewBarcodes = (productId: number) => {
    saveScrollPosition()
    viewProductBarcodes(productId)
  }

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

      // MEJORADO: Funciona cuando el input está enfocado O cuando no hay ningún modal abierto
      const isModalOpen = isNewProductModalOpen || showDeleteDialog || isViewBarcodesDialogOpen || isImageViewOpen
      const shouldProcessScan =
        isSearchInputFocused ||
        (!isModalOpen && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA")

      if (!shouldProcessScan) {
        return
      }

      // Si no está enfocado el input pero debería procesar el escaneo, enfocarlo automáticamente
      if (!isSearchInputFocused && searchInputRef.current) {
        searchInputRef.current.focus()
        setIsSearchInputFocused(true)
      }

      const currentTime = new Date().getTime()

      if (event.key === "Enter") {
        event.preventDefault()

        if (barcodeScanBuffer.trim()) {
          // Intentar buscar directamente por código de barras primero
          processScannedBarcode(barcodeScanBuffer.trim())
          setBarcodeScanBuffer("")
        }
        return
      }

      if (event.key.length > 1 && event.key !== "Space") {
        return
      }

      // Detectar escaneo rápido de códigos de barras (caracteres en menos de 100ms para ser más sensible)
      if (currentTime - lastScanTime > 100) {
        setBarcodeScanBuffer(event.key === "Space" ? " " : event.key)
      } else {
        setBarcodeScanBuffer((prev) => prev + (event.key === "Space" ? " " : event.key))
      }

      setLastScanTime(currentTime)
    },
    [
      barcodeScanBuffer,
      isSearchInputFocused,
      lastScanTime,
      isNewProductModalOpen,
      showDeleteDialog,
      isViewBarcodesDialogOpen,
      isImageViewOpen,
    ],
  )

  // Función para procesar un código escaneado o buscar en la tabla por código
  const processScannedBarcode = async (barcode: string) => {
    if (!barcode.trim()) return

    try {
      // Primero intentar buscar el producto directamente por código de barras
      const result = await buscarProductoPorCodigoBarras(barcode.trim())
      if (result && result.producto) {
        // Navegar directamente al producto encontrado
        navigate(`/products/${result.producto.id_producto}`)
        toast.success(`Producto encontrado: ${result.producto.nombre}`)
        return
      }
    } catch (error: any) {
      // Si no encuentra el producto por código de barras, intentar buscar en la lista local
    }

    // Si no se encontró por API, buscar en la lista local de productos
    if (products && products.length > 0) {
      // Usar el código como término de búsqueda para filtrar la tabla
      setSearchTerm(barcode.trim())

      // También podemos hacer una búsqueda directa en la lista para dar feedback inmediato
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
      // Si no hay productos cargados, usar el código como término de búsqueda
      setSearchTerm(barcode.trim())
      toast.info(`Buscando productos con código: ${barcode.trim()}`)
    }
  }

  // Effect para manejar el registro y limpieza de los event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleBarcodeScanning)
    return () => {
      window.removeEventListener("keydown", handleBarcodeScanning)
    }
  }, [handleBarcodeScanning])

  // Estado para el tipo de orden
  const [sortType, setSortType] = useState("id_desc") // id_desc, id_asc, name_asc, name_desc, stock_asc, stock_desc

  // Filtrar productos - incluyendo búsqueda por código de barras y ordenamiento
  const filteredProducts = (() => {
    if (!products) return []

    const searchLower = searchTerm.toLowerCase()
    
    // Productos encontrados por nombre/SKU
    const nameSkuResults = products.filter((product: any) => {
      const matchesSearch =
        product.nombre.toLowerCase().includes(searchLower) || product.sku.toLowerCase().includes(searchLower)
      const matchesCategory =
        !categoryFilter || categoryFilter === "all" || product.id_categoria.toString() === categoryFilter
      const matchesStock = showZeroStock ? product.stock === 0 : product.stock > 0
      const matchesInconsistency = showStockInconsistencies ? hasStockInconsistency(product) : true
      return matchesSearch && matchesCategory && matchesStock && matchesInconsistency
    })
    
    // Productos encontrados por código de barras
    const barcodeResults = barcodeSearchResults.filter((product: any) => {
      const matchesCategory =
        !categoryFilter || categoryFilter === "all" || product.id_categoria.toString() === categoryFilter
      const matchesStock = showZeroStock ? product.stock === 0 : product.stock > 0
      const matchesInconsistency = showStockInconsistencies ? hasStockInconsistency(product) : true
      return matchesCategory && matchesStock && matchesInconsistency
    })
    
    // Combinar resultados y eliminar duplicados
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
  })()

  // Pagination logic
  const totalPages = Math.ceil((filteredProducts?.length || 0) / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = filteredProducts?.slice(startIndex, endIndex)

  // NUEVO: Función para manejar el cierre de modales y re-enfocar
  const handleModalClose = (closeFunction: () => void) => {
    closeFunction()
    // Re-enfocar el input después de cerrar cualquier modal
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
        setIsSearchInputFocused(true)
      }
      // Restaurar scroll position si existe
      if (scrollPosition > 0) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo({
              top: scrollPosition,
              behavior: 'instant'
            })
          })
        })
      }
    }, 100)
  }

  // Effect para manejar el scroll del body cuando cualquier modal esté abierto
  useEffect(() => {
    const isModalOpen = isNewProductModalOpen || showDeleteDialog || isViewBarcodesDialogOpen || isImageViewOpen
    
    if (isModalOpen) {
      // Prevenir scroll del body cuando cualquier modal esté abierto
      document.body.style.overflow = 'hidden'
      
      // Cerrar modales con Escape
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (isImageViewOpen) {
            handleModalClose(() => setIsImageViewOpen(false))
          } else if (isViewBarcodesDialogOpen) {
            handleModalClose(() => setIsViewBarcodesDialogOpen(false))
          } else if (showDeleteDialog) {
            handleModalClose(() => setShowDeleteDialog(false))
          } else if (isNewProductModalOpen) {
            handleModalClose(() => setIsNewProductModalOpen(false))
          }
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.body.style.overflow = 'unset'
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isNewProductModalOpen, showDeleteDialog, isViewBarcodesDialogOpen, isImageViewOpen])

  // Effect para resetear el estado de restauración cuando el usuario interactúe con filtros
  useEffect(() => {
    // Solo resetear la página cuando la restauración esté completada y el usuario interactúe con filtros
    if (restorationCompleted) {
      // Si hay filtros activos, resetear a la primera página
      if (searchTerm || categoryFilter !== "all" || showZeroStock || showStockInconsistencies) {
        setCurrentPage(1)
      }
    }
  }, [searchTerm, categoryFilter, showZeroStock, showStockInconsistencies, restorationCompleted])

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
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Productos
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-gray-600 dark:text-gray-400">Gestiona el inventario de tus productos</p>
              {isSearchInputFocused && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Escáner activo
                </motion.div>
              )}
            </div>
          </div>
          <Button
            onClick={() => setIsNewProductModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </>
            )}
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar por nombre, SKU o código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchInputFocused(true)}
                onBlur={() => setIsSearchInputFocused(false)}
                className={`pl-10 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl ${
                  isSearchInputFocused ? "ring-2 ring-blue-500/30 border-blue-500/50" : ""
                }`}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id_categoria} value={category.id_categoria.toString()}>
                    {category.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="zero-stock"
                checked={showZeroStock}
                onCheckedChange={(checked) => setShowZeroStock(checked === true)}
              />
              <label
                htmlFor="zero-stock"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Solo sin stock
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="stock-inconsistencies"
                checked={showStockInconsistencies}
                onCheckedChange={(checked) => setShowStockInconsistencies(checked === true)}
              />
              <label
                htmlFor="stock-inconsistencies"
                className="text-sm font-medium text-amber-700 dark:text-amber-300 cursor-pointer"
              >
                Requieren ajuste de stock
              </label>
            </div>
            <div>
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm w-full"
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
        </motion.div>

        <motion.div
          className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {filteredProducts && filteredProducts.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 dark:border-gray-700">
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Imagen</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">SKU</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Nombre</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Categoría</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Precio Unitario</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Precio Mayorista</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Stock</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {currentProducts?.map((product: any, index: number) => (
                        <motion.tr
                          key={product.id_producto}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <TableCell className="p-4">
                            {product.imagen_url ? (
                              <div
                                className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer group relative"
                                onClick={() => openImageView(getImageUrl(product.imagen_url)!)}
                                tabIndex={0}
                                role="button"
                                aria-label="Ver imagen"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ")
                                    openImageView(getImageUrl(product.imagen_url)!)
                                }}
                              >
                                <img
                                  src={getImageUrl(product.imagen_url) || ""}
                                  alt={product.nombre}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200 pointer-events-none"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                                  <Eye className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">{product.sku}</TableCell>
                          <TableCell className="text-gray-900 dark:text-gray-100">{product.nombre}</TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">
                            {product.categoria?.nombre || "Sin categoría"}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                            <div className="space-y-1">
                              {product.es_oferta && product.precio_oferta_con_igv ? (
                                <div className="flex flex-col">
                                  <span className="line-through text-gray-500 text-sm">
                                    {formatCurrency(Number(product.precio_unitario_con_igv))}
                                  </span>
                                  <span className="text-red-600 dark:text-red-400 font-semibold">
                                    {formatCurrency(Number(product.precio_oferta_con_igv))}
                                  </span>
                                  <Badge variant="destructive" className="w-fit text-xs">
                                    OFERTA
                                  </Badge>
                                </div>
                              ) : (
                                <span>{formatCurrency(Number(product.precio_unitario_con_igv))}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                            {product.precio_mayoritario_con_igv ? (
                              <span>{formatCurrency(Number(product.precio_mayoritario_con_igv))}</span>
                            ) : (
                              <span className="text-gray-400 text-sm">No definido</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
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
                              {hasStockInconsistency(product) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center justify-center w-6 h-6 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-full">
                                        <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-sm space-y-1">
                                        {product.stock > 0 && (!product.codigos_barras || product.codigos_barras.length === 0) ? (
                                          <>
                                            <p className="font-medium">Sin códigos de barras</p>
                                            <p className="text-xs">Stock: {product.stock} | Códigos: 0</p>
                                            <p className="text-xs text-muted-foreground">Posible venta eliminada</p>
                                          </>
                                        ) : (
                                          <>
                                            <p className="font-medium">Inconsistencia de stock</p>
                                            <p className="text-xs">
                                              Stock: {product.stock} | Códigos: {product.codigos_barras?.reduce((total: number, barcode: any) => total + (barcode.cantidad || 0), 0) || 0}
                                            </p>
                                          </>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewBarcodes(product.id_producto)}
                                      className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                    >
                                      <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ver códigos de barras</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(product.id_producto)}
                                      className="h-8 w-8 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                                    >
                                      <Edit className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar producto</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => confirmDelete(product.id_producto)}
                                      className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/50"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Eliminar producto</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProducts?.length || 0)} de{" "}
                    {filteredProducts?.length || 0} productos
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPage(Math.max(1, currentPage - 1))
                        setRestorationCompleted(true) // Marcar que la navegación manual ha tomado control
                      }}
                      disabled={currentPage === 1}
                      className="bg-white/50 dark:bg-gray-700/50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                        setRestorationCompleted(true) // Marcar que la navegación manual ha tomado control
                      }}
                      disabled={currentPage === totalPages}
                      className="bg-white/50 dark:bg-gray-700/50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <motion.div
              className="flex flex-col items-center justify-center py-16 text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/80 dark:border-gray-700/80"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-6 shadow-lg">
                <Package className="h-10 w-10 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchTerm || categoryFilter !== "all" || showZeroStock || showStockInconsistencies
                  ? "No se encontraron productos"
                  : "No hay productos"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
                {searchTerm || categoryFilter !== "all" || showZeroStock || showStockInconsistencies
                  ? "No se encontraron productos que coincidan con los filtros aplicados"
                  : "Comienza creando tu primer producto para gestionar tu inventario"}
              </p>
              {!searchTerm && categoryFilter === "all" && !showZeroStock && !showStockInconsistencies ? (
                <Button
                  onClick={() => setIsNewProductModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Producto
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setCategoryFilter("all")
                      setShowZeroStock(false)
                      setShowStockInconsistencies(false)
                      setCurrentPage(1)
                      // Re-enfocar después de limpiar filtros
                      setTimeout(() => {
                        if (searchInputRef.current) {
                          searchInputRef.current.focus()
                          setIsSearchInputFocused(true)
                        }
                      }, 100)
                    }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    Limpiar filtros
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400">o intenta con otros términos de búsqueda</p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* New Product Modal */}
      <NewProductModal
        isOpen={isNewProductModalOpen}
        onClose={() => handleModalClose(() => setIsNewProductModalOpen(false))}
        onSubmit={handleNewProductSubmit}
        categories={categories}
        isSubmitting={createMutation.isPending}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            handleModalClose(() => setShowDeleteDialog(false))
          } else {
            setShowDeleteDialog(true)
          }
        }}
      >
        <AlertDialogContent className="bg-card/95 backdrop-blur-sm border border-border/50 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold text-center text-gray-900 dark:text-gray-100">
              Eliminar producto
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600 dark:text-gray-400">
              ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center space-x-3 mt-6">
            <AlertDialogCancel
              onClick={() => handleModalClose(() => setShowDeleteDialog(false))}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View barcodes dialog */}
      <Dialog
        open={isViewBarcodesDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleModalClose(() => setIsViewBarcodesDialogOpen(false))
          } else {
            setIsViewBarcodesDialogOpen(true)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Códigos de Barras</DialogTitle>
            <DialogDescription>Códigos asociados a este producto</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {productBarcodes.length > 0 ? (
              productBarcodes.map((barcode: any, index: number) => (
                <div
                  key={barcode.id || index}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                      <Barcode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-medium">{barcode.codigo}</span>
                      <span className="text-xs text-muted-foreground">
                        Agregado: {new Date(barcode.fecha_ingreso).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{barcode.cantidad} unidades</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 bg-transparent"
                      onClick={() => {
                        navigator.clipboard.writeText(barcode.codigo)
                        toast.success("Código copiado al portapapeles")
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Barcode className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Sin códigos de barras</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Este producto no tiene códigos de barras asociados
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image view modal */}
      {isImageViewOpen && selectedImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => handleModalClose(() => setIsImageViewOpen(false))}
        >
          <div className="relative max-w-md max-h-96 flex items-center justify-center">
            <div className="relative">
              <img
                src={selectedImageUrl || "/placeholder.svg"}
                alt="Imagen del producto"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/70 text-white hover:bg-black/90 border-white/20 rounded-full h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  handleModalClose(() => setIsImageViewOpen(false))
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsPage
