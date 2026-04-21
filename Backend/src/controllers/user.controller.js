const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

/**
 * Función auxiliar para verificar si el usuario tiene alguno de los roles permitidos.
 * Devuelve true si tiene acceso o envía la respuesta de "acceso denegado" y devuelve false.
 */
const checkRole = (allowedRoles, req, res) => {
  if (!req.user || !allowedRoles.includes(req.user.id_role)) {
    res.status(403).json({ message: "Acceso denegado" });
    return false;
  }
  return true;
};

/**
 * GET /users
 * Gerentes (rol 1), Administradores (rol 2) y Vendedores (rol 3) pueden obtener la lista de usuarios (solo lectura).
 */
const getAllUsers = async (req, res) => {
  // La verificación de roles ya se hace en el middleware de rutas
  // Esta función ya no necesita verificación adicional ya que el middleware se encarga
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] } // Excluir la contraseña de la respuesta
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

/**
 * GET /users/:id
 * Gerentes (rol 1), Administradores (rol 2) y Vendedores (rol 3) pueden obtener datos de usuarios.
 * Los vendedores solo pueden ver sus propios datos.
 */
const getUserById = async (req, res) => {
  const { id } = req.params;
  // Permite acceso si es gerente (rol 1), administrador (rol 2) o si el usuario solicita sus propios datos
  if (!req.user || (![1, 2].includes(req.user.id_role) && parseInt(id) !== req.user.id_user)) {
    return res.status(403).json({ message: "Acceso denegado" });
  }
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    
    // Retornar el usuario sin la contraseña
    const { password: _, ...userWithoutPassword } = user.toJSON();
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return res.status(500).json({ error: "Error al obtener usuario" });
  }
};

/**
 * POST /users
 * Solo administradores pueden crear nuevos usuarios.
 */
const createUser = async (req, res) => {
  if (!checkRole([1], req, res)) return;
  try {
    const { name, email, password, id_role } = req.body;
    
    // Validar que se proporcionen todos los campos requeridos
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son requeridos" });
    }
    
    // Encriptar la contraseña antes de crear el usuario
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      id_role: id_role || 3 // Si no se envía rol, asignar rol de vendedor (3) por defecto
    });
    
    // Retornar el usuario sin la contraseña
    const { password: _, ...userWithoutPassword } = newUser.toJSON();
    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return res.status(500).json({ error: "Error al crear usuario" });
  }
};

/**
 * PUT /users/:id
 * Actualización completa de un usuario.
 * Permite que un administrador actualice cualquier usuario o que el propio usuario actualice sus datos.
 */
const updateUser = async (req, res) => {
    const { id } = req.params;
    if (!req.user || (![1].includes(req.user.id_role) && parseInt(id) !== req.user.id_user)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }
    try {
      const { name, email, password, id_role } = req.body;
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
  
      user.name = name;
      user.email = email;
      // Encriptar la contraseña solo si se envía una nueva contraseña
      if (password) {
        user.password = await bcrypt.hash(password, saltRounds);
      }
      user.id_role = id_role;
      await user.save();
      
      // Retornar el usuario sin la contraseña
      const { password: _, ...userWithoutPassword } = user.toJSON();
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      return res.status(500).json({ error: "Error al actualizar usuario" });
    }
  };

/**
 * PATCH /users/:id
 * Actualización parcial de un usuario.
 * Permite que un administrador actualice cualquier usuario o que el propio usuario actualice sus datos.
 */
const patchUser = async (req, res) => {
    const { id } = req.params;
    if (!req.user || (![1].includes(req.user.id_role) && parseInt(id) !== req.user.id_user)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }
    try {
      // Si se envía una contraseña, encriptarla antes de actualizar
      const updates = { ...req.body };
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, saltRounds);
      }
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
  
      await user.update(updates);
      
      // Retornar el usuario sin la contraseña
      const { password: _, ...userWithoutPassword } = user.toJSON();
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error al actualizar parcialmente el usuario:", error);
      return res.status(500).json({ error: "Error al actualizar parcialmente el usuario" });
    }
  };

/**
 * DELETE /users/:id
 * Solo administradores pueden eliminar usuarios.
 */
const deleteUser = async (req, res) => {
  if (!checkRole([1], req, res)) return;
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    await user.destroy();
    return res.status(200).json({ message: "Usuario eliminado" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return res.status(500).json({ error: "Error al eliminar usuario" });
  }
};

/**
 * GET /users/:id/basic
 * Permite obtener información básica de un usuario (solo nombre) para vendedores y administradores
 */
const getUserBasicInfo = async (req, res) => {
  const { id } = req.params;
  
  // Permite acceso a gerentes (rol 1), administradores (rol 2) y vendedores (rol 3)
  // La verificación de roles ya se hace en el middleware de rutas, pero mantenemos esta por seguridad
  if (!req.user || ![1, 2, 3].includes(req.user.id_role)) {
    return res.status(403).json({ message: "Acceso denegado" });
  }
  
  try {
    const user = await User.findByPk(id, {
      attributes: ['id_user', 'name'] // Solo devolvemos ID y nombre
    });
    
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error al obtener información básica del usuario:", error);
    return res.status(500).json({ error: "Error al obtener información básica del usuario" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  patchUser,
  deleteUser,
  getUserBasicInfo
};
