import api from "../lib/api"

export interface Company {
  id_company: number
  razon_social: string
  ruc: string
  direccion: string
  logo_url: string | null
  sol_user: string
  sol_pass: string
  cert_path: string
  client_id: string | null
  client_secret: string | null
  production: boolean
  id_user: number
  creado_en: string
  actualizado_en: string
}

export const fetchCompany = async (): Promise<Company | null> => {
  try {
    const response = await api.get(`/companies`)
    // If there are multiple companies, return the first one
    return response.data.length > 0 ? response.data[0] : null
  } catch (error) {
    console.error("Error fetching company:", error)
    return null
  }
}

export const fetchCompanyByRuc = async (ruc: string): Promise<Company> => {
  const response = await api.get(`/companies/${ruc}`)
  return response.data.data
}

export const createCompany = async (formData: FormData): Promise<Company> => {
  const response = await api.post(`/companies`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
  return response.data.company
}

export const updateCompany = async (id: number, formData: FormData): Promise<Company> => {
  const response = await api.put(`/companies/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
  return response.data.company
}

export const deleteCompany = async (ruc: string): Promise<void> => {
  await api.delete(`/companies/${ruc}`)
}

export const fetchCompanyForSales = async (): Promise<Company | null> => {
  try {
    // Primero intentamos obtener las empresas del usuario actual (para administradores)
    const response = await api.get('/companies');

    if (response.data && response.data.length > 0) {
      return response.data[0]; // Usar la primera empresa encontrada
    }

    // Si no hay empresas para el usuario actual o no es admin, usar la ruta especial
    const fallbackResponse = await api.get('/companies/for-sales');
    if (fallbackResponse.data && fallbackResponse.data.data) {
      return fallbackResponse.data.data;
    }

    // Empresa no configurada — estado de dominio válido (D5 Opción C)
    return null;
  } catch (error) {
    console.error('Error al obtener empresa para ventas:', error);
    throw error;
  }
};