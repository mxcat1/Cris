// routes/company.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { verificarRolesSinHorario } = require('../middlewares/restricciones.middleware');
const { registrarAuditoria, capturarEstadoOriginal } = require('../middlewares/audit.middleware');
const Company = require('../models/company.model');

const upload = require('../middlewares/upload.middleware');
const { 
  createCompany, 
  updateCompanyPatch, 
  updateCompanyPut, 
  getCompanies, 
  getCompanyByRuc, 
  deleteCompanyByRuc, 
  getCompanyForSales 
} = require('../controllers/company.controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// RUTAS DE LECTURA - Accesibles para Gerentes, Administradores y Vendedores (roles 1, 2, 3)
// Estas rutas son necesarias para obtener información de la empresa para facturación
router.get('/', verificarRolesSinHorario([1, 2, 3]), getCompanies);

// IMPORTANTE: Colocar la ruta específica ANTES de la ruta con parámetros
router.get('/for-sales', verificarRolesSinHorario([1, 2, 3]), getCompanyForSales);
router.get('/:ruc', verificarRolesSinHorario([1, 2, 3]), getCompanyByRuc);

// RUTAS DE ESCRITURA - Solo accesibles para Gerentes (rol 1)
// Configuramos la ruta para aceptar campos de archivos (logo y cert)
router.post(
  '/',
  verificarRolesSinHorario([1]),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cert', maxCount: 1 }
  ]),
  registrarAuditoria('crear', 'empresas'),
  createCompany
);

// Ruta para PUT (actualización completa)
router.put(
  '/:id',
  verificarRolesSinHorario([1]),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cert', maxCount: 1 }
  ]),
  capturarEstadoOriginal(Company),
  registrarAuditoria('actualizar', 'empresas'),
  updateCompanyPut
);

// Ruta para PATCH (actualización parcial)
router.patch(
  '/:id',
  verificarRolesSinHorario([1]),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cert', maxCount: 1 }
  ]),
  capturarEstadoOriginal(Company),
  registrarAuditoria('actualizar', 'empresas'),
  updateCompanyPatch
);

router.delete(
  '/:ruc',
  verificarRolesSinHorario([1]),
  capturarEstadoOriginal(Company),
  registrarAuditoria('eliminar', 'empresas'),
  deleteCompanyByRuc
);

module.exports = router;