'use strict';
/**
 * validateEnv — Fail-fast para variables de entorno críticas.
 * Llamar al inicio de index.js, antes de conectar a la base de datos.
 * En entornos distintos de 'production', la función retorna sin hacer nada.
 */
const validateEnv = () => {
  if (process.env.NODE_ENV !== 'production') return;

  const requeridas = [
    { key: 'FRONTEND_ORIGIN', mensaje: 'FATAL: FRONTEND_ORIGIN debe estar definido en producción (whitelist CORS).' },
    { key: 'JWT_SECRET',      mensaje: 'FATAL: JWT_SECRET debe estar definido en producción.' },
  ];

  for (const { key, mensaje } of requeridas) {
    if (!process.env[key]) {
      console.error(mensaje);
      process.exit(1);
    }
  }
};

module.exports = { validateEnv };
