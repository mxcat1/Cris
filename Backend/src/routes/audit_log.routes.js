const express = require("express")
const router = express.Router()
const auditLogController = require("../controllers/audit_log.controller")
const authMiddleware = require("../middlewares/auth.middleware")

// Solo administradores pueden ver los logs de auditoría
router.use(authMiddleware, (req, res, next) => {
  if (req.user && req.user.id_role === 1) {
    next()
  } else {
    return res.status(403).json({ message: "Acceso denegado. Solo administradores pueden ver los logs de auditoría." })
  }
})

router.get("/", auditLogController.getAll)
router.get("/usuario/:usuario_id", auditLogController.getByUser)
router.get("/tabla/:tabla", auditLogController.getByTable)
router.get("/accion/:accion", auditLogController.getByAction)
router.get("/rango-fechas", auditLogController.getByDateRange)
router.get("/stats", auditLogController.getLogStats)
router.delete("/", auditLogController.deleteLogs)

module.exports = router
