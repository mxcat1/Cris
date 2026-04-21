const fs = require('fs');
const path = require('path');
const { Banner } = require('../models');

const generarUrlCompleta = (imagen_url, req) => {
  if (!imagen_url) return null;
  if (imagen_url.startsWith('http')) return imagen_url;
  const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'https';
  let host = req.get('X-Forwarded-Host') || req.get('Host') || req.get('host');
  if (host && host.includes(',')) host = host.split(',')[0].trim();
  const baseUrl = `${protocol}://${host}`;
  if (imagen_url.startsWith('/uploads/')) return `${baseUrl}${imagen_url}`;
  const filename = imagen_url.split(/[\\\/]/).pop() || imagen_url;
  return `${baseUrl}/uploads/banner/${filename}`;
};

const bannerController = {
  // GET /banners
  getAll: async (req, res) => {
    try {
      const banners = await Banner.findAll({ order: [['creado_en', 'DESC']] });
      const bannersConImagen = banners.map(b => {
        const data = b.toJSON();
        if (data.imagen_url) data.imagen_url = generarUrlCompleta(data.imagen_url, req);
        return data;
      });
      return res.status(200).json(bannersConImagen);
    } catch (error) {
      return res.status(500).json({ message: 'Error al obtener banners', error: error.message });
    }
  },

  // GET /banners/:id
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const banner = await Banner.findByPk(id);
      if (!banner) return res.status(404).json({ message: 'Banner no encontrado' });
      const data = banner.toJSON();
      if (data.imagen_url) data.imagen_url = generarUrlCompleta(data.imagen_url, req);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ message: 'Error al obtener banner', error: error.message });
    }
  },

  // POST /banners
  create: async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Debe subir una imagen para el banner' });
      const imagen_url = req.file.path.replace(/.*\/uploads/, '/uploads');
      const { whatsapp } = req.body;
      const banner = await Banner.create({ imagen_url, whatsapp: whatsapp || null });
      const data = banner.toJSON();
      if (data.imagen_url) data.imagen_url = generarUrlCompleta(data.imagen_url, req);
      return res.status(201).json({ message: 'Banner creado exitosamente', banner: data });
    } catch (error) {
      return res.status(500).json({ message: 'Error al crear banner', error: error.message });
    }
  },

  // PUT /banners/:id
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const banner = await Banner.findByPk(id);
      if (!banner) return res.status(404).json({ message: 'Banner no encontrado' });
      if (req.file) {
        if (banner.imagen_url) {
          try {
            const imagePath = path.join(__dirname, '../../src', banner.imagen_url);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
          } catch (error) { /* continuar */ }
        }
        banner.imagen_url = req.file.path.replace(/.*\/uploads/, '/uploads');
      }
      if (req.body.whatsapp !== undefined) banner.whatsapp = req.body.whatsapp;
      await banner.save();
      const data = banner.toJSON();
      if (data.imagen_url) data.imagen_url = generarUrlCompleta(data.imagen_url, req);
      return res.status(200).json({ message: 'Banner actualizado exitosamente', banner: data });
    } catch (error) {
      return res.status(500).json({ message: 'Error al actualizar banner', error: error.message });
    }
  },

  // DELETE /banners/:id
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const banner = await Banner.findByPk(id);
      if (!banner) return res.status(404).json({ message: 'Banner no encontrado' });
      if (banner.imagen_url) {
        try {
          const imagePath = path.join(__dirname, '../../src', banner.imagen_url);
          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        } catch (error) { /* continuar */ }
      }
      await banner.destroy();
      return res.status(200).json({ message: 'Banner eliminado exitosamente' });
    } catch (error) {
      return res.status(500).json({ message: 'Error al eliminar banner', error: error.message });
    }
  },

  // PATCH /banners/:id/whatsapp (solo para el banner con id más bajo)
  updateWhatsapp: async (req, res) => {
    try {
      const { whatsapp } = req.body;
      // Solo modificar el banner con id más bajo
      const banner = await Banner.findOne({ order: [['id_banner', 'ASC']] });
      if (!banner) return res.status(404).json({ message: 'No hay banner disponible' });
      banner.whatsapp = whatsapp || null;
      await banner.save();
      const data = banner.toJSON();
      if (data.imagen_url) data.imagen_url = generarUrlCompleta(data.imagen_url, req);
      return res.status(200).json({ message: 'WhatsApp actualizado', banner: data });
    } catch (error) {
      return res.status(500).json({ message: 'Error al actualizar WhatsApp', error: error.message });
    }
  },
};

module.exports = bannerController;
