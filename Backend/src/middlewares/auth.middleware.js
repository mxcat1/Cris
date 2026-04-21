// En tu archivo auth.middleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({
        msg: "Acceso denegado, token no encontrado"
    });

    try {
        // Extraer el token si viene como "Bearer [token]"
        const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
        const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch(error) {
        res.status(401).json({  // Corregido de status a status(401)
            msg: "Token no válido"
        });
    }
};