"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Search,
  Filter,
  Calendar,
  User,
  Database,
  Activity,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
  History,
  FileEdit,
  Clock,
  X,
  Hash,
  Mail,
  Network,
  Shield,
  Trash2,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Checkbox } from "../../components/ui/checkbox"
import { motion, AnimatePresence } from "framer-motion"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { useAuth } from "../../contexts/AuthContext"
import { Navigate } from "react-router-dom"
import api from "../../lib/api"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { createRoot } from "react-dom/client"
import { ScrollArea } from "../../components/ui/scroll-area"
import { Separator } from "../../components/ui/separator"

// Servicios para logs de auditoría
const fetchAllLogs = async () => {
  const response = await api.get("/audit-logs")
  return response.data
}

const fetchLogsByUser = async (userId: string) => {
  if (!userId) return []
  const response = await api.get(`/audit-logs/usuario/${userId}`)
  return response.data
}

const fetchLogsByTable = async (table: string) => {
  if (!table) return []
  const response = await api.get(`/audit-logs/tabla/${table}`)
  return response.data
}

const fetchLogsByAction = async (action: string) => {
  if (!action) return []
  const response = await api.get(`/audit-logs/accion/${action}`)
  return response.data
}

const fetchLogsByDateRange = async (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return []
  const response = await api.get(`/audit-logs/rango-fechas?fechaInicio=${startDate}&fechaFin=${endDate}`)
  return response.data
}

// Función para formatear la fecha
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss", { locale: es })
  } catch (error) {
    return dateString
  }
}

// Función para obtener el nombre de la acción en español
const getActionName = (action: string) => {
  const actions: Record<string, string> = {
    crear: "Creación",
    actualizar: "Actualización",
    eliminar: "Eliminación",
    login: "Inicio de sesión",
    logout: "Cierre de sesión",
  }
  return actions[action] || action
}

// Función para obtener el nombre de la tabla en español
const getTableName = (table: string) => {
  const tables: Record<string, string> = {
    users: "Usuarios",
    categorias: "Categorías",
    productos: "Productos",
    ventas: "Ventas",
    companies: "Empresas",
    auth: "Autenticación",
    codigos_barras: "Códigos de Barras",
  }
  return tables[table] || table
}


// Función para obtener el ícono de acción según el tipo
const getActionIcon = (action: string) => {
  switch (action) {
    case "crear":
      return <FileEdit className="h-4 w-4" />
    case "actualizar":
      return <FileEdit className="h-4 w-4" />
    case "eliminar":
      return <X className="h-4 w-4" />
    case "login":
      return <Shield className="h-4 w-4" />
    case "logout":
      return <Shield className="h-4 w-4" />
    default:
      return <Activity className="h-4 w-4" />
  }
}



