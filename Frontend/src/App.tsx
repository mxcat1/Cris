"use client"

import type React from "react"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "./components/theme-provider"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { KeyboardShortcutsProvider } from "./contexts/KeyboardShortcutsContext"
import { KeyboardShortcutsModal } from "./components/keyboard-shortcuts-modal"

// Layouts
import DashboardLayout from "./layouts/DashboardLayout"

// Components
import RoleProtectedRoute from "./components/RoleProtectedRoute"

// Pages
import LoginPage from "./pages/auth/LoginPage"
import DashboardPage from "./pages/dashboard/DashboardPage"
import CategoriesPage from "./pages/categories/CategoriesPage"
import CategoryDetailPage from "./pages/categories/CategoryDetailPage"
import ProductDetailPage from "./pages/products/ProductDetailPage"
import SalesPage from "./pages/sales/SalesPage"
import SaleDetailPage from "./pages/sales/SaleDetailPage"
import NewSalePage from "./pages/sales/NewSalePage"
import CompanyPage from "./pages/company/CompanyPage"
import NotFoundPage from "./pages/NotFoundPage"
// Importar la nueva página de usuarios
import UsersPage from "./pages/users/UsersPage"
// Importar la página de Caja Diaria
import DailyCashPage from "./pages/cash-register/DailyCashPage"
// Importar la nueva página de AuditLogs
import AuditLogsPage from "./pages/audit-logs/AuditLogsPage"
import ProductsPage from "./pages/products/ProductsPage"
// Añadir la importación de la página de ofertas
import OffersPage from "./pages/offers/OffersPage"
// Importar la página de generación de tickets PDF
import ProductTicketsPDFPage from "./pages/generate-ticket-pdf/GenerateCardProductPage"
import GenerateExcelProductsPage from "./pages/generate-ticket-pdf/GenerateExcelProductsPage"
// Importar la página de Marketing
import MarketingPage from "./pages/marketing/MarketingPage"

import LibroReclamacionesPage from "./pages/libro-reclamaciones/LibroReclamacionesPage";
import SolicitudesImportacionPage from "./pages/solicitudes-importacion/SolicitudesImportacionPage";
import { features } from "./config/features"
// Importar estilos personalizados

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <KeyboardShortcutsProvider>
              <Routes>
                {/* Auth routes */}
                <Route path="/login" element={<LoginPage />} />

                {/* Dashboard routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />                  
                  <Route
                    path="categories"
                    element={
                      <RoleProtectedRoute allowedRoles={[1, 2, 3]} requiresBusinessHours={true}>
                        <CategoriesPage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="categories/:id"
                    element={
                      <RoleProtectedRoute allowedRoles={[1, 2, 3]} requiresBusinessHours={true}>
                        <CategoryDetailPage />
                      </RoleProtectedRoute>
                    }
                  />
                  {/* <Route path="categories/:id/barcode" element={<BarcodeViewPage />} /> */}                  
                  <Route
                    path="products"
                    element={
                      <RoleProtectedRoute allowedRoles={[1, 2, 3]} requiresBusinessHours={true}>
                        <ProductsPage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="products/:id"
                    element={
                      <RoleProtectedRoute allowedRoles={[1, 2, 3]} requiresBusinessHours={true}>
                        <ProductDetailPage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="sales"
                    element={
                      <RoleProtectedRoute allowedRoles={[1, 2, 3]}>
                        <SalesPage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="sales/new"
                    element={
                      <RoleProtectedRoute allowedRoles={[1, 2, 3]} requiresBusinessHours={true}>
                        <NewSalePage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="sales/:id"
                    element={
                      <RoleProtectedRoute allowedRoles={[1, 2, 3]}>
                        <SaleDetailPage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="company"
                    element={
                      <RoleProtectedRoute allowedRoles={[1]}>
                        <CompanyPage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="users"
                    element={
                      <RoleProtectedRoute allowedRoles={[1]}>
                        <UsersPage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="cash-register"
                    element={
                      <RoleProtectedRoute allowedRoles={[1, 2]}>
                        <DailyCashPage />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="audit-logs"
                    element={
                      <RoleProtectedRoute allowedRoles={[1]}>
                        <AuditLogsPage />
                      </RoleProtectedRoute>
                    }
                  />
                  {/* Añadir la ruta para la página de ofertas dentro de las rutas del dashboard */}
                  <Route
                    path="offers"
                    element={
                      <RoleProtectedRoute allowedRoles={[1, 2]}>
                        <OffersPage />
                      </RoleProtectedRoute>
                    }
                  />
                  {/* Ruta de marketing — controlada por feature flag */}
                  {features.marketing && (
                    <Route
                      path="marketing"
                      element={
                        <RoleProtectedRoute allowedRoles={[1, 2]}>
                          <MarketingPage />
                        </RoleProtectedRoute>
                      }
                    />
                  )}
                  {/* Ruta para generación de tickets PDF */}
                  <Route
                    path="generate-ticket-pdf"
                    element={
                      <RoleProtectedRoute allowedRoles={[1, 2]}>
                        <ProductTicketsPDFPage />
                      </RoleProtectedRoute>
                    }
                  />
                {/* Ruta para generación de Excel de productos */}
                <Route
                  path="generate-excel-products"
                  element={
                    <RoleProtectedRoute allowedRoles={[1, 2]}>
                      <GenerateExcelProductsPage />
                    </RoleProtectedRoute>
                  }
                />
                  {/* Ruta para libro de reclamaciones — controlada por feature flag */}
                  {features.libroReclamaciones && (
                    <Route
                      path="libro-reclamaciones"
                      element={
                        <RoleProtectedRoute allowedRoles={[1, 2]}>
                          <LibroReclamacionesPage />
                        </RoleProtectedRoute>
                      }
                    />
                  )}
                  {/* Admin UI de solicitudes de importación (hot-patch B) — FEATURE_ECOMMERCE */}
                  {features.ecommerce && (
                    <Route
                      path="solicitudes-importacion"
                      element={
                        <RoleProtectedRoute allowedRoles={[1, 2]}>
                          <SolicitudesImportacionPage />
                        </RoleProtectedRoute>
                      }
                    />
                  )}
                </Route>

                {/* 404 route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <KeyboardShortcutsModal />
            </KeyboardShortcutsProvider>
          </Router>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App