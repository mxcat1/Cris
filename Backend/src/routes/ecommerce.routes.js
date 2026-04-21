const express = require("express");
const router = express.Router();
const ecommerceController = require("../controllers/ecommerce.controller");

// Rutas públicas de ecommerce (sin autenticación)
// Estas APIs están diseñadas para ser consumidas por un frontend de ecommerce público

// Obtener todos los productos para ecommerce
router.get("/productos", ecommerceController.getProducts);

// Obtener todas las categorías para ecommerce
router.get("/categorias", ecommerceController.getCategories);

// Obtener productos por categoría para ecommerce
router.get("/categorias/:id_categoria/productos", ecommerceController.getProductsByCategory);

// Obtener un producto específico para ecommerce
router.get("/productos/:id", ecommerceController.getProductById);

// Obtener productos en oferta para ecommerce
router.get("/ofertas", ecommerceController.getOffersProducts);

// Obtener el banner para ecommerce
router.get("/banner", ecommerceController.getBannerPublic);

// Obtener todos los banners para ecommerce (carrusel)
router.get("/banners", ecommerceController.getBannersPublic);

// Obtener todas las tarjetas para ecommerce
router.get("/tarjetas", ecommerceController.getTarjetasPublic);


// Enviar reclamación desde el ecommerce
const ecommerceLibroReclamacionesController = require("../controllers/ecommerceLibroReclamaciones.controller");
router.post("/libro-reclamaciones", ecommerceLibroReclamacionesController.create);

// Obtener una tarjeta específica por ID para ecommerce
router.get("/tarjetas/:id", ecommerceController.getTarjetaByIdPublic);

// ---------------------------------------------------------------------------
// Solicitudes de importación — MVP público (hot-patch B)
// POST crea solicitud sin auth y devuelve codigo_seguimiento único.
// GET seguimiento/:codigo devuelve vista pública del estado.
// Cubierto por: __tests__/integration/solicitudes-importacion.test.js
// ---------------------------------------------------------------------------
const solicitudImportacionController = require("../controllers/solicitudImportacion.controller");
router.post("/solicitudes-importacion", solicitudImportacionController.create);
router.get("/seguimiento/:codigo", solicitudImportacionController.getBySeguimiento);

// ---------------------------------------------------------------------------
// Stubs para endpoints consumidos por el Ecommerce (Next.js) pero aún no
// implementados en el ERP. Devuelven respuestas vacías pero válidas
// (200 + [] o 200 + null) para que la UI no rompa con 404.
//
// Cuando se implemente cada módulo real (ciclo ecommerce-features dedicado),
// estos stubs deben reemplazarse por endpoints reales con su controller/model.
// Cubierto por: __tests__/integration/ecommerce-stubs.test.js
// ---------------------------------------------------------------------------
router.get("/testimonials", (_req, res) => res.json([]));
router.get("/contacts", (_req, res) => res.json([]));
router.get("/featured-category", (_req, res) => res.json(null));
router.get("/solicitudes-importacion", (_req, res) => res.json([]));
router.get("/solicitudes-importacion/mis-solicitudes", (_req, res) => res.json([]));
router.get("/solicitudes-importacion/admin", (_req, res) => res.json([]));
router.get("/solicitudes-importacion/admin/estadisticas", (_req, res) => res.json({}));
// /claims: alias informativo del ecommerce anterior. Hasta que se defina el
// mapeo real a libro-reclamaciones (o se cree su propio controller), stub vacío.
router.get("/claims", (_req, res) => res.json([]));

module.exports = router;
