// controllers/company.controller.js
const { validationResult } = require('express-validator');
const Company = require('../models/company.model');
const { Op } = require('sequelize');

const getCompanies = async (req, res) => {
    try {
        // Obtener todas las empresas que pertenecen al usuario autenticado
        const companies = await Company.findAll({
            where: { id_user: req.user.id }
        });
        return res.status(200).json(companies);
    } catch (error) {
        console.error("Error al obtener las empresas:", error);
        return res.status(500).json({ error: "Error en el servidor" });
    }
};


const getCompanyByRuc = async (req, res) => {
    try {
        // Se espera que el RUC se envíe como parámetro en la URL
        const companyRuc = req.params.ruc;
        const company = await Company.findOne({
            where: {
                ruc: companyRuc,
                id_user: req.user.id
            }
        });

        if (!company) {
            return res.status(404).json({ error: "Compañía no encontrada" });
        }

        return res.status(200).json({
            message: "Compañía encontrada",
            data: company
        });
    } catch (error) {
        console.error("Error al obtener la empresa:", error);
        return res.status(500).json({ error: "Error en el servidor" });
    }
};

const getCompanyForSales = async (req, res) => {
    try {
        // Buscar la primera empresa activa (puedes ajustar este criterio)
        const company = await Company.findOne();
        
        if (!company) {
            return res.status(200).json({ status: true, data: null });
        }

        // Devolver solo los datos necesarios para SUNAT (omitir información sensible)
        return res.status(200).json({
            message: "Información de empresa para ventas",
            data: {
                id_company: company.id_company,
                razon_social: company.razon_social,
                ruc: company.ruc,
                direccion: company.direccion,
                logo_url: company.logo_url,
                production: company.production
                // No incluir: sol_user, sol_pass, cert_path, client_id, client_secret
            }
        });
    } catch (error) {
        console.error("Error al obtener la empresa para ventas:", error);
        return res.status(500).json({ error: "Error en el servidor" });
    }
};

