const crypto = require("crypto");
const { SolicitudImportacion } = require("../models");

const ESTADOS_VALIDOS = [
  "recibida",
  "en_revision",
  "cotizada",
  "aprobada",
  "en_transito",
  "entregada",
  "rechazada",
];

const TIPOS_PRODUCTO_VALIDOS = [
  "laptop",
  "componente",
  "periferico",
  "monitor",
  "almacenamiento",
  "red",
  "otro",
];

const NIVELES_URGENCIA_VALIDOS = ["baja", "media", "alta", "urgente"];

// Campos seguros para exponer al cliente en seguimiento público.
// NO incluye notas_admin ni datos internos del ERP.
const CAMPOS_PUBLICOS = [
  "id_solicitud",
  "codigo_seguimiento",
  "nombre_producto",
  "tipo_producto",
  "marca",
  "modelo",
  "cantidad",
  "nivel_urgencia",
  "estado",
  "cotizacion_monto",
  "cotizacion_nota",
  "cotizacion_fecha",
  "fecha_entrega_estimada",
  "created_at",
  "updated_at",
];

const generarCodigoSeguimiento = () => {
  const hoy = new Date();
  const yyyymmdd =
    hoy.getFullYear().toString() +
    String(hoy.getMonth() + 1).padStart(2, "0") +
    String(hoy.getDate()).padStart(2, "0");
  // 6 caracteres aleatorios en [A-Z0-9]
  const sufijo = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return `SOL-${yyyymmdd}-${sufijo}`;
};

const toPublicView = (solicitud) => {
  const plain = solicitud.get({ plain: true });
  const publicView = {};
  CAMPOS_PUBLICOS.forEach((k) => {
    if (k in plain) publicView[k] = plain[k];
  });
  return publicView;
};

// ---------------------------------------------------------------------------
// POST /api/ecommerce/solicitudes-importacion — público
// ---------------------------------------------------------------------------
exports.create = async (req, res) => {
  try {
    const {
      nombre_solicitante,
      email_solicitante,
      telefono_solicitante,
      nombre_producto,
      tipo_producto,
      marca,
      modelo,
      especificaciones,
      pais_origen,
      cantidad,
      presupuesto_min,
      presupuesto_max,
      nivel_urgencia,
      mensaje,
    } = req.body;

    // Validaciones mínimas previas al modelo (mensajes genéricos al cliente)
    if (!nombre_solicitante || !email_solicitante || !nombre_producto || !tipo_producto) {
      return res.status(400).json({
        success: false,
        msg: "Faltan campos obligatorios: nombre_solicitante, email_solicitante, nombre_producto, tipo_producto",
      });
    }
    if (!TIPOS_PRODUCTO_VALIDOS.includes(tipo_producto)) {
      return res.status(400).json({
        success: false,
        msg: `tipo_producto inválido. Debe ser uno de: ${TIPOS_PRODUCTO_VALIDOS.join(", ")}`,
      });
    }
    if (nivel_urgencia && !NIVELES_URGENCIA_VALIDOS.includes(nivel_urgencia)) {
      return res.status(400).json({
        success: false,
        msg: `nivel_urgencia inválido. Debe ser uno de: ${NIVELES_URGENCIA_VALIDOS.join(", ")}`,
      });
    }

    // Generar código único. Retry hasta 3 veces por colisión (muy improbable).
    let codigo_seguimiento;
    for (let intento = 0; intento < 3; intento++) {
      codigo_seguimiento = generarCodigoSeguimiento();
      const existe = await SolicitudImportacion.findOne({ where: { codigo_seguimiento } });
      if (!existe) break;
      if (intento === 2) {
        return res.status(500).json({
          success: false,
          msg: "No se pudo generar un código único. Intenta de nuevo.",
        });
      }
    }

    const solicitud = await SolicitudImportacion.create({
      codigo_seguimiento,
      nombre_solicitante,
      email_solicitante,
      telefono_solicitante: telefono_solicitante || null,
      nombre_producto,
      tipo_producto,
      marca: marca || null,
      modelo: modelo || null,
      especificaciones: especificaciones || null,
      pais_origen: pais_origen || null,
      cantidad: cantidad !== undefined ? Number(cantidad) : 1,
      presupuesto_min: presupuesto_min !== undefined && presupuesto_min !== "" ? Number(presupuesto_min) : null,
      presupuesto_max: presupuesto_max !== undefined && presupuesto_max !== "" ? Number(presupuesto_max) : null,
      nivel_urgencia: nivel_urgencia || "media",
      mensaje: mensaje || null,
      estado: "recibida",
    });

    return res.status(201).json({
      success: true,
      msg: "Solicitud registrada. Guardá tu código de seguimiento.",
      data: toPublicView(solicitud),
    });
  } catch (err) {
    // Errores de validación de Sequelize (email inválido, campos obligatorios, etc.)
    if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
      console.error("[solicitudes-importacion.create] validación:", err.message);
      return res.status(400).json({ success: false, msg: "Datos inválidos en la solicitud." });
    }
    console.error("[solicitudes-importacion.create] error inesperado:", err);
    return res.status(500).json({ success: false, msg: "Error interno. Intenta de nuevo." });
  }
};

