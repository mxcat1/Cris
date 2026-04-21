const { Producto, Categoria, Banner, Tarjeta } = require("../models");

// Función helper para generar URLs completas de imágenes
const generarUrlCompleta = (imagen_url, req, tipo = 'productos') => {
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

  // Si es solo el nombre del archivo o una ruta relativa, agregarlo a la ruta según tipo
  const filename = imagen_url.split(/[\\\/]/).pop() || imagen_url;
  return `${baseUrl}/uploads/${tipo}/${filename}`;
};

const ecommerceController = {
  // Obtener productos para ecommerce (API pública)
  getProducts: async (req, res) => {
    try {
      const productos = await Producto.findAll({
        include: [
          {
            model: Categoria,
            as: "categoria",
            attributes: ["nombre"],
          },
        ],
        order: [["nombre", "ASC"]],
      });

      // Mapear los productos al formato requerido para ecommerce
      const productosEcommerce = productos.map(producto => ({
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio_unitario_con_igv, // Cambiar nombre a 'precio'
        es_oferta: producto.es_oferta,
        precio_oferta: producto.precio_oferta_con_igv, // Cambiar nombre a 'precio_oferta'
        imagen_url: generarUrlCompleta(producto.imagen_url, req),
        id_categoria: producto.id_categoria,
        categoria: {
          nombre: producto.categoria ? producto.categoria.nombre : null
        }
      }));

      return res.status(200).json(productosEcommerce);
    } catch (error) {
      console.error("Error al obtener productos para ecommerce:", error);
      return res.status(500).json({
        message: "Error al obtener productos",
        error: error.message,
      });
    }
  },

  // Obtener categorías para ecommerce (API pública)
  getCategories: async (req, res) => {
    try {
      const categorias = await Categoria.findAll({
        attributes: ['id_categoria', 'nombre', 'descripcion', 'imagen_url'],
        order: [['nombre', 'ASC']]
      });

      // Generar URLs completas para las imágenes de cada categoría
      const categoriasConImagenes = categorias.map(categoria => {
        const categoriaData = categoria.toJSON();
        if (categoriaData.imagen_url) {
          categoriaData.imagen_url = generarUrlCompleta(categoriaData.imagen_url, req, 'categorias');
        }
        return categoriaData;
      });

      return res.status(200).json(categoriasConImagenes);
    } catch (error) {
      console.error("Error al obtener categorías para ecommerce:", error);
      return res.status(500).json({
        message: "Error al obtener categorías",
        error: error.message,
      });
    }
  },

  // Obtener productos por categoría para ecommerce (API pública)
  getProductsByCategory: async (req, res) => {
    try {
      const { id_categoria } = req.params;

      // Verificar que la categoría existe
      const categoriaExiste = await Categoria.findByPk(id_categoria);
      if (!categoriaExiste) {
        return res.status(404).json({ message: "La categoría especificada no existe" });
      }

      const productos = await Producto.findAll({
        where: { id_categoria },
        include: [
          {
            model: Categoria,
            as: "categoria",
            attributes: ["nombre"],
          },
        ],
        order: [["nombre", "ASC"]],
      });

      // Mapear los productos al formato requerido para ecommerce
      const productosEcommerce = productos.map(producto => ({
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio_unitario_con_igv, // Cambiar nombre a 'precio'
        es_oferta: producto.es_oferta,
        precio_oferta: producto.precio_oferta_con_igv, // Cambiar nombre a 'precio_oferta'
        imagen_url: generarUrlCompleta(producto.imagen_url, req),
        id_categoria: producto.id_categoria,
        categoria: {
          nombre: producto.categoria ? producto.categoria.nombre : null
        }
      }));

      return res.status(200).json(productosEcommerce);
    } catch (error) {
      console.error("Error al obtener productos por categoría para ecommerce:", error);
      return res.status(500).json({
        message: "Error al obtener productos por categoría",
        error: error.message,
      });
    }
  },

  // Obtener un producto específico para ecommerce (API pública)
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;

      const producto = await Producto.findByPk(id, {
        include: {
          model: Categoria,
          as: "categoria",
          attributes: ["nombre"],
        },
      });

      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      // Mapear el producto al formato requerido para ecommerce
      const productoEcommerce = {
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio_unitario_con_igv, // Cambiar nombre a 'precio'
        es_oferta: producto.es_oferta,
        precio_oferta: producto.precio_oferta_con_igv, // Cambiar nombre a 'precio_oferta'
        imagen_url: generarUrlCompleta(producto.imagen_url, req),
        id_categoria: producto.id_categoria,
        categoria: {
          nombre: producto.categoria ? producto.categoria.nombre : null
        }
      };

      return res.status(200).json(productoEcommerce);
    } catch (error) {
      console.error("Error al obtener el producto para ecommerce:", error);
      return res.status(500).json({
        message: "Error al obtener el producto",
        error: error.message,
      });
    }
  },

  // Obtener productos en oferta para ecommerce (API pública)
  getOffersProducts: async (req, res) => {
    try {
      const productos = await Producto.findAll({
        where: { es_oferta: true },
        include: [
          {
            model: Categoria,
            as: "categoria",
            attributes: ["nombre"],
          },
        ],
        order: [["nombre", "ASC"]],
      });

      // Mapear los productos al formato requerido para ecommerce
      const productosEcommerce = productos.map(producto => ({
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio_unitario_con_igv, // Cambiar nombre a 'precio'
        es_oferta: producto.es_oferta,
        precio_oferta: producto.precio_oferta_con_igv, // Cambiar nombre a 'precio_oferta'
        imagen_url: generarUrlCompleta(producto.imagen_url, req),
        id_categoria: producto.id_categoria,
        categoria: {
          nombre: producto.categoria ? producto.categoria.nombre : null
        }
      }));

      return res.status(200).json(productosEcommerce);
    } catch (error) {
      console.error("Error al obtener productos en oferta para ecommerce:", error);
      return res.status(500).json({
        message: "Error al obtener productos en oferta",
        error: error.message,
      });
    }
  },

  // Obtener el banner público para ecommerce
  getBannerPublic: async (req, res) => {
    try {
      const banner = await Banner.findOne({
        order: [['creado_en', 'DESC']]
      });

      if (!banner || !banner.imagen_url) {
        return res.status(404).json({ message: 'No hay banner disponible' });
      }

      // Generar URL completa para la imagen
      const bannerData = banner.toJSON();
      if (bannerData.imagen_url) {
        bannerData.imagen_url = generarUrlCompleta(bannerData.imagen_url, req, 'banner');
      }

      return res.status(200).json(bannerData);
    } catch (error) {
      console.error('Error al obtener el banner para ecommerce:', error);
      return res.status(500).json({
        message: 'Error al obtener el banner',
        error: error.message
      });
    }
  },

  // Obtener todas las tarjetas públicas para ecommerce
  getTarjetasPublic: async (req, res) => {
    try {
      const tarjetas = await Tarjeta.findAll({
        order: [['creado_en', 'DESC']]
      });

      // Generar URLs completas para las imágenes de cada tarjeta
      const tarjetasConImagenes = tarjetas.map(tarjeta => {
        const tarjetaData = tarjeta.toJSON();
        if (tarjetaData.imagen_url) {
          tarjetaData.imagen_url = generarUrlCompleta(tarjetaData.imagen_url, req, 'tarjetas');
        }
        return tarjetaData;
      });

      return res.status(200).json(tarjetasConImagenes);
    } catch (error) {
      console.error('Error al obtener tarjetas para ecommerce:', error);
      return res.status(500).json({
        message: 'Error al obtener tarjetas',
        error: error.message
      });
    }
  },

  // Obtener una tarjeta específica por ID para ecommerce
  getTarjetaByIdPublic: async (req, res) => {
    try {
      const { id } = req.params;

      const tarjeta = await Tarjeta.findOne({
        where: {
          id_tarjeta: id
        }
      });

      if (!tarjeta) {
        return res.status(404).json({ message: 'Tarjeta no encontrada' });
      }

      // Generar URL completa para la imagen
      const tarjetaData = tarjeta.toJSON();
      if (tarjetaData.imagen_url) {
        tarjetaData.imagen_url = generarUrlCompleta(tarjetaData.imagen_url, req, 'tarjetas');
      }

      return res.status(200).json(tarjetaData);
    } catch (error) {
      console.error('Error al obtener la tarjeta para ecommerce:', error);
      return res.status(500).json({
        message: 'Error al obtener la tarjeta',
        error: error.message
      });
    }
  },

  // Obtener todos los banners públicos para ecommerce (carrusel)
  getBannersPublic: async (req, res) => {
    try {
      const banners = await Banner.findAll({
        order: [['creado_en', 'DESC']]
      });
      const bannersConImagen = banners.map(banner => {
        const data = banner.toJSON();
        if (data.imagen_url) {
          data.imagen_url = generarUrlCompleta(data.imagen_url, req, 'banner');
        }
        return data;
      });
      return res.status(200).json(bannersConImagen);
    } catch (error) {
      console.error('Error al obtener banners para ecommerce:', error);
      return res.status(500).json({
        message: 'Error al obtener banners',
        error: error.message
      });
    }
  }
};

module.exports = ecommerceController;