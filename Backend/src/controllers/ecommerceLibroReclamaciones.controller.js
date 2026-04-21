const { LibroReclamaciones } = require("../models");

const ecommerceLibroReclamacionesController = {
  // Crear una nueva reclamación desde el ecommerce
  create: async (req, res) => {
    try {
      const { nombre, email, telefono, descripcion } = req.body;
      if (!nombre || !email || !descripcion) {
        return res.status(400).json({ message: "Faltan campos obligatorios" });
      }
      const nuevaReclamacion = await LibroReclamaciones.create({
        nombre,
        email,
        telefono,
        descripcion,
        estado: "pendiente",
      });
      return res.status(201).json(nuevaReclamacion);
    } catch (error) {
      console.error("Error al crear reclamación desde ecommerce:", error);
      return res.status(500).json({ message: "Error al crear reclamación", error: error.message });
    }
  },
};

module.exports = ecommerceLibroReclamacionesController;
