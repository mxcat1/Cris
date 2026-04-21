"use client"

import { useState } from "react"

import { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, Save, Loader2, Tag, Package, Info, ShoppingCart, Calendar } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { fetchCategoryById, updateCategory, updateCategoryWithImage, deleteCategoryImage } from "../../services/categoryService"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Badge } from "../../components/ui/badge"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { formatCurrency } from "../../lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"


const categorySchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

const CategoryDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("details")
  const [categoryImage, setCategoryImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [deleteImage, setDeleteImage] = useState(false)

  // Fetch category details
  const {
    data: category,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["category", id],
    queryFn: () => fetchCategoryById(Number(id)),
    retry: false,
  })

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      if (deleteImage) {
        await deleteCategoryImage(Number(id))
      }
      if (categoryImage) {
        const formData = new FormData()
        formData.append("nombre", data.nombre)
        if (data.descripcion) formData.append("descripcion", data.descripcion)
        formData.append("imagen_categoria", categoryImage)
        return updateCategoryWithImage(Number(id), formData)
      }
      return updateCategory(Number(id), data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["category", id] })
      toast.success("Categoría actualizada exitosamente")
      setCategoryImage(null)
      setImagePreview(null)
      setDeleteImage(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al actualizar la categoría")
    },
  })

  // Form for updating a category
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
  })

  // Update form values when category data is loaded
  useEffect(() => {
    if (category) {
      form.reset({
        nombre: category.nombre,
        descripcion: category.descripcion || "",
      })
    }
  }, [category, form])
  const onSubmit = (data: CategoryFormValues) => {
    updateMutation.mutate(data)
  }
  
  // Función para limpiar imagen
  const clearImage = () => {
    setCategoryImage(null)
    setImagePreview(null)
    setDeleteImage(true)
    const fileInput = document.getElementById("category-image-upload") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  // Manejar cambio de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 5MB.")
        return
      }
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        toast.error("Tipo de archivo no válido. Solo JPG, PNG y WebP.")
        return
      }
      setCategoryImage(file)
      setDeleteImage(false)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="relative mx-auto">
            <div className="h-16 w-16 rounded-full border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Tag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Cargando detalles de la categoría...</p>
        </div>
      </div>
    )
  }  if (isError || !category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <Info className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Categoría no encontrada</h2>
          <p className="text-gray-600 dark:text-gray-400">La categoría que buscas no existe o ha sido eliminada</p>
          <Button 
            onClick={() => navigate("/categories")} 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Categorías
          </Button>
        </div>
      </div>
    )
  }  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <motion.div
        className="max-w-7xl mx-auto space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-700 rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-3">
              <Button 
                variant="secondary" 
                size="icon" 
                onClick={() => navigate("/categories")} 
                className="bg-white/20 hover:bg-white/30 border-white/30 text-white hover:text-white backdrop-blur-sm transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{category.nombre}</h1>
                <p className="text-white/90 text-sm md:text-base">Gestiona los detalles y productos de esta categoría</p>
              </div>
            </div>
          </div>
        </motion.div>        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">          <TabsList className="grid w-full grid-cols-2 mb-6 bg-card/50 backdrop-blur-sm border border-border/20 shadow-lg">
            <TabsTrigger value="details" className="text-base data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Tag className="mr-2 h-4 w-4" />
              Detalles
            </TabsTrigger>
            <TabsTrigger value="products" className="text-base data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Package className="mr-2 h-4 w-4" />
              Productos
              {category.productos && category.productos.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                  {category.productos.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">              <Card className="md:col-span-2 bg-card/50 backdrop-blur-sm border border-border/20 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="flex items-center text-xl text-gray-900 dark:text-gray-100">
                    <Info className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Información de la Categoría
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Actualiza la información básica de la categoría</CardDescription>
                </CardHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6 pt-6">
                      {/* Imagen de la categoría */}
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
                                    src={imagePreview}
                                    alt="Preview"
                                    className="h-20 w-20 object-cover rounded-lg shadow-md"
                                  />
                                  <button
                                    type="button"
                                    onClick={e => { e.preventDefault(); clearImage() }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                                  >
                                    <Tag className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : category?.imagen_url && !deleteImage ? (
                                <div className="relative">
                                  <img
                                    src={category.imagen_url}
                                    alt={category.nombre}
                                    className="h-20 w-20 object-cover rounded-lg shadow-md"
                                  />
                                  <button
                                    type="button"
                                    onClick={e => { e.preventDefault(); clearImage() }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                                  >
                                    <Tag className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <Tag className="w-8 h-8 mb-2 text-muted-foreground" />
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
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium text-gray-700 dark:text-gray-300">Nombre</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nombre de la categoría" 
                                {...field} 
                                className="text-base py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200"
                              />
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
                            <FormLabel className="text-base font-medium text-gray-700 dark:text-gray-300">Descripción</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Descripción detallada de la categoría (opcional)"
                                {...field}
                                className="min-h-[120px] text-base resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter className="flex justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => navigate("/categories")}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateMutation.isPending} 
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {updateMutation.isPending ? (
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
              </Card>              <div className="space-y-6">                <Card className="bg-card/50 backdrop-blur-sm border border-border/20 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="flex items-center text-xl text-gray-900 dark:text-gray-100">
                      <Calendar className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                      Información Adicional
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">ID:</span>
                      <span className="font-mono text-gray-900 dark:text-gray-100">{category.id_categoria}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Creado:</span>
                      <span className="text-gray-900 dark:text-gray-100">{new Date(category.creado_en).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Actualizado:</span>
                      <span className="text-gray-900 dark:text-gray-100">{new Date(category.actualizado_en).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Productos:</span>
                      <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-300 dark:border-blue-700">
                        {category.productos?.length || 0}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>          <TabsContent value="products">            <Card className="bg-card/50 backdrop-blur-sm border border-border/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center text-xl text-gray-900 dark:text-gray-100">
                      <ShoppingCart className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Productos en esta Categoría
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Lista de productos asociados a {category.nombre}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-300 dark:border-blue-700 text-base py-1.5">
                    {category.productos?.length || 0} productos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">                {category.productos && category.productos.length > 0 ? (
                  <div className="w-full">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <TableHead className="text-center font-semibold text-gray-900 dark:text-gray-100">ID</TableHead>
                          <TableHead className="text-center font-semibold text-gray-900 dark:text-gray-100">SKU</TableHead>
                          <TableHead className="text-left font-semibold text-gray-900 dark:text-gray-100">NOMBRE</TableHead>
                          <TableHead className="text-right font-semibold text-gray-900 dark:text-gray-100">PRECIO</TableHead>
                          <TableHead className="text-right font-semibold text-gray-900 dark:text-gray-100">PRECIO MAYOR</TableHead>
                          <TableHead className="text-center font-semibold text-gray-900 dark:text-gray-100">STOCK</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {category.productos.map((product, index) => (
                          <motion.tr
                            key={product.id_producto}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.05 * index }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                          >
                            <TableCell className="text-center font-medium text-gray-900 dark:text-gray-100">{product.id_producto}</TableCell>
                            <TableCell className="text-center font-mono text-gray-600 dark:text-gray-300">
                              {product.sku}
                            </TableCell>
                            <TableCell className="text-left text-gray-900 dark:text-gray-100">{product.nombre}</TableCell>                            <TableCell className="text-right font-medium">
                              {product.es_oferta && product.precio_oferta_con_igv ? (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-sm line-through text-gray-500 dark:text-gray-400">
                                    {formatCurrency(Number.parseFloat(product.precio_unitario_con_igv))}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-red-600 dark:text-red-400 font-bold">
                                      {formatCurrency(Number.parseFloat(product.precio_oferta_con_igv))}
                                    </span>
                                    <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs px-1.5 py-0.5 rounded font-medium">
                                      OFERTA
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-blue-600 dark:text-blue-400">
                                  {formatCurrency(Number.parseFloat(product.precio_unitario_con_igv))}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                              {product.precio_mayoritario_con_igv
                                ? formatCurrency(Number.parseFloat(product.precio_mayoritario_con_igv))
                                : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={product.stock > 10 ? "outline" : product.stock > 0 ? "secondary" : "destructive"}
                                className={`${
                                  product.stock > 10 
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-300 dark:border-green-700" 
                                    : product.stock > 0 
                                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700" 
                                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-300 dark:border-red-700"
                                }`}
                              >
                                {product.stock}
                              </Badge>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                      <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No hay productos</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4">Esta categoría no tiene productos asociados</p>
                    <Button 
                      onClick={() => navigate("/products")} 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Ir a Productos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

export default CategoryDetailPage
