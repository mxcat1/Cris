const { Producto, Categoria, Oferta, CodigoBarras } = require("../models");
const fs = require('fs');
const path = require('path');
const IGV_RATE = 0.18;

// Función helper para generar URLs completas de imágenes
const generarUrlCompleta = (imagen_url, req) => {
  if (!imagen_url) return null;
  
  // Si ya es una URL completa (http/https), devolverla tal como está
  if (imagen_url.startsWith('http')) {
    return imagen_url;
  }
  
  // Obtener el protocolo y host, manejando proxies y configuraciones del servidor
  const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'https';
  let host = req.get('X-Forwarded-Host') || req.get('Host') || req.get('host');
  
  // Limpiar el host para evitar duplicaciones y problemas con proxies
  if (host && host.includes(',')) {
    host = host.split(',')[0].trim();
  }
  
  // Construir la URL base usando PUBLIC_BASE_URL si está configurado
  const baseUrl = process.env.PUBLIC_BASE_URL || `${protocol}://${host}`;
  
  // Si imagen_url ya incluye '/uploads/', usar tal como está
  if (imagen_url.startsWith('/uploads/')) {
    return `${baseUrl}${imagen_url}`;
  }
  
  // Si es solo el nombre del archivo o una ruta relativa, agregarlo a la ruta uploads/productos
  const filename = imagen_url.split(/[\\\/]/).pop() || imagen_url;
  return `${baseUrl}/uploads/productos/${filename}`;
};

