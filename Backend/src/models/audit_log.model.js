const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id_log: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Permitir nulos para acciones anónimas
      references: {
        model: "users",
        key: "id_user",
      },
    },
    accion: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    tabla: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    registro_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    datos_anteriores: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    datos_nuevos: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ip_cliente: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_hora: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "audit_logs",
    timestamps: false,
  }
);

module.exports = AuditLog;