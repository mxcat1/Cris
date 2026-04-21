const { AuditLog, User } = require("../models")
const { Op } = require("sequelize")

// Obtener todos los logs de auditoría
exports.getAll = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      include: [
        {
          model: User,
          as: "usuario",
          attributes: ["name", "email"],
        },
      ],
      order: [["fecha_hora", "DESC"]],
    })

    res.json(logs)
  } catch (error) {
    console.error("Error al obtener logs de auditoría:", error)
    res.status(500).json({ message: "Error al obtener logs de auditoría" })
  }
}

// Obtener logs por usuario
exports.getByUser = async (req, res) => {
  const { usuario_id } = req.params

  try {
    const logs = await AuditLog.findAll({
      where: { usuario_id },
      include: [
        {
          model: User,
          as: "usuario",
          attributes: ["name", "email"],
        },
      ],
      order: [["fecha_hora", "DESC"]],
    })

    res.json(logs)
  } catch (error) {
    console.error("Error al obtener logs por usuario:", error)
    res.status(500).json({ message: "Error al obtener logs por usuario" })
  }
}

// Obtener logs por tabla
exports.getByTable = async (req, res) => {
  const { tabla } = req.params

  try {
    const logs = await AuditLog.findAll({
      where: { tabla },
      include: [
        {
          model: User,
          as: "usuario",
          attributes: ["name", "email"],
        },
      ],
      order: [["fecha_hora", "DESC"]],
    })

    res.json(logs)
  } catch (error) {
    console.error("Error al obtener logs por tabla:", error)
    res.status(500).json({ message: "Error al obtener logs por tabla" })
  }
}

// Obtener logs por acción
exports.getByAction = async (req, res) => {
  const { accion } = req.params

  try {
    const logs = await AuditLog.findAll({
      where: { accion },
      include: [
        {
          model: User,
          as: "usuario",
          attributes: ["name", "email"],
        },
      ],
      order: [["fecha_hora", "DESC"]],
    })

    res.json(logs)
  } catch (error) {
    console.error("Error al obtener logs por acción:", error)
    res.status(500).json({ message: "Error al obtener logs por acción" })
  }
}

// Obtener logs por rango de fechas
exports.getByDateRange = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query

  try {
    // Validar que se proporcionen ambas fechas
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ message: "Se requieren fechas de inicio y fin" })
    }

    // Crear fechas con hora inicial y final para abarcar todo el día
    const startDate = new Date(`${fechaInicio}T00:00:00.000Z`)
    const endDate = new Date(`${fechaFin}T23:59:59.999Z`)

    const logs = await AuditLog.findAll({
      where: {
        fecha_hora: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: User,
          as: "usuario",
          attributes: ["name", "email"],
        },
      ],
      order: [["fecha_hora", "DESC"]],
    })

    res.json(logs)
  } catch (error) {
    console.error("Error al obtener logs por rango de fechas:", error)
    res.status(500).json({ message: "Error al obtener logs por rango de fechas" })
  }
}

// Eliminar logs de auditoría
exports.deleteLogs = async (req, res) => {
  const { ids, deleteAll, beforeDate } = req.body
  
  try {
    let deletedCount = 0

    if (deleteAll) {
      // Eliminar todos los logs
      const result = await AuditLog.destroy({
        where: {},
        truncate: false
      })
      deletedCount = result
    } else if (beforeDate) {
      // Eliminar logs anteriores a una fecha específica
      const cutoffDate = new Date(`${beforeDate}T23:59:59.999Z`)
      const result = await AuditLog.destroy({
        where: {
          fecha_hora: {
            [Op.lt]: cutoffDate
          }
        }
      })
      deletedCount = result
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      // Eliminar logs específicos por ID
      const result = await AuditLog.destroy({
        where: {
          id_log: {
            [Op.in]: ids
          }
        }
      })
      deletedCount = result
    } else {
      return res.status(400).json({ 
        message: "Debe proporcionar IDs específicos, una fecha límite o indicar eliminación completa" 
      })
    }

    if (deletedCount === 0) {
      return res.status(404).json({ 
        message: "No se encontraron logs para eliminar con los criterios especificados" 
      })
    }

    res.json({ 
      message: `Se eliminaron ${deletedCount} logs de auditoría exitosamente`,
      deletedCount
    })
  } catch (error) {
    console.error("Error al eliminar logs de auditoría:", error)
    res.status(500).json({ message: "Error al eliminar logs de auditoría" })
  }
}

// Obtener estadísticas de logs para gestión
exports.getLogStats = async (req, res) => {
  try {
    const totalLogs = await AuditLog.count()
    
    // Contar logs por mes en los últimos 6 meses
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const monthlyStats = await AuditLog.findAll({
      where: {
        fecha_hora: {
          [Op.gte]: sixMonthsAgo
        }
      },
      attributes: [
        [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('fecha_hora'), '%Y-%m'), 'month'],
        [require('sequelize').fn('COUNT', '*'), 'count']
      ],
      group: [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('fecha_hora'), '%Y-%m')],
      order: [[require('sequelize').fn('DATE_FORMAT', require('sequelize').col('fecha_hora'), '%Y-%m'), 'DESC']]
    })
    
    // Logs más antiguos
    const oldestLog = await AuditLog.findOne({
      order: [['fecha_hora', 'ASC']],
      attributes: ['fecha_hora']
    })
    
    // Logs de hace más de 30 días
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const oldLogsCount = await AuditLog.count({
      where: {
        fecha_hora: {
          [Op.lt]: thirtyDaysAgo
        }
      }
    })

    res.json({
      totalLogs,
      monthlyStats,
      oldestLog: oldestLog ? oldestLog.fecha_hora : null,
      oldLogsCount,
      cutoffDate: thirtyDaysAgo
    })
  } catch (error) {
    console.error("Error al obtener estadísticas de logs:", error)
    res.status(500).json({ message: "Error al obtener estadísticas de logs" })
  }
}
