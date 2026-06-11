import { api } from "./api";
import { Carta, Seccion } from "../models";

export const cartaService = {
  getCarta: async (): Promise<Carta> => {
    const secciones = await api.get<Seccion[]>("/carta/disponibles");
    return { id: 1, secciones };
  },
};