const createCompany = async (req, res) => {
    try {
        // Validar la solicitud con express-validator (si lo estás usando)
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const validateCompany = await Company.findOne({
            where: { id_user: req.user.id }
        });
        if (validateCompany) {
            return res.status(400).json({ error: "El usuario ya tiene una empresa registrada" });
        }

        // Extraer datos del body
        const {
            razon_social,
            ruc,
            direccion,
            sol_user,
            sol_pass,
            client_id,
            client_secret,
            production,
        } = req.body;

        // Validar el formato del ruc
        const rucRegex = /^(10|20)\d{9}$/;
        if (!rucRegex.test(ruc)) {
            return res.status(422).json({ error: 'El campo ruc no tiene el formato correcto' });
        }

        // Verificar que no exista ya una empresa con el mismo RUC para el usuario
        const existingCompany = await Company.findOne({
            where: { ruc, id_user: req.user.id }
        });
        if (existingCompany) {
            return res.status(400).json({ error: 'La compañia ya existe' });
        }

        // Procesar archivos subidos con Multer
        let logo_url = null;
        if (req.files && req.files.logo && req.files.logo.length > 0) {
            // El archivo subido se encuentra en req.files.logo[0]
            logo_url = req.files.logo[0].path;
        }

        if (!req.files || !req.files.cert || req.files.cert.length === 0) {
            return res.status(422).json({ error: 'El certificado es obligatorio' });
        }
        const cert_path = req.files.cert[0].path;

        // Armar el objeto con los datos para crear la empresa
        const companyData = {
            razon_social,
            ruc,
            direccion,
            sol_user,
            sol_pass,
            client_id: client_id || null,
            client_secret: client_secret || null,
            production: production || false,
            logo_url,
            cert_path,
            id_user: req.user.id  // El usuario autenticado, asignado por el middleware JWT
        };

        // Crear la empresa en la base de datos
        const company = await Company.create(companyData);

        // Enviar la respuesta
        return res.status(201).json({
            message: 'Empresa creada correctamente',
            company
        });
    } catch (error) {
        console.error('Error al crear la empresa:', error);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

const updateCompanyPut = async (req, res) => {
    try {
        const companyId = req.params.id;

        // Verificar que la empresa existe y pertenece al usuario autenticado
        let company = await Company.findOne({ where: { id_company: companyId, id_user: req.user.id } });
        if (!company) {
            return res.status(404).json({ error: "Empresa no encontrada" });
        }

        // Validar errores de express-validator, si se usan
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        // Extraer todos los campos (para PUT se espera que vengan todos)
        const {
            razon_social,
            ruc,
            direccion,
            sol_user,
            sol_pass,
            client_id,
            client_secret,
            production
        } = req.body;

        // Validar que el RUC tenga el formato correcto si se envía
        const rucRegex = /^(10|20)\d{9}$/;
        if (!rucRegex.test(ruc)) {
            return res.status(422).json({ error: 'El campo ruc no tiene el formato correcto' });
        }

        // Validar unicidad del RUC para el usuario actual, excluyendo la empresa actual
        const existingCompany = await Company.findOne({
            where: {
                ruc,
                id_user: req.user.id,
                id_company: { [Op.ne]: companyId }
            }
        });
        if (existingCompany) {
            return res.status(400).json({ error: 'La compañia ya existe' });
        }

        // Procesar archivos: Si se envía un nuevo logo o certificado, se actualizan.
        let logo_url = company.logo_url;
        if (req.files && req.files.logo && req.files.logo.length > 0) {
            logo_url = req.files.logo[0].path;
        }

        let cert_path = company.cert_path;
        if (req.files && req.files.cert && req.files.cert.length > 0) {
            cert_path = req.files.cert[0].path;
        }

        // Armar el objeto con los datos actualizados
        const updatedData = {
            razon_social,
            ruc,
            direccion,
            sol_user,
            sol_pass,
            client_id: client_id || null,
            client_secret: client_secret || null,
            production: production !== undefined ? production : false,
            logo_url,
            cert_path
        };

        // Actualizar la empresa en la base de datos
        await company.update(updatedData);

        return res.status(200).json({
            message: "Empresa actualizada correctamente",
            company
        });
    } catch (error) {
        console.error("Error al actualizar la empresa (PUT):", error);
        return res.status(500).json({ error: "Error en el servidor" });
    }
};

const updateCompanyPatch = async (req, res) => {
    try {
        const companyId = req.params.id;

        // Verificar que la empresa existe y pertenece al usuario autenticado
        let company = await Company.findOne({ where: { id_company: companyId, id_user: req.user.id } });
        if (!company) {
            return res.status(404).json({ error: "Empresa no encontrada" });
        }

        // Validar errores de express-validator, si se usan
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        // Extraer los campos enviados (si no se envía alguno, se mantiene el valor actual)
        const {
            razon_social,
            ruc,
            direccion,
            sol_user,
            sol_pass,
            client_id,
            client_secret,
            production
        } = req.body;

        // Si se envía RUC, validar formato y unicidad
        if (ruc) {
            const rucRegex = /^(10|20)\d{9}$/;
            if (!rucRegex.test(ruc)) {
                return res.status(422).json({ error: 'El campo ruc no tiene el formato correcto' });
            }
            const existingCompany = await Company.findOne({
                where: {
                    ruc,
                    id_user: req.user.id,
                    id_company: { [Op.ne]: companyId }
                }
            });
            if (existingCompany) {
                return res.status(400).json({ error: 'La compañia ya existe' });
            }
        }

        // Procesar archivos: Si se envía un nuevo logo o certificado, se actualizan.
        let logo_url = company.logo_url;
        if (req.files && req.files.logo && req.files.logo.length > 0) {
            logo_url = req.files.logo[0].path;
        }

        let cert_path = company.cert_path;
        if (req.files && req.files.cert && req.files.cert.length > 0) {
            cert_path = req.files.cert[0].path;
        }

        // Armar el objeto con los datos actualizados (solo actualizar los que se envían)
        const updatedData = {
            razon_social: razon_social !== undefined ? razon_social : company.razon_social,
            ruc: ruc !== undefined ? ruc : company.ruc,
            direccion: direccion !== undefined ? direccion : company.direccion,
            sol_user: sol_user !== undefined ? sol_user : company.sol_user,
            sol_pass: sol_pass !== undefined ? sol_pass : company.sol_pass,
            client_id: client_id !== undefined ? client_id : company.client_id,
            client_secret: client_secret !== undefined ? client_secret : company.client_secret,
            production: production !== undefined ? production : company.production,
            logo_url,
            cert_path
        };

        // Actualizar la empresa en la base de datos
        await company.update(updatedData);

        return res.status(200).json({
            message: "Empresa actualizada correctamente",
            company
        });
    } catch (error) {
        console.error("Error al actualizar la empresa (PATCH):", error);
        return res.status(500).json({ error: "Error en el servidor" });
    }
};

const deleteCompanyByRuc = async (req, res) => {
    try {
        // Se espera que el RUC se pase como parámetro en la URL
        const companyRuc = req.params.ruc;

        // Buscar la empresa por RUC y que pertenezca al usuario autenticado
        const company = await Company.findOne({
            where: {
                ruc: companyRuc,
                id_user: req.user.id
            }
        });

        if (!company) {
            return res.status(404).json({ error: "Empresa no encontrada" });
        }

        // Eliminar la empresa
        await company.destroy();

        return res.status(200).json({ message: "Empresa eliminada correctamente" });
    } catch (error) {
        console.error("Error al eliminar la empresa:", error);
        return res.status(500).json({ error: "Error en el servidor" });
    }
};



module.exports = { createCompany, updateCompanyPatch, updateCompanyPut, getCompanies, getCompanyByRuc, deleteCompanyByRuc, getCompanyForSales };
