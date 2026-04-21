const { CierreCaja, User } = require('../models');
const { Op } = require('sequelize');

const cierreCajaController = {
  // Crear un cierre de caja
  create: async (req, res) => {
    try {
      const {
        fecha_apertura,
        fecha_cierre,
        cajero_id,
        saldo_efectivo,
        total_efectivo,
        total_tarjeta,
        total_transferencia,
        total_yape,
        total_plin,
        cantidad_ventas,
        estado,
        observaciones
      } = req.body;

      const cierre = await CierreCaja.create({
        fecha_apertura,
        fecha_cierre,
        cajero_id,
        saldo_efectivo,
        total_efectivo,
        total_tarjeta,
        total_transferencia,
        total_yape,
        total_plin,
        cantidad_ventas,
        estado,
        observaciones
      });
      return res.status(201).json({ message: 'Cierre de caja registrado', cierre });
    } catch (error) {
      return res.status(500).json({ message: 'Error al crear cierre de caja', error: error.message });
    }
  },

  // Obtener todos los cierres de caja
  getAll: async (req, res) => {
    try {
      const cierres = await CierreCaja.findAll({ order: [['fecha_apertura', 'DESC']] });
      return res.status(200).json(cierres);
    } catch (error) {
      return res.status(500).json({ message: 'Error al obtener cierres de caja', error: error.message });
    }
  },

  // Obtener cierre de caja por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const cierre = await CierreCaja.findByPk(id);
      if (!cierre) return res.status(404).json({ message: 'Cierre de caja no encontrado' });
      return res.status(200).json(cierre);
    } catch (error) {
      return res.status(500).json({ message: 'Error al obtener cierre de caja', error: error.message });
    }
  },

  // Actualizar cierre de caja
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const cierre = await CierreCaja.findByPk(id);
      if (!cierre) return res.status(404).json({ message: 'Cierre de caja no encontrado' });
      // Si en el body viene monto_total, cambiarlo a saldo_efectivo
      if (req.body.monto_total !== undefined) {
        req.body.saldo_efectivo = req.body.monto_total;
        delete req.body.monto_total;
      }
      await cierre.update(req.body);
      return res.status(200).json({ message: 'Cierre de caja actualizado', cierre });
    } catch (error) {
      return res.status(500).json({ message: 'Error al actualizar cierre de caja', error: error.message });
    }
  },

  // Eliminar cierre de caja
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const cierre = await CierreCaja.findByPk(id);
      if (!cierre) return res.status(404).json({ message: 'Cierre de caja no encontrado' });
      await cierre.destroy();
      return res.status(200).json({ message: 'Cierre de caja eliminado' });
    } catch (error) {
      return res.status(500).json({ message: 'Error al eliminar cierre de caja', error: error.message });
    }
  },

  // Obtener cierres de caja por cajero
  getByCajero: async (req, res) => {
    try {
      const { cajero_id } = req.params;
      const cierres = await CierreCaja.findAll({
        where: { cajero_id },
        order: [['fecha_apertura', 'DESC']]
      });
      return res.status(200).json(cierres);
    } catch (error) {
      return res.status(500).json({ message: 'Error al obtener cierres por cajero', error: error.message });
    }
  },

  // Obtener cierres de caja por rango de fechas
  getByDateRange: async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.query;
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ message: 'Debe proporcionar fechaInicio y fechaFin' });
      }
      // Sumar un día a la fechaFin para incluir todo el día final
      const fechaFinObj = new Date(fechaFin);
      fechaFinObj.setDate(fechaFinObj.getDate() + 1);
      const fechaFinInclusive = fechaFinObj.toISOString().split('T')[0];
      const cierres = await CierreCaja.findAll({
        where: {
          fecha_apertura: {
            [Op.gte]: fechaInicio,
            [Op.lt]: fechaFinInclusive
          }
        },
        order: [['fecha_apertura', 'DESC']]
      });
      return res.status(200).json(cierres);
    } catch (error) {
      return res.status(500).json({ message: 'Error al obtener cierres por rango de fechas', error: error.message });
    }
  }
};

module.exports = cierreCajaController;
