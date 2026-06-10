import { create } from "zustand";
import { Usuario } from "../models";

interface AuthState {
  token: string | null;
  user: Usuario | null;
  isAuthenticated: boolean;
  setSession: (token: string, user: Usuario) => void;
  clearSession: () => void;
}

const STORAGE_KEY = "auth-storage";

function loadPersistedAuth(): { token: string | null; user: Usuario | null; isAuthenticated: boolean } {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.token && parsed.user) {
          return { token: parsed.token, user: parsed.user, isAuthenticated: true };
        }
      }
    }
  } catch {}
  return { token: null, user: null, isAuthenticated: false };
}

export const useAuthStore = create<AuthState>((set) => ({
  ...loadPersistedAuth(),
  setSession: (token, user) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
      }
    } catch {}
    set({ token, user, isAuthenticated: true });
  },
  clearSession: () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
