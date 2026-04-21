const { sequelize } = require("../config/database")
const Categoria = require("./categoria.model")
const Producto = require("./producto.model")
const User = require("./user.model")
const Company = require("./company.model")
const Venta = require("./venta.model")
const DetalleVenta = require("./detalle_venta.model")
const CodigoBarras = require("./codigo_barras.model")
const Role = require("./role.models")
const CierreCaja = require("./cierre_caja.model")
const AuditLog = require("./audit_log.model")
const Oferta = require("./oferta.model")(sequelize, require("sequelize").DataTypes);
const Banner = require("./banner.model")
const Tarjeta = require("./tarjeta.model")

Categoria.hasMany(Producto, {
  foreignKey: "id_categoria",
  as: "productos",
})

Producto.belongsTo(Categoria, {
  foreignKey: "id_categoria",
  as: "categoria",
})

Producto.hasMany(CodigoBarras, {
  foreignKey: "id_producto",
  as: "codigos_barras",
})

CodigoBarras.belongsTo(Producto, {
  foreignKey: "id_producto",
  as: "producto",
})

User.hasMany(Company, {
  foreignKey: "id_user",
  as: "companies",
})

Company.belongsTo(User, {
  foreignKey: "id_user",
  as: "users",
})

Venta.hasMany(DetalleVenta, {
  foreignKey: "venta_id",
  as: "detalles",
})

DetalleVenta.belongsTo(Venta, {
  foreignKey: "venta_id",
  as: "venta",
})

Producto.hasMany(DetalleVenta, {
  foreignKey: "producto_id",
  as: "ventas",
})

DetalleVenta.belongsTo(Producto, {
  foreignKey: "producto_id",
  as: "producto",
})

// Relación entre User y Role
// Un usuario pertenece a un rol
// Un rol puede tener muchos usuarios
User.belongsTo(Role, {
  foreignKey: "id_role",
  as: "roles",
})
Role.hasMany(User, {
  foreignKey: "id_role",
  as: "users",
})

// Agregar la relación entre AuditLog y User
User.hasMany(AuditLog, {
  foreignKey: "usuario_id",
  as: "logs",
})

AuditLog.belongsTo(User, {
  foreignKey: "usuario_id",
  as: "usuario",
})

Producto.hasOne(Oferta, {
  foreignKey: "id_producto",
  as: "oferta"
});
Oferta.belongsTo(Producto, {
  foreignKey: "id_producto",
  as: "producto"
});

// Función para poblar la tabla de roles si está vacía
async function seedRoles() {
  const count = await Role.count();
  if (count === 0) {
    await Role.bulkCreate([
      { id_role: 1, name: 'Gerente' },
      { id_role: 2, name: 'Administrador' },
      { id_role: 3, name: 'Vendedor' },
      { id_role: 4, name: 'No Autorizado' }
    ]);
    console.log("Roles iniciales insertados");
  }
}

const LibroReclamaciones = require("./libro_reclamaciones.model");
const SolicitudImportacion = require("./solicitud_importacion.model");

module.exports = {
  sequelize,
  Categoria,
  Producto,
  User,
  Company,
  Venta,
  DetalleVenta,
  CodigoBarras,
  Role,
  CierreCaja,
  AuditLog,
  Oferta,
  Banner,
  Tarjeta,
  LibroReclamaciones,
  SolicitudImportacion,
  seedRoles,
}
