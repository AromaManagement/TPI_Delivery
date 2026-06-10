import { Comanda } from "../models";
import { api } from "./api";

export const comandaService = {
  // Check if there is an active order
  getActiveOrder: async (): Promise<Comanda | null> => {
    try {
      return await api.get<Comanda | null>(`/comandas/active`);
    } catch (error) {
      // Silently return null — the caller (_layout) handles this gracefully
      return null;
    }
  },

  // Create/Place a new order
  crearComanda: async (
    clienteId: number,
    items: { plato: any; cantidad: number }[],
    metodoPago: string,
  ): Promise<Comanda> => {
    try {
      const body = {
        clienteId,
        detalles: items.map((i) => ({
          platoId: i.plato.id,
          cantidad: i.cantidad,
        })),
        metodoPago: metodoPago,
      };
      return await api.post<Comanda>("/comandas", body);
    } catch (error) {
      console.error("Error creating order:", error);
      throw new Error("Failed to create order. Please try again later.");
    }
  },
};
