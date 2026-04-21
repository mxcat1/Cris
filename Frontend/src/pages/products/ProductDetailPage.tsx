"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowLeft,
  Save,
  Loader2,
  Package,
  Info,
  Barcode,
  Plus,
  Upload,
  X,
  Trash2,
  Copy,
  Scan,
  Shuffle,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Badge } from "../../components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { fetchProductById, updateProduct, deleteProductImage } from "../../services/productService"
import { fetchCategories } from "../../services/categoryService"
import { API_URL } from "../../config/api"
import {
  obtenerCodigosBarras,
  agregarCodigosBarras,
  type CodigoBarrasItem,
  actualizarCantidadCodigoBarras,
  eliminarCodigoBarras,
  verificarCodigoBarrasExiste,
  generarCodigoBarrasAleatorio,
} from "../../services/codigoBarrasService"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"

// Esquema de validación para aclarar que los precios son con IGV
const productSchema = z.object({
  sku: z.string().min(1, "El SKU es requerido"),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  precio_unitario: z.coerce.number().min(0, "El precio con IGV debe ser mayor o igual a 0"),
  precio_mayoritario: z.coerce
    .number()
    .min(0, "El precio mayorista con IGV debe ser mayor o igual a 0")
    .optional()
    .nullable(),
  id_categoria: z.coerce.number().min(1, "La categoría es requerida"),
  imagen: z.instanceof(File).optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

// Tipo extendido para la mutación que incluye el stock calculado
type ProductFormData = ProductFormValues & {
  stock: number
  precio_unitario_con_igv: number
  precio_mayoritario_con_igv: number | null
}

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Función para navegar de vuelta preservando la posición del scroll y página
  const handleBackNavigation = () => {
    // Si hay estado de navegación, úsalo; de lo contrario, navega sin estado
    if (location.state?.scrollPosition || location.state?.currentPage) {
      const navState = { 
        scrollPosition: location.state?.scrollPosition || 0,
        currentPage: location.state?.currentPage || 1 
      }
      navigate("/products", { state: navState })
    } else {
      navigate("/products")
    }
  }
  
  useDocumentTitle(`Editar Producto #${id}`)
  const queryClient = useQueryClient()
  const [isAddBarcodeDialogOpen, setIsAddBarcodeDialogOpen] = useState(false)
  const [newBarcode, setNewBarcode] = useState("")
  const [newBarcodeQuantity, setNewBarcodeQuantity] = useState(1)
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [formChanged, setFormChanged] = useState(false)

  // Estados para manejar las cantidades en edición
  const [editingQuantities, setEditingQuantities] = useState<Record<number, number>>({})
  const [pendingBarcodeChanges, setPendingBarcodeChanges] = useState<Record<string, number>>({})
  const [, setOriginalStock] = useState<number>(0)

  // Estados para la detección del lector de códigos de barras
  const [barcodeScanBuffer, setBarcodeScanBuffer] = useState<string>("")
  const [lastScanTime, setLastScanTime] = useState<number>(0)
  const [isListeningForScanner, setIsListeningForScanner] = useState<boolean>(false)
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false)

  // Estados para manejo de imagen
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isImageViewOpen, setIsImageViewOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [deleteImage, setDeleteImage] = useState(false)

  // Estados para manejar códigos de barras temporales
  const [tempBarcodes, setTempBarcodes] = useState<CodigoBarrasItem[]>([])
  const [barcodesToDelete, setBarcodesToDelete] = useState<number[]>([])
  const [deletingBarcodes, setDeletingBarcodes] = useState<number[]>([])

  // Fetch product details
  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductById(Number(id)),
  })

  // Fetch categories for the dropdown
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  })

  // Fetch barcodes for the product
  const { data: barcodesData, isLoading: isLoadingBarcodes } = useQuery({
    queryKey: ["barcodes", id],
    queryFn: () => obtenerCodigosBarras(Number(id)),
    enabled: !!id,
  })

  // Función para calcular el stock total desde los códigos de barras
  const calculateTotalStock = useCallback(() => {
    let total = 0

    // Sumar códigos de barras existentes (excluyendo los marcados para eliminar)
    if (barcodesData?.codigos_barras) {
      barcodesData.codigos_barras.forEach((barcode: { id: number; cantidad: number }) => {
        if (!barcodesToDelete.includes(barcode.id)) {
          const currentQuantity =
            editingQuantities[barcode.id] !== undefined ? editingQuantities[barcode.id] : barcode.cantidad
          total += currentQuantity
        }
      })
    }

    // Sumar códigos de barras temporales
    tempBarcodes.forEach((tempBarcode) => {
      total += tempBarcode.cantidad
    })

    return total
  }, [barcodesData, editingQuantities, tempBarcodes, barcodesToDelete])

  // Función para verificar si hay inconsistencia de stock
  const hasStockInconsistency = useCallback(() => {
    if (!product) return false
    
    const barcodeStock = calculateTotalStock()
    const productStock = product.stock
    
    return productStock !== barcodeStock
  }, [product, calculateTotalStock])

  // Función para obtener la diferencia de stock que debe ajustarse
  const getStockDifference = useCallback(() => {
    if (!product) return 0
    
    const barcodeStock = calculateTotalStock()
    const productStock = product.stock
    
    return productStock - barcodeStock
  }, [product, calculateTotalStock])

  // Funciones para manejo de imagen
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no puede ser mayor a 5MB")
        return
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten archivos de imagen")
        return
      }

      setSelectedImage(file)
      setDeleteImage(false)

      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setFormChanged(true)
    }
  }

  const clearImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setDeleteImage(true)
    setFormChanged(true)
  }

  const openImageView = (imageUrl: string) => {
    // Prevenir que se abra el modal si hay una restauración de scroll en curso
    if (location.state?.scrollPosition) {
      // Esperar un poco para asegurar que cualquier scroll restoration haya terminado
      setTimeout(() => {
        setSelectedImageUrl(imageUrl)
        setIsImageViewOpen(true)
      }, 100)
    } else {
      setSelectedImageUrl(imageUrl)
      setIsImageViewOpen(true)
    }
  }

  const getCurrentImageUrl = () => {
    if (imagePreview) return imagePreview
    if (product?.imagen_url && !deleteImage) {
      if (product.imagen_url.startsWith("http")) {
        return product.imagen_url
      }

      const baseUrl = API_URL.replace("/api", "")

      if (product.imagen_url.includes("/uploads/")) {
        return `${baseUrl}${product.imagen_url}`
      }

      const filename = product.imagen_url.split("\\").pop() || product.imagen_url.split("/").pop() || product.imagen_url
      return `${baseUrl}/uploads/productos/${filename}`
    }
    return null
  }

  // Función para manejar eventos de teclado y detectar escaneos
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

      if (!isListeningForScanner) {
        return
      }

      const activeElement = document.activeElement
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") &&
        activeElement !== barcodeInputRef.current

      if (isInputFocused) {
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

      if (currentTime - lastScanTime > 500) {
        setBarcodeScanBuffer(event.key === "Space" ? " " : event.key)
      } else {
        setBarcodeScanBuffer((prev) => prev + (event.key === "Space" ? " " : event.key))
      }

      setLastScanTime(currentTime)
    },
    [barcodeScanBuffer, isListeningForScanner, lastScanTime, barcodeInputRef],
  )

  // Función para procesar un código escaneado
  const processScannedBarcode = async (barcode: string) => {
    if (!barcode.trim()) return

    // Verificar si existe en códigos actuales
    const existingCurrent = barcodesData?.codigos_barras.find(
      (code: { codigo: string }) => code.codigo === barcode.trim(),
    )
    if (existingCurrent) {
      // Mostrar error en lugar de incrementar automáticamente
      toast.error(`El código ${barcode.trim()} ya está agregado en este producto`)
      return
    }

    // Verificar si existe en códigos temporales
    const existingTempIndex = tempBarcodes.findIndex((tempCode) => tempCode.codigo === barcode.trim())
    if (existingTempIndex !== -1) {
      // Mostrar error en lugar de incrementar automáticamente
      toast.error(`El código ${barcode.trim()} ya está agregado temporalmente en este producto`)
      return
    }

    try {
      const exists = await verificarCodigoBarrasExiste(barcode.trim())
      if (exists) {
        toast.error("Este código de barras ya existe en otro producto")
        return
      }
    } catch (error: any) {
      console.error("Error al verificar código de barras:", error)
      toast.error("Error al verificar el código de barras")
      return
    }

    // Llenar automáticamente el campo del modal
    setNewBarcode(barcode.trim())
    setNewBarcodeQuantity(1)

    toast.success(`Código escaneado: ${barcode.trim()}. Presiona 'Agregar' para confirmar.`)
  }

  // Función para generar código de barras aleatorio
  const generateRandomBarcode = async () => {
    setIsGeneratingBarcode(true)
    try {
      const codigo = await generarCodigoBarrasAleatorio()
      // Limitar el código a máximo 10 caracteres
      const codigoLimitado = codigo.substring(0, 10)
      setNewBarcode(codigoLimitado)
      setTimeout(() => {
        barcodeInputRef.current?.focus()
      }, 100)
    } catch (error) {
      console.error("Error al generar código de barras:", error)
      toast.error("Error al generar código de barras único. Intenta de nuevo.")
    } finally {
      setIsGeneratingBarcode(false)
    }
  }

  // Toggle scanner
  const toggleScanner = () => {
    setIsListeningForScanner(!isListeningForScanner)
    if (!isListeningForScanner) {
      setTimeout(() => {
        barcodeInputRef.current?.focus()
      }, 100)
    }
  }

  // Effect para manejar el registro y limpieza de los event listeners
  useEffect(() => {
    if (isAddBarcodeDialogOpen) {
      window.addEventListener("keydown", handleBarcodeScanning)
      setIsListeningForScanner(true)
    } else {
      window.removeEventListener("keydown", handleBarcodeScanning)
      setIsListeningForScanner(false)
      setBarcodeScanBuffer("")
    }

    return () => {
      window.removeEventListener("keydown", handleBarcodeScanning)
    }
  }, [isAddBarcodeDialogOpen, handleBarcodeScanning])

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: (data: ProductFormData) => updateProduct(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product", id] })
      queryClient.invalidateQueries({ queryKey: ["barcodes", id] })

      setTempBarcodes([])
      setBarcodesToDelete([])
      setPendingBarcodeChanges({})
      setEditingQuantities({})
      setFormChanged(false)

      toast.success("Producto actualizado exitosamente")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al actualizar el producto")
    },
  })

  // Add barcodes mutation
  const addBarcodesMutation = useMutation({
    mutationFn: (barcodeData: CodigoBarrasItem[]) => agregarCodigosBarras(Number(id), barcodeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barcodes", id] })
      toast.success("Código de barras agregado exitosamente")
      setNewBarcode("")
      setNewBarcodeQuantity(1)
      setIsAddBarcodeDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ["product", id] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al agregar código de barras")
    },
  })

  const updateBarcodeQuantityMutation = useMutation({
    mutationFn: ({ barcode, quantity }: { barcode: string; quantity: number }) =>
      actualizarCantidadCodigoBarras(barcode, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barcodes", id] })
      queryClient.invalidateQueries({ queryKey: ["product", id] })
      setEditingQuantities({})
    },
    onError: (error: any) => {
      console.error("Error al actualizar la cantidad:", error)
    },
  })

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: () => deleteProductImage(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] })
      setDeleteImage(false)
      setSelectedImage(null)
      setImagePreview(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al eliminar la imagen")
    },
  })

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      nombre: "",
      descripcion: "",
      precio_unitario: 0,
      precio_mayoritario: null,
      id_categoria: 0,
    },
  })

  // Effect para cargar los datos del producto
  useEffect(() => {
    if (product) {
      form.reset({
        sku: product.sku,
        nombre: product.nombre,
        descripcion: product.descripcion || "",
        precio_unitario: Number.parseFloat(product.precio_unitario_con_igv),
        precio_mayoritario: product.precio_mayoritario_con_igv
          ? Number.parseFloat(product.precio_mayoritario_con_igv)
          : null,
        id_categoria: product.id_categoria,
      })

      setOriginalStock(product.stock)
      setSelectedImage(null)
      setImagePreview(null)
      setDeleteImage(false)

      setTimeout(() => {
        form.setValue("id_categoria", product.id_categoria)
      }, 100)

      setFormChanged(false)
      setTempBarcodes([])
      setBarcodesToDelete([])
      setPendingBarcodeChanges({})
      setEditingQuantities({})
    }
  }, [product, form]) // Effect para detectar cambios en el formulario y códigos de barras
  useEffect(() => {
    if (!product) return

    // Verificar cambios en códigos de barras primero
    const hasBarcodeChanges =
      tempBarcodes.length > 0 ||
      Object.keys(pendingBarcodeChanges).length > 0 ||
      barcodesToDelete.length > 0 ||
      selectedImage !== null ||
      deleteImage

    if (hasBarcodeChanges) {
      setFormChanged(true)
      return
    }

    // Suscribirse a cambios del formulario
    const subscription = form.watch((value) => {
      const hasFormChanges =
        value.sku !== product.sku ||
        value.nombre !== product.nombre ||
        value.descripcion !== (product.descripcion || "") ||
        Number(value.precio_unitario) !== Number.parseFloat(product.precio_unitario_con_igv) ||
        (value.precio_mayoritario === null
          ? product.precio_mayoritario_con_igv === null
          : product.precio_mayoritario_con_igv === null
            ? true
            : Number(value.precio_mayoritario) !== Number.parseFloat(product.precio_mayoritario_con_igv)) ||
        Number(value.id_categoria) !== product.id_categoria

      setFormChanged(hasFormChanges)
    })

    return () => subscription.unsubscribe()
  }, [form, product, tempBarcodes, pendingBarcodeChanges, barcodesToDelete, selectedImage, deleteImage])

  // Función para actualizar cantidades de códigos de barras
  const updateBarcodeQuantity = (barcodeId: number, barcodeCode: string, quantity: number) => {
    setEditingQuantities((prev) => ({
      ...prev,
      [barcodeId]: quantity,
    }))

    setPendingBarcodeChanges((prev) => ({
      ...prev,
      [barcodeCode]: quantity,
    }))

    setFormChanged(true)
  }

  const handleQuantityChange = (barcodeId: number, barcodeCode: string, quantity: number) => {
    updateBarcodeQuantity(barcodeId, barcodeCode, quantity)
  }

  // Función para enviar el formulario
  const onSubmit = async (data: ProductFormValues) => {
    // Eliminar códigos de barras marcados para eliminación
    if (barcodesToDelete.length > 0) {
      try {
        const deletePromises = barcodesToDelete.map((barcodeId: number) => eliminarCodigoBarras(barcodeId))

        await Promise.all(deletePromises)
        toast.success(`${barcodesToDelete.length} código(s) de barras eliminado(s)`)
        setBarcodesToDelete([])
      } catch (error) {
        console.error("Error al eliminar códigos de barras:", error)
        toast.error("Error al eliminar códigos de barras")
        return
      }
    }

    // Guardar códigos de barras temporales
    if (tempBarcodes.length > 0) {
      try {
        await addBarcodesMutation.mutateAsync(tempBarcodes)
        setTempBarcodes([])
      } catch (error) {
        toast.error("Error al guardar códigos de barras temporales")
        return
      }
    }

    // Actualizar cantidades de códigos de barras
    const barcodePromises = Object.entries(pendingBarcodeChanges).map(([barcode, quantity]) => {
      return updateBarcodeQuantityMutation.mutateAsync({ barcode, quantity })
    })

    try {
      if (barcodePromises.length > 0) {
        await Promise.all(barcodePromises)
        setPendingBarcodeChanges({})
      }
    } catch (error) {
      toast.error("Error al actualizar cantidades de códigos de barras")
      return
    }

    // Manejar eliminación de imagen
    if (deleteImage && product?.imagen_url) {
      try {
        await deleteImageMutation.mutateAsync()
      } catch (error) {
        return
      }
    }

    const precioConIGV = data.precio_unitario
    const precioSinIGV = Number((precioConIGV / 1.18).toFixed(2))

    let precioMayoristaConIGV = null
    let precioMayoristaSinIGV = null

    if (data.precio_mayoritario !== null && data.precio_mayoritario !== undefined && data.precio_mayoritario > 0) {
      precioMayoristaConIGV = data.precio_mayoritario
      precioMayoristaSinIGV = Number((precioMayoristaConIGV / 1.18).toFixed(2))
    }

    const calculatedStock = calculateTotalStock()

    const productData: ProductFormData = {
      ...data,
      stock: calculatedStock,
      precio_unitario: precioSinIGV,
      precio_unitario_con_igv: precioConIGV,
      precio_mayoritario: precioMayoristaSinIGV,
      precio_mayoritario_con_igv: precioMayoristaConIGV,
    }

    if (selectedImage) {
      productData.imagen = selectedImage
    }

    updateMutation.mutate(productData)
  }

  const handleDeleteBarcode = (barcodeId: number) => {
    // Agregar a la lista de eliminando con animación
    setDeletingBarcodes((prev) => [...prev, barcodeId])

    // Después de un breve delay, mover a la lista de eliminados
    setTimeout(() => {
      setBarcodesToDelete((prev) => [...prev, barcodeId])
      setDeletingBarcodes((prev) => prev.filter((id) => id !== barcodeId))
      setFormChanged(true)
      toast.success("Código marcado para eliminación")
    }, 300)
  }

  // Función para agregar código de barras
  const handleAddBarcode = async () => {
    if (!newBarcode.trim()) {
      toast.error("Ingresa un código de barras válido")
      return
    }

    // Verificar si existe en códigos actuales
    const existingCurrent = barcodesData?.codigos_barras.find(
      (code: { codigo: string }) => code.codigo === newBarcode.trim(),
    )
    if (existingCurrent) {
      toast.error(`El código ${newBarcode.trim()} ya está agregado en este producto`)
      return
    }

    // Verificar si existe en códigos temporales
    const existingTempIndex = tempBarcodes.findIndex((tempCode) => tempCode.codigo === newBarcode.trim())
    if (existingTempIndex !== -1) {
      toast.error(`El código ${newBarcode.trim()} ya está agregado temporalmente en este producto`)
      return
    }

    try {
      const exists = await verificarCodigoBarrasExiste(newBarcode.trim())
      if (exists) {
        toast.error("Este código de barras ya existe en otro producto")
        return
      }
    } catch (error: any) {
      console.error("Error al verificar código de barras:", error)
      toast.error("Error al verificar el código de barras")
      return
    }

    if (newBarcodeQuantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0")
      return
    }

    setTempBarcodes((prev) => [
      ...prev,
      {
        codigo: newBarcode.trim(),
        cantidad: newBarcodeQuantity,
      },
    ])

    toast.success("Código agregado temporalmente. Presiona 'Guardar Cambios' para confirmar.")

    setNewBarcode("")
    setNewBarcodeQuantity(1)
    setIsAddBarcodeDialogOpen(false)
    setFormChanged(true)
  }
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Cargando detalles del producto...</p>
        </div>
      </div>
    )
  }
  if (isError || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <Info className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Producto no encontrado</h2>
          <p className="text-gray-600 dark:text-gray-400">El producto que buscas no existe o ha sido eliminado</p>
          <Button
            onClick={() => handleBackNavigation()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Productos
          </Button>
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
        {" "}
        {/* Header con gradiente */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBackNavigation()}
              className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {product.nombre}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  SKU: <span className="font-medium">{product.sku}</span>
                </p>
                <Badge variant="secondary" className="text-xs">
                  ID: {product.id_producto}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {formChanged && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium"
              >
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                Cambios sin guardar
              </motion.div>
            )}
          </div>
        </motion.div>
        {/* Layout principal */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {" "}
          {/* Formulario principal */}
          <div className="lg:col-span-2">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/20 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white">
                <h2 className="text-xl font-bold flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Detalles del Producto
                </h2>
                <p className="text-white/90 mt-1">Actualiza la información del producto</p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="p-6 space-y-6">
                    {/* SKU y Categoría */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {" "}
                      <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">SKU</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Código único del producto"
                                {...field}
                                className="h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200"
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                          </FormItem>
                        )}
                      />{" "}
                      <FormField
                        control={form.control}
                        name="id_categoria"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Categoría
                            </FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(Number.parseInt(value))}
                              value={field.value ? field.value.toString() : ""}
                              defaultValue={field.value ? field.value.toString() : ""}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                                  <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 shadow-xl rounded-xl">
                                {categories?.map((category) => (
                                  <SelectItem key={category.id_categoria} value={category.id_categoria.toString()}>
                                    {category.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Nombre */}{" "}
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Nombre del Producto
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nombre descriptivo del producto"
                              {...field}
                              className="h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200"
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                        </FormItem>
                      )}
                    />
                    {/* Descripción */}{" "}
                    <FormField
                      control={form.control}
                      name="descripcion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Descripción
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Descripción adicional (opcional)"
                              {...field}
                              className="h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200"
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                        </FormItem>
                      )}
                    />
                    {/* Precios */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {" "}
                      <FormField
                        control={form.control}
                        name="precio_unitario"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Precio Unitario (con IGV)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
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
                        name="precio_mayoritario"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Precio Mayorista (con IGV)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00 (opcional)"
                                value={field.value === null ? "" : field.value}
                                onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                                className="h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200"
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-600 dark:text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>{" "}
                    {/* Stock calculado */}{" "}
                    <div>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Stock Total
                      </FormLabel>
                      <div className="relative mt-1">
                        <Input
                          type="number"
                          value={calculateTotalStock()}
                          readOnly
                          className="h-11 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm text-gray-600 dark:text-gray-400 cursor-not-allowed pr-16"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <Badge
                            variant="secondary"
                            className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          >
                            Auto
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Se calcula automáticamente desde las cantidades de códigos de barras
                        </p>
                        {formChanged && calculateTotalStock() !== product.stock && (
                          <Badge
                            variant="outline"
                            className="text-xs border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-300"
                          >
                            Stock original: {product.stock}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Indicador de inconsistencia de stock */}
                      {hasStockInconsistency() && (
                        <div className="mt-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-xs font-bold">!</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                                Inconsistencia de Stock Detectada
                              </h4>
                              <div className="space-y-2 text-xs text-amber-700 dark:text-amber-300">
                                <div className="flex justify-between">
                                  <span>Stock en BD (restaurado):</span>
                                  <span className="font-medium">{product.stock} unidades</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Suma de códigos de barras:</span>
                                  <span className="font-medium">{calculateTotalStock()} unidades</span>
                                </div>
                                <div className="border-t border-amber-300 dark:border-amber-700 pt-2 mt-2">
                                  <div className="flex justify-between font-semibold">
                                    <span>Diferencia a ajustar:</span>
                                    <span className={getStockDifference() > 0 ? "text-amber-800 dark:text-amber-200" : "text-red-700 dark:text-red-400"}>
                                      {getStockDifference() > 0 ? '+' : ''}{getStockDifference()} unidades
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 bg-amber-100 dark:bg-amber-900/30 p-2 rounded">
                                💡 Necesitas {getStockDifference() > 0 ? 'agregar' : 'reducir'} {Math.abs(getStockDifference())} unidades en los códigos de barras para que coincidan con el stock del producto.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Imagen del producto */}{" "}
                    <div className="space-y-4">
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Imagen del Producto
                      </FormLabel>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="image-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer bg-white/50 dark:bg-gray-800/50 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-all duration-200 backdrop-blur-sm"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {getCurrentImageUrl() ? (
                              <div className="relative">
                                <img
                                  src={getCurrentImageUrl()! || "/placeholder.svg"}
                                  alt="Preview"
                                  className="h-20 w-20 object-cover rounded-lg shadow-md border border-gray-200 dark:border-gray-600"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    openImageView(getCurrentImageUrl()!)
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    clearImage()
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-8 h-8 mb-2 text-gray-400 dark:text-gray-500" />
                                <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                                  <span className="font-semibold">Click para subir</span> o arrastra y suelta
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG o WebP (MAX. 5MB)</p>
                              </>
                            )}
                          </div>
                          <input
                            id="image-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageSelect}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  {/* Botones de acción */}{" "}
                  <div className="flex justify-end gap-3 p-6 border-t border-gray-200/80 dark:border-gray-700/80 bg-gradient-to-r from-gray-50/50 to-purple-50/20 dark:from-gray-800/50 dark:to-purple-900/10">
                    {" "}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleBackNavigation()}
                      disabled={updateMutation.isPending}
                      className="bg-card/50 backdrop-blur-sm border-border/20 hover:bg-accent/50 transition-all duration-200 shadow-sm hover:shadow-md rounded-xl"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending || !formChanged}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 hover:from-purple-700 hover:to-indigo-700 dark:hover:from-purple-600 dark:hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-xl"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>{" "}
          {/* Columna lateral - Códigos de barras */}
          <div className="space-y-6">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/20 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                <h3 className="text-lg font-bold flex items-center">
                  <Barcode className="mr-2 h-5 w-5" />
                  Códigos de Barras
                </h3>
                <p className="text-white/90 mt-1 text-sm">Gestiona los códigos del producto</p>
              </div>

              <div className="p-6">
                {" "}
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Total: {(barcodesData?.codigos_barras?.length || 0) + tempBarcodes.length} códigos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stock calculado: <span className="font-medium text-foreground">{calculateTotalStock()}</span>{" "}
                      unidades
                    </p>
                  </div>
                  <Dialog open={isAddBarcodeDialogOpen} onOpenChange={setIsAddBarcodeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </DialogTrigger>{" "}
                    <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl p-6">
                      <DialogHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Agregar Código de Barras
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Escanea o ingresa manualmente un código de barras
                        </DialogDescription>
                      </DialogHeader>

                      <div className="py-6 space-y-6">
                        {/* Indicador del escáner */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isListeningForScanner && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium border border-green-200 dark:border-green-800"
                              >
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Escáner activo
                              </motion.div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant={isListeningForScanner ? "default" : "outline"}
                            size="sm"
                            onClick={toggleScanner}
                            className={
                              isListeningForScanner
                                ? "bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-sm"
                                : "bg-card/50 backdrop-blur-sm border-border/20 hover:bg-accent/50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                            }
                          >
                            <Scan className="h-4 w-4 mr-1" />
                            {isListeningForScanner ? "Detener" : "Escáner"}
                          </Button>
                        </div>

                        {/* Campos de entrada */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Código de Barras
                            </label>{" "}
                            <Input
                              ref={barcodeInputRef}
                              placeholder={
                                isListeningForScanner ? "Esperando escaneo..." : "Ingresa o escanea el código"
                              }
                              value={newBarcode}
                              onChange={(e) => setNewBarcode(e.target.value)}
                              className={`w-full h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md transition-all duration-200 ${
                                isListeningForScanner
                                  ? "ring-2 ring-green-500/30 border-green-500/50 focus:border-green-500 focus:ring-green-500"
                                  : "focus:border-purple-300 dark:focus:border-purple-600"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Cantidad
                            </label>{" "}
                            <Input
                              type="number"
                              min="1"
                              placeholder="1"
                              value={newBarcodeQuantity}
                              onChange={(e) => setNewBarcodeQuantity(Number.parseInt(e.target.value) || 1)}
                              className="w-full h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200"
                            />
                          </div>
                        </div>

                        {/* Botón para generar código aleatorio */}
                        {!newBarcode && (
                          <div className="flex justify-center pt-2">
                            {" "}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={generateRandomBarcode}
                              disabled={isGeneratingBarcode}
                              className="border-dashed border-2 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 bg-transparent shadow-sm hover:shadow-md transition-all duration-200 rounded-xl"
                            >
                              {isGeneratingBarcode ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mr-2" />
                                  Generando...
                                </>
                              ) : (
                                <>
                                  <Shuffle className="h-4 w-4 mr-2" />
                                  Generar código aleatorio
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>

                      <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
                        {" "}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddBarcodeDialogOpen(false)}
                          className="bg-card/50 backdrop-blur-sm border-border/20 hover:bg-accent/50 transition-all duration-200 shadow-sm hover:shadow-md rounded-xl"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleAddBarcode}
                          disabled={!newBarcode.trim() || newBarcodeQuantity <= 0}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {/* Lista de códigos de barras */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {/* Códigos existentes */}
                  {!isLoadingBarcodes &&
                    barcodesData?.codigos_barras?.map((barcode: any) => (
                      <motion.div
                        key={barcode.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                          barcodesToDelete.includes(barcode.id)
                            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 opacity-60"
                            : deletingBarcodes.includes(barcode.id)
                              ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                              : "bg-muted/50 border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Barcode className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-mono text-sm">{barcode.codigo}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(barcode.fecha_ingreso).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {" "}
                          <Input
                            type="number"
                            min="1"
                            value={editingQuantities[barcode.id] ?? barcode.cantidad}
                            onChange={(e) =>
                              handleQuantityChange(barcode.id, barcode.codigo, Number.parseInt(e.target.value) || 1)
                            }
                            className="w-16 h-8 text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-lg shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(barcode.codigo)
                              toast.success("Código copiado")
                            }}
                            className="h-8 px-2"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBarcode(barcode.id)}
                            disabled={deletingBarcodes.includes(barcode.id) || barcodesToDelete.includes(barcode.id)}
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
                          >
                            {deletingBarcodes.includes(barcode.id) ? (
                              <div className="w-3 h-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    ))}

                  {/* Códigos temporales */}
                  <AnimatePresence>
                    {tempBarcodes.map((tempBarcode, index) => (
                      <motion.div
                        key={`temp-${index}`}
                        data-temp-index={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <Barcode className="h-4 w-4 text-yellow-600" />
                          <div className="flex flex-col">
                            <span className="font-mono text-sm">{tempBarcode.codigo}</span>
                            <Badge variant="secondary" className="text-xs w-fit">
                              Temporal
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {tempBarcode.cantidad} unidades
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Mostrar animación de eliminación
                              const tempElement = document.querySelector(`[data-temp-index="${index}"]`)
                              if (tempElement) {
                                tempElement.classList.add("animate-pulse", "opacity-50")
                              }

                              setTimeout(() => {
                                setTempBarcodes((prev) => prev.filter((_, i) => i !== index))
                                setFormChanged(true)
                                toast.success("Código temporal eliminado")
                              }, 200)
                            }}
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Códigos marcados para eliminar */}
                  <AnimatePresence>
                    {barcodesToDelete.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                      >
                        <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                          {barcodesToDelete.length} código(s) serán eliminados al guardar
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Estado vacío */}
                  {!isLoadingBarcodes &&
                    (!barcodesData?.codigos_barras?.length || barcodesData.codigos_barras.length === 0) &&
                    tempBarcodes.length === 0 && (
                      <div className="text-center py-8 space-y-3">
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                          <Barcode className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Sin códigos de barras</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Agrega códigos para rastrear el inventario
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Image view modal */}
      {isImageViewOpen && selectedImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation()
            setIsImageViewOpen(false)
          }}
        >
          <div className="relative max-w-3xl max-h-[80vh] flex items-center justify-center p-4">
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
                  setIsImageViewOpen(false)
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

export default ProductDetailPage
