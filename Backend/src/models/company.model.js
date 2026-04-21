const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const moment = require('moment-timezone');


const Company = sequelize.define('Company', {
    id_company: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    razon_social: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    ruc: {
        type: DataTypes.STRING(11),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },
    direccion: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    logo_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    sol_user: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    sol_pass: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    cert_path: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    client_id: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    client_secret: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    production: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    id_user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id_user'
        },
        onDelete: 'CASCADE',
    }
}, {
    tableName: 'companies',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: 'actualizado_en'
}
)




// En el método toJSON de los modelos
Company.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  if (values.creado_en) {
    values.creado_en = moment(values.creado_en)
      .tz('America/Lima')
      .format('YYYY-MM-DD HH:mm:ss');
  }
  if (values.actualizado_en) {
    values.actualizado_en = moment(values.actualizado_en)
      .tz('America/Lima')
      .format('YYYY-MM-DD HH:mm:ss');
  }
  return values;
};

module.exports = Company;