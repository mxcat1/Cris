import type React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useBusinessHours } from "../hooks/useBusinessHours"
import { toast } from "sonner"
import { useEffect } from "react"

interface RoleProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: number[]
  requiresBusinessHours?: boolean
  redirectTo?: string
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  requiresBusinessHours = false,
  redirectTo = "/" 
}) => {
  const { user } = useAuth()
  const { isWithinBusinessHours } = useBusinessHours()
  
  // Obtener el rol del usuario (por defecto, asumimos No Autorizado - 4)
  const userRole = user?.id_role || 4
  
  // Verificar si el usuario tiene permisos para acceder a esta ruta
  const hasPermission = allowedRoles.includes(userRole)
  
  // Para rol 3 (vendedores), verificar horario laboral si es requerido
  const needsBusinessHoursCheck = userRole === 3 && requiresBusinessHours
  const canAccessDueToBusinessHours = !needsBusinessHoursCheck || isWithinBusinessHours

  // Mostrar mensaje de error si está fuera del horario laboral
  useEffect(() => {
    if (hasPermission && needsBusinessHoursCheck && !isWithinBusinessHours) {
      toast.error("Acceso denegado. Fuera del horario laboral permitido (8:50 AM - 9:15 PM)")
    }
  }, [hasPermission, needsBusinessHoursCheck, isWithinBusinessHours])
  
  if (!hasPermission) {
    // Redirigir al dashboard si no tiene permisos
    return <Navigate to={redirectTo} replace />
  }

  if (!canAccessDueToBusinessHours) {
    // Redirigir al dashboard si está fuera del horario laboral
    return <Navigate to={redirectTo} replace />
  }
  
  return <>{children}</>
}

export default RoleProtectedRoute
