import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, Image, Upload, FileImage, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { getBanners, createBannerCarrusel, updateBannerCarrusel, deleteBannerCarrusel } from "../../services/marketingService";

// Componente para gestionar múltiples banners
const BannerListManager: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: banners = [], isLoading, isError } = useQuery({
    queryKey: ["banners"],
    queryFn: getBanners,
  });

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<any | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createBannerCarrusel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      setIsNewModalOpen(false);
      setFile(null);
      setPreviewUrl(null);
      toast.success("Banner creado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear el banner");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateBannerCarrusel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      setIsEditModalOpen(false);
      setFile(null);
      setPreviewUrl(null);
      setSelectedBanner(null);
      toast.success("Banner actualizado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar el banner");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBannerCarrusel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      setSelectedBanner(null);
      toast.success("Banner eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar el banner");
    },
  });

  const handleNew = () => {
    setFile(null);
    setPreviewUrl(null);
    setIsNewModalOpen(true);
  };

  const handleEdit = (banner: any) => {
    setSelectedBanner(banner);
    setFile(null);
    setPreviewUrl(null);
    setIsEditModalOpen(true);
  };

  const handleDelete = (banner: any) => {
    setSelectedBanner(banner);
    deleteMutation.mutate(banner.id_banner);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Crear URL de previsualización
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      
      // Crear URL de previsualización
      const url = URL.createObjectURL(droppedFile);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImageUrl(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Debe seleccionar una imagen");
      return;
    }
    const dataToSubmit = { imagen: file };
    if (selectedBanner) {
      updateMutation.mutate({ id: selectedBanner.id_banner, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const closeModal = () => {
    setIsNewModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedBanner(null);
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setDragActive(false);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/20 shadow-lg h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-gray-100">
              <Image className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Banners Promocionales
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Administra los banners que se mostrarán en el carrusel del ecommerce
            </CardDescription>
          </div>
          <Button 
            onClick={handleNew} 
            className="shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Banner
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando banners...</span>
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 font-medium">Error al cargar los banners</p>
              <p className="text-red-500 dark:text-red-500 text-sm mt-1">Por favor, intenta nuevamente más tarde</p>
            </div>
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <Image className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No hay banners registrados
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Crea tu primer banner para comenzar a promocionar tus productos
              </p>
              <Button 
                onClick={handleNew} 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Banner
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((banner: any) => (
              <Card 
                key={banner.id_banner} 
                className="border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800/50 overflow-hidden group"
              >
                <CardContent className="p-0">
                  <div className="relative">
                    <img 
                      src={banner.imagen_url} 
                      alt="Banner" 
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer" 
                      onClick={() => handleImageClick(banner.imagen_url)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 cursor-pointer" onClick={() => handleImageClick(banner.imagen_url)} />
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <FileImage className="h-4 w-4" />
                      <span>Banner promocional</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleEdit(banner)}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDelete(banner)}
                        className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal para crear/editar banner - DISEÑO MEJORADO */}
      <Dialog open={isNewModalOpen || isEditModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[540px] bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl" aria-describedby="banner-dialog-description">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Image className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {selectedBanner ? "Editar Banner" : "Nuevo Banner"}
            </DialogTitle>
            <DialogDescription id="banner-dialog-description" className="text-gray-600 dark:text-gray-400 text-sm">
              {selectedBanner ? "Selecciona una nueva imagen para reemplazar la actual" : "Selecciona una imagen para crear un nuevo banner promocional"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="imagen" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Imagen del Banner *
              </Label>
              
              {/* Mostrar previsualización de la imagen si existe */}
              {previewUrl ? (
                <div className="relative bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600">
                  <div className="relative group">
                    <img 
                      src={previewUrl} 
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
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    id="imagen"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Upload className={`h-12 w-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'} transition-colors`} />
                    </div>
                    <div>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                        {dragActive ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic para seleccionar'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        PNG, JPG, GIF hasta 10MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-gray-100 dark:border-gray-800 gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeModal}
                className="flex-1 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 transition-all duration-200"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending || !file}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    {selectedBanner ? <Edit className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    {selectedBanner ? "Actualizar" : "Subir"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para ver imagen completa */}
      <Dialog open={imageModalOpen} onOpenChange={closeImageModal}>
        <DialogContent className="sm:max-w-4xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl p-2">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Image className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Vista previa del banner
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-4 pb-4">
            <div className="relative bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              {selectedImageUrl && (
                <img 
                  src={selectedImageUrl} 
                  alt="Banner completo" 
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              )}
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeImageModal}
                className="px-6 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BannerListManager;