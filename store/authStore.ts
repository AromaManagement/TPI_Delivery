import { create } from "zustand";
import { Usuario } from "../models";

interface AuthState {
  token: string | null;
  user: Usuario | null;
  isAuthenticated: boolean;
  setSession: (token: string, user: Usuario) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  setSession: (token, user) =>
    set({
      token,
      user,
      isAuthenticated: true,
    }),
  clearSession: () =>
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    }),
}));
