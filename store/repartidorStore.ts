import { create } from "zustand";
import { Comanda } from "../models";

interface RepartidorState {
  pedidoActivo: Comanda | null;
  setPedidoActivo: (comanda: Comanda | null) => void;
}

export const useRepartidorStore = create<RepartidorState>((set) => ({
  pedidoActivo: null,
  setPedidoActivo: (comanda) => set({ pedidoActivo: comanda }),
}));
