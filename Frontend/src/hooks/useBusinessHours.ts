"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"

export const useBusinessHours = () => {
  const [isWithinBusinessHours, setIsWithinBusinessHours] = useState(true)
  const [businessHoursMessage, setBusinessHoursMessage] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    const checkBusinessHours = () => {
      const userRole = user?.id_role || 4

      // Rol 4 (No Autorizado) - No puede acceder
      if (userRole === 4) {
        setIsWithinBusinessHours(false)
        setBusinessHoursMessage("Usuario no autorizado")
        return
      }

      // Los gerentes (rol 1) y administradores (rol 2) pueden acceder en cualquier momento
      if (userRole === 1 || userRole === 2) {
        setIsWithinBusinessHours(true)
        setBusinessHoursMessage("Acceso permitido - Rol con privilegios administrativos")
        return
      }

      // Para vendedores (rol 3), verificar horario laboral
      if (userRole === 3) {
        const now = new Date()
        const hours = now.getHours()
        const minutes = now.getMinutes()
        const currentTimeInMinutes = hours * 60 + minutes

        // Horario de trabajo: 8:50 AM a 9:15 PM
        const startTimeInMinutes = 8 * 60 + 50 // 8:50 AM
        const endTimeInMinutes = 21 * 60 + 15 // 9:15 PM

        const isWithinHours = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes

        setIsWithinBusinessHours(isWithinHours)
        setBusinessHoursMessage(
          isWithinHours ? "Dentro del horario laboral" : "Fuera del horario laboral (8:50 AM - 9:15 PM)",
        )
        return
      }

      // Para otros roles no reconocidos
      setIsWithinBusinessHours(false)
      setBusinessHoursMessage("Rol no reconocido")
    }

    // Verificar al cargar el componente
    checkBusinessHours()

    // Verificar cada minuto solo si es vendedor (rol 3)
    if (user?.id_role === 3) {
      const interval = setInterval(checkBusinessHours, 60000)
      return () => clearInterval(interval)
    }
  }, [user?.id_role])

  return { isWithinBusinessHours, businessHoursMessage }
}
