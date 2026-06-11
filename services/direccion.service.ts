import { api } from "./api";
import { Direccion, Localidad, CreateDireccionInput } from "../models";

export const direccionService = {
  getLocalidades: async (): Promise<Localidad[]> => {
    return await api.get<Localidad[]>("/localidades");
  },

  crearDireccion: async (data: CreateDireccionInput): Promise<Direccion> => {
    return await api.post<Direccion>("/direcciones", data);
  },

  getDireccion: async (direccionId: number): Promise<Direccion> => {
    return await api.get<Direccion>(`/direcciones/${direccionId}`);
  },
};
