// Seed idempotente de usuario administrador.
// Uso: docker compose exec backend node src/scripts/seed-admin.js
require("dotenv").config();

const bcrypt = require("bcryptjs");
const { sequelize, connectDB } = require("../config/database");
const { User, Role, seedRoles } = require("../models");

const ADMIN_EMAIL = "admin@cris.local";
const ADMIN_PASSWORD = "xry25rjpMYykaf1K";
const ADMIN_ROLE_NAME = "Gerente";
const SALT_ROUNDS = 10; // Mismo valor que auth.controller.js (bcrypt.genSalt(10))

(async () => {
  try {
    await connectDB();

    // Asegurar que los roles base existan
    if (typeof seedRoles === "function") {
      await seedRoles();
    }

    // El modelo Role usa `name` (no `nombre`) y `id_role` autoincrement.
    // Buscamos por nombre, no por id, por si el autoincrement no respetó los ids del bulkCreate.
    let role = await Role.findOne({ where: { name: ADMIN_ROLE_NAME } });
    if (!role) {
      role = await Role.create({ id_role: 1, name: ADMIN_ROLE_NAME });
      console.log(`Rol '${ADMIN_ROLE_NAME}' no existía. Creado con id_role=${role.id_role}.`);
    }

    // Verificar si el admin ya existe
    const existing = await User.findOne({ where: { email: ADMIN_EMAIL } });
    if (existing) {
      console.log("Admin ya existe, no se modifica");
      process.exit(0);
    }

    // Hashear password con el mismo formato que el register del controller
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // El modelo User solo tiene: id_user, name, email, password, id_role.
    // No existen campos estado/activo/apellidos/username, así que no se pueden setear.
    await User.create({
      name: "Administrador",
      email: ADMIN_EMAIL,
      password: hashed,
      id_role: role.id_role,
    });

    console.log(`✓ Admin creado: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} (rol: ${ADMIN_ROLE_NAME})`);
    process.exit(0);
  } catch (error) {
    console.error("Error al crear el admin:", error);
    process.exit(1);
  } finally {
    try {
      await sequelize.close();
    } catch (_) {
      // noop
    }
  }
})();
