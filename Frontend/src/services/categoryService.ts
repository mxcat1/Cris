import api from "../lib/api"

export interface Category {
  id_categoria: number
  nombre: string
  descripcion: string | null
  imagen_url?: string | null
  creado_en: string
  actualizado_en: string
  productos?: any[]
}

export interface CategoryFormData {
  nombre: string
  descripcion?: string
}

// Modificar la función fetchCategories para manejar silenciosamente los errores 403
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await api.get(`/categorias`)
    return response.data
  } catch (error: any) {
    throw error
  }
}

export const fetchCategoryById = async (id: number): Promise<Category> => {
  // Validar que el ID sea un número válido
  if (id === undefined || id === null || isNaN(Number(id))) {
    throw new Error("ID de categoría no válido")
  }

  const response = await api.get(`/categorias/${id}`)
  return response.data
}

export const fetchCategoryByBarcode = async (barcode: string): Promise<Category> => {
  // Validar que el código de barras no esté vacío
  if (!barcode || barcode.trim() === "") {
    throw new Error("Código de barras no válido")
  }

  const response = await api.get(`/categorias/barcode/${barcode}`)
  return response.data
}

export const createCategory = async (data: CategoryFormData): Promise<Category> => {
  const response = await api.post(`/categorias`, data)
  return response.data.categoria
}

export const updateCategory = async (id: number, data: CategoryFormData): Promise<Category> => {
  // Validar que el ID sea un número válido
  if (id === undefined || id === null || isNaN(Number(id))) {
    throw new Error("ID de categoría no válido")
  }

  const response = await api.put(`/categorias/${id}`, data)
  return response.data.categoria
}

// Modificar la función deleteCategory para manejar silenciosamente los errores 403
export const deleteCategory = async (id: number): Promise<void> => {
  try {
    // Validar que el ID sea un número válido
    if (id === undefined || id === null || isNaN(Number(id))) {
      throw new Error("ID de categoría no válido")
    }

    await api.delete(`/categorias/${id}`)
  } catch (error: any) {
    // Si es un error 403, manejamos silenciosamente
    if (error.response?.status === 403) {
      throw new Error("No tienes permiso para realizar esta acción en este momento")
    }
    // Para otros errores, los propagamos normalmente
    throw error
  }
}

export const createCategoryWithImage = async (formData: FormData): Promise<Category> => {
  const response = await api.post(`/categorias`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.categoria;
}

export const updateCategoryWithImage = async (id: number, formData: FormData): Promise<Category> => {
  // Validar que el ID sea un número válido
  if (id === undefined || id === null || isNaN(Number(id))) {
    throw new Error("ID de categoría no válido");
  }

  const response = await api.put(`/categorias/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.categoria;
}

export const deleteCategoryImage = async (id: number): Promise<Category> => {
  // Validar que el ID sea un número válido
  if (id === undefined || id === null || isNaN(Number(id))) {
    throw new Error("ID de categoría no válido");
  }

  const response = await api.delete(`/categorias/${id}/imagen`);
  return response.data.categoria;
}
