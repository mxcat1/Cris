import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ClipboardList,
  Search,
  Eye,
  Save,
  Mail,
  Phone,
  Calendar,
  DollarSign,
} from "lucide-react"
import {
  solicitudImportacionService,
  type SolicitudImportacion,
  type EstadoSolicitud,
  ESTADO_LABELS,
  ESTADO_COLORES,
  URGENCIA_COLORES,
} from "../../services/solicitudImportacionService"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"

const ESTADOS: EstadoSolicitud[] = [
  "recibida",
  "en_revision",
  "cotizada",
  "aprobada",
  "en_transito",
  "entregada",
  "rechazada",
]

export default function SolicitudesImportacionPage() {
  const queryClient = useQueryClient()
  const [filtroEstado, setFiltroEstado] = useState<EstadoSolicitud | "todas">("todas")
  const [busqueda, setBusqueda] = useState("")
  const [selected, setSelected] = useState<SolicitudImportacion | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form state para editar
  const [estadoNuevo, setEstadoNuevo] = useState<EstadoSolicitud>("recibida")
  const [cotizacionMonto, setCotizacionMonto] = useState<string>("")
  const [cotizacionNota, setCotizacionNota] = useState<string>("")
  const [fechaEntrega, setFechaEntrega] = useState<string>("")
  const [notasAdmin, setNotasAdmin] = useState<string>("")

  const { data: solicitudes = [], isLoading, isError } = useQuery({
    queryKey: ["solicitudes-importacion", filtroEstado],
    queryFn: () =>
      solicitudImportacionService.listAll(
        filtroEstado !== "todas" ? { estado: filtroEstado } : undefined
      ),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: Parameters<typeof solicitudImportacionService.updateEstado>[1]
    }) => solicitudImportacionService.updateEstado(id, payload),
    onSuccess: (updated) => {
      toast.success(
        `Solicitud ${updated.codigo_seguimiento} actualizada a "${ESTADO_LABELS[updated.estado]}"`
      )
      queryClient.invalidateQueries({ queryKey: ["solicitudes-importacion"] })
      setDialogOpen(false)
      setSelected(null)
    },
    onError: () => {
      toast.error("No se pudo actualizar la solicitud.")
    },
  })

  // Filtrar por búsqueda (código, email, producto)
  const filtradas = useMemo(() => {
    if (!busqueda.trim()) return solicitudes
    const q = busqueda.trim().toLowerCase()
    return solicitudes.filter(
      (s) =>
        s.codigo_seguimiento.toLowerCase().includes(q) ||
        s.email_solicitante.toLowerCase().includes(q) ||
        s.nombre_producto.toLowerCase().includes(q) ||
        s.nombre_solicitante.toLowerCase().includes(q)
    )
  }, [solicitudes, busqueda])

  const abrirDetalle = (s: SolicitudImportacion) => {
    setSelected(s)
    setEstadoNuevo(s.estado)
    setCotizacionMonto(
      s.cotizacion_monto !== null && s.cotizacion_monto !== undefined
        ? String(s.cotizacion_monto)
        : ""
    )
    setCotizacionNota(s.cotizacion_nota ?? "")
    setFechaEntrega(
      s.fecha_entrega_estimada ? s.fecha_entrega_estimada.slice(0, 10) : ""
    )
    setNotasAdmin(s.notas_admin ?? "")
    setDialogOpen(true)
  }

  const handleGuardar = () => {
    if (!selected) return
    const payload: Parameters<typeof solicitudImportacionService.updateEstado>[1] = {
      estado: estadoNuevo,
      notas_admin: notasAdmin.trim() || null,
    }
    if (cotizacionMonto.trim()) {
      const monto = Number(cotizacionMonto)
      if (!Number.isFinite(monto) || monto < 0) {
        toast.error("Monto de cotización inválido.")
        return
      }
      payload.cotizacion_monto = monto
      payload.cotizacion_nota = cotizacionNota.trim() || null
    } else {
      payload.cotizacion_monto = null
      payload.cotizacion_nota = null
    }
    payload.fecha_entrega_estimada = fechaEntrega || null
    updateMutation.mutate({ id: selected.id_solicitud, payload })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Solicitudes de Importación
          </h1>
          <p className="text-muted-foreground">
            Gestiona las solicitudes recibidas desde el Ecommerce: cambia el estado,
            registra cotizaciones y deja notas internas al equipo.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtrá por estado o buscá por código, email, cliente o producto.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="busqueda" className="mb-2 block">
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="busqueda"
                placeholder="Código SOL-..., email, producto, cliente"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="md:w-64">
            <Label className="mb-2 block">Estado</Label>
            <Select
              value={filtroEstado}
              onValueChange={(v) => setFiltroEstado(v as EstadoSolicitud | "todas")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {ESTADO_LABELS[e]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filtradas.length} {filtradas.length === 1 ? "solicitud" : "solicitudes"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-muted-foreground text-sm">Cargando solicitudes…</p>
          )}
          {isError && (
            <p className="text-red-600 text-sm">
              No se pudo cargar el listado. Revisá la conexión al backend.
            </p>
          )}
          {!isLoading && !isError && filtradas.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No hay solicitudes con los filtros actuales.
            </p>
          )}
          {filtradas.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cant.</TableHead>
                  <TableHead>Urgencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((s) => (
                  <TableRow key={s.id_solicitud}>
                    <TableCell className="font-mono text-sm">
                      {s.codigo_seguimiento}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{s.nombre_solicitante}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.email_solicitante}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{s.nombre_producto}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {s.tipo_producto}
                        {s.marca ? ` · ${s.marca}` : ""}
                      </div>
                    </TableCell>
                    <TableCell>{s.cantidad}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${URGENCIA_COLORES[s.nivel_urgencia]}`}
                      >
                        {s.nivel_urgencia}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={ESTADO_COLORES[s.estado]}
                      >
                        {ESTADO_LABELS[s.estado]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => abrirDetalle(s)}
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Gestionar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalle / gestión */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">
                  {selected.codigo_seguimiento}
                </DialogTitle>
                <DialogDescription>
                  Gestiona el estado de esta solicitud y registra la cotización si
                  corresponde. Las notas del admin NO son visibles para el cliente.
                </DialogDescription>
              </DialogHeader>

              {/* Info del cliente + producto (readonly) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-y">
                <div>
                  <div className="text-xs text-muted-foreground">Cliente</div>
                  <div className="font-semibold">{selected.nombre_solicitante}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3" /> {selected.email_solicitante}
                  </div>
                  {selected.telefono_solicitante && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {selected.telefono_solicitante}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Producto</div>
                  <div className="font-semibold">{selected.nombre_producto}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {selected.tipo_producto}
                    {selected.marca ? ` · ${selected.marca}` : ""}
                    {selected.modelo ? ` · ${selected.modelo}` : ""}
                  </div>
                  <div className="text-sm mt-1">Cantidad: {selected.cantidad}</div>
                  {selected.pais_origen && (
                    <div className="text-sm">País: {selected.pais_origen}</div>
                  )}
                </div>
                {selected.especificaciones && (
                  <div className="md:col-span-2">
                    <div className="text-xs text-muted-foreground">
                      Especificaciones
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {selected.especificaciones}
                    </div>
                  </div>
                )}
                {selected.mensaje && (
                  <div className="md:col-span-2">
                    <div className="text-xs text-muted-foreground">
                      Mensaje del cliente
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {selected.mensaje}
                    </div>
                  </div>
                )}
                {(selected.presupuesto_min || selected.presupuesto_max) && (
                  <div className="md:col-span-2 text-sm">
                    <span className="text-muted-foreground">Presupuesto:</span>{" "}
                    {selected.presupuesto_min ?? "—"} — {selected.presupuesto_max ?? "—"} USD
                  </div>
                )}
              </div>

              {/* Gestión */}
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="mb-2 block">Estado</Label>
                  <Select
                    value={estadoNuevo}
                    onValueChange={(v) => setEstadoNuevo(v as EstadoSolicitud)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((e) => (
                        <SelectItem key={e} value={e}>
                          {ESTADO_LABELS[e]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cot-monto" className="mb-2 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" /> Cotización (USD)
                    </Label>
                    <Input
                      id="cot-monto"
                      type="number"
                      step="0.01"
                      min="0"
                      value={cotizacionMonto}
                      onChange={(e) => setCotizacionMonto(e.target.value)}
                      placeholder="Ej: 1250.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fecha-entrega" className="mb-2 flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Fecha estimada de entrega
                    </Label>
                    <Input
                      id="fecha-entrega"
                      type="date"
                      value={fechaEntrega}
                      onChange={(e) => setFechaEntrega(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cot-nota" className="mb-2 block">
                    Nota de cotización <span className="text-xs text-muted-foreground">(visible al cliente)</span>
                  </Label>
                  <Textarea
                    id="cot-nota"
                    rows={3}
                    value={cotizacionNota}
                    onChange={(e) => setCotizacionNota(e.target.value)}
                    placeholder="Ej: Disponible vía Amazon USA. Envío 5-7 días hábiles."
                  />
                </div>

                <div>
                  <Label htmlFor="notas-admin" className="mb-2 block">
                    Notas internas <span className="text-xs text-muted-foreground">(NO visibles al cliente)</span>
                  </Label>
                  <Textarea
                    id="notas-admin"
                    rows={3}
                    value={notasAdmin}
                    onChange={(e) => setNotasAdmin(e.target.value)}
                    placeholder="Ej: Cliente recurrente, priorizar. Proveedor: Newegg USA."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGuardar}
                  disabled={updateMutation.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? "Guardando…" : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
