const { AuditLog } = require("../models")
const { User } = require("../models")
const jwt = require("jsonwebtoken")

// Modify the capturarEstadoOriginal function to be more flexible with ID parameters
const capturarEstadoOriginal = (Model, idParam = "id") => {
  return async (req, res, next) => {
    try {
      // Only capture original state for updates and deletions
      if (req.method === "PUT" || req.method === "PATCH" || req.method === "DELETE") {
        // Check for ID in different possible parameters
        const id = req.params[idParam] || req.params.id || req.params.codigo || req.body.id

        if (id) {
          // Determine the correct field to search by
          let whereClause = {}

          // Handle special cases for different models
          if (Model.name === "CodigoBarras" && req.params.codigo) {
            whereClause = { codigo_barras: req.params.codigo }
          } else {
            // Get the primary key field name from the model
            const primaryKeyField = Model.primaryKeyField || Model.primaryKeyAttribute || "id"
            whereClause[primaryKeyField] = id
          }

          // Buscar el registro actual
          const registro = await Model.findOne({ where: whereClause })
          if (registro) {
            // Guardar el estado original en la solicitud para usarlo después
            req.estadoOriginal = JSON.stringify(registro.toJSON())
            // Also save the record ID for logging
            req.registro_id = registro[Model.primaryKeyField || Model.primaryKeyAttribute || "id"]
          }
        }
      }
    } catch (error) {
      console.error("Error al capturar estado original:", error)
      // No interrumpir el flujo si falla la captura
    }
    next()
  }
}

// Modify the registrarAuditoria function to handle the registro_id better
const registrarAuditoria = (accion, tabla) => {
  return async (req, res, next) => {
    // Guardar la respuesta original para capturarla después
    const originalSend = res.send

    // Sobrescribir el método send para capturar la respuesta
    res.send = function (body) {
      try {
        // Obtener información del usuario desde el token JWT
        let usuario_id = null
        if (req.user && req.user.id) {
          usuario_id = req.user.id
        }

        // Obtener información de la solicitud
        const ip_cliente = req.ip || req.connection.remoteAddress
        const user_agent = req.headers["user-agent"]

        // Determinar el ID del registro afectado
        let registro_id = null
        if (req.registro_id) {
          registro_id = req.registro_id
        } else if (req.params.id) {
          registro_id = req.params.id
        } else if (req.params.codigo) {
          registro_id = req.params.codigo
        } else if (req.body.id) {
          registro_id = req.body.id
        }

        // For login actions, use the user ID as the registro_id if available
        if (accion === "login" && body) {
          try {
            const responseBody = JSON.parse(body)
            if (responseBody && responseBody.user && responseBody.user.id_user) {
              registro_id = responseBody.user.id_user
            }
          } catch (e) {
            console.error("Error parsing response body:", e)
          }
        }

        // Usar el estado original capturado por capturarEstadoOriginal
        const datos_anteriores = req.estadoOriginal || null

        // Crear el registro de auditoría
        AuditLog.create({
          usuario_id,
          accion,
          tabla,
          registro_id,
          datos_anteriores,
          datos_nuevos: JSON.stringify({
            ...req.body,
            timestamp: new Date(),
          }),
          ip_cliente,
          user_agent,
          fecha_hora: new Date(),
        }).catch((error) => {
          console.error("Error al registrar auditoría:", error)
        })
      } catch (error) {
        console.error("Error al registrar auditoría:", error)
      }

      // Restaurar el método original
      res.send = originalSend

      // Ejecutar el método original con los argumentos
      return originalSend.call(this, body)
    }

    // Continuar con la ejecución de la solicitud
    next()
  }
}

// Improve the login audit logging
const registrarLogin = async (req, res, next) => {
  // Guardar la respuesta original para capturarla después
  const originalJson = res.json

  // Sobrescribir el método json para capturar la respuesta
  res.json = async function (body) {
    try {
      // Si la respuesta es exitosa (tiene token)
      if (body && body.token) {
        // Decodificar el token para obtener el ID del usuario
        const decodedToken = jwt.verify(body.token, process.env.JWT_SECRET)
        const usuario_id = decodedToken.id

        // Obtener información de la solicitud
        const ip_cliente = req.ip || req.connection.remoteAddress
        const user_agent = req.headers["user-agent"]

        // Crear el registro de auditoría
        await AuditLog.create({
          usuario_id,
          accion: "login",
          tabla: "auth",
          registro_id: usuario_id, // Use the user ID as the registro_id
          datos_anteriores: null,
          datos_nuevos: JSON.stringify({
            email: req.body.email,
            timestamp: new Date(),
          }),
          ip_cliente,
          user_agent,
          fecha_hora: new Date(),
        })
      }
    } catch (error) {
      console.error("Error al registrar auditoría de login:", error)
      // No interrumpir el flujo de la aplicación si falla el registro de auditoría
    }

    // Restaurar el método original y ejecutarlo
    res.json = originalJson
    return originalJson.call(this, body)
  }

  // Continuar con la ejecución de la solicitud
  next()
}

module.exports = {
  registrarAuditoria,
  registrarLogin,
  capturarEstadoOriginal,
}
