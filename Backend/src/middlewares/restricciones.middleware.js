// Middleware para verificar si un usuario puede acceder según su rol y el horario
const verificarHorarioLaboral = (req, res, next) => {
  try {
    // Si no hay usuario autenticado, denegar acceso
    if (!req.user) {
      return res.status(401).json({ message: "No autorizado" });
    }

    // Rol 4 (No Autorizado) - No puede acceder a nada
    if (req.user.id_role === 4) {
      return res.status(403).json({ message: "Acceso denegado. Usuario no autorizado" });
    }

    // Los gerentes (rol 1) pueden acceder en cualquier momento
    if (req.user.id_role === 1) {
      return next();
    }

    // Los administradores (rol 2) pueden acceder en cualquier momento
    if (req.user.id_role === 2) {
      return next();
    }

    // Para vendedores (rol 3), verificar horario laboral (8:50 AM - 9:15 PM)
    if (req.user.id_role === 3) {
      const ahora = new Date();
      const hora = ahora.getHours();
      const minutos = ahora.getMinutes();
      
      // Convertir a minutos totales para facilitar la comparación
      const tiempoActualEnMinutos = hora * 60 + minutos;
      const inicioJornadaEnMinutos = 8 * 60 + 50; // 8:50 AM
      const finJornadaEnMinutos = 21 * 60 + 15;   // 9:15 PM
      
      if (tiempoActualEnMinutos >= inicioJornadaEnMinutos && tiempoActualEnMinutos < finJornadaEnMinutos) {
        return next();
      } else {
        return res.status(403).json({
          message: "Acceso denegado. Fuera del horario laboral permitido (8:50 AM - 9:15 PM).",
        });
      }
    }

    // Para cualquier otro rol no reconocido, denegar acceso
    return res.status(403).json({ message: "Rol no autorizado para acceder a esta funcionalidad" });
  } catch (error) {
    console.error("Error al verificar horario laboral:", error);
    return res.status(500).json({ message: "Error al verificar permisos de acceso" });
  }
};

// Middleware específico para verificar roles sin restricción de horario
const verificarRolesSinHorario = (rolesPermitidos) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "No autorizado" });
      }

      if (!rolesPermitidos.includes(req.user.id_role)) {
        return res.status(403).json({ message: "No tienes permisos para acceder a esta funcionalidad" });
      }

      return next();
    } catch (error) {
      console.error("Error al verificar roles:", error);
      return res.status(500).json({ message: "Error al verificar permisos" });
    }
  };
};

module.exports = {
  verificarHorarioLaboral,
  verificarRolesSinHorario,
};