"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { toast } from "sonner"
import api from "../lib/api"

// Modificar la interfaz User para incluir el rol
interface User {
  id: number
  name: string
  email: string
  id_role?: number | null
  role?: { name: string } | string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  checkAuth: () => false,
})
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"))
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  const checkAuth = () => {
    return isAuthenticated
  }

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token")

      if (storedToken) {
        try {
          // No need to set axios headers here, the interceptor will handle it

          // Get user data from localStorage
          const storedUser = localStorage.getItem("user")
          if (storedUser) {
            setUser(JSON.parse(storedUser))
            setIsAuthenticated(true)
          }
        } catch (error) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
        }
      }

      // Check if session expired flag is set
      const sessionExpired = localStorage.getItem("session_expired")
      if (sessionExpired) {
        toast.error("Tu sesión ha expirado. Por favor inicia sesión nuevamente.")
        localStorage.removeItem("session_expired")
      }

      setLoading(false)
    }

    initAuth()
  }, [])

  // Modificar la función login para manejar el error de restricción horaria
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post(`/auth/login`, {
        email,
        password,
      })

      const { token, user } = response.data

      // Decodificar el token JWT para obtener la información del usuario
      // El token contiene el id y el id_role según el controlador de autenticación
      const tokenParts = token.split(".")
      let decodedToken = {}

      if (tokenParts.length === 3) {
        try {
          const payload = tokenParts[1]
          const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join(""),
          )
          decodedToken = JSON.parse(jsonPayload)
        } catch (e) {
          console.error("Error al decodificar el token:", e)
        }
      }

      // Extraer el id_role del token decodificado
      const id_role = (decodedToken as any).id_role

      if (id_role === 4) {
        throw new Error("No tienes autorización para acceder al sistema")
      }

      // Construir el objeto de usuario con los datos correctos
      const userData = {
        id: (decodedToken as any).id, // Obtener el ID del token
        name: user.name,
        email: user.email || user.emial, // Corregir posible error en el backend
        id_role: id_role, // Usar el id_role del token
      }

      // Save to localStorage
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(userData))

      // Update state
      setToken(token)
      setUser(userData)
      setIsAuthenticated(true)
    } catch (error: any) {
      // Verificar si es un error de restricción horaria
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message === "Acceso denegado fuera del horario laboral"
      ) {
        throw new Error(`${error.response.data.message}. ${error.response.data.horario}`)
      }
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      await api.post(`/auth/register`, {
        name,
        email,
        password,
      })

      // After registration, log the user in
      await login(email, password)
    } catch (error: any) {
      throw error
    }
  }

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem("token")
    localStorage.removeItem("user")

    // Clear state
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
