const User = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { validationResult } = require("express-validator")

exports.register = async (req, res) => {
  // Revisar si hay errores
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    })
  }

  // Extraer email, password, name y rol (opcional)
  const { email, password, name, id_role } = req.body

  try {
    // Revisar que el usuario registrado sea único
    let user = await User.findOne({ where: { email } })

    if (user) {
      return res.status(400).json({ 
        success: false,
        msg: "El usuario ya existe" 
      })
    }

    // Determinar el rol: si se especifica y es válido, usarlo; sino, por defecto rol 3 (Vendedor)
    let assignedRole = 3; // Por defecto Vendedor
    if (id_role && [1, 2, 3, 4].includes(parseInt(id_role))) {
      assignedRole = parseInt(id_role);
    }

    // Hashear el password ANTES de persistir (S5)
    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(password, salt)

    // Crear el nuevo usuario con password ya hasheado
    user = await User.create({
      name,
      email,
      password: hashPassword,
      id_role: assignedRole,
    })

    // Crear y firmar el JWT
    const payload = {
      id: user.id_user,
      id_role: user.id_role,
    }

    // Firmar el JWT con fallback de expiración (S7)
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      },
      (error, token) => {
        if (error) throw error

        // Mensaje de confirmación
        res.json({ 
          success: true,
          msg: "Usuario creado exitosamente",
          token, 
          user: { 
            id: user.id_user, 
            name: user.name, 
            email: user.email,
            id_role: user.id_role
          } 
        })
      },
    )
  } catch (error) {
    console.log(error)
    res.status(500).json({ 
      success: false,
      msg: "Hubo un error en el servidor" 
    })
  }
}

exports.login = async (req, res) => {
  // Extraer email y password
  const { email, password } = req.body

  try {
    // Revisar que sea un usuario registrado
    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(400).json({ msg: "El usuario no existe" })
    }

    // Revisar el password
    const correctPassword = await bcrypt.compare(password, user.password)
    if (!correctPassword) {
      return res.status(400).json({ msg: "Password incorrecto" })
    }

    // Si todo es correcto, crear y firmar el JWT
    const payload = {
      id: user.id_user,
      id_role: user.id_role,
    }

    // Firmar el JWT con fallback de expiración (S7)
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      },
      (error, token) => {
        if (error) throw error

        // Mensaje de confirmación
        res.json({
          success: true,
          token,
          user: {
            id_user: user.id_user,
            name: user.name,
            email: user.email,
            id_role: user.id_role,
          },
        })
      },
    )
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: "Hubo un error" })
  }
}
