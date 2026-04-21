'use strict';
const path = require('path');
// Carga .env.test antes de que cualquier módulo llame a dotenv.config()
// override: true fuerza sobreescribir las vars inyectadas por docker-compose env_file
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test'), override: true });

// ecommerce-integration hot-patch: activar feature flag FEATURE_ECOMMERCE en
// tests por default para que las rutas /api/ecommerce/* estén montadas.
// Se setea con OR para permitir override explícito si un test lo necesita.
process.env.FEATURE_ECOMMERCE = 'true';
