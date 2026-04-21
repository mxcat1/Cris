const express = require("express")
const router = express.Router()
const productoController = require("../controllers/producto.controller")
const { validateProducto, validateStock } = require("../middlewares/validate.middleware")
const authMiddleware = require("../middlewares/auth.middleware")
const { verificarHorarioLaboral, verificarRolesSinHorario } = require("../middlewares/restricciones.middleware")
const { registrarAuditoria, capturarEstadoOriginal } = require("../middlewares/audit.middleware")
const upload = require("../middlewares/upload.middleware")
const Producto = require("../models/producto.model")

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware)

// Middleware condicional para upload
const conditionalUpload = (req, res, next) => {
  const contentType = req.get('Content-Type');
  if (contentType && contentType.includes('multipart/form-data')) {
    return upload.single('imagen')(req, res, next);
  }
  next();
};

// Rutas de solo lectura (no requieren horario laboral para rol 3)
router.get("/", verificarRolesSinHorario([1, 2, 3]), productoController.getAll)
router.get("/categoria/:id_categoria", verificarRolesSinHorario([1, 2, 3]), productoController.getByCategoria)
router.get("/:id", verificarRolesSinHorario([1, 2, 3]), productoController.getById)

// Rutas que requieren horario laboral para rol 3 (crear/editar/eliminar)
router.post("/", verificarHorarioLaboral, conditionalUpload, validateProducto, registrarAuditoria("crear", "productos"), productoController.create)
router.post('/asignar-oferta', verificarHorarioLaboral, productoController.setOferta)
router.patch(
  "/:id/stock",
  verificarHorarioLaboral,
  validateStock,
  capturarEstadoOriginal(Producto),
  registrarAuditoria("actualizar", "productos"),
  productoController.updateStock,
)
router.patch(
  "/:id/decrement",
  verificarHorarioLaboral,
  capturarEstadoOriginal(Producto),
  registrarAuditoria("actualizar", "productos"),
  productoController.decrementStock,
)
router.put(
  "/:id",
  verificarHorarioLaboral,
  conditionalUpload,
  validateProducto,
  capturarEstadoOriginal(Producto),
  registrarAuditoria("actualizar", "productos"),
  productoController.update,
)
router.patch(
  "/:id",
  verificarHorarioLaboral,
  conditionalUpload,
  capturarEstadoOriginal(Producto),
  registrarAuditoria("actualizar", "productos"),
  productoController.update,
)
router.delete(
  "/:id/imagen",
  verificarHorarioLaboral,
  capturarEstadoOriginal(Producto),
  registrarAuditoria("actualizar", "productos"),
  productoController.deleteImage,
)
router.delete(
  "/:id",
  verificarHorarioLaboral,
  capturarEstadoOriginal(Producto),
  registrarAuditoria("eliminar", "productos"),
  productoController.delete,
)

module.exports = router