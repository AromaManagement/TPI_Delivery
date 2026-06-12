import { Comanda } from "../models";
import { api } from "./api";

export const comandaService = {
  getHistorial: async (): Promise<Comanda[]> => {
    try {
      return await api.get<Comanda[]>("/comandas/historial");
    } catch {
      return [];
    }
  },

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
    } catch (error: any) {
      console.error("Error creating order:", error);
      throw new Error(error?.message || "No se pudo crear el pedido. Intentá de nuevo.");
    }
  },
};

export const cancelarComanda = async (comandaId: number): Promise<void> => {
  try {
    return await api.post(`/comandas/${comandaId}/cancelar`);
  } catch (error) {
    console.error("Error canceling order:", error);
    throw new Error("Failed to cancel order. Please try again later.");
  }
};
