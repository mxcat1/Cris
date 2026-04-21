const { Oferta, Producto } = require('../models');

// GET /api/ofertas-del-dia
exports.getOfertasDelDia = async (req, res) => {
  const ofertas = await Oferta.findAll({
    include: [{ model: Producto, as: 'producto', attributes: ['nombre', 'precio_unitario'] }]
  });
  res.json(ofertas);
};

// PUT /api/ofertas-del-dia
// Body: [ { "id_producto": 1, "descuento": 20 }, ... ] o { "id_producto": 1, "descuento": 20 }
exports.putOfertasDelDia = async (req, res) => {
  const ofertas = Array.isArray(req.body) ? req.body : [req.body];
  const errores = [];
  const procesadas = [];

  for (const oferta of ofertas) {
    const { id_producto, descuento } = oferta;
    if (!id_producto || typeof descuento !== 'number' || descuento <= 0 || descuento >= 100) {
      errores.push({ id_producto, error: "Debe enviar 'id_producto' y 'descuento' (1-99)" });
      continue;
    }
    // Verificar que el producto exista
    const producto = await Producto.findByPk(id_producto);
    if (!producto) {
      errores.push({ id_producto, error: 'Producto no encontrado' });
      continue;
    }
    // Crear o actualizar oferta
    await Oferta.upsert({ id_producto, descuento });
    // Sincronizar campos de producto
    // El precio de descuento se pone directamente en precio_oferta_con_igv
    const precioOfertaConIGV = parseFloat(producto.precio_unitario_con_igv) * (1 - descuento / 100);
    const precioOfertaConIGVFixed = Number(precioOfertaConIGV.toFixed(2));
    const precioOfertaSinIGV = Number((precioOfertaConIGVFixed / 1.18).toFixed(2));
    producto.es_oferta = true;
    producto.precio_oferta_con_igv = precioOfertaConIGVFixed;
    producto.precio_oferta = precioOfertaSinIGV;
    await producto.save();
    procesadas.push(id_producto);
  }

  if (errores.length > 0) {
    return res.status(207).json({ success: false, procesadas, errores });
  }
  res.json({ success: true, procesadas });
};

// DELETE /api/ofertas-del-dia/:id_producto
exports.deleteOfertaDelDia = async (req, res) => {
  // Solo aceptar el parámetro productoId de la ruta
  const id_producto = req.params.productoId;
  if (!id_producto) {
    return res.status(400).json({ error: 'Debe enviar el id_producto a eliminar en la URL' });
  }
  // Eliminar la oferta
  const deleted = await Oferta.destroy({ where: { id_producto } });
  // Limpiar campos de oferta en el producto solo si existía la oferta
  if (deleted > 0) {
    const producto = await Producto.findByPk(id_producto);
    if (producto) {
      producto.es_oferta = false;
      producto.precio_oferta = null;
      producto.precio_oferta_con_igv = null;
      await producto.save();
    }
    return res.json({ success: true });
  } else {
    return res.status(404).json({ success: false, message: 'No existe una oferta para ese producto' });
  }
};
