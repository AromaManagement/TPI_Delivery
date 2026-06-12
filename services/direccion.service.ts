import { api } from "./api";
import { Direccion, CreateDireccionInput } from "../models";

export const direccionService = {
  crearDireccion: async (data: CreateDireccionInput): Promise<Direccion> => {
    return await api.post<Direccion>("/direcciones", data);
  },

  getDireccion: async (direccionId: number): Promise<Direccion> => {
    return await api.get<Direccion>(`/direcciones/${direccionId}`);
  },
};
