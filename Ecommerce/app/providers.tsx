'use client'

import { ThemeProvider } from "@/contexts/ThemeContext"
import { StyledComponentsRegistry } from "./registry"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StyledComponentsRegistry>
      <ThemeProvider>
        {children}
        <ToastContainer position="bottom-right" theme="colored" />
      </ThemeProvider>
    </StyledComponentsRegistry>
  )
}

