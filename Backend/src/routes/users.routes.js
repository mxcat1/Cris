const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller")
const authMiddleware = require("../middlewares/auth.middleware")
const { verificarRolesSinHorario } = require("../middlewares/restricciones.middleware")
const { registrarAuditoria, capturarEstadoOriginal } = require("../middlewares/audit.middleware")
const User = require("../models/user.model")

// Rutas de solo lectura - Gerentes (rol 1), Administradores (rol 2) y Vendedores (rol 3)
router.get("/", authMiddleware, verificarRolesSinHorario([1, 2, 3]), userController.getAllUsers)
router.get("/:id/basic", authMiddleware, verificarRolesSinHorario([1, 2, 3]), userController.getUserBasicInfo)
router.get("/:id", authMiddleware, verificarRolesSinHorario([1, 2, 3]), userController.getUserById)

// Rutas de escritura - Solo Gerentes (rol 1)
router.post("/", authMiddleware, verificarRolesSinHorario([1]), registrarAuditoria("crear", "usuarios"), userController.createUser)
router.put(
  "/:id",
  authMiddleware,
  verificarRolesSinHorario([1]),
  capturarEstadoOriginal(User),
  registrarAuditoria("actualizar", "usuarios"),
  userController.updateUser,
)
router.patch(
  "/:id",
  authMiddleware,
  verificarRolesSinHorario([1]),
  capturarEstadoOriginal(User),
  registrarAuditoria("actualizar", "usuarios"),
  userController.patchUser,
)
router.delete(
  "/:id",
  authMiddleware,
  verificarRolesSinHorario([1]),
  capturarEstadoOriginal(User),
  registrarAuditoria("eliminar", "usuarios"),
  userController.deleteUser,
)

module.exports = router
