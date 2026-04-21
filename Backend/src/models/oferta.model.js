// src/models/oferta.model.js
module.exports = (sequelize, DataTypes) => {
  const Oferta = sequelize.define('Oferta', {
    id_oferta: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_producto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'productos',
        key: 'id_producto'
      },
      onDelete: 'CASCADE'
    },
    descuento: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 1,
        max: 99
      }
    }
  }, {
    tableName: 'ofertas',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en'
  });

  Oferta.associate = function(models) {
    Oferta.belongsTo(models.Producto, { foreignKey: 'id_producto', as: 'producto' });
  };

  return Oferta;
};
