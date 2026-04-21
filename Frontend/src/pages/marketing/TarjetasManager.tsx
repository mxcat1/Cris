"use client"

import type React from "react"
import { Upload } from "lucide-react" // Import Upload component

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Loader2, Eye, X, ImageIcon } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "../../components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Label } from "../../components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import {
  getTarjetas,
  createTarjeta,
  updateTarjeta,
  deleteTarjeta,
  deleteTarjetaImage,
  type Tarjeta,
  type TarjetaFormData,
} from "../../services/marketingService"

const TarjetasManager: React.FC = () => {
  const queryClient = useQueryClient()
  const { data: tarjetas = [], isLoading } = useQuery({
    queryKey: ["tarjetas"],
    queryFn: getTarjetas,
  })

  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedTarjeta, setSelectedTarjeta] = useState<Tarjeta | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeleteImageDialog, setShowDeleteImageDialog] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState<TarjetaFormData>({
    titulo: "",
    descripcion: "",
  })

  const createMutation = useMutation({
    mutationFn: createTarjeta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarjetas"] })
      setIsNewModalOpen(false)
      resetForm()
      toast.success("Tarjeta creada exitosamente")
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear la tarjeta")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TarjetaFormData }) => updateTarjeta(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarjetas"] })
      setIsEditModalOpen(false)
      resetForm()
      setSelectedTarjeta(null)
      toast.success("Tarjeta actualizada exitosamente")
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar la tarjeta")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTarjeta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarjetas"] })
      setShowDeleteDialog(false)
      setSelectedTarjeta(null)
      toast.success("Tarjeta eliminada exitosamente")
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar la tarjeta")
    },
  })

  const deleteImageMutation = useMutation({
    mutationFn: deleteTarjetaImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarjetas"] })
      setShowDeleteImageDialog(false)
      setSelectedTarjeta(null)
      toast.success("Imagen eliminada exitosamente")
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar la imagen")
    },
  })

  const resetForm = () => {
    setFormData({
      titulo: "",
      descripcion: "",
    })
    setFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setDragActive(false)
  }

  const handleNew = () => {
    resetForm()
    setIsNewModalOpen(true)
  }

  const handleEdit = (tarjeta: Tarjeta) => {
    setSelectedTarjeta(tarjeta)
    setFormData({
      titulo: tarjeta.titulo,
      descripcion: tarjeta.descripcion || "",
    })
    setFile(null)
    setPreviewUrl(null)
    setIsEditModalOpen(true)
  }

  const handleView = (tarjeta: Tarjeta) => {
    setSelectedTarjeta(tarjeta)
    setIsViewModalOpen(true)
  }

  const handleDelete = (tarjeta: Tarjeta) => {
    setSelectedTarjeta(tarjeta)
    setShowDeleteDialog(true)
  }

  const handleDeleteImage = (tarjeta: Tarjeta) => {
    setSelectedTarjeta(tarjeta)
    setShowDeleteImageDialog(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Crear URL de previsualización
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)

      // Crear URL de previsualización
      const url = URL.createObjectURL(droppedFile)
      setPreviewUrl(url)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl)
    setImageModalOpen(true)
  }

  const closeImageModal = () => {
    setImageModalOpen(false)
    setSelectedImageUrl(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titulo.trim()) {
      toast.error("El título es requerido")
      return
    }

    const dataToSubmit: TarjetaFormData = {
      ...formData,
      ...(file && { imagen: file }),
    }

    if (selectedTarjeta) {
      updateMutation.mutate({ id: selectedTarjeta.id_tarjeta, data: dataToSubmit })
    } else {
      createMutation.mutate(dataToSubmit)
    }
  }

  const confirmDelete = () => {
    if (selectedTarjeta) {
      deleteMutation.mutate(selectedTarjeta.id_tarjeta)
    }
  }

  const confirmDeleteImage = () => {
    if (selectedTarjeta) {
      deleteImageMutation.mutate(selectedTarjeta.id_tarjeta)
    }
  }

  const closeModal = () => {
    setIsNewModalOpen(false)
    setIsEditModalOpen(false)
    setSelectedTarjeta(null)
    resetForm()
  }

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-border/20 shadow-lg h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-gray-100">
            <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Tarjetas Promocionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando tarjetas...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/20 shadow-lg h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-gray-100">
              <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Tarjetas Promocionales
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Administra las tarjetas promocionales que se mostrarán en el sitio web
            </CardDescription>
          </div>
          <Button
            onClick={handleNew}
            className="shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarjeta
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tarjetas.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay tarjetas registradas</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Crea tu primera tarjeta promocional para comenzar</p>
              <Button
                onClick={handleNew}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Tarjeta
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/20 overflow-hidden shadow-lg bg-card/50 backdrop-blur-sm">
            <Table>
              <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-blue-900/20">
                <TableRow className="border-gray-200/80 dark:border-gray-700/80">
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Imagen</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Título</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Descripción</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Fecha</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {tarjetas.map((tarjeta, index) => (
                    <motion.tr
                      key={tarjeta.id_tarjeta}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, delay: 0.05 * index }}
                      className="group transition-all duration-200 hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-blue-50/30 dark:hover:from-gray-800/50 dark:hover:to-blue-900/20"
                    >
                      <TableCell>
                        {tarjeta.imagen_url ? (
                          <img
                            src={tarjeta.imagen_url || "/placeholder.svg"}
                            alt={tarjeta.titulo}
                            className="w-16 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200"
                            onClick={() => handleImageClick(tarjeta.imagen_url!)}
                          />
                        ) : (
                          <div className="w-16 h-12 bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-800 dark:to-blue-900/30 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm">
                            <ImageIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{tarjeta.titulo}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-gray-700 dark:text-gray-300">
                          {tarjeta.descripcion || "Sin descripción"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(tarjeta.creado_en).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(tarjeta)}
                            title="Ver detalles"
                            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                          >
                            <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(tarjeta)}
                            title="Editar"
                            className="h-8 w-8 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                          >
                            <Edit className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          </Button>
                          {tarjeta.imagen_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteImage(tarjeta)}
                              title="Eliminar imagen"
                              className="h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                            >
                              <X className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(tarjeta)}
                            title="Eliminar"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dialog para crear nueva tarjeta - BOTONES MEJORADOS */}
        <Dialog open={isNewModalOpen} onOpenChange={closeModal}>
          <DialogContent
            className="sm:max-w-[540px] max-h-[90vh] bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl flex flex-col"
            aria-describedby="new-tarjeta-dialog-description"
          >
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Nueva Tarjeta Promocional
              </DialogTitle>
              <DialogDescription
                id="new-tarjeta-dialog-description"
                className="text-gray-600 dark:text-gray-400 text-sm"
              >
                Crea una nueva tarjeta promocional para mostrar en el sitio web
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="new-titulo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Título *
                  </Label>
                  <Input
                    id="new-titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ej: Promoción Especial"
                    required
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-lg shadow-sm focus:shadow-md focus:border-blue-300 dark:focus:border-blue-600 transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="new-descripcion" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descripción
                  </Label>
                  <Textarea
                    id="new-descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripción de la tarjeta promocional (opcional)"
                    rows={3}
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-lg shadow-sm focus:shadow-md focus:border-blue-300 dark:focus:border-blue-600 transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="new-imagen" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Imagen de la Tarjeta
                  </Label>

                  {/* Mostrar previsualización de la imagen si existe */}
                  {previewUrl ? (
                    <div className="relative bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600">
                      <div className="relative group">
                        <img
                          src={previewUrl || "/placeholder.svg"}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg shadow-md cursor-pointer"
                          onClick={() => handleImageClick(previewUrl)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg" />
                        <Button
                          type="button"
                          onClick={handleRemoveFile}
                          className="absolute top-2 right-2 h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-3 text-center">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Imagen seleccionada: {file?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Haz clic en la X para cambiar la imagen
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Zona de drag and drop mejorada */
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${dragActive
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                        }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        id="new-imagen"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <Upload
                            className={`h-12 w-12 ${dragActive ? "text-blue-500" : "text-gray-400"} transition-colors`}
                          />
                        </div>
                        <div>
                          <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                            {dragActive ? "Suelta la imagen aquí" : "Arrastra una imagen o haz clic para seleccionar"}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, GIF hasta 10MB</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Footer con botones mejorados */}
            <div className="px-6 pb-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={createMutation.isPending}
                  className="min-w-[100px] h-11 px-6 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200 bg-white dark:bg-gray-900 font-medium"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="min-w-[140px] h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {createMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Crear Tarjeta</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

       {/* Dialog para editar tarjeta - BOTONES MEJORADOS */}
        <Dialog open={isEditModalOpen} onOpenChange={closeModal}>
          <DialogContent
            className="sm:max-w-[540px] max-h-[90vh] bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl flex flex-col"
            aria-describedby="edit-tarjeta-dialog-description"
          >
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Editar Tarjeta
              </DialogTitle>
              <DialogDescription
                id="edit-tarjeta-dialog-description"
                className="text-gray-600 dark:text-gray-400 text-sm"
              >
                Modifica la información de la tarjeta seleccionada
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="edit-titulo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Título *
                  </Label>
                  <Input
                    id="edit-titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Título de la tarjeta"
                    required
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-lg shadow-sm focus:shadow-md focus:border-blue-300 dark:focus:border-blue-600 transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-descripcion" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descripción
                  </Label>
                  <Textarea
                    id="edit-descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripción de la tarjeta (opcional)"
                    rows={3}
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-lg shadow-sm focus:shadow-md focus:border-blue-300 dark:focus:border-blue-600 transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-imagen" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cambiar Imagen
                  </Label>

                  {/* Mostrar previsualización de la imagen si existe */}
                  {previewUrl ? (
                    <div className="relative bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600">
                      <div className="relative group">
                        <img
                          src={previewUrl || "/placeholder.svg"}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg shadow-md cursor-pointer"
                          onClick={() => handleImageClick(previewUrl)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg" />
                        <Button
                          type="button"
                          onClick={handleRemoveFile}
                          className="absolute top-2 right-2 h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-3 text-center">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nueva imagen: {file?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Haz clic en la X para cambiar la imagen
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Mostrar imagen actual si existe */}
                      {selectedTarjeta?.imagen_url && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagen actual:</p>
                          <img
                            src={selectedTarjeta.imagen_url || "/placeholder.svg"}
                            alt="Imagen actual"
                            className="w-full h-32 object-cover rounded-lg shadow-sm cursor-pointer"
                            onClick={() => handleImageClick(selectedTarjeta.imagen_url!)}
                          />
                        </div>
                      )}

                      {/* Zona de drag and drop */}
                      <div
                        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${dragActive
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                          }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <input
                          id="edit-imagen"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="space-y-3">
                          <div className="flex justify-center">
                            <Upload
                              className={`h-10 w-10 ${dragActive ? "text-blue-500" : "text-gray-400"} transition-colors`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {dragActive
                                ? "Suelta la nueva imagen aquí"
                                : "Arrastra una nueva imagen o haz clic para seleccionar"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, GIF hasta 10MB</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Footer con botones mejorados - MISMO DISEÑO QUE EL MODAL DE CREAR */}
            <div className="px-6 pb-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={updateMutation.isPending}
                  className="min-w-[100px] h-11 px-6 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200 bg-white dark:bg-gray-900 font-medium"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={updateMutation.isPending}
                  className="min-w-[140px] h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {updateMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Actualizando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      <span>Actualizar</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para ver detalles - DISEÑO MEJORADO */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent
            className="sm:max-w-[600px] max-h-[90vh] bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl flex flex-col"
            aria-describedby="view-tarjeta-dialog-description"
          >
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Detalles de la Tarjeta
              </DialogTitle>
              <DialogDescription
                id="view-tarjeta-dialog-description"
                className="text-gray-600 dark:text-gray-400 text-sm"
              >
                Información completa de la tarjeta seleccionada
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              {selectedTarjeta && (
                <div className="px-6 py-4 space-y-6">
                  {selectedTarjeta.imagen_url && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <img
                        src={selectedTarjeta.imagen_url || "/placeholder.svg"}
                        alt={selectedTarjeta.titulo}
                        className="w-full h-48 object-cover rounded-lg shadow-md cursor-pointer"
                        onClick={() => handleImageClick(selectedTarjeta.imagen_url!)}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Título</Label>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                        {selectedTarjeta.titulo}
                      </p>
                    </div>
                    {selectedTarjeta.descripcion && (
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</Label>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedTarjeta.descripcion}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Creación</Label>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {new Date(selectedTarjeta.creado_en).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Última Actualización
                      </Label>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {new Date(selectedTarjeta.actualizado_en).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="px-6 pb-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
              <Button
                onClick={() => setIsViewModalOpen(false)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 px-6"
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para ver imagen completa */}
        <Dialog open={imageModalOpen} onOpenChange={closeImageModal}>
          <DialogContent className="sm:max-w-4xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl p-2">
            <DialogHeader className="px-4 pt-4 pb-2">
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Vista previa de la tarjeta
              </DialogTitle>
            </DialogHeader>

            <div className="px-4 pb-4">
              <div className="relative bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                {selectedImageUrl && (
                  <img
                    src={selectedImageUrl || "/placeholder.svg"}
                    alt="Tarjeta completa"
                    className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-lg"
                  />
                )}
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeImageModal}
                  className="px-6 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200 bg-transparent"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmación para eliminar tarjeta */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent
            className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl"
            aria-describedby="delete-tarjeta-alert-description"
          >
            <AlertDialogHeader className="px-6 pt-6 pb-4">
              <AlertDialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Eliminar Tarjeta
              </AlertDialogTitle>
              <AlertDialogDescription
                id="delete-tarjeta-alert-description"
                className="text-gray-600 dark:text-gray-400"
              >
                ¿Estás seguro de que deseas eliminar la tarjeta "{selectedTarjeta?.titulo}"? Esta acción no se puede
                deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="px-6 pb-6 gap-3">
              <AlertDialogCancel className="flex-1 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Tarjeta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de confirmación para eliminar imagen */}
        <AlertDialog open={showDeleteImageDialog} onOpenChange={setShowDeleteImageDialog}>
          <AlertDialogContent
            className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl"
            aria-describedby="delete-image-alert-description"
          >
            <AlertDialogHeader className="px-6 pt-6 pb-4">
              <AlertDialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Eliminar Imagen
              </AlertDialogTitle>
              <AlertDialogDescription id="delete-image-alert-description" className="text-gray-600 dark:text-gray-400">
                ¿Estás seguro de que deseas eliminar la imagen de la tarjeta "{selectedTarjeta?.titulo}"? Esta acción no
                se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="px-6 pb-6 gap-3">
              <AlertDialogCancel className="flex-1 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteImage}
                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <X className="h-4 w-4 mr-2" />
                Eliminar Imagen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

export default TarjetasManager
