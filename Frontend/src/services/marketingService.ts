import api from '../lib/api';

// Interfaces para Banner - Ajustado según el backend
export interface Banner {
  id_banner?: number;
  imagen_url: string | null;
  whatsapp: string | null;
  creado_en?: string;
  actualizado_en?: string;
}

export interface BannerFormData {
  imagen?: File;
  whatsapp?: string;
}

// Interfaces para Tarjetas - Ajustado según el backend
export interface Tarjeta {
  id_tarjeta: number;
  titulo: string;
  descripcion: string | null;
  imagen_url: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface TarjetaFormData {
  titulo: string;
  descripcion?: string;
  imagen?: File;
}

// ==== FUNCIONES PARA BANNER ====

export const getBanner = async (): Promise<Banner> => {
  try {
    const { data } = await api.get(`/marketing/banner`);
    return data;
  } catch (error: any) {
    // Si es un error 404, significa que no hay banner disponible
    if (error.response?.status === 404) {
      return {} as Banner;
    }
    throw error;
  }
};

export const updateBanner = async (data: BannerFormData): Promise<Banner> => {
  try {
    if (!data.imagen) {
      throw new Error("Se requiere una imagen para actualizar el banner");
    }

    const formData = new FormData();
    formData.append('imagen_banner', data.imagen);
    if (data.whatsapp !== undefined) {
      formData.append('whatsapp', data.whatsapp);
    }
    
    const { data: responseData } = await api.put(`/marketing/banner`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return responseData.banner || responseData;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("No tienes permiso para realizar esta acción en este momento");
    }
    throw error;
  }
};

export const updateBannerWhatsapp = async (whatsapp: string): Promise<Banner> => {
  try {
    const { data } = await api.patch(`/marketing/banner/whatsapp`, { whatsapp });
    return data.banner || data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("No tienes permiso para realizar esta acción en este momento");
    }
    throw error;
  }
};

export const deleteBannerImage = async (): Promise<Banner> => {
  try {
    const { data } = await api.delete(`/marketing/banner/imagen`);
    return data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("No tienes permiso para realizar esta acción en este momento");
    }
    throw error;
  }
};

export const deleteBannerWhatsapp = async (): Promise<Banner> => {
  try {
    const { data } = await api.delete(`/marketing/banner/whatsapp`);
    return data.banner || data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("No tienes permiso para realizar esta acción en este momento");
    }
    throw error;
  }
};

// ==== FUNCIONES PARA TARJETAS ====

export const getTarjetas = async (): Promise<Tarjeta[]> => {
  try {
    const { data } = await api.get(`/marketing/tarjetas`);
    // Asegura que siempre se retorne un array
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    throw error;
  }
};

export const getTarjetaById = async (id: number): Promise<Tarjeta> => {
  try {
    // Validar que el ID sea un número válido
    if (id === undefined || id === null || isNaN(Number(id))) {
      throw new Error("ID de tarjeta no válido");
    }

    const { data } = await api.get(`/marketing/tarjetas/${id}`);
    return data;
  } catch (error: any) {
    throw error;
  }
};

export const createTarjeta = async (data: TarjetaFormData): Promise<Tarjeta> => {
  try {
    if (data.imagen) {
      const formData = new FormData();
      formData.append('titulo', data.titulo);
      if (data.descripcion) formData.append('descripcion', data.descripcion);
      formData.append('imagen_tarjeta', data.imagen);
      
      const { data: responseData } = await api.post(`/marketing/tarjetas`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return responseData.tarjeta || responseData;
    } else {
      const { data: responseData } = await api.post(`/marketing/tarjetas`, {
        titulo: data.titulo,
        descripcion: data.descripcion
      });
      return responseData.tarjeta || responseData;
    }
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("No tienes permiso para realizar esta acción en este momento");
    }
    throw error;
  }
};

export const updateTarjeta = async (id: number, data: TarjetaFormData): Promise<Tarjeta> => {
  try {
    // Validar que el ID sea un número válido
    if (id === undefined || id === null || isNaN(Number(id))) {
      throw new Error("ID de tarjeta no válido");
    }

    if (data.imagen) {
      const formData = new FormData();
      formData.append('titulo', data.titulo);
      if (data.descripcion) formData.append('descripcion', data.descripcion);
      formData.append('imagen_tarjeta', data.imagen);
      
      const { data: responseData } = await api.put(`/marketing/tarjetas/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return responseData.tarjeta || responseData;
    } else {
      const { data: responseData } = await api.put(`/marketing/tarjetas/${id}`, {
        titulo: data.titulo,
        descripcion: data.descripcion
      });
      return responseData.tarjeta || responseData;
    }
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("No tienes permiso para realizar esta acción en este momento");
    }
    throw error;
  }
};

export const deleteTarjetaImage = async (id: number): Promise<Tarjeta> => {
  try {
    // Validar que el ID sea un número válido
    if (id === undefined || id === null || isNaN(Number(id))) {
      throw new Error("ID de tarjeta no válido");
    }

    const { data } = await api.delete(`/marketing/tarjetas/${id}/imagen`);
    return data.tarjeta || data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("No tienes permiso para realizar esta acción en este momento");
    }
    throw error;
  }
};

export const deleteTarjeta = async (id: number): Promise<void> => {
  try {
    // Validar que el ID sea un número válido
    if (id === undefined || id === null || isNaN(Number(id))) {
      throw new Error("ID de tarjeta no válido");
    }

    await api.delete(`/marketing/tarjetas/${id}`);
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("No tienes permiso para realizar esta acción en este momento");
    }
    throw error;
  }
};

// ==== FUNCIONES PARA MULTIPLES BANNERS (CARRUSEL) ====

export const getBanners = async (): Promise<Banner[]> => {
  try {
    const { data } = await api.get(`/marketing/banners`);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    throw error;
  }
};

export const getBannerById = async (id: number): Promise<Banner> => {
  try {
    const { data } = await api.get(`/marketing/banners/${id}`);
    return data;
  } catch (error: any) {
    throw error;
  }
};

export const createBannerCarrusel = async (data: BannerFormData): Promise<Banner> => {
  try {
    if (!data.imagen) {
      throw new Error("Se requiere una imagen para crear el banner");
    }
    const formData = new FormData();
    formData.append('imagen_banner', data.imagen);
    if (data.whatsapp !== undefined) {
      formData.append('whatsapp', data.whatsapp);
    }
    const { data: responseData } = await api.post(`/marketing/banners`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return responseData.banner || responseData;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("No tienes permiso para realizar esta acción en este momento");
    }
    throw error;
  }
};

export const updateBannerCarrusel = async (id: number, data: BannerFormData): Promise<Banner> => {
  try {
    if (!data.imagen) {
      throw new Error("Se requiere una imagen para actualizar el banner");
    }
    const formData = new FormData();
    formData.append('imagen_banner', data.imagen);
    if (data.whatsapp !== undefined) {
      formData.append('whatsapp', data.whatsapp);
    }
    const { data: responseData } = await api.put(`/marketing/banners/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return responseData.banner || responseData;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("No tienes permiso para realizar esta acción en este momento");
    }
    throw error;
  }
};

export const deleteBannerCarrusel = async (id: number): Promise<void> => {
  try {
    await api.delete(`/marketing/banners/${id}`);
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error("No tienes permiso para realizar esta acción en este momento");
    }
    throw error;
  }
};
