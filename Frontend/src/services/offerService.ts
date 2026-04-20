import api from "../lib/api"

// Interfaces
export interface Offer {
  id_oferta?: number
  id_producto: number
  descuento: number
}

// Obtener todas las ofertas
export const fetchOffers = async (): Promise<Offer[]> => {
  try {
    const response = await api.get("/ofertas-del-dia")
    return response.data
  } catch (error: any) {
    throw error
  }
}

// Crear o actualizar una oferta
export const createOrUpdateOffer = async (offerData: Offer | Offer[]): Promise<any> => {
  const response = await api.put("/ofertas-del-dia", offerData)
  return response.data
}

// Eliminar una oferta
export const deleteOffer = async (productId: number): Promise<any> => {
  const response = await api.delete(`/ofertas-del-dia/${productId}`)
  return response.data
}
