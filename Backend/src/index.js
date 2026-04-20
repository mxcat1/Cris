require('dotenv').config(); // Cargar .env antes de validar variables

const { validateEnv } = require('./config/validateEnv');
validateEnv(); // Abortar arranque si faltan variables críticas en producción

const {app, server} = require("./app");
const { sequelize, connectDB } = require('./config/database');
const { seedRoles } = require('./models');

const port = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  await seedRoles();
  server.listen(port, () => console.log('Servidor escuchando en: ', port));
};

startServer();