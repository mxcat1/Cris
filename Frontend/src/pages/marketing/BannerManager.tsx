import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Phone, Edit, Trash2, MessageCircle } from "lucide-react";
import { getBanner, updateBannerWhatsapp, deleteBannerWhatsapp } from "../../services/marketingService";
import { Button } from "../../components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";

// Componente para gestionar el WhatsApp del banner - OPTIMIZADO PARA SIDEBAR
export const BannerWhatsAppManager: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: banner, isLoading } = useQuery({
    queryKey: ["banner"],
    queryFn: getBanner,
  });

  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [showWhatsappDialog, setShowWhatsappDialog] = useState(false);
  const [showDeleteWhatsappDialog, setShowDeleteWhatsappDialog] = useState(false);

  const updateBannerWhatsappMutation = useMutation({
    mutationFn: updateBannerWhatsapp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banner"] });
      setShowWhatsappDialog(false);
      setWhatsappNumber("");
      toast.success("WhatsApp actualizado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar el WhatsApp");
    },
  });

  const deleteBannerWhatsappMutation = useMutation({
    mutationFn: deleteBannerWhatsapp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banner"] });
      setShowDeleteWhatsappDialog(false);
      toast.success("WhatsApp eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar el WhatsApp");
    },
  });

  // Función para extraer solo el número sin el prefijo +51
  const extractNumberFromWhatsapp = (fullNumber: string): string => {
    if (!fullNumber) return "";
    const numbersOnly = fullNumber.replace(/[^0-9]/g, '');
    if (numbersOnly.startsWith('51')) {
      return numbersOnly.substring(2);
    }
    return numbersOnly;
  };

  // Función para formatear el número con el prefijo +51
  const formatWhatsappNumber = (number: string): string => {
    if (!number) return "";
    const numbersOnly = number.replace(/[^0-9]/g, '');
    return `+51 ${numbersOnly}`;
  };

  const handleEditWhatsapp = () => {
    const currentNumber = extractNumberFromWhatsapp(banner?.whatsapp || "");
    setWhatsappNumber(currentNumber);
    setShowWhatsappDialog(true);
  };

  const handleDeleteWhatsapp = () => {
    setShowDeleteWhatsappDialog(true);
  };

  const confirmDeleteWhatsapp = () => {
    deleteBannerWhatsappMutation.mutate();
  };

  const handleWhatsappSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!whatsappNumber.trim()) {
      toast.error("Ingresa un número de WhatsApp");
      return;
    }

    const numbersOnly = whatsappNumber.replace(/[^0-9]/g, '');
    if (numbersOnly.length < 9) {
      toast.error("El número debe tener al menos 9 dígitos");
      return;
    }

    const fullNumber = formatWhatsappNumber(numbersOnly);
    updateBannerWhatsappMutation.mutate(fullNumber);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numbersAndSpaces = value.replace(/[^0-9\s]/g, '');
    setWhatsappNumber(numbersAndSpaces);
  };

  return (
    <>
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
          </div>
        ) : banner && banner.whatsapp ? (
          <div className="space-y-3">
            {/* Número actual - Compacto */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-xs font-medium text-green-800 dark:text-green-200">
                      Número actual:
                    </p>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                      {banner.whatsapp.startsWith('+51') ? banner.whatsapp : `+51 ${banner.whatsapp}`}
                    </p>
                  </div>
                </div>
                <a 
                  href={`https://wa.me/${banner.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              </div>
            </div>
            
            {/* Botones compactos */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleEditWhatsapp}
                disabled={updateBannerWhatsappMutation.isPending}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 h-8"
              >
                <Edit className="h-3 w-3 mr-1" />
                Editar
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleDeleteWhatsapp}
                disabled={deleteBannerWhatsappMutation.isPending}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 h-8"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Eliminar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              No hay WhatsApp configurado
            </p>
            <Button
              onClick={handleEditWhatsapp}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 h-8"
            >
              <Phone className="h-3 w-3 mr-1" />
              Agregar WhatsApp
            </Button>
          </div>
        )}
      </div>

      {/* Dialog para editar WhatsApp - DISEÑO MEJORADO CON TEMA VERDE */}
      <Dialog open={showWhatsappDialog} onOpenChange={setShowWhatsappDialog}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-2 border-green-200 dark:border-green-700">
          {/* Header con gradiente verde */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
                <div className="bg-white/20 p-2 rounded-full">
                  <Phone className="h-5 w-5" />
                </div>
                {banner?.whatsapp ? "Editar WhatsApp" : "Agregar WhatsApp"}
              </DialogTitle>
              <DialogDescription className="text-green-100 mt-2">
                {banner?.whatsapp ? "Modifica el número de WhatsApp del banner" : "Agrega un número de WhatsApp al banner"}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Contenido del modal */}
          <div className="p-6 space-y-6 bg-white dark:bg-gray-900">
            <div className="space-y-3">
              <Label htmlFor="whatsapp" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Número de WhatsApp
              </Label>
              
              {/* Input mejorado con mejor diseño */}
              <div className="relative">
                <div className="flex items-center border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-500/10 transition-all duration-200">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 px-4 py-3 border-r-2 border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-bold text-green-700 dark:text-green-300">+51</span>
                  </div>
                  <Input
                    id="whatsapp"
                    type="text"
                    placeholder="999 999 999"
                    value={whatsappNumber}
                    onChange={handleNumberChange}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base py-3 px-4 bg-transparent"
                    maxLength={15}
                  />
                </div>
              </div>

              {/* Nota informativa mejorada */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                <p className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                  <MessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Solo ingresa el número sin el código del país. 
                    <br />
                    <strong>Ejemplo:</strong> 999 999 999
                  </span>
                </p>
              </div>
            </div>

            {/* Botones con mejor espaciado */}
            <DialogFooter className="gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowWhatsappDialog(false)}
                disabled={updateBannerWhatsappMutation.isPending}
                className="px-6 py-2 border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleWhatsappSubmit} 
                disabled={updateBannerWhatsappMutation.isPending}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                {updateBannerWhatsappMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    {banner?.whatsapp ? "Actualizar WhatsApp" : "Agregar WhatsApp"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar WhatsApp - DISEÑO MEJORADO */}
      <AlertDialog open={showDeleteWhatsappDialog} onOpenChange={setShowDeleteWhatsappDialog}>
        <AlertDialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-2 border-red-200 dark:border-red-700">
          {/* Header con gradiente rojo */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-3 text-xl font-semibold">
                <div className="bg-white/20 p-2 rounded-full">
                  <Trash2 className="h-5 w-5" />
                </div>
                Eliminar WhatsApp
              </AlertDialogTitle>
              <AlertDialogDescription className="text-red-100 mt-2">
                Esta acción no se puede deshacer y eliminará permanentemente el número de WhatsApp del banner.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          {/* Contenido del modal */}
          <div className="p-6 bg-white dark:bg-gray-900">
            {/* Advertencia visual */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  ¿Estás seguro de que deseas eliminar el número de WhatsApp del banner?
                </span>
              </p>
            </div>

            {/* Botones con mejor espaciado */}
            <AlertDialogFooter className="gap-3 pt-4">
              <AlertDialogCancel className="px-6 py-2 border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteWhatsapp}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar WhatsApp
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Componente principal (para compatibilidad con imports existentes)
const BannerManager: React.FC = () => {
  return <BannerWhatsAppManager />;
};

export default BannerManager;