// ---------------------------------------------------------------------------
// GET /api/ecommerce/seguimiento/:codigo — público
// ---------------------------------------------------------------------------
exports.getBySeguimiento = async (req, res) => {
  try {
    const { codigo } = req.params;
    const solicitud = await SolicitudImportacion.findOne({
      where: { codigo_seguimiento: codigo },
    });
    if (!solicitud) {
      return res.status(404).json({
        success: false,
        msg: "No encontramos una solicitud con ese código.",
      });
    }
    return res.json({ success: true, data: toPublicView(solicitud) });
  } catch (err) {
    console.error("[solicitudes-importacion.getBySeguimiento] error:", err);
    return res.status(500).json({ success: false, msg: "Error interno." });
  }
};

// ---------------------------------------------------------------------------
// GET /api/solicitudes-importacion — admin (auth)
// ---------------------------------------------------------------------------
exports.listAdmin = async (req, res) => {
  try {
    const { estado, limit, offset } = req.query;
    const where = {};
    if (estado && ESTADOS_VALIDOS.includes(estado)) {
      where.estado = estado;
    }
    const solicitudes = await SolicitudImportacion.findAll({
      where,
      order: [["created_at", "DESC"]],
      limit: limit ? Math.min(Number(limit), 200) : 100,
      offset: offset ? Number(offset) : 0,
    });
    return res.json({ success: true, data: solicitudes });
  } catch (err) {
    console.error("[solicitudes-importacion.listAdmin] error:", err);
    return res.status(500).json({ success: false, msg: "Error interno." });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/solicitudes-importacion/:id/estado — admin (auth)
// ---------------------------------------------------------------------------
exports.updateEstadoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      estado,
      notas_admin,
      cotizacion_monto,
      cotizacion_nota,
      cotizacion_fecha,
      fecha_entrega_estimada,
    } = req.body;

    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        success: false,
        msg: `Estado inválido. Debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`,
      });
    }

    const solicitud = await SolicitudImportacion.findByPk(id);
    if (!solicitud) {
      return res.status(404).json({ success: false, msg: "Solicitud no encontrada." });
    }

    if (estado !== undefined) solicitud.estado = estado;
    if (notas_admin !== undefined) solicitud.notas_admin = notas_admin;
    if (cotizacion_monto !== undefined) solicitud.cotizacion_monto = cotizacion_monto;
    if (cotizacion_nota !== undefined) solicitud.cotizacion_nota = cotizacion_nota;
    if (cotizacion_fecha !== undefined) solicitud.cotizacion_fecha = cotizacion_fecha;
    if (fecha_entrega_estimada !== undefined) solicitud.fecha_entrega_estimada = fecha_entrega_estimada;

    // Si se establece cotización, autocompletar fecha si no vino explícita
    if (cotizacion_monto !== undefined && !solicitud.cotizacion_fecha) {
      solicitud.cotizacion_fecha = new Date();
    }

    await solicitud.save();
    return res.json({ success: true, data: solicitud });
  } catch (err) {
    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({ success: false, msg: "Datos inválidos." });
    }
    console.error("[solicitudes-importacion.updateEstadoAdmin] error:", err);
    return res.status(500).json({ success: false, msg: "Error interno." });
  }
};