const AuditLogsPage = () => {
  useDocumentTitle("Logs de Auditoría")
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [userId, setUserId] = useState("")
  const [table, setTable] = useState("")
  const [action, setAction] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedLogs, setSelectedLogs] = useState<number[]>([])
  const itemsPerPage = 25

  // Verificar si el usuario tiene permisos de administrador
  const isManager = user?.id_role === 1
  // Fetch logs según el filtro seleccionado
  const {
    data: logs,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["audit-logs", filterType, userId, table, action, startDate, endDate],
    queryFn: () => {
      switch (filterType) {
        case "user":
          return fetchLogsByUser(userId)
        case "table":
          return fetchLogsByTable(table)
        case "action":
          return fetchLogsByAction(action)
        case "date":
          return fetchLogsByDateRange(startDate, endDate)
        default:
          return fetchAllLogs()
      }
    }, enabled: isManager, // Solo ejecutar la consulta si es administrador
  })

  // Efecto para refrescar los datos cuando cambian los filtros
  useEffect(() => {
    if (isManager) {
      refetch()
    }
  }, [filterType, userId, table, action, startDate, endDate, isManager, refetch])

  // Filtrar logs basados en el término de búsqueda
  const filteredLogs = logs
    ? logs.filter((log: any) => {
      const searchTermLower = searchTerm.toLowerCase()
      return (
        (log.usuario?.name && log.usuario.name.toLowerCase().includes(searchTermLower)) ||
        (log.usuario?.email && log.usuario.email.toLowerCase().includes(searchTermLower)) ||
        (log.accion && log.accion.toLowerCase().includes(searchTermLower)) ||
        (log.tabla && log.tabla.toLowerCase().includes(searchTermLower)) ||
        (log.ip_cliente && log.ip_cliente.toLowerCase().includes(searchTermLower))
      )
    })
    : []

  // Paginación
  const totalPages = filteredLogs ? Math.ceil(filteredLogs.length / itemsPerPage) : 0
  const paginatedLogs = filteredLogs?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const startItem = filteredLogs && filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0
  const endItem = filteredLogs ? Math.min(currentPage * itemsPerPage, filteredLogs.length) : 0
  const totalItems = filteredLogs?.length || 0
  // Funciones de navegación
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Funciones para manejo de selección
  const toggleLogSelection = (logId: number) => {
    setSelectedLogs(prev =>
      prev.includes(logId)
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    )
  }

  const selectAllLogs = () => {
    if (paginatedLogs) {
      const allIds = paginatedLogs.map((log: any) => log.id_log)
      setSelectedLogs(allIds)
    }
  }
  const clearSelection = () => {
    setSelectedLogs([])
  }

  // Función para eliminar logs seleccionados
  const handleDeleteSelectedLogs = async () => {
    if (selectedLogs.length === 0) {
      toast.error("No hay logs seleccionados")
      return
    } try {
      await api.delete("/audit-logs", {
        data: { ids: selectedLogs }
      })

      toast.success(`${selectedLogs.length} logs eliminados correctamente`)

      // Refrescar datos y limpiar selección
      refetch()
      setSelectedLogs([])

    } catch (error: any) {
      console.error("Error al eliminar logs:", error)
      toast.error(error.response?.data?.message || "Error al eliminar logs")
    }
  }

  if (!isManager) {
    return <Navigate to="/" />
  } return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >          <motion.div
            className="bg-card/50 border-border/20 backdrop-blur-sm rounded-lg p-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Logs de Auditoría
                </h1>
                <p className="text-foreground/70">
                  Monitorea todas las acciones realizadas en el sistema
                </p>
              </div>
            </div>
          </motion.div><motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >          <Card className="bg-card/50 border-border/20 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Filtros
                </CardTitle>
                <CardDescription>
                  Filtra los logs por diferentes criterios
                </CardDescription>
              </CardHeader>
              <CardContent>{/* Tabs de filtros mejoradas */}
                <Tabs defaultValue="all" onValueChange={(value) => setFilterType(value)}>                <TabsList className="grid grid-cols-5 mb-6 bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger
                    value="all"
                    className="rounded-lg text-xs"
                  >
                    Todos
                  </TabsTrigger>
                  <TabsTrigger
                    value="user"
                    className="rounded-lg text-xs"
                  >
                    Por Usuario
                  </TabsTrigger>
                  <TabsTrigger
                    value="table"
                    className="rounded-lg text-xs"
                  >
                    Por Tabla
                  </TabsTrigger>
                  <TabsTrigger
                    value="action"
                    className="rounded-lg text-xs"
                  >
                    Por Acción
                  </TabsTrigger>
                  <TabsTrigger
                    value="date"
                    className="rounded-lg text-xs"
                  >
                    Por Fecha
                  </TabsTrigger>
                </TabsList><TabsContent value="all">
                    <div className="flex items-center mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />                      <Input
                          type="search"
                          placeholder="Buscar en todos los logs..."
                          className="pl-10 h-11 bg-background/50 border-border/20 rounded-xl"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="user">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />                        <Input
                            type="text"
                            placeholder="ID del usuario"
                            className="h-11 bg-background/50 border-border/20 rounded-xl"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                          />
                        </div>                      <Button
                          variant="outline"
                          onClick={() => refetch()}
                          disabled={!userId}
                          className="bg-background/50 border-border/20 rounded-xl"
                        >
                          <Filter className="mr-2 h-4 w-4" />
                          Filtrar
                        </Button>
                      </div>                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <Input
                          type="search"
                          placeholder="Buscar en resultados..."
                          className="pl-10 h-11 bg-background/50 border-border/20 rounded-xl"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>                <TabsContent value="table">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <Database className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <Select value={table} onValueChange={setTable}>                          <SelectTrigger className="h-11 bg-background/50 border-border/20 rounded-xl">
                            <SelectValue placeholder="Seleccionar tabla" />
                          </SelectTrigger>
                            <SelectContent className="bg-card/95 border-border/20 rounded-xl">
                              <SelectItem value="users">Usuarios</SelectItem>
                              <SelectItem value="categorias">Categorías</SelectItem>
                              <SelectItem value="productos">Productos</SelectItem>
                              <SelectItem value="ventas">Ventas</SelectItem>
                              <SelectItem value="companies">Empresas</SelectItem>
                              <SelectItem value="auth">Autenticación</SelectItem>
                              <SelectItem value="codigos_barras">Códigos de Barras</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => refetch()}
                          disabled={!table}
                          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md rounded-xl"
                        >
                          <Filter className="mr-2 h-4 w-4" />
                          Filtrar
                        </Button>
                      </div>
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <Input
                          type="search"
                          placeholder="Buscar en resultados..."
                          className="pl-10 h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="action">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <Activity className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <Select value={action} onValueChange={setAction}>
                            <SelectTrigger className="h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                              <SelectValue placeholder="Seleccionar acción" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 shadow-xl rounded-xl">
                              <SelectItem value="crear">Creación</SelectItem>
                              <SelectItem value="actualizar">Actualización</SelectItem>
                              <SelectItem value="eliminar">Eliminación</SelectItem>
                              <SelectItem value="login">Inicio de sesión</SelectItem>
                              <SelectItem value="logout">Cierre de sesión</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => refetch()}
                          disabled={!action}
                          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md rounded-xl"
                        >
                          <Filter className="mr-2 h-4 w-4" />
                          Filtrar
                        </Button>
                      </div>
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <Input
                          type="search"
                          placeholder="Buscar en resultados..."
                          className="pl-10 h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>                <TabsContent value="date">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <Input
                            type="date"
                            className="h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 font-medium">hasta</span>
                        <div className="flex items-center gap-2 flex-1">
                          <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <Input
                            type="date"
                            className="h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => refetch()}
                          disabled={!startDate || !endDate}
                          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md rounded-xl"
                        >
                          <Filter className="mr-2 h-4 w-4" />
                          Filtrar
                        </Button>
                      </div>
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <Input
                          type="search"
                          placeholder="Buscar en resultados..."
                          className="pl-10 h-11 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm focus:shadow-md focus:border-purple-300 dark:focus:border-purple-600 transition-all duration-200"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="relative overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-50/30 dark:to-purple-900/20" />
              <CardHeader className="pb-3 relative">
                <CardTitle className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  Registro de Actividades
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Historial de todas las acciones realizadas en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">{/* Estado de carga mejorado */}
                {isLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto shadow-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Cargando logs...</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Obteniendo el historial de actividades</p>
                    </div>
                  </div>) : filteredLogs && filteredLogs.length > 0 ? (
                    <div className="space-y-4">
                      {/* Controles de selección mejorados */}
                      {selectedLogs.length > 0 && (
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-xl border border-blue-200/60 dark:border-blue-800/40 backdrop-blur-sm shadow-sm">
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            {selectedLogs.length} logs seleccionados
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearSelection}
                              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 text-gray-700 dark:text-gray-300"
                            >
                              Limpiar selección
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleDeleteSelectedLogs}
                              className="bg-gradient-to-r from-red-500 to-pink-600 dark:from-red-600 dark:to-pink-700 hover:from-red-600 hover:to-pink-700 dark:hover:from-red-700 dark:hover:to-pink-800 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar seleccionados
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="rounded-xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                        <Table>
                          <TableHeader className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-800 dark:to-purple-900/20">
                            <TableRow className="border-gray-200/80 dark:border-gray-700/80">
                              <TableHead className="w-[50px]">
                                <Checkbox
                                  checked={paginatedLogs?.length > 0 && selectedLogs.length === paginatedLogs.length}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      selectAllLogs()
                                    } else {
                                      clearSelection()
                                    }
                                  }}
                                  className="border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                                />
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">ID</TableHead>
                              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Usuario</TableHead>
                              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Acción</TableHead>
                              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Tabla</TableHead>
                              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Registro ID</TableHead>
                              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Fecha y Hora</TableHead>
                              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Detalles</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedLogs.map((log: any, index: number) => (
                              <motion.tr
                                key={log.id_log}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.03 * index }}
                                className="group hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-purple-50/30 dark:hover:from-gray-800/50 dark:hover:to-purple-900/20 transition-all duration-200 border-gray-200/50 dark:border-gray-700/50"
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={selectedLogs.includes(log.id_log)}
                                    onCheckedChange={() => toggleLogSelection(log.id_log)}
                                    className="border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 dark:focus:ring-purple-400"
                                  />
                                </TableCell>
                                <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                                  <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full text-sm font-mono">
                                    {log.id_log}
                                  </span>
                                </TableCell>                          <TableCell>
                                  {log.usuario ? (
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center shadow-sm">
                                        <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                          {log.usuario.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                          {log.usuario.email}
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">N/A</span>
                                  )}
                                </TableCell>                          <TableCell>
                                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${log.accion === "crear"
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                      : log.accion === "actualizar"
                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                        : log.accion === "eliminar"
                                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                          : log.accion === "login" || log.accion === "logout"
                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                    }`}>
                                    {getActionIcon(log.accion)}
                                    {getActionName(log.accion)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                    {getTableName(log.tabla)}
                                  </span>
                                </TableCell>                          <TableCell>
                                  {log.registro_id ? (
                                    <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                                      {log.registro_id}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                      {formatDate(log.fecha_hora).split(" ")[0]}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                      {formatDate(log.fecha_hora).split(" ")[1]}
                                    </div>
                                  </div>
                                </TableCell>                          <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200 rounded-lg"
                                    onClick={() => {
                                      // Crear un elemento para el modal
                                      const modalContainer = document.createElement("div")
                                      modalContainer.id = `log-details-${log.id_log}`
                                      modalContainer.className = "custom-log-modal-container"
                                      document.body.appendChild(modalContainer)

                                      // Renderizar el componente modal
                                      const root = createRoot(modalContainer)
                                      root.render(
                                        <LogDetailsModal
                                          log={log}
                                          onClose={() => {
                                            root.unmount()
                                            document.body.removeChild(modalContainer)
                                          }}
                                        />,)
                                    }}
                                  >
                                    <FileText className="h-4 w-4" />
                                    <span className="sr-only">Ver detalles</span>
                                  </Button>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>) : (
                  <motion.div
                    className="flex flex-col items-center justify-center py-16 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Activity className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      No hay logs de auditoría
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md">
                      {searchTerm
                        ? "No se encontraron logs que coincidan con tu búsqueda. Intenta con otros términos."
                        : "Aún no hay registros de actividad en el sistema. Los logs aparecerán aquí cuando se realicen acciones."}
                    </p>
                    {searchTerm && (
                      <Button
                        variant="outline"
                        onClick={() => setSearchTerm("")}
                        className="mt-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md rounded-xl"
                      >
                        Limpiar búsqueda
                      </Button>
                    )}
                  </motion.div>
                )}              {filteredLogs && filteredLogs.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-gradient-to-r from-gray-50/80 to-purple-50/30 dark:from-gray-800/50 dark:to-purple-900/20 rounded-xl border border-gray-200/60 dark:border-gray-700/40 backdrop-blur-sm">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Mostrando{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {startItem}
                      </span>{" "}
                      -{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {endItem}
                      </span>{" "}
                      de{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {totalItems}
                      </span>{" "}
                      logs
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Página</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {currentPage}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">de</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {totalPages}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                      >                      Siguiente
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

// Componente Modal de Detalles del Log con estilo personalizado
const LogDetailsModal = ({ log, onClose }: { log: any; onClose: () => void }) => {
  // Renderizar JSON formateado
  const renderJsonData = (jsonString: string | null) => {
    if (!jsonString) return null

    try {
      const data = JSON.parse(jsonString)
      return JSON.stringify(data, null, 2)
    } catch (error) {
      return jsonString
    }
  }

  // Formatear los datos anteriores y nuevos
  const prevData = renderJsonData(log.datos_anteriores)
  const newData = renderJsonData(log.datos_nuevos)
  // Detectar si estamos en modo oscuro
  const isDarkMode = document.documentElement.classList.contains("dark")

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <motion.div
          className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-lg shadow-xl"
          style={{
            backgroundColor: isDarkMode ? "#121212" : "#ffffff",
            border: isDarkMode ? "1px solid #2d2d2d" : "1px solid #dee2e6",
          }}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Encabezado del Modal */}
          <div className="relative flex items-center justify-between px-6 py-4 bg-[#6f42c1] text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-white/20">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Detalles del Log #{log.id_log}</h2>
                <p className="text-sm text-white/80">
                  {formatDate(log.fecha_hora)} - {log.usuario?.name || "Usuario desconocido"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-4 top-4 text-white hover:bg-white/20 hover:text-white"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>

          {/* Resumen de la acción */}
          <div
            className="px-6 py-4 border-b"
            style={{
              backgroundColor: isDarkMode ? "#1e1e1e" : "#f1f3f5",
              borderColor: isDarkMode ? "#2d2d2d" : "#dee2e6",
            }}
          >
            <div className="flex flex-wrap items-center gap-4">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${log.accion === "crear"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : log.accion === "actualizar"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      : log.accion === "eliminar"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                        : log.accion === "login" || log.accion === "logout"
                          ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                  }`}
              >
                {getActionIcon(log.accion)}
                {getActionName(log.accion)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }}>
                  Tabla:
                </span>
                <span className="text-sm font-medium" style={{ color: isDarkMode ? "#e5e7eb" : "#495057" }}>
                  {getTableName(log.tabla)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }}>
                  Registro:
                </span>
                <span className="text-sm font-medium" style={{ color: isDarkMode ? "#e5e7eb" : "#495057" }}>
                  {log.registro_id || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Contenido del Modal */}
          <div className="overflow-auto max-h-[calc(90vh-180px)]">
            <div className="p-6 space-y-6">
              {/* Sección de Usuario y Detalles */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Información de Usuario */}
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
                    border: isDarkMode ? "1px solid #2d2d2d" : "1px solid #dee2e6",
                  }}
                >
                  <div
                    className="px-4 py-3 border-b flex items-center gap-2"
                    style={{
                      backgroundColor: isDarkMode ? "#252525" : "#f8f9fa",
                      borderColor: isDarkMode ? "#2d2d2d" : "#dee2e6",
                    }}
                  >
                    <User className="h-4 w-4 text-[#6f42c1]" />
                    <h3 className="text-sm font-semibold" style={{ color: isDarkMode ? "#e5e7eb" : "#212529" }}>
                      Información de Usuario
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-[20px_1fr] gap-3 items-center">
                      <User className="h-4 w-4" style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }} />
                      <div className="space-y-1">
                        <p className="text-xs font-medium" style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }}>
                          Usuario
                        </p>
                        <p className="text-sm" style={{ color: isDarkMode ? "#e5e7eb" : "#212529" }}>
                          {log.usuario?.name || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-[20px_1fr] gap-3 items-center">
                      <Mail className="h-4 w-4" style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }} />
                      <div className="space-y-1">
                        <p className="text-xs font-medium" style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }}>
                          Email
                        </p>
                        <p className="text-sm" style={{ color: isDarkMode ? "#e5e7eb" : "#212529" }}>
                          {log.usuario?.email || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-[20px_1fr] gap-3 items-center">
                      <Network className="h-4 w-4" style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }} />
                      <div className="space-y-1">
                        <p className="text-xs font-medium" style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }}>
                          IP Cliente
                        </p>
                        <p className="text-sm" style={{ color: isDarkMode ? "#e5e7eb" : "#212529" }}>
                          {log.ip_cliente || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalles de la Acción */}
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
                    border: isDarkMode ? "1px solid #2d2d2d" : "1px solid #dee2e6",
                  }}
                >
                  <div
                    className="px-4 py-3 border-b flex items-center gap-2"
                    style={{
                      backgroundColor: isDarkMode ? "#252525" : "#f8f9fa",
                      borderColor: isDarkMode ? "#2d2d2d" : "#dee2e6",
                    }}
                  >
                    <Activity className="h-4 w-4 text-[#6f42c1]" />
                    <h3 className="text-sm font-semibold" style={{ color: isDarkMode ? "#e5e7eb" : "#212529" }}>
                      Detalles de la Acción
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-[20px_1fr] gap-3 items-center">
                      <Activity className="h-4 w-4" style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }} />
                      <div className="space-y-1">
                        <p className="text-xs font-medium" style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }}>
                          Acción
                        </p>
                        <p className="text-sm" style={{ color: isDarkMode ? "#e5e7eb" : "#212529" }}>
                          {getActionName(log.accion)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-[20px_1fr] gap-3 items-center">
                      <Database className="h-4 w-4" style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }} />
                      <div className="space-y-1">
                        <p className="text-xs font-medium" style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }}>
                          Tabla
                        </p>
                        <p className="text-sm" style={{ color: isDarkMode ? "#e5e7eb" : "#212529" }}>
                          {getTableName(log.tabla)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-[20px_1fr] gap-3 items-center">
                      <Hash className="h-4 w-4" style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }} />
                      <div className="space-y-1">
                        <p className="text-xs font-medium" style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }}>
                          ID Registro
                        </p>
                        <p className="text-sm" style={{ color: isDarkMode ? "#e5e7eb" : "#212529" }}>
                          {log.registro_id || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-[20px_1fr] gap-3 items-center">
                      <Clock className="h-4 w-4" style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }} />
                      <div className="space-y-1">
                        <p className="text-xs font-medium" style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }}>
                          Fecha y Hora
                        </p>
                        <p className="text-sm" style={{ color: isDarkMode ? "#e5e7eb" : "#212529" }}>
                          {formatDate(log.fecha_hora)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de Datos */}
              {(prevData || newData) && (
                <div className="space-y-4">
                  <Separator className="my-2" style={{ backgroundColor: isDarkMode ? "#2d2d2d" : "#dee2e6" }} />
                  <h3
                    className="text-base font-medium flex items-center gap-2"
                    style={{ color: isDarkMode ? "#e5e7eb" : "#212529" }}
                  >
                    <FileText className="h-4 w-4 text-[#6f42c1]" />
                    Datos del Registro
                  </h3>

                  <div className="space-y-4">
                    {prevData && (
                      <div
                        className="rounded-lg overflow-hidden"
                        style={{
                          backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
                          border: isDarkMode ? "1px solid #2d2d2d" : "1px solid #dee2e6",
                        }}
                      >
                        <div
                          className="px-4 py-3 border-b flex items-center gap-2"
                          style={{
                            backgroundColor: isDarkMode ? "#252525" : "#f8f9fa",
                            borderColor: isDarkMode ? "#2d2d2d" : "#dee2e6",
                          }}
                        >
                          <History className="h-4 w-4 text-[#6f42c1]" />
                          <h4 className="text-sm font-semibold" style={{ color: isDarkMode ? "#e5e7eb" : "#212529" }}>
                            Datos Anteriores
                          </h4>
                        </div>                        <div className="p-4">
                          <div
                            className="rounded-md"
                            style={{
                              border: isDarkMode ? "1px solid #2d2d2d" : "1px solid #dee2e6",
                            }}
                          >
                            <ScrollArea className="h-40">
                              <pre
                                className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap"
                                style={{
                                  backgroundColor: isDarkMode ? "#252525" : "#f8f9fa",
                                  color: isDarkMode ? "#e5e7eb" : "#212529",
                                }}
                              >
                                {prevData}
                              </pre>
                            </ScrollArea>
                          </div>
                        </div>
                      </div>
                    )}

                    {newData && (
                      <div
                        className="rounded-lg overflow-hidden"
                        style={{
                          backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
                          border: isDarkMode ? "1px solid #2d2d2d" : "1px solid #dee2e6",
                        }}
                      >
                        <div
                          className="px-4 py-3 border-b flex items-center gap-2"
                          style={{
                            backgroundColor: isDarkMode ? "#252525" : "#f8f9fa",
                            borderColor: isDarkMode ? "#2d2d2d" : "#dee2e6",
                          }}
                        >
                          <FileEdit className="h-4 w-4 text-[#6f42c1]" />
                          <h4 className="text-sm font-semibold" style={{ color: isDarkMode ? "#e5e7eb" : "#212529" }}>
                            Datos Nuevos
                          </h4>
                        </div>                        <div className="p-4">
                          <div
                            className="rounded-md"
                            style={{
                              border: isDarkMode ? "1px solid #2d2d2d" : "1px solid #dee2e6",
                            }}
                          >
                            <ScrollArea className="h-40">
                              <pre
                                className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap"
                                style={{
                                  backgroundColor: isDarkMode ? "#252525" : "#f8f9fa",
                                  color: isDarkMode ? "#e5e7eb" : "#212529",
                                }}
                              >
                                {newData}
                              </pre>
                            </ScrollArea>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Se eliminó el footer con el botón de cerrar */}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default AuditLogsPage
