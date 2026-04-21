"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  Loader2,
  Eye,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  User,
  Calendar,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import libroReclamacionesService from "../../services/libroReclamacionesService"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Input } from "../../components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { toast } from "sonner"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"

const LibroReclamacionesPage = () => {
  useDocumentTitle("Libro de Reclamaciones")

  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)

  // Estado para el modal de detalles
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedReclamacion, setSelectedReclamacion] = useState<any>(null)

  const { data: reclamaciones, isLoading } = useQuery({
    queryKey: ["libro-reclamaciones"],
    queryFn: libroReclamacionesService.getReclamaciones,
  })

  const mutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      libroReclamacionesService.updateEstadoReclamacion(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["libro-reclamaciones"] })
      toast.success("Estado actualizado exitosamente")
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar el estado")
    },
  })

  const handleChangeEstado = (id: number, estado: string) => {
    mutation.mutate({ id, estado })
  }

  const openDetailModal = (reclamacion: any) => {
    setSelectedReclamacion(reclamacion)
    setIsDetailModalOpen(true)
  }

  // Filtrar reclamaciones
  const filteredReclamaciones = (() => {
    if (!reclamaciones) return []

    const searchLower = searchTerm.toLowerCase()
    return reclamaciones.filter((rec: any) => {
      const matchesSearch =
        rec.nombre.toLowerCase().includes(searchLower) ||
        rec.email.toLowerCase().includes(searchLower) ||
        rec.descripcion.toLowerCase().includes(searchLower)

      const matchesStatus = statusFilter === "all" || rec.estado === statusFilter

      return matchesSearch && matchesStatus
    })
  })()

  // Pagination logic
  const totalPages = Math.ceil((filteredReclamaciones?.length || 0) / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentReclamaciones = filteredReclamaciones?.slice(startIndex, endIndex)

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        )
      case "visto":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Visto
          </Badge>
        )
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Cargando reclamaciones...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Libro de Reclamaciones
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestiona las reclamaciones y sugerencias de tus clientes
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total de reclamaciones</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{reclamaciones?.length || 0}</div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Input
                placeholder="Buscar por nombre, email o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="visto">Visto</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredReclamaciones?.length || 0} reclamaciones encontradas
              </div>
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
          {filteredReclamaciones && filteredReclamaciones.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 dark:border-gray-700">
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">ID</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Cliente</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Contacto</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Descripción</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Fecha</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Estado</TableHead>
                      <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {currentReclamaciones?.map((rec: any, index: number) => (
                        <motion.tr
                          key={rec.id_reclamo}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                            #{rec.id_reclamo}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">{rec.nombre}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[200px]">{rec.email}</span>
                              </div>
                              {rec.telefono && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <Phone className="h-3 w-3" />
                                  <span>{rec.telefono}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="text-sm text-gray-700 dark:text-gray-300 truncate" title={rec.descripcion}>
                                {rec.descripcion}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(rec.fecha).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(rec.estado)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDetailModal(rec)}
                                className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                              >
                                <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </Button>
                              {rec.estado === "pendiente" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleChangeEstado(rec.id_reclamo, "visto")}
                                  disabled={mutation.isPending}
                                  className="h-8 px-3 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400"
                                >
                                  {mutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
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
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border/20 shadow-sm">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredReclamaciones?.length || 0)} de{" "}
                    {filteredReclamaciones?.length || 0} reclamaciones
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
            </>
          ) : (
            <motion.div
              className="flex flex-col items-center justify-center py-16 text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/80 dark:border-gray-700/80"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-6 shadow-lg">
                <FileText className="h-10 w-10 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchTerm || statusFilter !== "all"
                  ? "No se encontraron reclamaciones"
                  : "No hay reclamaciones registradas"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
                {searchTerm || statusFilter !== "all"
                  ? "No se encontraron reclamaciones que coincidan con los filtros aplicados"
                  : "Cuando los clientes envíen reclamaciones, aparecerán aquí"}
              </p>
              {(searchTerm || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                    setCurrentPage(1)
                  }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  Limpiar filtros
                </Button>
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-sm border border-border/50 shadow-2xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Reclamación #{selectedReclamacion?.id_reclamo}
            </DialogTitle>
            <DialogDescription>Detalles completos de la reclamación</DialogDescription>
          </DialogHeader>
          {selectedReclamacion && (
            <div className="space-y-6 p-1">
              {/* Header con estado */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{selectedReclamacion.nombre}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(selectedReclamacion.fecha).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {getStatusBadge(selectedReclamacion.estado)}
              </div>

              {/* Información de contacto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email:</span>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100 break-all pl-6">{selectedReclamacion.email}</p>
                </div>
                {selectedReclamacion.telefono && (
                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono:</span>
                    </div>
                    <p className="text-gray-900 dark:text-gray-100 pl-6">{selectedReclamacion.telefono}</p>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg border border-b-0 border-gray-200 dark:border-gray-700">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción:</span>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                    {selectedReclamacion.descripcion}
                  </p>
                </div>
              </div>

              {/* Acciones */}
              {selectedReclamacion.estado === "pendiente" && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => {
                      handleChangeEstado(selectedReclamacion.id_reclamo, "visto")
                      setIsDetailModalOpen(false)
                    }}
                    disabled={mutation.isPending}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marcar como visto
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LibroReclamacionesPage
