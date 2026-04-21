const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const solicitudImportacionController = require("../controllers/solicitudImportacion.controller");

// Todas las rutas admin requieren JWT válido (cualquier rol autenticado del ERP).
// Nota MVP: restringir a rol Gerente/Administrador con verificarRolesSinHorario
// queda pendiente para ecommerce-features (afinación de permisos finos).
router.use(authMiddleware);

router.get("/", solicitudImportacionController.listAdmin);
router.put("/:id/estado", solicitudImportacionController.updateEstadoAdmin);

module.exports = router;
