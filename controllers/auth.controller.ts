import { authService, LoginInput } from "../services/auth.service";
import { useAuthStore } from "../store/authStore";
import { resetSimulation } from "../services/comanda.service";
import { Usuario } from "../models";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export const authController = {
  loginAction: async (input: LoginInput): Promise<ActionResult> => {
    // Basic validation
    if (!input.correo || !input.correo.includes("@")) {
      return {
        ok: false,
        error: "Por favor, ingrese un correo electrónico válido.",
      };
    }

    if (!input.contrasena || input.contrasena.length < 6) {
      return {
        ok: false,
        error: "La contraseña debe tener al menos 6 caracteres.",
      };
    }

    try {
      const { token, user } = await authService.login(input);
      
      // Ensure only CLIENTE can access the delivery app (as per requirements)
      if (user.rol !== "CLIENTE") {
        return {
          ok: false,
          error: "Acceso denegado. Esta aplicación es exclusiva para clientes.",
        };
      }

      // Update the state store
      useAuthStore.getState().setSession(token, user);
      
      // Reset order tracking simulation upon new login
      resetSimulation();

      return { ok: true };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || "Error al iniciar sesión. Inténtelo de nuevo.",
      };
    }
  },

  updateUserAction: async (updatedFields: Partial<Usuario>): Promise<ActionResult> => {
    const store = useAuthStore.getState();
    if (!store.user) {
      return { ok: false, error: "No hay una sesión activa." };
    }

    try {
      const updatedUser = { ...store.user, ...updatedFields };
      // Update store
      store.setSession(store.token || "", updatedUser);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message || "Error al actualizar el perfil." };
    }
  },

  logoutAction: async (): Promise<void> => {
    useAuthStore.getState().clearSession();
  },
};
