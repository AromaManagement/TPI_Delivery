import { api } from "./api";
import { Carta } from "../models";

export const cartaService = {
  getCarta: async (): Promise<Carta> => {
    return api.get<Carta>("/carta/disponibles");
  },
};
