import { create } from "zustand";
import { Plato } from "../models";

export interface CartItem {
  plato: Plato;
  cantidad: number;
}

interface CartState {
  items: CartItem[];
  addItem: (plato: Plato, cantidad?: number) => void;
  removeItem: (platoId: number) => void;
  updateQuantity: (platoId: number, cantidad: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  addItem: (plato, cantidad = 1) => {
    const currentItems = get().items;
    const existingItem = currentItems.find((item) => item.plato.id === plato.id);
    
    if (existingItem) {
      set({
        items: currentItems.map((item) =>
          item.plato.id === plato.id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        ),
      });
    } else {
      set({ items: [...currentItems, { plato, cantidad }] });
    }
  },

  removeItem: (platoId) => {
    set({ items: get().items.filter((item) => item.plato.id !== platoId) });
  },

  updateQuantity: (platoId, cantidad) => {
    if (cantidad <= 0) {
      get().removeItem(platoId);
      return;
    }
    set({
      items: get().items.map((item) =>
        item.plato.id === platoId ? { ...item, cantidad } : item
      ),
    });
  },

  clearCart: () => set({ items: [] }),

  getTotal: () => {
    return get().items.reduce(
      (total, item) => total + item.plato.precio * item.cantidad,
      0
    );
  },
}));
