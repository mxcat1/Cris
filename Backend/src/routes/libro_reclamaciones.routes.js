const express = require("express");
const router = express.Router();
const libroReclamacionesController = require("../controllers/libro_reclamaciones.controller");

// Rutas para libro de reclamaciones
router.get("/", libroReclamacionesController.getAll);
router.post("/", libroReclamacionesController.create);
router.get("/:id", libroReclamacionesController.getById);
router.put("/:id", libroReclamacionesController.update);
router.delete("/:id", libroReclamacionesController.delete);

module.exports = router;
