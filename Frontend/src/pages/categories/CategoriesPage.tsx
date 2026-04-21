"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Tags,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  fetchCategories,
  createCategory,
  createCategoryWithImage,
  deleteCategory,
} from "../../services/categoryService"
import { Input } from "../../components/ui/input"
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
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { useBusinessHours } from "../../hooks/useBusinessHours"
import { useAuth } from "../../contexts/AuthContext"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"

const categorySchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

const CategoriesPage = () => {
  // Añadir el hook para cambiar el título del documento
  useDocumentTitle("Categorías")

  const [searchTerm, setSearchTerm] = useState("")
  // Estado para el tipo de orden
  const [sortType, setSortType] = useState("id_desc") // id_desc, id_asc, name_asc, name_desc
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  // Añadir estos estados al inicio del componente, justo después de los otros estados
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)
  // Estado para la imagen de la categoría y preview
  const [categoryImage, setCategoryImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Estados para la vista de imagen
  const [isImageViewOpen, setIsImageViewOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("")

  const queryClient = useQueryClient()

  // Función para abrir la vista de imagen
  const openImageView = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl)
    setIsImageViewOpen(true)
  }

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  })

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => {
      if (data instanceof FormData) {
        return createCategoryWithImage(data)
      }
      return createCategory(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Categoría creada exitosamente")
      setIsDialogOpen(false)
      form.reset()
      setCategoryImage(null)
      setImagePreview(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al crear la categoría")
    },
  })

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Categoría eliminada exitosamente")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al eliminar la categoría")
    },
  })

  // Form for creating a new category
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
  })

  const onSubmit = (data: CategoryFormValues) => {
    // Si hay imagen, usar FormData y createCategoryWithImage
    if (categoryImage) {
      const formData = new FormData()
      formData.append("nombre", data.nombre)
      if (data.descripcion) formData.append("descripcion", data.descripcion)
      formData.append("imagen_categoria", categoryImage) // <- nombre correcto para Multer
      createMutation.mutate(formData as any)
    } else {
      createMutation.mutate(data)
    }
  }

  // Ordenar categorías según el tipo de orden seleccionado
  const sortedCategories = (categories?.slice() || []).sort((a, b) => {
    if (sortType === "id_desc") return b.id_categoria - a.id_categoria
    if (sortType === "id_asc") return a.id_categoria - b.id_categoria
    if (sortType === "name_asc") return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
    if (sortType === "name_desc") return b.nombre.localeCompare(a.nombre, "es", { sensitivity: "base" })
    return 0
  })

  // Filter categories based on search term
  const filteredCategories = sortedCategories.filter(
    (category) =>
      category.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.descripcion && category.descripcion.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Calcular índices para paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredCategories?.slice(indexOfFirstItem, indexOfLastItem) || []

  // Calcular el total de páginas
  const totalPages = filteredCategories ? Math.ceil(filteredCategories.length / itemsPerPage) : 0

  // Función para cambiar de página
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  // Modificar la función handleDeleteCategory para usar nuestro nuevo modal personalizado en vez de window.confirm
  const handleDeleteCategory = (id: number) => {
    setDeletingCategoryId(id)
    setShowDeleteDialog(true)
  }

  // Añadir este nuevo manejador para confirmar la eliminación
  const confirmDelete = () => {
    if (deletingCategoryId) {
      deleteMutation.mutate(deletingCategoryId, {
        onError: (error: any) => {
          // Verificar si es un error de permisos (403)
          if (error.message.includes("No tienes permiso")) {
            toast.error("No puedes eliminar categorías fuera del horario laboral (8:00 AM - 8:00 PM)")
          } else {
            toast.error(error.message || "Error al eliminar la categoría")
          }
          setShowDeleteDialog(false)
          setDeletingCategoryId(null)
        },
      })
    }
  }
  const { isWithinBusinessHours } = useBusinessHours()
  const { user } = useAuth()

  // Función para limpiar imagen
  const clearImage = () => {
    setCategoryImage(null)
    setImagePreview(null)
    const fileInput = document.getElementById("category-image-upload") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  // Manejar cambio de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 5MB.")
        return
      }
      // Validar tipo
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        toast.error("Tipo de archivo no válido. Solo JPG, PNG y WebP.")
        return
      }
      setCategoryImage(file)
      // Crear preview
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
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
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Categorías
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Gestiona las categorías de tus productos</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      {" "}
                      <Button
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                        onClick={() => setIsDialogOpen(true)}
                        disabled={user?.id_role === 2 && !isWithinBusinessHours}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Categoría
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {user?.id_role === 2 && !isWithinBusinessHours && (
                    <TooltipContent className="max-w-xs">
                      <p>No puedes crear categorías fuera del horario laboral (8:00 AM - 8:00 PM)</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </DialogTrigger>{" "}
            <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-sm border border-border/50 shadow-2xl p-0 overflow-hidden">
              <DialogHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-700 p-6 text-white">
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Tags className="h-5 w-5" />
                  Crear Nueva Categoría
                </DialogTitle>
                <DialogDescription className="text-white/90 text-base mt-1">
                  Completa el formulario para crear una nueva categoría
                </DialogDescription>
              </DialogHeader>
              <div className="p-6 space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nombre de la categoría" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="descripcion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Descripción (opcional)" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Imagen de la categoría estilo productos */}
                    <div className="space-y-4">
                      <FormLabel className="text-sm font-semibold text-foreground">Imagen de la Categoría</FormLabel>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="category-image-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {imagePreview ? (
                              <div className="relative">
                                <img
                                  src={imagePreview || "/placeholder.svg"}
                                  alt="Preview"
                                  className="h-20 w-20 object-cover rounded-lg shadow-md"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    clearImage()
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <Tags className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                  <span className="font-semibold">Click para subir</span> o arrastra y suelta
                                </p>
                                <p className="text-xs text-muted-foreground">PNG, JPG o WebP (MAX. 5MB)</p>
                              </>
                            )}
                          </div>
                          <input
                            id="category-image-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                    </div>
                  </form>
                </Form>
              </div>

              <DialogFooter className="px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Categoría"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>{" "}
        <motion.div
          className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lista de Categorías</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Administra las categorías para organizar tus productos
                </p>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Tags className="h-4 w-4" />
                  <span>{filteredCategories?.length || 0} categorías</span>
                </div>
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                >
                  <option value="id_desc">Más recientes</option>
                  <option value="id_asc">Más antiguas</option>
                  <option value="name_asc">Nombre A-Z</option>
                  <option value="name_desc">Nombre Z-A</option>
                </select>
              </div>
            </div>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar categorías por nombre o descripción..."
                className="pl-10 w-full h-11 rounded-xl border border-gray-200/80 dark:border-gray-600/80 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 shadow-sm focus:shadow-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>{" "}
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto shadow-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Cargando categorías...</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Obteniendo la información de las categorías
                  </p>
                </div>
              </div>
            ) : filteredCategories && filteredCategories.length > 0 ? (
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-blue-900/20 border-gray-200/80 dark:border-gray-700/80">
                      <TableHead className="w-16 text-center font-semibold text-gray-900 dark:text-gray-100">
                        Imagen
                      </TableHead>
                      <TableHead className="text-center font-semibold text-gray-900 dark:text-gray-100">
                        Nombre
                      </TableHead>
                      <TableHead className="text-center font-semibold text-gray-900 dark:text-gray-100 hidden md:table-cell">
                        Descripción
                      </TableHead>
                      <TableHead className="text-center font-semibold text-gray-900 dark:text-gray-100">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((category, index) => (
                      <motion.tr
                        key={category.id_categoria}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 * index }}
                        className="group hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-blue-50/30 dark:hover:from-gray-800/50 dark:hover:to-blue-900/20 transition-all duration-200 border-gray-200/50 dark:border-gray-700/50"
                      >
                        <TableCell className="w-16 text-center">
                          {category.imagen_url ? (
                            <div
                              className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer group/image relative mx-auto border border-gray-200 dark:border-gray-700 shadow"
                              onClick={() => openImageView(category.imagen_url!)}
                              tabIndex={0}
                              role="button"
                              aria-label="Ver imagen"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") openImageView(category.imagen_url!)
                              }}
                            >
                              <img
                                src={category.imagen_url || "/placeholder.svg"}
                                alt={category.nombre}
                                className="w-full h-full object-cover group-hover/image:scale-110 transition-transform duration-200 pointer-events-none"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                                <Eye className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto flex items-center justify-center text-gray-400">
                              <Tags className="h-6 w-6" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-gray-900 dark:text-gray-100 font-medium">
                          {category.nombre}
                        </TableCell>
                        <TableCell className="text-center text-gray-600 dark:text-gray-400 hidden md:table-cell">
                          {category.descripcion || (
                            <span className="italic text-gray-400 dark:text-gray-500">Sin descripción</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                            >
                              <Link to={`/categories/${category.id_categoria}`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCategory(category.id_categoria)}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <motion.div
                className="flex flex-col items-center justify-center py-16 text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/80 dark:border-gray-700/80"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-6 shadow-lg">
                  <Tags className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay categorías</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
                  {searchTerm
                    ? "No se encontraron categorías con ese término de búsqueda"
                    : "Comienza creando tu primera categoría para organizar tus productos"}
                </p>
                {!searchTerm && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            onClick={() => setIsDialogOpen(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                            disabled={user?.id_role === 2 && !isWithinBusinessHours}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Categoría
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {user?.id_role === 2 && !isWithinBusinessHours && (
                        <TooltipContent className="max-w-xs">
                          <p>No puedes crear categorías fuera del horario laboral (8:00 AM - 8:00 PM)</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm("")}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    Limpiar búsqueda
                  </Button>
                )}
              </motion.div>
            )}{" "}
            {/* Paginación mejorada */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200/80 dark:border-gray-700/80">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredCategories?.length || 0)} de{" "}
                  {filteredCategories?.length || 0} categorías
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-1 bg-gray-100/80 dark:bg-gray-700/80 rounded-lg backdrop-blur-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>{" "}
      {/* Modal de confirmación de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-sm border border-border/50 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold text-center text-gray-900 dark:text-gray-100">
              Eliminar categoría
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600 dark:text-gray-400">
              ¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center space-x-3 mt-6">
            <AlertDialogCancel
              onClick={() => setShowDeleteDialog(false)}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Image view modal */}
      {isImageViewOpen && selectedImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsImageViewOpen(false)}
        >
          <div className="relative max-w-md max-h-96 flex items-center justify-center">
            <div className="relative">
              <img
                src={selectedImageUrl || "/placeholder.svg"}
                alt="Imagen de la categoría"
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

export default CategoriesPage
