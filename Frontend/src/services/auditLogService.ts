import api from "../lib/api"

// Obtener todos los logs de auditoría
export const getAllLogs = async () => {
  const response = await api.get("/audit-logs")
  return response.data
}

// Obtener logs por usuario
export const getLogsByUser = async (userId: string) => {
  const response = await api.get(`/audit-logs/usuario/${userId}`)
  return response.data
}

// Obtener logs por tabla
export const getLogsByTable = async (table: string) => {
  const response = await api.get(`/audit-logs/tabla/${table}`)
  return response.data
}

// Obtener logs por acción
export const getLogsByAction = async (action: string) => {
  const response = await api.get(`/audit-logs/accion/${action}`)
  return response.data
}

// Obtener logs por rango de fechas
export const getLogsByDateRange = async (startDate: string, endDate: string) => {
  const response = await api.get(`/audit-logs/rango-fechas?fechaInicio=${startDate}&fechaFin=${endDate}`)
  return response.data
}