const productoController = {
  // Crear un nuevo producto
  create: async (req, res) => {
    try {
      const { sku, nombre, descripcion, precio_unitario, precio_unitario_con_igv, precio_mayoritario, precio_mayoritario_con_igv, stock, id_categoria } = req.body

      // Validación básica
      if (!sku || !nombre || precio_unitario === undefined || precio_unitario_con_igv === undefined || id_categoria === undefined) {
        return res.status(400).json({
          message: "Faltan campos obligatorios: sku, nombre, precio_unitario, precio_unitario_con_igv y id_categoria son requeridos",
        })
      }

      // Validar precios y stock (S8)
      const precioUnitarioNum = parseFloat(precio_unitario);
      if (!Number.isFinite(precioUnitarioNum) || precioUnitarioNum <= 0) {
        return res.status(400).json({ message: "Precio inválido" });
      }
      const precioConIgvNum = parseFloat(precio_unitario_con_igv);
      if (!Number.isFinite(precioConIgvNum) || precioConIgvNum <= 0) {
        return res.status(400).json({ message: "Precio inválido" });
      }
      if (stock !== undefined && stock !== null && stock !== '') {
        const stockNum = Number(stock);
        if (!Number.isInteger(stockNum) || stockNum < 0) {
          return res.status(400).json({ message: "Stock inválido" });
        }
      }

      // Verificar que la categoría existe
      const categoriaExiste = await Categoria.findByPk(id_categoria)
      if (!categoriaExiste) {
        return res.status(404).json({ message: "La categoría especificada no existe" })
      }

      // Verificar que el SKU no esté duplicado
      const skuExistente = await Producto.findOne({ where: { sku } })
      if (skuExistente) {
        return res.status(409).json({ message: "Ya existe un producto con ese SKU" })
      }

      // Procesar imagen si se subió
      let imagen_url = null;
      if (req.file) {
        // Guardar solo la ruta relativa desde /uploads
        imagen_url = req.file.path.replace(/.*\/uploads/, '/uploads');
      }

      // Guardar los datos tal como vienen del frontend
      const producto = await Producto.create({
        sku,
        nombre,
        descripcion,
        precio_unitario: precio_unitario,
        precio_unitario_con_igv: precio_unitario_con_igv,
        precio_mayoritario: precio_mayoritario || null,
        precio_mayoritario_con_igv: precio_mayoritario_con_igv || null,
        stock: stock || 0,
        id_categoria,
        imagen_url,
      })

      return res.status(201).json({
        message: "Producto creado exitosamente",
        producto,
      })
    } catch (error) {
      console.error("Error al crear el producto:", error)
      return res.status(500).json({
        message: "Error al crear el producto",
        error: error.message,
      })
    }
  },

  // Obtener todos los productos
  getAll: async (req, res) => {
    try {
      const productos = await Producto.findAll({
        include: [
          {
            model: Categoria,
            as: "categoria",
            attributes: ["nombre"],
          },
          {
            model: Oferta,
            as: "oferta",
            attributes: ["descuento"],
          },
          {
            model: CodigoBarras,
            as: "codigos_barras",
            attributes: ["codigo_barras", "cantidad"],
            required: false // LEFT JOIN para que incluya productos sin códigos
          },
        ],
        order: [["nombre", "ASC"]],
      });

      const productosConOferta = productos.map(producto => {
        const productoData = producto.toJSON();
        // Generar URL completa para la imagen
        if (productoData.imagen_url) {
          productoData.imagen_url = generarUrlCompleta(productoData.imagen_url, req);
        }
        return productoData;
      });

      return res.status(200).json(productosConOferta);
    } catch (error) {
      console.error("Error al obtener productos:", error)
      return res.status(500).json({
        message: "Error al obtener productos",
        error: error.message,
      })
    }
  },

  // Obtener productos por categoría
  getByCategoria: async (req, res) => {
    try {
      const { id_categoria } = req.params

      // Verificar que la categoría existe
      const categoriaExiste = await Categoria.findByPk(id_categoria)
      if (!categoriaExiste) {
        return res.status(404).json({ message: "La categoría especificada no existe" })
      }

      const productos = await Producto.findAll({
        where: { id_categoria },
        include: [
          {
            model: Oferta,
            as: "oferta",
            attributes: ["descuento"],
          },
        ],
        order: [["nombre", "ASC"]],
      });

      const productosConOferta = productos.map(producto => {
        const productoData = producto.toJSON();
        // Generar URL completa para la imagen
        if (productoData.imagen_url) {
          productoData.imagen_url = generarUrlCompleta(productoData.imagen_url, req);
        }
        return productoData;
      });

      return res.status(200).json(productosConOferta)
    } catch (error) {
      console.error("Error al obtener productos por categoría:", error)
      return res.status(500).json({
        message: "Error al obtener productos por categoría",
        error: error.message,
      })
    }
  },

  // Obtener un producto por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params

      const producto = await Producto.findByPk(id, {
        include: {
          model: Categoria,
          as: "categoria",
        },
      })

      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" })
      }

      const productoData = producto.toJSON();
      // Generar URL completa para la imagen
      if (productoData.imagen_url) {
        productoData.imagen_url = generarUrlCompleta(productoData.imagen_url, req);
      }

      return res.status(200).json(productoData)
    } catch (error) {
      console.error("Error al obtener el producto:", error)
      return res.status(500).json({
        message: "Error al obtener el producto",
        error: error.message,
      })
    }
  },

  // Actualizar un producto
  update: async (req, res) => {
    try {
      const { id } = req.params
      const { sku, nombre, descripcion, precio_unitario, precio_unitario_con_igv, precio_mayoritario, precio_mayoritario_con_igv, stock, id_categoria } = req.body

      const producto = await Producto.findByPk(id)

      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" })
      }

      // Si se actualiza el SKU, verificar que no exista otro producto con ese SKU
      if (sku && sku !== producto.sku) {
        const skuExistente = await Producto.findOne({ where: { sku } })
        if (skuExistente) {
          return res.status(409).json({ message: "Ya existe un producto con ese SKU" })
        }
        producto.sku = sku
      }

      // Si se actualiza la categoría, verificar que existe
      if (id_categoria && id_categoria !== producto.id_categoria) {
        const categoriaExiste = await Categoria.findByPk(id_categoria)
        if (!categoriaExiste) {
          return res.status(404).json({ message: "La categoría especificada no existe" })
        }
        producto.id_categoria = id_categoria
      }

      // Validar precios y stock si se envían en el body (S8)
      if (precio_unitario !== undefined) {
        const precioNum = parseFloat(precio_unitario);
        if (!Number.isFinite(precioNum) || precioNum <= 0) {
          return res.status(400).json({ message: "Precio inválido" });
        }
      }
      if (precio_unitario_con_igv !== undefined) {
        const precioConIgvNum = parseFloat(precio_unitario_con_igv);
        if (!Number.isFinite(precioConIgvNum) || precioConIgvNum <= 0) {
          return res.status(400).json({ message: "Precio inválido" });
        }
      }
      if (stock !== undefined) {
        const stockNum = Number(stock);
        if (!Number.isInteger(stockNum) || stockNum < 0) {
          return res.status(400).json({ message: "Stock inválido" });
        }
      }

      // Procesar imagen si se subió una nueva
      if (req.file) {
        // Si el producto ya tiene una imagen, eliminar la anterior
        if (producto.imagen_url) {
          try {
            // Construir la ruta completa del archivo anterior
            const oldImagePath = path.join(__dirname, '../../src', producto.imagen_url);
            
            // Verificar si el archivo existe y eliminarlo
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);

            }
          } catch (error) {
            console.error('Error al eliminar imagen anterior:', error);
            // No fallar la actualización si hay error al eliminar la imagen anterior
          }
        }
        
        // Guardar solo la ruta relativa desde /uploads
        producto.imagen_url = req.file.path.replace(/.*\/uploads/, '/uploads');
      }

      // Actualizar los demás campos
      if (nombre !== undefined) producto.nombre = nombre
      if (descripcion !== undefined) producto.descripcion = descripcion
      if (precio_unitario !== undefined) producto.precio_unitario = precio_unitario
      if (precio_unitario_con_igv !== undefined) producto.precio_unitario_con_igv = precio_unitario_con_igv
      if (precio_mayoritario !== undefined) producto.precio_mayoritario = precio_mayoritario
      if (precio_mayoritario_con_igv !== undefined) producto.precio_mayoritario_con_igv = precio_mayoritario_con_igv
      if (stock !== undefined) producto.stock = stock

      await producto.save()

      const productoData = producto.toJSON();
      // Generar URL completa para la imagen
      if (productoData.imagen_url) {
        productoData.imagen_url = generarUrlCompleta(productoData.imagen_url, req);
      }

      return res.status(200).json({
        message: "Producto actualizado exitosamente",
        producto: productoData,
      })
    } catch (error) {
      console.error("Error al actualizar el producto:", error)
      return res.status(500).json({
        message: "Error al actualizar el producto",
        error: error.message,
      })
    }
  },

  // Actualizar el stock de un producto (PATCH)
  updateStock: async (req, res) => {
    try {
      const { id } = req.params
      const { cantidad } = req.body

      if (cantidad === undefined) {
        return res.status(400).json({ message: "La cantidad es requerida" })
      }

      const producto = await Producto.findByPk(id)

      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" })
      }

      // Actualizar el stock
      producto.stock = cantidad

      // Si se quiere decrementar el stock:
      // producto.stock = Math.max(0, producto.stock - Math.abs(cantidad));

      await producto.save()

      const productoData = producto.toJSON();
      // Generar URL completa para la imagen
      if (productoData.imagen_url) {
        productoData.imagen_url = generarUrlCompleta(productoData.imagen_url, req);
      }

      return res.status(200).json({
        message: "Stock actualizado exitosamente",
        producto: productoData,
      })
    } catch (error) {
      console.error("Error al actualizar el stock:", error)
      return res.status(500).json({
        message: "Error al actualizar el stock",
        error: error.message,
      })
    }
  },

  // Disminuir el stock de un producto
  decrementStock: async (req, res) => {
    try {
      const { id } = req.params
      const { cantidad = 1 } = req.body

      if (cantidad <= 0) {
        return res.status(400).json({ message: "La cantidad debe ser mayor a 0" })
      }

      const producto = await Producto.findByPk(id)

      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" })
      }

      // Verificar si hay suficiente stock
      if (producto.stock < cantidad) {
        return res.status(400).json({
          message: "No hay suficiente stock disponible",
          stockActual: producto.stock,
          cantidadSolicitada: cantidad,
        })
      }

      // Actualizar el stock
      producto.stock -= cantidad
      await producto.save()

      const productoData = producto.toJSON();
      // Generar URL completa para la imagen
      if (productoData.imagen_url) {
        productoData.imagen_url = generarUrlCompleta(productoData.imagen_url, req);
      }

      return res.status(200).json({
        message: "Stock disminuido exitosamente",
        producto: productoData,
      })
    } catch (error) {
      console.error("Error al disminuir el stock:", error)
      return res.status(500).json({
        message: "Error al disminuir el stock",
        error: error.message,
      })
    }
  },

  // Asignar o actualizar oferta a un producto
  setOferta: async (req, res) => {
    try {
      const { id_producto, descuento } = req.body;
      if (!id_producto || typeof descuento !== 'number' || descuento <= 0 || descuento >= 100) {
        return res.status(400).json({ message: "Debe enviar 'id_producto' y 'descuento' (1-99)" });
      }
      const producto = await Producto.findByPk(id_producto);
      if (!producto) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }
      // Calcular precio oferta con IGV y sin IGV
      const precioNormalConIGV = parseFloat(producto.precio_unitario_con_igv);
      const precioOfertaConIGV = Number((precioNormalConIGV * (1 - descuento / 100)).toFixed(2));
      const precioOfertaSinIGV = Number((precioOfertaConIGV / 1.18).toFixed(2));
      // Actualizar producto
      producto.es_oferta = true;
      producto.precio_oferta = precioOfertaSinIGV;
      producto.precio_oferta_con_igv = precioOfertaConIGV;
      await producto.save();

      const productoData = producto.toJSON();
      // Generar URL completa para la imagen
      if (productoData.imagen_url) {
        productoData.imagen_url = generarUrlCompleta(productoData.imagen_url, req);
      }

      return res.status(200).json({
        message: 'Oferta asignada correctamente',
        producto: productoData,
      });
    } catch (error) {
      console.error('Error al asignar oferta:', error);
      return res.status(500).json({
        message: 'Error al asignar oferta',
        error: error.message,
      });
    }
  },

  // Eliminar un producto
  delete: async (req, res) => {
    try {
      const { id } = req.params

      const producto = await Producto.findByPk(id)

      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" })
      }

      // Si el producto tiene una imagen, eliminarla del sistema de archivos
      if (producto.imagen_url) {
        try {
          // Construir la ruta completa del archivo
          const imagePath = path.join(__dirname, '../../src', producto.imagen_url);
          
          // Verificar si el archivo existe y eliminarlo
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);

          }
        } catch (error) {
          console.error('Error al eliminar imagen del producto:', error);
          // No fallar la eliminación del producto si hay error al eliminar la imagen
        }
      }

      await producto.destroy()

      return res.status(200).json({
        message: "Producto eliminado exitosamente",
      })
    } catch (error) {
      console.error("Error al eliminar el producto:", error)
      return res.status(500).json({
        message: "Error al eliminar el producto",
        error: error.message,
      })
    }  },

  // Eliminar imagen de un producto
  deleteImage: async (req, res) => {
    try {
      const { id } = req.params

      const producto = await Producto.findByPk(id)

      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" })
      }

      if (!producto.imagen_url) {
        return res.status(400).json({ message: "El producto no tiene imagen para eliminar" })
      }

      // Eliminar la imagen del sistema de archivos
      try {
        // Construir la ruta completa del archivo
        const imagePath = path.join(__dirname, '../../src', producto.imagen_url);
        
        // Verificar si el archivo existe y eliminarlo
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.error('Error al eliminar archivo de imagen:', error);
        // Continuar para actualizar la base de datos aunque falle la eliminación del archivo
      }

      // Actualizar el producto para remover la referencia a la imagen
      producto.imagen_url = null;
      await producto.save();

      return res.status(200).json({
        message: "Imagen del producto eliminada exitosamente",
        producto,
      })
    } catch (error) {
      console.error("Error al eliminar imagen del producto:", error)
      return res.status(500).json({
        message: "Error al eliminar imagen del producto",
        error: error.message,
      })
    }
  },
}

module.exports = productoController