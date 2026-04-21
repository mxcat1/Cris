const express = require("express")
const { register, login } = require("../controllers/auth.controller")
const { check } = require("express-validator")
const { registrarLogin } = require("../middlewares/audit.middleware")
const { requireAdminAccess } = require("../middlewares/admin.middleware")

const router = express.Router()

router.post(
  "/register",
  requireAdminAccess, // Solo gerentes y administradores pueden registrar usuarios
  [
    check("name", "El nombre es obligatorio").not().isEmpty(),
    check("email", "Agrega un email valido").not().isEmpty().isEmail(),
    check("password", "La contraseña debe tener al menos 6 caracteres").not().isEmpty().isLength({ min: 6 }),
  ],
  register,
)

router.post("/login", registrarLogin, login)

module.exports = router
