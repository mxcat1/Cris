"use client"

import { useEffect, useState } from "react"
import { useBusinessHours } from "../hooks/useBusinessHours"
import { Badge } from "./ui/badge"
import { Clock, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

export function BusinessHoursIndicator() {
  const { isWithinBusinessHours, businessHoursMessage } = useBusinessHours()
  const [time, setTime] = useState(new Date())

  // Actualizar el tiempo cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Si el usuario es administrador, no mostrar el indicador
  if (businessHoursMessage === "Acceso completo") {
    return null
  }

  const formattedTime = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={isWithinBusinessHours ? "outline" : "destructive"}
            className={`flex items-center gap-1.5 py-1 px-2 transition-all ${
              isWithinBusinessHours
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                : "hover:bg-red-700"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{formattedTime}</span>
            {!isWithinBusinessHours && <AlertCircle className="h-3.5 w-3.5 ml-1 animate-pulse" />}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-sm">
          <p>{businessHoursMessage}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isWithinBusinessHours
              ? "Tienes acceso completo a todas las funciones"
              : "Algunas acciones están restringidas fuera del horario laboral"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
