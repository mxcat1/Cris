// Middleware para verificar que el usuario sea gerente o administrador
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware para verificar que el usuario tenga rol de gerente (1) o administrador (2)
const requireAdminAccess = (req, res, next) => {
    const token = req.header("Authorization");
    
    if (!token) {
        return res.status(401).json({
            success: false,
            msg: "Acceso denegado. Token no encontrado"
        });
    }

    try {
        // Extraer el token si viene como "Bearer [token]"
        const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
        const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
        
        // Verificar que el rol sea gerente (1) o administrador (2)
        if (decoded.id_role !== 1 && decoded.id_role !== 2) {
            return res.status(403).json({
                success: false,
                msg: "Acceso denegado. Solo gerentes y administradores pueden registrar usuarios"
            });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            msg: "Token no válido"
        });
    }
};

module.exports = {
    requireAdminAccess
};
