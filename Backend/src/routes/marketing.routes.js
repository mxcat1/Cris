const express = require("express");
const router = express.Router();
const marketingController = require("../controllers/marketing.controller");
const bannerController = require("../controllers/banner.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { verificarHorarioLaboral, verificarRolesSinHorario } = require("../middlewares/restricciones.middleware");
const { registrarAuditoria, capturarEstadoOriginal } = require("../middlewares/audit.middleware");
const upload = require("../middlewares/upload.middleware");
const Banner = require("../models/banner.model");
const Tarjeta = require("../models/tarjeta.model");

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Middleware condicional para upload de banner
const conditionalUploadBanner = (req, res, next) => {
  const contentType = req.get('Content-Type');
  if (contentType && contentType.includes('multipart/form-data')) {
    return upload.single('imagen_banner')(req, res, next);
  }
  next();
};

// Middleware condicional para upload de tarjeta
const conditionalUploadTarjeta = (req, res, next) => {
  const contentType = req.get('Content-Type');
  if (contentType && contentType.includes('multipart/form-data')) {
    return upload.single('imagen_tarjeta')(req, res, next);
  }
  next();
};

// ==== RUTAS PARA BANNER ====

// Rutas de solo lectura (no requieren horario laboral para rol 3)
router.get("/banner", verificarRolesSinHorario([1, 2, 3]), marketingController.getBanner);

// Rutas que requieren horario laboral para rol 3 (crear/editar/eliminar)
router.put(
  "/banner",
  verificarHorarioLaboral,
  conditionalUploadBanner,
  capturarEstadoOriginal(Banner),
  registrarAuditoria("actualizar", "banner"),
  marketingController.updateBanner
);

// Ruta para actualizar solo el WhatsApp del banner
router.patch(
  "/banner/whatsapp",
  verificarHorarioLaboral,
  capturarEstadoOriginal(Banner),
  registrarAuditoria("actualizar", "banner"),
  marketingController.updateBannerWhatsapp
);

router.delete(
  "/banner/imagen",
  verificarHorarioLaboral,
  capturarEstadoOriginal(Banner),
  registrarAuditoria("actualizar", "banner"),
  marketingController.deleteBannerImage
);

// Ruta para eliminar solo el WhatsApp del banner
router.delete(
  "/banner/whatsapp",
  verificarHorarioLaboral,
  capturarEstadoOriginal(Banner),
  registrarAuditoria("actualizar", "banner"),
  marketingController.deleteBannerWhatsapp
);

// ==== NUEVAS RUTAS PARA MULTIPLES BANNERS (CARRUSEL) ====

// Listar todos los banners
router.get("/banners", verificarRolesSinHorario([1, 2, 3]), bannerController.getAll);
// Obtener un banner por id
router.get("/banners/:id", verificarRolesSinHorario([1, 2, 3]), bannerController.getById);
// Crear un banner
router.post(
  "/banners",
  verificarHorarioLaboral,
  conditionalUploadBanner,
  registrarAuditoria("crear", "banners"),
  bannerController.create
);
// Actualizar un banner
router.put(
  "/banners/:id",
  verificarHorarioLaboral,
  conditionalUploadBanner,
  capturarEstadoOriginal(Banner),
  registrarAuditoria("actualizar", "banners"),
  bannerController.update
);
// Eliminar un banner
router.delete(
  "/banners/:id",
  verificarHorarioLaboral,
  capturarEstadoOriginal(Banner),
  registrarAuditoria("eliminar", "banners"),
  bannerController.delete
);
// Actualizar solo el WhatsApp del banner con id más bajo
router.patch(
  "/banners/:id/whatsapp",
  verificarHorarioLaboral,
  capturarEstadoOriginal(Banner),
  registrarAuditoria("actualizar", "banners"),
  bannerController.updateWhatsapp
);

// ==== RUTAS PARA TARJETAS ====

// Rutas de solo lectura (no requieren horario laboral para rol 3)
router.get("/tarjetas", verificarRolesSinHorario([1, 2, 3]), marketingController.getAllTarjetas);
router.get("/tarjetas/:id", verificarRolesSinHorario([1, 2, 3]), marketingController.getTarjetaById);

// Rutas que requieren horario laboral para rol 3 (crear/editar/eliminar)
router.post(
  "/tarjetas",
  verificarHorarioLaboral,
  conditionalUploadTarjeta,
  registrarAuditoria("crear", "tarjetas"),
  marketingController.createTarjeta
);

router.put(
  "/tarjetas/:id",
  verificarHorarioLaboral,
  conditionalUploadTarjeta,
  capturarEstadoOriginal(Tarjeta),
  registrarAuditoria("actualizar", "tarjetas"),
  marketingController.updateTarjeta
);

router.delete(
  "/tarjetas/:id/imagen",
  verificarHorarioLaboral,
  capturarEstadoOriginal(Tarjeta),
  registrarAuditoria("actualizar", "tarjetas"),
  marketingController.deleteTarjetaImage
);

router.delete(
  "/tarjetas/:id",
  verificarHorarioLaboral,
  capturarEstadoOriginal(Tarjeta),
  registrarAuditoria("eliminar", "tarjetas"),
  marketingController.deleteTarjeta
);

module.exports = router;
