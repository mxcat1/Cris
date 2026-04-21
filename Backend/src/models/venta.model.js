const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const moment = require('moment-timezone');

const Venta = sequelize.define('Venta', {
  venta_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  total_con_igv: { 
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  id_cajero: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  metodo_pago: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Nuevos campos para facturación
  tipo_documento: {
    type: DataTypes.ENUM('1', '3'),  // 1 = Factura, 3 = Boleta
    allowNull: true,  // Puede ser nulo si aún no se genera comprobante
    comment: '1=Factura, 3=Boleta'
  },
  serie: {
    type: DataTypes.STRING(4),
    allowNull: true,  // Puede ser nulo si aún no se genera comprobante
    comment: 'F001 para facturas, B001 para boletas'
  },
  correlativo: {
    type: DataTypes.INTEGER,
    allowNull: true,  // Puede ser nulo si aún no se genera comprobante
  },
  // Datos del cliente
  cliente_tipo_documento: {
    type: DataTypes.ENUM('1', '6'),  // 1 = DNI, 6 = RUC
    allowNull: true,  // Puede ser nulo si aún no se genera comprobante
    comment: '1=DNI, 6=RUC'
  },
  cliente_numero_documento: {
    type: DataTypes.STRING(15),
    allowNull: true  // Puede ser nulo si aún no se genera comprobante
  },
  cliente_nombre: {
    type: DataTypes.STRING(100),
    allowNull: true  // Puede ser nulo si aún no se genera comprobante
  },
  comprobante_emitido: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  // NUEVOS CAMPOS PARA DESCUENTO EN VENTA
  es_descuento: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si la venta tiene descuento aplicado',
  },
  descuento: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Porcentaje de descuento aplicado a la venta',
  }
}, {
  tableName: 'ventas',
  timestamps: true,
  createdAt: false,
  updatedAt: false
});

module.exports = Venta;