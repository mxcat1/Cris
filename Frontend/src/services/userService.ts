import api from "../lib/api"

export interface User {
  id_user: number
  name: string
  email: string
  id_role: number
}

export interface UserFormData {
  name: string
  email: string
  password: string
  id_role: number
}

export const fetchUsers = async (): Promise<User[]> => {
  const response = await api.get("/users")
  return response.data
}

export const fetchUserById = async (id: number): Promise<User> => {
  // Validar que el ID sea un número válido
  if (id === undefined || id === null || isNaN(Number(id))) {
    throw new Error("ID de usuario no válido")
  }

  const response = await api.get(`/users/${id}`)
  return response.data
}

export const fetchUserBasicInfo = async (id: number): Promise<{id_user: number, name: string}> => {
  // Validar que el ID sea un número válido
  if (id === undefined || id === null || isNaN(Number(id))) {
    throw new Error("ID de usuario no válido")
  }

  const response = await api.get(`/users/${id}/basic`)
  return response.data
}

export const createUser = async (userData: UserFormData): Promise<User> => {
  const response = await api.post("/users", userData)
  return response.data
}

export const updateUser = async (id: number, userData: Partial<UserFormData>): Promise<User> => {
  // Validar que el ID sea un número válido
  if (id === undefined || id === null || isNaN(Number(id))) {
    throw new Error("ID de usuario no válido")
  }

  // Si la contraseña está vacía o undefined, la eliminamos para no enviarla
  const updateData = { ...userData }
  if (updateData.password === "" || updateData.password === undefined) {
    delete updateData.password
  }

  const response = await api.put(`/users/${id}`, updateData)
  return response.data
}

export const updateUserWithPayload = async ({ id, data }: { id: number; data: Partial<UserFormData> }): Promise<User> => {
  return updateUser(id, data)
}

export const deleteUser = async (id: number): Promise<void> => {
  // Validar que el ID sea un número válido
  if (id === undefined || id === null || isNaN(Number(id))) {
    throw new Error("ID de usuario no válido")
  }

  await api.delete(`/users/${id}`)
}
