const LibroReclamaciones = require("../models/libro_reclamaciones.model");

// Obtener todos los reclamos	extraer todos
exports.getAll = async (req, res) => {
  try {
    const reclamos = await LibroReclamaciones.findAll({ order: [["fecha", "DESC"]] });
    res.json(reclamos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener reclamos" });
  }
};

// Crear un nuevo reclamo
exports.create = async (req, res) => {
  try {
    const reclamo = await LibroReclamaciones.create(req.body);
    res.status(201).json(reclamo);
  } catch (error) {
    res.status(400).json({ message: "Error al crear reclamo" });
  }
};

// Obtener un reclamo por ID
exports.getById = async (req, res) => {
  try {
    const reclamo = await LibroReclamaciones.findByPk(req.params.id);
    if (!reclamo) return res.status(404).json({ message: "Reclamo no encontrado" });
    res.json(reclamo);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener reclamo" });
  }
};

// Actualizar un reclamo
exports.update = async (req, res) => {
  try {
    const reclamo = await LibroReclamaciones.findByPk(req.params.id);
    if (!reclamo) return res.status(404).json({ message: "Reclamo no encontrado" });
    await reclamo.update(req.body);
    res.json(reclamo);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar reclamo" });
  }
};

// Eliminar un reclamo
exports.delete = async (req, res) => {
  try {
    const reclamo = await LibroReclamaciones.findByPk(req.params.id);
    if (!reclamo) return res.status(404).json({ message: "Reclamo no encontrado" });
    await reclamo.destroy();
    res.json({ message: "Reclamo eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar reclamo" });
  }
};
