import { api } from "./api";
import { Comanda } from "../models";

export const repartidorService = {
  getPedidosDisponibles: async (): Promise<Comanda[]> => {
    const data = await api.get<Comanda[]>("/comandas/estado/LISTO");
    return data.filter((p) => !p.repartidor);
  },

  getMiEntregaActiva: async (repartidorId: number): Promise<Comanda | null> => {
    const data = await api.get<Comanda[]>("/comandas/estado/EN_CAMINO");
    return data.find((c) => c.repartidor?.id === repartidorId) ?? null;
  },

  getHistorial: async (repartidorId: number): Promise<Comanda[]> => {
    const data = await api.get<Comanda[]>("/comandas/estado/ENTREGADO");
    return data.filter((c) => c.repartidor?.id === repartidorId);
  },

  tomarPedido: async (comandaId: number, repartidorId: number): Promise<Comanda> => {
    return api.post<Comanda>("/comandas/assign-repartidor", { comandaId, repartidorId });
  },

  actualizarEstado: async (comandaId: number, estado: string): Promise<Comanda> => {
    return api.patch<Comanda>(`/comandas/${comandaId}/estado`, { nuevoEstado: estado });
  },
};
