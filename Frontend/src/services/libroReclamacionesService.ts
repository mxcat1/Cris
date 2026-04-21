import api from '../lib/api';

export const getReclamaciones = async () => {
  const { data } = await api.get("/libro-reclamaciones");
  return data;
};

export const updateEstadoReclamacion = async (id: number, estado: string) => {
  const { data } = await api.put(`/libro-reclamaciones/${id}`, { estado });
  return data;
};

export default {
  getReclamaciones,
  updateEstadoReclamacion,
};
